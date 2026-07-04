import { loadFromStorage, request } from '@tse/tools';
import { baseUrl } from '../../constants';
import { axios } from '@tse/utils';

interface ReturnType {
  onSuccess: (param: any) => void;
  onFail: (error: any) => void;
}

interface ResultType<T = void> extends ReturnType {
  data?: T;
  id?: number | string;
  PageSize?: number;
  PageNumber?: number;
  AscSort?: string | boolean;
  SrtField?: string | number;
  Filter?: string | number;
}

export async function insertTabaeeStatus<T>({
  data,
  onSuccess,
  onFail,
}: ResultType<T>) {
  const token = loadFromStorage('token');
  try {
    const res = await request.post({
      baseUrl,
      url: 'TabaeeStatus/Insert',
      token,
      options: data,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}

export async function updateTabaeeStatus<T>({
  data,
  onSuccess,
  onFail,
}: ResultType<T>) {
  const token = loadFromStorage('token');
  try {
    const res = await request.post({
      baseUrl,
      url: 'TabaeeStatus/Update',
      token,
      options: data,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}

export async function getOneTabaeeStatus<T>({
  id,
  onSuccess,
  onFail,
}: ResultType<T>) {
  const token = loadFromStorage('token');
  try {
    const res = await request.get({
      baseUrl,
      url: 'TabaeeStatus/GetOne',
      token,
      options: { Id: id },
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}

export async function deleteTabaeeStatus<T>({
  id,
  onSuccess,
  onFail,
}: ResultType<T>) {
  const token = loadFromStorage('token');
  try {
    const res = await request.get({
      baseUrl,
      url: 'TabaeeStatus/Delete',
      token,
      options: { Id: id },
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}

export async function getInstrumentAll({
  PageNumber,
  PageSize,
  onSuccess,
  onFail,
  Filter,
}: ResultType) {
  const token = loadFromStorage('token');
  try {
    const res = await request.get({
      baseUrl,
      url: 'InstrumentAll/Get',
      token,
      options: { PageNumber, PageSize, Filter },
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}

export function handleGetAllData({ onSuccess, onFail }: ReturnType) {
  const token = loadFromStorage('token');
  try {
    const hadafAzEnteshar = request.get({
      baseUrl,
      url: 'HadafAzEnteshar/Get',
      token,
      options: { PageSize: 10000 },
    });
    const nasher = request.get({
      baseUrl,
      url: 'Nasher/Get',
      token,
      options: { PageSize: 10000 },
    });
    const sharayeteTasviehTaahodDarTarikhEmal = request.get({
      baseUrl,
      url: 'SharayeteTasviehTaahodDarTarikhEmal/Get',
      token,
      options: { PageSize: 10000 },
    });
    const raveshTosigh = request.get({
      baseUrl,
      url: 'RaveshTosigh/Get',
      token,
      options: { PageSize: 10000 },
    });
    const kargozareArzeKonande = request.get({
      baseUrl,
      url: 'KargozareArzeKonande/Get',
      token,
      options: { PageSize: 10000 },
    });
    const instrumentState = request.get({
      baseUrl,
      url: 'InstrumentState/Get',
      token,
      options: { PageSize: 10000 },
    });
    axios
      .all([
        hadafAzEnteshar,
        nasher,
        sharayeteTasviehTaahodDarTarikhEmal,
        raveshTosigh,
        kargozareArzeKonande,
        instrumentState,
      ])
      .then(
        axios.spread((...responses) => {
          onSuccess(responses);
        })
      )
      .catch((error) => {
        onFail(error);
      });
  } catch (error) {
    onFail(error);
  }
}
