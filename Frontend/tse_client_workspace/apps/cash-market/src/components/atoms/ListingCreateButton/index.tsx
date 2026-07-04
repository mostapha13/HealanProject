// import { Icon } from '@components';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';

interface ListingSubmitButtonType {
  className?: string;
  onClick?: any;
  buttonName?: string;
}

export const ListingCreateButton = (props: ListingSubmitButtonType) => {
  const { className, onClick, buttonName } = props;

  return (
    <a onClick={onClick} className={`  ${className}`}>
      <AddCircleOutlineIcon className=" text-green !text-lg" />
      <span className="mx-1  text-green">{buttonName}</span>
    </a>
  );
};
