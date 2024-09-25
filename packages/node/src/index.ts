import { CoreI18n } from '@i18nx/core';
import { AsyncLocalStorage } from 'node:async_hooks';

const storage = new AsyncLocalStorage<string>();

export class I18n<
  Locales extends Record<string, object>,
  Languages extends string & keyof Locales,
  DefaultLanguage extends Languages,
> extends CoreI18n<Locales, Languages, DefaultLanguage> {
  /**
   * 语言上下文，执行的任何翻译都会使用当前提供的语言。建议使用在中间件
   * ```typescript
   * function myMiddleware(ctx, next) {
   *   const language = 'zh-CN';
   *   return I18n.provider(language, next);
   * }
   * ```
   */
  static provider<T>(language: string, callback: () => Promise<T>) {
    return new Promise<T>((resolve, reject) => {
      storage.run(language, () => {
        callback().then(resolve).catch(reject);
      });
    });
  }

  override get language() {
    const parentLanguage = storage.getStore();
    if (parentLanguage === undefined) return super.language;
    return this.fixLanguage(parentLanguage) || this._fallbackLanguage;
  }
}

export { I18nMessage } from '@i18nx/core';
