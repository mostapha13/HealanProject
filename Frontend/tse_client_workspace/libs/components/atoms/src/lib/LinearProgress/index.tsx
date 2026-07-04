import { Progress } from 'antd';
import './style.scss';

export interface LinearProgressProps {
  percent?: any;
  className?: string;
  style?: any;
  size?: any;
  status?: any;
  strokeColor?: any;
  withCustomColor?: boolean;
}

const LinearProgress = (props: LinearProgressProps) => {
  const {
    percent,
    className,
    style,
    size,
    status,
    strokeColor,
    withCustomColor,
  } = props;
  return (
    <Progress
      percent={percent}
      size={size ? size : 'small'}
      status={status ? status : 'active'}
      //   trailColor="text-lightGray"
      strokeColor={
        withCustomColor
          ? percent < 10
            ? 'black'
            : percent >= 10 && percent < 50
            ? '#10375c'
            : percent >= 50
            ? 'green'
            : 'green'
          : 'green'
      }
      className={`${className} ${
        withCustomColor
          ? percent < 10
            ? 'low-progress'
            : percent >= 1 && percent < 50
            ? 'mid-progress'
            : percent >= 50
            ? 'high-progress'
            : 'white-progress'
          : 'white-progress'
      }`}
    />
  );
};

export default LinearProgress;
