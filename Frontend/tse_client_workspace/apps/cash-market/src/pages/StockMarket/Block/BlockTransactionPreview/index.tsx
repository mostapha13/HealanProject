import withAlert from 'apps/cash-market/src/hoc/withAlert';
import { useStates, useEffect, useState, useNavigate } from '@tse/utils';
import ImageUploadPreview from 'apps/cash-market/src/components/ImageUploadPreview';
import { Button } from '@tse/components/atoms';
import { loadFromStorage, removeItemFromStorage, separator } from '@tse/tools';
import { saveBlockData } from 'apps/cash-market/src/Controller';
import { Modal } from 'antd';
const initialState = { isTrackingModalVisible: false, trackingNumber: 0 };
function BlockTransactionPreview({ onAlert }: any) {
  const navigate = useNavigate();
  const [state, setState] = useStates<any>(initialState);
  const { isTrackingModalVisible, trackingNumber } = state;
  const blockData = loadFromStorage('blockLocalData');
  const onFail = (error: any) => {
    onAlert(error);
  };
  function onSaveClick(): void {
    const data = {
      instrumentId: blockData?.instrumentId,
      symbolCode: blockData?.symbolCode,
      tradeVolume: blockData?.tradeVolume,
      tradePrice: blockData?.tradePrice,
      buyerPersonTypeId: blockData?.buyerPersonTypeId,
      buyerFname: blockData?.buyerFname,
      buyerLname: blockData?.buyerLname,
      buyerBrokerId: blockData?.buyerBrokerId?.[0]?.brokerId,
      buyerCode: blockData?.buyerCode,
      sellerPersonTypeId: blockData?.sellerPersonTypeId,
      sellerFname: blockData?.sellerFname,
      sellerLname: blockData?.sellerLname,
      sellerBrokerId: blockData?.sellerBrokerId?.[0]?.brokerId,
      sellerCode: blockData?.sellerCode,
      responsibleName: blockData?.responsibleName,
      responsiblePost: blockData?.responsiblePost,
      responsibleMobile: blockData?.responsibleMobile,
      transferBlockFile: blockData?.transferBlockFile,
    };
    saveBlockData({ data, onSuccess: onSuccessSave, onFail });
  }
  const onSuccessSave = (res: any) => {
    setState({
      isTrackingModalVisible: true,
      trackingNumber: res?.trackingNumber,
    });
    removeItemFromStorage('blockLocalData');
    setTimeout(() => {
      setState({ isTrackingModalVisible: false });
      navigate('/cartable');
    }, 4000);
  };
  const TrackingModal = () => {
    return (
      <>
        <Modal
          visible={isTrackingModalVisible}
          closable={false}
          style={{ textAlign: 'center', padding: '0px' }}
          title={'درخواست معامله بلوک'}
          footer={null}
          centered
          width={400}
        >
          <div className="flex justify-center flex-col items-center">
            <span className=" font-bold  my-4">
              اطلاعات شما با موفقیت ارسال شد.
            </span>
            <span className="text-blue text-base">
              کد پیگیری : {trackingNumber}
            </span>
          </div>
        </Modal>
      </>
    );
  };
  return (
    <div>
      <div className="border-2 border-lightGray">
        <div className="w-full grid grid-cols-10 ">
          <div className=" col-span-10 items-start flex border-b-2 border-lightGray">
            <span className=" p-2 font-bold">
              درخواست معامله بلوک - خارج از اتاق
            </span>
          </div>
          <div className="grid col-span-10 grid-cols-10 gap-4 justify-between mx-4 mt-4">
            <div className="col-span-2 flex flex-col">
              <span className=" font-bold">نماد :</span>
              <span className=" py-2 ">{blockData?.symbolName}</span>
            </div>
            <div className="col-span-2 flex flex-col">
              <span className=" font-bold">نام شرکت :</span>
              <span className=" py-2 ">{blockData?.companyName}</span>
            </div>
            <div className="col-span-2 flex flex-col">
              <span className=" font-bold">حجم معامله :</span>
              <span className=" py-2 ">
                {separator(blockData?.tradeVolume)}
              </span>
            </div>
            <div className="col-span-2 flex flex-col">
              <span className=" font-bold">قیمت :</span>
              <span className=" py-2 ">{separator(blockData?.tradePrice)}</span>
            </div>
          </div>
          <div className="grid col-span-10 grid-cols-10 gap-4  justify-between mx-4 mt-4">
            <div className=" col-span-10 items-start flex  ">
              <span className="  font-bold text-blue underline">
                اطلاعات خریدار :
              </span>
            </div>
            <div className="col-span-2 flex flex-col">
              <span className=" font-bold">نوع شخصیت :</span>
              <span className=" py-2 ">{blockData?.buyerPersonTypeValue}</span>
            </div>
            <div className="col-span-2 flex flex-col">
              <span className=" font-bold">نام خریدار :</span>
              <span className=" py-2 ">{blockData?.buyerFname}</span>
            </div>
            <div className="col-span-3 flex flex-col">
              <span className=" font-bold">نام خانوادگی/نام شرکت خریدار :</span>
              <span className=" py-2 ">{blockData?.buyerLname}</span>
            </div>
            <div className="col-span-2 flex flex-col">
              <span className=" font-bold">کارگزار خریدار :</span>
              <span className=" py-2 ">
                {blockData?.buyerBrokerId?.[0]?.brokerName}
              </span>
            </div>
            <div className="col-span-2 flex flex-col">
              <span className=" font-bold">کد بورسی :</span>
              <span className=" py-2 ">{blockData?.buyerCode}</span>
            </div>
          </div>
          <div className="grid col-span-10 grid-cols-10 gap-4  justify-between mx-4 mt-4">
            <div className=" col-span-10 items-start flex  ">
              <span className="  font-bold text-blue underline">
                اطلاعات فروشنده :
              </span>
            </div>
            <div className="col-span-2 flex flex-col">
              <span className=" font-bold">نوع شخصیت :</span>
              <span className=" py-2 ">{blockData?.sellerPersonTypeValue}</span>
            </div>
            <div className="col-span-2 flex flex-col">
              <span className=" font-bold">نام فروشنده :</span>
              <span className=" py-2 ">{blockData?.sellerFname}</span>
            </div>
            <div className="col-span-3 flex flex-col">
              <span className=" font-bold">
                نام خانوادگی/نام شرکت فروشنده :
              </span>
              <span className=" py-2 ">{blockData?.sellerLname}</span>
            </div>
            <div className="col-span-2 flex flex-col">
              <span className=" font-bold">کارگزار فروشنده :</span>
              <span className=" py-2 ">
                {blockData?.sellerBrokerId?.[0]?.brokerName}
              </span>
            </div>
            <div className="col-span-2 flex flex-col">
              <span className=" font-bold">کد بورسی :</span>
              <span className=" py-2 ">{blockData?.sellerCode}</span>
            </div>
          </div>
          <div className="grid col-span-10 grid-cols-10 gap-4  justify-between mx-4 mt-4">
            <div className=" col-span-10 items-start flex  ">
              <span className="  font-bold text-blue underline">
                اطلاعات رابط :
              </span>
            </div>
            <div className="col-span-2 flex flex-col">
              <span className=" font-bold">نام و نام خانوادگی :</span>
              <span className=" py-2 ">{blockData?.responsibleName}</span>
            </div>
            <div className="col-span-2 flex flex-col">
              <span className=" font-bold">سمت :</span>
              <span className=" py-2 ">{blockData?.responsiblePost}</span>
            </div>
            <div className="col-span-2 flex flex-col">
              <span className=" font-bold">شماره همراه :</span>
              <span className=" py-2 ">{blockData?.responsibleMobile}</span>
            </div>
          </div>
          <div className="grid col-span-12 grid-cols-12 gap-4  justify-between mx-4 mt-4">
            <div className=" col-span-12 items-start flex  ">
              <span className="  font-bold text-blue underline">مدارک :</span>
            </div>
            <div className=" col-span-12 grid grid-cols-4 pb-4 bg-[#EEEBFF] mb-4 px-4">
              {blockData?.transferBlockFile.length > 0 &&
                blockData?.transferBlockFile?.map((item: any, index: any) => (
                  <ImageUploadPreview
                    className="2xl:col-span-1 xl:col-span-2 lg:col-span-2 md:col-span-4  col-span-1"
                    data={item}
                    onAlert={onAlert}
                  />
                ))}
            </div>
          </div>
        </div>
      </div>
      <div className="flex justify-end my-4">
        <Button
          className="border-blue border text-blue w-[100px] ml-4"
          onClick={window.print}
        >
          چاپ
        </Button>
        <a
          href="/stock/request-block?editMode=true"
          className="border-blue border text-blue w-[100px] ml-4 flex items-center justify-center rounded"
          // onClick={onConfirm}
        >
          ویرایش
        </a>
        <Button
          className="border-blue border bg-blue text-white w-[100px]"
          onClick={onSaveClick}
        >
          ارسال به کارتابل
        </Button>
      </div>
      <TrackingModal />
    </div>
  );
}
export default withAlert(BlockTransactionPreview);
