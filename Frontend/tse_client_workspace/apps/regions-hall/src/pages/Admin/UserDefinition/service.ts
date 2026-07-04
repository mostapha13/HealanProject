import { loadFromStorage, request, loadFromSession } from '@tse/tools';
import { baseUrl } from '../../../constants';

interface ReturnType {
  onSuccess: (param?: any) => void;
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
}

export async function getApplicationUser({
  onSuccess,
  PageSize,
  PageNumber,
  onFail,
  AscSort,
  SrtField,
  Filter,
}: ResultType) {
  const token = loadFromSession('token');
  try {
    const res = await request.get({
      baseUrl,
      url: 'ApplicationUser/Get',
      token,
      options: { PageSize, PageNumber, AscSort, SrtField, Filter },
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}

export async function getTalars({ onSuccess, onFail }: ReturnType) {
  const token = loadFromSession('token');
  try {
    const res = await request.get({
      baseUrl,
      url: 'Talar/Get',
      options: { PageSize: 100 },
      token,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}

export async function insertApplicationUser({
  data,
  onSuccess,
  onFail,
}: ResultType) {
  const token = loadFromSession('token');
  try {
    const res = await request.post({
      baseUrl,
      url: 'ApplicationUser/Insert',
      token,
      options: data,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}

export async function updateApplicationUser({
  data,
  onSuccess,
  onFail,
}: ResultType) {
  const token = loadFromSession('token');
  try {
    const res = await request.post({
      baseUrl,
      url: 'ApplicationUser/Update',
      token,
      options: data,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}

export async function deleteApplicationUser({
  id,
  onSuccess,
  onFail,
}: ResultType) {
  const token = loadFromSession('token');
  try {
    const res = await request.get({
      baseUrl,
      url: 'ApplicationUser/Delete',
      token,
      options: { id },
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}

export async function getApplicationRole({
  data,
  onSuccess,
  onFail,
}: ResultType) {
  const token = loadFromSession('token');
  try {
    const res = await request.get({
      baseUrl,
      url: 'ApplicationRole/Get',
      token,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
