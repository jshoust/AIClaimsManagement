import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";

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
  
  // Load profile settings on component mount
  useEffect(() => {
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
  }, []);
  
  return (
    <header className="bg-white border-b border-neutral-200 shadow-sm">
      <div className="flex justify-between items-center px-4 py-2">
        <div className="flex items-center">
          <div className="h-8 w-8 mr-2 rounded-full bg-[hsl(155,60%,90%)] flex items-center justify-center text-[hsl(155,45%,35%)] font-bold">
            B
          </div>
          <h1 className="text-xl font-medium text-[hsl(155,45%,35%)]">Boon AI Claims Processing</h1>
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
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-primary rounded-full flex items-center justify-center text-white font-medium text-sm">
              {user.initials}
            </div>
            <span className="text-sm font-medium">{user.name}</span>
            <span className="material-icons text-neutral-400">arrow_drop_down</span>
          </div>
        </div>
      </div>
    </header>
  );
}
