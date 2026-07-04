import { createStore, applyMiddleware } from 'redux';
import createOidcMiddleware from 'redux-oidc';
import thunkMiddleware from 'redux-thunk';
import { createBrowserHistory } from 'history';
import { routerMiddleware } from 'connected-react-router';
import { Provider } from 'react-redux';
import { userManager } from './userManager';
import createRootReducer from '.';

export const history = createBrowserHistory();

const configureStore = () => {
  userManager.events.addSilentRenewError((error) => {
    console.error('خطا در تمدید توکن', error);
  });

  const oidcMiddleware = createOidcMiddleware(userManager);
  const allReducers = createRootReducer(history);

  return createStore(
    allReducers,
    applyMiddleware(oidcMiddleware, thunkMiddleware, routerMiddleware(history))
  );
};

const store = configureStore();

export const StoreProvider = ({ children }: { children: React.ReactNode }) => (
  <Provider store={store}>{children}</Provider>
);

export default store;
