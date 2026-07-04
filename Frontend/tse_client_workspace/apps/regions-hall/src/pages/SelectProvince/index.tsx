import { IranMap } from '@tse/components/organism';
import { ProvinceType } from '@tse/types';
import { Button } from '@tse/components/atoms';
import { useState, useNavigate, useRecoilState } from '@tse/utils';
import {
  loadFromSession,
  loadFromStorage,
  saveToSession,
  saveToStorage,
} from '@tse/tools';
import { iranProvinces } from '../Public/MapProvinceSelect/IranProvinces';
import { Navbar } from '@tse/components/templates';
import AdminPanel from '../../../assets/images/AdminPanel.png';
import { userInfoAtom } from 'apps/regions-hall/src/store/userProfile';

function MapProvinceSelect() {
  const navigate = useNavigate();
  const [info, setInfo] = useRecoilState(userInfoAtom);
  const talarInfo = loadFromSession('profileData');
  const talar_ID = talarInfo?.userTalars?.map((item: any) => item.talar_ID);

  function handleClick(province: ProvinceType) {
    const selectedTalar: any = talarInfo?.userTalars?.filter(
      (item: any) => item.talar_ID == province?.guid
    );
    const role = talarInfo?.roleNames.filter((item: any) =>
      item.startsWith('RegionHall')
    );
    setInfo({
      ...talarInfo,
      talar_ID: selectedTalar?.[0]?.talar_ID,
      talarName: selectedTalar?.[0]?.talarName,
    });
    saveToSession('profileData', {
      ...talarInfo,
      talar_ID: selectedTalar?.[0]?.talar_ID,
      talarName: selectedTalar?.[0]?.talarName,
    });
    if (role?.[0] === 'RegionHallAdmin') {
      navigate('/dashboard/user-definition', { replace: false });
      return;
    } else if (role?.[0] === 'RegionHallFieldWorker') {
      navigate('/dashboard/submit-info/trading-statistics', {
        replace: false,
      });
      return;
    }
    navigate('/dashboard/submit-info/province-details', { replace: false });
  }

  return (
    <>
      <div className="grid grid-cols-12">
        <section className="col-span-12">
          <div className="grid grid-cols-12 gap-x-10 gap-y-1 px-9 py-5">
            <span className="col-span-12 text-center my-3 text-lg text-gold">
              استان مورد نظر خود را انتخاب کنید
            </span>
            {iranProvinces
              .filter((i: ProvinceType) => talar_ID?.includes(i.guid))
              .map((item: ProvinceType) => {
                return (
                  item.enable && (
                    <Button
                      className={`bg-[#ebebeb] col-span-6 hover:!bg-lightGold `}
                      onClick={handleClick.bind(null, item)}
                    >
                      <span>{item.name}</span>
                    </Button>
                  )
                );
              })}
          </div>
        </section>
      </div>
    </>
  );
}
export default MapProvinceSelect;
