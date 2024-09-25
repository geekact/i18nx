import { expectType, type TypeEqual } from 'ts-expect';
import { CoreI18n } from '../src';
import { en } from './fixture/locales/en';
import { zh } from './fixture/locales/zh';
import { jp } from './fixture/locales/jp';

const i18n = new CoreI18n({
  defaultLanguage: 'zh-CN',
  resources: { 'zh-CN': zh, 'en-US': en },
});

// 构造函数
{
  new CoreI18n({ resources: { zh: {}, en: {} }, defaultLanguage: 'en' });

  // @ts-expect-error
  new CoreI18n({ defaultLanguage: 'en' });

  new CoreI18n({
    resources: { zh: {}, en: {} },
    // @ts-expect-error
    defaultLanguage: 'zh1',
  });

  // @ts-expect-error
  new CoreI18n({ resources: { zh: {}, en: {} } });

  // @ts-expect-error
  new CoreI18n({});

  // @ts-expect-error
  new CoreI18n();

  new CoreI18n({
    resources: { zh: {}, en: {} },
    defaultLanguage: 'zh',
    languageAlias: {
      'zh-CN': 'zh',
      // @ts-expect-error
      'en-US': 'en1',
      'zh-*': 'zh',
      // @ts-expect-error
      'zh-': 'zh1',
    },
  });
}

// i18n.key
{
  const home = i18n.key('home');
  expectType<'homeWithName'>(i18n.key('homeWithName'));
  expectType<'menus.default.users'>(i18n.key('menus.default.users'));
  // @ts-expect-error
  i18n.key('homie');
  // @ts-expect-error
  expectType<'homie'>(home);
}

// 翻译参数
{
  i18n.translate('home');

  i18n.translate('homeWithName', { name: 'abc' });
  // @ts-expect-error
  i18n.translate('homeWithName', { name1: 'abc' });
  // @ts-expect-error
  i18n.translate('homeWithName');
  // @ts-expect-error
  i18n.translate('homeWithName-a', { name: 'abc' });

  i18n.translate('menus.default.users');
  // @ts-expect-error
  i18n.translate('menus.default.users', {});
}

// 翻译返回值
{
  const home = i18n.translate('homeWithName', { name: 'foo' });
  expectType<
    TypeEqual<
      typeof home,
      string & {
        'zh-CN': '你好，{{name}}';
        'en-US': 'Hello, {{name}}';
      }
    >
  >(true);

  const admins = i18n.translate('menus.default.admins');
  expectType<
    TypeEqual<
      typeof admins,
      string & {
        'zh-CN': '管理员列表';
        'en-US': never;
      }
    >
  >(true);

  const nested = i18n.t('i.am.testing.a.very.deep.i18n.key.to.make.sure.it.can.work.yes');
  expectType<
    TypeEqual<
      typeof nested,
      string & {
        'zh-CN': '正常运行';
        'en-US': 'it works';
      }
    >
  >(true);

  const friend = i18n.translate('friendFromMessageFunction', { friend: 'mask' });
  expectType<
    TypeEqual<
      typeof friend,
      string & {
        'zh-CN': '我的朋友是 {{friend}}';
        'en-US': 'my friend is {{friend}}';
      }
    >
  >(true);
}

// 语言切换
{
  const lng = i18n.language;
  expectType<TypeEqual<typeof lng, 'zh-CN' | 'en-US'>>(true);
  const lngs = i18n.languages;
  expectType<TypeEqual<typeof lngs, ('zh-CN' | 'en-US')[]>>(true);

  i18n.changeLanguage('zh-CN');
  i18n.changeLanguage('en-US');
  i18n.changeLanguage('zh');

  // @ts-expect-error
  i18n.language = 'zh-CN';
  // @ts-expect-error
  i18n.language = 'en';
  // @ts-expect-error
  i18n.languages = ['zh-CN'];
}

// 动态资源
{
  const i18n = new CoreI18n({
    resources: {
      'zh-CN': zh,
      'en-US': async () => {
        return (await import('./fixture/locales/en')).en;
      },
    },
    defaultLanguage: 'zh-CN',
  });

  const home = i18n.translate('homeWithName', { name: 'foo' });
  expectType<
    TypeEqual<
      typeof home,
      string & {
        'zh-CN': '你好，{{name}}';
        'en-US': 'Hello, {{name}}';
      }
    >
  >(true);
}

// 定义
{
  const zh = CoreI18n.define({
    hello: '你好',
    a: {
      b: CoreI18n.message('好的'),
    },
  });

  const en = CoreI18n.satisfies(zh).define({
    hello: 'Hello',
  });
  expectType<TypeEqual<{ readonly hello: 'Hello' }, typeof en>>(true);

  CoreI18n.satisfies(zh).define({
    // @ts-expect-error
    hell: 'Hello',
  });

  CoreI18n.satisfies(zh).define({
    hello: 'Hello',
    a: {
      // @ts-expect-error
      c: 'cc',
    },
  });

  // 满足的情况下多出来的字段不会报错（理想状态下是需要报错的）
  CoreI18n.satisfies(zh).define({
    hello: 'Hello',
    a: {
      b: 'bb',
      c: 'cc',
    },
  });
}

// 缺失翻译
{
  const i18n = new CoreI18n({
    resources: {
      zh: zh,
      en: async () => {
        return (await import('./fixture/locales/en')).en;
      },
      jp: jp,
    },
    defaultLanguage: 'zh',
  });

  expectType<{
    en: 'extra' | 'menus.default.admins';
    jp: 'menus.default.users' | 'menus.default.admins';
  }>(i18n.missingKeys);
}
