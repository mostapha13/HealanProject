import withAlert from 'apps/cash-market/src/hoc/withAlert';
import {
  useStates,
  useEffect,
  useState,
  useNavigate,
  useSearchParams,
} from '@tse/utils';
import { Modal, Popconfirm, Radio } from 'antd';
import { SymbolModal, Table } from '@tse/components/organism';
import {
  Button,
  CheckList,
  Collapse,
  Icon,
  TextField,
  Upload,
} from '@tse/components/atoms';
import { uploadFile } from 'apps/cash-market/src/Controller';
import { HeaderTypes, onAlertProps } from '@tse/types';
import React, { useMemo } from 'react';
import { generateRandomNumber, separator } from '@tse/tools';
import type { RadioChangeEvent } from 'antd';

import {
  deleteWholesaleBuyerStatmentById,
  getWholesaleBuyerAbilityById,
  getWholesaleDenyReasons,
  saveWholesaleBuyerAbility,
  wholesaleBuyDeny,
} from 'apps/cash-market/src/Controller/StockMarket/WholeSale';
import NewSelect from 'apps/cash-market/src/components/atoms/NewSelect';
export interface SubmitDenyModalProps {
  isOpen?: boolean;
  onChangeState?: any;
  onAlert?: any;
  orderDetailData?: any;
  privateMessage?: string;
  publicMessage?: string;
}
export function SubmitDenyModal(props: SubmitDenyModalProps) {
  const initialState = {
    denyResonListData: [],
    wholesaleDenyReason: [],
    selectedDenyError: false,
  };
  const navigate = useNavigate();
  const [state, setState] = useStates<any>(initialState);
  const { denyResonListData, wholesaleDenyReason, selectedDenyError } = state;
  const {
    isOpen,
    onChangeState,
    onAlert,
    orderDetailData,
    privateMessage,
    publicMessage,
  } = props;
  useEffect(() => {
    handelGetWholesaleBuyDeny();
  }, [isOpen]);

  const setErrorMessage = (key: string) => {
    const errorMessage = '.';
    setState({ [`${key}Error`]: errorMessage });
  };
  const onFail = (error: any) => {
    // onAlert(error);
  };
  const handelGetWholesaleBuyDeny = () => {
    getWholesaleDenyReasons({
      onSuccess: (res) => {
        setState({ denyResonListData: res });
      },
      onFail,
    });
  };
  const validDenyResons =
    wholesaleDenyReason && wholesaleDenyReason?.length >= 1 ? true : false;

  const onSubmitClick = () => {
    if (validDenyResons) {
      const wholesaleDenyReasonId = wholesaleDenyReason?.map((item: any) => {
        return item?.id;
      });
      const data = {
        orderId: orderDetailData?.orderId,
        privateMessage: privateMessage,
        publicMessage: publicMessage,
        wholesaleBuyId: orderDetailData?.id,
        wholesaleDenyReasonId: wholesaleDenyReasonId,
      };
      wholesaleBuyDeny({
        data: data,
        onSuccess: (res) => {
          onChangeState('isSubmitDenyVisible', false);
          setState({ wholesaleDenyReason: [] });
          onAlert({
            type: 'success',
            message: 'درخواست شما با موفقیت ثبت گردید.',
          });
          navigate('/cartable');
        },
        onFail,
      });
    } else {
      setState({
        ...(!validDenyResons && { selectedDenyError: true }),
      });
    }
  };
  return (
    <>
      <Modal
        visible={isOpen}
        closable={false}
        style={{
          textAlign: 'center',
          padding: '0px',
        }}
        title={'دلایل رد درخواست'}
        footer={null}
        centered
        width={'40%'}
      >
        <div className="grid grid-cols-12  mt-8  !text-right">
          <CheckList
            className="col-span-12 "
            label="علت رد درخواست *"
            data={denyResonListData}
            showKey="name"
            idKey="id"
            // max={2}
            onChange={(value: any) =>
              setState({ wholesaleDenyReason: value, selectedDenyError: false })
            }
            required
            error={selectedDenyError}
            value={wholesaleDenyReason}
            // onSearch={onSearchBroker}
          />

          <div className="col-span-12 flex justify-center mt-14  ">
            <Button
              onClick={() => {
                setState({ wholesaleDenyReason: [] });
                onChangeState('isSubmitDenyVisible', false);
              }}
              className="bg-gray w-24 h-9  text-white "
            >
              بازگشت
            </Button>

            <Button
              onClick={onSubmitClick}
              className=" border-green border w-24 h-9 text-green mx-4 "
            >
              تایید
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
