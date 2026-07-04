// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { BrowserRouter, RecoilRoot } from '@tse/utils';
import Route from './router/Route';

function App() {
  return (
    <BrowserRouter>
      <RecoilRoot>
        <Route />
      </RecoilRoot>
    </BrowserRouter>
  );
}

export default App;
