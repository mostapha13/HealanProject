import { Image, Icon } from '@tse/components/atoms';
import { Link } from '@tse/utils';
// import logoIcon from './TextLogo.png';
/* eslint-disable-next-line */
interface NavbarProps {
  mainTitle?: any;
  onExit?: (params: any) => void;
  userInfo?: any;
  leftIconName?: string;
  post?: any;
  profileIcon?: boolean;
}

export function TaxNavbar(props: NavbarProps) {
  const {
    mainTitle,
    onExit,
    userInfo,
    profileIcon = true,
    leftIconName = 'icon-exit',
    post = 'کارشناس',
  } = props;

  return (
    <div className="flex flex-1 justify-between px-10 h-fit bg-headerGray items-center">
      <div className="2xl:col-span-10 xl:col-span-6 lg:col-span-6 md:col-span-6 sm:col-span-12 xs:col-span-12  justify-start content-center sm:justify-center xs:justify-center">
        <span className=" text-lg text-white">{mainTitle}</span>
      </div>
      {onExit && (
        <div className="2xl:col-span-2 xl:col-span-6 lg:col-span-6 md:col-span-6 sm:col-span-12 xs:col-span-12  justify-start content-center sm:justify-center xs:justify-center items-center flex flex-row">
          {/* <div className="bg-gray mx-2 w-10 h-10 items-center justify-center rounded-full">
          <Icon name="icon-profile" classname="text-3xl text-white  " />
        </div> */}
          <Icon name="icon-profile" classname="text-3xl text-white pt-2 " />
          <div className="flex flex-col mx-2">
            <span className="text-base text-white">{userInfo} </span>
            <span className=" text-extratiny text-white">{post} </span>
          </div>
          <Icon
            onClick={onExit}
            name="icon-exit"
            classname=" text-2xl text-white px-4 mt-2  mr-10 cursor-pointer"
          />
        </div>
      )}
    </div>
  );
}

export default TaxNavbar;
