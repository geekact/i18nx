import { expect, test, vitest } from 'vitest';
import { I18n } from '../src';
import { zh } from '../../core/test/fixture/locales/zh';
import { en } from '../../core/test/fixture/locales/en';

const locales = { zh, en };

test('未使用provider则使用常规的语言设置', async () => {
  const i18n = new I18n({ locales, defaultLanguage: 'zh' });
  expect(i18n.language).toBe('zh');
  await i18n.setLanguage('en');
  expect(i18n.language).toBe('en');
});

test('使用provider则无视常规的语言设置', async () => {
  const i18n = new I18n({ locales, defaultLanguage: 'zh' });
  const spy = vitest.fn();

  await I18n.provider('zh', async () => {
    spy();
    expect(i18n.language).toBe('zh');
    await i18n.setLanguage('en');
    expect(i18n.language).toBe('zh');
  });

  expect(spy).toBeCalledTimes(1);
});

test('无效的provider回退到默认语言', async () => {
  const i18n = new I18n({ locales, defaultLanguage: 'en' });
  const spy = vitest.fn();

  await I18n.provider('jp', async () => {
    spy();
    expect(i18n.language).toBe('en');
    await i18n.setLanguage('zh');
    expect(i18n.language).toBe('en');
  });

  expect(spy).toBeCalledTimes(1);
});
