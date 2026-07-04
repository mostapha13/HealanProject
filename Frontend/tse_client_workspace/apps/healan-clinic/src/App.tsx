import { BrowserRouter } from '@tse/utils';
import { StoreProvider } from './store/configureStore';
import AppRoutes from './router/AppRoutes';

export function App() {
  return (
    <StoreProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </StoreProvider>
  );
}

export default App;
