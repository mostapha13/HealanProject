import MuiInput from '@mui/material/TextField';
import TextareaAutosize from '@mui/base/TextareaAutosize';
import InputAdornment from '@mui/material/InputAdornment';
import './style.scss';
import { useEffect } from '@tse/utils';
import { separator, deSeparator } from '@tse/tools';
import { Icon } from '@tse/components/atoms';

interface TextFieldType {
  inputRef?: any;
  register?: any;
  rule?: any;
  tag?: any;
  value?: any;
  label?: string;
  prefix?: string;
  className?: string;
  readOnly?: boolean;
  required?: any;
  error?: any;
  placeholder?: string;
  onChange?: (...params: any) => void;
  onClick?: (...params: any) => void;
  type?:
    | 'text'
    | 'password'
    | 'time'
    | 'number'
    | 'tel'
    | 'email'
    | 'url'
    | 'numeric'
    | string;
  multiline?: boolean;
  fullWidth?: boolean;
  disabled?: boolean;
  errorMessage?: string;
  defaultValue?: string;
  iconName?: string;
  maxLength?: number;
  min?: number;
  max?: number;
}

const numericRegex = /^[0-9\b]+$/;

export const TextField = ({
  inputRef,
  register,
  value,
  className,
  rule,
  tag = MuiInput,
  readOnly,
  onChange,
  type,
  errorMessage,
  prefix,
  defaultValue,
  iconName,
  maxLength,
  max,
  min,
  ...props
}: TextFieldType) => {
  const Tag = tag === 'textarea' ? TextareaAutosize : MuiInput;

  // useEffect(() => {
  //   if (defaultValue || value) {
  //     handleChange(value);
  //   }
  // }, [value, defaultValue]);

  function handleChange(text: string) {
    const numericRegex = /^[0-9\b]+$/;
    if (type === 'numeric' && numericRegex.test(deSeparator(text))) {
      onChange?.(deSeparator(text));
      return;
    }
    if (type === 'float' && numericRegex.test(deSeparator(text))) {
      onChange?.(parseFloat(text));
      return;
    }
    onChange?.(text);
  }

  const isNumeric = type === 'numeric' && separator(value);
  const isFloat = type === 'float';
  const isNumber = type === 'number';

  return (
    <div className={className}>
      <Tag
        defaultValue={defaultValue}
        ref={inputRef}
        {...register}
        value={type === 'numeric' ? separator(value) : value}
        onChange={({ target }) => handleChange(target.value)}
        className={`${className} w-full textfieldRtl ${
          errorMessage ? '!border-red' : ''
        }`}
        size="small"
        {...props}
        error={errorMessage}
        type={isFloat ? 'number' : type}
        minRows={4}
        ampm={false}
        InputLabelProps={{ className: '!text-darkGreen' }}
        inputProps={{
          ...(isFloat && { step: '0.1' }),
        }}
        {...(isNumber && {
          onKeyDown: (e) =>
            ['e', 'E', '+', '-'].includes(e.key) && e.preventDefault(),
        })}
        InputProps={{
          ...((prefix || iconName) && {
            endAdornment: (
              <InputAdornment position="end">
                {prefix && (
                  <span
                    className="text-right text-extratiny"
                    style={{ direction: 'ltr' }}
                  >
                    {prefix}
                  </span>
                )}
                {iconName && <Icon name={iconName} />}
              </InputAdornment>
            ),
          }),
          readOnly,
          inputProps: { min: min, maxLength: maxLength, max: max },
          ...rule,
        }}
        onInput={(e: any) => {
          const numericValue = parseFloat(e.target.value);
          if (max && !isNaN(numericValue) && numericValue > max) {
            e.target.value = max;
          }
          if (min && !isNaN(numericValue) && numericValue < min) {
            e.target.value = min;
          }
        }}
      />
      {errorMessage && (
        <span className={`text-red text-extratiny whitespace-pre`}>
          {errorMessage}
        </span>
      )}
    </div>
  );
};
