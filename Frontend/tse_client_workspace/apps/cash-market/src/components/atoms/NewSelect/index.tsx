/* eslint-disable-next-line */
import { SelectProps, OptionType } from '@tse/types';

export function NewSelect(props: any) {
  const {
    options = [],
    onChange,
    selectClassName = '',
    optionClassName = '',
    label,
    register,
    className = '',
    disabled,
    required,
    errorMessage,
    showKey = 'name',
    selectedKey = 'value',
    value = '',
  } = props;

  const handleChange = (event: any) => {
    onChange?.(event.target.value, event);
  };

  return (
    <>
      <div
        className={`rounded border-[1px] ${
          errorMessage ? 'border-red' : 'border-blackOpacity'
        }  col-span-12 relative h-[2.5rem] py-1 ${className}`}
      >
        <label className="bg-white absolute -top-1/4 right-2 px-2 text-extratiny text-darkGreen">
          {label}
          {required && '*'}
        </label>
        <select
          disabled={disabled}
          {...register}
          className={`focus:outline-none h-full w-full px-3 ${selectClassName}`}
          onChange={handleChange}
          value={value}
        >
          {options?.map((item: OptionType) => {
            return (
              <option className={optionClassName} value={item?.[selectedKey]}>
                {item?.[showKey]}
              </option>
            );
          })}
        </select>
        {errorMessage && (
          <span className={`text-red text-extratiny whitespace-pre`}>
            {errorMessage}
          </span>
        )}
      </div>
    </>
  );
}

export default NewSelect;
