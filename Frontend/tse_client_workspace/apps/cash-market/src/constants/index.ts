import { environment } from '../environments/environment';

export const BASE_URL = environment.healanApiUrl;

export const Healan_BASE_URL = environment.healanApiUrl;
export const FILE_BASE_URL = environment.fileApiUrl;

export const IDENTITY_BASE_URL = environment.production
  ? 'http://172.20.16.94:8088'
  : 'https://localhost:44320';

export const IDENTITY_CLIENT_BASE_URL = environment.production
  ? 'http://localhost:4200'
  : 'http://localhost:4200';

export const CASH_MARKET_BASE_URL = environment.production
  ? 'http://172.20.16.94:8089/CashMarket/api/v1/'
  : 'http://172.20.16.94:9003/CashMarket/api/v1/';

export const WORKFLOW_BASE_URL = environment.production
  ? 'http://172.20.16.94:8089/WorkFlow/api/v1/'
  : 'http://172.20.16.94:9003/WorkFlow/api/v1/';

export const NEW_INSTRUMENT_BASE_URL = environment.production
  ? 'http://172.20.16.94:8089/NewInstrument/api/v1/'
  : 'http://172.20.16.94:9003/NewInstrument/api/v1/';

export const PUBLIC_DATA_BASE_URL = environment.production
  ? 'http://172.20.16.94:8090/siteapi/api/v1/PublicData/'
  : 'http://172.20.16.94:8090/siteapi/api/v1/PublicData/';
  
export const USER_MANAGER_API = environment.production
  ? 'http://localhost:5074/UserManager/api/v1/'
  : 'http://localhost:5074/UserManager/api/v1/';

export const LISTING_BASE_API = environment.production
  ? 'http://172.20.16.94:8089/Listing/api/v1/'
  : 'http://172.20.16.94:8094/Listing/api/v1/';

export const INSIDERY_BASE_API = environment.production
  ? 'http://172.20.16.94:9046/Insidery/api/v1/'
  : 'http://172.20.16.94:9046/Insidery/api/v1/';

export const CORPORATE_SURVEY_BASE_URL = environment.production
  ? 'http://172.20.16.94:8089/Listing/api/v1/'
  : 'http://172.20.16.94:8094/Listing/api/v1/';

export const Notification_BASE_URL = environment.production
 ? 'http://localhost:5027/api/v1/'
 : 'http://localhost:5027/api/v1/';
/////////////////////////////productions////////////////

// export const BASE_URL = environment.production
//   ? 'https://sibagw.tse.ir/MarketMaker/api/v1/'
//   : 'http://172.20.16.94:9003/MarketMaker/api/v1/';

// export const FILE_BASE_URL = environment.production
//   ? 'https://sibagw.tse.ir/File/'
//   : 'http://172.20.16.94:9040/File/';

// export const IDENTITY_BASE_URL = environment.production
//   ? 'https://sso.tse.ir'
//   : 'http://172.20.16.94:9002';

// export const IDENTITY_CLIENT_BASE_URL = environment.production
//   ? 'https://siba.tse.ir'
//   : 'http://localhost:4200';

// export const CASH_MARKET_BASE_URL = environment.production
//   ? 'https://sibagw.tse.ir/CashMarket/api/v1/'
//   : 'http://172.20.16.94:9003/CashMarket/api/v1/';

// export const WORKFLOW_BASE_URL = environment.production
//   ? 'https://sibagw.tse.ir/WorkFlow/api/v1/'
//   : 'http://172.20.16.94:9003/WorkFlow/api/v1/';

// export const NEW_INSTRUMENT_BASE_URL = environment.production
//   ? 'https://sibagw.tse.ir/NewInstrument/api/v1/'
//   : 'http://172.20.16.94:9003/NewInstrument/api/v1/';

// export const PUBLIC_DATA_BASE_URL = environment.production
//   ? 'https://sibagw.tse.ir/siteapi/api/v1/PublicData/'
//   : 'http://172.20.16.94:8090/siteapi/api/v1/PublicData/';

// export const USER_MANAGER_API = environment.production
//   ? 'https://sibagw.tse.ir/UserManager/api/v1/'
//   : 'http://172.20.16.94:9003/UserManager/api/v1/';

// export const LISTING_BASE_API = environment.production
//   ? 'https://sibagw.tse.ir/Listing/api/v1/'
//   : 'http://172.20.16.94:8094/Listing/api/v1/';
// export const CORPORATE_SURVEY_BASE_URL = environment.production
// ? 'http://172.20.16.94:8089/Listing/api/v1/'
// : 'http://172.20.16.94:8094/Listing/api/v1/';

/////////////////////////////productions test////////////////

// export const BASE_URL = environment.production
//   ? 'https://webgwtest.tse.ir/MarketMaker/api/v1/'
//   : 'http://172.20.16.94:9003/MarketMaker/api/v1/';

// export const FILE_BASE_URL = environment.production
//   ? 'https://webgwtest.tse.ir/File/'
//   : 'http://172.20.16.94:9040/File/';

// export const IDENTITY_BASE_URL = environment.production
//   ? 'https://identitytest.tse.ir'
//   : 'http://172.20.16.94:9002';

// export const IDENTITY_CLIENT_BASE_URL = environment.production
//   ? 'https://sibatest.tse.ir'
//   : 'http://localhost:4200';

// export const CASH_MARKET_BASE_URL = environment.production
//   ? 'https://webgwtest.tse.ir/CashMarket/api/v1/'
//   : 'http://172.20.16.94:9003/CashMarket/api/v1/';

// export const WORKFLOW_BASE_URL = environment.production
//   ? 'https://webgwtest.tse.ir/WorkFlow/api/v1/'
//   : 'http://172.20.16.94:9003/WorkFlow/api/v1/';

// export const NEW_INSTRUMENT_BASE_URL = environment.production
//   ? 'https://webgwtest.tse.ir/NewInstrument/api/v1/'
//   : 'http://172.20.16.94:9003/NewInstrument/api/v1/';

// export const PUBLIC_DATA_BASE_URL = environment.production
//   ? 'https://webgwtest.tse.ir/siteapi/api/v1/PublicData/'
//   : 'http://172.20.16.94:8090/siteapi/api/v1/PublicData/';

// export const USER_MANAGER_API = environment.production
//   ? 'https://webgwtest.tse.ir/UserManager/api/v1/'
//   : 'http://172.20.16.94:9003/UserManager/api/v1/';

// export const LISTING_BASE_API = environment.production
//   ? 'https://sibagw.tse.ir/Listing/api/v1/'
//   : 'http://172.20.16.94:8091/Listing/api/v1/';
// export const CORPORATE_SURVEY_BASE_URL = environment.production
// ? 'http://172.20.16.94:8089/Listing/api/v1/'
// : 'http://172.20.16.94:8094/Listing/api/v1/';
