import withAlert from 'apps/cash-market/src/hoc/withAlert';
import { useStates, useEffect } from '@tse/utils';
import { Modal, Popconfirm, Radio } from 'antd';
import { SymbolModal, Table } from '@tse/components/organism';
import { Button } from '@tse/components/atoms';
import { HeaderTypes, onAlertProps } from '@tse/types';
import { generateRandomNumber, separator } from '@tse/tools';
import { getWholesaleBuyerAbilityById } from 'apps/cash-market/src/Controller/StockMarket/WholeSale';
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
}
export function AbilityDataModal(props: SubmitInqueryDataModalProps) {
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
  };
  const [state, setState] = useStates<any>(initialState);
  const {
    viewMode,
    personTypeName,
    hasCommitment,
    hasThreeYear,
    wholesaleAbilityStatements,
  } = state;
  const {
    isOpen,
    onChangeState,
    onAlert,
    wholesaleBuyerInfoId,
    personTypeId,
    orderDetailData,
    buyerInfoData,
  } = props;
  const isDeputyAbilityColumns: HeaderTypes[] = [
    {
      title: 'نوع صورت مالی',
      dataIndex: 'wholesaleStatementTypeId',
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
                        buyerInfoData?.minFinancialAbility?.toFixed(0)
                      )}
                    </span>
                  </div>

                  <div className="col-span-12 my-10">
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
                  onChangeState('isAbilityModalVisible', false);
                }}
                className="bg-gray w-24 h-9  text-white "
              >
                بازگشت
              </Button>
            </div>
          </div>
        </>
      </Modal>
    </>
  );
}
