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
    { path: "/tasks", label: "Tasks", icon: "task" },
    { path: "/email-integration", label: "Email Integration", icon: "email" },
    { path: "/database-search", label: "Database Search", icon: "storage" },
    { path: "/documents", label: "Documents", icon: "folder" },
    { path: "/reports", label: "Reports", icon: "bar_chart" },
    { path: "/users", label: "Users", icon: "people" },
    { path: "/settings", label: "Settings", icon: "settings" },
  ];
  
  return (
    <aside className="w-56 bg-[#2e7d32] flex flex-col h-full">
      <div className="p-4 border-b border-[rgba(255,255,255,0.15)]">
        <div className="flex items-center">
          <img 
            src="/img/Boon Logo.png" 
            alt="Boon" 
            className="h-8 w-8" 
          />
          <span className="ml-2 text-white text-lg font-semibold">Boon</span>
        </div>
      </div>
      <nav className="p-3 flex-1 overflow-y-auto scrollbar-thin">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.path}>
              <Link 
                href={item.path}
                className={cn(
                  "flex items-center px-3 py-2 text-sm rounded-md",
                  activePath === item.path
                    ? "bg-[rgba(255,255,255,0.2)] text-white font-medium"
                    : "hover:bg-[rgba(255,255,255,0.1)] text-white"
                )}
              >
                <span className="material-icons mr-3 text-current">{item.icon}</span>
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <div className="p-3 border-t border-[rgba(255,255,255,0.15)]">
        <a 
          href="#help" 
          className="flex items-center px-3 py-2 text-sm rounded-md hover:bg-[rgba(255,255,255,0.1)] text-white"
        >
          <span className="material-icons mr-3 text-current">help</span>
          Help & Support
        </a>
      </div>
    </aside>
  );
}
