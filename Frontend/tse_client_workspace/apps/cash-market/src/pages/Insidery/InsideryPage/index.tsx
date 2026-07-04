import { Navbar } from '@tse/components/templates';
import { useEffect, useState } from 'react';
import AdminPanel from 'apps/cash-market/src/assets/images/adminPanel.png';
import { Icon } from '@tse/components/atoms';
import emptyPicture from 'apps/cash-market/src/assets/images/emptyPicture.jpg';
import {
  getMenus,
} from 'apps/cash-market/src/Controller/Insidery/InsideryInfo';
import { Link } from 'react-router-dom';
import './../../../components/Insidery/Sidebar/sidebar.scss';
import withAlert from 'apps/cash-market/src/hoc/withAlert';
import InsideryStaff from 'apps/cash-market/src/components/Insidery/InsideryStaff';
import InsideryStaffTransaction from 'apps/cash-market/src/components/Insidery/InsideryStaffTransaction';
import InsideryFamily from 'apps/cash-market/src/components/Insidery/InsideryFamily';
import InsideryFamilyTransaction from 'apps/cash-market/src/components/Insidery/InsideryFamilyTransaction';
import InsideryFinal from 'apps/cash-market/src/components/Insidery/InsideryFinal';
import { getUserInfo } from 'apps/cash-market/src/Controller';
import Help from 'apps/cash-market/src/components/Insidery/Help';

const InsideryPage = ({ onAlert }: any) => {

  ///////////Start initial////////

  const [menuListData, setMenuListData] = useState<any>([]);
  const [showRelativesMenu,setShowRelativesMenu]=useState<any>(false);
  const [userSummary, setUserSammary] = useState<any>({});
  const [activeIndex, setActiveIndex] = useState<any>(1);


  useEffect(() => {
    handleGetMenu();
    handelGetUserInfoAction();
  }, []);

  ///////////End initial////////

  ///////////Start setup////////

  const onFail = (error: any) => {
    onAlert(error);
  };

  const onSuccessUserInfo = (res: any) => {
    setUserSammary({
      src: '/',
      fullName: `${res.userSummaryReply.firstName} ${res.userSummaryReply.lastName}`,
    });
  };

  const handleNext = () => {
    handleGetMenu();
    if (showRelativesMenu == false)
      setActiveIndex((prev: number) => (prev < 2 ? prev : 5));
    setActiveIndex((prev: number) => (prev < 5 ? prev + 1 : prev));
  };

  const handleBack = () => {
    handleGetMenu();
    if (showRelativesMenu == false)
      setActiveIndex((prev: number) => (prev > 3 ? 3 : 2));
    setActiveIndex((prev: number) => (prev > 1 ? prev - 1 : prev));
  };

  const handelHelp = (e: any) => {
    console.log('help');
  };

  ///////////End setup//////////

  ///////////Start API////////

  const handleGetMenu = () => {
    getMenus({
      onSuccess: (res: any) => {
        setMenuListData(res.menus);
        setShowRelativesMenu(res.showRelativesMenu);
      },
      onFail,
    });
  };

  const handelGetUserInfoAction = () => {
    getUserInfo({ onSuccess: onSuccessUserInfo, onFail });
  };

 
  ///////////End API////////

  return (
    <>
      {/*Start navbar */}

      <div className="relative">
        <Navbar nameLogo={AdminPanel} />
        <a
          className="absolute left-6 top-[45%] text-blue items-center flex"
          href="/cartable"
        >
          <span>بازگشت </span>
          <Icon
            name="icon-left-open"
            classname="text-listingNoContent text-2xl cursor-pointer pt-1"
          />
        </a>
      </div>

      {/*End navbar */}

      <div className="flex justify-between">
        <div className="flex-[2] sticky flex-col flex items-center min-h-[814px]">
          <div className="flex flex-col items-center mt-20">
            <img className="w-24 h-24 rounded-full" src={emptyPicture} />

            <p className="font-extra-bold mt-2">{userSummary.fullName}</p>
          </div>
          <div className="flex flex-col justify-center mt-8">
            {menuListData.length > 0 &&
              menuListData.map((item: any) => (
                <div className={`mb-2`} key={item.id}>
                  <Link
                    key={item.id}
                    // onClick={() => setActiveIndex(item.id)}
                    className={`insideryLink cursor-default`}
                    to="/insidery/insidery-staff"
                  >
                    <h2
                      className={`insideryh2 ${
                        activeIndex == item.id && 'insideryactive'
                      } ${item.isDone && 'done'}`}
                    >
                      {item.title}
                    </h2>
                    <p className="text-black mt-2">{item.subTitle}</p>
                  </Link>
                </div>
              ))}
          </div>
        </div>
        <div className="insideryContent">
          <Help onClick={handelHelp} />
          {activeIndex == 1 && (
            <>
              <InsideryStaff onNext={handleNext} onAlert={onAlert} />
            </>
          )}
          {activeIndex == 2 && (
            <>
              <InsideryStaffTransaction
                onNext={handleNext}
                onAlert={onAlert}
                onBack={handleBack}
              />
            </>
          )}
          {activeIndex == 3 && (
            <>
              <InsideryFamily
                onNext={handleNext}
                onAlert={onAlert}
                onBack={handleBack}
              />
            </>
          )}
          {activeIndex == 4 && (
            <>
              <InsideryFamilyTransaction
                onNext={handleNext}
                onAlert={onAlert}
                onBack={handleBack}
              />
            </>
          )}
          {activeIndex == 5 && (
            <>
              <InsideryFinal
                onNext={handleNext}
                onAlert={onAlert}
                onBack={handleBack}
              />
            </>
          )}
        </div>
      </div>
    </>
  );
};
export default withAlert(InsideryPage);
