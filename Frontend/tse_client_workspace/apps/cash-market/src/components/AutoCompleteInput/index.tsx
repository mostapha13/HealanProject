import { TextField } from '@mui/material';
import { AutoComplete, Input } from 'antd';
// import { Icon } from '@components';

export const AutoCompleteInput = (props: any) => {
  const {
    placeholder,
    onChange,
    options,
    onSelect,
    className,
    onClick,
    width,
    errorMessage,
    value,
    label,
  } = props;

  return (
    <div className={`${className}`}>
      <AutoComplete
        dropdownMatchSelectWidth={className}
        //   style={{ width: width ? width : 250 }}
        options={options}
        // allowClear
        onSelect={onSelect}
        className={`${className} w-full textfieldRtl `}
        onClick={onClick}
        // placeholder={placeholder}
        value={value}
      >
        <TextField
          label={label}
          InputLabelProps={{ className: '!text-darkGreen' }}
          size="small"
          onChange={onChange}
          error={errorMessage}
          // helperText={errorMessage}
          className={`${className} w-full textfieldRtl ${
            errorMessage ? ' !border-red' : ''
          }`}
        />
      </AutoComplete>
      {errorMessage && (
        <span className={`text-red text-extratiny whitespace-pre`}>
          {errorMessage}
        </span>
      )}
    </div>
  );
};
