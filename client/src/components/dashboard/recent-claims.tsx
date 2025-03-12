import { StatusBadge } from "@/components/ui/status-badge";
import { Claim } from "@shared/schema";
import { formatDate } from "@/lib/format-date";

interface RecentClaimsProps {
  claims: Claim[];
  onSelectClaim: (claimId: number) => void;
}

export function RecentClaims({ claims, onSelectClaim }: RecentClaimsProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-neutral-200">
      <div className="flex justify-between items-center p-4 border-b border-neutral-200">
        <h3 className="font-medium text-neutral-800">Recent Claims</h3>
        <a href="/claims" className="text-primary text-sm hover:underline">View all</a>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-neutral-500 bg-neutral-50">
              <th className="px-4 py-2 font-medium">Claim ID</th>
              <th className="px-4 py-2 font-medium">Customer</th>
              <th className="px-4 py-2 font-medium">Date</th>
              <th className="px-4 py-2 font-medium">Status</th>
              <th className="px-4 py-2 font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {claims.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-4 text-center text-neutral-500">
                  No claims found
                </td>
              </tr>
            ) : (
              claims.map((claim) => (
                <tr key={claim.id} className="hover:bg-neutral-50 border-b border-neutral-200">
                  <td className="px-4 py-3 font-medium text-primary">#{claim.claimNumber}</td>
                  <td className="px-4 py-3">{claim.customerName}</td>
                  <td className="px-4 py-3 text-neutral-500">{formatDate(claim.dateSubmitted)}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={claim.status as any} />
                  </td>
                  <td className="px-4 py-3">
                    <button 
                      className="text-primary hover:text-primary-dark"
                      onClick={() => onSelectClaim(claim.id)}
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
  );
}
