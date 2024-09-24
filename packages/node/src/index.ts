import { I18n as CoreI18n } from '@i18nx/core';
import { AsyncLocalStorage } from 'node:async_hooks';

const storage = new AsyncLocalStorage<string>();

/**
 * 语言上下文，执行的任何翻译都会使用当前提供的语言。建议使用在中间件
 * ```typescript
 * function myMiddleware(ctx, next) {
 *   const language = 'zh-CN';
 *   return i18nProvider(language, next);
 * }
 * ```
 */
export const i18nProvider = <T>(language: string, callback: () => Promise<T>) => {
  return new Promise<T>((resolve, reject) => {
    storage.run(language, () => {
      callback().then(resolve).catch(reject);
    });
  });
};

export class I18n<
  Locales extends Record<string, object>,
  Languages extends string & keyof Locales,
  DefaultLanguage extends Languages,
> extends CoreI18n<Locales, Languages, DefaultLanguage> {
  override get language() {
    const parentLanguage = storage.getStore() as Languages | undefined;
    return parentLanguage || this._currentLanguage;
  }
}
