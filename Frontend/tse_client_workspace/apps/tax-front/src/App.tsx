// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { BrowserRouter, RecoilRoot } from '@tse/utils';
import Route from './router/Route';
import '../src/assets/icon/css/website.css';
import { StorProvider as Provider } from '../src/store/configureStore';

function App() {
  return (
    <Provider>
      <BrowserRouter>
        <RecoilRoot>
          <Route />
        </RecoilRoot>
      </BrowserRouter>
    </Provider>
  );
}

export default App;
