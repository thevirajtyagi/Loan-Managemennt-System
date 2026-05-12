import { useState, useEffect } from 'react';
import { getLedgerEntries } from '../../lib/db';
import { Card, CardContent } from '../../components/ui/card';
import { format } from 'date-fns';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';

export default function Ledger() {
  const [entries, setEntries] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLedger();
  }, []);

  const fetchLedger = async () => {
    try {
      const data = await getLedgerEntries();
      setEntries(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading ledger...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Ledger</h1>
          <p className="text-slate-500 mt-1">A chronologically ordered record of all outgoing and incoming funds.</p>
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
                  <th className="px-6 py-4 font-medium">Date & Time</th>
                  <th className="px-6 py-4 font-medium">Type</th>
                  <th className="px-6 py-4 font-medium">Customer</th>
                  <th className="px-6 py-4 font-medium">Description</th>
                  <th className="px-6 py-4 font-medium text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {entries.length === 0 && (
                  <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-500">No transactions recorded yet.</td></tr>
                )}
                {entries
                  .filter(e => (e.customerName && e.customerName.toLowerCase().includes(searchTerm.toLowerCase())) || (e.phoneNumber && e.phoneNumber.includes(searchTerm)))
                  .map(entry => {
                  const isCredit = entry.type === 'credit';
                  return (
                    <tr key={entry._id} className="border-b last:border-b-0 hover:bg-slate-50">
                      <td className="px-6 py-4 text-slate-500">
                        <p className="font-medium text-slate-900">{format(new Date(entry.createdAt), 'MMM dd, yyyy')}</p>
                        <p className="text-xs">{format(new Date(entry.createdAt), 'h:mm a')}</p>
                      </td>
                      <td className="px-6 py-4">
                        {isCredit ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold uppercase">
                            <ArrowDownRight size={12} /> IN (Credit)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold uppercase">
                            <ArrowUpRight size={12} /> OUT (Debit)
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-slate-900">{entry.customerName}</p>
                        <p className="text-xs text-slate-500">{entry.phoneNumber}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-slate-600">
                          {entry.isDisbursement ? 'Loan Disbursement' : isCredit ? 'Repayment Received' : 'Adjustment/Charge'}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className={`font-bold ${isCredit ? 'text-green-600' : 'text-slate-900'}`}>
                          {isCredit ? '+' : '-'}₹{entry.amount.toLocaleString()}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
