/* eslint-disable @nrwl/nx/enforce-module-boundaries */
import {
  TextField,
  Button,
  Icon,
  RadioGroup,
  Collapse,
  TimePickerInput,
  TreeTable,
  Upload,
} from '@tse/components/atoms';
import { SymbolModal, Table } from '@tse/components/organism';
import { SearchInput, DatePicker } from '@tse/components/molecules';
import { useEffect, useStates } from '@tse/utils';
import {
  getParameterTypeList,
  getInstrumentList,
  saveInstrumentParameter,
  uploadFile,
  instrumentParameterLoad,
  instrumentParameterImport,
  getInstrumentParameterList,
} from '../../../Controller';
import withAlert from '../../../hoc/withAlert';
import { HeaderTypes } from '@tse/types';
import {
  convertDateToJalali,
  separator,
  convertDateToJalaliHour,
} from '@tse/tools';
import { number } from 'yup/lib/locale';
import NewSelect from '../../../components/atoms/NewSelect';
import { Modal } from 'antd';

const initialState = {
  typeList: [],
  symbolList: [],
  parameterChangeType: 0,
  parameterChangeTypeName: '',
  instrument: null,
  parameterList: null,
  fromDate: '',
  toDate: '',
  fromDateError: false,
  toDateError: false,
  excelFile: null,
  excelFileError: false,
  infoExpanded: false,
  confirmModalVisible: false,
  isLoading: false,
  confirmTableData: [],
  filterParameterChangeType: '',
  filterFromDate: null,
  filterFromDateError: false,
  filterToDate: null,
  editInstrumentName: '',
  editSymbolName: '',
  editMinValue: '',
  editMinValueError: false,
  editMaxOrder: '',
  editMaxOrderError: '',
  editTolerance: '',
  editToleranceError: '',
  editOscillation: '',
  editOscillationError: '',
  editParameterChangeType: '',
  editParameterChangeTypeError: '',
  editLiquidity: '',
  editLiquidityError: '',
  editFromDate: '',
  editFromDateError: '',
  editToDate: '',
  editToDateError: '',
  editInstrument: '',
  isEditMode: false,
  selectedParameter: {},
};
function InstrumentParameter({ onAlert }: any) {
  const [state, setState] = useStates<any>(initialState);
  const {
    typeList,
    symbolList,
    parameterChangeType,
    parameterChangeTypeName,
    instrument,
    parameterList,
    fromDate,
    toDate,
    fromDateError,
    toDateError,
    excelFile,
    excelFileError,
    infoExpanded,
    confirmModalVisible,
    isLoading,
    confirmTableData,
    filterParameterChangeType,
    filterFromDate,
    filterFromDateError,
    filterToDate,
    editInstrumentName,
    editSymbolName,
    editMinValue,
    editMinValueError,
    editMaxOrder,
    editMaxOrderError,
    editTolerance,
    editToleranceError,
    editOscillation,
    editOscillationError,
    editParameterChangeType,
    editParameterChangeTypeError,
    editLiquidity,
    editLiquidityError,
    editFromDate,
    editFromDateError,
    editToDate,
    editToDateError,
    editInstrument,
    isEditMode,
    selectedParameter,
  } = state;
  const tableHeader: HeaderTypes[] = [
    {
      title: 'نماد',
      dataIndex: 'instrument',
      key: 'instrument',
      className: 'col-span-1',
      render: (item: any) => <span>{item?.symbol}</span>,
    },
    {
      title: 'نام شرکت',
      dataIndex: 'instrument',
      key: 'instrument',
      className: 'col-span-1',
      render: (item: any) => <span>{item?.symbolName}</span>,
    },
    {
      title: 'حداقل حجم معامله',
      dataIndex: 'minValue',
      key: 'minValue',
      className: 'col-span-1',
      render: (item: any) => <span>{separator(item)}</span>,
    },
    {
      title: 'سفارش انباشته',
      dataIndex: 'maxOrder',
      key: 'maxOrder',
      className: 'col-span-1',
      render: (item: any) => <span>{separator(item)}</span>,
    },
    {
      title: 'دامنه مظنه',
      dataIndex: 'tolerance',
      key: 'tolerance',
      className: 'col-span-1',
      render: (item: any) => <span>{item}</span>,
    },
    {
      title: 'دامنه نوسان',
      dataIndex: 'oscillation',
      key: 'oscillation',
      className: 'col-span-1',
      render: (item: any) => <span>{item}</span>,
    },
    {
      title: 'طبقه نقدشوندگی',
      dataIndex: 'liquidity',
      key: 'liquidity',
      className: 'col-span-1',
      render: (item: any) => <span>{separator(item)}</span>,
    },
    {
      title: 'نوع تغییر',
      dataIndex: 'parameterChangeType',
      key: 'parameterChangeType',
      className: 'col-span-1',
      render: (item: any) => <span>{item.parameterChangeTypeName}</span>,
    },
    {
      title: 'از تاریخ',
      dataIndex: 'fromDate',
      key: 'fromDate',
      className: 'col-span-1',
      render: (item: any) => <span>{convertDateToJalali(item)}</span>,
    },
    {
      title: 'تا تاریخ',
      dataIndex: 'toDate',
      key: 'toDate',
      className: 'col-span-1',
      render: (item: any) => <span>{convertDateToJalali(item)}</span>,
    },
    {
      title: 'ویرایش',
      dataIndex: 'edit',
      key: 'edit',
      render: (_: any, record: any) => (
        <Icon
          name="icon-edit"
          classname="cursor-pointer mr-[25%]"
          onClick={() => onEdit(record)}
        />
      ),
    },
  ];
  const tableHeaderModal: HeaderTypes[] = [
    {
      title: 'نماد',
      dataIndex: 'instrumentName',
      key: 'instrumentName',
      className: 'col-span-1',
      render: (item: any) => <span>{item}</span>,
    },
    {
      title: 'نام شرکت',
      dataIndex: 'companyName',
      key: 'companyName',
      className: 'col-span-1',
      render: (item: any) => <span>{item}</span>,
    },
    {
      title: 'حداقل حجم معامله',
      dataIndex: 'minValue',
      key: 'minValue',
      className: 'col-span-1',
      render: (item: any) => <span>{separator(item)}</span>,
    },
    {
      title: 'سفارش انباشته',
      dataIndex: 'maxOrder',
      key: 'maxOrder',
      className: 'col-span-1',
      render: (item: any) => <span>{separator(item)}</span>,
    },
    {
      title: 'دامنه مظنه',
      dataIndex: 'tolerance',
      key: 'tolerance',
      className: 'col-span-1',
    },
    {
      title: 'دامنه نوسان',
      dataIndex: 'oscillation',
      key: 'oscillation',
      className: 'col-span-1',
      render: (item: any) => <span>{separator(item)}</span>,
    },
    {
      title: 'طبقه نقدشوندگی',
      dataIndex: 'liquidity',
      key: 'liquidity',
      className: 'col-span-1',
      render: (item: any) => <span>{separator(item)}</span>,
    },
    {
      title: 'نوع تغییر',
      dataIndex: 'parameterChangeType',
      key: 'parameterChangeType',
      className: 'col-span-2',
      render: (item: any) => <span>{parameterChangeTypeName}</span>,
    },
    {
      title: 'از تاریخ',
      dataIndex: 'fromDate',
      key: 'fromDate',
      className: 'col-span-1',
      render: (item: any) => <span>{convertDateToJalali(fromDate)}</span>,
    },

    {
      title: 'تا تاریخ',
      dataIndex: 'toDate',
      key: 'toDate',
      className: 'col-span-1',
      render: (item: any) => <span>{convertDateToJalali(toDate)}</span>,
    },
  ];

  useEffect(() => {
    getTypeList();
    getSymbolList('', 1);
    getParameterList(1);
  }, []);

  const getParameterList = (
    pageNo: number,
    instrument?: any,
    filterParameterChangeType?: any,
    FromDate?: string,
    toDate?: string
  ) => {
    const data = {
      InstrumentName: instrument?.symbolName,
      ParameterChangeTypeId: filterParameterChangeType,
      FromDate: FromDate,
      ToDate: toDate,
      PageNumber: pageNo,
      PageSize: 10,
    };
    getInstrumentParameterList({
      data,
      onSuccess: onSuccessParameterList,
      onFail,
    });
  };

  const onSuccessParameterList = (value: any) => {
    setState({
      parameterList: value,
    });
  };

  const getTypeList = () => {
    getParameterTypeList({ onSuccess: onSuccessTypeList, onFail });
  };
  const onSuccessTypeList = (res: any) => {
    setState({
      typeList: res,
      parameterChangeType: res[0].parameterChangeTypeId,
      parameterChangeTypeName: res[0].parameterChangeTypeName,
    });
  };

  const getSymbolList = (text: string, pageNo: number) => {
    const data = {
      SearchText: text,
      PageNumber: pageNo,
    };
    getInstrumentList({ data, onSuccess: onSuccessSymbolList, onFail });
  };

  const onSuccessSymbolList = (list: any) => {
    setState({
      symbolList: list,
    });
  };

  const onFail = (error: any) => {
    onAlert(error);
  };

  const onChange = (value: any, key: string) => {
    const errorKey = `${key}Error`;
    setState({
      [key]: value,
      [errorKey]: false,
    });
  };

  const onPreviewClick = () => {
    if (fromDate && parameterChangeType && excelFile) {
      setState({ isLoading: true });
      const data = {
        fileId: excelFile?.fileId,
      };
      instrumentParameterLoad({
        data,
        onSuccess: onSuccessLoad,
        onFail: (error: any) => {
          onAlert(error), setState({ isLoading: false });
        },
      });
    } else {
      setState({
        ...(!fromDate && { fromDateError: true }),
        ...(!excelFile && { excelFileError: true }),
      });
    }
  };
  const onSuccessLoad = (res: any) => {
    setState({
      confirmTableData: res,
      isLoading: false,
      confirmModalVisible: true,
    });
  };
  const saveParameter = () => {
    const data = {
      instrumentParameterImportModels: confirmTableData,
      parameterChangeTypeId: parameterChangeType,
      fromDate: fromDate,
      toDate: toDate ? toDate : null,
    };
    instrumentParameterImport({ data, onSuccess: onSuccessSave, onFail });
  };

  const onSuccessSave = () => {
    onAlert({ message: 'عملیات با موفقیت انجام شد', type: 'success' });
    setState({
      fromDate: null,
      toDate: null,
      excelFile: null,
      confirmModalVisible: false,
    });
    getTypeList();
    getParameterList(1);
  };

  const onChangePage = (pageNo: number) => {
    getParameterList(
      pageNo,
      instrument,
      filterParameterChangeType,
      filterFromDate,
      filterToDate
    );
  };

  const onSearch = () => {
    getParameterList(
      1,
      instrument,
      filterParameterChangeType,
      filterFromDate,
      filterToDate
    );
  };
  const onRemoveSearch = () => {
    getParameterList(1);
    setState({
      instrument: null,
      filterParameterChangeType: '',
      filterFromDate: null,
      filterToDate: null,
    });
  };
  const onEdit = (record: any) => {
    const {
      instrument,
      minValue,
      maxOrder,
      tolerance,
      oscillation,
      parameterChangeType,
      liquidity,
      fromDate,
      toDate,
    } = record;
    setState({
      selectedParameter: record,
      editInstrument: instrument,
      editInstrumentName: instrument?.symbol,
      editSymbolName: instrument?.symbolName,
      editMinValue: minValue,
      editMaxOrder: maxOrder,
      editTolerance: tolerance,
      editOscillation: oscillation,
      editParameterChangeType: parameterChangeType?.parameterChangeTypeId,
      editLiquidity: liquidity,
      editFromDate: fromDate,
      editToDate: toDate,
      isEditMode: true,
    });
  };
  const onCancelEdit = () => {
    setState({
      selectedParameter: {},
      editInstrumentName: '',
      editSymbolName: '',
      editMinValue: '',
      editMaxOrder: '',
      editTolerance: '',
      editOscillation: '',
      editParameterChangeType: '',
      editLiquidity: '',
      editFromDate: '',
      editToDate: '',
      isEditMode: false,
    });
  };

  const onSubmitEdit = () => {
    if (
      editMinValue &&
      editMaxOrder &&
      editTolerance &&
      editOscillation &&
      editParameterChangeType &&
      editLiquidity &&
      editFromDate
    ) {
      const data = {
        instrumentParameterId: selectedParameter?.instrumentParameterId,
        instrument: editInstrument,
        parameterChangeType: {
          parameterChangeTypeId: editParameterChangeType,
        },
        minValue: editMinValue,
        maxOrder: editMaxOrder,
        tolerance: editTolerance,
        oscillation: editOscillation,
        liquidity: editLiquidity,
        fromDate: editFromDate,
        toDate: editToDate,
      };
      saveInstrumentParameter({ data, onSuccess: onSuccessSubmitEdit, onFail });
    } else {
      setState({
        ...(!editMinValue && { editMinValueError: true }),
        ...(!editMaxOrder && { editMaxOrderError: true }),
        ...(!editTolerance && { editToleranceError: true }),
        ...(!editOscillation && { editOscillationError: true }),
        ...(!editParameterChangeType && { editParameterChangeTypeError: true }),
        ...(!editLiquidity && { editLiquidityError: true }),
        ...(!editFromDate && { editFromDateError: true }),
      });
    }
  };

  const onSuccessSubmitEdit = () => {
    onAlert({ message: 'ویرایش با موفقیت انجام شد', type: 'success' });
    getParameterList(1);
    setState({
      selectedParameter: {},
      editInstrumentName: '',
      editSymbolName: '',
      editMinValue: '',
      editMaxOrder: '',
      editTolerance: '',
      editOscillation: '',
      editParameterChangeType: '',
      editLiquidity: '',
      editFromDate: '',
      editToDate: '',
      isEditMode: false,
    });
  };

  const onRemoveFile = (key: string) => {
    setState({
      [key]: null,
    });
  };

  const onChangeFile = (e: any, key: string) => {
    uploadFile({
      data: e.target.files[0],
      onSuccess: (res: any) => onChange(res, key),
      onFail,
    });
  };

  return (
    <>
      {!isEditMode && (
        <>
          <div className="shadow-[0_0px_4px_rgba(0,0,0,0.2)] rounded-sm p-3 mb-2 items-center grid grid-cols-12">
            <RadioGroup
              items={typeList}
              showKey="parameterChangeTypeName"
              className="2xl:col-span-6 xl:col-span-6 col-span-12 gap-1 font-bold py-4 mx-4"
              valueKey="parameterChangeTypeId"
              defaultValue={parameterChangeType}
              onChange={(e: string) => {
                onChange(e, 'parameterChangeType');
                setState({
                  parameterChangeTypeName: typeList.filter(
                    (item: any) => item?.parameterChangeTypeId == e
                  )?.[0]?.parameterChangeTypeName,
                });
              }}
            />
            <div className="2xl:col-span-3 xl:col-span-3 col-span-6 mx-4 z-30">
              <DatePicker
                label="از تاریخ"
                value={fromDate}
                onChange={(value: any) => onChange(value, 'fromDate')}
                error={fromDateError}
                required
              />
            </div>
            <div className="2xl:col-span-3 xl:col-span-3 col-span-6 mx-4 z-30">
              <DatePicker
                label="تا تاریخ"
                value={toDate}
                onChange={(value: any) => onChange(value, 'toDate')}
                error={toDateError}
                onClearDate={() => setState({ toDate: null })}
              />
            </div>
          </div>

          <div className="shadow-[0_0px_4px_rgba(0,0,0,0.2)] rounded-sm p-3 grid grid-cols-12 mb-3 items-center">
            <span className="font-bold my-4">پارمترهای ناشر نماد</span>
            <li className="marker:text-blue col-span-12">
              کاربر گرامی ، جهت اضافه کردن اطلاعات ، فایل های مربوطه را با فرمت
              xlsx. اضافه نمایید.
            </li>
            <div className="col-span-6 mt-4">
              <Upload
                onChange={(file: any) => onChangeFile(file, 'excelFile')}
                value={excelFile?.fileName}
                href={excelFile?.link}
                name="excelFile"
                onDelete={() => onRemoveFile('excelFile')}
                error={excelFileError}
              />
            </div>
            <div className="col-span-6 flex justify-end">
              <Button
                className="bg-blue text-white w-[115px] mr-4"
                onClick={onPreviewClick}
                isLoading={isLoading}
              >
                پیش نمایش
              </Button>
            </div>
          </div>
        </>
      )}
      {isEditMode && (
        <>
          <Collapse
            className="shadow-[0_0px_4px_rgba(0,0,0,0.2)] rounded-sm p-1 mb-3"
            title="ویرایش پارامترهای بازارگردانی"
            expanded={true}
            // onChange={(e: any, isOpen: boolean) =>
            //   onChange(isOpen, 'infoExpanded')
            // }
          >
            <>
              <div className="grid grid-cols-12 gap-4 mt-2 mb-2">
                <TextField
                  className="col-span-3"
                  label="نماد"
                  onChange={(e: string) => onChange(e, 'editInstrumentName')}
                  value={editInstrumentName}
                  readOnly
                  disabled
                />
                <TextField
                  className="col-span-3"
                  label="نام شرکت"
                  onChange={(e: string) => onChange(e, 'editSymbolName')}
                  value={editSymbolName}
                  readOnly
                  disabled
                />
                <TextField
                  className="col-span-3"
                  label="حداقل حجم معامله"
                  onChange={(e: string) => onChange(e, 'editMinValue')}
                  value={editMinValue}
                  error={editMinValueError}
                  required
                  type="numeric"
                />
                <TextField
                  className="col-span-3"
                  label="سفارش انباشته"
                  onChange={(e: string) => onChange(e, 'editMaxOrder')}
                  value={editMaxOrder}
                  required
                  error={editMaxOrderError}
                  type="numeric"
                />
                <TextField
                  className="col-span-3"
                  label="دامنه مظنه"
                  onChange={(e: string) => onChange(e, 'editTolerance')}
                  value={editTolerance}
                  required
                  error={editToleranceError}
                  type="numeric"
                />
                <TextField
                  className="col-span-3"
                  label="دامنه نوسان"
                  onChange={(e: string) => onChange(e, 'editOscillation')}
                  value={editOscillation}
                  required
                  error={editOscillationError}
                  type="numeric"
                />
                <div className="2xl:col-span-3 xl:col-span-3 lg:col-span-4 md:col-span-5  col-span-2">
                  <NewSelect
                    label="نوع تغییر"
                    className="col-span-2"
                    options={[{ name: '', id: '' }, ...typeList]}
                    onChange={(value: any) => {
                      setState({
                        editParameterChangeType: value,
                        editParameterChangeTypeError: false,
                      });
                    }}
                    showKey="parameterChangeTypeName"
                    selectedKey="parameterChangeTypeId"
                    required
                    value={editParameterChangeType}
                    errorMessage={editParameterChangeTypeError}
                  />
                </div>
                <TextField
                  className="col-span-3"
                  label="طبقه نقدشوندگی"
                  onChange={(e: string) => onChange(e, 'editLiquidity')}
                  value={editLiquidity}
                  required
                  error={editLiquidityError}
                  type="numeric"
                />

                <div className="2xl:col-span-3 xl:col-span-3 col-span-6 z-20">
                  <DatePicker
                    label="از تاریخ *"
                    value={editFromDate}
                    onChange={(value: any) => onChange(value, 'editFromDate')}
                    error={editFromDateError}
                  />
                </div>
                <div className="2xl:col-span-3 xl:col-span-3 col-span-6 z-20">
                  <DatePicker
                    label="تا تاریخ  *"
                    value={editToDate}
                    onChange={(value: any) => onChange(value, 'editToDate')}
                    error={editToDateError}
                    onClearDate={() => {
                      setState({ editToDate: null });
                    }}
                  />
                </div>
              </div>

              <div className="flex w-full justify-end">
                <Button
                  className="border border-red text-red w-[100px] mr-4"
                  onClick={onCancelEdit}
                >
                  انصراف
                </Button>
                <Button
                  className="border border-blue text-blue w-[100px] mr-4"
                  onClick={onSubmitEdit}
                >
                  ویرایش
                </Button>
              </div>
            </>
          </Collapse>
        </>
      )}

      <div className="grid grid-cols-12 gap-4 !mt-6">
        <SymbolModal
          className="2xl:col-span-3 xl:col-span-3 col-span-6"
          data={symbolList}
          onChange={(pageNo: number, text: string) =>
            getSymbolList(text, pageNo)
          }
          onSubmit={(value: any) => onChange(value, 'instrument')}
          defaultValue={instrument}
        />
        <div className="2xl:col-span-3 xl:col-span-3 col-span-6">
          <NewSelect
            label="نوع تغییر"
            className="col-span-2"
            options={[
              { parameterChangeTypeName: '', parameterChangeTypeId: '' },
              ...typeList,
            ]}
            onChange={(value: any) => {
              setState({ filterParameterChangeType: value });
            }}
            showKey="parameterChangeTypeName"
            selectedKey="parameterChangeTypeId"
            // required
            value={filterParameterChangeType}
            // errorMessage={state?.selectedInitialSupplyTypeError}
          />
        </div>
        <div className="2xl:col-span-3 xl:col-span-3 col-span-6 z-10">
          <DatePicker
            label="از تاریخ"
            value={filterFromDate}
            onChange={(value: any) => onChange(value, 'filterFromDate')}
            error={filterFromDateError}
            onClearDate={() => setState({ filterFromDate: null })}
          />
        </div>
        <div className="2xl:col-span-3 xl:col-span-3 col-span-6 z-10">
          <DatePicker
            label="تا تاریخ"
            value={filterToDate}
            onChange={(value: any) => onChange(value, 'filterToDate')}
            onClearDate={() => setState({ filterToDate: null })}
            // error={filterToDateError}
          />
        </div>
        <div className="flex col-span-12 justify-end ">
          <Button
            className="bg-grayBorder text-black border-grayBorder w-[115px] mr-4"
            onClick={onRemoveSearch}
          >
            حذف فیلتر
          </Button>
          <Button
            className="bg-blue text-white w-[115px] mr-4"
            onClick={onSearch}
          >
            جستجو
          </Button>
        </div>
      </div>

      <Table
        data={parameterList?.items}
        columns={tableHeader}
        className="col-span-12 grid grid-cols-12 "
        wrapperClassName="!mt-4"
        scroll={{ x: 'calc(700px + 50%)' }}
        onChangePage={onChangePage}
        totalPages={parameterList?.totalPages}
        pageSize={10}
      />
      <Modal
        visible={confirmModalVisible}
        closable={false}
        style={{ textAlign: 'center', padding: '0px' }}
        title={
          <p className="text-black/[.88]  font-bold">
            آیا از صحت اطلاعات اطمینان دارید؟
          </p>
        }
        footer={null}
        centered
        width={'75%'}
        bodyStyle={
          {
            // backgroundColor: 'red'
          }
        }
      >
        <div className="grid grid-cols-12 justify-center items-center rounded-xl">
          <div className=" col-span-12">
            <Table
              data={confirmTableData}
              columns={tableHeaderModal}
              className="col-span-12 grid grid-cols-12 "
              wrapperClassName="!mt-4"
              scroll={{ x: 'calc(700px + 10%)' }}
              onChangePage={onChangePage}
              // totalPages={parameterList?.totalPages}
              pageSize={500}
            />
          </div>
          <div className=" col-span-12 justify-end flex flex-row my-8 ">
            <Button
              className="border bg-darkGray text-white w-[100px] mr-4"
              onClick={() => {
                setState({ confirmModalVisible: false });
              }}
            >
              بازگشت
            </Button>
            <Button
              className="border border-blue text-white bg-blue w-[100px] mr-4"
              onClick={saveParameter}
            >
              ثبت
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

export default withAlert(InstrumentParameter);
