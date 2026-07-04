import TextField from '@mui/material/TextField';
import './style.scss';

export const TimePickerInput = ({
  onChange,
  defaultValue,
  className,
  label,
  required,
  register,
  value,
  ...props
}: any) => {
  return (
    <TextField
      {...register}
      id="time"
      label={label}
      type="time"
      defaultValue={defaultValue}
      size="small"
      className={`${className} textfieldRtl`}
      InputLabelProps={{
        shrink: true,
      }}
      inputProps={{
        step: 300, // 5 min
      }}
      onChange={(e) => onChange(e.target.value)}
      required={required}
      value={value}
      {...props}
    />
  );
};
