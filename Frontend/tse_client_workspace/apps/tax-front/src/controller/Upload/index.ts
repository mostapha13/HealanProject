import { request } from '@tse/tools';

interface UploadType {
  url?: string;
  token?: string;
  name?: string;
  file?: any;
  onSuccess?: any;
  onFail?: any;
}
export async function uploader({
  token,
  url,
  name = 'file',
  file,
  onSuccess,
  onFail,
}: UploadType) {
  const body = new FormData();
  body.append(name, file);
  try {
    const res = await request.upload({
      token,
      formData: body,
      baseUrl: url,
      url: '',
    });
    onSuccess?.(res);
  } catch (error) {
    onFail?.(error);
  }
}
