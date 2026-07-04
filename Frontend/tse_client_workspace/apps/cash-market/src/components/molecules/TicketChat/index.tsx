import {
  useStates,
  useEffect,
  useState,
  useNavigate,
  useSearchParams,
} from '@tse/utils';
import { Button, Icon, TextField } from '@tse/components/atoms';
import { downloadFileApi, uploadFile } from 'apps/cash-market/src/Controller';
import { downloadFile } from '@tse/tools';
import {
  chatList,
  chatSave,
} from 'apps/cash-market/src/Controller/Listing/PublicInfo';

interface ChatAttachment {
  attachment: {
    link: string;
    fileName: string;
    fileId: string;
    fileType: string;
  };
}

interface ChatMessage {
  dossierId: any;
  submenuId: number;
  comment: string;
  parentChatRef: number;
  chatAttachments: ChatAttachment[];
}
const initialState = {
  messages: [],
  newMessage: '',
  file: null,
  chatListData: [],
};
export default function TicketChat({
  isShowChat,
  onAlert,
  submenuId,
}: {
  isShowChat: boolean;
  onAlert: any;
  submenuId: number;
}) {
  const [state, setState] = useStates<any>(initialState);
  const { messages, newMessage, file, chatListData } = state;
  const [searchParams] = useSearchParams();
  const dossierId =
    searchParams.get('id') != null ? searchParams.get('id') : null;
  useEffect(() => {
    handleGetChatList();
  }, []);
  const handleGetChatList = () => {
    const data = { DossierId: dossierId, SubmenuId: submenuId };
    chatList({
      data,
      onSuccess: (res: any) => setState({ chatListData: res }),
      onFail,
    });
  };
  const handleSend = () => {
    if (newMessage.trim() || file?.fileId) {
      const newChat: ChatMessage = {
        dossierId: dossierId,
        submenuId: submenuId,
        comment: newMessage,
        parentChatRef: 0,
        chatAttachments: file
          ? [
              {
                attachment: {
                  link: file?.link,
                  fileName: file?.fileName,
                  fileId: file?.fileId,
                  fileType: file?.fileType,
                },
              },
            ]
          : [],
      };
      chatSave({
        data: newChat,
        onSuccess: (res) => onSuccessSaveChat(),
        onFail,
      });
    }
  };
  const onSuccessSaveChat = () => {
    handleGetChatList();
    setState({ newMessage: '', file: null });
  };
  const onFail = (error: any) => {
    onAlert(error);
  };
  const handleDownload = (data: any) => {
    downloadFileApi({
      data: data?.fileId,
      onSuccess: (res: any) => downloadExportDoc(res, data?.fileName),
      onFail: (err: any) => console.log('onFail', err),
    });
  };
  const downloadExportDoc = (data: any, name: any) => {
    if (data != null) {
      downloadFile(data, name);
    }
  };
  const onChangeFile = (e: any) => {
    uploadFile({
      data: e.target.files[0],
      onSuccess: (res: any) => setState({ file: res, fileValueError: false }),
      onFail,
    });
  };
  return (
    <>
      {isShowChat && (
        <div className="grid grid-rows-[1fr_auto] w-full h-full  rounded-2xl p-4 gap-2">
          <div className="flex flex-col overflow-y-auto p-2 max-h-[400px]">
            {chatListData?.map((msg: any) => (
              <div
                key={msg.chatId}
                className={`flex w-full my-1 ${
                  msg.isExpert ? 'justify-start' : 'justify-end'
                }`}
              >
                <div
                  className={`max-w-xs rounded-xl p-3 shadow-lg ${
                    msg.isExpert
                      ? 'bg-listingTertiaryColor text-white rounded-br-none'
                      : 'bg-gray text-black rounded-bl-none'
                  }`}
                >
                  <span>{msg.comment}</span>

                  {msg.chatAttachments.length > 0 && (
                    <div className="mt-2">
                      {msg.chatAttachments.map((att: any) => (
                        <a
                          key={att.tableId}
                          onClick={() => handleDownload(att?.attachment)}
                          target="_blank"
                          rel="noreferrer"
                          className={`block text-sm hover:underline ${
                            msg.parentChatRef === 0
                              ? 'text-[#05a5e4]'
                              : 'text-black'
                          }`}
                        >
                          📎 {att.attachment.fileName}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-[1fr_auto] items-center border rounded-lg py-2 px-2 gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setState({ newMessage: e.target.value })}
              placeholder="پیام خود را بنویسید..."
              className="px-3 py-2  text-sm"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (newMessage.trim() || file)) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                {file ? (
                  <div className="flex items-center gap-2 bg-gray-100 px-2 py-1 rounded-lg">
                    <span className="text-sm">{file.name}</span>
                    <a
                      onClick={() => handleDownload(file)}
                      className="text-blue hover:text-blue transition"
                      title="دانلود فایل"
                    >
                      {file?.fileName} ⬇️
                    </a>
                    <a
                      onClick={() => setState({ file: null })}
                      className="text-red hover:text-red-700 transition"
                      title="حذف فایل"
                    >
                      ❌
                    </a>
                  </div>
                ) : (
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      className="hidden"
                      onChange={(e) => onChangeFile(e)}
                    />
                    <Icon name="icon-attach" classname="text-lg " />
                    {/* <span className="text-xl">📎</span> */}
                  </label>
                )}
              </div>
              <a
                onClick={handleSend}
                className="bg-listingTertiaryColor h-10 w-10 flex items-center justify-center text-white rounded-full mr-2 "
              >
                <Icon
                  name="icon-Icon-send"
                  classname="text-md transform -rotate-90"
                />
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
