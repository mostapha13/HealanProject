import { Loading, Icon, Image } from '@tse/components/atoms';
import { convertDateToJalali } from '@tse/tools';
import type { ErrorType, onAlertProps } from '@tse/types';
import { useLocation, useEffect, useState } from '@tse/utils';
import { fileBaseUrl } from '../../../constants';
import withAlert from '../../../hoc/withAlert';
import type { NewsDataLstType } from '../../Manager/NewsAndEvents';
import { getNewsOne } from './service';

interface NewsEventsDescriptionPublicType {
  onAlert?: onAlertProps;
}

function NewsEventsDescriptionPublic(props: NewsEventsDescriptionPublicType) {
  const { onAlert } = props;
  const [data, setData] = useState<NewsDataLstType>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { state }: any = useLocation();
  useEffect(() => {
    setIsLoading(true);
    getNewsOne?.({ onFail, onSuccess, id: state?.id });
  }, []);

  function onFail(error: ErrorType) {
    setIsLoading(false);
    onAlert?.(error);
  }

  function onSuccess(data: NewsDataLstType) {
    setIsLoading(false);
    setData(data);
  }
  function handlePrint() {
    // const content: any = document.getElementById('printcontents');
    // const pri = document.getElementById('ifmcontentstoprint') as any;
    // // pri.document.open();
    // // pri.document.write(content?.innerHTML);
    // // pri.document.close();
    // // pri.focus();
    // // pri.print();
    // console.log(pri?.contentWindow.document);
    window.print();
  }

  return (
    <div className="rounded shadow-simple px-6 py-3 grid grid-cols-12 gap-4">
      {isLoading && (
        <section className="col-span-12 flex flex-1 justify-center items-center">
          <Loading />
        </section>
      )}
      {!isLoading && (
        <>
          <h2 className="col-span-12 text-lg font-medium ">
            اخبار ، رویدادها و اطلاعیه ها {'>'} شرح خبر
          </h2>
          <article className="col-span-12 grid grid-cols-12" id="printcontents">
            <span className="text-lg col-span-9 font-bold my-3">
              {data.title}
            </span>
            <span className="text-extratiny font-bold col-span-12 text-black opacity-40 my-3">
              {convertDateToJalali(data.start_Date)}
            </span>
            <section className="col-span-12 leading-8 my-3 text-justify">
              <Image
                className="shadow-simple w-80 float-left mr-4 rounded"
                src={`${fileBaseUrl}Download/${data.news_Pic_Id}`}
                alt="خبر"
              />

              <span className="my-3">{data.description}</span>
            </section>
            <section className="text-tiny underline text-blue col-span-12 my-3">
              <a
                target="_blank"
                rel="noreferrer"
                href={`${fileBaseUrl}Download/${data.news_File_Id}`}
              >
                دانلود فایل پیوست
              </a>
            </section>
            <div className="col-span-12 items-center flex justify-between border-t-2 border-lightGrayOpacity pt-2">
              <section>
                <span className="text-tiny">کلیدواژه ها:</span>
                <span className="text-tiny">{data.newsTag}</span>
              </section>

              <Icon
                onClick={handlePrint}
                classname="icon-printer text-2xl hover:cursor-pointer"
              />
            </div>
          </article>
        </>
      )}
    </div>
  );
}

export default withAlert(NewsEventsDescriptionPublic);
