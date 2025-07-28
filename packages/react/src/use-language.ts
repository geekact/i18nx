import { useContext } from 'react';
import { I18n } from './i18n';

export const useLanguage = <Language extends string>(
  i18n: I18n<any, Language, any>,
): Language => {
  const language = useContext(I18n.Context);
  return (language || i18n['_fallbackLanguage']) as Language;
};
