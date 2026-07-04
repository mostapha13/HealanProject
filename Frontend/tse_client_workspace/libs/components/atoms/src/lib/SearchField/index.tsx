import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import './style.scss';
export function SearchField({
  data,
  showKey,
  className,
  onChange,
  value,
  ...props
}: any) {
  return (
    <Autocomplete
      id="free-solo-demo"
      freeSolo
      //clearOnBlur
      clearIcon={false}
      className={`${className} !h-[8px]`}
      options={
        data?.length > 0 && data?.map((option: any) => option?.[showKey])
      }
      onChange={(e: any) => onChange?.(e.target?.innerText)}
      value={value}
      renderInput={(params) => (
        <TextField
          {...params}
          className={`textfieldRtl`}
          size="small"
          onChange={(e) => onChange?.(e.target.value)}
          {...props}
        />
      )}
    />
  );
}
