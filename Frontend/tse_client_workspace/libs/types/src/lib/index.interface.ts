import type { FunctionComponent, ReactElement } from 'react';
export type { FunctionComponent, ReactElement } from 'react';
export interface RouteType {
  id: number;
  path: string;
  component: FunctionComponent;
  name: string;
  nested?: RouteType[];
  hide?: boolean;
  external?: boolean;
}

export type ChildrenType =
  | JSX.Element
  | ReactElement
  | ReactElement[]
  | string
  | number;
