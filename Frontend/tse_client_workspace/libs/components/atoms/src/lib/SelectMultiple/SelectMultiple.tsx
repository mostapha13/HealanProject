/* eslint-disable-next-line */
import type { OptionType, ReactElement } from '@tse/types';
import { Select as AntSelect } from 'antd';
import './style.scss';

const { Option } = AntSelect;
interface SelectMultipleTypes {
  size?: 'middle' | 'large' | 'small';
  onChange?: (value: any) => void;
  onSearch?: (value: string) => void;
  options?: OptionType[];
  placeholder?: string;
  className?: string;
  error?: string;
  limit?: number;
  allowClear?: boolean;
  labelInValue?: boolean;
  filterOption?: boolean;
  showSearch?: boolean;
  value?: number[] | string[];
  required?: any;
  disabled?: any;
  mode?: 'multiple' | 'tags';
  reference?: any;
  onClear?: any;
  errorMessage?: string;
  showKey?: string;
  selectedKey?: string;
}

export function SelectMultiple(props: SelectMultipleTypes): ReactElement {
  const {
    size = 'middle',
    onChange,
    options,
    placeholder,
    value,
    limit = 4,
    allowClear = true,
    labelInValue,
    className,
    required,
    disabled,
    mode = 'multiple',
    reference,
    onClear,
    error,
    onSearch,
    filterOption,
    showSearch,
    errorMessage,
    showKey = 'name',
    selectedKey = 'value',
  } = props;

  function handleChange(params: any) {
    onChange?.(params);
  }

  function handleSearch(data: any) {
    onSearch?.(data);
  }

  const isMaxValues = value?.length === limit;

  return (
    <div
      className={`rounded border-[1px] ${
        error ? 'border-red' : 'border-blackOpacity'
      } col-span-12 relative  ${className}`}
    >
      {placeholder && (
        <label className="bg-white absolute -top-[38%] right-2 px-2  text-extratiny text-darkGreen">
          {placeholder}
          {required && '*'}
        </label>
      )}
      <AntSelect
        ref={reference}
        mode={mode}
        // className={`${className} border-[1px] rounded border-[#c4c4c4] ${
        //   error && '!border-red'
        // }`}
        size={size}
        // placeholder={placeholder}
        onChange={handleChange}
        style={{ width: '100%', direction: 'ltr' }}
        allowClear={allowClear}
        labelInValue={labelInValue}
        value={
          labelInValue
            ? value?.map((item: any) => ({
                ...item,
                label: item?.name,
              }))
            : value
        }
        {...(isMaxValues && { open: false })}
        maxTagCount="responsive"
        aria-required={required}
        disabled={disabled}
        onClear={onClear}
        onSearch={handleSearch}
        notFoundContent={<Not />}
        filterOption={filterOption}
        showSearch={showSearch}
        status={errorMessage ? 'error' : ''}
        optionFilterProp={showKey ? 'lable' : 'value'}
      >
        {options?.map((item: OptionType) => {
          return (
            <Option
              value={selectedKey ? item?.[selectedKey] : item.value}
              lable={showKey ? item?.[showKey] : item.name}
            >
              {showKey ? item?.[showKey] : item.name}
            </Option>
          );
        })}
      </AntSelect>
    </div>
  );
}

const Not = () => {
  return (
    <span className="flex flex-1 text-center">
      اطلاعاتی جهت نمایش وجود ندارد!
    </span>
  );
};
