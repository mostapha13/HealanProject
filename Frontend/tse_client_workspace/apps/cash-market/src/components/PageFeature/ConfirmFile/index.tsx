/* eslint-disable @nrwl/nx/enforce-module-boundaries */
import { Modal } from 'antd';
import { useStates } from '@tse/utils';
import { Image, Button, Icon } from '@tse/components/atoms';
import { downloadFileApi } from './service';
import { downloadFile } from '@tse/tools';

const initialState = {
  isModalVisible: false,
};
function ConfirmFile({ title, src, onReject, onConfirm, type }: any) {
  const [state, setState] = useStates(initialState);
  const { isModalVisible } = state;
  let guid = src?.fileId;
  let baseUrl = `${src?.link?.split('/File/')?.[0]}/`;
  let fileName = src?.fileName;
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
    downloadFileApi({
      guid: guid,
      baseUrl: baseUrl,
      onSuccess: (res: any) => downloadExportFile(res, fileName),
      onFail: (err: any) => console.log('onFail', err),
    });
  };
  const downloadExportFile = (data: any, name: any) => {
    if (data != null) {
      downloadFile(data, name);
    }
  };
  const onConfirmAction = () => {
    onHide();
    onConfirm();
  };

  const onRejectAction = () => {
    onHide();
    onReject();
  };
  const srcImage = '';
  // type === 'Document' || type === 'PDF' || type === 'Excel' ? '' : '';

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
          {onConfirm && (
            <Button
              className="border-green border text-green w-[100px]"
              onClick={onConfirmAction}
            >
              <Icon name="icon-ok-circle" />
              تایید
            </Button>
          )}
          {onReject && (
            <Button
              className="border-red border text-red w-[100px]"
              onClick={onRejectAction}
            >
              <Icon name="icon-cancel-circle" />
              رد
            </Button>
          )}
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
