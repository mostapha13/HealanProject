import { loadFromStorage, request, loadFromSession } from '@tse/tools';
import { baseUrl } from '../../../constants';

interface ReturnType {
  onSuccess?: (param?: any) => void;
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
}

export async function getCourseReport({
  PageNumber = 1,
  PageSize,
  onSuccess,
  onFail,
  From,
  To,
  id,
  AscSort,
  SrtField,
}: ResultType) {
  const token = loadFromSession('token');
  try {
    const res = await request.post({
      baseUrl,
      url: 'Course/GetCourseReport',
      options: {
        PageNumber,
        PageSize,
        From,
        To,
        Talar_Ids: id,
        AscSort,
        SrtField,
      },
      token,
    });
    onSuccess?.(res);
  } catch (error) {
    onFail(error);
  }
}

export async function getCourseParticipants({
  PageNumber = 1,
  PageSize,
  onSuccess,
  onFail,
  id,
}: ResultType) {
  const token = loadFromSession('token');
  try {
    const res = await request.get({
      baseUrl,
      url: 'CourseParticipants/CourseParticipantsByCourse',
      options: {
        PageNumber,
        PageSize,
        CourseId: id,
      },
      token,
    });
    onSuccess?.(res);
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
      token,
    });
    onSuccess?.(res);
  } catch (error) {
    onFail(error);
  }
}

export async function getCourseExcellReport<T>({
  onSuccess,
  onFail,
  data,
}: ResultType<T>) {
  const token = loadFromSession('token');
  try {
    const res = await request.post({
      baseUrl,
      url: 'Course/GetCourseExcellReport',
      options: data,
      token,
    });
    onSuccess?.(res);
  } catch (error) {
    onFail(error);
  }
}
