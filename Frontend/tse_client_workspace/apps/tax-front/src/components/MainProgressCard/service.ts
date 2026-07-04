import { loadFromStorage, request } from '@tse/tools';
import { baseUrl } from '../../constants';

interface ReturnType {
  onSuccess: (param: any) => void;
  onFail: (error: any) => void;
}

interface ResultType extends ReturnType {
  id?: number;
  indicatorNumber?: number;
  periodId?: number;
  packetSendState?: number;
  processState?: number;
}

export async function changePacketSendState({
  onSuccess,
  onFail,
  id,
  indicatorNumber,
  periodId,
  packetSendState,
}: ResultType) {
  try {
    const res = await request.post({
      baseUrl,
      url: 'Invoice/ChangePacketSendState',
      options: {
        id: id,
        indicatorNumber: indicatorNumber,
        periodId: periodId,
        packetSendState: packetSendState,
      },
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
