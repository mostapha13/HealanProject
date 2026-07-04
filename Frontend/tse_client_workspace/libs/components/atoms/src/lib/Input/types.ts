import { TagTypes } from '@tse/types';

export interface InputProps {
  register?: any;
  value?: any;
  children?: any;
  reference?: any;
  label?: string;
  iconName?: string;
  disabled?: boolean;
  readOnly?: boolean;
  require?: string;
  required?: boolean;
  name?: string;
  placeholder?: string;
  /** pass your style in this wrapper => group-focus-within */
  wrapperClassName?: string;
  parentClassName?: string;
  type?: 'text' | 'number' | 'password' | 'file';
  tag?: TagTypes;
  inputClassName?: string;
  onChange?: (value: string, event: ChangeEvent) => void;
  error?: boolean;
  onIconClick?: any;
}
export type ChangeEvent = React.ChangeEvent<HTMLInputElement>;
