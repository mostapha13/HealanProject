import MenuItem from '@mui/material/MenuItem';
import { Select as RSelect } from '@mui/material';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import { Icon } from '@tse/components/atoms';
import './style.scss';

export const Dropdown = ({
  onChange,
  value,
  label,
  data,
  showKey,
  isDisable,
  style,
  className,
  ...props
}: any) => {
  return (
    <FormControl
      sx={{ minWidth: 125, ...style }}
      size="small"
      className={`${className} textfieldRtlLabel`}
    >
      <InputLabel className="textfieldRtlLabel">{label}</InputLabel>
      <RSelect
        value={`${value?.[showKey]}`}
        label={label}
        IconComponent={() => {
          return <Icon name="icon-down-open" classname="text-[16px] ml-3" />;
        }}
        disabled={isDisable}
        {...props}
      >
        {data?.map((item: any, index: number) => {
          const val = showKey ? item[showKey] : item;
          return (
            <MenuItem
              key={showKey ? index : item.key}
              value={val}
              onClick={() => onChange(item)}
              disabled={item.isDisable}
            >
              {val}
            </MenuItem>
          );
        })}
      </RSelect>
    </FormControl>
  );
};
