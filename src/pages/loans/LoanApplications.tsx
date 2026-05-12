import { useState, useEffect } from 'react';
import { getLoans, updateLoanStatus, deleteLoan } from '../../lib/db';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { format } from 'date-fns';
import { Trash2 } from 'lucide-react';
import { ConfirmModal } from '../../components/ConfirmModal';

export default function LoanApplications() {
  const [loans, setLoans] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchLoans();
  }, []);

  const fetchLoans = async () => {
    try {
      const data = await getLoans('pending');
      setLoans(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id: string, status: string) => {
    try {
      await updateLoanStatus(id, status);
      fetchLoans();
    } catch (err) {
      console.error(err);
      alert('Failed to update status');
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await deleteLoan(deletingId);
      fetchLoans();
    } catch (err) {
      console.error(err);
      alert('Failed to delete application');
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) return <div>Loading applications...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Pending Applications</h1>
          <p className="text-slate-500 mt-1">Review and approve or decline incoming loan requests.</p>
        </div>
        <div className="relative w-full sm:w-72">
          <input 
            type="text" 
            placeholder="Search by name or phone..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
          />
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          </div>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b">
                <tr>
                  <th className="px-6 py-4 font-medium">Customer</th>
                  <th className="px-6 py-4 font-medium">Purpose</th>
                  <th className="px-6 py-4 font-medium">Principal</th>
                  <th className="px-6 py-4 font-medium">Terms</th>
                  <th className="px-6 py-4 font-medium">Requested</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loans.length === 0 && (
                  <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-500">No pending applications at the moment.</td></tr>
                )}
                {loans
                  .filter(l => l.customerName.toLowerCase().includes(searchTerm.toLowerCase()) || l.phoneNumber.includes(searchTerm))
                  .map(loan => (
                  <tr key={loan._id} className="border-b last:border-b-0 hover:bg-slate-50/50">
                    <td className="px-6 py-4">
                      <p className="font-medium text-slate-900">{loan.customerName}</p>
                      <p className="text-xs text-slate-500">📞 {loan.phoneNumber}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-slate-700">{loan.purpose || 'N/A'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-semibold">₹{loan.principalAmount.toLocaleString()}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p>{loan.interestRate}% interest</p>
                      <p className="text-xs text-slate-500">for {loan.durationDays} days</p>
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {format(new Date(loan.createdAt), 'MMM dd, yyyy')}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                      <button onClick={() => setDeletingId(loan._id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors inline-block align-middle" title="Delete">
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleStatusUpdate(loan._id, 'rejected')} className="px-3 py-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors font-medium">Decline</button>
                      <button onClick={() => handleStatusUpdate(loan._id, 'active')} className="px-3 py-1.5 text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors font-medium">Approve</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      
      <ConfirmModal
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={handleDelete}
        title="Delete Application"
        message="Are you sure you want to delete this application? This action cannot be undone."
      />
    </div>
  );
}
