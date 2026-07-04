import { IranMap } from '@tse/components/organism';
import { ProvinceType } from '@tse/types';
import { Button } from '@tse/components/atoms';
import { useState, useNavigate } from '@tse/utils';
import { saveToStorage } from '@tse/tools';
import { iranProvinces } from './IranProvinces';
import { Navbar } from '@tse/components/templates';
import AdminPanel from '../../../assets/images/AdminPanel.png';
const text =
  'به منظور توسعه بیشتر بازار سرمایه، با ایجاد امکان دسترسی و آشنایی آحاد ملّت ایران با مقوله سرمایه‌گذاری در بورس و نهادهای مالی فعّال در این بازار، طبق مستندات قانونی برنامه سوم (ماده95) و چهارم (ماده15) توسعه اقتصادی، اجتماعی و فرهنگی جمهوری اسلامی ایران مصوب تاریخ‌های1379/01/17 و 1383/06/11 در مجلس شورای اسلامی، شورای بورس مکلف گردید تا برای راه‌اندازی بورس‌های منطقه‌ای، استانی و ایجاد شبکه کارگزاری و پذیرش کارگزاران محلی اقدام نماید. در تاریخ 21 خرداد سال 1381 با تکیه بر این مصوبات قانونی و جهت تحقق اهداف مذکور، عملاً فعالیت بازار سرمایه در مناطق با افتتاح دفتر منطقه‌ای استان خراسان رضوی واقع در شهر مشهد، به عنوان نماینده‌ای از ارکان بازار سرمایه آغاز گردید. هم اکنون بازار سرمایه در 22 مرکز استان به شکل تالار یا دفتر به ارائه خدمات متنوع خود مفتخر است، که به مجموعه آنها بورس مناطق گفته می‌شود. دفاتر و تالارهای مناطق کلیه اختیارات تفویض شده از شورای عالی بورس را در جهت احقاق حقوق سهامداران و ارائه خدمات به مشتریان به کار می‌گیرند. وظایف اصلی تالارها و دفاتر منطقه‌ای عبارتند از: نظارت، که شامل نظارت بر فعالیت نهادهای مالی دارای مجوز از جمله کارگزاران و بازدید و تأیید محل جهت صدور مجوز فعالیت‌شان و بازرسی مستمر از آنها در استان مربوطه و یا استان‌های مجاوری که فاقد دفتر منطقه‌ای هستند. فرهنگ‌سازی، شامل برگزاری دوره‌های آموزشی مستمر و رایگان به صورت حضوری و مجازی برای سرمایه‌گذاران و علاقمندان. اطلاع‌رسانی، شامل اعلام اخبار و اطلاعیه‌های مهم بازار سرمایه از طریق ارتباط مستمر با رسانه‌های ارتباط جمعی و مطبوعات محلی. خدمت‌رسانی، به سهامداران در استان‌های مربوطه. ایفای نقش دبیرخانه تأمین مالی از بازار سرمایه در مراکز استان‌ها، با دایر نمودن سمینارهای متعدد و شرکت در جلسات استانی مرتبط جهت شناسایی بنگاه‌های اقتصادی مستعد و راغبی که قابلیت ورود به بازار سرمایه را دارند از طریق پذیرش شرکت‌ها در بورس اوراق بهادار و یا ارائه راهنمایی‌های لازم جهت انجام تأمین مالی بنگاه‌ها از طریق انتشار اوراق بدهی در بازار سرمایه.';
function MapProvinceSelect() {
  const navigate = useNavigate();
  const [selectedHoverProvince, setSelectedHoverProvince] =
    useState<ProvinceType>({
      name: '',
      id: 0,
    });

  function handleClick(province: ProvinceType) {
    saveToStorage('hasProvince', province);
    navigate('/view/talar-info-public', { replace: false });
  }

  function handleHover(province: ProvinceType) {
    setSelectedHoverProvince(province);
  }
  return (
    <>
      <Navbar nameLogo={AdminPanel} />
      <div className="grid grid-cols-12">
        {/* <div className="grid grid-cols-12 col-span-12 gap-x-10 gap-y-1 px-9 py-5">
          <span className=" col-span-12 font-normal">{text}</span>
        </div> */}
        <section className="col-span-5 2xl:col-span-5 xl:col-span-12 lg:col-span-12 md:col-span-12">
          <div className="grid grid-cols-12 gap-x-10 gap-y-1 px-9 py-5">
            <span className="col-span-12 text-center my-3 text-lg text-gold">
              استان مورد نظر خود را انتخاب کنید
            </span>
            {iranProvinces.map((item: ProvinceType) => {
              return (
                item.enable && (
                  <Button
                    className={`bg-[#ebebeb] col-span-6 ${
                      selectedHoverProvince.id === item.id
                        ? '!bg-lightGold'
                        : ''
                    }`}
                    onClick={handleClick.bind(null, item)}
                  >
                    <span>{item.name}</span>
                  </Button>
                )
              );
            })}
          </div>
        </section>
        <section className="col-span-7 2xl:col-span-7 xl:col-span-12 lg:col-span-12 md:col-span-12 flex justify-center items-center">
          <IranMap
            onClick={handleClick}
            onHover={handleHover}
            items={iranProvinces}
          />
        </section>
      </div>
    </>
  );
}
export default MapProvinceSelect;
