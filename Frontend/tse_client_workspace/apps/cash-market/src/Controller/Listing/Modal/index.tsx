import { request } from '@tse/tools';
import { LISTING_BASE_API } from 'apps/cash-market/src/constants';

interface requestInterface {
  data?: any;
  onSuccess: (e: any) => void;
  onFail: (e: any) => void;
}
interface ResultType extends requestInterface {
  orderId?: string;
  url?: any;
}

//////Dosier Date///////////

export async function findDossierDates({
  data,
  onSuccess,
  onFail,
  url,
}: ResultType) {
  const newUrl = url?.split('v1/')?.[1];

  try {
    const res = await request.get({
      baseUrl: LISTING_BASE_API,
      url: newUrl,
      options: data,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}

export async function saveDossierDate({
  data,
  onSuccess,
  onFail,
  url,
}: ResultType) {
  const newUrl = url?.split('v1/')?.[1];

  try {
    const res = await request.post({
      baseUrl: LISTING_BASE_API,
      url: newUrl,
      options: data,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}

export async function rejectDossierDate({
  data,
  onSuccess,
  onFail,
  url,
}: ResultType) {
  const newUrl = url?.split('v1/')?.[1];

  try {
    const res = await request.post({
      baseUrl: LISTING_BASE_API,
      url: newUrl,
      options: data,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}

export async function confirmDossierDate({
  data,
  onSuccess,
  onFail,
  url,
}: ResultType) {
  const newUrl = url?.split('v1/')?.[1];

  try {
    const res = await request.post({
      baseUrl: LISTING_BASE_API,
      url: newUrl,
      options: data,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}

////////////Dosier Percent/////////////

export async function findDossierDPercent({
  data,
  url,
  onSuccess,
  onFail,
}: ResultType) {
  const newUrl = url?.split('v1/')?.[1];
  try {
    const res = await request.get({
      baseUrl: LISTING_BASE_API,
      url: newUrl,
      options: data,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}

export async function saveDossierPercent({
  data,
  url,
  onSuccess,
  onFail,
}: ResultType) {
  const newUrl = url?.split('v1/')?.[1];
  try {
    const res = await request.post({
      baseUrl: LISTING_BASE_API,
      url: newUrl,
      options: data,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}

export async function rejectDossierPercent({
  data,
  url,
  onSuccess,
  onFail,
}: ResultType) {
  const newUrl = url?.split('v1/')?.[1];
  try {
    const res = await request.post({
      baseUrl: LISTING_BASE_API,
      url: newUrl,
      options: data,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}

export async function confirmDossierPercent({
  data,
  url,
  onSuccess,
  onFail,
}: ResultType) {
  const newUrl = url?.split('v1/')?.[1];
  try {
    const res = await request.post({
      baseUrl: LISTING_BASE_API,
      url: newUrl,
      options: data,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}

//////////Dossier Number////////////////

export async function findDossierNumeric({
  data,
  url,
  onSuccess,
  onFail,
}: ResultType) {
  const newUrl = url?.split('v1/')?.[1];
  try {
    const res = await request.get({
      baseUrl: LISTING_BASE_API,
      url: newUrl,
      options: data,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}

export async function saveDossierNumeric({
  data,
  url,
  onSuccess,
  onFail,
}: ResultType) {
  const newUrl = url?.split('v1/')?.[1];
  try {
    const res = await request.post({
      baseUrl: LISTING_BASE_API,
      url: newUrl,
      options: data,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}

export async function rejectDossierNumeric({
  data,
  url,
  onSuccess,
  onFail,
}: ResultType) {
  const newUrl = url?.split('v1/')?.[1];
  try {
    const res = await request.post({
      baseUrl: LISTING_BASE_API,
      url: newUrl,
      options: data,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}

export async function confirmDossierNumeric({
  data,
  url,
  onSuccess,
  onFail,
}: ResultType) {
  const newUrl = url?.split('v1/')?.[1];
  try {
    const res = await request.post({
      baseUrl: LISTING_BASE_API,
      url: newUrl,
      options: data,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}

////////////Diser text///////////////

export async function findDossierText({
  data,
  url,
  onSuccess,
  onFail,
}: ResultType) {
  const newUrl = url?.split('v1/')?.[1];
  try {
    const res = await request.get({
      baseUrl: LISTING_BASE_API,
      url: newUrl,
      options: data,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}

export async function saveDossierText({
  data,
  url,
  onSuccess,
  onFail,
}: ResultType) {
  const newUrl = url?.split('v1/')?.[1];
  try {
    const res = await request.post({
      baseUrl: LISTING_BASE_API,
      url: newUrl,
      options: data,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}

export async function rejectDossierText({
  data,
  url,
  onSuccess,
  onFail,
}: ResultType) {
  const newUrl = url?.split('v1/')?.[1];
  try {
    const res = await request.post({
      baseUrl: LISTING_BASE_API,
      url: newUrl,
      options: data,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}

export async function confirmDossierText({
  data,
  url,
  onSuccess,
  onFail,
}: ResultType) {
  const newUrl = url?.split('v1/')?.[1];
  try {
    const res = await request.post({
      baseUrl: LISTING_BASE_API,
      url: newUrl,
      options: data,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}

///// general modal/////////////

export async function confirmGeneralDossierModal({
  onSuccess,
  onFail,
  data,
}: requestInterface) {
  try {
    const res = await request.post({
      baseUrl: LISTING_BASE_API,
      url: 'Dossier/Confirm',
      options: data,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}

export async function rejectGeneralDossierModal({
  onSuccess,
  onFail,
  data,
}: requestInterface) {
  try {
    const res = await request.post({
      baseUrl: LISTING_BASE_API,
      url: 'Dossier/Reject',
      options: data,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}

export async function irrevelenteGeneralDossierModal({
  onSuccess,
  onFail,
  data,
}: requestInterface) {
  try {
    const res = await request.post({
      baseUrl: LISTING_BASE_API,
      url: 'Dossier/Irrevelente',
      options: data,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}

export async function revelenteGeneralDossierModal({
  onSuccess,
  onFail,
  data,
}: requestInterface) {
  try {
    const res = await request.post({
      baseUrl: LISTING_BASE_API,
      url: 'Dossier/Revelente',
      options: data,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}

////////////dossier select modal/////////////////

export async function findDossierSimpleSelect({
  data,
  url,
  onSuccess,
  onFail,
}: ResultType) {
  const newUrl = url?.split('v1/')?.[1];
  try {
    const res = await request.get({
      baseUrl: LISTING_BASE_API,
      url: newUrl,
      options: data,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}

export async function saveDossierSimpleSelect({
  data,
  url,
  onSuccess,
  onFail,
}: ResultType) {
  const newUrl = url?.split('v1/')?.[1];
  try {
    const res = await request.post({
      baseUrl: LISTING_BASE_API,
      url: newUrl,
      options: data,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}

export async function rejectDossierSimpleSelect({
  data,
  url,
  onSuccess,
  onFail,
}: ResultType) {
  const newUrl = url?.split('v1/')?.[1];
  try {
    const res = await request.post({
      baseUrl: LISTING_BASE_API,
      url: newUrl,
      options: data,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}

export async function confirmDossierSimpleSelect({
  data,
  url,
  onSuccess,
  onFail,
}: ResultType) {
  const newUrl = url?.split('v1/')?.[1];
  try {
    const res = await request.post({
      baseUrl: LISTING_BASE_API,
      url: newUrl,
      options: data,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}

export async function getDossierSimpleSelectListData({
  data,
  url,
  onSuccess,
  onFail,
}: ResultType) {
  const newUrl = url?.split('v1/')?.[1];
  try {
    const res = await request.get({
      baseUrl: LISTING_BASE_API,
      url: newUrl,
      options: data,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}

////////////Diser TextArea///////////////

export async function findDossierTextArea({
  data,
  url,
  onSuccess,
  onFail,
}: ResultType) {
  const newUrl = url?.split('v1/')?.[1];
  try {
    const res = await request.get({
      baseUrl: LISTING_BASE_API,
      url: newUrl,
      options: data,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}

export async function saveDossierTextArea({
  data,
  url,
  onSuccess,
  onFail,
}: ResultType) {
  const newUrl = url?.split('v1/')?.[1];
  try {
    const res = await request.post({
      baseUrl: LISTING_BASE_API,
      url: newUrl,
      options: data,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}

export async function rejectDossierTextArea({
  data,
  url,
  onSuccess,
  onFail,
}: ResultType) {
  const newUrl = url?.split('v1/')?.[1];
  try {
    const res = await request.post({
      baseUrl: LISTING_BASE_API,
      url: newUrl,
      options: data,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}

export async function confirmDossierTextArea({
  data,
  url,
  onSuccess,
  onFail,
}: ResultType) {
  const newUrl = url?.split('v1/')?.[1];
  try {
    const res = await request.post({
      baseUrl: LISTING_BASE_API,
      url: newUrl,
      options: data,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
////////////////////////Dossier File///////////////////
export async function findDossierFile({
  data,
  url,
  onSuccess,
  onFail,
}: ResultType) {
  const newUrl = url?.split('v1/')?.[1];
  try {
    const res = await request.get({
      baseUrl: LISTING_BASE_API,
      url: newUrl,
      options: data,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
export async function saveDossierFile({
  data,
  url,
  onSuccess,
  onFail,
}: ResultType) {
  const newUrl = url?.split('v1/')?.[1];
  try {
    const res = await request.post({
      baseUrl: LISTING_BASE_API,
      url: newUrl,
      options: data,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
export async function confirmDossierFile({
  data,
  url,
  onSuccess,
  onFail,
}: ResultType) {
  const newUrl = url?.split('v1/')?.[1];
  try {
    const res = await request.post({
      baseUrl: LISTING_BASE_API,
      url: newUrl,
      options: data,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
export async function rejectDossierFile({
  data,
  url,
  onSuccess,
  onFail,
}: ResultType) {
  const newUrl = url?.split('v1/')?.[1];
  try {
    const res = await request.post({
      baseUrl: LISTING_BASE_API,
      url: newUrl,
      options: data,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}

/////Dosier Fiscal Year///////////

export async function findDossierFiscalYears({
  data,
  onSuccess,
  onFail,
  url,
}: ResultType) {
  const newUrl = url?.split('v1/')?.[1];

  try {
    const res = await request.get({
      baseUrl: LISTING_BASE_API,
      url: newUrl,
      options: data,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}

export async function saveDossierFiscalYear({
  data,
  onSuccess,
  onFail,
  url,
}: ResultType) {
  const newUrl = url?.split('v1/')?.[1];

  try {
    const res = await request.post({
      baseUrl: LISTING_BASE_API,
      url: newUrl,
      options: data,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}

export async function confirmDossierFiscalYear({
  data,
  url,
  onSuccess,
  onFail,
}: ResultType) {
  const newUrl = url?.split('v1/')?.[1];
  try {
    const res = await request.post({
      baseUrl: LISTING_BASE_API,
      url: newUrl,
      options: data,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}

export async function rejectDossierFiscalYear({
  data,
  onSuccess,
  onFail,
  url,
}: ResultType) {
  const newUrl = url?.split('v1/')?.[1];

  try {
    const res = await request.post({
      baseUrl: LISTING_BASE_API,
      url: newUrl,
      options: data,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
export async function receiptAdmissionType({ onSuccess, onFail }: ResultType) {
  const url = 'DossierReceiptAdmission/ReceiptAdmissionType';

  try {
    const res = await request.get({
      baseUrl: LISTING_BASE_API,
      url,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
export async function modificationAssociation({
  onSuccess,
  onFail,
}: ResultType) {
  const url = 'DossierModificationAssociation/ModificationAssociation';

  try {
    const res = await request.get({
      baseUrl: LISTING_BASE_API,
      url,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
export async function valueAddedType({ onSuccess, onFail }: ResultType) {
  const url = 'DossierValueAddedTax/ValueAddedType';

  try {
    const res = await request.get({
      baseUrl: LISTING_BASE_API,
      url,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}

///////////////General meeting select api

export async function generalMeetingSelectApi({
  data,
  onSuccess,
  onFail,
  url,
}: ResultType) {
  const newUrl = url?.split('v1/')?.[1];

  try {
    const res = await request.get({
      baseUrl: LISTING_BASE_API,
      url: newUrl,
      options: data,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}

export async function generalMeetingRadioButtonApi({
  onSuccess,
  onFail,
  data,
}: requestInterface) {
  try {
    const res = await request.get({
      baseUrl: LISTING_BASE_API,
      url: 'DossierGeneralMeeting/GeneralMeetingType',
      options: data,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
///////////////Insidery information api

export async function insideryInformationRadioButtonApi({
  onSuccess,
  onFail,
  data,
}: requestInterface) {
  try {
    const res = await request.get({
      baseUrl: LISTING_BASE_API,
      url: 'DossierInsiderInformation/InsiderInformationType',
      options: data,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
/////////////////////////////allLegalProceedingApi///////
export async function allLegalProceedingType({
  onSuccess,
  onFail,
  data,
}: requestInterface) {
  try {
    const res = await request.get({
      baseUrl: LISTING_BASE_API,
      url: 'DossierAllLegalProceeding/AllLegalProceedingType',
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
//////////DossierMajorAssetsApi///////////

export async function majorAssetDocsRadioButtonApi({
  onSuccess,
  onFail,
}: requestInterface) {
  try {
    const res = await request.get({
      baseUrl: LISTING_BASE_API,
      url: 'DossierMajorAsset/DossierDataMajorAssetType',
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
//////////DossierOtherDocumentsApi///////////

export async function OtherDocumentsRadioButtonApi({
  onSuccess,
  onFail,
}: requestInterface) {
  try {
    const res = await request.get({
      baseUrl: LISTING_BASE_API,
      url: 'DossierOtherAcceptance/OtherAcceptanceType',
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}

//////////////////////////inquiryApplicantCompanyApi//////////////////

export async function inquiryApplicantCompanyType({
  onSuccess,
  onFail,
}: requestInterface) {
  try {
    const res = await request.get({
      baseUrl: LISTING_BASE_API,
      url: 'DossierInquiryApplicantCompany/InquiryApplicantCompanyType',
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}

//////////////////////////////public/////////////////////

export async function modalFindApi({
  data,
  onSuccess,
  onFail,
  url,
}: ResultType) {
  const newUrl = url?.split('v1/')?.[1];

  try {
    const res = await request.get({
      baseUrl: LISTING_BASE_API,
      url: newUrl,
      options: data,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
export async function modalSaveApi({
  data,
  onSuccess,
  onFail,
  url,
}: ResultType) {
  const newUrl = url?.split('v1/')?.[1];

  try {
    const res = await request.post({
      baseUrl: LISTING_BASE_API,
      url: newUrl,
      options: data,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
export async function modalConfirmApi({
  data,
  onSuccess,
  onFail,
  url,
}: ResultType) {
  const newUrl = url?.split('v1/')?.[1];

  try {
    const res = await request.post({
      baseUrl: LISTING_BASE_API,
      url: newUrl,
      options: data,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
export async function modalRejectApi({
  data,
  onSuccess,
  onFail,
  url,
}: ResultType) {
  const newUrl = url?.split('v1/')?.[1];

  try {
    const res = await request.post({
      baseUrl: LISTING_BASE_API,
      url: newUrl,
      options: data,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
export async function modalListComponentApi({
  data,
  onSuccess,
  onFail,
  url,
}: ResultType) {
  const newUrl = url?.split('v1/')?.[1];

  try {
    const res = await request.get({
      baseUrl: LISTING_BASE_API,
      url: newUrl,
      options: data,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
