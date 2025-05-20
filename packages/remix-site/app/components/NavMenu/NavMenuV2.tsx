import { useState } from "react";
import { Link, useLocation } from "react-router";
import { ChevronDown, Menu, X } from "lucide-react";
import { ServerNavMenuItem } from "./ServerNavMenuItem";
import { navLinkConfig } from "./navLinkConfig";
import { NavButton } from "./NavButton";
import { cn } from "~/utils/utils";

interface NavMenuV2Props {
  className?: string;
}

export const NavMenuV2 = ({ className }: NavMenuV2Props) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const location = useLocation();

  const mainNavItems = [
    { to: "/", text: "Home" },
    { to: "/mc-server", text: "Server", component: ServerNavMenuItem },
    { to: "/grocery-list", text: "Grocery List" },
    { to: "/settings", text: "Settings" },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className={cn("relative w-full bg-background", className)}>
      {/* Desktop Navigation */}
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo/Brand */}
          <div className="flex flex-shrink-0 items-center">
            <Link to="/" className="text-xl font-bold text-primary">
              Iron Spider
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-center space-x-4">
              {mainNavItems.map(item =>
                item.component ? (
                  <NavButton
                    key={item.to}
                    to={item.to}
                    children={<item.component />}
                    variants={{
                      active: "secondary",
                      notActive: "ghost",
                    }}
                  />
                ) : (
                  <NavButton
                    key={item.to}
                    to={item.to}
                    children={item.text}
                    variants={{
                      active: "secondary",
                      notActive: "ghost",
                    }}
                  />
                ),
              )}

              {/* Pages Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className={cn(
                    "inline-flex items-center rounded-md px-4 py-2 text-sm font-medium transition-colors",
                    "hover:bg-accent hover:text-accent-foreground",
                    "focus:bg-accent focus:text-accent-foreground focus:outline-none",
                  )}
                >
                  Pages
                  <ChevronDown className={cn("ml-2 h-4 w-4 transition-transform", dropdownOpen && "rotate-180")} />
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-background shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                    <div className="py-1">
                      {navLinkConfig.map(link => (
                        <Link
                          key={link.to}
                          to={link.to}
                          prefetch="viewport"
                          className={cn(
                            "block px-4 py-2 text-sm transition-colors",
                            isActive(link.to) ? "bg-accent text-accent-foreground" : "text-foreground hover:bg-accent hover:text-accent-foreground",
                          )}
                          onClick={() => setDropdownOpen(false)}
                        >
                          {link.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center justify-center rounded-md p-2 text-foreground hover:bg-accent hover:text-accent-foreground focus:outline-none"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" aria-hidden="true" /> : <Menu className="h-6 w-6" aria-hidden="true" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden">
          <div className="space-y-1 px-2 pb-3 pt-2">
            {mainNavItems.map(item => (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "block rounded-md px-3 py-2 text-base font-medium",
                  isActive(item.to) ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-accent hover:text-accent-foreground",
                )}
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.component ? <item.component /> : item.text}
              </Link>
            ))}

            {/* Mobile Pages Dropdown */}
            <div className="mt-4 border-t border-gray-700 pt-4">
              <p className="px-3 py-2 text-sm font-medium text-muted-foreground">Pages</p>
              <div className="space-y-1">
                {navLinkConfig.map(link => (
                  <Link
                    key={link.to}
                    to={link.to}
                    prefetch="viewport"
                    className={cn(
                      "block rounded-md px-3 py-2 text-base font-medium",
                      isActive(link.to) ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-accent hover:text-accent-foreground",
                    )}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};
