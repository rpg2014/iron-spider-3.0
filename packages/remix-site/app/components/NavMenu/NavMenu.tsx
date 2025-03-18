import { Link, useLocation } from "react-router";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuIndicator,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
  NavigationMenuViewport,
} from "../ui/NavigationMenu";
import { ServerNavMenuItem } from "./ServerNavMenuItem";
import { navLinkConfig } from "./navLinkConfig";
import { cva } from "class-variance-authority";
import styles from "./styles.module.scss";

const NavLink = ({ to, ...props }: { to: string } & any) => {
  const pathname = useLocation().pathname;
  const isActive = to === pathname;

  return (
    <NavigationMenuLink className={props.className} asChild active={isActive}>
      <Link to={to} prefetch="render" {...props} className={"NavigationMenuLink"} />
    </NavigationMenuLink>
  );
};

export const NavMenu = () => {
  return (
    <NavigationMenu>
      <NavigationMenuList className="flex flex-row flex-wrap">
        <NavigationMenuItem>
          <NavLink to="/" prefetch={"intent"} className={navigationMenuTriggerStyle()}>
            Home
          </NavLink>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavLink prefetch={"render"} to={"/mc-server"} className={navigationMenuTriggerStyle()}>
            <ServerNavMenuItem />
          </NavLink>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuTrigger>Pages</NavigationMenuTrigger>
          <NavigationMenuContent className="flex flex-col items-center divide-y divide-gray-800 transition-all duration-300 ease-in-out sm:flex-row sm:divide-x sm:divide-y-0">
            {navLinkConfig.map(link => (
              <NavLink
                key={link.to}
                prefetch={"viewport"}
                to={link.to}
                className={"min-w-[100%] text-nowrap rounded-none sm:min-w-fit " + navigationMenuTriggerStyle()}
              >
                {link.label}
              </NavLink>
            ))}
          </NavigationMenuContent>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavLink prefetch={"render"} to={"/cookies"} className={navigationMenuTriggerStyle()}>
            Cookies
          </NavLink>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavLink prefetch={"render"} to={"/settings"} className={navigationMenuTriggerStyle()}>
            Settings
          </NavLink>
        </NavigationMenuItem>
      </NavigationMenuList>
      {/* Little tab under the item that triggers the dropdown, rendered in the viewport hidden in the main menu level */}
      <NavigationMenuIndicator className={`${styles.NavigationMenuIndicator} invisible sm:visible `} />
    </NavigationMenu>
  );
};
