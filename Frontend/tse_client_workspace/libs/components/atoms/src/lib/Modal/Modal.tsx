/* eslint-disable-next-line */
import { Modal as AntModal } from 'antd';
import { ChildrenType } from '@tse/types';

export interface ModalProps {
  children?: ChildrenType;
  title?: string;
  okText?: string;
  cancelText?: string;
  isModalVisible?: boolean;
  hideFooter?: boolean;
  handleOk?: () => void;
  handleCancel?: () => void;
}

export function Modal(props: ModalProps) {
  const {
    children,
    title = 'عنوان',
    cancelText = 'لغو',
    okText = 'تایید',
    isModalVisible,
    handleOk,
    handleCancel,
    hideFooter,
  } = props;

  return (
    <AntModal
      cancelText={cancelText}
      style={{ textAlign: 'center', padding: '0px' }}
      okText={okText}
      title={title}
      visible={isModalVisible}
      onOk={handleOk}
      onCancel={handleCancel}
      footer={hideFooter && null}
    >
      {children}
    </AntModal>
  );
}

export default Modal;
