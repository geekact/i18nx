import { renderHook, act } from '@testing-library/react';
import { expect, test } from 'vitest';
import { I18n, useTranslate } from '../src';
import { zh } from '../../core/test/fixture/locales/zh';
import { en } from '../../core/test/fixture/locales/en';

const i18n = new I18n({ resources: { zh, en }, defaultLanguage: 'en' });

/**
 * @vitest-environment jsdom
 */
test('翻译hook', async () => {
  const { result } = renderHook(
    () => {
      const t = useTranslate(i18n);
      return t('homeWithName', { name: 'foo' });
    },
    { wrapper: i18n.Provider },
  );
  expect(result.current).toBe('Hello, foo');
  act(() => {
    i18n.changeLanguage('zh');
  });
  expect(result.current).toBe('你好，foo');
});
