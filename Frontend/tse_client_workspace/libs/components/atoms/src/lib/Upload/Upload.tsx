import { Icon } from '@tse/components/atoms';
import type { UploadProps } from './types';
import './Upload.scss';
import { downloadFileApi } from './service';
import { downloadFile } from '@tse/tools';

export function Upload(props: UploadProps) {
  const {
    onChange,
    className = '',
    onDelete,
    placeholder = 'فایل خود را بارگذاری کنید',
    value,
    error,
    link,
    reference,
    name,
    onBlur,
    label,
    fileFormat = '.jpg,.pdf,.png,.jpeg,.tif,.xls,.xlsx',
    href,
    labelClassName = '',
    isHaveTargetValue,
  } = props;

  let guid = href
    ? href?.split('/Download/')?.[1]
    : link?.split('/Download/')?.[1];
  let baseUrl = href
    ? `${href?.split('/Download/')?.[0]}/`
    : `${link?.split('/Download/')?.[0]}/`;
  const borderColor = error ? 'border-red' : 'border-lightGrayOpacity';

  const handleChange = (event: any) => {
    onChange?.(event);
    if (isHaveTargetValue == undefined) {
      event.target.value = null;
    }
  };

  const handleClick = (event: any) => {
    event.currentTarget.value = null;
  };
  const handleDownload = () => {
    downloadFileApi({
      guid: guid,
      baseUrl: baseUrl,
      onSuccess: (res: any) => downloadExportFile(res, value),
      onFail: (err: any) => console.log('onFail', err),
    });
  };
  const downloadExportFile = (data: any, name: any) => {
    if (data != null) {
      downloadFile(data, name);
    }
  };
  return (
    <div className={`flex justify-between gap-2 min-w-[170px] ${className}`}>
      {/* <span className="text-extratiny text-darkGreen">
        {label && `بارگذاری ${label}`}
      </span> */}
      <section
        className={`border-2 rounded border-dashed ${borderColor} flex flex-1 items-center px-4 py-1`}
      >
        {!value && <span className="text-tiny text-gray">{placeholder}</span>}
        {value && (
          <a
            // href={href}
            onClick={handleDownload}
            className={`text-tiny font-bold  ${labelClassName}`}
          >
            {value?.length > 50 ? `${value.slice(0, 50)}...` : value}
          </a>
        )}
        <input
          hidden
          type="file"
          id={name}
          ref={reference}
          name={name}
          onChange={handleChange}
          onBlur={onBlur}
          onClick={handleClick}
          accept={fileFormat}
        />
      </section>
      <section className="flex items-center gap-2">
        {onChange && (
          <div className="cursor-pointer hover:opacity-60">
            <label className="cursor-pointer" htmlFor={name}>
              <Icon name="icon-upload" classname="text-xl" />
            </label>
          </div>
        )}
        {onDelete && (
          <div className="cursor-pointer hover:opacity-60" onClick={onDelete}>
            <Icon name="icon-delete" classname="text-xl text-red" />
          </div>
        )}
      </section>
    </div>
  );
}

export default Upload;
