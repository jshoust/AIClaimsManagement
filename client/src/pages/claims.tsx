import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/status-badge";
import { CreateClaimModal } from "@/components/claims/create-claim-modal";
import DetailPanel from "@/components/layout/detail-panel";
import { useQuery } from "@tanstack/react-query";
import { Claim } from "@shared/schema";
import { formatDate } from "@/lib/format-date";
import { useLocation } from "wouter";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ClaimsProps {
  onSelectClaim: (claimId: number) => void;
  selectedClaimId: number | null;
}

export default function Claims({ onSelectClaim, selectedClaimId }: ClaimsProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [, setLocation] = useLocation();
  
  // Fetch claims data
  const { data: claims, isLoading } = useQuery<Claim[]>({
    queryKey: ['/api/claims'],
  });
  
  // Filter claims based on search and status
  const filteredClaims = claims?.filter(claim => {
    const matchesSearch = 
      searchTerm === "" || 
      claim.claimNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      claim.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      claim.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
      claim.orderNumber.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || claim.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });
  
  return (
    <div className="flex flex-1 overflow-hidden">
      <main className="flex-1 overflow-y-auto scrollbar-thin p-6">
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-medium text-neutral-800">Claims</h2>
            <div className="flex gap-3">
              <Button 
                onClick={() => setIsCreateModalOpen(true)}
                className="flex items-center gap-1"
              >
                <span className="material-icons text-sm">add</span>
                New Claim
              </Button>
            </div>
          </div>
          
          {/* Filters */}
          <div className="bg-white p-4 rounded-lg shadow-sm border border-neutral-200">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="Search claims..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                  <span className="material-icons absolute left-3 top-2 text-neutral-400">search</span>
                </div>
              </div>
              <div className="w-full md:w-64">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="missing_info">Missing Info</SelectItem>
                    <SelectItem value="in_review">In Review</SelectItem>
                    <SelectItem value="follow_up">Follow-up Required</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          
          {/* Claims Table */}
          <div className="bg-white rounded-lg shadow-sm border border-neutral-200">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-neutral-500 bg-neutral-50">
                    <th className="px-4 py-3 font-medium">Claim ID</th>
                    <th className="px-4 py-3 font-medium">Shipper Name</th>
                    <th className="px-4 py-3 font-medium">Company</th>
                    <th className="px-4 py-3 font-medium">Freight Bill Date</th>
                    <th className="px-4 py-3 font-medium">Amount</th>
                    <th className="px-4 py-3 font-medium">Date</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Assigned To</th>
                    <th className="px-4 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={9} className="px-4 py-4 text-center">
                        <div className="flex justify-center">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                        </div>
                      </td>
                    </tr>
                  ) : filteredClaims?.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-4 py-4 text-center text-neutral-500">
                        No claims found
                      </td>
                    </tr>
                  ) : (
                    filteredClaims?.map((claim) => (
                      <tr 
                        key={claim.id} 
                        className={`hover:bg-neutral-50 border-b border-neutral-200 ${
                          selectedClaimId === claim.id ? 'bg-blue-50' : ''
                        }`}
                        onClick={() => setLocation(`/claims/${claim.id}`)}
                        style={{ cursor: 'pointer' }}
                      >
                        <td className="px-4 py-3 font-medium text-primary">#{claim.claimNumber}</td>
                        <td className="px-4 py-3">{claim.shipperName || "Unknown"}</td>
                        <td className="px-4 py-3">{claim.companyName || "Unknown"}</td>
                        <td className="px-4 py-3">{claim.freightBillDate || "-"}</td>
                        <td className="px-4 py-3">{claim.claimAmount}</td>
                        <td className="px-4 py-3 text-neutral-500">{formatDate(claim.dateSubmitted)}</td>
                        <td className="px-4 py-3">
                          <StatusBadge status={claim.status as any} />
                        </td>
                        <td className="px-4 py-3">{claim.assignedTo || 'Unassigned'}</td>
                        <td className="px-4 py-3">
                          <button 
                            className="text-primary hover:text-primary-dark"
                            onClick={(e) => {
                              e.stopPropagation();
                              setLocation(`/claims/${claim.id}`);
                            }}
                          >
                            <span className="material-icons">visibility</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        
        {/* Create Claim Modal */}
        <CreateClaimModal 
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
        />
      </main>
      
      {/* Detail Panel */}
      <DetailPanel 
        selectedClaimId={selectedClaimId}
        onClose={() => onSelectClaim(null)}
      />
    </div>
  );
}
