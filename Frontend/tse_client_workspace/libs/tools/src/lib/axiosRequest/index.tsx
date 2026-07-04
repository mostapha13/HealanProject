import axios from 'axios';

import { downloadFile } from '@tse/tools';
const qs = require('qs');
// eslint-disable-next-line no-undef
// eslint-disable-next-line no-undef
// const fileBaseUrl = process.env.REACT_APP_FILE_BASE_URL;

type DataEntry = {
  baseUrl?: string;
  url: string;
  urls?: string;
  options?: any;
  token?: string;
};
axios.defaults.withCredentials = true;

export const request = {
  get: async ({ baseUrl, url, options, token }: DataEntry) => {
    const cancelToken = axios.CancelToken.source();
    if (token) {
      axios.defaults.headers.common['Authorization'] = 'Bearer ' + token;
    }
    return axios
      .get(`${baseUrl}${url}`, {
        params: options,
        cancelToken: cancelToken?.token,
        paramsSerializer: (params) => {
          return qs.stringify(params);
        },
      })
      .then((res: any) => {
        return new Promise((resolve) => {
          resolve(res.data);
        });
      })
      .catch((error: any) => {
        return new Promise((_, reject) => {
          reject(error.response);
        });
      });
  },
  delete: async ({ baseUrl, url, options, token }: DataEntry) => {
    const cancelToken = axios.CancelToken.source();
    if (token) {
      axios.defaults.headers.common['Authorization'] = 'Bearer ' + token;
    }
    return axios
      .delete(`${baseUrl}${url}`, {
        ...options,
        cancelToken: cancelToken.token,
      })
      .then((res: unknown) => {
        return new Promise((resolve) => {
          resolve(res);
        });
      })
      .catch((error: any) => {
        return new Promise((_, reject) => {
          reject(error.response);
        });
      });
  },
  post: async ({ baseUrl, url, options, token }: DataEntry) => {
    // const cancelToken = axios.CancelToken.source();
    if (token) {
      axios.defaults.headers.common['Authorization'] = 'Bearer ' + token;
    }
    return axios
      .post(`${baseUrl}${url}`, { ...options })
      .then((res: any) => {
        return new Promise((resolve) => {
          resolve(res?.data);
        });
      })
      .catch((error: any) => {
        return new Promise((_, reject) => {
          reject(error.response);
        });
      });
  },
  put: async ({ baseUrl, url, options, token }: DataEntry) => {
    const cancelToken = axios.CancelToken.source();
    if (token) {
      axios.defaults.headers.common['Authorization'] = 'Bearer ' + token;
    }
    return axios
      .put(`${baseUrl}${url}`, { ...options, cancelToken: cancelToken.token })
      .then((res: unknown) => {
        return new Promise((resolve) => {
          resolve(res);
        });
      })
      .catch((error: any) => {
        return new Promise((_, reject) => {
          reject(error.response);
        });
      });
  },
  upload: async ({ baseUrl, url, formData }: any) => {
    return axios
      .post(`${baseUrl}${url}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      .then((res) => {
        return new Promise((resolve) => {
          resolve(res.data);
        });
      })
      .catch((error) => {
        return new Promise((_, reject) => {
          reject(error.response);
        });
      });
  },
  download: async ({ baseUrl, url, options, fileName }: any) => {
    return axios
      .get(`${baseUrl}${url}`, {
        params: options,
        responseType: 'blob',
      })
      .then((res) => {
        return new Promise((resolve) => {
          resolve(res);
        });
      })
      .catch((error) => {
        return new Promise((_, reject) => {
          reject(error.response);
        });
      });
  },
  all: async ({ urls, token }: DataEntry) => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = 'Bearer ' + token;
    }
    if (urls) {
      return axios.all([...urls]).then(
        axios.spread((...responses) => {
          return responses;
        })
      );
    }
    return;
  },
};
