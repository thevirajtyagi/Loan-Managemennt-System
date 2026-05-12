import React, { useState, useEffect } from 'react';
import { getLoans, addEntry, deleteLoan, updateLoanStatus } from '../../lib/db';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { format } from 'date-fns';
import { Trash2 } from 'lucide-react';
import { ConfirmModal } from '../../components/ConfirmModal';

export default function ActiveLoans() {
  const [loans, setLoans] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedLoan, setSelectedLoan] = useState<any>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchLoans();
  }, []);

  const fetchLoans = async () => {
    try {
      const data = await getLoans();
      const active = data.filter((l: any) => ['active', 'overdue'].includes(l.status));
      setLoans(active);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLoan || !paymentAmount) return;
    try {
      await addEntry(selectedLoan._id, Number(paymentAmount), 'credit');
      setSelectedLoan(null);
      setPaymentAmount('');
      fetchLoans();
    } catch (err: any) {
      console.error(err);
      if (err instanceof Error && err.message?.includes('offline')) {
        alert('Database connection is offline.');
      } else {
        alert('Failed to process payment');
      }
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await deleteLoan(deletingId);
      fetchLoans();
    } catch (err) {
      console.error(err);
      alert('Failed to delete loan');
    } finally {
      setDeletingId(null);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await updateLoanStatus(id, newStatus);
      fetchLoans();
    } catch (err) {
      console.error(err);
      alert('Failed to update status');
    }
  };

  if (loading) return <div>Loading active tracking...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Active Customers</h1>
          <p className="text-slate-500 mt-1">Manage all active and slightly overdue loans.</p>
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

      {selectedLoan && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Process Payment</CardTitle>
              <p className="text-sm text-slate-500">For {selectedLoan.customerName}</p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePayment} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Amount to Receive (₹)</label>
                  <input required type="number" max={selectedLoan.remainingAmount} step="0.01" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} className="w-full p-2 border rounded-md" placeholder="e.g. 500" />
                  <p className="text-xs text-slate-500">Remaining roughly: ₹{selectedLoan.remainingAmount.toLocaleString()}</p>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <button type="button" onClick={() => setSelectedLoan(null)} className="px-4 py-2 border rounded-md hover:bg-slate-50">Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Confirm Payment</button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b">
                <tr>
                  <th className="px-6 py-4 font-medium">Customer</th>
                  <th className="px-6 py-4 font-medium">Principal</th>
                  <th className="px-6 py-4 font-medium">Remaining</th>
                  <th className="px-6 py-4 font-medium">Due Date</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loans
                  .filter(l => l.customerName.toLowerCase().includes(searchTerm.toLowerCase()) || l.phoneNumber.includes(searchTerm))
                  .map(loan => (
                  <tr key={loan._id} className="border-b last:border-b-0 hover:bg-slate-50/50">
                    <td className="px-6 py-4">
                      <p className="font-medium text-slate-900">{loan.customerName}</p>
                      <p className="text-xs text-slate-500">📞 {loan.phoneNumber}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-semibold">₹{loan.principalAmount.toLocaleString()}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-900">₹{loan.remainingAmount.toLocaleString()}</p>
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {format(new Date(loan.dueDate), 'MMM dd, yyyy')}
                    </td>
                    <td className="px-6 py-4">
                      <select 
                         value={loan.status} 
                         onChange={(e) => handleStatusChange(loan._id, e.target.value)}
                         className={`text-xs font-medium rounded-full px-2 py-1 border-0 focus:ring-2 focus:ring-blue-500 cursor-pointer ${
                           loan.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                         }`}
                      >
                        <option value="active">ACTIVE</option>
                        <option value="overdue">OVERDUE</option>
                        <option value="pending">PENDING</option>
                        <option value="default">DEFAULT</option>
                        <option value="closed">CLOSED</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                      <button onClick={() => setDeletingId(loan._id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors inline-block align-middle" title="Delete">
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => setSelectedLoan(loan)} className="px-3 py-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors font-medium">Pay</button>
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
        title="Delete Active Loan"
        message="Are you sure you want to delete this active loan and all its payment records? This action cannot be undone."
      />
    </div>
  );
}
