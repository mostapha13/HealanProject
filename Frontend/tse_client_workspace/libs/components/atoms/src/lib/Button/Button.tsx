/* eslint-disable-next-line */
import { Loading } from '@tse/components/atoms';
import { TagTypes } from '@tse/types';
import './styles.scss';
export interface ButtonProps {
  className?: string;
  tag?: TagTypes;
  children?: any;
  type?: any;
  isLoading?: boolean;
  onClick?: (item: any) => void;
  href?: string;
  disabled?: boolean;
}

export function Button(props: ButtonProps) {
  const { className, children, tag = 'button', isLoading, ...rest } = props;
  const Tag = tag;
  return (
    <Tag
      className={`rounded flex justify-center items-center h-8 hover:opacity-70 duration-300 ${className}`}
      {...rest}
    >
      {isLoading && <Loading color="bg-white" />}
      {!isLoading && children}
    </Tag>
  );
}

export default Button;
