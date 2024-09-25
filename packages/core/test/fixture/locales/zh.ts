import { CoreI18n } from '../../../src';

export default <const>{
  home: '你好',
  homeWithName: '你好，{{name}}',
  friendFromMessageFunction: CoreI18n.message('我的朋友是 {{friend}}'),
  menus: {
    default: {
      users: '用户列表',
      admins: '管理员列表',
    },
  },
  extra: '多余的翻译',
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
                              yes: '正常运行',
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
};
