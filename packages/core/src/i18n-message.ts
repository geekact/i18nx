import type { MessageFormatType, SearchParamNames } from './type-d';

export class I18nMessage<Message extends string> {
  readonly formats: Record<string, MessageFormatType[]>;

  constructor(
    readonly message: Message,
    format: Record<string, MessageFormatType | MessageFormatType[] | undefined>,
  ) {
    this.formats = Object.fromEntries(
      Object.entries(format).map(([key, value]) => {
        return [key, value === undefined ? [] : Array.isArray(value) ? value : [value]];
      }),
    );
  }
}

export function message<const Message extends string>(
  msg: Message,
  format?: {
    [K in SearchParamNames<Message>]?: MessageFormatType | MessageFormatType[];
  },
): I18nMessage<Message> {
  return new I18nMessage(msg, format || {});
}
