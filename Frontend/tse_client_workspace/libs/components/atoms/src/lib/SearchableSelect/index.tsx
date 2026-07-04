import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import { Icon } from '@tse/components/atoms';
import '../CheckList/style.scss';

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      width: 220,
      marginLeft: '-14px',
    },
  },
};

export const SearchableSelect = ({
  label,
  value,
  onChange,
  showKey,
  selectedKey,
  data,
  className,
  onSearch,
  required,
  error,
}: any) => {
  return (
    <FormControl fullWidth className={className} size="small">
      <InputLabel className="labelRtl">{label}</InputLabel>
      <Select
        value={value?.[showKey]}
        label={label}
        onChange={onChange}
        IconComponent={() => {
          return <Icon name="icon-down-open" classname="text-[12px] ml-3" />;
        }}
        required={required}
        error={error}
        MenuProps={MenuProps}
      >
        <div>
          {onSearch && (
            <input
              placeholder="جست و جو"
              onChange={(e: any) => onSearch(e.target.value)}
              className="px-3 mb-2"
            />
          )}
          {data?.map((item: any) => {
            return (
              <MenuItem value={item[selectedKey]}>{item[showKey]}</MenuItem>
            );
          })}
        </div>
      </Select>
    </FormControl>
  );
};
