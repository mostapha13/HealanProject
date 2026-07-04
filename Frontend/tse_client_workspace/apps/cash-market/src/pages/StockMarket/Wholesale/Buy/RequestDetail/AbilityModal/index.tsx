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
import { uploadFile } from 'apps/cash-market/src/Controller';
import { HeaderTypes, onAlertProps } from '@tse/types';
import React, { useMemo } from 'react';
import { generateRandomNumber, separator, yearGeneratorPast } from '@tse/tools';
import type { RadioChangeEvent } from 'antd';

import {
  deleteWholesaleBuyerStatmentById,
  getWholesaleBuyerAbilityById,
  saveWholesaleBuyerAbility,
} from 'apps/cash-market/src/Controller/StockMarket/WholeSale';
import NewSelect from 'apps/cash-market/src/components/atoms/NewSelect';
export interface SubmitInqueryDataModalProps {
  isOpen?: boolean;
  onChangeState?: any;
  onAlert?: any;
  wholesaleBuyerInfoId?: string;
  personTypeId?: string;
  orderDetailData?: any;
  onSuccessSave?: any;
  buyerInfoData?: any;
  isDeputyPage?: boolean;
  isDetailPage?: boolean;
  isUploadDocPage?: boolean;
  isDetailPageWithoutEnterData?: boolean;
  orderId?: any;
}
export function SubmitAbilityDataModal(props: SubmitInqueryDataModalProps) {
  const initialState = {
    viewMode: '',
    personTypeName: '',
    hasCommitment: true,
    hasThreeYear: true,
    minimumAbility: '',
    minimumAbilityError: false,
    wholesaleStatementTypeId: '',
    wholesaleStatementTypeName: '',
    abilityYear: '',
    proprietaryRights: '',
    proprietaryRightsError: false,
    abilityDescription: '',
    abilityDescriptionError: false,
    wholesaleAbilityStatements: [],
    wholesaleAbilityData: null,
    editMode: false,
    listId: '',
    minAbilityPrice: '',
    price: '',
    priceError: false,
  };
  const [state, setState] = useStates<any>(initialState);
  const {
    viewMode,
    personTypeName,
    hasCommitment,
    hasThreeYear,
    minimumAbility,
    minimumAbilityError,
    wholesaleStatementTypeId,
    wholesaleStatementTypeName,
    abilityYear,
    proprietaryRights,
    proprietaryRightsError,
    abilityDescription,
    abilityDescriptionError,
    wholesaleAbilityStatements,
    wholesaleAbilityData,
    editMode,
    listId,
    minAbilityPrice,
    price,
    priceError,
  } = state;
  const {
    isOpen,
    onChangeState,
    onAlert,
    wholesaleBuyerInfoId,
    personTypeId,
    orderDetailData,
    onSuccessSave,
    buyerInfoData,
    isDeputyPage,
    isDetailPage,
    isUploadDocPage,
    isDetailPageWithoutEnterData,
    orderId,
  } = props;
  console.log('buyerInfoData', buyerInfoData);
  const wholesaleStatementTypeData = [
    { name: 'اصلی', id: 1 },
    { name: 'تلفیقی', id: 2 },
  ];
  const abilityYearData = yearGeneratorPast(10);
  const abilityColumns: HeaderTypes[] = [
    {
      title: 'نوع صورت مالی',
      dataIndex: 'wholesaleStatementTypeId',
      className: 'col-span-2 !justify-start',
      key: 'wholesaleStatementTypeId',
      render: (item: any) => (
        <span>{item === 1 ? 'اصلی' : item === 2 ? 'تلفیقی' : ''}</span>
      ),
    },
    {
      title: 'سال',
      dataIndex: 'abilityYear',
      className: 'col-span-2 !justify-start',
      key: 'abilityYear',
    },
    {
      title: hasThreeYear
        ? 'حقوق صاحبان سهام'
        : 'آخرین سرمایه پرداخت شده متقاضی',
      dataIndex: 'proprietaryRights',
      className: 'col-span-2 !justify-start',
      key: 'proprietaryRights',
      render: (item: any) => <span>{separator(item)}</span>,
    },
    {
      title: 'توضیحات',
      dataIndex: 'abilityDescription',
      className: 'col-span-4 !justify-start',
      key: 'abilityDescription',
    },
    {
      title: 'عملیات',
      dataIndex: 'action',
      key: 'action',
      className: 'col-span-1 !justify-start',
      render: (_: any, item: any) => (
        <div className="flex flex-row items-center justify-center">
          <Icon
            name="icon-edit"
            classname="text-green text-lg cursor-pointer"
            onClick={() => onEditAbility(item)}
          />
          <Popconfirm
            title="آیا اطمینان دارید؟"
            okText="بله"
            cancelText="خیر"
            onConfirm={() => onRemoveAbilityItem(item?.id)}
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
  const isDeputyAbilityColumns: HeaderTypes[] = [
    {
      title: 'نوع صورت مالی',
      dataIndex: 'wholesaleStatementTypeName',
      className: 'col-span-2 !justify-start',
      key: 'wholesaleStatementTypeId',
    },
    {
      title: 'سال',
      dataIndex: 'abilityYear',
      className: 'col-span-2 !justify-start',
      key: 'abilityYear',
    },
    {
      title: hasThreeYear
        ? 'حقوق صاحبان سهام'
        : 'آخرین سرمایه پرداخت شده متقاضی',
      dataIndex: 'proprietaryRights',
      className: 'col-span-3 !justify-start',
      key: 'proprietaryRights',
      render: (item: any) => <span>{separator(item)}</span>,
    },
    {
      title: 'توضیحات',
      dataIndex: 'abilityDescription',
      className: 'col-span-4 !justify-start',
      key: 'abilityDescription',
    },
  ];

  useEffect(() => {
    switch (personTypeId) {
      case '9fb49b1b-9247-47bd-b873-5003da94d906':
        setState({ viewMode: 'out', personTypeName: 'خارجی' });
        break;
      case 'cafd25d9-4948-4b97-b3ec-9761e4496e01':
        setState({ viewMode: 'legal', personTypeName: 'حقوقی' });
        break;
      case '5882faca-e9d3-4329-b19c-c92eec610c62':
        setState({ viewMode: 'basket', personTypeName: 'سبد' });
        break;
      case '25a0a62a-6a39-44b3-a8f6-cde56eb50f0a':
        setState({ viewMode: 'real', personTypeName: 'حقیقی' });
        break;
    }
  }, [personTypeId]);
  useEffect(() => {
    if (isOpen) {
      getWholesaleBuyerAbilityByIdData();
    }
  }, [wholesaleBuyerInfoId, isOpen]);
  useEffect(() => {
    if (
      orderDetailData?.isPrivatization &&
      orderDetailData?.cashSharePercent >= 20
    ) {
      const minAbility =
        (((2 / 10) * (100 - orderDetailData?.cashSharePercent)) / 100) *
        price *
        buyerInfoData?.buyCount *
        buyerInfoData?.buyPercent;
      setState({ minAbilityPrice: minAbility?.toFixed(0) });
    } else {
      const minAbility =
        (((4 / 10) * (100 - orderDetailData?.cashSharePercent)) / 100) *
        price *
        buyerInfoData?.buyCount *
        buyerInfoData?.buyPercent;
      setState({ minAbilityPrice: minAbility?.toFixed(0) });
    }
  }, [price]);
  const onFail = (error: any) => {
    onAlert(error);
  };
  const getWholesaleBuyerAbilityByIdData = () => {
    getWholesaleBuyerAbilityById({
      data: {
        WholesaleBuyerInfoId: wholesaleBuyerInfoId,
      },
      onSuccess: (res) => {
        if (
          personTypeId === '9fb49b1b-9247-47bd-b873-5003da94d906' ||
          personTypeId === '25a0a62a-6a39-44b3-a8f6-cde56eb50f0a'
        ) {
          if (res?.wholesaleAbilityDetail != null) {
            setState({
              hasCommitment: res?.wholesaleAbilityDetail?.hasCommitment,
            });
          } else {
            setState({
              hasCommitment: true,
            });
          }
        } else {
          if (res?.wholesaleAbilityDetail != null) {
            setState({
              wholesaleAbilityStatements: res?.wholesaleAbilityStatements,
              hasCommitment: res?.wholesaleAbilityDetail?.hasCommitment,
              hasThreeYear: res?.wholesaleAbilityDetail?.hasThreeYear,
              wholesaleAbilityData: res,
            });
          } else {
            setState({
              wholesaleAbilityStatements: res?.wholesaleAbilityStatements,
              wholesaleAbilityData: res,
            });
          }
        }
      },
      onFail,
    });
  };

  const setErrorMessage = (key: string) => {
    const errorMessage = '.';
    setState({ [`${key}Error`]: errorMessage });
  };

  const handleRadioModeChange = (e: RadioChangeEvent, state: string) => {
    setState({ [`${state}`]: e.target.value });
  };

  const onSubmitClick = () => {
    const data = {
      wholesaleBuyInfoId: wholesaleBuyerInfoId,
      wholesalePersonTypeId: personTypeId,
      orderId: orderDetailData?.orderId,
      instrumentId: orderDetailData?.instrumentId,
      wholesaleTypeId: orderDetailData?.wholesaleTypeId,
      tradeVolume: orderDetailData?.tradeVolume,
      basePrice: orderDetailData?.basePrice,
      buyPercent: buyerInfoData?.buyPercent,
      wholesaleAbilityDetail: {
        hasThreeYear: null,
        hasCommitment: hasCommitment,
      },
    };
    saveWholesaleBuyerAbility({
      data: data,
      onSuccess: (res) => {
        onSuccessSave();
        onChangeState('isSubmitAbilityVisible', false);
      },
      onFail,
    });
  };
  const onSubmitLegalClick = () => {
    if (wholesaleStatementTypeId && abilityYear && proprietaryRights && price) {
      const data = {
        wholesaleBuyInfoId: wholesaleBuyerInfoId,
        wholesalePersonTypeId: personTypeId,
        orderId: orderDetailData?.orderId,
        instrumentId: orderDetailData?.instrumentId,
        wholesaleTypeId: orderDetailData?.wholesaleTypeId,
        tradeVolume: orderDetailData?.tradeVolume,
        basePrice: orderDetailData?.basePrice,
        buyPercent: buyerInfoData?.buyPercent,
        wholesaleAbility: {
          cashSharePercent: orderDetailData?.cashSharePercent,
          wholesaleCategoryId: orderDetailData?.wholeSaleCategoryId,
          minimumPrice: minAbilityPrice,
        },
        wholesaleAbilityDetail: {
          hasThreeYear: hasThreeYear,
          hasCommitment: hasThreeYear ? null : hasCommitment,
        },
        wholesaleAbilityStatement: {
          id: editMode ? listId : '00000000-0000-0000-0000-000000000000',
          wholesaleStatementTypeId: parseInt(wholesaleStatementTypeId),
          abilityYear: parseInt(abilityYear),
          proprietaryRights: parseInt(proprietaryRights),
          abilityDescription: abilityDescription,
        },
      };
      saveWholesaleBuyerAbility({
        data: data,
        onSuccess: (res) => {
          if (res?.succeeded) {
            getWholesaleBuyerAbilityByIdData();
            setState({
              wholesaleStatementTypeId: '',
              abilityYear: '',
              proprietaryRights: '',
              abilityDescription: '',
              editMode: false,
              // hasThreeYear: true,
              // hasCommitment: true,
            });
            onSuccessSave();
            // onChangeState('isSubmitAbilityVisible', false);
          } else {
            onAlert({ message: res?.errors?.[0], type: 'error' });
          }
        },
        onFail,
      });
    } else {
      setState({
        ...(!wholesaleStatementTypeId && {
          wholesaleStatementTypeIdError: true,
        }),
        ...(!abilityYear && { abilityYearError: true }),
        ...(!proprietaryRights && { proprietaryRightsError: true }),
        ...(!price && { priceError: true }),
      });
    }
  };
  const onEditAbility = (item: any) => {
    setState({
      editMode: true,
      listId: item?.id,
      wholesaleStatementTypeId: item?.wholesaleStatementTypeId,
      abilityYear: item?.abilityYear,
      proprietaryRights: item?.proprietaryRights,
      abilityDescription: item?.abilityDescription,
    });
  };
  const onRemoveAbilityItem = (id: string) => {
    deleteWholesaleBuyerStatmentById({
      data: {
        orderId: orderDetailData?.orderId,
        StatmentId: id,
      },
      onSuccess: (res) => {
        getWholesaleBuyerAbilityByIdData();
        onSuccessSave();
      },
      onFail,
    });
  };
  const onBackClick = () => {
    setState({
      wholesaleStatementTypeId: '',
      abilityYear: '',
      proprietaryRights: '',
      abilityDescription: '',
      hasCommitment: true,
      hasThreeYear: true,
    });
  };
  return (
    <>
      <Modal
        visible={isOpen}
        closable={false}
        style={{ textAlign: 'center', padding: '0px' }}
        title={'تمکن مالی'}
        footer={null}
        centered
        width={'80%'}
      >
        <>
          {isDetailPage && (
            <div className="grid grid-cols-12 gap-4 mt-8  ">
              {viewMode === 'out' ? (
                <>
                  <div className="2xl:col-span-2 xl:col-span-3 lg:col-span-6 md:col-span-12  col-span-3">
                    <TextField
                      label="نوع شخصیت"
                      value={personTypeName}
                      readOnly
                    />
                  </div>
                  <div className="col-span-12 flex flex-row mt-6">
                    <span>
                      آیا متقاضی تعهد 10% نقدی یا 30% ضمانت نامه داده است؟
                    </span>
                    <div className="mx-10">
                      <Radio.Group
                        onChange={(e: RadioChangeEvent) =>
                          handleRadioModeChange(e, 'hasCommitment')
                        }
                        value={hasCommitment}
                      >
                        <Radio value={true}>بلی</Radio>
                        <Radio value={false}>خیر</Radio>
                      </Radio.Group>
                    </div>
                  </div>
                </>
              ) : viewMode === 'real' ? (
                <>
                  <div className="2xl:col-span-2 xl:col-span-3 lg:col-span-6 md:col-span-12  col-span-3">
                    <TextField
                      label="نوع شخصیت"
                      value={personTypeName}
                      readOnly
                    />
                  </div>
                  <div className="col-span-12 flex flex-row mt-6">
                    <span>آیا متقاضی تعهد داده است؟</span>
                    <div className="mx-10">
                      <Radio.Group
                        onChange={(e: RadioChangeEvent) =>
                          handleRadioModeChange(e, 'hasCommitment')
                        }
                        value={hasCommitment}
                      >
                        <Radio value={true}>بلی</Radio>
                        <Radio value={false}>خیر</Radio>
                      </Radio.Group>
                    </div>
                  </div>
                </>
              ) : viewMode === 'legal' || viewMode == 'basket' ? (
                <>
                  <div className="col-span-12 flex flex-row ">
                    <span className="min-w-[20%] flex items-start">
                      تاسیس شرکت بیش از 3 سال می‌باشد؟
                    </span>
                    <div className="mx-10">
                      <Radio.Group
                        onChange={(e: RadioChangeEvent) =>
                          handleRadioModeChange(e, 'hasThreeYear')
                        }
                        value={hasThreeYear}
                      >
                        <Radio value={true}>بلی</Radio>
                        <Radio value={false}>خیر</Radio>
                      </Radio.Group>
                    </div>
                  </div>
                  {!hasThreeYear && (
                    <div className="col-span-12 flex flex-row mt-4">
                      <span className="min-w-[20%] flex items-start">
                        آیا متقاضی تعهد داده است؟
                      </span>
                      <div className="mx-10">
                        <Radio.Group
                          onChange={(e: RadioChangeEvent) =>
                            handleRadioModeChange(e, 'hasCommitment')
                          }
                          value={hasCommitment}
                        >
                          <Radio value={true}>بلی</Radio>
                          <Radio value={false}>خیر</Radio>
                        </Radio.Group>
                      </div>
                    </div>
                  )}
                  <div className="col-span-12 grid grid-cols-12 gap-4 mt-6">
                    <div className=" col-span-12 grid grid-cols-12 gap-4">
                      <TextField
                        label="مبلغ"
                        className="2xl:col-span-3 xl:col-span-3 lg:col-span-3 md:col-span-6  col-span-3"
                        value={price}
                        onChange={(value: any) =>
                          setState({
                            price: value,
                            priceError: false,
                          })
                        }
                        required
                        errorMessage={priceError}
                        type="numeric"
                      />
                    </div>
                    <TextField
                      className="2xl:col-span-3 xl:col-span-3 lg:col-span-3 md:col-span-6  col-span-3"
                      label="نوع شخصیت"
                      value={personTypeName}
                      readOnly
                    />
                    <TextField
                      className="2xl:col-span-3 xl:col-span-3 lg:col-span-3 md:col-span-6  col-span-3"
                      label="فروشنده سازمان خصوصی سازی"
                      value={orderDetailData?.isPrivatization ? 'بلی' : 'خیر'}
                      readOnly
                    />
                    <TextField
                      className="2xl:col-span-3 xl:col-span-3 lg:col-span-3 md:col-span-6  col-span-3"
                      label="درصد حصه نقدی"
                      value={orderDetailData?.cashSharePercent}
                      readOnly
                    />
                    <TextField
                      label="حداقل تمکن مالی"
                      className="2xl:col-span-3 xl:col-span-3 lg:col-span-3 md:col-span-6  col-span-3"
                      value={minAbilityPrice}
                      readOnly
                      type="numeric"
                    />
                    <div className="2xl:col-span-3 xl:col-span-3 lg:col-span-3 md:col-span-6  col-span-3">
                      <NewSelect
                        label="نوع صورت مالی"
                        className="col-span-2"
                        options={[
                          { name: '', id: '' },
                          ...wholesaleStatementTypeData,
                        ]}
                        onChange={(value: any) =>
                          setState({
                            wholesaleStatementTypeId: value,
                            wholesaleStatementTypeIdError: false,
                            wholesaleStatementTypeIdName:
                              wholesaleStatementTypeData.filter(
                                (item: any) => item?.id == value
                              )?.[0]?.name,
                          })
                        }
                        showKey="name"
                        selectedKey="id"
                        required
                        value={wholesaleStatementTypeId}
                        errorMessage={state?.wholesaleStatementTypeIdError}
                      />
                    </div>
                    <div className="2xl:col-span-3 xl:col-span-3 lg:col-span-3 md:col-span-6  col-span-3">
                      <NewSelect
                        label="سال"
                        className="col-span-2"
                        options={[{ name: '', id: '' }, ...abilityYearData]}
                        onChange={(value: any) =>
                          setState({
                            abilityYear: value,
                            abilityYearError: false,
                            abilityYearName: wholesaleStatementTypeData.filter(
                              (item: any) => item?.id == value
                            )?.[0]?.name,
                          })
                        }
                        showKey="name"
                        selectedKey="id"
                        required
                        value={abilityYear}
                        errorMessage={state?.abilityYearError}
                      />
                    </div>
                    {!hasThreeYear && (
                      <TextField
                        label="آخرین سرمایه پرداخت شده متقاضی"
                        className="2xl:col-span-6 xl:col-span-6 lg:col-span-6 md:col-span-6  col-span-6"
                        value={proprietaryRights}
                        onChange={(value: any) =>
                          setState({
                            proprietaryRights: value,
                            proprietaryRightsError: false,
                          })
                        }
                        required
                        errorMessage={proprietaryRightsError}
                        type="numeric"
                      />
                    )}
                    {hasThreeYear && (
                      <TextField
                        label="حقوق صاحبان سهام"
                        className="2xl:col-span-6 xl:col-span-6 lg:col-span-6 md:col-span-6  col-span-6"
                        value={proprietaryRights}
                        onChange={(value: any) =>
                          setState({
                            proprietaryRights: value,
                            proprietaryRightsError: false,
                          })
                        }
                        required
                        errorMessage={proprietaryRightsError}
                        type="numeric"
                      />
                    )}
                    <TextField
                      label="توضیحات"
                      className="2xl:col-span-6 xl:col-span-6 lg:col-span-6 md:col-span-6  col-span-6"
                      value={abilityDescription}
                      onChange={(value: any) =>
                        setState({
                          abilityDescription: value,
                          abilityDescriptionError: false,
                        })
                      }
                      // required
                      // errorMessage={abilityDescriptionError}
                    />
                    <div className="col-span-6 flex justify-end">
                      <Button
                        onClick={onSubmitLegalClick}
                        className="bg-green w-24 h-9 text-white "
                      >
                        تایید و اضافه
                      </Button>
                    </div>
                    <div className="col-span-12 flex justify-end items-center flex-row mt-10">
                      <span className="font-bold">
                        میانگین مجموع حقوق صاحبان سهام
                      </span>
                      <span className="font-bold mx-4">اصلی :</span>
                      <span className="mx-4">
                        {separator(
                          wholesaleAbilityData?.averageProprietaryRightsMain
                        )}{' '}
                        {wholesaleAbilityData?.averageProprietaryRightsMain !=
                        null
                          ? 'ریال'
                          : ''}
                      </span>
                      <span className="font-bold">| تلفیقی :</span>
                      <span className="mx-4">
                        {separator(
                          wholesaleAbilityData?.averageProprietaryRightsConsolidated
                        )}{' '}
                        {wholesaleAbilityData?.averageProprietaryRightsConsolidated !=
                        null
                          ? 'ریال'
                          : ''}
                      </span>
                    </div>
                    <div className="col-span-12 ">
                      <Table
                        columns={abilityColumns}
                        className="col-span-12 grid grid-cols-12 text-center"
                        dataSource={wholesaleAbilityStatements}
                        //   scroll={{ x: 'calc(700px + 30%)' }}
                        pageSize={1000}
                      />
                    </div>
                  </div>
                </>
              ) : null}

              <div className="col-span-12 flex justify-end mt-14 mx-4 ">
                <Button
                  onClick={() => {
                    onBackClick();
                    onChangeState('isSubmitAbilityVisible', false);
                  }}
                  className="bg-gray w-24 h-9  text-white "
                >
                  بازگشت
                </Button>
                {viewMode === 'out' || viewMode === 'real' ? (
                  <Button
                    onClick={onSubmitClick}
                    className="bg-blue w-24 h-9 text-white mx-4 "
                  >
                    ثبت اطلاعات
                  </Button>
                ) : null}
              </div>
            </div>
          )}
          {isDeputyPage || isUploadDocPage || isDetailPageWithoutEnterData ? (
            <div className="grid grid-cols-12 gap-4 mt-8  ">
              {viewMode === 'out' ? (
                <>
                  <div className="2xl:col-span-2 xl:col-span-3 lg:col-span-6 md:col-span-12  col-span-3 flex-col flex text-right mx-8">
                    <span className="text-gray text-base">نوع شخصیت :</span>
                    <span className="font-bold">{personTypeName}</span>
                  </div>
                  <div className="2xl:col-span-10 xl:col-span-9 lg:col-span-6 md:col-span-12  col-span-9 flex-col flex text-right mx-8">
                    <span className="text-gray text-base">
                      آیا متقاضی تعهد 10% نقدی یا 30% ضمانت نامه داده است؟
                    </span>
                    <span className="font-bold">
                      {hasCommitment ? 'بلی' : 'خیر'}
                    </span>
                  </div>
                </>
              ) : viewMode === 'real' ? (
                <>
                  <div className="2xl:col-span-2 xl:col-span-3 lg:col-span-6 md:col-span-12  col-span-3 flex-col flex text-right mx-8">
                    <span className="text-gray text-base">نوع شخصیت :</span>
                    <span className="font-bold">{personTypeName}</span>
                  </div>

                  <div className="2xl:col-span-10 xl:col-span-9 lg:col-span-6 md:col-span-12  col-span-9 flex-col flex text-right mx-8">
                    <span className="text-gray text-base">
                      آیا متقاضی تعهد داده است؟
                    </span>
                    <span className="font-bold">
                      {hasCommitment ? 'بلی' : 'خیر'}
                    </span>
                  </div>
                </>
              ) : viewMode === 'legal' || viewMode == 'basket' ? (
                <>
                  <div className="col-span-12 flex flex-row ">
                    <span className="min-w-[25%] flex items-start text-gray">
                      تاسیس شرکت بیش از 3 سال می‌باشد؟
                    </span>
                    <span className=" flex items-start mx-8 font-bold">
                      {hasThreeYear ? 'بلی' : 'خیر'}
                    </span>
                  </div>
                  {!hasThreeYear && (
                    <div className="col-span-12 flex flex-row mt-4 ">
                      <span className="min-w-[25%] flex items-start text-gray">
                        آیا متقاضی تعهد داده است؟
                      </span>
                      <span className=" flex items-start mx-8 font-bold">
                        {hasCommitment ? 'بلی' : 'خیر'}
                      </span>
                    </div>
                  )}
                  <div className="col-span-12 grid grid-cols-12 gap-4 mt-6">
                    <div className="2xl:col-span-3 xl:col-span-4 lg:col-span-6 md:col-span-6  col-span-3 flex flex-col text-right">
                      <span className=" text-gray ml-4">نوع شخصیت</span>
                      <span className=" font-bold">{personTypeName}</span>
                    </div>
                    <div className="2xl:col-span-3 xl:col-span-4 lg:col-span-6 md:col-span-6  col-span-3 flex flex-col text-right">
                      <span className=" text-gray ml-4">
                        فروشنده سازمان خصوصی سازی
                      </span>
                      <span className=" font-bold">
                        {orderDetailData?.isPrivatization ? 'بلی' : 'خیر'}
                      </span>
                    </div>
                    <div className="2xl:col-span-3 xl:col-span-4 lg:col-span-6 md:col-span-6  col-span-3 flex flex-col text-right">
                      <span className=" text-gray ml-4">درصد حصه نقدی</span>
                      <span className=" font-bold">
                        {orderDetailData?.cashSharePercent}
                      </span>
                    </div>
                    <div className="2xl:col-span-3 xl:col-span-4 lg:col-span-6 md:col-span-6  col-span-3 flex flex-col text-right">
                      <span className=" text-gray ml-4">حداقل تمکن مالی</span>
                      <span className=" font-bold">
                        {separator(
                          wholesaleAbilityData?.wholesaleAbility?.minimumPrice
                        )}
                      </span>
                    </div>
                    <div className="col-span-12 flex justify-end items-center flex-row mt-10">
                      <span className="font-bold">
                        میانگین مجموع حقوق صاحبان سهام
                      </span>
                      <span className="font-bold mx-4">اصلی :</span>
                      <span className="mx-4">
                        {separator(
                          wholesaleAbilityData?.averageProprietaryRightsMain
                        )}{' '}
                        {wholesaleAbilityData?.averageProprietaryRightsMain !=
                        null
                          ? 'ریال'
                          : ''}
                      </span>
                      <span className="font-bold">| تلفیقی :</span>
                      <span className="mx-4">
                        {separator(
                          wholesaleAbilityData?.averageProprietaryRightsConsolidated
                        )}{' '}
                        {wholesaleAbilityData?.averageProprietaryRightsConsolidated !=
                        null
                          ? 'ریال'
                          : ''}
                      </span>
                    </div>
                    <div className="col-span-12 ">
                      <Table
                        columns={isDeputyAbilityColumns}
                        className="col-span-12 grid grid-cols-12 text-center"
                        dataSource={wholesaleAbilityStatements}
                        //   scroll={{ x: 'calc(700px + 30%)' }}
                        pageSize={1000}
                      />
                    </div>
                  </div>
                </>
              ) : null}

              <div className="col-span-12 flex justify-end mt-14 mx-4 ">
                <Button
                  onClick={() => {
                    onBackClick();
                    onChangeState('isSubmitAbilityVisible', false);
                  }}
                  className="bg-gray w-24 h-9  text-white "
                >
                  بازگشت
                </Button>
              </div>
            </div>
          ) : null}
        </>
      </Modal>
    </>
  );
}
