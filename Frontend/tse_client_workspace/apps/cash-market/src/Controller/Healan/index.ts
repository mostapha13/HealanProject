
import {  request } from '@tse/tools';
import { Healan_BASE_URL } from 'apps/cash-market/src/constants';

interface requestInterface {
    data?: any;
    onSuccess: (e: any) => void;
    onFail: (e: any) => void;
  }
  


  //----------------------Start patient----------------------//

export const savePatient = ({
  data,
  onSuccess,
  onFail,
}: requestInterface) => {
  const url = 'patient/Register';
  request
    .post({
      baseUrl: Healan_BASE_URL,
      url,
      options: data,
    })
    .then((res) => onSuccess(res))
    .catch((err) => onFail(err));
};


export async function getPatientList({
  data,
  onSuccess,
  onFail,
}: requestInterface) {
  const url = 'patient/PatientList';
  try {
    const res = await request.get({
      baseUrl: Healan_BASE_URL,
      url,
      options: data,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}


export async function getPatientInfo({
    data,
    onSuccess,
    onFail,
}:requestInterface){
  const url = `patient/PatientInfo/?patientId=${data.patientId}`;
  try {
    const res = await request.get({
      baseUrl: Healan_BASE_URL,
      url,
      options: data,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}

  //----------------------End patient----------------------//


  //----------------------Start company----------------------//
  export async function getCompanyList({
    data,
    onSuccess,
    onFail,
  }: requestInterface) {
    const url = 'company/CompanyList';
    try {
      const res = await request.get({
        baseUrl: Healan_BASE_URL,
        url,
        options: data,
      });
      onSuccess(res);
    } catch (error) {
      onFail(error);
    }
  }

  export async function getCompanyInfo({
    data,
    onSuccess,
    onFail,
}:requestInterface){
  const url = `company/CompanyInfo/?companyId=${data.companyId}`;
  try {
    const res = await request.get({
      baseUrl: Healan_BASE_URL,
      url,
      options: data,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}

export async function getCompanyRegistrationTypes({
  onSuccess,
  onFail,
}: requestInterface) {
  try {
    const res = await request.get({
      baseUrl: Healan_BASE_URL,
      url: 'Company/CompanyRegistrationTypes',
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}



export const saveCompany = ({
  data,
  onSuccess,
  onFail,
}: requestInterface) => {
  const url = 'company/Register';
  request
    .post({
      baseUrl: Healan_BASE_URL,
      url,
      options: data,
    })
    .then((res) => onSuccess(res))
    .catch((err) => onFail(err));
};




  //----------------------End company----------------------//



  //----------------------Start Doctor----------------------//

  
export async function getDoctorList({
  data,
  onSuccess,
  onFail,
}: requestInterface) {
  const url = 'Doctor/DoctorList';
  try {
    const res = await request.get({
      baseUrl: Healan_BASE_URL,
      url,
      options: data,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
export const saveDoctor = ({
  data,
  onSuccess,
  onFail,
}: requestInterface) => {
  const url = 'doctor/Register';
  request
    .post({
      baseUrl: Healan_BASE_URL,
      url,
      options: data,
    })
    .then((res) => onSuccess(res))
    .catch((err) => onFail(err));
};

export async function getDoctorInfo({
  data,
  onSuccess,
  onFail,
}:requestInterface){
const url = `doctor/DoctorInfo/?doctorId=${data.doctorId}`;
try {
  const res = await request.get({
    baseUrl: Healan_BASE_URL,
    url,
    options: data,
  });
  onSuccess(res);
} catch (error) {
  onFail(error);
}
}

export async function removeDoctor({
  data,
  onSuccess,
  onFail,
}: requestInterface) {
  const url = `doctor/${data.doctorId}`;
  try {
    const res = await request.delete({
      baseUrl: Healan_BASE_URL,
      url,
      options: data,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}


export async function getMedicalGroupTypes({
  onSuccess,
  onFail,
}: requestInterface) {
  try {
    const res = await request.get({
      baseUrl: Healan_BASE_URL,
      url: 'doctor/MedicalGroupType',
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}


  

    //----------------------End Doctor----------------------//




  //----------------------Start Appointment----------------------//
  

  export const saveAppointment = ({
    data,
    onSuccess,
    onFail,
  }: requestInterface) => {
    const url = 'appointment/Register';
    request
      .post({
        baseUrl: Healan_BASE_URL,
        url,
        options: data,
      })
      .then((res) => onSuccess(res))
      .catch((err) => onFail(err));
  };
  

  export async function getAppointmentList({
    data,
    onSuccess,
    onFail,
  }: requestInterface) {
    const url = 'Appointment/AppointmentList';
    try {
      const res = await request.get({
        baseUrl: Healan_BASE_URL,
        url,
        options: data,
      });
      onSuccess(res);
    } catch (error) {
      onFail(error);
    }
  }
  export async function getAppointmentInfo({
    data,
    onSuccess,
    onFail,
}:requestInterface){
  const url = `Appointment/AppointmentInfo/?appointmentId=${data.appointmentId}`;
  try {
    const res = await request.get({
      baseUrl: Healan_BASE_URL,
      url,
      options: data,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}
  
export async function getserviceType({
  onSuccess,
  onFail,
  data,
}: requestInterface) {
  try {
    const res = await request.get({
      baseUrl: Healan_BASE_URL,
      url: 'ServiceTypes/List',
      options: data,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}


export const invoicePay = ({
  data,
  onSuccess,
  onFail,
}: requestInterface) => {
  const url = 'Appointment/InvoicePay';
  request
    .post({
      baseUrl: Healan_BASE_URL,
      url,
      options: data,
    })
    .then((res) => onSuccess(res))
    .catch((err) => onFail(err));
};

export async function getPaymentMethodTypes({
  onSuccess,
  onFail,
}: requestInterface) {
  try {
    const res = await request.get({
      baseUrl: Healan_BASE_URL,
      url: 'Appointment/GetPaymentMethodTypes',
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}

export async function getCurrentAppointment({
  data,
  onSuccess,
  onFail,
}: requestInterface) {
  const url = 'Appointment/CurrentAppointmentList';
  try {
    const res = await request.get({
      baseUrl: Healan_BASE_URL,
      url,
      options: data,
    });
    onSuccess(res);
  } catch (error) {
    onFail(error);
  }
}



  //----------------------End Appointment----------------------//



  //----------------------Start Insurance----------------------//
  

  export async function getInsuranceList({
    data,
    onSuccess,
    onFail,
  }: requestInterface) {
    console.log(data)
    const url = 'Insurance/InsuranceList';
    try {
      const res = await request.get({
        baseUrl: Healan_BASE_URL,
        url,
        options: data,
      });
      onSuccess(res);
    } catch (error) {
      onFail(error);
    }
  }


    //----------------------End Insurance----------------------//