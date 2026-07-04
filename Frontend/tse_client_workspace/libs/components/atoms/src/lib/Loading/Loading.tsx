import './Loading.scss';

/* eslint-disable-next-line */
export interface LoadingProps {
  color?: string;
}

export function Loading(props: LoadingProps) {
  const { color = 'bg-purple' } = props;
  return (
    <div className="flex flex-wrap items-end justify-between pt-4">
      <div className={`w-3 h-3 ball rounded-[50%] ${color}`}></div>
      <div className={`w-3 h-3 ball rounded-[50%] ${color}`}></div>
      <div className={`w-3 h-3 ball rounded-[50%] ${color}`}></div>
    </div>
  );
}

export default Loading;
