import { environment } from '../environments/environment';

const isProd: boolean = environment.production as boolean;

// export const baseUrl = isProd
//   ? 'http://172.20.16.94:9045/api/v1/'
//   : 'http://172.20.16.94:9045/api/v1/';

// export const FILE_BASE_URL = isProd
//   ? 'http://172.20.16.94:8075/File/'
//   : 'http://172.20.16.94:8075/File/';

// export const IDENTITY_BASE_URL = isProd
//   ? 'http://172.20.16.94:8066'
//   : 'http://172.20.16.94:8069';

// export const IDENTITY_CLIENT_BASE_URL = isProd
//   ? 'http://172.20.16.94:9006'
//   : 'http://localhost:4200';

///////////////////////////////////////////
export const baseUrl = isProd
  ? 'https://thirdpartygw.tse.ir/api/v1/'
  : 'http://172.20.16.94:9042/api/v1/';

export const FILE_BASE_URL = isProd
  ? 'https://thirdpartygw.tse.ir/File/'
  : 'http://172.20.16.94:9040/File/';

export const IDENTITY_BASE_URL = isProd
  ? 'https://identity.tse.ir'
  : 'http://172.20.16.94:9002';

export const IDENTITY_CLIENT_BASE_URL = isProd
  ? 'https://tax.tse.ir'
  : 'http://localhost:4200';
