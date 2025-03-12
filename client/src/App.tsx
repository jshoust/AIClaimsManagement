import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Claims from "@/pages/claims";
import ClaimView from "@/pages/claim-view";
import EmailIntegration from "@/pages/email-integration";
import DatabaseSearch from "@/pages/database-search";
import Documents from "@/pages/documents";
import Reports from "@/pages/reports";
import Settings from "@/pages/settings";
import AppHeader from "@/components/layout/app-header";
import Sidebar from "@/components/layout/sidebar";
import { useLocation } from "wouter";
import { useState } from "react";

function Router() {
  const [location] = useLocation();
  const [selectedClaimId, setSelectedClaimId] = useState<number | null>(null);
  
  return (
    <div className="flex flex-col h-screen">
      <AppHeader />
      
      <div className="flex flex-1 overflow-hidden">
        <Sidebar activePath={location} />
        
        <Switch>
          <Route 
            path="/" 
            component={() => <Dashboard onSelectClaim={setSelectedClaimId} selectedClaimId={selectedClaimId} />} 
          />
          <Route 
            path="/claims" 
            component={() => <Claims onSelectClaim={setSelectedClaimId} selectedClaimId={selectedClaimId} />} 
          />
          <Route path="/claims/:id" component={ClaimView} />
          <Route path="/email-integration" component={EmailIntegration} />
          <Route path="/database-search" component={DatabaseSearch} />
          <Route path="/documents" component={Documents} />
          <Route path="/reports" component={Reports} />
          <Route path="/settings" component={Settings} />
          <Route component={NotFound} />
        </Switch>
      </div>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
