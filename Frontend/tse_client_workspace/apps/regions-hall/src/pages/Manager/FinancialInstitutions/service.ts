import { loadFromStorage, request, loadFromSession } from '@tse/tools';
import { baseUrl } from '../../../constants';

interface ReturnType {
  onSuccess: (param: any) => void;
  onFail: (error: any) => void;
}

interface ResultType extends ReturnType {
  data?: any;
  id?: string;
  Filter?: string;
  PageNumber?: number;
  AscSort?: string | boolean;
  SrtField?: string | number;
  Nahad_Mali_Type_Id?: string | number;
}

export async function getNahadMali({
  id,
  PageNumber,
  onSuccess,
  onFail,
  AscSort,
  SrtField,
  Nahad_Mali_Type_Id,
  Filter,
}: ResultType) {
  const token = loadFromSession('token');
  try {
    const res = await request.get({
      baseUrl,
      url: 'NahadMali/Get',
      token,
      options: {
        TalarId: id,
        PageNumber,
        AscSort,
        SrtField,
        Nahad_Mali_Type_Id,
        Filter,
      },
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}

export async function getNahadMaliType({ onSuccess, onFail }: ReturnType) {
  const token = loadFromSession('token');
  try {
    const res = await request.get({
      baseUrl,
      url: 'NahadMaliType/Get',
      token,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}

export async function insertNahadMali({ data, onSuccess, onFail }: ResultType) {
  const token = loadFromSession('token');
  try {
    const res = await request.post({
      baseUrl,
      url: 'NahadMali/Insert',
      token,
      options: data,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}

export async function updateNahadMali({ data, onSuccess, onFail }: ResultType) {
  const token = loadFromSession('token');
  try {
    const res = await request.post({
      baseUrl,
      url: 'NahadMali/Update',
      token,
      options: data,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}

export async function deleteNahadMali({ id, onSuccess, onFail }: ResultType) {
  const token = loadFromSession('token');
  try {
    const res = await request.get({
      baseUrl,
      url: 'NahadMali/Delete',
      token,
      options: { id },
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}

export async function getKargozariType({ id, onSuccess, onFail }: ResultType) {
  const token = loadFromSession('token');
  try {
    const res = await request.get({
      baseUrl,
      url: 'BrokerType/Get',
      token,
      options: { id },
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
