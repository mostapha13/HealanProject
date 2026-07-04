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
export async function getDossierList({
  data,
  onSuccess,
  onFail,
}: requestInterface) {
  const url = 'Dossier/List';
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

///Dossier

export async function getNextDossierNumber({
  data,
  onSuccess,
  onFail,
}: requestInterface) {
  const url = 'Dossier/GetNextDossierNumber';
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

export async function saveDossier({
  data,
  onSuccess,
  onFail,
}: requestInterface) {
  const url = 'Dossier/Register';
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

export async function getIndustryList({
  data,
  onSuccess,
  onFail,
}: requestInterface) {
  const url = 'Industry/IndustryList';
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

export async function getDossierInfo({
  data,
  onSuccess,
  onFail,
}: requestInterface) {
  const url = 'Dossier/Find';
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
export async function getDossierLevelSummary({
  data,
  onSuccess,
  onFail,
}: requestInterface) {
  const url = 'Dossier/DossierLevelSummary';
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
export async function exportDossierList({
  data,
  onSuccess,
  onFail,
}: requestInterface) {
  const url = 'Dossier/ExportDossierList';
  try {
    const res = await request.download({
      baseUrl: LISTING_BASE_API,
      url,
      options: data,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
export async function getAcceptanceExpertUser({
  data,
  onSuccess,
  onFail,
}: requestInterface) {
  const url = 'User/AcceptanceExpertUser';
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
export async function getConsultingCompanyList({
  data,
  onSuccess,
  onFail,
}: requestInterface) {
  const url = 'Company/ConsultingCompanyList';
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
