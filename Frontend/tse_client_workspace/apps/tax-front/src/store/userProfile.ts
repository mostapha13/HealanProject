import { atom, selector } from '@tse/utils';

const userInfoTaxAtom = atom({
  key: 'userInfoTaxAtom',
  default: {
    userName: '',
    firstName: '',
    lastname: '',
    lastName: '',
    phoneNumber: '',
    departmentId: '',
    departmentName: '',
    userId: '',
    email: '',
    isActive: '',
    roleInfos: [
      {
        roleId: '',
        roleName: '',
        roleTitle: '',
      },
    ],
  },
});

const testStoreSelector = selector({
  key: 'userInfoSelector',
  get: ({ get }) => {
    return get(userInfoTaxAtom);
  },
});

export { userInfoTaxAtom, testStoreSelector };
