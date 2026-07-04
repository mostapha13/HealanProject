import withAlert from 'apps/cash-market/src/hoc/withAlert';
import {
  useStates,
  useEffect,
  useState,
  useNavigate,
  useSearchParams,
} from '@tse/utils';
const initialState = {};
const AcceptanceFiles = ({ onAlert }: any) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [state, setState] = useStates<any>(initialState);
  return <>hiiiiiiii</>;
};
export default withAlert(AcceptanceFiles);
