import { environment } from '../environments/environment';

export const baseUrl = environment.production
  ? process.env['NX_API_URL']
  : 'http://srv-linuxtest01.tseco.net:8078/AbzarhayenovinRecords/api/v1/';
