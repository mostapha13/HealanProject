/* eslint-disable @nrwl/nx/enforce-module-boundaries */
/* eslint-disable-next-line */
import { RouteType, FunctionComponent, ReactElement } from '@tse/types';
import { Icon } from '@tse/components/atoms';
import './style.scss';
import { Menu } from 'antd';

export interface SidebarProps {
  routes: RouteType[];
  Link?: FunctionComponent | ReactElement | any;
  header?: FunctionComponent | ReactElement | any;
  footer?: FunctionComponent | ReactElement | any;
  className?: string;
  color?: string;
  title?: string;
  onClick?: () => void;
  disabled?: boolean;
  hoverColor?: string;
}

const { SubMenu } = Menu;

export function Sidebar(props: SidebarProps) {
  const {
    routes = [],
    Link = 'a',
    className,
    color = 'text-purple',
    title = '',
    onClick,
    header,
    footer,
    disabled,
    hoverColor,
  } = props;
  return (
    <div
      className={`flex flex-col bg-white h-fit shadow-[0_0px_4px_rgba(0,0,0,0.2)] rounded-sm overflow-hidden ${className}`}
    >
      {title && (
        <span
          onClick={onClick}
          className={`flex shadow-[0px_0px_4px_rgba(0,0,0,0.2)] p-3 justify-center ${color} font-bold mb-3`}
        >
          {title}
        </span>
      )}
      <div className="p-2 pb-0">
        {header && header}
        <Menu
          disabled={disabled}
          expandIcon={({ isOpen }: { isOpen?: boolean }) => {
            return (
              <Icon
                name="icon-down-open"
                classname={`text-[16px] ml-2 cursor-pointer ${color} ${
                  isOpen ? 'rotate-180' : ''
                }`}
              />
            );
          }}
          mode="inline"
          defaultOpenKeys={[`${routes[0]?.id}`]}
        >
          {routes?.map((item: RouteType) => {
            if (item.nested && !item.hide) {
              return (
                <SubMenu
                  key={item.id}
                  title={
                    <span className="cursor-pointer text-black text-base font-bold">
                      {item.name}
                    </span>
                  }
                  className="bg-lightGray mb-2 rounded font-bold text-black text-base px-3"
                >
                  {item?.nested?.map((i: RouteType) => {
                    return (
                      <>
                        {!i.hide && (
                          <Menu.Item key={i.id}>
                            <Link
                              href={`${item.path}/${i.path}`}
                              className={`mx-4 text-black font-medium text-extratiny hover:${
                                hoverColor ? hoverColor : '!text-purple'
                              } `}
                            >
                              {i.name}
                            </Link>
                          </Menu.Item>
                        )}
                      </>
                    );
                  })}
                </SubMenu>
              );
            }
            return (
              <div key={item.id}>
                {!item.hide && (
                  <section className="bg-lightGray mb-2 rounded font-bold text-black text-base px-3">
                    <Menu.Item className="mx-5 text-black font-bold text-tiny">
                      {item.external ? (
                        <a
                          className='className="mx-4 !text-black font-bold'
                          href={item.path}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {item.name}
                        </a>
                      ) : (
                        <Link
                          className='className="mx-4 !text-black font-bold'
                          href={item.path}
                        >
                          {item.name}
                        </Link>
                      )}
                    </Menu.Item>
                  </section>
                )}
              </div>
            );
          })}
        </Menu>
        {footer && footer}
      </div>
    </div>
  );
}

export default Sidebar;
