import React, { useMemo } from 'react';
import { Select, Empty } from 'antd';
import './style.scss';

const { Option } = Select;

export function AntdSelectSearch({
  data,
  showKey,
  idKey,
  className,
  onChange,
  value,
  isDisable,
  label,
  required,
  error,
  onSearch,
  ...props
}: any) {
  const filteredData = useMemo(() => {
    if (!idKey) return data || [];
    const seen = new Set();
    return (data?.items || data || [])?.filter((item: any) => {
      const id = item?.[idKey];
      if (seen?.has(id)) return false;
      seen?.add(id);
      return true;
    });
  }, [data, idKey]);

  const getValue = () => {
    if (!value) return undefined;
    return idKey ? value?.[idKey] : value?.[showKey];
  };

  return (
    <Select
      style={{ borderRadius: 4, height: '42px' }}
      className={`custom-select !border  ${className} ${
        error ? ' !border-red' : '!border-grayBorder'
      }`}
      placeholder={label}
      showSearch
      allowClear
      disabled={isDisable}
      value={getValue()}
      onSearch={onSearch}
      notFoundContent={
        <Empty
          image={Empty.PRESENTED_IMAGE_DEFAULT}
          description="موردی یافت نشد"
        />
      }
      onChange={(val: any, option: any) => {
        const selectedItem = filteredData?.find((item: any) =>
          idKey ? item[idKey] === val : item[showKey] === val
        );
        onChange?.(selectedItem || '');
      }}
      filterOption={(input, option: any) =>
        (option?.children ?? '')?.toLowerCase()?.includes(input?.toLowerCase())
      }
      required={required}
      {...props}
    >
      {filteredData?.map((item: any) => (
        <Option
          key={idKey ? item[idKey] : item[showKey]}
          value={idKey ? item[idKey] : item[showKey]}
        >
          {item[showKey]}
        </Option>
      ))}
    </Select>
  );
}
