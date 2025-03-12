import { Link } from "wouter";
import { cn } from "@/lib/utils";

interface SidebarProps {
  activePath: string;
}

interface NavItem {
  path: string;
  label: string;
  icon: string;
}

export default function Sidebar({ activePath }: SidebarProps) {
  const navItems: NavItem[] = [
    { path: "/", label: "Dashboard", icon: "dashboard" },
    { path: "/claims", label: "Claims", icon: "description" },
    { path: "/email-integration", label: "Email Integration", icon: "email" },
    { path: "/database-search", label: "Database Search", icon: "storage" },
    { path: "/documents", label: "Documents", icon: "folder" },
    { path: "/reports", label: "Reports", icon: "bar_chart" },
    { path: "/settings", label: "Settings", icon: "settings" },
  ];
  
  return (
    <aside className="w-56 bg-white border-r border-neutral-200 flex flex-col h-full">
      <nav className="p-3 flex-1 overflow-y-auto scrollbar-thin">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.path}>
              <Link 
                href={item.path}
                className={cn(
                  "flex items-center px-3 py-2 text-sm rounded-md",
                  activePath === item.path
                    ? "bg-primary-light bg-opacity-10 text-primary"
                    : "hover:bg-neutral-100 text-neutral-500"
                )}
              >
                <span className="material-icons mr-3 text-current">{item.icon}</span>
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <div className="p-3 border-t border-neutral-200">
        <a 
          href="#help" 
          className="flex items-center px-3 py-2 text-sm rounded-md hover:bg-neutral-100 text-neutral-500"
        >
          <span className="material-icons mr-3 text-current">help</span>
          Help & Support
        </a>
      </div>
    </aside>
  );
}
