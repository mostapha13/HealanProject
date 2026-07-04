// SearchField component
import { Input } from 'antd';
const { TextArea } = Input;

export function AntdTextArea({
  className,
  onChange,
  value,
  error,
  placeholder,
  numberOfRows,
  maxLength,
  ...props
}: any) {
  return (
    <TextArea
      className={`${
        error ? '!border !border-red' : '!border-gray'
      } ${className}`}
      placeholder={placeholder}
      rows={numberOfRows}
      maxLength={maxLength}
      onChange={(e: any) => onChange(e?.target?.value)}
      value={value}
    />
  );
}
