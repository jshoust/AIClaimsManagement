import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, User, Settings, HelpCircle } from "lucide-react";
import { Link } from "wouter";

// Profile settings interface matches what's used in settings.tsx
interface ProfileSettings {
  fullName: string;
  email: string;
  username: string;
  role: string;
}

export default function AppHeader() {
  const [user, setUser] = useState({
    name: "John Doe",
    initials: "JD"
  });
  
  // Handle logout
  const handleLogout = () => {
    // Clear profile data
    localStorage.removeItem('profileSettings');
    
    // Reset to default profile
    setUser({
      name: "John Doe",
      initials: "JD"
    });
    
    // Show logout confirmation
    alert("You have been logged out successfully.");
  };
  
  // Function to load profile settings from localStorage
  const loadProfileSettings = () => {
    const savedSettings = localStorage.getItem('profileSettings');
    if (savedSettings) {
      try {
        const profileSettings: ProfileSettings = JSON.parse(savedSettings);
        
        // Extract initials from full name
        const nameParts = profileSettings.fullName.split(' ');
        const initials = nameParts.length > 1 
          ? `${nameParts[0][0]}${nameParts[1][0]}`
          : profileSettings.fullName.substring(0, 2);
        
        setUser({
          name: profileSettings.fullName,
          initials: initials.toUpperCase()
        });
      } catch (error) {
        console.error("Error loading profile settings:", error);
      }
    }
  };
  
  // Load profile settings on component mount
  useEffect(() => {
    loadProfileSettings();
    
    // Listen for storage changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'profileSettings') {
        loadProfileSettings();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Also create a custom event listener for direct updates within the same window
    window.addEventListener('profileUpdated', loadProfileSettings);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('profileUpdated', loadProfileSettings);
    };
  }, []);
  
  return (
    <header className="bg-white border-b border-neutral-200 shadow-sm">
      <div className="flex justify-between items-center px-4 py-2">
        <div className="flex items-center">
          <img 
            src="/img/Boon logo and word.png" 
            alt="Boon" 
            className="h-8 mr-2" 
          />
          <h1 className="text-xl font-medium text-[#3a5999] ml-1">AI Claims Processing</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Input
              type="text"
              placeholder="Search claims, contacts..."
              className="bg-neutral-100 px-4 py-2 rounded-md text-sm w-64 focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <span className="material-icons absolute right-2 top-2 text-neutral-400">search</span>
          </div>
          <Button variant="ghost" size="icon" className="rounded-full">
            <span className="material-icons text-neutral-500">notifications</span>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="flex items-center gap-2 cursor-pointer">
                <div className="h-8 w-8 bg-primary rounded-full flex items-center justify-center text-white font-medium text-sm">
                  {user.initials}
                </div>
                <span className="text-sm font-medium">{user.name}</span>
                <span className="material-icons text-neutral-400">arrow_drop_down</span>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <Link href="/settings">
                <DropdownMenuItem className="cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
              </Link>
              <Link href="/settings">
                <DropdownMenuItem className="cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
              </Link>
              <DropdownMenuItem className="cursor-pointer">
                <HelpCircle className="mr-2 h-4 w-4" />
                <span>Help & Support</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
