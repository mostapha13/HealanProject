import { atom, selector } from '@tse/utils';

const userInfoAtom = atom({
  key: 'userInfoAtom',
  default: {
    code: '',
    firstname: '',
    lastname: '',
    roleNames: [],
    roleTitles: [],
    talar_ID: '',
    talarName: '',
    id: '',
    identityUserId: '',
    userTalars: [],
  },
});

const userInfoSelector = selector({
  key: 'userInfoSelector',
  get: ({ get }) => {
    return get(userInfoAtom);
  },
});

export { userInfoAtom, userInfoSelector };
