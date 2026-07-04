import React, { useMemo } from 'react';
import { Select, Empty } from 'antd';
import { Popconfirm, TreeSelect } from 'antd';
import type { TreeSelectProps } from 'antd';
import { DownOutlined } from '@ant-design/icons';

export function TreeSelectSearch({
  data,
  showKey,
  idKey,
  className,
  onChange,
  onSearch,
  value,
  label,
  required,
  error,
  treeData,
  searchValue,
  onPopupScroll,
  ...props
}: any) {
  return (
    <TreeSelect
      showSearch
      switcherIcon={<DownOutlined className="rotate-90" />}
      className={`${className} !py-2 !border ${error && '!border-red'}`}
      style={{
        border: '1px solid #d9d9d9',
        borderRadius: 4,
        height: '42px',
      }}
      value={value}
      treeNodeFilterProp="title"
      // styles={{
      //   popup: { root: { maxHeight: 400, overflow: 'auto' } },
      // }}
      placeholder={label}
      allowClear
      // treeDefaultExpandAll
      onChange={onChange}
      treeData={treeData}
      onPopupScroll={onPopupScroll}
      onSearch={onSearch}
      searchValue={searchValue}
    />
  );
}
