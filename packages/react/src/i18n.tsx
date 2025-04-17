import { CoreI18n } from '@i18nx/core';
import {
  useState,
  useEffect,
  type ReactElement,
  useContext,
  createContext,
  type PropsWithChildren,
  type FC,
} from 'react';

export class I18n<
  Resources extends Record<string, object>,
  Languages extends string & keyof Resources,
  DefaultLanguage extends Languages,
> extends CoreI18n<Resources, Languages, DefaultLanguage> {
  static Context = createContext<string | undefined>(undefined);

  constructor(opts: CoreI18n.I18nOptions<Resources, Languages, DefaultLanguage>) {
    super(opts);
    this.Translate = this.Translate.bind(this);
  }

  Provider: FC<PropsWithChildren> = ({ children }) => {
    const [language, setLanguage] = useState(this.language);

    useEffect(() => {
      const subscription = this.on('language-changed', setLanguage);
      return () => {
        subscription.off();
      };
    }, []);

    return <I18n.Context.Provider value={language}>{children}</I18n.Context.Provider>;
  };

  Translate<Path extends CoreI18n.SearchPath<Resources[DefaultLanguage]>>(
    props: {
      /**
       * 需要翻译的句子
       */
      path: Path;
    } & (CoreI18n.SearchParamNames<
      CoreI18n.PathToMessage<Resources[DefaultLanguage], Path>
    > extends never
      ? {}
      : {
          [S in CoreI18n.SearchParamNames<
            CoreI18n.PathToMessage<Resources[DefaultLanguage], Path>
          >]: any;
        }),
  ): ReactElement {
    const language = useContext(I18n.Context);
    const { path, ...params } = props;
    // @ts-expect-error
    const msg = this.translate(path, params, language);
    return <>{msg}</>;
  }
}
