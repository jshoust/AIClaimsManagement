import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/status-badge";
import { WardClaimModal } from "@/components/claims/ward-claim-modal";
import DetailPanel from "@/components/layout/detail-panel";
import { Claim } from "@shared/schema";
import { formatDate } from "@/lib/format-date";
import { useLocation } from "wouter";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useClaims } from "@/hooks/use-claims";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ClaimsProps {
  onSelectClaim: (claimId: number) => void;
  selectedClaimId: number | null;
}

export default function Claims({ onSelectClaim, selectedClaimId }: ClaimsProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [, setLocation] = useLocation();
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [claimToDelete, setClaimToDelete] = useState<number | null>(null);
  
  // Fetch claims data
  const { claims, deleteClaim } = useClaims();
  const isLoading = claims.isLoading;
  
  // Handle delete confirmation
  const handleDeleteClick = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setClaimToDelete(id);
    setIsDeleteAlertOpen(true);
  };
  
  const confirmDelete = async () => {
    if (claimToDelete) {
      await deleteClaim.mutateAsync(claimToDelete);
      setIsDeleteAlertOpen(false);
      setClaimToDelete(null);
    }
  };
  
  // Filter claims based on search and status
  const filteredClaims = claims.data?.filter(claim => {
    const matchesSearch = 
      searchTerm === "" || 
      claim.claimNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (claim.shipperName && claim.shipperName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (claim.companyName && claim.companyName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (claim.wardProNumber && claim.wardProNumber.toLowerCase().includes(searchTerm.toLowerCase()));
    
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
                          <div className="flex gap-2">
                            <button 
                              className="text-primary hover:text-primary-dark"
                              onClick={(e) => {
                                e.stopPropagation();
                                setLocation(`/claims/${claim.id}`);
                              }}
                              title="View Claim"
                            >
                              <span className="material-icons">visibility</span>
                            </button>
                            <button 
                              className="text-red-500 hover:text-red-700"
                              onClick={(e) => handleDeleteClick(claim.id, e)}
                              title="Delete Claim"
                            >
                              <span className="material-icons">delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        
        {/* Create Claim Modal - Using Ward Trucking Form */}
        <WardClaimModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
        />
        
        {/* Delete Confirmation Dialog */}
        <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure you want to delete this claim?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the claim and all associated data
                including documents, tasks, and activities.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={confirmDelete}
                className="bg-red-600 hover:bg-red-700 text-white focus:ring-red-600"
              >
                {deleteClaim.isPending ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Deleting...</span>
                  </div>
                ) : (
                  "Delete Claim"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </div>
  );
}
