import { atom, selector } from '@tse/utils';

const tabaeeStatusAtom = atom({
  key: 'tabaeeStatusAtom',
  default: { id: '' },
});

const tabaeeStatusSelector = selector({
  key: 'tabaeeStatusSelector',
  get: ({ get }) => {
    return get(tabaeeStatusAtom);
  },
});

export { tabaeeStatusAtom, tabaeeStatusSelector };
