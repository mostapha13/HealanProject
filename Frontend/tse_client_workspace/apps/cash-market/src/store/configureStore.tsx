import { createStore, applyMiddleware } from 'redux';
import createOidcMiddleware from 'redux-oidc';
import thunkMiddleware from 'redux-thunk';
import { createBrowserHistory } from 'history';
import { userManager } from './userManager';
import createRootReducer from '.';
import { routerMiddleware } from 'connected-react-router';
import { Provider } from 'react-redux';

export const history = createBrowserHistory();
const configureStore = () => {
  userManager.events.addSilentRenewError(function (error) {
    console.error('error while renewing the access token', error);
  });

  const oidcMiddleware = createOidcMiddleware(userManager);

  const allReducers = createRootReducer(history);
  const store = createStore(
    allReducers,
    applyMiddleware(oidcMiddleware, thunkMiddleware, routerMiddleware(history))
  );

  return store;
};

export default configureStore;

const store = configureStore();

export const StorProvider = ({ children }: any) => {
  return <Provider store={store}>{children}</Provider>;
};
