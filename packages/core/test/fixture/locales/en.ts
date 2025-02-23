import { CoreI18n } from '../../../src';
import { zh } from './zh';

export const en = CoreI18n.satisfies(zh).define({
  home: 'hello',
  homeWithName: 'Hello, {{name}}',
  friendFromMessageFunction: CoreI18n.message('my friend is {{friend}}'),
  menus: {
    default: {
      users: 'User lists',
    },
  },
  i: {
    am: {
      testing: {
        a: {
          very: {
            deep: {
              i18n: {
                key: {
                  to: {
                    make: {
                      sure: {
                        it: {
                          can: {
                            work: {
                              yes: 'it works',
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
});
