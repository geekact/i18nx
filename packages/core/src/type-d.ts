import type { I18nMessage } from './i18n-message';

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

export type MessageFormatType =
  | {
      /**
       * 自定义格式化
       */
      type: 'custom';
      /**
       * 使用JS能力格式化参数
       */
      format: (value: any, locale: string) => any;
    }
  | {
      /**
       * 复数，根据传入的值显示不同的文字。
       */
      type: 'plural';
      /**
       * 参数为数字或者数字字符串时，Key可以是：
       * - 数字。比如 1，2，3
       * - 区间。比如 4-18
       * - 其它。字符串`n`，代表所有未匹配上的数字
       */
      plural: Record<string, any>;
    }
  | ({
      /**
       * 日期
       *
       * @see Intl.DateTimeFormat
       */
      type: 'date-time';
    } & Intl.DateTimeFormatOptions)
  | ({
      /**
       * 数字。比如货币、单位、百分比
       *
       * @see Intl.NumberFormat
       */
      type: 'number';
      style: NonNullable<Intl.NumberFormatOptions['style']>;
    } & Omit<Intl.NumberFormatOptions, 'style'>);
