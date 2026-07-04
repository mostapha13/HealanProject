import { SimpleForm } from '@tse/components/molecules';
import { HeaderTypes, ListType, onAlertProps } from '@tse/types';
import { useState, useEffect, useRef } from '@tse/utils';
import withAlert from '../../../hoc/withAlert';
import { FILE_BASE_URL } from 'apps/tax-front/src/constants';
import { Table } from 'apps/tax-front/src/components/Table';

import { Input, Space } from 'antd';
const { Search } = Input;
interface SetServicesCodeType {
  onAlert: onAlertProps;
}
const pageSize = 10;
function DownloadForms(props: SetServicesCodeType) {
  const { onAlert } = props;
  const [isLoading, setLoading] = useState(false);
  const [getAllServiceCodeState, setGetAllServiceCodeState] = useState<any>([]);
  const [pageNumber, setPageNumber] = useState(1);
  const data: any = [
    {
      name: 'فایل ارسال صورتحساب',
      link: '',
    },
  ];
  const tableHeader: HeaderTypes[] = [
    {
      title: 'نام فایل',
      dataIndex: 'name',
      key: 'name',
      className: 'col-span-3',
      sorter: false,
    },
    {
      title: 'لینک دانلود',
      dataIndex: 'link',
      key: 'link',
      className: 'col-span-3',
      sorter: false,
    },
  ];
  return (
    <div className="p-10">
      <div className="px-6">
        <h2 className="col-span-full text-lg font-medium border-b-2 py-4 border-lightGray">
          دانلود فرمت استاندارد
        </h2>
        <div className=" grid grid-cols-12 gap-4 py-10 px-4 mt-6 shadow-[0_0px_5px_rgba(0,0,0,0.2)]">
          <span className=" col-span-12 ">
            از جدول زیر برای دانلود فرمت استاندارد فایل ها استفاده نمایید.
          </span>
        </div>

        <div className=" border-2 border-grayBackground mt-10">
          <Table
            className="col-span-12"
            columns={tableHeader}
            withRow
            data={data}
            pageSize={1000}
            totalPages={1}
          />
        </div>
      </div>
    </div>
  );
}

export default withAlert(DownloadForms);
