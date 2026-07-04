import { Button, Select, Image, Icon } from '@tse/components/atoms';
import type { ErrorType, HeaderTypes, onAlertProps } from '@tse/types';
import { useEffect, useRef, useState } from '@tse/utils';
import withAlert from '../../../../hoc/withAlert';
import { Radio } from 'antd';
import type { RadioChangeEvent } from 'antd';
import { Table } from 'apps/tax-front/src/components/Table';
import WorkFlow from 'apps/tax-front/src/components/WorkFlow';
import { ExtendedTable } from '@tse/components/organism';
interface AddendumGridTypes {
  onAlert: onAlertProps;
}

function AddendumGrid({ onAlert }: AddendumGridTypes) {
  const [isLoading, setLoading] = useState<boolean>(false);
  const gridRef: any = useRef();
  const data = [
    {
      lasttradedate: 'تست',
      tradevolume: 'تست',
      tradevalue: 'تست',
    },
    {
      lasttradedate: 'تست',
      tradevolume: 'تست',
      tradevalue: 'تست',
    },
  ];
  const columns: any = [
    {
      headerName: 'تاریخ',
      field: 'lasttradedate',
      cellClass: 'text-center',
      flex: 1,
      headerClass: '!pr-2',
    },
    {
      headerName: 'زمان',
      field: 'tradevolume',
      flex: 1,
      headerClass: '!pr-2',

      cellClass: 'text-center',
    },
    {
      headerName: 'مکان',
      field: 'tradevalue',
      flex: 1,
      headerClass: '!pr-2',
      cellClass: 'text-center',
    },
  ];
  return (
    <div className="p-10 mx-4 my-4 ">
      <div className="flex bg-headerGray py-4 justify-between px-4">
        <div>
          <span className=" text-lightGray">شرح : </span>
          <span className="text-white">صورتحساب ارسالی اسفندماه 1401</span>
        </div>
        <div>
          <span className=" text-lightGray">تاریخ ارسال : </span>
          <span className="text-white">1402/01/15 - 12:30</span>
        </div>
        <div>
          <span className=" text-lightGray">شماره اندیکاتور : </span>
          <span className="text-white">462325</span>
        </div>
      </div>

      <ExtendedTable
        rowGroupPanelShow="never"
        gridRef={gridRef}
        columnDefs={columns}
        rowData={data}
        paginationPageSize={28}
        enableRtl={true}
        animateRows
        pagination
        className={`
            col-span-12 md:col-span-12 sm:col-span-12 xs:col-span-12 mt-4 h-[600px] `}
      />
      <a
        href="user/send-addenduum?id=102426"
        className="flex items-end justify-end mt-6"
      >
        <Button className="text-white bg-buttonBlue  border-2 border-lightGrayOpacity rounded-md w-[150px] ">
          الحاقیه
        </Button>
      </a>
    </div>
  );
}
export default withAlert(AddendumGrid);
