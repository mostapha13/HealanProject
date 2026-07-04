import { Button, Image, TextField } from '@tse/components/atoms';
import type { ErrorType, HeaderTypes, onAlertProps } from '@tse/types';
import { useEffect, useRef, useState } from '@tse/utils';
import withAlert from '../../../hoc/withAlert';
import { Radio, Select } from 'antd';
import type { RadioChangeEvent } from 'antd';
import { Form, Input, Space } from 'antd';
import {
  getAllTemplate,
  getAllTemplateData,
  getFiledState,
  updateTemplateDetails,
} from './service';
interface SetBasicInfoTypes {
  onAlert: onAlertProps;
}
const allItems = {
  items: [
    {
      persian: 'شماره منحصر',
      english: 'number',
    },
    {
      persian: 'تاریخ',
      english: 'date',
    },
    {
      persian: 'نوع',
      english: 'type',
    },
    {
      persian: 'شماره منحصر',
      english: 'number',
    },
    {
      persian: 'تاریخ',
      english: 'date',
    },
    {
      persian: 'نوع',
      english: 'type',
    },
    {
      persian: 'شماره منحصر',
      english: 'number',
    },
    {
      persian: 'تاریخ',
      english: 'date',
    },
    {
      persian: 'نوع',
      english: 'type',
    },
    {
      persian: 'شماره منحصر',
      english: 'number',
    },
    {
      persian: 'تاریخ',
      english: 'date',
    },
    {
      persian: 'نوع',
      english: 'type',
    },
    {
      persian: 'شماره منحصر',
      english: 'number',
    },
    {
      persian: 'تاریخ',
      english: 'date',
    },
    {
      persian: 'نوع',
      english: 'type',
    },
  ],
};
const options = [
  { value: 'اجباری', lable: 'require' },
  { value: 'اختیاری', lable: 'optional' },
];
function SetBasicInfo({ onAlert }: SetBasicInfoTypes) {
  const [isLoading, setLoading] = useState<boolean>(false);
  const [changeType, setChangeType] = useState<any>();
  const [defaultType, setDefaultType] = useState('require');
  const [invoiceTypeData, setInvoiceTypeData] = useState<any>();
  const [invoiceItemData, setInvoiceItemData] = useState<any>();
  const [selectFiledState, setSelectFiledState] = useState<any>();
  const formRef = useRef<any>(null);

  useEffect(() => {
    if (formRef.current && invoiceItemData) {
      formRef.current.setFieldsValue({ items: invoiceItemData });
    }
  }, [invoiceItemData]);
  useEffect(() => {
    handleGetAllTemplateType();
    handleGetFiledState();
  }, []);

  const onFail = (error: any) => {
    setLoading(false);
    onAlert(error);
  };

  function handleGetAllTemplateType() {
    getAllTemplate({
      onSuccess: (res) => {
        setInvoiceTypeData(res?.data);
      },
      onFail,
    });
  }
  function handleGetAllTemplateData(masterId: any) {
    getAllTemplateData({
      masterId: masterId,
      onSuccess: (res) => {
        setInvoiceItemData(res?.data);
      },
      onFail,
    });
  }
  function handleGetFiledState() {
    getFiledState({
      onSuccess: (res) => {
        // const selectFiledState = res?.data?.map((item: any) => {
        //   return {
        //     value: item?.value,
        //     lable: item?.id,
        //     // special_requirements: item.special_requirements,
        //   };
        // });
        setSelectFiledState(res?.data);
      },
      onFail,
    });
  }
  const handleModeChange = (e: RadioChangeEvent) => {
    setChangeType(e.target.value);
    handleGetAllTemplateData(e.target.value);
  };
  const onFinish = (values: any) => {
    updateTemplateDetails({
      data: values?.items,
      onSuccess: (res) => {
        if (res?.data?.isSuccess) {
          onAlert({
            type: 'success',
            message: 'اطلاعات پایه با موفقیت ثبت گردید',
          });
        }
      },
      onFail,
    });
  };

  return (
    <div className="p-10 mx-4 my-4 relative">
      <div className=" border-b-2 border-lightGray pb-2">
        <span className=" font-bold text-base">تعریف مقادیر صورتحساب</span>
      </div>
      <div className="p-5  my-4 shadow-[0_0px_5px_rgba(0,0,0,0.2)]">
        <div className="my-1">
          <span className="font-bold ml-8">
            نوع صورتحساب خود را انتخاب نمایید:{' '}
          </span>
          {invoiceTypeData && (
            <Radio.Group onChange={handleModeChange} value={changeType}>
              {invoiceTypeData.map((mapTypeItem: any) => (
                <Radio
                  disabled={mapTypeItem.disabled}
                  key={mapTypeItem.id}
                  value={mapTypeItem.id}
                >
                  {mapTypeItem.templateName}
                </Radio>
              ))}
            </Radio.Group>
          )}
        </div>
        {invoiceItemData && (
          <div className="mt-10">
            <Form
              ref={formRef}
              className="my-8 mx-2 grid grid-cols-12 items-center justify-center"
              onFinish={onFinish}
            >
              <Form.List name="items" initialValue={invoiceItemData}>
                {(fields, { add, remove }) => (
                  <>
                    {fields.map((field, index) => (
                      // <div className=" col-span-6 flex flex-1 items-center justify-center">
                      <div className=" col-span-12">
                        <Space
                          key={field.key}
                          style={{
                            display: 'flex',
                            marginBottom: 8,
                            alignItems: 'center',
                          }}
                          align="baseline"
                        >
                          <div className="flex flex-row">
                            <div className=" items-center justify-center min-w-[100px] h-12">
                              <span>{invoiceItemData?.[index]?.fieldName}</span>
                            </div>
                            <div className=" items-center justify-center min-w-[200px] max-w-[200px] h-12">
                              <span>
                                {invoiceItemData?.[index]?.persianFieldName}
                              </span>
                            </div>
                          </div>
                          <Form.Item
                            {...field}
                            name={[field.name, 'fieldState']}
                            fieldKey={[index, 'lable']}
                          >
                            <Select
                              // showSearch
                              placeholder="نوع را انتخاب نمایید"
                              optionFilterProp="children"
                              className=" rounded min-w-[200px] border border-grayBorder "
                              // onChange={onChange}
                              // onSearch={onSearch}
                              // filterOption={(input, option) =>
                              //   (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                              // }
                              // options={selectFiledState}
                              options={[
                                ...selectFiledState.map((item: any) => ({
                                  label: item.value,
                                  value: item.id,
                                })),
                              ]}
                            />
                            {/* <Select
                          {...{
                            defaultActiveFirstOption: false,
                            // defaultValue: defaultType,
                            label: '',
                            options,
                            className: 'w-80',
                          }}
                        /> */}
                          </Form.Item>
                          <Form.Item
                            {...field}
                            name={[field.name, 'fieldValue']}
                            fieldKey={[index, 'value']}
                          >
                            {/* <Input placeholder="type" /> */}
                            {/* <TextField
                              // onChange={field?.onChange}
                              label="مقدار"
                              className="min-w-[160px]"
                              // defaultValue={
                              //   invoiceItemData?.[index]?.fieldValue
                              // }
                            /> */}
                            <Input
                              placeholder="مقدار"
                              className="min-w-[160px]"
                            />
                          </Form.Item>
                        </Space>
                      </div>
                    ))}
                  </>
                )}
              </Form.List>

              <Form.Item className="col-span-12 fixed top-[14rem] left-10 z-10 ">
                <div className="flex flex-1 justify-end px-10">
                  <Button className="text-white bg-buttonBlue  border-2 border-buttonBlue rounded-md px-4 mr-4 w-36 ">
                    ذخیره
                  </Button>
                </div>
              </Form.Item>
            </Form>
          </div>
        )}
      </div>
    </div>
  );
}
export default withAlert(SetBasicInfo);
