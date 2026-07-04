import { request } from '@tse/tools';
import { USER_MANAGER_API } from '../../constants';

interface requestInterface {
  data: any;
  onSuccess: (e: any) => void;
  onFail: (e: any) => void;
}

export const getRole = ({ data, onSuccess, onFail }: requestInterface) => {
  const url = 'UserAccess/Role/1';
  request
    .get({
      baseUrl: USER_MANAGER_API,
      url,
      options: data,
    })
    .then((res) => onSuccess(res))
    .catch((err) => onFail(err));
};
export const getAccessRole = ({
  data,
  onSuccess,
  onFail,
}: requestInterface) => {
  const url = 'UserAccess/AccessRole/1';
  request
    .get({
      baseUrl: USER_MANAGER_API,
      url,
      options: data,
    })
    .then((res) => onSuccess(res))
    .catch((err) => onFail(err));
};
export const saveAccessRole = ({
  data,
  onSuccess,
  onFail,
}: requestInterface) => {
  const url = 'UserAccess/SaveAccessRole';
  request
    .post({
      baseUrl: USER_MANAGER_API,
      url,
      options: data,
    })
    .then((res) => onSuccess(res))
    .catch((err) => onFail(err));
};
export const getUserAccessRole = ({
  data,
  onSuccess,
  onFail,
}: requestInterface) => {
  const url = 'UserAccess/UserAccessRole';
  request
    .get({
      baseUrl: USER_MANAGER_API,
      url,
      options: data,
    })
    .then((res) => onSuccess(res))
    .catch((err) => onFail(err));
};
