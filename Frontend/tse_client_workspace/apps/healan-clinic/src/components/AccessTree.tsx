import React, { useEffect, useMemo, useState } from 'react';
import { Tree } from 'antd';
import type { DataNode } from 'antd/es/tree';
import type { AccessRoleTreeItem } from '../api/userAccessApi';

function itemTitle(item: AccessRoleTreeItem): string {
  return item.title || item.accessForm?.formTitle || `منو ${item.key}`;
}

function toTreeNodes(items: AccessRoleTreeItem[]): DataNode[] {
  return items.map((item) => ({
    key: item.key,
    title: itemTitle(item),
    children: item.children?.length ? toTreeNodes(item.children) : undefined,
  }));
}

interface AccessTreeProps {
  items: AccessRoleTreeItem[];
  checkedKeys: number[];
  onCheckedKeysChange: (keys: number[]) => void;
}

export function AccessTree({ items, checkedKeys, onCheckedKeysChange }: AccessTreeProps) {
  const [expandedKeys, setExpandedKeys] = useState<React.Key[]>([]);
  const treeData = useMemo(() => toTreeNodes(items), [items]);

  useEffect(() => {
    const allKeys: React.Key[] = [];
    const walk = (nodes: AccessRoleTreeItem[]) => {
      nodes.forEach((node) => {
        allKeys.push(node.key);
        if (node.children?.length) walk(node.children);
      });
    };
    walk(items);
    setExpandedKeys(allKeys);
  }, [items]);

  return (
    <Tree
      checkable
      selectable={false}
      treeData={treeData}
      checkedKeys={checkedKeys}
      expandedKeys={expandedKeys}
      onExpand={(keys) => setExpandedKeys(keys)}
      onCheck={(keys) => {
        const list = Array.isArray(keys) ? keys : keys.checked;
        onCheckedKeysChange(list.map((k) => Number(k)));
      }}
      className="healan-access-tree"
    />
  );
}
