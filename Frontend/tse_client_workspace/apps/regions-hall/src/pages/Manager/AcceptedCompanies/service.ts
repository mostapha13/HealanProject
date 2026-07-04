import { loadFromStorage, request, loadFromSession } from '@tse/tools';
import { baseUrl } from '../../../constants';

interface ReturnType {
  onSuccess: (param: any) => void;
  onFail: (error: any) => void;
}

interface ResultType extends ReturnType {
  data?: any;
  id?: string;
  Filter?: string;
  PageSize?: number;
  PageNumber?: number;
  AscSort?: string | boolean;
  SrtField?: string | number;
  TalarId?: string;
}

export async function insertCompany({ data, onSuccess, onFail }: any) {
  const token = loadFromSession('token');
  try {
    const res = await request.post({
      baseUrl,
      url: 'Company/Insert',
      options: data,
      token,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}

export async function deleteCompany({ id, onSuccess, onFail }: any) {
  const token = loadFromSession('token');
  try {
    const res = await request.get({
      baseUrl,
      url: 'Company/Delete',
      options: { id },
      token,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}

export async function getCompanies({
  PageSize,
  PageNumber,
  onSuccess,
  onFail,
  AscSort,
  SrtField,
  Filter,
  TalarId,
}: ResultType) {
  const token = loadFromSession('token');
  try {
    const res = await request.get({
      baseUrl,
      url: 'Company/Get',
      options: { PageNumber, PageSize, AscSort, SrtField, Filter, TalarId },
      token,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}

export async function updateCompany({ data, onSuccess, onFail }: any) {
  const token = loadFromSession('token');
  try {
    const res = await request.post({
      baseUrl,
      url: 'Company/Update',
      options: data,
      token,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
export async function getInstrumentList({ data, onSuccess, onFail }: any) {
  const token = loadFromSession('token');
  try {
    const res = await request.get({
      baseUrl,
      url: 'Company/Instruments',
      options: data,
      token,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
