import { I18nMessage } from './i18n-message';
import { Topic } from 'topic';

const EVENT_LANGUAGE_CHANGED = 'language-changed';

export namespace CoreI18n {
  export type PathToMessage<
    Resource extends object,
    K extends string,
  > = K extends `${infer A}.${infer B}`
    ? A extends keyof Resource
      ? Resource[A] extends object
        ? PathToMessage<Resource[A], B>
        : never
      : never
    : K extends keyof Resource
      ? Resource[K] extends string
        ? Resource[K]
        : Resource[K] extends I18nMessage<infer R>
          ? R
          : never
      : never;

  export type SearchParamNames<Message extends string> =
    Message extends `${string}{{${infer Parameter}}}${infer Suffix}`
      ? Parameter | SearchParamNames<Suffix>
      : never;

  export type SearchPath<Resources extends object> = {
    [K in keyof Resources]: K extends string
      ? Resources[K] extends string
        ? K
        : Resources[K] extends I18nMessage<string>
          ? K
          : Resources[K] extends object
            ? `${K}.${SearchPath<Resources[K]>}`
            : never
      : never;
  }[keyof Resources];

  export type Infer<Resource extends object> = {
    [K in keyof Resource]?: Resource[K] extends string
      ? string | I18nMessage<string>
      : Resource[K] extends I18nMessage<string>
        ? string | I18nMessage<string>
        : Resource[K] extends object
          ? Infer<Resource[K]>
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
              ? `${ParentKey}${K}.${SearchPath<Default[K]>}`
              : never
      : never;
  }[keyof Default];

  export interface I18nOptions<
    Resources extends Record<string, object | (() => Promise<object>)>,
    Languages extends string & keyof Resources,
    DefaultLanguage,
  > {
    /**
     * 不同地区的翻译列表。建议每个地区都建一个独立的文件，然后引入
     * ```typescript
     * const zh = I18n.define({ welcome: '你好 {{user}}' });
     * const en = I18n.satisfies(zh).define({ welcome: 'Hello {{user}}' });
     * const i18n = new I18n({
     *   resources: {
     *     'zh-CN': zh,
     *     'en-US': en,
     *   }
     * });
     * ```
     */
    resources: Resources;
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
  Resources extends Record<string, object | (() => Promise<object>)>,
  Languages extends string & keyof Resources,
  DefaultLanguage extends Languages,
> {
  readonly t: this['translate'];

  protected readonly _resources: Resources;
  protected readonly _languages: Languages[];
  protected readonly _fallbackLanguage: Languages;
  protected readonly _languageAlias: Record<string, Languages>;
  protected _currentLanguage: Languages;
  protected _topic = new Topic();

  constructor(opts: CoreI18n.I18nOptions<Resources, Languages, DefaultLanguage>) {
    this._resources = opts.resources;
    this._languages = Object.keys(opts.resources) as Languages[];
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

  get missingPath(): {
    [K in keyof Resources as K extends DefaultLanguage ? never : K]: string &
      CoreI18n.Compare<
        Resources[K] extends () => Promise<infer R extends object> ? R : Resources[K],
        Resources[DefaultLanguage],
        ''
      >;
  } {
    return '' as any;
  }

  /**
   * 切换语言，如果语言不存在，则回退到默认语言
   */
  async changeLanguage(language: Languages | (string & {})) {
    const lng = this.fixLanguage(language) || this._fallbackLanguage;

    const source = this._resources[lng]!;
    if (typeof source === 'function') {
      this._resources[lng] = await source();
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
   * 通过TS类型检测确保路径是已定义的
   */
  pathGuard<Path extends CoreI18n.SearchPath<Resources[DefaultLanguage]>>(
    path: Path,
  ): Path {
    return path;
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
  translate<Path extends CoreI18n.SearchPath<Resources[DefaultLanguage]>>(
    path: Path,
    ...rest: CoreI18n.SearchParamNames<
      CoreI18n.PathToMessage<Resources[DefaultLanguage], Path>
    > extends never
      ? [params?: Record<string, never>, language?: Languages | (string & {})]
      : [
          params: {
            [S in CoreI18n.SearchParamNames<
              CoreI18n.PathToMessage<Resources[DefaultLanguage], Path>
            >]: any;
          },
          language?: Languages | (string & {}),
        ]
  ): string & {
    [K in keyof Resources]: CoreI18n.PathToMessage<
      Resources[K] extends () => Promise<infer R extends object> ? R : Resources[K],
      Path
    >;
  };
  translate(path: string, params: Record<string, any> = {}, language?: string) {
    const keys = path.split('.');
    let lng = (language && this.fixLanguage(language)) || this.language;
    let message = this.getMessageByLanguage(keys, lng);

    if (message === void 0 && lng !== this._fallbackLanguage) {
      lng = this._fallbackLanguage;
      message = this.getMessageByLanguage(keys, lng);
    }

    if (message === void 0) return path;

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
              const matched = key.match(/^(\d+)-(\d+|n)$/);
              if (matched) {
                const lower = Number(matched[1]);
                const higher = matched[2] === 'n' ? 'n' : Number(matched[2]);
                if (digit >= lower && (higher === 'n' || digit <= higher)) {
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
    let obj = this._resources[language] as any;
    for (const key of keys) {
      if (typeof obj !== 'object') break;
      if (!Object.hasOwn(obj, key)) break;
      obj = obj[key];
    }

    if (obj == void 0) return;
    if (typeof obj === 'string' || obj instanceof I18nMessage) return obj;
    return;
  }

  /**
   * 转为已经定义过的语言
   */
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
