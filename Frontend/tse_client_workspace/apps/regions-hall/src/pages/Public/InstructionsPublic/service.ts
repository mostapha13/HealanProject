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
}

export async function getInstructionsOne({
  id,
  onSuccess,
  onFail,
}: ResultType) {
  try {
    const res = await request.get({
      baseUrl,
      url: 'Instructions/GetOne',
      options: { Id: id },
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
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
  try {
    const res = await request.get({
      baseUrl,
      url: 'Instructions/Get',
      options: {
        PageNumber,
        PageSize,
        AscSort,
        SrtField,
        ...(Filter && { Filter }),
      },
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
