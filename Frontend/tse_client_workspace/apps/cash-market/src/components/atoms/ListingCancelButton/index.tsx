// import { Icon } from '@components';
import { CloseCircleOutlined } from '@ant-design/icons';

interface ListingSubmitButtonType {
  className?: string;
  onClick?: any;
  buttonName?: string;
  width?: string;
}

export const ListingCancelButton = (props: ListingSubmitButtonType) => {
  const { className, onClick, buttonName, width } = props;

  return (
    <a
      onClick={onClick}
      className={`text-red  ${
        width ? width : 'w-[120px]'
      }  h-[35px]  flex items-center justify-center rounded hover:text-liver ${className}`}
    >
      <CloseCircleOutlined className="text-lg" />
      <span className="mx-2 text-base">{buttonName ? buttonName : 'لغو'}</span>
    </a>
  );
};
