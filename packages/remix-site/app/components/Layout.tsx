import * as React from "react";
import { useNavigation } from "react-router";
import layoutStyles from "~/styles/layout.css?url";
import { Suspense } from "react";
import { NavMenuV2 } from "./NavMenu/NavMenuV2";
import { cn } from "~/utils/utils";

export const links = () => [{ rel: "stylesheet", href: layoutStyles }];

/**
 * Header and footer that will be present on every route, think of it as the shell app
 * also do this: https://reactrouter.com/explanation/special-files#layout-export, export from root, or maybe just the docuemnt
 * @param children
 * @constructor
 */
export function Layout({ children }: React.PropsWithChildren<{}>) {
  const { state } = useNavigation();
  return (
    <div className="remix-app dark ">
      <div className={cn("remix-app__loader", (state !== "idle" ? "loading-indicator" : ""))}/>
      <header className={"remix-app__header sticky top-0 z-50"}>
        {/* Needed bc something in the nav menu breaks hydration / causes a mismatch */}
        <Suspense fallback={<p>loading NavMenu...</p>}>
          <NavMenuV2 className={"bg-slate-900/50 backdrop-blur-sm  " } />
        </Suspense>
        
      </header>
      
      <div className={"remix-app__main "+ (state !== "idle" ? "opacity-50" : "") }>
        <div className="remix-app__main-content">{children}</div>
      </div>
      <footer className="remix-app__footer">
        <div className="remix-app__footer-content container">{/* <p>&copy; You!</p> */}</div>
      </footer>
    </div>
  );
}
