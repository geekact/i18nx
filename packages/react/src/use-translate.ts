import { useCallback, useContext } from 'react';
import { I18n } from './i18n';
import type { CoreI18n } from '@i18nx/core';

export const useTranslate = <
  Resources extends Record<string, object>,
  Languages extends string & keyof Resources,
  DefaultLanguage extends Languages,
>(
  i18n: I18n<Resources, Languages, DefaultLanguage>,
) => {
  const language = useContext(I18n.Context);

  return useCallback(
    <Key extends CoreI18n.SearchPath<Resources[DefaultLanguage]>>(
      key: Key,
      ...rest: CoreI18n.SearchParamNames<
        CoreI18n.PathToMessage<Resources[DefaultLanguage], Key>
      > extends never
        ? [params?: Record<string, never>]
        : [
            params: {
              [S in CoreI18n.SearchParamNames<
                CoreI18n.PathToMessage<Resources[DefaultLanguage], Key>
              >]: any;
            },
          ]
    ) => {
      const [params = {}] = rest;
      // @ts-expect-error
      return i18n.translate(key, params, language);
    },
    [language],
  );
};
