import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import ClaimDetails from "@/components/claims/claim-details";

export default function ClaimView() {
  const [, setLocation] = useLocation();
  const params = useParams();
  const claimId = params.id ? parseInt(params.id) : null;
  
  // Navigate back to claims page if no claimId
  useEffect(() => {
    if (!claimId) {
      setLocation("/claims");
    }
  }, [claimId, setLocation]);
  
  if (!claimId) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  return (
    <main className="flex-1 overflow-y-auto scrollbar-thin p-6">
      <div className="max-w-5xl mx-auto">
        <ClaimDetails 
          claimId={claimId} 
          onClose={() => setLocation("/claims")} 
        />
      </div>
    </main>
  );
}