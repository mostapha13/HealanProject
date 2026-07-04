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

export async function getUsers({ data, onSuccess, onFail }: requestInterface) {
  const url = 'User/UserList';
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

export async function getUsersInfo({
  data,
  onSuccess,
  onFail,
}: requestInterface) {
  const url = 'User/UserInfo';
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
export async function saveUsers({ data, onSuccess, onFail }: requestInterface) {
  const url = 'User/Register';
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
export async function getFinalShareHolderType({
  onSuccess,
  onFail,
}: requestInterface) {
  try {
    const res = await request.get({
      baseUrl: LISTING_BASE_API,
      url: 'Finalshareholder/GetFinalShareHolderType',
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
export async function getFinalShareholderList({
  onSuccess,
  onFail,
  data,
}: requestInterface) {
  try {
    const res = await request.get({
      baseUrl: LISTING_BASE_API,
      url: 'Finalshareholder/FinalShareholderList',
      options: data,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
export async function getCompanyRegistrationTypes({
  onSuccess,
  onFail,
}: requestInterface) {
  try {
    const res = await request.get({
      baseUrl: LISTING_BASE_API,
      url: 'Company/CompanyRegistrationTypes',
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}

export async function getCompanyList({
  data,
  onSuccess,
  onFail,
}: requestInterface) {
  const url = 'Company/CompanyList';
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
export async function registerFinalShareholder({
  onSuccess,
  onFail,
  data,
}: requestInterface) {
  try {
    const res = await request.post({
      baseUrl: LISTING_BASE_API,
      url: 'Finalshareholder/Register',
      options: data,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}

export async function getCashList({
  data,
  onSuccess,
  onFail,
}: requestInterface) {
  const url = 'Cash/List';
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
export async function getFinalShareholderInfo({
  onSuccess,
  onFail,
  data,
}: requestInterface) {
  try {
    const res = await request.get({
      baseUrl: LISTING_BASE_API,
      url: 'Finalshareholder/FinalShareholderInfo',
      options: data,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}

export async function getCashInfo({
  data,
  onSuccess,
  onFail,
}: requestInterface) {
  const url = 'Cash/Find';
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
export async function getAuditingCompanyList({
  onSuccess,
  onFail,
  data,
}: requestInterface) {
  try {
    const res = await request.get({
      baseUrl: LISTING_BASE_API,
      url: 'Company/AuditingCompanyList',
      options: data,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}

export async function getCashType({
  data,
  onSuccess,
  onFail,
}: requestInterface) {
  const url = 'Cash/GetCashType';
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

export async function saveCash({ data, onSuccess, onFail }: requestInterface) {
  const url = 'Cash/Save';
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
export async function registerAuditingCompany({
  onSuccess,
  onFail,
  data,
}: requestInterface) {
  try {
    const res = await request.post({
      baseUrl: LISTING_BASE_API,
      url: 'Company/RegisterAuditingCompany',
      options: data,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
export async function getAuditingCompanyInfo({
  onSuccess,
  onFail,
  data,
}: requestInterface) {
  try {
    const res = await request.get({
      baseUrl: LISTING_BASE_API,
      url: 'Company/AuditingCompanyInfo',
      options: data,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
export async function getAuditingPostType({
  onSuccess,
  onFail,
  data,
}: requestInterface) {
  try {
    const res = await request.get({
      baseUrl: LISTING_BASE_API,
      url: 'Company/AuditingPostType',
      options: data,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}

export async function registerCompany({
  onSuccess,
  onFail,
  data,
}: requestInterface) {
  try {
    const res = await request.post({
      baseUrl: LISTING_BASE_API,
      url: 'Company/Register',
      options: data,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
export async function getCompanyInfo({
  onSuccess,
  onFail,
  data,
}: requestInterface) {
  try {
    const res = await request.get({
      baseUrl: LISTING_BASE_API,
      url: 'Company/CompanyInfo',
      options: data,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
export async function getCompanyTypes({
  onSuccess,
  onFail,
  data,
}: requestInterface) {
  try {
    const res = await request.get({
      baseUrl: LISTING_BASE_API,
      url: 'Company/CompanyTypes',
      options: data,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
export async function getCompanyUserPostTypes({
  onSuccess,
  onFail,
}: requestInterface) {
  try {
    const res = await request.get({
      baseUrl: LISTING_BASE_API,
      url: 'Company/CompanyUserPostTypes',
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}