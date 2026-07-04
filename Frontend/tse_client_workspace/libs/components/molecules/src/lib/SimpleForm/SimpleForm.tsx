/** This is an uncontrolled form component */
import {
  useForm,
  Children,
  useEffect,
  useState,
  useImperativeHandle,
  request,
} from '@tse/utils';
import {
  Button,
  Modal,
  Select,
  SelectMultiple,
  TextField,
  Upload,
} from '@tse/components/atoms';
import { Controller } from 'react-hook-form';
import { DatePicker } from '@tse/components/molecules';
import { IFormInput, ListType } from '@tse/types';
import { Table } from '@tse/components/organism';

const initial = {};

export function SimpleForm(props: IFormInput) {
  const {
    onSubmit,
    list = [],
    autoComplete,
    className,
    values,
    reference,
    isLoading,
    isEditMode,
  } = props;
  const [state, setState] = useState<any>(initial);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalTemp, setModalTemp] = useState<any>({ id: '' });

  const {
    handleSubmit,
    register,
    formState: { errors },
    reset,
    setValue,
    control,
    resetField,
  } = useForm();

  const handleSubmitForm = (data: any): void => {
    list.forEach((item: ListType) => {
      const condition =
        item.itemType === 'file' ||
        item.itemType === 'datePicker' ||
        item.itemType === 'modalSingleSelect' ||
        item.itemType === 'selectMultiple';
      if (condition) {
        delete data[item?.name || ''];
      }
    });
    const result = { ...state, ...data };
    onSubmit(result);
  };

  useImperativeHandle(reference, () => ({
    onClear() {
      reset();
      setState(initial);
    },
  }));

  useEffect(() => {
    if (values) {
      Object.entries(values).forEach(([name, value]: any) => {
        setValue(name, value);
      });
      setState({ ...values });
    }
  }, [setValue, values, isEditMode]);

  const renderItems = Children.toArray(
    list?.map((item: ListType): JSX.Element => {
      const {
        name = '',
        type = 'text',
        value,
        placeholder = '',
        itemType = 'input',
        label,
        inputParentClassName = 'col-span-12',
        inputWrapperClassName,
        className = '',
        errorClassName = 'col-span-12',
        buttonClassName = 'bg-purple',
        buttonTitleClassName = 'text-white',
        selectClassName = '',
        options,
        disabled,
        require,
        tag,
        onClick,
        rule,
        modalTableHeader,
        tableData,
        onChangePage,
        mode,
        uploadUrl,
        checked,
        prefix,
        readOnly,
        link,
        defaultValue,
        onSearch,
        filterOption,
        chidlren,
        onFail,
        onChange,
        limit,
        labelInValue = false,
        fileFormat,
        multiline,
      } = item;

      const formElements = {
        /** Here we can add another tag type, you can develop it easily */
        input: (
          <section className={`grid grid-cols-12 ${className}`}>
            <Controller
              name={name}
              control={control}
              rules={{
                required: require,
              }}
              defaultValue={value || ''}
              render={({ field }: any) => {
                return (
                  <TextField
                    onChange={field?.onChange}
                    className={`text-right !w-full col-span-12 rounded   ${inputWrapperClassName}`}
                    {...{
                      disabled,
                      label: `${label} ${require ? '*' : ''}`,
                      type,
                      tag,
                      placeholder,
                      error: errors[name]?.message,
                      value: value || field?.value,
                      name,
                      rule,
                      errorMessage: errors[name]?.message,
                      prefix,
                      defaultValue,
                      multiline,
                    }}
                  />
                );
              }}
            />
          </section>
        ),
        select: (
          <section className={`grid grid-cols-12 ${className}`}>
            <Controller
              name={name}
              control={control}
              rules={{
                required: require,
              }}
              defaultValue={value || ''}
              render={({ field }: any) => {
                return (
                  <Select
                    {...{
                      disabled,
                      label: `${label} ${require ? '*' : ''}`,
                      options,
                      selectClassName,
                      onChange: (result: any) => {
                        onChange?.(result);
                        field.onChange(result);
                      },
                      register: { ...field },
                      errorMessage: errors[name]?.message,
                    }}
                  />
                );
              }}
            />
          </section>
        ),
        button: (
          <section className={`${className}`}>
            <Button
              tag={tag}
              onClick={onClick}
              isLoading={isLoading}
              className={`w-full rounded h-8 px-8 ${buttonClassName}`}
            >
              <span
                className={`whitespace-pre select-none ${buttonTitleClassName}`}
              >
                {value}
              </span>
            </Button>
          </section>
        ),
        datePicker: (
          <section className={`${className}`}>
            <Controller
              name={name}
              control={control}
              rules={{ required: require }}
              defaultValue={value || ''}
              render={({ field }) => {
                return (
                  <DatePicker
                    {...{
                      disabled,
                      label: `${label} ${require ? '*' : ''}`,
                      position: 'auto',
                      value: value || state[name],
                      defaultValue,
                      name,
                      onChange: (date: string) => {
                        field?.onChange(date);
                        setState({ ...state, [name]: date });
                      },
                      placeholder,
                      wrapperClassName: `!w-full ${inputWrapperClassName}`,
                      parentClassName: `!w-full ${inputParentClassName}`,
                      error: errors[name]?.message,
                    }}
                  />
                );
              }}
            />
            {errors[name] && (
              <span className={`text-red text-extratiny ${errorClassName}`}>
                {errors[name]?.message}
              </span>
            )}
          </section>
        ),
        file: (
          <section className={`grid grid-cols-12 ${className}`}>
            <Controller
              name={name}
              control={control}
              rules={{ required: require }}
              // defaultValue={value || ''}
              render={({ field }) => {
                return (
                  <Upload
                    name={field?.name}
                    label={label}
                    error={errors[name]?.message}
                    onChange={(event: any) => {
                      if (
                        (event.target as HTMLInputElement)?.files?.length !== 0
                      ) {
                        const formData = event?.target?.files?.[0] as File;
                        uploader({
                          url: uploadUrl,
                          file: formData,
                          onSuccess: (fileId: string) => {
                            field?.onChange(event);
                            setState({
                              ...state,
                              [name]: { fileId, fileName: formData?.name },
                            });
                          },
                          onFail,
                        });
                      }
                    }}
                    value={state?.[name]?.fileName}
                    link={`${link || ''}${
                      state?.[name]?.fileId.fileId || state?.[name]?.fileId
                    }`}
                    onDelete={() => {
                      setState({ ...state, [name]: undefined });
                      resetField(name);
                    }}
                    className={`!w-full ${inputParentClassName}`}
                    fileFormat={fileFormat}
                    isHaveTargetValue={true}
                  />
                );
              }}
            />
            {errors[name] && (
              <span className={`text-red text-extratiny ${errorClassName}`}>
                {errors[name]?.message}
              </span>
            )}
          </section>
        ),
        modalSingleSelect: (
          <section className={`grid grid-cols-12 ${className}`}>
            <Controller
              name={name}
              control={control}
              defaultValue={value || ''}
              render={({ field }: any) => {
                return (
                  <TextField
                    onChange={field?.onChange}
                    {...{
                      onClick: () => setIsModalVisible(true),
                      require,
                      label,
                      required: require,
                      value: state[name]?.name || field?.value,
                      register: register(name),
                      name,
                      readOnly,
                      disabled,
                      className: `!w-full col-span-12 rounded border-grayBorder border-[1px] ${inputWrapperClassName}`,
                    }}
                  />
                );
              }}
            />
            <Modal
              isModalVisible={isModalVisible}
              handleOk={() => {
                setState({ [name]: modalTemp });
                setIsModalVisible(false);
                setValue(name, modalTemp.id);
              }}
              handleCancel={() => {
                setModalTemp(undefined);
                setIsModalVisible(false);
              }}
              title={label}
            >
              <Table
                rowSelection={{
                  type: 'radio',
                  onChange: (_: string[], selectedRows: any) => {
                    setModalTemp(selectedRows[0]);
                  },
                  selectedRowKeys: [modalTemp?.id || state[name]?.id],
                }}
                rowKey="id"
                className="col-span-12 border-lightPurple grid grid-cols-12"
                columns={modalTableHeader}
                data={tableData?.lst}
                pageNumber={tableData?.pageNumber}
                totalPages={
                  (tableData?.countAll || 1) / (tableData?.pageSize || 5)
                }
                onChangePage={onChangePage}
              />
            </Modal>
            {errors[name] && (
              <span className={`text-red text-extratiny ${errorClassName}`}>
                {errors[name]?.message}
              </span>
            )}
          </section>
        ),
        checkbox: (
          <section className={`grid grid-cols-12 ${className}`}>
            <label>{label}</label>
            <input type="checkbox" onChange={onClick} checked={checked} />
          </section>
        ),
        selectMultiple: (
          <section className={`grid grid-cols-12 ${className}`}>
            <Controller
              name={name}
              control={control}
              rules={{ required: require }}
              defaultValue={value || ''}
              render={({ field }) => {
                return (
                  <SelectMultiple
                    className="col-span-12"
                    {...{
                      disabled,
                      filterOption,
                      label,
                      options,
                      mode,
                      labelInValue,
                      required: require,
                      placeholder,
                      value: state[name],
                      error: errors[name]?.message,
                      onSearch,
                      limit,
                      onChange: async (params: any) => {
                        field?.onChange(params);
                        setState({
                          ...state,
                          [name]: params,
                        });
                      },
                      onDelete: () => {
                        setState({ ...state, [name]: undefined });
                        resetField(name);
                      },
                    }}
                  />
                );
              }}
            />
            {errors[name] && (
              <span className={`text-red text-extratiny ${errorClassName}`}>
                {errors[name]?.message}
              </span>
            )}
          </section>
        ),
        none: <></>,
        element: <>{chidlren}</>,
      };
      return formElements[itemType];
    })
  );

  return (
    <form
      {...{ className }}
      data-testid="form"
      onSubmit={handleSubmit(handleSubmitForm)}
      autoComplete={autoComplete}
    >
      {renderItems}
    </form>
  );
}

interface UploadType {
  url?: string;
  token?: string;
  name?: string;
  file?: any;
  onSuccess?: any;
  onFail?: any;
}

async function uploader({
  token,
  url,
  name = 'file',
  file,
  onSuccess,
  onFail,
}: UploadType) {
  const formData = new FormData();
  formData.append(name, file);
  try {
    const res = await request.upload({
      token,
      formData: formData,
      baseUrl: url,
      url: '',
    });
    onSuccess?.(res);
  } catch (error) {
    onFail?.(error);
  }
}
