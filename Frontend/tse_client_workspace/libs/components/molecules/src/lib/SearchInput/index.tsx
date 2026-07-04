import { Icon } from '@tse/components/atoms';
import './styles.scss';

export function SearchInput({
  className,
  value,
  onChange,
  placeholder = 'جستجو',
}: any) {
  return (
    <div className={`input-wrapper ${className}`}>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
      <Icon name="icon-search" />
    </div>
  );
}
