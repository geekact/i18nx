import { useContext } from 'react';
import { I18n } from './i18n';

export const useLanguage = (i18n: I18n<any, string, string>): string => {
  const language = useContext(I18n.Context);
  return language || i18n['_fallbackLanguage'];
};
