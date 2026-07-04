import {  request } from '@tse/tools';
import { INSIDERY_BASE_API } from 'apps/cash-market/src/constants';

interface requestInterface {
  data?: any;
  onSuccess: (e: any) => void;
  onFail: (e: any) => void;
}

//----------------------Start user----------------------//

export const saveInsideryUser = ({
  data,
  onSuccess,
  onFail,
}: requestInterface) => {
  const url = 'user/Save';
  request
    .post({
      baseUrl: INSIDERY_BASE_API,
      url,
      options: data,
    })
    .then((res) => onSuccess(res))
    .catch((err) => onFail(err));
};

export async function getUserList({
  data,
  onSuccess,
  onFail,
}: requestInterface) {
  const url = 'User';
  try {
    const res = await request.get({
      baseUrl: INSIDERY_BASE_API,
      url,
      options: data,
    });
    onSuccess(res);
  } catch (error) {
    console.log(error);
    onFail(error);
  }
}

export async function getUsersInfo({
  data,
  onSuccess,
  onFail,
}: requestInterface) {
  const url = `user/${data.userId}`;

  try {
    const res = await request.get({
      baseUrl: INSIDERY_BASE_API,
      url,
      options: data,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}

export async function removeUser({
  data,
  onSuccess,
  onFail,
}: requestInterface) {
  const url = `user/${data.userId}`;
  try {
    const res = await request.delete({
      baseUrl: INSIDERY_BASE_API,
      url,
      options: data,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}

export async function changeUserStatus({
  data,
  onSuccess,
  onFail,
}: requestInterface) {
  const url = `user/deActive/${data.userId}`;
  try {
    const res = await request.post({
      baseUrl: INSIDERY_BASE_API,
      url,
      options: data,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}

//-----------End user------------------//

//----------------------Start common----------------------//
export async function getMenus({ onSuccess, onFail }: requestInterface) {
  const url = 'profile/menu';
  try {
    const res = await request.get({
      baseUrl: INSIDERY_BASE_API,
      url,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}

export const getInstrumentType = ({
  data,
  onSuccess,
  onFail,
}: requestInterface) => {
  const url = 'Instrument/InstrumentList/Fa';
  request
    .get({
      baseUrl: 'http://localhost:6817/MarketMaker/api/v1/',
      url,
      options: data,
    })
    .then((res) => onSuccess(res))
    .catch((err) => onFail(err));
};

export const getBrokerType = ({
  data,
  onSuccess,
  onFail,
}: requestInterface) => {
  const url = 'Broker/BrokerList/Fa';
  request
    .get({
      baseUrl: 'http://localhost:6817/MarketMaker/api/v1/',
      url,
      options: data,
    })
    .then((res) => onSuccess(res))
    .catch((err) => onFail(err));
};

export const getReasonType = ({ onSuccess, onFail }: requestInterface) => {
  const url = 'app/getTransactionReason';
  request
    .get({
      baseUrl: INSIDERY_BASE_API,
      url,
    })
    .then((res) => onSuccess(res))
    .catch((err) => onFail(err));
};

//-----------End common------------------//

//-----------Start staff------------------//

export async function getStaff({ onSuccess, onFail }: requestInterface) {
  const url = 'profile';
  try {
    const res = await request.get({
      baseUrl: INSIDERY_BASE_API,
      url,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}

export async function getstaffFamilyList({
  onSuccess,
  onFail,
}: requestInterface) {
  const url = 'app/getDependent';
  try {
    const res = await request.get({
      baseUrl: INSIDERY_BASE_API,
      url,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}

export const saveInsideryStaff = ({
  data,
  onSuccess,
  onFail,
}: requestInterface) => {
  const url = 'profile/save';
  request
    .post({
      baseUrl: INSIDERY_BASE_API,
      url,
      options: data,
    })
    .then((res) => onSuccess(res))
    .catch((err) => onFail(err));
};

//-----------End staff------------------//

//-----------Start staff transactios------------------//

export async function getStaffTransactions({
  data,
  onSuccess,
  onFail,
}: requestInterface) {
  const url = 'userTransaction';
  try {
    const res = await request.get({
      baseUrl: INSIDERY_BASE_API,
      url,
      options: data,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}

export const saveStaffTransaction = ({
  data,
  onSuccess,
  onFail,
}: requestInterface) => {
  const url = 'userTransaction/save';
  request
    .post({
      baseUrl: INSIDERY_BASE_API,
      url,
      options: data,
    })
    .then((res) => onSuccess(res))
    .catch((err) => onFail(err));
};

export async function getStaffTransaction({
  data,
  onSuccess,
  onFail,
}: requestInterface) {
  const url = `userTransaction/${data.id}`;
  try {
    const res = await request.get({
      baseUrl: INSIDERY_BASE_API,
      url,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}

export async function removeStaffTransaction({
  data,
  onSuccess,
  onFail,
}: requestInterface) {
  const url = `userTransaction/${data.id}`;
  try {
    const res = await request.delete({
      baseUrl: INSIDERY_BASE_API,
      url,
      options: data,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}

//-----------End staff transactions------------------//

//-----------Start staff family------------------//

export const saveStaffFamily = ({
  data,
  onSuccess,
  onFail,
}: requestInterface) => {
  console.log(data);
  const url = 'relativeProfile/save';
  request
    .post({
      baseUrl: INSIDERY_BASE_API,
      url,
      options: data,
    })
    .then((res) => onSuccess(res))
    .catch((err) => onFail(err));
};

export async function getStaffFamilyInfo({
  data,
  onSuccess,
  onFail,
}: requestInterface) {
  const url = `relativeProfile/${data.userId}`;
  try {
    const res = await request.get({
      baseUrl: INSIDERY_BASE_API,
      url,
      options: data,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}

export async function removeStaffFamily({
  data,
  onSuccess,
  onFail,
}: requestInterface) {
  const url = `relativeProfile/${data.userId}`;
  try {
    const res = await request.delete({
      baseUrl: INSIDERY_BASE_API,
      url,
      options: data,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}

export async function getStaffFamilyData({
  onSuccess,
  onFail,
}: requestInterface) {
  const url = 'profile/userDependent';
  try {
    const res = await request.get({
      baseUrl: INSIDERY_BASE_API,
      url,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}

export async function getStaffFamilyListData({
  data,
  onSuccess,
  onFail,
}: requestInterface) {
  const url = 'relativeProfile';
  try {
    const res = await request.get({
      baseUrl: INSIDERY_BASE_API,
      url,
      options: data,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}

//-----------End staff family------------------//

//-----------Start staff family transaction------------------//

export const saveStaffFamilyTransaction = ({
  data,
  onSuccess,
  onFail,
}: requestInterface) => {
  const url = 'relativeTransactions/save';
  request
    .post({
      baseUrl: INSIDERY_BASE_API,
      url,
      options: data,
    })
    .then((res) => onSuccess(res))
    .catch((err) => onFail(err));
};

export const getStaffFamily = ({ onSuccess, onFail }: requestInterface) => {
  const url = 'relativeTransactions/users';
  request
    .get({
      baseUrl: INSIDERY_BASE_API,
      url,
    })
    .then((res) => onSuccess(res))
    .catch((err) => onFail(err));
};

export async function removeStaffFamilyTransaction({
  data,
  onSuccess,
  onFail,
}: requestInterface) {
  const url = `relativeTransactions/${data.id}`;
  try {
    const res = await request.delete({
      baseUrl: INSIDERY_BASE_API,
      url,
      options: data,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}

export async function getStaffFamilyTransactionInfo({
  data,
  onSuccess,
  onFail,
}: requestInterface) {
  const url = `relativeTransactions/${data.id}`;
  try {
    const res = await request.get({
      baseUrl: INSIDERY_BASE_API,
      url
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}

export async function getStaffFamilyTransactionListData({
  data,
  onSuccess,
  onFail,
}: requestInterface) {
  const url = 'relativeTransactions';
  try {
    const res = await request.get({
      baseUrl: INSIDERY_BASE_API,
      url,
      options: data,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}

//-----------End staff family transaction------------------//

//-----------Start done------------------//

export const done = ({ onSuccess, onFail }: requestInterface) => {
  const url = 'profile/done';
  request
    .post({
      baseUrl: INSIDERY_BASE_API,
      url,
    })
    .then((res) => onSuccess(res))
    .catch((err) => onFail(err));
};

//-----------End done------------------//
