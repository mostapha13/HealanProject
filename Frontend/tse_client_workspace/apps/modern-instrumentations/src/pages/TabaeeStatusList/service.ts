import { loadFromStorage, request } from '@tse/tools';
import { baseUrl } from '../../constants';
import { axios } from '@tse/utils';

interface ReturnType {
  onSuccess: (param: any) => void;
  onFail: (error: any) => void;
}

interface ResultType<T = void> extends ReturnType {
  data?: T;
  id?: string;
  PageSize?: number;
  PageNumber?: number;
  AscSort?: string | boolean;
  SrtField?: string | number;
  Instrument?: string | number;
  InstrumentStatus?: string | number;
  HadafAzEnteshar?: string | number;
  Nasher?: string | number;
  SalEnteshar?: string | number;
  KargozareArzeKonande?: string | number;
}

export async function getTabaeeStatus({
  PageSize,
  PageNumber,
  onSuccess,
  onFail,
  AscSort,
  SrtField,
  Instrument,
  InstrumentStatus,
  HadafAzEnteshar,
  Nasher,
  KargozareArzeKonande,
  SalEnteshar,
}: ResultType) {
  const token = loadFromStorage('token');
  try {
    const res = await request.get({
      baseUrl,
      url: 'TabaeeStatus/ListTabaeeStatus',
      options: {
        PageNumber,
        PageSize,
        AscSort,
        SrtField,
        Instrument,
        InstrumentStatus,
        HadafAzEnteshar,
        Nasher,
        KargozareArzeKonande,
        SalEnteshar,
      },
      token,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}

export function handleGetFilterAllData({ onSuccess, onFail }: ReturnType) {
  const token = loadFromStorage('token');
  try {
    const hadafAzEnteshar = request.get({
      baseUrl,
      url: 'HadafAzEnteshar/Get',
      token,
      options: { PageSize: 10000 },
    });
    const instrumentState = request.get({
      baseUrl,
      url: 'InstrumentState/Get',
      token,
      options: { PageSize: 10000 },
    });
    const res = axios
      .all([hadafAzEnteshar, instrumentState])
      .then(
        axios.spread((...responses) => {
          return responses;
        })
      )
      .catch((error) => {
        onFail(error);
      });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
