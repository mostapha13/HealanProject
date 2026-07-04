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
}

export async function getCourseParticipantsReport({
  PageNumber = 1,
  PageSize,
  onSuccess,
  onFail,
  SrtField,
  AscSort,
}: ResultType) {
  const token = loadFromSession('token');
  try {
    const res = await request.get({
      baseUrl,
      url: 'CourseParticipants/Get',
      options: { PageNumber, PageSize, SrtField, AscSort },
      token,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}

export async function insertCourseParticipants({
  data,
  onSuccess,
  onFail,
}: ResultType) {
  const token = loadFromSession('token');
  try {
    const res = await request.post({
      baseUrl,
      url: 'CourseParticipants/Insert',
      options: data,
      token,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}

export async function updateCourseParticipants({
  data,
  onSuccess,
  onFail,
}: ResultType) {
  const token = loadFromSession('token');
  try {
    const res = await request.post({
      baseUrl,
      url: 'CourseParticipants/Update',
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
      url: 'CourseParticipants/Delete',
      options: { Id: id },
      token,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}

export async function getCourses({
  PageNumber = 1,
  PageSize,
  onSuccess,
  onFail,
  ids,
}: ResultType) {
  const token = loadFromSession('token');
  try {
    const res = await request.post({
      baseUrl,
      url: 'Course/GetCourseReport',
      options: { PageNumber, PageSize, talar_Ids: ids },
      token,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
