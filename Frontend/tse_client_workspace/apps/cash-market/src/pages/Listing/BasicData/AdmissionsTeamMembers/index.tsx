import withAlert from 'apps/cash-market/src/hoc/withAlert';
import {
  useStates,
  useEffect,
  useState,
  useNavigate,
  useSearchParams,
} from '@tse/utils';
import { Icon, TextField } from '@tse/components/atoms';
import { Table } from '@tse/components/organism';
import { HeaderTypes } from '@tse/types';
import FindInPageOutlinedIcon from '@mui/icons-material/FindInPageOutlined';
import { getRole } from 'apps/cash-market/src/Controller/Identity';
import { uploadFile } from 'apps/cash-market/src/Controller';
import {
  getUsers,
  getCompanyList,
} from 'apps/cash-market/src/Controller/Listing/BasicData';

const initialState = {
  addmissionsUsers: [],
  filterText: '',
};

function AdmissionsTeamMembers({ onAlert }: any) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [state, setState] = useStates<any>(initialState);
  const pageSize = 10;
  const { addmissionsUsers, filterText } = state;

  useEffect(() => {
    getRoleData('');
  }, []);

  useEffect(() => {
    getRoleData('');
    handlegetUsers('', 1);
    handleGetCompanyList();
  }, []);

  const handleGetCompanyList = () => {
    const data = { PageNumber: 1, PageSize: 20 };
    getCompanyList({
      data,
      onSuccess: (res: any) => setState({ companyList: res }),
      onFail,
    });
  };

  const handlegetUsers = (text?: string, pageNo?: number) => {
    getUsers({
      data: {
        BoardMember: true,
        FilterText: text,
        PageNumber: pageNo,
        PageSize: pageSize,
      },
      onSuccess: (res: any) => setState({ addmissionsUsers: res }),
      onFail,
    });
  };

  const setErrorMessage = (key: string) => {
    const errorMessage = true;
    setState({ [`${key}Error`]: errorMessage });
  };

  const tableHeader: HeaderTypes[] = [
    {
      title: 'نام',
      dataIndex: 'firstName',
      key: 'firstName',
      className: 'col-span-2',
    },
    {
      title: 'نام خانوادگی',
      dataIndex: 'lastName',
      key: 'lastName',
      className: 'col-span-3',
    },
    {
      title: 'نقش سازمانی',
      dataIndex: 'userRole',
      key: 'userRole',
      className: 'col-span-2',
    },
    // {
    //   title: 'نام کاربری',
    //   dataIndex: 'email',
    //   key: 'email',
    //   className: 'col-span-1',
    // },
    {
      title: 'شماره تماس',
      dataIndex: 'phoneNumber',
      key: 'phoneNumber',
      className: 'col-span-2',
    },
    {
      title: 'جزئیات',
      dataIndex: 'userId',
      key: 'userId',
      className: 'col-span-1',
      render: (item: any) => {
        return (
          <a href={`/listing-basicdata/users-profile?id=${item}`}>
            <FindInPageOutlinedIcon className="text-listingTertiaryColor " />
          </a>
        );
      },
    },
    {
      title: 'ویرایش',
      dataIndex: 'userId',
      key: 'userId',
      className: 'col-span-1',
      render: (item: any) => {
        return (
          <a href={`/listing-basicdata/users?id=${item}`}>
            <Icon
              name="icon-edit"
              classname="text-listingTertiaryColor text-lg cursor-pointer"
              // onClick={(record) => onEditClick(record)}
            />
          </a>
        );
      },
    },
  ];

  // const onEditClick = (record: any) => {};

  const onChangeFilterText = (filterText: string) => {
    handlegetUsers(filterText, 1);
  };

  const onChangeTablePage = (pageNo: number) => {
    handlegetUsers(filterText, pageNo);
  };

  const onFail = (error: any) => {
    onAlert(error);
  };

  const getRoleData = (text: any) => {
    const data = {
      SearchText: text,
      AccessSystemId: 1,
    };
    getRole({
      data,
      onSuccess: (res: any) => {
        setState({
          roleData: res,
        });
      },
      onFail,
    });
  };

  const onChangeFile = (e: any) => {
    uploadFile({
      data: e.target.files[0],
      onSuccess: (res: any) => setState({ logoFile: res }),
      onFail,
    });
  };
  const onRemoveFile = () => {
    setState({
      logoFile: {},
    });
  };

  return (
    <>
      <div className="border-2 border-lightGray  grid grid-cols-12">
        <div className=" col-span-12 items-start flex border-b-2 border-lightGray">
          <span className=" p-2 font-bold">
             اعضای هیئت پذیرش جدید
          </span>
        </div>
        {/* <div className="col-span-12 items-start   mx-4 mt-4 border-b border-listingTertiaryColor">
          <span className=" p-4  text-listingTertiaryColor ">
            مشخصات فردی :
          </span>
        </div>
        <div className="col-span-12 grid grid-cols-12 gap-4 m-4 mt-8">
          <TextField
            label="نام"
            className="2xl:col-span-4 xl:col-span-4 lg:col-span-4 md:col-span-6  col-span-4"
            value={firstName}
            onChange={(value: any) =>
              setState({
                firstName: value,
                firstNameError: '',
              })
            }
            required
            errorMessage={state?.sellersNameError}
          />
          <TextField
            label="نام خانوادگی"
            className="2xl:col-span-4 xl:col-span-4 lg:col-span-4 md:col-span-6  col-span-4"
            value={lastName}
            onChange={(value: any) =>
              setState({
                lastName: value,
                lastNameError: '',
              })
            }
            required
            errorMessage={state?.sellersNameError}
          />
          <TextField
            label="نام کاربری"
            className="2xl:col-span-4 xl:col-span-4 lg:col-span-4 md:col-span-6  col-span-4"
            value={userName}
            onChange={(value: any) =>
              setState({
                userName: value,
                userNameError: '',
              })
            }
            required
            errorMessage={state?.sellersNameError}
          />
          <TextField
            label="شماره تلفن همراه"
            className="2xl:col-span-4 xl:col-span-4 lg:col-span-4 md:col-span-6  col-span-4"
            // value={deSeparator(connectorPhoneNumber)}
            onChange={(value: any) =>
              setState({
                connectorPhoneNumber: value,
                connectorPhoneNumberError: '',
              })
            }
            required
            errorMessage={state?.connectorPhoneNumberError}
            maxLength={11}
            // type="number"
          />
          <TextField
            label="شماره تلفن ثابت"
            className="2xl:col-span-4 xl:col-span-4 lg:col-span-4 md:col-span-6  col-span-4"
            // value={deSeparator(connectorPhoneNumber)}
            onChange={(value: any) =>
              setState({
                connectorPhoneNumber: value,
                connectorPhoneNumberError: '',
              })
            }
            required
            errorMessage={state?.connectorPhoneNumberError}
            maxLength={11}
            // type="number"
          />
        </div>

        <div className="col-span-12 flex justify-between mx-4 mt-8 border-b border-listingTertiaryColor">
          <span className=" p-4  text-listingTertiaryColor ">
            مشخصات شرکت استخدامی :
          </span>
          <ListingCreateButton className="p-4" buttonName="ثبت شرکت جدید" />
        </div>
        <div className="col-span-12 grid grid-cols-12 gap-4 m-4 mt-8">
          <NewSelect
            label="نام شرکت یا نهاد"
            className="2xl:col-span-4 xl:col-span-4 lg:col-span-4 md:col-span-6  col-span-4"
            options={[{ name: '', id: '' }, ...[]]}
            onChange={(value: any) => console.log('value')}
            showKey="name"
            selectedKey="id"
            required
            value={companyName}
            errorMessage={state?.selectedSellersPersonalityTypeError}
          />
          <TextField
            label="شماره پرسنلی"
            className="2xl:col-span-4 xl:col-span-4 lg:col-span-4 md:col-span-6  col-span-4"
            value={personalIdNo}
            onChange={(value: any) =>
              setState({
                personalIdNo: value,
                personalIdNoError: '',
              })
            }
            required
            errorMessage={state?.sellersNameError}
          />
          <div className="col-span-4">
            <SelectMultiple
              placeholder="نقش"
              options={roleData}
              value={selectedRole}
              limit={10}
              onChange={(value: any) => {
                setState({
                  selectedRole: value,
                  selectedRoleError: '',
                });
              }}
              required
              errorMessage={selectedRoleError}
              showKey="roleTitle"
              selectedKey="roleName"
            />
          </div>
          <TextField
            label="شماره داخلی"
            className="2xl:col-span-4 xl:col-span-4 lg:col-span-4 md:col-span-6  col-span-4"
            value={phoneNumber}
            onChange={(value: any) =>
              setState({
                phoneNumber: value,
                phoneNumberError: '',
              })
            }
            required
            errorMessage={state?.sellersNameError}
          />
          <TextField
            label="شماره تلفن ثابت نهاد"
            className="2xl:col-span-4 xl:col-span-4 lg:col-span-4 md:col-span-6  col-span-4"
            value={phoneNumber}
            onChange={(value: any) =>
              setState({
                phoneNumber: value,
                phoneNumberError: '',
              })
            }
            required
            errorMessage={state?.phoneNumberError}
          />
        </div>
        <div className="col-span-12 items-start   mx-4 mt-8 border-b border-listingTertiaryColor">
          <span className=" p-4  text-listingTertiaryColor ">آپلود لوگو :</span>
        </div>
        <div className="col-span-12 grid grid-cols-12 gap-4 m-4 mt-8">
          <div className=" 2xl:col-span-4 xl:col-span-6 lg:col-span-8 md:col-span-8  col-span-4 mt-16 m-4">
            <Upload
              onChange={(file: any) => onChangeFile(file)}
              value={logoFile?.fileName}
              href={logoFile?.link}
              name="uploadFile"
              onDelete={() => onRemoveFile()}
              fileFormat=".jpg,.png,.jpeg"
              // error={uploadFileError}
            />
          </div>
          <div className="w-[100px] h-[100px] rounded-full mt-8">
            <Image
              src={logoFile?.link == undefined ? emptyPicture : logoFile?.link}
              className="w-full h-full rounded-full opacity-50  "
            />
          </div>
        </div>
        <div className="col-span-12 items-start   mx-4 mt-8 border-b border-listingTertiaryColor">
          <span className=" p-4  text-listingTertiaryColor ">
            آپلود مدارک و گواهینامه :
          </span>
        </div> */}
        {/* <div className="col-span-12 grid grid-cols-12 gap-4 m-4 mt-8">
          <div className=" 2xl:col-span-4 xl:col-span-6 lg:col-span-8 md:col-span-8  col-span-4 mt-16 m-4">
            <Upload
              onChange={(file: any) => onChangeFile(file)}
              value={logoFile?.fileName}
              href={logoFile?.link}
              name="uploadFile"
              onDelete={() => onRemoveFile()}
              fileFormat=".jpg,.png,.jpeg"
              // error={uploadFileError}
            />
          </div>
        </div>
        <div className="col-span-12 flex justify-end m-4 mt-8">
          <ListingSubmitButton onClick={() => console.log('hiiiii')} />
        </div> */}
        <div className="col-span-12 grid grid-cols-12 justify-end m-4 mt-8">
          <TextField
            label="جستجو"
            className="2xl:col-span-3 xl:col-span-4 lg:col-span-4 md:col-span-6  col-span-4"
            value={filterText}
            onChange={(value: any) => {
              onChangeFilterText(value);
              setState({
                filterText: value,
              });
            }}
          />
          <div className="col-span-12 my-4">
            <Table
              columns={tableHeader}
              className="col-span-12 grid grid-cols-12"
              data={addmissionsUsers?.items}
              onChangePage={onChangeTablePage}
              totalPages={addmissionsUsers?.totalPages}
              pageSize={pageSize}
            />
          </div>
        </div>
      </div>
    </>
  );
}

export default withAlert(AdmissionsTeamMembers);
