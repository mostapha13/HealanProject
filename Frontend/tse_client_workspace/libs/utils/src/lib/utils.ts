/* eslint-disable @nrwl/nx/enforce-module-boundaries */
import * as lodash from 'lodash';
import axios from 'axios';
export {
  useState,
  useEffect,
  lazy,
  Suspense,
  Children,
  memo,
  useImperativeHandle,
  useRef,
  useCallback,
} from 'react';
export {
  Outlet,
  Routes,
  Route,
  Navigate,
  useLocation,
  BrowserRouter,
  Link,
  useNavigate,
  useParams,
  createSearchParams,
  useSearchParams,
} from 'react-router-dom';
export {
  handleArrayToObject,
  handleYupShape,
  handleYupExtractor,
  handleFilterFalsy,
  request,
} from '@tse/tools';

export { yupResolver } from '@hookform/resolvers/yup';
export { useForm } from 'react-hook-form';

export {
  useRecoilState,
  atom,
  selector,
  useRecoilValue,
  RecoilRoot,
  useRecoilCallback,
  useResetRecoilState,
} from 'recoil';
export * as persianTools from '@persian-tools/persian-tools';

export { CSVLink } from 'react-csv';
export { lodash, axios };
