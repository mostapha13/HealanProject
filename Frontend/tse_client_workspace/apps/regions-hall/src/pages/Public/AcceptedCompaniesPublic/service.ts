import { loadFromStorage, request } from '@tse/tools';
import { baseUrl } from '../../../constants';

interface ReturnType {
  onSuccess: (param: any) => void;
  onFail: (error: any) => void;
}

interface ResultType extends ReturnType {
  data?: any;
  id?: string;
  PageSize?: number;
  PageNumber?: number;
  AscSort?: string | boolean;
  SrtField?: string | number;
  Filter?: string;
  TalarId?: string;
}

export async function insertCompany({ data, onSuccess, onFail }: any) {
  try {
    const res = await request.post({
      baseUrl,
      url: 'Company/Insert',
      options: data,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}

export async function deleteCompany({ id, onSuccess, onFail }: any) {
  try {
    const res = await request.get({
      baseUrl,
      url: 'Company/Delete',
      options: { id },
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
  const talarData = loadFromStorage('hasProvince');
  const guid = talarData.hasOwnProperty('guid') ? talarData.guid : '';
  try {
    const res = await request.get({
      baseUrl,
      url: 'Company/Get',
      options: {
        PageNumber,
        PageSize,
        AscSort,
        SrtField,
        TalarId: guid,
        ...(Filter && { Filter }),
      },
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}

export async function updateCompany({ data, onSuccess, onFail }: any) {
  try {
    const res = await request.post({
      baseUrl,
      url: 'Company/Update',
      options: data,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
