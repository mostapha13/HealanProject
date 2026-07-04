/* eslint-disable-next-line */

import type { RadioChangeEvent } from 'antd';
import { useEffect, useState } from '@tse/utils';
import Radio from 'antd/lib/radio';

export interface RadioGroupProps {
  items?: any;
  onChange?: (...params: any) => void;
  className?: string;
  defaultValue?: string | number;
  showKey: string;
  valueKey: string;
  label?: string;
}

export function RadioGroup(props: RadioGroupProps) {
  const { items, onChange, className, defaultValue, showKey, valueKey, label } =
    props;
  const [value, setValue] = useState(defaultValue);

  useEffect(() => {
    if (defaultValue) {
      setValue(defaultValue);
    }
  }, [defaultValue]);

  const handleChange = (e: RadioChangeEvent) => {
    onChange?.(e.target.value);
    setValue(e.target.value);
  };
  return (
    <div className={className}>
      <span className="text-extratiny">{label}</span>
      <Radio.Group
        className="flex !flex-row"
        onChange={handleChange}
        value={value}
      >
        {items?.map((item: any) => {
          return (
            <Radio
              className="whitespace-pre !text-extratiny"
              value={item[valueKey]}
            >
              {item[showKey]}
            </Radio>
          );
        })}
      </Radio.Group>
    </div>
  );
}

export default RadioGroup;
