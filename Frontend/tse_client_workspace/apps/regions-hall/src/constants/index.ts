import { environment } from '../environments/environment';

const isProd: boolean = environment.production as boolean;

export const baseUrl = isProd
  ? 'https://rgnlgw.tse.ir/RegionHall/api/v1/'
  : 'http://172.20.16.94:9027/RegionHall/api/v1/';

export const captchaBaseUrl = isProd
  ? 'https://rgnlgw.tse.ir/captcha/'
  : 'http://172.20.16.94:9027/CaptchaProvider/api/v1/Captcha/';

export const fileBaseUrl = isProd
  ? 'https://rgnlgw.tse.ir/File/'
  : 'http://172.20.16.94:9038/File/';

export const uploadFileBaseUrl = isProd
  ? 'https://rgnlfsgw.tse.ir/File/'
  : 'http://172.20.16.94:9038/File/';

export const IDENTITY_BASE_URL = isProd
  ? 'https://identity.tse.ir'
  : 'http://172.20.16.94:9028';

export const IDENTITY_CLIENT_BASE_URL = isProd
  ? 'https://rgnlfloors.tse.ir'
  : 'http://localhost:4200';

export const WITH_LOGIN = true;

////////////////////without login////////////////

// export const baseUrl = isProd
//   ? 'https://rgnlgw.tse.ir/RegionHall/api/v1/'
//   : 'http://172.20.16.94:9027/RegionHall/api/v1/';

// export const captchaBaseUrl = isProd
//   ? 'https://rgnlgw.tse.ir/captcha/'
//   : 'http://172.20.16.94:9027/CaptchaProvider/api/v1/Captcha/';

// export const fileBaseUrl = isProd
//   ? 'https://rgnlgw.tse.ir/File/'
//   : 'http://172.20.16.94:9018/File/';

// export const uploadFileBaseUrl = isProd
//   ? 'https://rgnlfsgw.tse.ir/File/'
//   : 'http://172.20.16.94:9018/File/';

// export const IDENTITY_BASE_URL = isProd
//   ? 'https://identity.tse.ir'
//   : 'http://172.20.16.94:9025';

// export const IDENTITY_CLIENT_BASE_URL = isProd
//   ? 'https://rgnl.tse.ir'
//   : 'http://localhost:4200';

// export const WITH_LOGIN = false;

///////////////////////////////////////////////////////////////
// export const baseUrl = isProd
//   ? 'https://webgwtest.tse.ir/RegionHall/api/v1/'
//   : // 'https://localhost:7646/Regionhall/api/v1/'
//     'http://172.20.16.94:9027/RegionHall/api/v1/';

// export const captchaBaseUrl = isProd
//   ? 'https://webgwtest.tse.ir/captcha/'
//   : 'http://srv-linuxtest01.tseco.net:8063/CaptchaProvider/api/v1/Captcha/';

// export const fileBaseUrl = isProd
//   ? 'https://webgwtest.tse.ir/File/'
//   : 'http://172.20.16.94:9018/File/';

// export const IDENTITY_BASE_URL = isProd
//   ? 'https://identitytest.tse.ir'
//   : 'http://172.20.16.94:9025';

// export const IDENTITY_CLIENT_BASE_URL = isProd
//   ? 'https://rgnltest.tse.ir'
//   : 'http://localhost:4200';
