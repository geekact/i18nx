import { I18nMessage } from './i18n-message';
import { Topic } from 'topic';

const EVENT_LANGUAGE_CHANGED = 'language-changed';

export namespace CoreI18n {
  export type KeyToMessage<
    Locale extends object,
    K extends string,
  > = K extends `${infer A}.${infer B}`
    ? A extends keyof Locale
      ? Locale[A] extends object
        ? KeyToMessage<Locale[A], B>
        : never
      : never
    : K extends keyof Locale
      ? Locale[K] extends string
        ? Locale[K]
        : Locale[K] extends I18nMessage<infer R>
          ? R
          : never
      : never;

  export type SearchParamNames<Message extends string> =
    Message extends `${string}{{${infer Parameter}}}${infer Suffix}`
      ? Parameter | SearchParamNames<Suffix>
      : never;

  export type SearchKey<Locales extends object> = {
    [K in keyof Locales]: K extends string
      ? Locales[K] extends string
        ? K
        : Locales[K] extends I18nMessage<string>
          ? K
          : Locales[K] extends object
            ? `${K}.${SearchKey<Locales[K]>}`
            : never
      : never;
  }[keyof Locales];

  export type Infer<Locale extends object> = {
    [K in keyof Locale]?: Locale[K] extends string
      ? string | I18nMessage<string>
      : Locale[K] extends I18nMessage<string>
        ? string | I18nMessage<string>
        : Locale[K] extends object
          ? Infer<Locale[K]>
          : never;
  };

  export type Compare<
    Current extends object,
    Default extends object,
    ParentKey extends string = '',
  > = {
    [K in keyof Default]: K extends string
      ? K extends keyof Current
        ? Default[K] extends string
          ? never
          : Default[K] extends I18nMessage<any>
            ? never
            : Default[K] extends object
              ? Current[K] extends object
                ? Compare<Current[K], Default[K], `${ParentKey}${K}.`>
                : never
              : never
        : Default[K] extends string
          ? `${ParentKey}${K}`
          : Default[K] extends I18nMessage<any>
            ? `${ParentKey}${K}`
            : Default[K] extends object
              ? `${ParentKey}${K}.${SearchKey<Default[K]>}`
              : never
      : never;
  }[keyof Default];

  export interface I18nOptions<
    Locales extends Record<string, object | (() => Promise<object>)>,
    Languages extends string & keyof Locales,
    DefaultLanguage,
  > {
    /**
     * 不同地区的翻译列表。建议每个地区都建一个独立的文件，然后引入
     * ```typescript
     * {
     *   'zh-CN': <const>{ welcome: '你好 {{user}}', menus: { users: '用户列表' } },
     *   'en-US': <const>{ welcome: 'Hello {{user}}', menus: { users: 'User List' } },
     * }
     * ```
     */
    locales: Locales;
    /**
     * 默认语言。注意：该语言的翻译列表必须立即引入，不能使用异步回调函数
     */
    defaultLanguage: DefaultLanguage;
    /**
     * 语言映射，把不规范的语言名称映射到翻译列表对应的语言
     * ```typescript
     * {
     *   'zh'  : 'zh-CN',
     *   'zh-*': 'zh-CN',
     *   'en'  : 'en-US',
     * }
     * ```
     */
    languageAlias?: Record<string, Languages>;
  }
}

export class CoreI18n<
  Locales extends Record<string, object | (() => Promise<object>)>,
  Languages extends string & keyof Locales,
  DefaultLanguage extends Languages,
> {
  readonly t: this['translate'];

  protected readonly _locales: Locales;
  protected readonly _languages: Languages[];
  protected readonly _fallbackLanguage: Languages;
  protected readonly _languageAlias: Record<string, Languages>;
  protected _currentLanguage: Languages;
  protected _topic = new Topic();

  constructor(opts: CoreI18n.I18nOptions<Locales, Languages, DefaultLanguage>) {
    this._locales = opts.locales;
    this._languages = Object.keys(opts.locales) as Languages[];
    this._fallbackLanguage = this._currentLanguage = opts.defaultLanguage;
    this._languageAlias = opts.languageAlias || {};
    this.t = this.translate.bind(this);
  }

  /**
   * 定义翻译源
   * ```typescript
   * export const zh = I18n.define({
   *   hello: '你好'
   * })
   * ```
   */
  static define<const Locale extends object>(locale: Locale): Locale {
    return locale;
  }

  /**
   * 新的翻译源的字段需与翻译源模板对齐。新的翻译可以少写字段，但不能错写（静态类型报错）
   * ```typescript
   * export const en = I18n.satisfies(zh).define({
   *   hello: 'Hello'
   * })
   * ```
   */
  static satisfies<DefaultLocale extends object>(_defaultLocale: DefaultLocale) {
    return {
      define<const Locale extends CoreI18n.Infer<DefaultLocale>>(locale: Locale): Locale {
        return locale;
      },
    };
  }

  static message<const Message extends string>(
    msg: Message,
    format?: {
      [K in CoreI18n.SearchParamNames<Message>]?:
        | I18nMessage.FormatType
        | I18nMessage.FormatType[];
    },
  ): I18nMessage<Message> {
    return new I18nMessage(msg, format || {});
  }

  /**
   * 可用语言列表
   */
  get languages() {
    return [...this._languages];
  }

  /**
   * 当前正在使用的语言
   */
  get language() {
    return this._currentLanguage;
  }

  get missingKeys(): {
    [K in keyof Locales as K extends DefaultLanguage ? never : K]: string &
      CoreI18n.Compare<
        Locales[K] extends () => Promise<infer R extends object> ? R : Locales[K],
        Locales[DefaultLanguage],
        ''
      >;
  } {
    return '' as any;
  }

  /**
   * 设置语言，如果语言不存在，则回退到默认语言
   */
  async setLanguage(language: Languages | (string & {})) {
    const lng = this.fixLanguage(language) || this._fallbackLanguage;

    const source = this._locales[lng]!;
    if (typeof source === 'function') {
      this._locales[lng] = await source();
    }
    if (this._currentLanguage !== lng) {
      this._currentLanguage = lng;
      this._topic.publish(EVENT_LANGUAGE_CHANGED, this._currentLanguage);
    }
  }

  /**
   * 语言切换成功事件
   */
  on(
    event: typeof EVENT_LANGUAGE_CHANGED,
    fn: (language: Languages) => void,
  ): { off: () => void };
  on(event: string, fn: (...args: any[]) => void) {
    const token = this._topic.subscribe(event, fn);
    return {
      off: () => token.unsubscribe(),
    };
  }

  /**
   * 原样返回传入的key。这个方法的意义是通过TS类型检测保证key是正确的。
   */
  key<Key extends CoreI18n.SearchKey<Locales[DefaultLanguage]>>(key: Key): Key {
    return key;
  }

  /**
   * 获取翻译内容，寻找嵌套结构的内容时，使用`.`连接属性。
   * ```typescript
   * {
   *   welcome: 'hello {{world}}',
   *   menu: {
   *     users: 'User list',
   *   }
   * };
   *
   * i18n.t('welcome', { world: '树先生！' });
   * i18n.t('menu.users');
   * ```
   */
  translate<Key extends CoreI18n.SearchKey<Locales[DefaultLanguage]>>(
    key: Key,
    ...rest: CoreI18n.SearchParamNames<
      CoreI18n.KeyToMessage<Locales[DefaultLanguage], Key>
    > extends never
      ? []
      : [
          params: {
            [S in CoreI18n.SearchParamNames<
              CoreI18n.KeyToMessage<Locales[DefaultLanguage], Key>
            >]: any;
          },
        ]
  ): string & {
    [K in keyof Locales]: CoreI18n.KeyToMessage<
      Locales[K] extends () => Promise<infer R extends object> ? R : Locales[K],
      Key
    >;
  };
  translate(key: string, params: Record<string, any> = {}) {
    const keys = key.split('.');
    let lng = this.language;
    let message = this.getMessageByLanguage(keys, lng);

    if (message === void 0 && lng !== this._fallbackLanguage) {
      lng = this._fallbackLanguage;
      message = this.getMessageByLanguage(keys, lng);
    }

    if (message === void 0) return key;

    if (typeof message === 'string') {
      return this.replaceToken(message, params);
    }

    params = { ...params };
    Object.keys(params).forEach((key) => {
      params[key] = this.formatTokenValue(params[key], message.formats[key] || [], lng);
    });
    return this.replaceToken(message.message, params);
  }

  /**
   * 对传入的变量值进行管道式格式化
   */
  protected formatTokenValue(
    value: any,
    formatters: I18nMessage.FormatType[],
    language: string,
  ) {
    for (const formatter of formatters) {
      switchLabel: switch (formatter.type) {
        case 'number':
          value = Intl.NumberFormat(language, formatter).format(value);
          break;
        case 'custom':
          value = formatter.format(value, language);
          break;
        case 'plural':
          if (Object.hasOwn(formatter.plural, value)) {
            value = formatter.plural[value];
            break switchLabel;
          }

          const digit = Number(value);
          if (Number.isFinite(digit)) {
            // 使用数字规则匹配
            for (const key of Object.keys(formatter.plural)) {
              const matched = key.match(/^(\d+)-(\d+)$/);
              if (matched) {
                const lower = Number(matched[1]);
                const higher = Number(matched[2]);
                if (digit >= lower && digit <= higher) {
                  value = formatter.plural[key];
                  break switchLabel;
                }
              }
            }
            if (Object.hasOwn(formatter.plural, 'n')) {
              value = formatter.plural['n'];
              break switchLabel;
            }
          }
          break;
        case 'date-time':
          value = Intl.DateTimeFormat(language, formatter).format(value);
          break;
        default:
          const _: never = formatter;
          console.log(_);
      }
    }
    return value;
  }

  /**
   * 替换翻译内的动态变量
   */
  protected replaceToken(message: string, variables: Record<string, any>) {
    for (let [key, value] of Object.entries(variables)) {
      message = message.replaceAll(`{{${key}}}`, String(value));
    }
    return message;
  }

  /**
   * 根据语言获取对应的翻译
   */
  protected getMessageByLanguage(keys: string[], language: string) {
    let obj = this._locales[language] as any;
    for (const key of keys) {
      if (typeof obj !== 'object') break;
      if (!Object.hasOwn(obj, key)) break;
      obj = obj[key];
    }

    if (obj == void 0) return;
    if (typeof obj === 'string' || obj instanceof I18nMessage) return obj;
    return;
  }

  protected fixLanguage(language: string | undefined): Languages | undefined {
    if (!language) return;
    const alias = this._languageAlias;
    let lng: string | undefined;

    if (this.languages.includes(language as Languages)) {
      lng = language;
    } else if (Object.hasOwn(alias, language)) {
      lng = alias[language];
    } else {
      for (const key of Object.keys(alias)) {
        if (!key.includes('*')) continue;
        if (new RegExp(`^${key.replaceAll('*', '.*')}$`, 'i').test(language)) {
          lng = alias[key];
          break;
        }
      }
    }

    return lng as Languages | undefined;
  }
}
