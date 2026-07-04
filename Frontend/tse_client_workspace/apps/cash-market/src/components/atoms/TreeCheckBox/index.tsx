import { Tree } from 'antd';
import type { TreeDataNode, TreeProps } from 'antd';
import { useEffect, useState } from '@tse/utils';
import { DownOutlined } from '@ant-design/icons';

export interface TreeCheckBoxProps {
  data: any;
  checkedKeysProps: any;
  initialCheckedKeys?: React.Key[];
}

export function TreeCheckBox(props: TreeCheckBoxProps) {
  const { data, initialCheckedKeys, checkedKeysProps } = props;
  const [expandedKeys, setExpandedKeys] = useState<React.Key[]>([]);
  const [checkedKeys, setCheckedKeys] = useState<React.Key[]>(
    initialCheckedKeys ? initialCheckedKeys : [0]
  );
  const [selectedKeys, setSelectedKeys] = useState<React.Key[]>([]);
  const [autoExpandParent, setAutoExpandParent] = useState<boolean>(true);
  useEffect(() => {
    if (initialCheckedKeys) {
      setCheckedKeys(initialCheckedKeys);
    }
  }, [initialCheckedKeys]);
  const onExpand: TreeProps['onExpand'] = (expandedKeysValue) => {
    setExpandedKeys(expandedKeysValue);
    setAutoExpandParent(false);
  };

  const onCheck: TreeProps['onCheck'] = (checkedKeysValue) => {
    setCheckedKeys(checkedKeysValue as React.Key[]);
    checkedKeysProps(checkedKeysValue);
  };

  const onSelect: TreeProps['onSelect'] = (selectedKeysValue, info) => {
    setSelectedKeys(selectedKeysValue);
  };
  return (
    <Tree
      checkable
      switcherIcon={<DownOutlined className="rotate-180" />}
      onExpand={onExpand}
      expandedKeys={expandedKeys}
      autoExpandParent={autoExpandParent}
      onCheck={onCheck}
      checkedKeys={checkedKeys}
      onSelect={onSelect}
      selectedKeys={selectedKeys}
      treeData={data}
    />
  );
}

export default TreeCheckBox;
