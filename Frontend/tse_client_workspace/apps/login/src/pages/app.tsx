import { BrowserRouter } from '@tse/utils';
import PrivateRoutes from '../router/PrivateRoutes';

export default function App() {
  return (
    <BrowserRouter>
      <PrivateRoutes />
    </BrowserRouter>
  );
}
