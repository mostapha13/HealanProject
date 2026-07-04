import { CheckCircleOutlined } from '@ant-design/icons';

interface HealanSubmitButtonType {
  className?: string;
  onClick?: any;
  buttonName?: string;
  width?: string;
}

export const HealanSubmitButton = (props: HealanSubmitButtonType) => {
  const { className, onClick, buttonName, width } = props;

  return (
    <a
      onClick={onClick}
      className={`text-white bg-green ${
        width ? width : 'w-[120px]'
      } h-[35px]  flex items-center justify-center rounded hover:text-gray ${className}`}
    >
      <CheckCircleOutlined className="text-lg" />
      <span className="mx-2 text-base">
        {buttonName ? buttonName : 'افزودن'}
      </span>
    </a>
  );
};
