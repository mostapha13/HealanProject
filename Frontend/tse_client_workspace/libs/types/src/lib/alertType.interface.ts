type PropsTypes = {
  message?: string;
  type?: string;
  description?: string;
  error?: any;
};

export type onAlertProps = ({
  message,
  type,
  description,
  error,
}: PropsTypes) => void;

export type ErrorType = {
  message?: string;
  error?: any;
  status?: number;
  data?: string | any;
};
