/* eslint-disable @nrwl/nx/enforce-module-boundaries */
import { Modal } from 'antd';
import { useStates } from '@tse/utils';
import { Image, Button, Icon } from '@tse/components/atoms';

const initialState = {
  isModalVisible: false,
};
function ConfirmFile({ title, src, onReject, onConfirm, type }: any) {
  const [state, setState] = useStates(initialState);
  const { isModalVisible } = state;

  const onShowModal = () => {
    setState({
      isModalVisible: true,
    });
  };

  const onHide = () => {
    setState({
      isModalVisible: false,
    });
  };

  const onDownload = () => {
    window.open(src);
  };

  const onConfirmAction = () => {
    onHide();
    onConfirm();
  };

  const onRejectAction = () => {
    onHide();
    onReject();
  };
  const srcImage =
    type === 'Document' || type === 'PDF' || type === 'Excel' ? '' : src;

  return (
    <div>
      <a onClick={onShowModal}>{title}</a>
      <Modal
        visible={isModalVisible}
        onCancel={onHide}
        style={{ textAlign: 'center', padding: '0px' }}
        title={title}
        footer={null}
      >
        <div className="flex justify-center">
          <Image src={srcImage} className="max-h-[250px]" />
        </div>
        <div className="flex flex-row items-center justify-around mt-10">
          <Button
            className="border-green border text-green w-[100px]"
            onClick={onConfirmAction}
          >
            <Icon name="icon-ok-circle" />
            تایید
          </Button>
          <Button
            className="border-red border text-red w-[100px]"
            onClick={onRejectAction}
          >
            <Icon name="icon-cancel-circle" />
            رد
          </Button>
          <Button
            className="border-blue border text-blue w-[100px]"
            onClick={onDownload}
          >
            <Icon name="icon-download" />
            دانلود
          </Button>
        </div>
      </Modal>
    </div>
  );
}

export default ConfirmFile;
