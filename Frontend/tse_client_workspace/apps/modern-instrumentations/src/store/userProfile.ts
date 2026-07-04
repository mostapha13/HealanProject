import { atom, selector } from '@tse/utils';

const userInfoAtom = atom({
  key: 'userInfoAtom',
  default: { userName: '' },
});

const userInfoSelector = selector({
  key: 'userInfoSelector',
  get: ({ get }) => {
    return get(userInfoAtom);
  },
});

export { userInfoAtom, userInfoSelector };
