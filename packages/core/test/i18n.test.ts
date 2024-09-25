import { expect, test, describe, vitest } from 'vitest';
import { CoreI18n, I18nMessage } from '../src';
import { zh } from './fixture/locales/zh';
import { en } from './fixture/locales/en';

const locales = { zh: zh, en: en, jp: en };

describe('语言', () => {
  test('获取语言列表', () => {
    const i18n = new CoreI18n({ locales, defaultLanguage: 'zh' });
    expect(i18n.languages).toMatchObject(['zh', 'en', 'jp']);
  });

  test('默认语言', () => {
    const i18n = new CoreI18n({ locales, defaultLanguage: 'zh' });
    expect(i18n.language).toBe('zh');
  });

  test('设置语言', async () => {
    const i18n = new CoreI18n({ locales, defaultLanguage: 'zh' });
    await i18n.setLanguage('en');
    expect(i18n.language).toBe('en');
  });

  test('设置不存在的语言则会退到默认语言', async () => {
    const i18n = new CoreI18n({ locales, defaultLanguage: 'zh' });
    await i18n.setLanguage('en1');
    expect(i18n.language).toBe('zh');
  });

  test('设置不存在的语言使用别名', async () => {
    const i18n = new CoreI18n({
      locales,
      defaultLanguage: 'zh',
      languageAlias: {
        'en-*': 'en',
        'en1': 'en',
        'zh-*': 'zh',
      },
    });
    await i18n.setLanguage('en1');
    expect(i18n.language).toBe('en');

    await i18n.setLanguage('zh-GB');
    expect(i18n.language).toBe('zh');

    await i18n.setLanguage('en-US');
    expect(i18n.language).toBe('en');
  });
});

describe('翻译', async () => {
  test('简单翻译', () => {
    const i18n = new CoreI18n({ locales, defaultLanguage: 'zh' });
    expect(i18n.t('home')).toBe('你好');
  });

  test('嵌套结构翻译', () => {
    const i18n = new CoreI18n({ locales, defaultLanguage: 'zh' });
    expect(i18n.t('menus.default.admins')).toBe('管理员列表');
  });

  test('带参数', () => {
    const i18n = new CoreI18n({ locales, defaultLanguage: 'zh' });
    expect(i18n.t('homeWithName', { name: '树先生！' })).toBe('你好，树先生！');
  });

  test('无效参数', () => {
    const i18n = new CoreI18n({ locales, defaultLanguage: 'zh' });
    // @ts-expect-error
    expect(i18n.t('homeWithName', { name1: '树先生！' })).toBe('你好，{{name}}');
  });

  test('不同语言下的翻译', async () => {
    const i18n = new CoreI18n({ locales, defaultLanguage: 'zh' });
    await i18n.setLanguage('en');
    expect(i18n.t('homeWithName', { name: '树先生！' })).toBe('Hello, 树先生！');
    await i18n.setLanguage('zh');
    expect(i18n.t('homeWithName', { name: '树先生！' })).toBe('你好，树先生！');
  });

  test('未找到当前地区的翻译时会退到默认翻译', async () => {
    const i18n = new CoreI18n({ locales, defaultLanguage: 'zh' });
    await i18n.setLanguage('en');
    expect(i18n.t('extra')).toBe('多余的翻译');
  });

  test('无效翻译直接显示key', async () => {
    const i18n = new CoreI18n({ locales, defaultLanguage: 'zh' });
    // @ts-expect-error
    expect(i18n.t('abc.def')).toBe('abc.def');
  });

  test('包含了I18nMessage', () => {
    const i18n = new CoreI18n({ locales, defaultLanguage: 'zh' });
    expect(i18n.t('friendFromMessageFunction', { friend: 'foo' })).toBe('我的朋友是 foo');
  });
});

test('提前准备key', () => {
  const i18n = new CoreI18n({ locales, defaultLanguage: 'zh' });
  // @ts-expect-error
  expect(i18n.key('abc.d.e')).toBe('abc.d.e');
  expect(i18n.key('menus.default.admins')).toBe('menus.default.admins');
});

describe('格式化', () => {
  const i18n = new CoreI18n({ locales, defaultLanguage: 'zh' });

  test('复数', () => {
    const result = i18n['formatTokenValue'](
      'male',
      [
        {
          type: 'plural',
          plural: {
            male: 'foo',
            female: 'bar',
          },
        },
      ],
      'zh',
    );
    expect(result).toBe('foo');
  });

  test('复数数量', () => {
    const formatters: I18nMessage.FormatType[] = [
      {
        type: 'plural',
        plural: {
          1: 'one',
          2: 'two',
          '3-7': 'few',
          'n': 'many',
        },
      },
    ];

    expect(i18n['formatTokenValue']('1', formatters, 'zh')).toBe('one');
    expect(i18n['formatTokenValue']('2', formatters, 'zh')).toBe('two');
    expect(i18n['formatTokenValue']('4', formatters, 'zh')).toBe('few');
    expect(i18n['formatTokenValue']('7', formatters, 'zh')).toBe('few');
    expect(i18n['formatTokenValue']('8', formatters, 'zh')).toBe('many');
    expect(i18n['formatTokenValue']('foo', formatters, 'zh')).toBe('foo');
  });

  test('自定义格式化', () => {
    const result = i18n['formatTokenValue'](
      'male',
      [
        {
          type: 'custom',
          format(value: string) {
            return value.toUpperCase();
          },
        },
      ],
      'zh',
    );
    expect(result).toBe('MALE');
  });

  test('货币', () => {
    expect(
      i18n['formatTokenValue'](
        '200000',
        [
          {
            type: 'number',
            style: 'currency',
            currency: 'cny',
          },
        ],
        'zh',
      ),
    ).toBe('¥200,000.00');

    expect(
      i18n['formatTokenValue'](
        '200000',
        [
          {
            type: 'number',
            style: 'currency',
            currency: 'usd',
          },
        ],
        'us',
      ),
    ).toBe('$200,000.00');
  });

  test('数字', () => {
    expect(
      i18n['formatTokenValue'](
        '200000000',
        [
          {
            type: 'number',
            style: 'decimal',
          },
        ],
        'us',
      ),
    ).toBe('200,000,000');
  });

  test('事件', () => {
    const date = new Date(1727189872880);
    expect(
      i18n['formatTokenValue'](
        date,
        [
          {
            type: 'date-time',
          },
        ],
        'us',
      ),
    ).toBe('9/24/2024');

    expect(
      i18n['formatTokenValue'](
        date,
        [
          {
            type: 'date-time',
            dateStyle: 'full',
            timeStyle: 'medium',
          },
        ],
        'zh',
      ),
    ).toBe('2024年9月24日星期二 22:57:52');

    expect(
      i18n['formatTokenValue'](
        date,
        [
          {
            type: 'date-time',
            dateStyle: 'full',
            timeStyle: 'short',
          },
        ],
        'jp',
      ),
    ).toBe('Tuesday, September 24, 2024 at 10:57 PM');
  });
});

describe('事件', () => {
  test('切换语言', async () => {
    const i18n = new CoreI18n({ locales, defaultLanguage: 'zh' });
    const spy = vitest.fn();
    const event = i18n.on('language-changed', spy);
    await i18n.setLanguage('jp');
    expect(spy).toBeCalledTimes(1);
    expect(spy).toBeCalledWith('jp');
    event.off();
  });

  test('切换同一个语言则不通知', async () => {
    const i18n = new CoreI18n({ locales, defaultLanguage: 'zh' });
    const spy = vitest.fn();
    const event = i18n.on('language-changed', spy);
    await i18n.setLanguage('zh');
    expect(spy).toBeCalledTimes(0);
    event.off();
  });
});

test('动态加载资源', async () => {
  const spy = vitest.fn();
  const i18n = new CoreI18n({
    locales: {
      zh,
      en: async () => {
        spy();
        return (await import('./fixture/locales/en')).en;
      },
    },
    defaultLanguage: 'zh',
  });

  await i18n.setLanguage('en');
  await i18n.setLanguage('zh');
  await i18n.setLanguage('en');
  expect(spy).toBeCalledTimes(1);
  expect(i18n.t('menus.default.users')).toBe('User lists');
});
