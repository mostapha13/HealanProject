import { Image, Icon } from '@tse/components/atoms';
import { Link } from '@tse/utils';
import tseLogo from './NewLogo.png';
// import logoIcon from './NewLogo.png';
import { BellOutlined } from '@ant-design/icons';
import { useRef, useState, useEffect } from 'react';
import { Badge } from 'antd';
import { readNotification } from 'apps/cash-market/src/Controller';
import { useNavigate } from '@tse/utils';
/* eslint-disable-next-line */
interface NavbarProps {
  nameLogo?: any;
  onExit?: (params: any) => void;
  userInfo?: any;
  leftIconName?: string;
  profileIcon?: boolean;
  goToProfile?: () => void | null;
  notificationData?: any;
}

export function Navbar(props: NavbarProps) {
  const {
    nameLogo,
    onExit,
    userInfo,
    profileIcon,
    leftIconName = 'icon-exit',
    goToProfile,
    notificationData,
  } = props;
  const [open, setOpen] = useState(false);
  const notificationRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();

  const handleClickOutside = (event: any) => {
    if (
      notificationRef.current &&
      !notificationRef.current.contains(event.target)
    ) {
      setOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  const onFail = (error: any) => {};
  const handleReadNotification = (notificationId: any) => {
    const data = {
      NotificationId: notificationId,
    };
    readNotification({
      data: data,
      onSuccess: (res: any) => {},
      onFail,
    });
    navigate('/messages-list');
    setOpen((prevState: any) => !prevState);
  };
  return (
    <div className="shadow-lg z-50 grid py-4 grid-cols-12 2xl:px-10 xl:px-10 lg:px-10 md:px-10 h-fit">
      <div className="2xl:col-span-4 xl:col-span-4 lg:col-span-4 md:col-span-4 grid justify-start content-center sm:hidden xs:hidden">
        <a href="https://www.tse.ir" target="_blank">
          <Image className="w-44" src={tseLogo} />
        </a>
      </div>
      <div className="2xl:col-span-4 xl:col-span-4 lg:col-span-4 md:col-span-4 sm:col-span-6 xs:col-span-12 grid justify-center content-center sm:justify-center xs:justify-center">
        <Link to="/">
          <Image src={nameLogo} />
        </Link>
      </div>
      {onExit && (
        <div className="2xl:col-span-4 xl:col-span-4 lg:col-span-4 md:col-span-4 sm:col-span-6 xs:col-span-12 grid justify-end content-center sm:justify-center xs:justify-center ">
          <div className="flex flex-row items-center">
            {/* {profileIcon && <Icon name="icon-profile" classname="text-2xl" />}
            {userInfo && <span className="mr-1 ml-6">{userInfo}</span>} */}
            {notificationData && (
              <div>
                <Badge count={notificationData?.newMessageCount}>
                  <BellOutlined
                    className="text-xl   cursor-pointer ml-4"
                    onClick={() => {
                      setOpen((prevState: any) => !prevState);
                    }}
                  />
                </Badge>
              </div>
            )}
            <div
              className={`${goToProfile && 'cursor-pointer'} ml-6`}
              onClick={goToProfile}
            >
              {profileIcon && <Icon name="icon-profile" classname="text-xl" />}
              <span className="mr-1">{userInfo}</span>
            </div>
            <Icon
              name={leftIconName}
              classname="cursor-pointer text-xl mr-4"
              onClick={onExit}
            />
          </div>
        </div>
      )}
      {open && notificationData && (
        <div
          ref={notificationRef}
          className="shadow-lg overflow-y-auto  bg-white  2xl:w-2/12 xl:w-3/12 lg:w-4/12 md:w-4/12 h-[27rem] border-2 border-lightGray rounded-md absolute top-24 !z-50 2xl:left-[7%] xl:left-[15%] lg:left-[18%] md:left-[18%]"
        >
          <div className="flex h-10 items-center justify-between border-b-2 border-lightGray mx-4">
            <span className=" text-black font-bold">پیام ها</span>
            <a href="/messages-list">
              <span className=" text-tiny text-blue font-bold">
                نمایش تمام پیام‌ها
              </span>
            </a>
          </div>

          {notificationData?.items?.length > 0 &&
            notificationData?.items?.map((item: any) => {
              return (
                <a
                  className="m-2 h-20 border-lightGray border-2 rounded-md flex flex-col p-2 "
                  onClick={() => handleReadNotification(item?.notificationId)}
                >
                  <span
                    className={`font-bold text-tiny ${
                      item?.status == 'Unreaded'
                        ? 'text-black'
                        : ' text-darkGray'
                    }`}
                  >
                    {item?.instrument?.symbol}
                  </span>
                  <span
                    className={`font-extra-light text-extratiny mt-2 ${
                      item?.status == 'Unreaded'
                        ? 'text-black'
                        : ' text-darkGray'
                    }`}
                  >
                    {item?.messageText}
                  </span>
                </a>
              );
            })}
          {notificationData?.items?.length == 0 && (
            <div className="flex items-center justify-center h-[20rem]">
              <span className=" font-bold">پیام خوانده نشده وجود ندارد.</span>
            </div>
          )}
          {/* <a href="/messages-list">
            <div className="absolute bottom-0 w-full bg-link flex items-center justify-center h-8 cursor-pointer rounded-b-md">
              <span className=" text-tiny text-white">نمایش تمام پیام‌ها</span>
            </div>
          </a> */}
        </div>
      )}
    </div>
  );
}

export default Navbar;
