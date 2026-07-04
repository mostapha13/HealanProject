import { loadFromStorage, request } from '@tse/tools';
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

export async function getNewsOne({ id, onSuccess, onFail }: ResultType) {
  try {
    const res = await request.get({
      baseUrl,
      url: 'News/GetOne',
      options: { Id: id },
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}

export async function getNewsCategory<T>({ onSuccess, onFail }: ResultType<T>) {
  try {
    const res = await request.get({
      baseUrl,
      url: 'NewsCategory/Get',
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
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
  try {
    const res = await request.get({
      baseUrl,
      url: 'News/GetAvailableNews',
      options: {
        TalarId: id,
        PageNumber,
        PageSize,
        AscSort,
        SrtField,
        CategoryId,
        ...(Filter && { Filter }),
      },
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
