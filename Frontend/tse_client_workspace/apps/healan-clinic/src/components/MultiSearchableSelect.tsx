import React from 'react';
import { Select } from 'antd';
import type { SearchableSelectOption } from './SearchableSelect';

export interface MultiSearchableSelectProps<T extends string | number = string> {
  value: T[];
  onChange: (value: T[]) => void;
  options: SearchableSelectOption<T>[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

/** جستجو و انتخاب چند گزینه؛ مناسب انتساب چند نقش به یک کاربر. */
export function MultiSearchableSelect<T extends string | number = string>({
  value,
  onChange,
  options,
  placeholder = 'انتخاب کنید',
  disabled,
  className,
  style,
}: MultiSearchableSelectProps<T>) {
  return (
    <Select
      mode="multiple"
      className={`healan-searchable-select${className ? ` ${className}` : ''}`}
      style={{ width: '100%', ...style }}
      showSearch
      allowClear
      disabled={disabled}
      placeholder={placeholder}
      optionFilterProp="label"
      filterOption={(input, option) =>
        String(option?.label ?? '')
          .toLowerCase()
          .includes(input.trim().toLowerCase())
      }
      value={value}
      onChange={(selected) => onChange(selected as T[])}
      options={options.map((option) => ({
        value: option.value,
        label: option.label,
        disabled: option.disabled,
      }))}
    />
  );
}
