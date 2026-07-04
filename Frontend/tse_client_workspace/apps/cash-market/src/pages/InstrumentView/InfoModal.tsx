import { Icon } from '@tse/components/atoms';
import { Modal, Table } from 'antd';
import { useStates } from '@tse/utils';

const initialState = {
  isModalVisible: false,
};

export default function InfoModal({ data, columns, title }: any) {
  const [state, setState] = useStates<any>(initialState);
  const { isModalVisible } = state;

  const showModal = () => {
    setState({
      isModalVisible: true,
    });
  };

  const handleCancel = () => {
    setState({
      isModalVisible: false,
    });
  };

  return (
    <div>
      <Icon
        name="icon-view-details"
        classname="text-2xl cursor-pointer"
        onClick={showModal}
      />
      <Modal
        visible={isModalVisible}
        onCancel={handleCancel}
        footer={null}
        style={{ textAlign: 'center', padding: '0px' }}
        title={title}
        width={1000}
      >
        <div className="mb-[-20px]">
          <Table
            className="!my-4"
            rowClassName="col-span-12 grid grid-cols-12 "
            columns={columns}
            dataSource={data}
            size="small"
          />
        </div>
      </Modal>
    </div>
  );
}
