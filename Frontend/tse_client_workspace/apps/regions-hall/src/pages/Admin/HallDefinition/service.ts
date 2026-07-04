import { loadFromStorage, request, loadFromSession } from '@tse/tools';
import { baseUrl } from '../../../constants';

interface ReturnType {
  onSuccess: (param?: any) => void;
  onFail: (error?: any) => void;
}

interface ResultType<T = void> extends ReturnType {
  data?: T;
  id?: string | number;
  PageNumber?: string | number;
  PageSize?: string | number;
  From?: string | number;
  To?: string | number;
  AscSort?: string | boolean;
  SrtField?: string | number;
  Filter?: string;
}

export async function postTalar({ data, onSuccess, onFail }: any) {
  const token = loadFromSession('token');
  try {
    const res = await request.post({
      baseUrl,
      url: 'Talar/Insert',
      options: data,
      token,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}

export async function getTalars({
  onSuccess,
  onFail,
  AscSort,
  SrtField,
  PageNumber,
  PageSize,
  Filter,
}: ResultType): Promise<any> {
  const token = loadFromSession('token');
  try {
    const res = await request.get({
      baseUrl,
      url: 'Talar/Get',
      token,
      options: {
        AscSort,
        SrtField,
        PageNumber,
        PageSize,
        Filter,
      },
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
export async function deleteTalar({
  id,
  onSuccess,
  onFail,
}: any): Promise<any> {
  const token = loadFromSession('token');
  try {
    const res = await request.get({
      baseUrl,
      url: 'Talar/Delete',
      token,
      options: { Id: id },
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}

export async function updateTalar({ data, onSuccess, onFail }: any) {
  const token = loadFromSession('token');
  try {
    const res = await request.post({
      baseUrl,
      url: 'Talar/Update',
      options: data,
      token,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
