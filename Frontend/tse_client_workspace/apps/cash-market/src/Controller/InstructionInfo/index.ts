import { request } from '@tse/tools';
import { BASE_URL } from '../../constants';

interface requestInterface {
  data?: any;
  onSuccess: (e: any) => void;
  onFail: (e: any) => void;
}

export const getInstructionSummaryList = ({
  onSuccess,
  onFail,
}: requestInterface) => {
  const url = 'InstructionInfo/InstructionSummary/Fa';
  request
    .get({
      baseUrl: BASE_URL,
      url,
    })
    .then((res) => onSuccess(res))
    .catch((err) => onFail(err));
};

export const saveInstructionFile = ({
  data,
  onSuccess,
  onFail,
}: requestInterface) => {
  const url = 'InstructionInfo/SaveInstructionFile';
  request
    .post({
      baseUrl: BASE_URL,
      url,
      options: data,
    })
    .then((res) => onSuccess(res))
    .catch((err) => onFail(err));
};
