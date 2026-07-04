import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import { Icon } from '@tse/components/atoms';
import { convertDateAndTimeJalali } from '@tse/tools';

export default function WorkFlow({ data }: any) {
  const { groups, workFlowItems } = data;
  return (
    <TableContainer
      sx={{ marginBottom: '-12px' }}
      className="shadow-[0_0px_1px_rgba(0,0,0,0.2)]"
    >
      <Table aria-label="simple table">
        <TableHead>
          <TableRow>
            {groups?.map(({ groupName }: any, index: number) => {
              const isEven = index % 2 === 0;
              const bg = isEven ? '#F7F7F7' : '';
              return (
                <TableCell
                  sx={{
                    textAlign: 'center',
                    backgroundColor: bg,
                    border: 0,
                    fontWeight: 'bold',
                  }}
                >
                  {groupName}
                </TableCell>
              );
            })}
          </TableRow>
        </TableHead>
        <TableBody>
          {workFlowItems?.map((row: any, rowIndex: any) => {
            return (
              <TableRow key={row.workFlowUserGroupId}>
                {groups.map((item: any, index: number) => {
                  // const isShow = row.workFlowUserGroupKey === index + 1;
                  const isShow =
                    row.workFlowUserGroupId === item?.workFlowUserGroupId;

                  const isEven = index % 2 === 0;
                  const bg = isEven ? '#F7F7F7' : '';
                  return (
                    <TableCell
                      sx={{
                        backgroundColor: isShow
                          ? rowIndex === 0
                            ? '#FFD29D'
                            : 'rgba(182, 185, 255, 0.3);'
                          : bg,
                        border: 0,
                        width: '15%',
                      }}
                    >
                      {isShow && (
                        <div className="flex flex-row items-center justify-start">
                          <div className="border border-black rounded-full ml-2">
                            <Icon name="icon-checklist" classname="text-3xl" />
                          </div>
                          <div>
                            <div className="flex flex-row mb-2">
                              <span className=" whitespace-pre ml-1 font-bold text-extratiny">
                                نام فرم:
                              </span>
                              <span className=" whitespace-pre text-extratiny">
                                {row.workFlowName}
                              </span>
                            </div>
                            <div className="flex flex-row">
                              <span className=" whitespace-pre ml-1 font-bold text-extratiny">
                                تاریخ ارسال:
                              </span>
                              <span className=" whitespace-pre text-extratiny">
                                {convertDateAndTimeJalali(row.workFlowDate)}
                              </span>
                            </div>
                            <div className="flex flex-row mt-2">
                              <span className="ml-1 font-bold text-extratiny">
                                وضعیت:
                              </span>
                              <span className="text-extratiny">
                                {row?.hasObserved
                                  ? 'مشاهده شده'
                                  : 'مشاهده نشده'}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </TableCell>
                  );
                })}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
