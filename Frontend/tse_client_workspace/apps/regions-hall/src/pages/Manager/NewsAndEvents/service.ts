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
  AscSort?: string | boolean;
  SrtField?: string | number;
  Filter?: string;
  CategoryId?: string;
}

export async function getNews({
  PageNumber = 1,
  PageSize,
  onSuccess,
  onFail,
  AscSort,
  SrtField,
  Filter,
  id,
  CategoryId,
}: ResultType) {
  const token = loadFromSession('token');
  try {
    const res = await request.get({
      baseUrl,
      url: 'News/Get',
      options: {
        TalarId: id,
        PageNumber,
        PageSize,
        AscSort,
        SrtField,
        CategoryId,
        ...(Filter && { Filter }),
      },
      token,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}

export async function deleteNews<T>({ id, onSuccess, onFail }: ResultType<T>) {
  const token = loadFromSession('token');
  try {
    const result = await request.get({
      baseUrl,
      url: 'News/Delete',
      options: { Id: id },
      token,
    });
    onSuccess(result);
  } catch (error) {
    onFail(error);
  }
}

export async function insertNews<T>({
  data,
  onSuccess,
  onFail,
}: ResultType<T>) {
  const token = loadFromSession('token');
  try {
    const res = await request.post({
      baseUrl,
      url: 'News/Insert',
      options: data,
      token,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}

export async function updateNews<T>({
  data,
  onSuccess,
  onFail,
}: ResultType<T>) {
  const token = loadFromSession('token');
  try {
    await request.post({
      baseUrl,
      url: 'News/Update',
      options: data,
      token,
    });
    onSuccess();
  } catch (error) {
    onFail(error);
  }
}

export async function getNewsCategory<T>({ onSuccess, onFail }: ResultType<T>) {
  const token = loadFromSession('token');
  try {
    const res = await request.get({
      baseUrl,
      url: 'NewsCategory/Get',
      token,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
