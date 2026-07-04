import { useEffect, useStates } from '@tse/utils';
import { loadFromStorage } from '@tse/tools';
import { Upload, Button, Icon } from '@tse/components/atoms';
import {
  getInstructionSummaryList,
  saveInstructionFile,
  uploadFile,
} from '../../Controller';
import withAlert from '../../hoc/withAlert';
import { Radio } from 'antd';

const initialState = {
  instructionList: [],
  mode: 0,
  fileList: null,
};
function InstructionInfo({ onAlert }: any) {
  const [state, setState] = useStates<any>(initialState);
  const { instructionList, mode, fileList } = state;
  const hasAccess = loadFromStorage('hasAccess');

  useEffect(() => {
    getInstructionList();
  }, []);

  const getInstructionList = () => {
    getInstructionSummaryList({
      onSuccess: onSuccessList,
      onFail,
    });
  };

  const onSuccessList = (res: any) => {
    const newList: any = [];
    res.map((item: any) => newList.push(...item.instructionForms));
    setState({
      instructionList: res,
      fileList: newList,
    });
  };

  const onFail = (error: any) => {
    onAlert(error);
  };

  const handleModeChange = (e: any) => {
    setState({
      mode: e.target.value,
    });
  };

  const onChangeFile = (e: any, id: string) => {
    uploadFile({
      data: e.target.files[0],
      onSuccess: (res: any) => onSuccessUpload(res, id),
      onFail,
    });
  };

  const onSuccessUpload = (res: any, id: string) => {
    const index = fileList?.findIndex((i: any) => i?.instructionFormId === id);
    const newItem = {
      instructionFormId: id,
      fileId: res.fileId,
      fileName: res.fileName,
      link: res.link,
    };

    const newList = !fileList
      ? [newItem]
      : index === -1
      ? [...fileList.slice(0, index), newItem, ...fileList.slice(index + 1)]
      : [...fileList.slice(0, index), newItem, ...fileList.slice(index - 1)];

    setState({
      fileList: newList,
    });
  };
  const onRemoveFile = (id: number) => {
    const index = fileList?.findIndex((i: any) => i?.instructionFormId === id);
    const newItem = {
      instructionFormId: id,
      fileId: null,
      fileName: null,
      link: null,
    };
    const newList = [
      ...fileList.slice(0, index),
      newItem,
      ...fileList.slice(index + 1),
    ];
    setState({
      fileList: newList,
    });
  };

  const submit = () => {
    saveInstructionFile({
      data: {
        instructionFiles: fileList,
      },
      onSuccess: onSuccessSave,
      onFail,
    });
  };

  const onSuccessSave = () => {
    onAlert({ message: 'عملیات با موفقیت انجام شد', type: 'success' });
    getInstructionList();
  };
  return (
    <>
      <div className="shadow-[0_0px_4px_rgba(0,0,0,0.2)] rounded-sm p-3">
        <Radio.Group
          onChange={handleModeChange}
          value={mode}
          style={{ marginBottom: 5 }}
        >
          {instructionList?.map((item: any, i: number) => (
            <Radio.Button value={i}>{item.instructionTypeName}</Radio.Button>
          ))}
        </Radio.Group>
        <div
          className={`mt-8 ${
            !hasAccess && 'col-span-12 grid grid-cols-12 gap-4'
          }`}
        >
          {instructionList &&
            instructionList[mode]?.instructionForms?.map((item: any) => {
              const index = fileList?.findIndex(
                (i: any) => i.instructionFormId === item.instructionFormId
              );
              return (
                <>
                  {hasAccess && (
                    <div className="flex flex-row items-center w-[65%] justify-between mb-4">
                      <span className="ml-4 whitespace-pre">
                        {item.instructionFormName} :
                      </span>
                      <Upload
                        onChange={(file: any) =>
                          onChangeFile(file, item.instructionFormId)
                        }
                        value={fileList && fileList[index]?.fileName}
                        href={fileList && fileList[index]?.link}
                        name={item.instructionFormId}
                        onDelete={() => onRemoveFile(item.instructionFormId)}
                      />
                    </div>
                  )}
                  {!hasAccess && item.fileLink && (
                    <div className="shadow-[0_0px_4px_rgba(0,0,0,0.2)] rounded-sm p-3 flex flex-row items-center justify-between col-span-6">
                      <div>
                        <Icon name="icon-pdf" classname="text-red" />
                        <span>{item.instructionFormName}</span>
                      </div>
                      <a href={item.fileLink}>دانلود فایل</a>
                    </div>
                  )}
                </>
              );
            })}
        </div>
      </div>
      <div className="flex items-start justify-end pt-3">
        <Button className="bg-blue text-white w-[115px] mr-4" onClick={submit}>
          ثبت
        </Button>
      </div>
    </>
  );
}

export default withAlert(InstructionInfo);
