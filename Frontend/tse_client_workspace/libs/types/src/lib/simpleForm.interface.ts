import { ErrorType } from './alertType.interface';
import { ChildrenType } from './index.interface';
import { OptionType } from './select.interface';
import { HeaderTypes } from './tableType.interface';
import { TagTypes } from './tagsType.interface';

export interface IFormInput {
  onSubmit: (...event: any) => void;
  list?: ListType[] | any[];
  defaultValues?: Record<string, any>;
  autoComplete?: 'on' | 'off';
  className?: string;
  values?: any;
  reference?: any;
  isEditMode?: boolean;
  isLoading?: boolean;
  onSuccess?: (...event: any) => void;
}

export interface ListType {
  /** Item type defines our tag type, we can easily add new feature like date picker by adding new type such as 'date' */
  itemType?:
    | 'input'
    | 'button'
    | 'select'
    | 'datePicker'
    | 'file'
    | 'modalSingleSelect'
    | 'selectMultiple'
    | 'element'
    | 'none'
    | 'checkbox';
  type?:
    | 'text'
    | 'number'
    | 'password'
    | 'submit'
    | 'time'
    | 'tel'
    | 'email'
    | 'website'
    | 'numeric'
    | 'float';
  tag?: TagTypes;
  name?: string;
  token?: string;
  prefix?: string;
  fileFormat?: string;
  labelInValue?: boolean;
  value?: string | number;
  rule?: any;
  limit?: number;
  tableData?: {
    lst?: any[];
    countAll?: number;
    pageNumber?: number;
    pageSize?: number;
  };
  mode?: 'multiple' | 'tags';
  modalTableHeader?: HeaderTypes[];
  placeholder?: string;
  label?: string;
  className?: string;
  link?: string;
  chidlren?: any;
  require?: string;
  required?: boolean;
  checked?: boolean;
  filterOption?: boolean;
  color?: string;
  selectClassName?: string;
  buttonClassName?: string;
  buttonTitleClassName?: string;
  inputParentClassName?: string;
  inputWrapperClassName?: string;
  errorClassName?: string;
  options?: OptionType[];
  disabled?: boolean;
  validate?: any;
  children?: any | ChildrenType;
  onClick?: (...event: any) => void;
  onChange?: (...event: any) => void;
  onChangePage?: (...event: any) => void;
  onFail?: (...event: any) => void;
  onSearch?: (event: string) => void;
  uploadUrl?: string;
  defaultValue?: string;
  readOnly?: boolean;
  multiline?: boolean;
}
