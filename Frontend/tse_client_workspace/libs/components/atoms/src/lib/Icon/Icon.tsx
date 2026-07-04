/* eslint-disable-next-line */
export interface IconProps {
  name?: string;
  classname?: string;
  style?: any;
  onClick?: (params: any) => void;
}

export function Icon(props: IconProps) {
  const { name = '', classname = '', style, onClick } = props;
  return (
    <i className={`${name} ${classname}`} onClick={onClick} style={style} />
  );
}

export default Icon;
