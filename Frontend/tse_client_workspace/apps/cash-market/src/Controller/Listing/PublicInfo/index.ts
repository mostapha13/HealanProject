import { request } from '@tse/tools';
import { LISTING_BASE_API } from 'apps/cash-market/src/constants';

interface requestInterface {
  data?: any;
  onSuccess: (e: any) => void;
  onFail: (e: any) => void;
}
interface ResultType extends requestInterface {
  orderId?: string;
}

export async function getDossierYears({
  data,
  onSuccess,
  onFail,
}: requestInterface) {
  const url = 'PublicInfo/DossierYears';
  try {
    const res = await request.get({
      baseUrl: LISTING_BASE_API,
      url,
      options: data,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
export async function getMenus({ data, onSuccess, onFail }: requestInterface) {
  const url = 'PublicInfo/GetMenus';
  try {
    const res = await request.get({
      baseUrl: LISTING_BASE_API,
      url,
      options: data,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
export async function getSubMenus({
  data,
  onSuccess,
  onFail,
}: requestInterface) {
  const url = 'PublicInfo/GetSubMenus';
  try {
    const res = await request.get({
      baseUrl: LISTING_BASE_API,
      url,
      options: data,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
export async function getDossierState({
  data,
  onSuccess,
  onFail,
}: requestInterface) {
  const url = 'Dossier/GetDossierState';
  try {
    const res = await request.get({
      baseUrl: LISTING_BASE_API,
      url,
      options: data,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
export async function saveDossierState({
  data,
  onSuccess,
  onFail,
}: requestInterface) {
  const url = 'Dossier/SaveDossierState';
  try {
    const res = await request.post({
      baseUrl: LISTING_BASE_API,
      url,
      options: data,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
//////////////////////Chat/////////////////////
export async function chatList({ data, onSuccess, onFail }: requestInterface) {
  const url = 'Chat/List';
  try {
    const res = await request.get({
      baseUrl: LISTING_BASE_API,
      url,
      options: data,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
export async function chatSave({ data, onSuccess, onFail }: requestInterface) {
  const url = 'Chat/Save';
  try {
    const res = await request.post({
      baseUrl: LISTING_BASE_API,
      url,
      options: data,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
