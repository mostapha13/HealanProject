// SearchField component
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import './style.scss';

export function NewSelectSearch({
  data,
  showKey,
  className,
  onChange,
  value,
  isDisable,
  ...props
}: any) {
  return (
    <Autocomplete
      id="free-solo-demo"
      freeSolo
      disabled={isDisable}
      clearIcon={false}
      className={`${className} !h-[8px]`}
      options={data || []}
      getOptionLabel={(option: any) => option[showKey]} // Use showKey to specify the label property
      onChange={(e: any, selectedOption: any) => onChange?.(selectedOption)}
      value={value}
      renderInput={(params) => (
        <TextField
          {...params}
          className={`textfieldRtl`}
          size="small"
          onChange={(e) => onChange?.(e.target.value)}
          value={value?.brokerName}
          {...props}
        />
      )}
    />
  );
}
