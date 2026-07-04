import { loadFromStorage, request, loadFromSession } from '@tse/tools';
import { baseUrl } from '../../../constants';

interface ReturnType {
  onSuccess: (param?: any) => void;
  onFail: (error?: any) => void;
}

interface ResultType<T = void> extends ReturnType {
  data?: T;
  id?: string | number;
  ids?: string[] | number[];
  PageNumber?: string | number;
  PageSize?: string | number;
  AscSort?: string | boolean;
  SrtField?: string | number;
  Filter?: string;
}

export async function getCourseReport({
  PageNumber = 1,
  PageSize,
  onSuccess,
  onFail,
  SrtField,
  AscSort,
  ids,
  Filter,
}: ResultType) {
  const token = loadFromSession('token');
  try {
    const res = await request.post({
      baseUrl,
      url: 'Course/GetCourseReport',
      options: {
        PageNumber,
        PageSize,
        SrtField,
        AscSort,
        talar_Ids: ids,
        Filter,
      },
      token,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}

export async function insertCourse({ data, onSuccess, onFail }: ResultType) {
  const token = loadFromSession('token');
  try {
    const res = await request.post({
      baseUrl,
      url: 'Course/Insert',
      options: data,
      token,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}

export async function updateCourse({ data, onSuccess, onFail }: ResultType) {
  const token = loadFromSession('token');
  try {
    const res = await request.post({
      baseUrl,
      url: 'Course/Update',
      options: data,
      token,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}

export async function deleteCourse({ id, onSuccess, onFail }: ResultType) {
  const token = loadFromSession('token');
  try {
    const res = await request.get({
      baseUrl,
      url: 'Course/Delete',
      options: { Id: id },
      token,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
