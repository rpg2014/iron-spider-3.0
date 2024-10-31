import { Link, useLocation } from "@remix-run/react";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "../ui/NavigationMenu";
import { ServerNavMenuItem } from "./ServerNavMenuItem";
import { navLinkConfig } from "./navLinkConfig";
import { cva } from "class-variance-authority";

const NavLink = ({ to, ...props }: { to: string } & any) => {
  const pathname = useLocation().pathname;
  const isActive = to === pathname;

  return (
    <NavigationMenuLink className={props.className} asChild active={isActive}>
      <Link to={to} prefetch="viewport" {...props} className={"NavigationMenuLink"} />
    </NavigationMenuLink>
  );
};

export const NavMenu = () => {
  return (
    <NavigationMenu>
      <NavigationMenuList className="flex-row flex flex-wrap">
        <NavigationMenuItem>
          <NavLink to="/" prefetch={"intent"} className={navigationMenuTriggerStyle()}>
            Home
          </NavLink>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavLink prefetch={"viewport"} to={"/mc-server"} className={navigationMenuTriggerStyle()}>
            <ServerNavMenuItem />
          </NavLink>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuTrigger>Pages</NavigationMenuTrigger>
          <NavigationMenuContent className="flex flex-col sm:flex-row items-center transition-all duration-300 ease-in-out divide-y sm:divide-y-0 sm:divide-x divide-gray-800">
            {navLinkConfig.map(link => (
              <NavLink
                key={link.to}
                prefetch={"viewport"}
                to={link.to}
                className={"rounded-none min-w-[100%] sm:min-w-fit text-nowrap" + navigationMenuTriggerStyle()}
              >
                {link.label}
              </NavLink>
            ))}
          </NavigationMenuContent>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavLink prefetch={"viewport"} to={"/settings"} className={navigationMenuTriggerStyle()}>
            Settings
          </NavLink>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
};
