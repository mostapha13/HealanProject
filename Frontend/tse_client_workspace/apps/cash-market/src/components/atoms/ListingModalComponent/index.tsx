import { Modal } from 'antd';
import { ChildrenType } from '@tse/types';
import { Button, Icon } from '@tse/components/atoms';
import { useSearchParams } from '@tse/utils';
import {
  confirmGeneralDossierModal,
  revelenteGeneralDossierModal,
  irrevelenteGeneralDossierModal,
  rejectGeneralDossierModal,
} from 'apps/cash-market/src/Controller/Listing/Modal';
import TicketChat from 'apps/cash-market/src/components/molecules/TicketChat';

export interface ModalProps {
  children?: ChildrenType;
  data?: any;
  listData?: any;
  isOpen?: boolean;
  onCloseModal: () => void;
  isShowChat?: boolean;
  onAlert?: any;
  onSuccessSubmit?: any;
  lastValue?: any;
}
export function ListingModalComponent(props: ModalProps) {
  const {
    children,
    data,
    listData,
    isOpen,
    onCloseModal,
    isShowChat,
    onAlert,
    onSuccessSubmit,
    lastValue,
  } = props;
  const [searchParams] = useSearchParams();

  const dossierId =
    searchParams.get('id') != null ? searchParams.get('id') : null;
  const onFail = (error: any) => {
    onAlert(error);
  };
  const handleRejectGeneralDossierModal = () => {
    const queryData = { dossierId, submenuId: data?.submenuId };
    rejectGeneralDossierModal({
      data: queryData,
      onSuccess: (res: any) => onSuccess(),
      onFail,
    });
  };
  const handleConfirmGeneralDossierModal = () => {
    const queryData = {
      dossierId,
      submenuId: data?.submenuId,
      lastValue: lastValue,
    };
    confirmGeneralDossierModal({
      data: queryData,
      onSuccess: (res: any) => onSuccess(),
      onFail,
    });
  };
  const handleIrrevelenteGeneralDossierModal = () => {
    const queryData = { dossierId, submenuId: data?.submenuId };
    if (listData?.isIrrevelent == true) {
      revelenteGeneralDossierModal({
        data: queryData,
        onSuccess: (res: any) => onSuccess(),
        onFail,
      });
    } else {
      irrevelenteGeneralDossierModal({
        data: queryData,
        onSuccess: (res: any) => onSuccess(),
        onFail,
      });
    }
  };
  const onSuccess = () => {
    onSuccessSubmit();
  };

  return (
    <Modal
      visible={isOpen}
      closable={false}
      style={{ textAlign: 'right', padding: '0px' }}
      footer={null}
      centered
      width={'95%'}
      className="custom-modal"
    >
      <div className="grid grid-cols-12 gap-4  justify-center items-center bg-listingBaseColorModal p-6 rounded-2xl overflow-y-auto">
        <div className="flex col-span-12 items-center  justify-between rounded-2xl mb-8">
          <Icon
            name="icon-cancel-outline"
            classname="text-[#d4cfcf] text-lg cursor-pointer"
            onClick={onCloseModal}
          />
          <span className=" text-white text-base font-bold">
            {data?.submenuTitle}
          </span>
          <div className="flex flex-row">
            {listData?.showConfirm && (
              <Button
                className="w-36 h-9  bg-listingModalAcceptButton text-white m-2"
                onClick={handleConfirmGeneralDossierModal}
              >
                تایید
              </Button>
            )}
            <Button
              className={`${
                listData?.isIrrevelent
                  ? 'bg-listingNoContent'
                  : 'bg-listingIrrelevantButton'
              } w-36 h-9 text-white m-2`}
              onClick={handleIrrevelenteGeneralDossierModal}
            >
              {listData?.isIrrevelent ? 'موضوعیت دارد' : 'فاقد موضوعیت'}
            </Button>
            {listData?.showReject && (
              <Button
                className="bg-listingModalRejectButton text-white w-36 h-9 m-2"
                onClick={handleRejectGeneralDossierModal}
              >
                نیاز به اصلاح
              </Button>
            )}
          </div>
        </div>
        {children}
        {isShowChat && (
          <div
            className={` ${
              isShowChat
                ? '2xl:col-span-4 xl:col-span-4 lg:col-span-12 md:col-span-12 sm:col-span-12 h-full w-full'
                : 'w-0'
            } justify-start items-center  rounded-2xl  bg-white `}
          >
            <TicketChat
              isShowChat
              onAlert={onAlert}
              submenuId={data?.submenuId}
            />
          </div>
        )}
      </div>
    </Modal>
  );
}
