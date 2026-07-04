import { request } from '@tse/tools';
import { baseUrl, captchaBaseUrl } from '../../../constants';

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

export async function getCourseParticipantsReport({
  PageNumber = 1,
  PageSize,
  onSuccess,
  onFail,
  SrtField,
  AscSort,
  Filter,
  ids,
}: ResultType) {
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
        ...(Filter && { Filter }),
      },
    });
    onSuccess(res);
  } catch (error: any) {
    onFail(error);
  }
}

export async function getCaptcha({ onSuccess, onFail }: ResultType) {
  try {
    const res = await request.get({
      baseUrl: captchaBaseUrl,
      url: 'Get',
    });
    onSuccess(res);
  } catch (error: any) {
    onFail(error);
  }
}

export async function postCheckData<T>({
  onSuccess,
  onFail,
  data,
}: ResultType<T>) {
  try {
    const res = await request.post({
      baseUrl,
      url: 'CourseParticipants/CheckData',
      options: data,
    });
    onSuccess(res);
  } catch (error: any) {
    onFail(error);
  }
}

export async function postActiveSubmition<T>({
  onSuccess,
  onFail,
  data,
}: ResultType<T>) {
  try {
    const res = await request.post({
      baseUrl,
      url: 'CourseParticipants/ActiveSubmition',
      options: data,
    });
    onSuccess(res);
  } catch (error: any) {
    onFail(error);
  }
}

export async function postReSendSms<T>({
  onSuccess,
  onFail,
  data,
}: ResultType<T>) {
  try {
    const res = await request.post({
      baseUrl,
      url: 'CourseParticipants/ReSendSms',
      options: data,
    });
    onSuccess(res);
  } catch (error: any) {
    onFail(error);
  }
}
