import { afterEach, expect, test } from 'vitest';
import { render, screen, cleanup, act } from '@testing-library/react';
import { en } from '../../core/test/fixture/locales/en';
import { zh } from '../../core/test/fixture/locales/zh';
import { I18n } from '../src';
import type { FC } from 'react';

import '@testing-library/jest-dom/vitest';

afterEach(cleanup);

const i18n = new I18n({ resources: { zh, en }, defaultLanguage: 'en' });

/**
 * @vitest-environment jsdom
 */
test('翻译组件', async () => {
  const App: FC = () => {
    return (
      <div>
        <span data-testid="home">
          <i18n.Translate path="home" />
        </span>
        <span data-testid="homeWithName">
          <i18n.Translate path="homeWithName" name="foo" />
        </span>
      </div>
    );
  };

  render(<App />, { wrapper: i18n.Provider });
  expect(screen.getByTestId('home')).toHaveTextContent('hello');
  expect(screen.getByTestId('homeWithName')).toHaveTextContent('Hello, foo');

  act(() => {
    i18n.changeLanguage('zh');
  });
  expect(screen.getByTestId('home')).toHaveTextContent('你好');
  expect(screen.getByTestId('homeWithName')).toHaveTextContent('你好，foo');
});
