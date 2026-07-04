import { loadFromStorage, request, loadFromSession } from '@tse/tools';
import { baseUrl } from '../../../constants';

interface ReturnType {
  onSuccess: (param?: any) => void;
  onFail: (error?: any) => void;
}

interface ResultType<T = void> extends ReturnType {
  data?: T | any;
  id?: string | number;
  PageNumber?: string | number;
  PageSize?: string | number;
  AscSort?: string | boolean;
  SrtField?: string | number;
  Filter?: string | number;
  TalarId?: string;
}
export async function insertTradingStatistics({
  data,
  onSuccess,
  onFail,
}: ResultType) {
  const token = loadFromSession('token');
  try {
    const res = await request.post({
      baseUrl,
      url: 'Trading_Statistics',
      options: data,
      token,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}

// export async function getTradingStatistics({
//   PageNumber = 1,
//   PageSize,
//   onSuccess,
//   onFail,
//   AscSort,
//   SrtField,
//   TalarId,
//   Filter,
// }: ResultType) {
//   const token = loadFromSession('token');
//   try {
//     const res = await request.get({
//       baseUrl,
//       url: 'Trading_Statistics/Get',
//       options: { PageNumber, PageSize, AscSort, SrtField, TalarId, Filter },
//       token,
//     });
//     onSuccess(res);
//   } catch (error) {
//     onFail(error);
//   }
// }

// export async function insertTradingStatistics({
//   data,
//   onSuccess,
//   onFail,
// }: ResultType) {
//   const token = loadFromSession('token');
//   try {
//     const res = await request.post({
//       baseUrl,
//       url: 'Trading_Statistics/InsertTradingStatistics',
//       options: data,
//       token,
//     });
//     onSuccess(res);
//   } catch (error) {
//     onFail(error);
//   }
// }

// export async function updateTradingStatistics({
//   data,
//   onSuccess,
//   onFail,
// }: ResultType) {
//   const token = loadFromSession('token');
//   try {
//     const res = await request.post({
//       baseUrl,
//       url: 'Trading_Statistics/Update',
//       options: data,
//       token,
//     });
//     onSuccess(res);
//   } catch (error) {
//     onFail(error);
//   }
// }

// export async function deleteTradingStatistics({
//   id,
//   onSuccess,
//   onFail,
// }: ResultType) {
//   const token = loadFromSession('token');
//   try {
//     const res = await request.get({
//       baseUrl,
//       url: 'Trading_Statistics/Delete',
//       options: { Id: id },
//       token,
//     });
//     onSuccess(res);
//   } catch (error) {
//     onFail(error);
//   }
// }
