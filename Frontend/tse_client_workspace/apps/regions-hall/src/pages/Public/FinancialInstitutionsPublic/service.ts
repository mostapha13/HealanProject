import { loadFromStorage, request } from '@tse/tools';
import { baseUrl } from '../../../constants';

interface ReturnType {
  onSuccess: (param: any) => void;
  onFail: (error: any) => void;
}

interface ResultType extends ReturnType {
  data?: any;
  id?: string;
  PageNumber?: number;
  PageSize?: string | number;
  AscSort?: string | boolean;
  SrtField?: string | number;
  Nahad_Mali_Type_Id?: string | number;
  Filter?: string;
}

export async function getNahadMali({
  id,
  PageNumber,
  onSuccess,
  onFail,
  AscSort,
  SrtField,
  Filter,
  Nahad_Mali_Type_Id,
}: ResultType) {
  try {
    const res = await request.get({
      baseUrl,
      url: 'NahadMali/Get',
      options: {
        TalarId: id,
        PageNumber,
        AscSort,
        SrtField,
        Filter,
        Nahad_Mali_Type_Id,
      },
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}

export async function getNahadMaliType({ onSuccess, onFail }: ReturnType) {
  // const token = loadFromStorage('token');
  try {
    const res = await request.get({
      baseUrl,
      url: 'NahadMaliType/Get',
      // token,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
