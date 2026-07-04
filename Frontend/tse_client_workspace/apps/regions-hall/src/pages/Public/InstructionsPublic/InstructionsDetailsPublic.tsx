import { Loading, Icon, Image } from '@tse/components/atoms';
import { convertDateToJalali } from '@tse/tools';
import type { ErrorType, onAlertProps } from '@tse/types';
import { useLocation, useEffect, useState } from '@tse/utils';
import { fileBaseUrl } from '../../../constants';
import withAlert from '../../../hoc/withAlert';
import type { InstructionDataLstType } from '../../Admin/InstructionDefinition';
import { getInstructionsOne } from './service';

interface InstructionsDetailsPublicType {
  onAlert?: onAlertProps;
}

function InstructionsDetailsPublic(props: InstructionsDetailsPublicType) {
  const { onAlert } = props;
  const [data, setData] = useState<InstructionDataLstType>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { state }: any = useLocation();
  useEffect(() => {
    setIsLoading(true);
    getInstructionsOne?.({ onFail, onSuccess, id: state?.id });
  }, []);

  function onFail(error: ErrorType) {
    setIsLoading(false);
    onAlert?.(error);
  }

  function onSuccess(data: InstructionDataLstType) {
    setIsLoading(false);
    setData(data);
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
          <h2 className="col-span-12 text-lg font-medium">
            دستورالعمل ها {'>'} شرح دستورالعمل
          </h2>
          <section className="col-span-12 grid grid-cols-12" id="printcontents">
            <section className="col-span-12 grid grid-cols-12">
              <span className="text-lg col-span-9 font-bold my-3 flex-1">
                {data.title}
              </span>
            </section>
            <span className="text-extratiny font-bold col-span-12 text-black opacity-40 my-3">
              {convertDateToJalali(data.startDate)}
            </span>
            <section className="col-span-12 leading-8 my-3 text-justify">
              <Image
                className="shadow-simple w-80 float-left mr-4 rounded"
                src={`${fileBaseUrl}Download/${data.ins_Pic_Id}`}
                alt="خبر"
              />
              <span className="col-span-12 leading-8 my-3">
                {data.description}
              </span>
            </section>

            <section className="text-tiny underline text-blue col-span-12 my-3">
              <a
                target="_blank"
                rel="noreferrer"
                href={`${fileBaseUrl}Download/${data.ins_File_Id}`}
              >
                دانلود فایل پیوست
              </a>
            </section>
            <div className="col-span-12 items-center flex justify-between border-t-2 border-lightGrayOpacity pt-2">
              <section>
                <span className="text-tiny">کلیدواژه ها:</span>
                <span className="text-tiny">{data.ins_Tag}</span>
              </section>
              <section>
                <Icon classname="icon-printer text-2xl" />
              </section>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

export default withAlert(InstructionsDetailsPublic);
