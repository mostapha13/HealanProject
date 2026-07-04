import { Select, Badge } from 'antd';
import './style.scss';
const { Option } = Select;

export function SelectWithBadge(props: any) {
  const {
    options = [],
    onChange,
    selectClassName = '',
    label,
    className = '',
    disabled,
    required,
    errorMessage,
    showKey = 'name',
    selectedKey = 'value',
    value = '',
    withBadge = false,
    badgeName,
  } = props;

  const handleChange = (val: any) => {
    const selectedOption = options.find(
      (item: any) => item[selectedKey] === val
    );
    onChange?.(selectedOption);
  };

  return (
    <div
      className={`rounded border-[1px] ${
        errorMessage ? 'border-red' : 'border-blackOpacity'
      } col-span-12 relative py-1 ${className}`}
    >
      {label && (
        <label className="bg-white absolute -top-[29%] right-2 px-2  text-extratiny text-darkGreen">
          {label}
          {required && '*'}
        </label>
      )}
      <Select
        disabled={disabled}
        value={value}
        onChange={handleChange}
        className={`w-full  ${selectClassName}`}
        dropdownMatchSelectWidth={false}
        optionLabelProp="label"
        listHeight={500}
      >
        {options.map((item: any) => {
          const title = item?.[showKey];
          const badgeCount = item?.[badgeName] || 0;

          return (
            <Option
              key={item[selectedKey]}
              value={item[selectedKey]}
              label={
                withBadge ? (
                  <div className="flex justify-between items-center ml-2">
                    <span>{title}</span>
                    <Badge
                      overflowCount={999}
                      count={badgeCount}
                      style={{ backgroundColor: '#0044ad' }}
                    />
                  </div>
                ) : (
                  title
                )
              }
            >
              <div className="flex justify-between items-center ml-2">
                <span>{title}</span>
                {withBadge && (
                  <Badge
                    overflowCount={999}
                    count={badgeCount}
                    style={{ backgroundColor: '#0044ad' }}
                  />
                )}
              </div>
            </Option>
          );
        })}
      </Select>
      {errorMessage && (
        <span className="text-red text-extratiny whitespace-pre">
          {errorMessage}
        </span>
      )}
    </div>
  );
}
