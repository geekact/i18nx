import { expectType, type TypeEqual } from 'ts-expect';
import { I18n, useLanguage } from '../src';
import { en } from '../../core/test/fixture/locales/en';
import { zh } from '../../core/test/fixture/locales/zh';

const i18n = new I18n({
  resources: {
    zh,
    en,
  },
  defaultLanguage: 'en',
});

const lang = useLanguage(i18n);
expectType<TypeEqual<'zh' | 'en', typeof lang>>(true);
