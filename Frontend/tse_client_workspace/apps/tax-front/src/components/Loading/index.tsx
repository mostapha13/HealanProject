import { Modal } from 'antd';
import { Image } from '@tse/components/atoms';
import loafingGif from 'apps/tax-front/src/assets/gif/loading.gif';
export interface LoadingModalProps {
  visible?: boolean;
}
function LoadingModal(props: LoadingModalProps) {
  const { visible } = props;
  return (
    <div>
      <Modal
        visible={visible}
        closable={false}
        style={{ textAlign: 'center', padding: '0px' }}
        title={''}
        footer={null}
        centered
        width={250}
      >
        <div className="flex justify-center flex-col items-center">
          <Image className="w-[250px] " src={loafingGif} alt="" />
          {/* <span className=" font-bold mt-4">
              اطلاعات در حال ارسال می باشد.
            </span> */}
          {/* <Image src={srcImage} className="" /> */}
        </div>
      </Modal>
    </div>
  );
}
export default LoadingModal;
