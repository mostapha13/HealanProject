import React from 'react';
import { Select } from 'antd';

export interface SearchableSelectOption<T extends string | number = number> {
  value: T;
  label: string;
  disabled?: boolean;
}

export interface SearchableSelectProps<T extends string | number = number> {
  value: T | null | undefined;
  onChange: (value: T | null) => void;
  options: SearchableSelectOption<T>[];
  placeholder?: string;
  allowClear?: boolean;
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

function toSelectValue(value: string | number | null | undefined): string | number | undefined {
  if (value === null || value === undefined || value === '' || value === 0) {
    return undefined;
  }
  return value;
}

export function SearchableSelect<T extends string | number = number>({
  value,
  onChange,
  options,
  placeholder = 'انتخاب کنید',
  allowClear = true,
  disabled,
  className,
  style,
}: SearchableSelectProps<T>) {
  return (
    <Select
      className={`healan-searchable-select${className ? ` ${className}` : ''}`}
      style={{ width: '100%', ...style }}
      showSearch
      allowClear={allowClear}
      disabled={disabled}
      placeholder={placeholder}
      optionFilterProp="label"
      filterOption={(input, option) =>
        String(option?.label ?? '')
          .toLowerCase()
          .includes(input.trim().toLowerCase())
      }
      value={toSelectValue(value as string | number | null | undefined)}
      onChange={(selected) => onChange((selected ?? null) as T | null)}
      options={options.map((option) => ({
        value: option.value,
        label: option.label,
        disabled: option.disabled,
      }))}
    />
  );
}
