import withAlert from 'apps/cash-market/src/hoc/withAlert';
import { useStates } from '@tse/utils';
import { Icon, Image } from '@tse/components/atoms';
import emptyPicture from 'apps/cash-market/src/assets/images/emptyPicture.jpg';
import { Progress } from 'antd';
import FileOpenIcon from '@mui/icons-material/FileOpen';
import LinearProgress from 'libs/components/atoms/src/lib/LinearProgress';
interface FileCardTypes {
  data: any;
}
const ListingFileCard = ({ data }: FileCardTypes) => {
  const initialState = {
    mouseEnter: false,
    logoFile: {
      link: 'http://172.20.16.94:9040/File/Download/a59c1c2c-4385-41eb-bece-284428ad7235',
    },
  };
  const [state, setState] = useStates<any>(initialState);
  const { mouseEnter, logoFile } = state;
  let percentClass = 'high-progress';
  // if (percent < 50) percentClass = 'low-progress';
  // else if (percent < 80) percentClass = 'mid-progress';
  // else percentClass = 'high-progress';

  return (
    <div
      className="2xl:col-span-2 xl:col-span-4 lg:col-span-6 md:col-span-12 
                 rounded-lg shadow-xl relative transition-all duration-1000 
                 hover:scale-[1.05] hover:shadow-2xl bg-white overflow-hidden"
      onMouseEnter={() => setState({ mouseEnter: true })}
      onMouseLeave={() => setState({ mouseEnter: false })}
    >
      <div className="flex flex-row bg-gradient-to-r from-white to-[#dadada] justify-between rounded-t-lg p-2">
        <span>{data?.userName}</span>
        <a href={`listing-stock/dossier-detail?id=${data?.dossierId}`}>
          <Icon
            name="icon-view-details"
            classname="text-gray text-lg cursor-pointer"
          />
        </a>
      </div>
      <div className="flex flex-row justify-start p-2">
        <span>{data?.dossierLevelTypeName}</span>
      </div>
      <div className="flex justify-center p-2">
        <div className="w-[100px] h-[100px] rounded-full mt-2">
          <Image
            src={
              data?.companyAttachment?.link == undefined ||
              data?.companyAttachment?.link == ''
                ? emptyPicture
                : data?.companyAttachment?.link
            }
            className={`w-full h-full rounded-full ${
              mouseEnter ? 'opacity-30' : ''
            } `}
          />
        </div>
      </div>
      <div className="flex flex-col items-center mt-3 p-2">
        <div className=" transition-opacity duration-300 opacity-80 hover:opacity-100">
          <span className={`${mouseEnter ? 'text-grayBorder' : 'text-black '}`}>
            {data?.companyName}
          </span>
        </div>
        <div className="w-full my-4 px-3">
          <LinearProgress
            percent={data?.progressPercentage?.toFixed(2)}
            className={`custom-progress ltr-progress ${percentClass} `}
          />
        </div>
        <div className="text-black transition-opacity duration-300 opacity-80 hover:opacity-100">
          <span className={`${mouseEnter ? 'text-grayBorder' : 'text-black '}`}>
            {data?.adviserCompanyName}
          </span>
        </div>
      </div>
      <a
        href={`/listing-processes-stock?id=${data?.dossierId}`}
        className={`absolute top-[45%] left-1/2 transform -translate-x-1/2 transition-all duration-500 ease-in-out 
        ${mouseEnter ? 'opacity-100 ' : 'opacity-0 '} 
        z-10 flex flex-row items-center justify-center w-[80%] py-2 text-black
        bg-white backdrop-blur-md rounded-full shadow-md cursor-pointer 
        hover:bg-listingNotChecked hover:scale-[1.02] hover:text-white`}
      >
        <span className=" text-[16px] ml-2">ورود به پرونده</span>
        <FileOpenIcon className="text-[28px] text-green-700" />
      </a>
      {/* <div
        className={`absolute bottom-3 left-1/2 transform -translate-x-1/2 transition-all duration-500 ease-in-out 
        ${mouseEnter ? 'opacity-100 ' : 'opacity-0 '}
       bg-white text-sm  w-[80%] flex items-center justify-center text-red bg-red-500 px-4 py-1 rounded-full 
        shadow-md cursor-pointer hover:bg-red-600 hover:scale-[1.02]`}
      >
        کسری مدرک
      </div> */}
    </div>
  );
};

export default ListingFileCard;
