export interface UploadProps {
  label?: string;
  disabled?: boolean;
  readOnly?: boolean;
  name?: string;
  className?: string;
  onChange?: (event: ChangeEvent) => void;
  onBlur?: (event: ChangeEvent) => void;
  onDelete?: () => void;
  value?: any;
  placeholder?: string;
  fileFormat?: string;
  link?: string;
  reference?: any;
  error?: boolean;
  href?: string;
  labelClassName?: string;
  isHaveTargetValue?: boolean;
}

export type ChangeEvent = React.ChangeEvent<HTMLInputElement>;
