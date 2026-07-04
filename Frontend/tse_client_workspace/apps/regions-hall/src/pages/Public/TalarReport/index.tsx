import { SimpleForm } from '@tse/components/molecules';
import { Icon, Button } from '@tse/components/atoms';
import { ListType, onAlertProps } from '@tse/types';
import { convertDateToJalali, loadFromStorage, separator } from '@tse/tools';
import { useEffect, useRecoilState, useRef, useState } from '@tse/utils';
import { userInfoAtom } from '../../../store/userProfile';
import { getTalarReport } from './service';
import withAlert from '../../../hoc/withAlert';
import ImageGallery from 'react-image-gallery';
import 'react-image-gallery/styles/css/image-gallery.css';

interface TalarInfoTypes {
  onAlert: onAlertProps;
}

function TalarReport({ onAlert }: TalarInfoTypes) {
  const [isLoading, setLoading] = useState<boolean>(false);
  const [talarReport, setTalarReport] = useState<any>([]);

  useEffect(() => {
    handleGetTalarReport();
  }, []);

  function handleGetTalarReport() {
    getTalarReport({ onSuccess: setTalarReport, onFail });
  }

  const onFail = (error: any) => {
    setLoading(false);
    onAlert(error);
  };
  return (
    <div className="rounded shadow-simple px-6 py-3 col-span-12 grid grid-cols-12">
      <h2 className="col-span-12 text-lg font-medium ">گزارش استان‌</h2>
      {talarReport?.length > 0 && (
        <section className="col-span-10 col-start-2 mt-8 pb-10">
          <ImageGallery
            items={talarReport}
            isRTL={false}
            autoPlay={true}
            slideDuration={700}
            slideInterval={6000}
            thumbnailPosition={'right'}
          />
        </section>
      )}
    </div>
  );
}
export default withAlert(TalarReport);
