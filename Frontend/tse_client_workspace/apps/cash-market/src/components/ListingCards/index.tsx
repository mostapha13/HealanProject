import withAlert from 'apps/cash-market/src/hoc/withAlert';
import { useStates, useEffect, useState } from '@tse/utils';
import { Icon, Image, NewSelectSearch, TextField } from '@tse/components/atoms';
import emptyPicture from 'apps/cash-market/src/assets/images/emptyPicture.jpg';
import { CommentOutlined } from '@ant-design/icons';
import { Progress } from 'antd';

const Cards = () => {
  const initialState = {
    CompanyId: '',
    CompanyIdError: false,
    floor: '',
    logoFile: {},
  };
  const [state, setState] = useStates<any>(initialState);
  const { CompanyId, floor, logoFile } = state;
  return (
    <div className="2xl:col-span-2 xl:col-span-4 lg:col-span-6 rounded-lg md:col-span-12 shadow-xl">
      {/* <div className=""> */}
      <div className="flex flex-row bg-gradient-to-r from-[white] to-[#dadada] justify-between  rounded-t-lg p-2">
        <span className="">آسوده محمدپور</span>
        {/* <Icon
      name="icon-doc-text"
      classname="text-gray text-lg cursor-pointer "
      // onClick={() => }
    /> */}
        {/* <ChatBubbleIcon className='text-gray !text-lg'/> */}
        <CommentOutlined className="!text-gray !text-xl" />
      </div>
      <div className="flex flex-row justify-between p-2">
        <span>در جریان عرضه</span>
        <Icon
          name="icon-doc-text"
          classname="text-gray text-lg cursor-pointer"
          // onClick={() => }
        />
      </div>
      <div className="flex flex-row  p-2 justify-center ">
        <div className="w-[100px] h-[100px] rounded-full flex">
          <Image
            src={logoFile?.link == undefined ? emptyPicture : logoFile?.link}
            className="w-full h-full rounded-full opacity-50  "
          />
        </div>
      </div>
      <div className="flex flex-col items-center mt-3 p-2">
        <div className="flex flex-row">
          <span>لیزینگ اقتصاد نوین</span>
        </div>
        <div className="flex flex-row w-full">
          <Progress
            percent={53}
            size="small"
            status="active"
            trailColor="text-lightGray"
            strokeColor="green"
          />
        </div>
        <div className="flex flex-row">
          <span>تامین سرمایه نوین</span>
        </div>
      </div>
      {/* </div> */}
    </div>
  );
};

export default Cards;