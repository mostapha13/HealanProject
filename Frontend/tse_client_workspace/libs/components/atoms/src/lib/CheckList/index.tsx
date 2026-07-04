import OutlinedInput from '@mui/material/OutlinedInput';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import ListItemText from '@mui/material/ListItemText';
import Select from '@mui/material/Select';
import Checkbox from '@mui/material/Checkbox';
import { Input } from '@mui/material';
import { useEffect, useState } from '@tse/utils';
import { Icon } from '@tse/components/atoms';
import './style.scss';

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      // width: 500,
      marginLeft: '-14px',
    },
  },
};

export const CheckList = ({
  search,
  searchPlaceholder,
  label,
  data,
  showKey,
  className,
  onChange,
  idKey,
  error,
  required,
  max,
  value,
  onSearch,
}: any) => {
  const [name, setName] = useState<string[]>([]);
  const [selectedList, setSelectedList] = useState<any>([]);

  useEffect(() => {
    if (value) {
      setSelectedList(value);
      const names = value?.map((item: any) => {
        return item[showKey];
      });
      setName(names);
    }
  }, [value]);

  const onSelect = (item: any) => {
    const index = selectedList?.findIndex((i: any) => i[idKey] === item[idKey]);

    const newList =
      index === -1
        ? [
            ...selectedList.slice(0, index),
            item,
            ...selectedList.slice(index + 1),
          ]
        : [...selectedList.slice(0, index), ...selectedList.slice(index + 1)];

    const isFull = newList.length <= max;

    let nameList: any[] = [];
    newList.map((i: any) => nameList.push(i[showKey]));
    let uniqueChars = nameList.filter((c, index) => {
      return nameList.indexOf(c) === index;
    });

    let uniqueList = newList.filter((c, index) => {
      return newList.indexOf(c) === index;
    });

    if (max && isFull) {
      setSelectedList(uniqueList);
      onChange(uniqueList);
      setName(uniqueChars);
    } else if (!max) {
      setSelectedList(uniqueList);
      onChange(uniqueList);
      setName(uniqueChars);
    }
  };

  return (
    <FormControl size="small" className={className}>
      <InputLabel id="demo-multiple-checkbox-label" className="labelRtl">
        {label}
      </InputLabel>

      <Select
        // autoWidth
        multiple
        value={name}
        input={<OutlinedInput label={label} />}
        renderValue={(selected) => selected.join(', ')}
        MenuProps={MenuProps}
        IconComponent={() => {
          return <Icon name="icon-down-open" classname="text-[12px] ml-3" />;
        }}
        required={required}
        error={error}
      >
        {onSearch && (
          <input
            placeholder="جست و جو"
            onChange={(e: any) => onSearch(e.target.value)}
            className="px-3 mb-2"
          />
        )}
        <div className={`mr-1 `}>
          {search && <Input placeholder={searchPlaceholder} disableUnderline />}

          {data?.map((item: any, index: number) => {
            const val = showKey ? item[showKey] : item;
            const isCheck =
              selectedList?.findIndex((i: any) => i[idKey] === item[idKey]) ===
              -1
                ? false
                : true;
            return (
              <MenuItem key={index} value={item}>
                <Checkbox checked={isCheck} onClick={() => onSelect(item)} />
                <ListItemText primary={val} />
              </MenuItem>
            );
          })}
        </div>
      </Select>
    </FormControl>
  );
};
