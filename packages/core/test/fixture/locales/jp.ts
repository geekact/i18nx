import { CoreI18n } from '../../../src';
import { zh } from './zh';

export const jp = CoreI18n.satisfies(zh).define({
  home: 'hello',
  homeWithName: 'Hello, {{name}}',
  friendFromMessageFunction: CoreI18n.message('my friend is {{friend}}'),
  extra: 'extra',
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
