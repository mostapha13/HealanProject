import type { TableProps } from 'antd/lib/table';
import type {
  FilterValue,
  SorterResult,
  TableCurrentDataSource,
  TablePaginationConfig,
} from 'antd/lib/table/interface';

export type {
  FilterValue,
  SorterResult,
  TablePaginationConfig,
} from 'antd/lib/table/interface';

export interface HeaderTypes {
  fieldName?: string;
  buttonColor?: string;
  title?: string;
  key?: string;
  dataIndex?: string;
  titleColor?: string;
  type?: 'text' | 'button' | any;
  headerName?: string;
  className?: string;
  iconClassName?: string;
  render?: any;
  filterDropdown?: any;
  sorter?: any;
  onClick?: (param: any) => void;
  responsive?: {
    xl: number;
    lg: number;
    xxl: number;
    md: number;
    sm: number;
    xs: number;
    span: number;
  };
  children?: HeaderTypes[];
  fixed?: string | boolean;
  width?: number;
}

export interface TableTypes extends Omit<TableProps<any>, 'onChange'> {
  data?: any[];
  rowSelection?: any;
  columns?: any[];
  onChangePage?: (pageNumber: number) => void;
  pageSize?: number;
  totalPages?: number;
  pageNumber?: number;
  className?: string;
  isLoading?: boolean;
  wrapperClassName?: string;
  rowKey?: string;
  isPagination?: boolean;
  disableRow?: boolean;
  onChange?: (params?: TableOnChange) => void;
  childColumns?: any[];
  scrollX?: any;
}

export interface TableOnChange {
  newPagination: TablePaginationConfig;
  filters: Record<string, FilterValue>;
  sorter: any;
  extra: TableCurrentDataSource<any>;
}
