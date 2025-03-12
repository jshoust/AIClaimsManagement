import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";

export default function AppHeader() {
  const [user] = useState({
    name: "John Doe",
    initials: "JD"
  });
  
  return (
    <header className="bg-white border-b border-neutral-200 shadow-sm">
      <div className="flex justify-between items-center px-4 py-2">
        <div className="flex items-center">
          <img 
            src="https://www.wardtlc.com/wp-content/uploads/2021/09/cropped-logo_2-137x56.png" 
            alt="Ward TLC Logo" 
            className="h-10 mr-4"
          />
          <h1 className="text-xl font-medium text-primary">Claims Management System</h1>
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
