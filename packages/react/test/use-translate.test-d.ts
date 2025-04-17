import { expectType, type TypeEqual } from 'ts-expect';
import { I18n, useTranslate } from '../src';
import { en } from '../../core/test/fixture/locales/en';
import { zh } from '../../core/test/fixture/locales/zh';

const i18n = new I18n({
  resources: {
    zh,
    en,
  },
  defaultLanguage: 'en',
});

const t = useTranslate(i18n);

const msg = t('i.am.testing.a.very.deep.i18n.key.to.make.sure.it.can.work.yes');
expectType<TypeEqual<typeof msg, string & { zh: '正常运行'; en: 'it works' }>>(true);

// @ts-expect-error
t('not-defined');

t('home');
t('home', {});
t('home', undefined);
// @ts-expect-error
t('home', null);
// @ts-expect-error
t('home', { data: 1 });

// @ts-expect-error
t('homeWithName');
// @ts-expect-error
t('homeWithName', {});
t('homeWithName', { name: 'foo' });
t('homeWithName', {
  name: 'foo',
  // @ts-expect-error
  name1: 'bar',
});
