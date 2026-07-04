/** Two argument needed, the name and given data */
export const saveToStorage = (name: string, data: any) => {
  const stringed: string = JSON.stringify(data);
  return localStorage.setItem(name, stringed);
};

/** Only name of required item */
export const loadFromStorage = (name: string) => {
  const gotItem: any = localStorage?.getItem(name);
  return JSON?.parse(gotItem);
};

export const removeLocalStorage = () => {
  return localStorage.clear();
};

export const removeItemFromStorage = (name: string) => {
  return localStorage.removeItem(name);
};
