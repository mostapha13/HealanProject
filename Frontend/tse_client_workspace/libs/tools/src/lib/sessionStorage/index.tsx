/** Two argument needed, the name and given data */
export const saveToSession = (name: string, data: any) => {
  const stringed: string = JSON.stringify(data);
  return sessionStorage.setItem(name, stringed);
};

/** Only name of required item */
export const loadFromSession = (name: string) => {
  const gotItem: any = sessionStorage?.getItem(name);
  return JSON?.parse(gotItem);
};

export const removeSessionStorage = () => {
  return sessionStorage.clear();
};

export const removeItemFromSession = (name: string) => {
  return sessionStorage.removeItem(name);
};
