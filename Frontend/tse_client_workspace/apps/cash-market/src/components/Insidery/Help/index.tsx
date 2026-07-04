import React from 'react';
import { Icon } from '@tse/components/atoms';
import { Link } from 'libs/utils/src/lib/utils';

export default function Help({onClick}: any) {

  return (
    <div className="mb-2 mt-6 w-[80%] flex justify-end">
      <div onClick={onClick}>
        <Icon
          name="icon-guide"
          classname="text-[#B18F47] text-2xl cursor-pointer"
        />
        <span className="text-[#B18F47] text-lg cursor-pointer">راهنما</span>
      </div>
    </div>
  );
}
