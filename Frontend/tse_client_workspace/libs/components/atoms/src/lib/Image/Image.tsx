import type { FunctionComponent } from '@tse/types';
import vector from './Vector.png';

/* eslint-disable-next-line */
export interface ImageProps {
  Tag?: 'img' | FunctionComponent;
  alt?: string;
  src?: string;
  className?: string;
}

export function Image(props: ImageProps) {
  const { Tag = 'img', src, alt = 'تصویر نمایه', ...rest } = props;
  const imageSrc = src ? src : vector;
  return <Tag {...{ alt, src: imageSrc }} {...rest} />;
}

export default Image;
