import { renderHook, act } from '@testing-library/react';
import { expect, test } from 'vitest';
import { I18n, useLanguage } from '../src';
import { zh } from '../../core/test/fixture/locales/zh';
import { en } from '../../core/test/fixture/locales/en';

const i18n = new I18n({ resources: { zh, en }, defaultLanguage: 'en' });

/**
 * @vitest-environment jsdom
 */
test('切换语言', async () => {
  const { result } = renderHook(() => useLanguage(i18n), { wrapper: i18n.Provider });
  expect(result.current).toBe('en');
  act(() => {
    i18n.changeLanguage('zh');
  });
  expect(result.current).toBe('zh');
});
