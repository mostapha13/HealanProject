import * as React from 'react';

export interface OptionType {
  name?: string;
  value?: number | string;
  [key: string]: any;
}
export interface SelectProps {
  options?: any[];
  selectClassName?: string;
  required?: any;
  label?: string;
  disabled?: boolean;
  type?: string;
  optionClassName?: string;
  register?: any;
  onChange?: (
    value: number | string | boolean,
    event: React.ChangeEvent<HTMLSelectElement>
  ) => void;
  className?: string;
  errorMessage?: string;
  defaultValue?: string | number | boolean;
  showKey?: string;
  selectedKey?: string;
}
