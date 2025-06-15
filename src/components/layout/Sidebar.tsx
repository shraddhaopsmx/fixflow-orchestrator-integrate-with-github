
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Folder, FolderCode, FileCode, Shield, CloudUpload, Cloud, Code } from "lucide-react";

const navItems = [
    { href: "/", label: "Dashboard", icon: Folder },
    { href: "/agents", label: "Agents", icon: FolderCode },
    { href: "/policies", label: "Policies", icon: FileCode },
    { href: "/integrations", label: "Integrations", icon: CloudUpload },
    { href: "/settings", label: "Settings", icon: Shield },
];

const Sidebar = () => {
    const location = useLocation();
  return (
    <div className="hidden border-r bg-muted/40 md:block">
      <div className="flex h-full max-h-screen flex-col gap-2">
        <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
          <Link to="/" className="flex items-center gap-2 font-semibold">
            <Shield className="h-6 w-6 text-primary" />
            <span className="">Remediate</span>
          </Link>
        </div>
        <div className="flex-1">
          <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
            {navItems.map(({ href, label, icon: Icon }) => (
              <Link
                key={label}
                to={href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                  location.pathname === href && "bg-muted text-primary"
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
