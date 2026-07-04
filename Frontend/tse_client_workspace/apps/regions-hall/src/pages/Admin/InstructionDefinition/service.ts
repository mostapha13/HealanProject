import { loadFromStorage, request, loadFromSession } from '@tse/tools';
import { baseUrl } from '../../../constants';

interface ReturnType {
  onSuccess: (param?: any) => void;
  onFail: (error?: any) => void;
}

interface ResultType<T = void> extends ReturnType {
  data?: T;
  id?: string | number;
  PageNumber?: number;
  PageSize?: number;
  Filter?: string;
  AscSort?: string | boolean;
  SrtField?: string | number;
}

export async function getInstructions({
  PageNumber,
  PageSize,
  onSuccess,
  onFail,
  AscSort,
  SrtField,
  Filter,
}: ResultType) {
  const token = loadFromSession('token');
  try {
    const res = await request.get({
      baseUrl,
      url: 'Instructions/Get',
      options: { PageNumber, PageSize, AscSort, SrtField, Filter },
      token,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}

export async function deleteInstructions<T>({
  id,
  onSuccess,
  onFail,
}: ResultType<T>) {
  const token = loadFromSession('token');
  try {
    const result = await request.get({
      baseUrl,
      url: 'Instructions/Delete',
      options: { Id: id },
      token,
    });
    onSuccess(result);
  } catch (error) {
    onFail(error);
  }
}

export async function insertInstructions<T>({
  data,
  onSuccess,
  onFail,
}: ResultType<T>) {
  const token = loadFromSession('token');
  try {
    const res = await request.post({
      baseUrl,
      url: 'Instructions/Insert',
      options: data,
      token,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}

export async function updateInstructions<T>({
  data,
  onSuccess,
  onFail,
}: ResultType<T>) {
  const token = loadFromSession('token');
  try {
    const res = await request.post({
      baseUrl,
      url: 'Instructions/Update',
      options: data,
      token,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
