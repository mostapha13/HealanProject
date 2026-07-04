import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import { Icon } from '@tse/components/atoms';

export default function WorkFlow({ data }: any) {
  const { Groups, WorkFlow } = data;
  return (
    <TableContainer
      sx={{ marginBottom: '-12px' }}
      className="shadow-[0_0px_1px_rgba(0,0,0,0.2)]"
    >
      <Table aria-label="simple table">
        <TableHead>
          <TableRow>
            {Groups.map(({ Group_Name, Group_ID }: any, index: number) => {
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
                  {Group_Name}
                </TableCell>
              );
            })}
          </TableRow>
        </TableHead>
        <TableBody>
          {WorkFlow.map((row: any) => {
            return (
              <TableRow key={row.Group_ID}>
                {Groups.map((item: any, index: number) => {
                  const isShow = row.Group_ID === index + 1;
                  const isEven = index % 2 === 0;
                  const bg = !isEven ? '#F7F7F7' : '';
                  return (
                    <TableCell
                      sx={{
                        backgroundColor: isShow
                          ? 'rgba(182, 185, 255, 0.3);'
                          : bg,
                        border: 0,
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
                                توضیحات:
                              </span>
                              <span className=" whitespace-pre text-extratiny">
                                {row.Form_Name}
                              </span>
                            </div>
                            <div className="flex flex-row">
                              <span className=" whitespace-pre ml-1 font-bold text-extratiny">
                                تاریخ ارسال:
                              </span>
                              <span className=" whitespace-pre text-extratiny">
                                {row.Order_Date}
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
