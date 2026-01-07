import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigation } from "react-router";
import { ChevronDown, Menu, X } from "lucide-react";
import { ServerNavMenuItem } from "./ServerNavMenuItem";
import { ProjectsNavItems, mainNavItems } from "./navLinkConfig";
import { NavButton } from "./NavButton";
import { cn } from "~/utils/utils";

interface NavMenuV2Props {
  className?: string;
}

export const NavMenuV2 = ({ className }: NavMenuV2Props) => {
  // TODO: figure out how to make these work without js loading. 
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const location = useLocation();

  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const [menuHeight, setMenuHeight] = useState(0);
  useEffect(() => {
    if (mobileMenuRef.current) {
      const height = mobileMenuRef.current.scrollHeight;
      setMenuHeight(height);
    }
  }, [mainNavItems, ProjectsNavItems]);

  
  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className={cn(" w-full py-2", className)}>
      {/* Desktop Navigation */}
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex h-12 items-center justify-between">
          {/* Logo/Brand */}
          <div className="flex flex-shrink-0 items-center">
            <Link to="/" className="text-xl font-bold text-primary">
              Parker's Site
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-center space-x-4">
              {mainNavItems.map(item =>
                item.component ? (
                  <div key={item.to} className={`transform transition-all duration-200 `}>
                    {/*hover-scale-105*/}
                    <NavButton
                      to={item.to}
                      children={<item.component />}
                      className={`hover:bg-gradient-to-r ${item.color}`}
                      variants={{
                        active: "secondary",
                        notActive: "ghost",
                      }}
                    />
                  </div>
                ) : (
                  <div key={item.to} className={`transform transition-all duration-200`}>
                    {/*hover-scale-105*/}
                    <NavButton
                      to={item.to}
                      children={item.text}
                      className={`hover:bg-gradient-to-r ${item.color} `}
                      variants={{
                        active: "secondary",
                        notActive: "ghost",
                      }}
                    />
                  </div>
                ),
              )}

              {/* Pages Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className={cn(
                    "inline-flex items-center rounded-md px-4 py-2 text-sm font-medium transition-all duration-200",
                    "hover:scale-105 hover:bg-accent hover:text-accent-foreground",
                    "focus:bg-accent focus:text-accent-foreground focus:outline-none",
                  )}
                >
                  Projects
                  <ChevronDown className={cn("ml-2 h-4 w-4 transition-transform duration-200", dropdownOpen && "rotate-180")} />
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 z-50 mt-2 w-48 origin-top-right animate-fade-in rounded-md bg-background shadow-lg ring-1 ring-gray-300 ring-opacity-50 focus:outline-none  ">
                    <div className="border-white py-1">
                      {ProjectsNavItems.map((link, index) => (
                        <Link
                          key={link.to}
                          to={link.to}
                          prefetch="viewport"
                          className={cn(
                            "block transform px-4 py-2 text-sm transition-all duration-150 hover:scale-105 hover:rounded-lg",
                            isActive(link.to) ? "bg-accent text-accent-foreground" : `hover:bg-gradient-to-r ${link.color} text-foreground `,
                          )}
                          style={{ animationDelay: `${index * 50}ms` }}
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
              className="inline-flex items-center justify-center rounded-md p-2 text-foreground transition-all duration-200 hover:scale-110 hover:bg-accent hover:text-accent-foreground focus:outline-none"
            >
              <div className="relative h-6 w-6">
                <Menu
                  className={cn(
                    "absolute h-6 w-6 transform transition-all duration-300",
                    mobileMenuOpen ? "rotate-90 scale-0 opacity-0" : "rotate-0 scale-100 opacity-100",
                  )}
                  aria-hidden="true"
                />
                <X
                  className={cn(
                    "absolute h-6 w-6 transform transition-all duration-300",
                    mobileMenuOpen ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-0 opacity-0",
                  )}
                  aria-hidden="true"
                />
              </div>
            </button>
          </div>

        </div>
      </div>

      {/* Mobile menu */}
      <div
        ref={mobileMenuRef}
        className={cn(
          "overflow-hidden transition-all duration-300 ease-in-out md:hidden", // change to auto to see if we're overlfowing
          mobileMenuOpen ? " opacity-100" : "max-h-0 opacity-0",
        )}
        style={{
          maxHeight: mobileMenuOpen ? `${menuHeight}px` : '0px'
        }}
      >
        <div className="animate-slide-in space-y-1 px-2 pt-2">
          {mainNavItems.map((item, index) => (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "block transform rounded-md px-3 py-2 text-base font-medium transition-all duration-200 hover:translate-x-2 hover:scale-105",
                isActive(item.to) ? "bg-primary text-primary-foreground" : `hover:bg-gradient-to-r ${item.color} text-foreground `,
              )}
              style={{ animationDelay: `${index * 100}ms` }}
              onClick={() => setMobileMenuOpen(false)}
            >
              {item.component ? <item.component /> : item.text}
            </Link>
          ))}

          {/* Mobile Pages Dropdown, collapse by default? */}
          <div className="mt-4 animate-fade-in border-t border-gray-700 pt-4" style={{ animationDelay: "400ms" }}>
            <p className="px-3 py-2 text-sm font-medium text-muted-foreground">Projects</p>
            <div className="space-y-1">
              {ProjectsNavItems.map((link, index) => (
                <Link
                  key={link.to}
                  to={link.to}
                  prefetch="viewport"
                  className={cn(
                    "block transform rounded-md px-3 py-2 text-base font-medium transition-all duration-200 hover:translate-x-2 hover:scale-105",
                    isActive(link.to) ? "bg-primary text-primary-foreground" : `hover:bg-gradient-to-r ${link.color} text-foreground`,
                  )}
                  style={{ animationDelay: `${500 + index * 75}ms` }}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};
