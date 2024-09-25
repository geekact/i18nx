export namespace I18nMessage {
  export type FormatType =
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
}

export class I18nMessage<Message extends string> {
  readonly formats: Record<string, I18nMessage.FormatType[]>;

  constructor(
    readonly message: Message,
    format: Record<string, I18nMessage.FormatType | I18nMessage.FormatType[] | undefined>,
  ) {
    this.formats = Object.fromEntries(
      Object.entries(format).map(([key, value]) => {
        return [key, value === undefined ? [] : Array.isArray(value) ? value : [value]];
      }),
    );
  }
}
