// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { BrowserRouter } from '@tse/utils';
import PrivateRoutes from '../router/PrivateRoutes';
import { StorProvider as Provider } from '../store/configureStore';
import 'apps/cash-market/src/assets/icon/css/website.css';

export function App() {

  return (
    <Provider>
      <BrowserRouter>
        <PrivateRoutes />
      </BrowserRouter>
    </Provider>
  );
}

export default App;
