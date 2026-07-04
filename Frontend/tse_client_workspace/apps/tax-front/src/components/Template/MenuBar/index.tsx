import { Menu } from 'antd';
import { Link, useLocation } from 'react-router-dom';
import type {
  ErrorType,
  onAlertProps,
  ReactElement,
  RouteType,
} from '@tse/types';
import { Icon } from '@tse/components/atoms';

interface MenubarProps {
  routes: RouteType[];
  Link: any;
  className?: any;
}

const Menubar: React.FC<MenubarProps> = ({ routes, Link, className }) => {
  const location = useLocation();

  const renderMenuItems = (routes: RouteType[]) => {
    return routes.map((route: any) => {
      const { id, path, name, component, nested } = route;
      // const isActiveParent = location.pathname.includes(path);
      const isActive = location.pathname.split('/').pop() === path;

      if (nested && nested.length > 0) {
        return (
          <Menu.SubMenu
            key={id}
            className={`bg-white mb-2 rounded font-bold  px-3`}
            title={
              <div className="flex flex-1 items-center justify-center">
                <span className={`${isActive ? 'text-[#1890ff]' : ''}`}>
                  {name}
                </span>
                <Icon
                  name=" icon-down-dir"
                  classname=" text-black mr-1 text-tiny"
                />
              </div>
            }
          >
            {nested.map((i: RouteType) => {
              if (!i.hide) {
                return (
                  <Menu.Item key={i.id.toString()}>
                    <Link
                      className={`mx-4 flex flex-1 items-center justify-center`}
                      to={`${route.path}/${i.path}`}
                    >
                      <span
                        className={`w-full justify-center  ${
                          location.pathname.includes(i.path)
                            ? 'text-[#1890ff]'
                            : ''
                        }`}
                      >
                        {i.name}
                      </span>
                    </Link>
                  </Menu.Item>
                );
              }
              return null;
            })}
          </Menu.SubMenu>
        );
      }
      if (!route.hide) {
        return (
          <Menu.Item
            key={id}
            title={name}
            // className={isActive ? ' text-yellow bg-gold' : ''}
          >
            <Link className="px-3" to={path}>
              <span
                className={`w-full justify-center font-semibold ${
                  isActive ? ' text-[#1890ff]' : ''
                }`}
              >
                {name}
              </span>
            </Link>
          </Menu.Item>
        );
      } else return null;
    });
  };

  return (
    <div
      className={`flex w-full flex-1 items-center justify-center bg-green h-fit shadow-[0_0px_4px_rgba(0,0,0,0.2)] rounded-sm overflow-hidden ${className} `}
    >
      <Menu
        // expandIcon={({ isOpen }: { isOpen?: boolean }) => {
        //   return (
        //     <Icon
        //       name="icon-down-dir"
        //       classname={`text-extratiny ml-2 cursor-pointer  ${
        //         isOpen ? 'rotate-180' : ''
        //       }`}
        //     />
        //   );
        // }}
        className="w-full flex flex-1 bg-white items-center justify-center"
        mode="horizontal"
      >
        {renderMenuItems(routes)}
      </Menu>
    </div>
  );
};

export default Menubar;
