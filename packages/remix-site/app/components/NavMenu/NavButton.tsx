import { RefreshCw } from "lucide-react";
import { NavLink } from "react-router";
import { ReactNode } from "react";
import { Button } from "../ui/Button";

type ButtonVariants = "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
export const NavButton = ({
  to,
  children,
  variants,
}: {
  to: string;
  children: ReactNode;
  variants?: { active: ButtonVariants; notActive: ButtonVariants };
}) => {
  if (!variants) {
    variants = { active: "outline", notActive: "default" };
  }
  return (
    <NavLink to={to}>
      {({ isActive, isPending }) => (
        <Button className="items-center justify-start" variant={isActive ? variants.active : variants.notActive}>
          {children} {isPending && <RefreshCw size={16} className="ml-2 animate-spin" />}
        </Button>
      )}
    </NavLink>
  );
};
