import axios from 'axios';
import { loadFromSession } from '../sessionStorage';
const qs = require('qs');

type DataEntry = {
  baseUrl?: string;
  url: string;
  urls?: string;
  options?: any;
  token?: string;
};
axios.defaults.withCredentials = true;

const ACCESS_TOKEN_SESSION_KEY = 'healan_access_token';

function resolveToken(explicit?: string): string | undefined {
  if (explicit) return explicit;
  try {
    const fromSession = loadFromSession(ACCESS_TOKEN_SESSION_KEY);
    return typeof fromSession === 'string' && fromSession ? fromSession : undefined;
  } catch {
    return undefined;
  }
}

function ensureAuthHeader(explicit?: string) {
  const token = resolveToken(explicit);
  if (token) {
    axios.defaults.headers.common['Authorization'] = 'Bearer ' + token;
  }
  return token;
}

axios.interceptors.request.use((config) => {
  const token = resolveToken();
  if (token) {
    config.headers = config.headers ?? {};
    if (!config.headers['Authorization']) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
  }
  return config;
});

export const request = {
  get: async ({ baseUrl, url, options, token }: DataEntry) => {
    const cancelToken = axios.CancelToken.source();
    ensureAuthHeader(token);
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
    ensureAuthHeader(token);
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
    ensureAuthHeader(token);
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
    ensureAuthHeader(token);
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
    ensureAuthHeader();
    return axios
      .post(`${baseUrl}${url}`, formData)
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
    ensureAuthHeader();
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
    ensureAuthHeader(token);
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
