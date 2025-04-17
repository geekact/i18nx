import { createRoot } from 'react-dom/client';
import { I18n } from '../src';
import { zh } from '../../core/test/fixture/locales/zh';
import { en } from '../../core/test/fixture/locales/en';

const i18n = new I18n({
  resources: { zh, en },
  defaultLanguage: 'en',
});

// provider
{
  const root = createRoot(document.getElementById('root')!);
  root.render(<i18n.Provider></i18n.Provider>);
  root.render(
    <i18n.Provider>
      <div />
    </i18n.Provider>,
  );
  root.render(
    <i18n.Provider>
      <div />
      <div />
    </i18n.Provider>,
  );
}

// Translate
{
  // @ts-expect-error
  <i18n.Translate />;
  <i18n.Translate path="home" />;
  <i18n.Translate
    path="home"
    // @ts-expect-error
    data="1"
  />;
  // @ts-expect-error
  <i18n.Translate path="homeWithName" />;
  <i18n.Translate path="homeWithName" name="foo" />;
  <i18n.Translate
    path="homeWithName"
    name="foo"
    // @ts-expect-error
    foo="bar"
  />;

  <i18n.Translate path="i.am.testing.a.very.deep.i18n.key.to.make.sure.it.can.work.yes" />;
  <i18n.Translate
    path="i.am.testing.a.very.deep.i18n.key.to.make.sure.it.can.work.yes"
    // @ts-expect-error
    data="1"
  />;

  // @ts-expect-error
  <i18n.Translate path="not-defined" />;
}
