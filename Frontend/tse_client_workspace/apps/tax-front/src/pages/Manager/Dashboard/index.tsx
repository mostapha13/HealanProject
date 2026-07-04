import { Button, Select, Image } from '@tse/components/atoms';
import type { ErrorType, onAlertProps } from '@tse/types';
import { useEffect, useState } from '@tse/utils';
import withAlert from '../../../hoc/withAlert';
import excelLogo from '../../../assets/images/ExcelLogo.png';
import { getTradingStatistics } from './service';
import {
  loadFromStorage,
  monthGenerator,
  lastYearsGenerator,
} from '@tse/tools';
import * as _ from 'lodash';
import { baseUrl } from '../../../constants';
interface TalarStatisticsPublicTypes {
  onAlert: onAlertProps;
}

function FirstPage({ onAlert }: TalarStatisticsPublicTypes) {
  const [isLoading, setLoading] = useState<boolean>(false);
  const [changeYear, setChangeYear] = useState<string>('1401');
  const [tradingDetails, setTradingDetails] = useState<any>([]);

  // useEffect(() => {
  //   handleGetTradingStatistics(changeYear);
  // }, [changeYear]);

  const onChangeYear = (item: string) => {
    setChangeYear(item);
  };
  // function handleGetTradingStatistics(year: string) {
  //   setLoading(true);
  //   const talarData = loadFromStorage('hasProvince');
  //   const guid = talarData?.guid || '';
  //   getTradingStatistics({
  //     year: year,
  //     id: guid,
  //     onSuccess: (res) => {
  //       const merged = _.merge(
  //         _.keyBy(res?.lst, 'tr_Month'),
  //         _.keyBy(monthGenerator(), 'value')
  //       );
  //       const values = _.values(merged);
  //       setTradingDetails(values);
  //       setLoading(false);
  //     },
  //     onFail,
  //   });
  // }
  // const onFail = (error: ErrorType) => {
  //   setLoading(false);
  //   onAlert(error);
  // };

  return (
    <div className="rounded shadow-simple px-6 py-3 grid grid-cols-12 gap-4 mb-3">
      <h2 className="col-span-12 text-lg font-medium ">Manager page</h2>

      <div className="grid grid-cols-13 gap-x-5  gap-y-3 w-[70vh]  justify-center items-center mb-5">
        <div className="col-span-9 text-lg font-medium bg-[#ebebeb] py-3 flex flex-row space-x-4 justify-between items-center px-3 ">
          <h2>سال {changeYear}</h2>
        </div>
      </div>
    </div>
  );
}
export default withAlert(FirstPage);
