/* eslint-disable-next-line */
import { SelectProps, OptionType } from '@tse/types';

export function Select(props: SelectProps) {
  const {
    options = [],
    onChange,
    selectClassName = '',
    optionClassName = '',
    label,
    register,
    className = 'col-span-12',
    disabled,
    required,
    errorMessage,
    defaultValue,
    showKey = 'name',
    selectedKey = 'value',
  } = props;

  const handleChange = (event: any) => {
    onChange?.(event.target.value, event);
  };

  return (
    <>
      <div
        className={`rounded border-[1px] ${
          errorMessage ? 'border-red' : 'border-blackOpacity'
        }  col-span-12 relative h-fit pt-2 py-1 ${className}`}
      >
        <label className="bg-white absolute -top-1/4 right-2 px-2 text-extratiny text-darkGreen">
          {label}
          {required && '*'}
        </label>
        <select
          disabled={disabled}
          className={`focus:outline-none h-full w-full px-3 ${selectClassName}`}
          defaultValue={defaultValue}
          {...register}
          onChange={handleChange}
        >
          {options?.map((item: OptionType) => {
            return (
              <option className={optionClassName} value={item?.[selectedKey]}>
                {item?.[showKey]}
              </option>
            );
          })}
        </select>
      </div>
      {errorMessage && (
        <span className={`text-red text-extratiny whitespace-pre`}>
          {errorMessage}
        </span>
      )}
    </>
  );
}

export default Select;
