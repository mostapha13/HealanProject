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
  Collapse,
  Icon,
  TextField,
  Upload,
} from '@tse/components/atoms';
import { HeaderTypes, onAlertProps } from '@tse/types';

import React, { useMemo } from 'react';
import { generateRandomNumber } from '@tse/tools';
export interface SubmitManagerDataModalProps {
  isOpen?: any;
  onChangeState?: any;
  className?: string;
  parentTableId?: string;
  wholesaleBuyerInfoId?: string;
  onAlert?: any;
  onSubmitBoardMembers?: any;
  data?: any;
}
export function SubmitManagerDataModal(props: SubmitManagerDataModalProps) {
  const initialState = {
    wholesaleBuyerInfoBoards: [],
    fname: '',
    lname: '',
    buyerCode: '',
    fnameError: '',
    lnameError: '',
    buyerCodeError: '',
    tableEditItemId: '',
  };
  const [state, setState] = useStates<any>(initialState);
  const { wholesaleBuyerInfoBoards, fname, lname, buyerCode, tableEditItemId } =
    state;
  const {
    isOpen,
    onChangeState,
    parentTableId,
    wholesaleBuyerInfoId,
    onSubmitBoardMembers,
    data,
    onAlert,
  } = props;
  useEffect(() => {
    if (data != undefined && data.length > 0) {
      setState({ wholesaleBuyerInfoBoards: data });
    } else {
      setState({ wholesaleBuyerInfoBoards: [] });
    }
  }, [data, isOpen]);
  const submitManagerColumns: HeaderTypes[] = [
    {
      title: 'نام',
      dataIndex: 'fname',
      className: 'col-span-3 !justify-start',
      key: 'fname',
    },
    {
      title: 'نام خانوادگی',
      dataIndex: 'lname',
      className: 'col-span-3 !justify-start',
      key: 'lname',
    },
    {
      title: 'کد ملی',
      dataIndex: 'buyerCode',
      className: 'col-span-3 !justify-start',
      key: 'buyerCode',
    },
    {
      title: 'عملیات',
      dataIndex: 'action',
      key: 'action',
      className: 'col-span-2 !justify-start',
      render: (_: any, item: any) => (
        <div className="flex flex-row items-center justify-center">
          <Icon
            name="icon-edit"
            classname="text-green text-lg cursor-pointer"
            onClick={() => onEditBoardMember(item)}
          />
          <Popconfirm
            title="آیا اطمینان دارید؟"
            okText="بله"
            cancelText="خیر"
            onConfirm={() => onRemoveBoardMember(item)}
          >
            <Icon
              name="icon-delete"
              classname="text-red text-lg cursor-pointer"
            />
          </Popconfirm>
        </div>
      ),
    },
  ];
  const setErrorMessage = (key: string) => {
    const errorMessage = '.';
    setState({ [`${key}Error`]: errorMessage });
  };
  const onEditBoardMember = (item: any) => {
    setState({
      fname: item?.fname,
      lname: item?.lname,
      buyerCode: item?.buyerCode,
      tableEditItemId: item?.tableId,
    });
  };
  const onRemoveBoardMember = (record: any) => {
    const newList = wholesaleBuyerInfoBoards.filter(
      (item: any) => item.tableId !== record.tableId
    );
    setState({
      wholesaleBuyerInfoBoards: newList,
    });
  };
  const onAddBoardMembersClick = () => {
    if (fname && lname && buyerCode) {
      const index = wholesaleBuyerInfoBoards.findIndex((object: any) => {
        return object.tableId === tableEditItemId;
      });
      if (index !== -1) {
        setState({
          wholesaleBuyerInfoBoards: [
            ...wholesaleBuyerInfoBoards.slice(0, index),
            {
              wholesaleBuyerInfoId: wholesaleBuyerInfoId,
              fname: fname,
              lname: lname,
              buyerCode: buyerCode,
              tableId: tableEditItemId,
            },
            ...wholesaleBuyerInfoBoards.slice(index + 1),
          ],
          fname: '',
          lname: '',
          buyerCode: '',
          tableEditItemId: null,
        });
      } else {
        setState({
          wholesaleBuyerInfoBoards: [
            ...wholesaleBuyerInfoBoards,
            {
              wholesaleBuyerInfoId: wholesaleBuyerInfoId,
              fname: fname,
              lname: lname,
              buyerCode: buyerCode,
              tableId: generateRandomNumber(),
            },
          ],
          fname: '',
          lname: '',
          buyerCode: '',
        });
      }
    } else {
      !fname && setErrorMessage('fname');
      !lname && setErrorMessage('lname');
      !buyerCode && setErrorMessage('buyerCode');
    }
  };
  return (
    <>
      <Modal
        visible={isOpen}
        closable={false}
        style={{ textAlign: 'center', padding: '0px' }}
        title={'ثبت اطلاعات مدیران'}
        footer={null}
        centered
        width={'70%'}
      >
        <div className="grid grid-cols-12 gap-4 ">
          <TextField
            label="نام"
            className="2xl:col-span-3 xl:col-span-3 lg:col-span-6 md:col-span-6  sm:col-span-6"
            value={fname}
            onChange={(value: any) =>
              setState({
                fname: value,
                fnameError: '',
              })
            }
            required
            errorMessage={state?.fnameError}
          />
          <TextField
            label="نام خانوادگی"
            className="2xl:col-span-3 xl:col-span-3 lg:col-span-6 md:col-span-6  sm:col-span-6"
            value={lname}
            onChange={(value: any) =>
              setState({
                lname: value,
                lnameError: '',
              })
            }
            required
            errorMessage={state?.lnameError}
          />
          <TextField
            label="کد ملی"
            className="2xl:col-span-3 xl:col-span-3 lg:col-span-6 md:col-span-6  sm:col-span-6"
            value={buyerCode}
            onChange={(value: any) =>
              setState({
                buyerCode: value,
                buyerCodeError: '',
              })
            }
            required
            errorMessage={state?.buyerCodeError}
            maxLength={11}
          />
          <div className="2xl:col-span-3 xl:col-span-3 lg:col-span-6 md:col-span-6  sm:col-span-6 flex justify-center">
            <Button
              onClick={onAddBoardMembersClick}
              className="bg-green w-24 h-9 text-white "
            >
              تایید و اضافه
            </Button>
          </div>
          <div className="col-span-12 my-10">
            <Table
              columns={submitManagerColumns}
              className="col-span-12 grid grid-cols-12 text-center"
              dataSource={wholesaleBuyerInfoBoards}
              //   scroll={{ x: 'calc(700px + 30%)' }}
              pageSize={1000}
            />
          </div>
          <div className="col-span-12 flex justify-end ">
            <Button
              onClick={() => {
                setState({ wholesaleBuyerInfoBoards: [] });
                onChangeState('isSubmitManagerVisible', false);
              }}
              className="bg-gray w-24 h-9 mx-4 text-white "
            >
              بازگشت
            </Button>
            <Button
              onClick={() => {
                if (wholesaleBuyerInfoBoards?.length > 0) {
                  onSubmitBoardMembers(parentTableId, wholesaleBuyerInfoBoards);
                  onChangeState('isSubmitManagerVisible', false);
                } else {
                  onAlert({
                    message: `لطفا اطلاعات مدیران را وارد نمایید.`,
                    type: 'error',
                  });
                }
              }}
              className="bg-blue w-24 h-9 text-white "
            >
              ثبت اطلاعات
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
