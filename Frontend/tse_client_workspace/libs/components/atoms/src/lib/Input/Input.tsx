/* eslint-disable-next-line */
import type { ChangeEvent, InputProps } from './types';
import { Icon } from '@tse/components/atoms';
import './style.scss';

export function Input(props: InputProps) {
  const {
    register,
    value,
    onChange,
    inputClassName = '',
    label,
    wrapperClassName = '',
    parentClassName = '',
    disabled = false,
    required,
    reference,
    name,
    tag = 'input',
    error,
    iconName,
    onIconClick,
    ...rest
  } = props;
  const Tag = tag;

  const handleChange = (event: ChangeEvent) => {
    onChange?.(event.target.value, event);
  };

  const borderColor = error ? 'border-red' : 'border-grayBorder';
  return (
    <div className={`group ${parentClassName}`}>
      <div
        className={`form h-full border-[1px] ${borderColor} flex flex-col relative justify-center rounded ${wrapperClassName} ${
          disabled ? 'opacity-40 cursor-not-allowed' : ''
        } ${iconName ? '!flex-row items-center' : ''}`}
      >
        {tag === 'textarea' && (
          <label
            htmlFor={name}
            className="-top-1/4 label-name px-2 w-max duration-1000 h-max text-extratiny text-darkGreen bg-white absolute right-2 pointer-events-none"
          >
            {label}
            {required && '*'}
          </label>
        )}
        <Tag
          name={name}
          className={`py-[6px] w-full px-1 outline-none border-0 ${
            disabled && 'cursor-not-allowed'
          } rounded-sm ${inputClassName}`}
          {...{
            value,
            onChange: handleChange,
            ref: reference,
            ...rest,
          }}
          {...register}
          // required
          readOnly={disabled && 'readonly'}
        />
        {tag !== 'textarea' && (
          <label
            htmlFor={name}
            className={`label-name px-2 w-max duration-1000 h-max text-extratiny text-darkGreen bg-white absolute right-2 pointer-events-none ${
              disabled ? '-top-1/4' : ''
            }`}
          >
            {label}
            {required && '*'}
          </label>
        )}
        {iconName && <Icon name={iconName} onClick={onIconClick} />}
      </div>
    </div>
  );
}

export default Input;
