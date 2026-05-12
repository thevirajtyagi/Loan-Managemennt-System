import { useState, useEffect } from 'react';
import { getLoans, updateLoanStatus } from '../../lib/db';
import { Card, CardContent } from '../../components/ui/card';
import { format } from 'date-fns';

export default function SettledHistory() {
  const [loans, setLoans] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLoans();
  }, []);

  const fetchLoans = async () => {
    try {
      const data = await getLoans('closed');
      setLoans(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
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

  if (loading) return <div>Loading history...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Settled History</h1>
          <p className="text-slate-500 mt-1">Archived records of fully paid or closed loans.</p>
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
                  <th className="px-6 py-4 font-medium">Principal Provided</th>
                  <th className="px-6 py-4 font-medium">Original Terms</th>
                  <th className="px-6 py-4 font-medium">Date Closed</th>
                  <th className="px-6 py-4 font-medium text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {loans.length === 0 && (
                  <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-500">No settled history found.</td></tr>
                )}
                {loans
                  .filter(l => l.customerName.toLowerCase().includes(searchTerm.toLowerCase()) || l.phoneNumber.includes(searchTerm))
                  .map(loan => (
                  <tr key={loan._id} className="border-b last:border-b-0 hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <p className="font-medium text-slate-900">{loan.customerName}</p>
                      <p className="text-xs text-slate-500">📞 {loan.phoneNumber}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-semibold">₹{loan.principalAmount.toLocaleString()}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p>{loan.interestRate}% interest</p>
                      <p className="text-xs text-slate-500">for {loan.durationDays} days</p>
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {format(new Date(loan.updatedAt), 'MMM dd, yyyy')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <select 
                         value={loan.status} 
                         onChange={(e) => handleStatusChange(loan._id, e.target.value)}
                         className="text-xs font-medium rounded-full px-2 py-1 border-0 bg-slate-100 text-slate-700 focus:ring-2 focus:ring-slate-500 cursor-pointer"
                      >
                        <option value="closed">CLOSED</option>
                        <option value="active">BACK TO ACTIVE</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
