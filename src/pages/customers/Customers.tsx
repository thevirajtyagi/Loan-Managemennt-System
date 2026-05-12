import React, { useState, useEffect } from 'react';
import { getLoans, updateLoanStatus, updateCustomerInfo } from '../../lib/db';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Mail, AlertTriangle, Phone, MapPin, User as UserIcon, Edit2 } from 'lucide-react';
import { ConfirmModal } from '../../components/ConfirmModal';

export default function Customers() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [defaulterId, setDefaulterId] = useState<string | null>(null);
  const [editingCustomer, setEditingCustomer] = useState<any | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Get all loans to build customer profiles
      const data = await getLoans();
      
      const customerMap = new Map();
      
      data.forEach(loan => {
        const key = loan.phoneNumber;
        if (!customerMap.has(key)) {
          customerMap.set(key, {
            customerName: loan.customerName,
            phoneNumber: loan.phoneNumber,
            email: loan.email,
            address: loan.address,
            referencePerson: loan.referencePerson,
            loans: [],
            totalPrincipal: 0,
            totalRemaining: 0,
          });
        }
        
        const customer = customerMap.get(key);
        // Only use the latest contact info
        if (loan.createdAt > (customer.latestLoanDate || 0)) {
          customer.customerName = loan.customerName;
          customer.email = loan.email;
          customer.address = loan.address;
          customer.referencePerson = loan.referencePerson;
          customer.latestLoanDate = loan.createdAt;
        }
        
        customer.loans.push(loan);
        if (['active', 'overdue', 'default'].includes(loan.status)) {
          customer.totalPrincipal += loan.principalAmount || 0;
          customer.totalRemaining += loan.remainingAmount || 0;
        }
      });
      
      setCustomers(Array.from(customerMap.values()));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const markAsDefaulter = async () => {
    if (!defaulterId) return;
    try {
      const customer = customers.find(c => c.phoneNumber === defaulterId);
      if (customer) {
        // Find all active/overdue loans and mark them as default
        const activeLoans = customer.loans.filter((l: any) => ['active', 'overdue'].includes(l.status));
        for (const loan of activeLoans) {
          await updateLoanStatus(loan._id, 'default');
        }
        fetchData();
      }
    } catch (err) {
      console.error(err);
      alert('Failed to mark as defaulter');
    } finally {
      setDefaulterId(null);
    }
  };

  const handleEmail = (email: string, name: string, remaining: number) => {
    if (!email) {
      alert('No email address provided for this customer.');
      return;
    }
    const subject = encodeURIComponent('Important: Outstanding Loan Balance');
    const body = encodeURIComponent(
      `Dear ${name},\n\nThis is a reminder regarding your outstanding loan balance of ₹${remaining.toLocaleString()}.\n\nPlease arrange for the payment as soon as possible. Let us know if you have any questions.\n\nRegards,\nLMS Team`
    );
    window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomer) return;
    try {
      await updateCustomerInfo(editingCustomer.originalPhone, {
        customerName: editingCustomer.customerName,
        phoneNumber: editingCustomer.phoneNumber,
        email: editingCustomer.email,
        address: editingCustomer.address,
        referencePerson: editingCustomer.referencePerson
      });
      setEditingCustomer(null);
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Failed to update customer');
    }
  };

  if (loading) return <div>Loading customers...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Customer Directory</h1>
          <p className="text-slate-500 mt-1">View the complete ledger and history of each customer.</p>
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

      <div className="grid grid-cols-1 gap-6">
        {customers
          .filter(c => c.customerName.toLowerCase().includes(searchTerm.toLowerCase()) || c.phoneNumber.includes(searchTerm))
          .map(customer => {
           const activeLoansCount = customer.loans.filter((l: any) => ['active', 'overdue'].includes(l.status)).length;
           const defaultLoansCount = customer.loans.filter((l: any) => l.status === 'default').length;
           const hasDefaults = defaultLoansCount > 0;
           
           return (
            <Card key={customer.phoneNumber} className={hasDefaults ? 'border-red-200 bg-red-50/10' : ''}>
              <CardHeader className="pb-3 border-b border-slate-100 flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                <div>
                  <CardTitle className="text-xl text-slate-900 flex items-center gap-2">
                    {customer.customerName}
                    {hasDefaults && <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-bold uppercase tracking-wider">Defaulter</span>}
                  </CardTitle>
                  <div className="flex items-center gap-x-4 gap-y-1 mt-2 flex-wrap text-sm text-slate-600">
                    <span className="flex items-center gap-1"><Phone size={14} /> {customer.phoneNumber}</span>
                    {customer.email && <span className="flex items-center gap-1"><Mail size={14} /> {customer.email}</span>}
                    {customer.address && <span className="flex items-center gap-1"><MapPin size={14} /> {customer.address}</span>}
                    {customer.referencePerson && <span className="flex items-center gap-1"><UserIcon size={14} /> Ref: {customer.referencePerson}</span>}
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button 
                    onClick={() => setEditingCustomer({ ...customer, originalPhone: customer.phoneNumber })}
                    className="flex items-center gap-2 px-3 py-2 bg-slate-50 text-slate-700 hover:bg-slate-100 rounded-md font-medium text-sm transition-colors"
                  >
                    <Edit2 size={16} /> Edit
                  </button>
                  <button 
                    onClick={() => handleEmail(customer.email, customer.customerName, customer.totalRemaining)}
                    disabled={!customer.email}
                    className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-md font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Mail size={16} /> Send Email
                  </button>
                  <button 
                    onClick={() => setDefaulterId(customer.phoneNumber)}
                    disabled={activeLoansCount === 0}
                    className="flex items-center gap-2 px-3 py-2 border border-red-200 text-red-600 hover:bg-red-50 rounded-md font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <AlertTriangle size={16} /> Mark Defaulter
                  </button>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Total Active Loans</p>
                    <p className="text-slate-900 font-semibold">{activeLoansCount}</p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Active Principal</p>
                    <p className="text-slate-900 font-semibold">₹{customer.totalPrincipal.toLocaleString()}</p>
                  </div>
                  <div className="bg-amber-50 p-3 rounded-lg border border-amber-100">
                    <p className="text-xs text-amber-700 font-medium uppercase tracking-wider mb-1">Outstanding Balance</p>
                    <p className="text-amber-900 font-bold text-lg">₹{customer.totalRemaining.toLocaleString()}</p>
                  </div>
                </div>
                
                <h4 className="text-sm font-semibold text-slate-900 mb-3 border-b pb-1">Loan History</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b">
                      <tr>
                        <th className="px-4 py-2 font-medium">Date</th>
                        <th className="px-4 py-2 font-medium">Purpose</th>
                        <th className="px-4 py-2 font-medium">Principal</th>
                        <th className="px-4 py-2 font-medium">Remaining</th>
                        <th className="px-4 py-2 font-medium text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {customer.loans.sort((a: any, b: any) => b.createdAt - a.createdAt).map((loan: any) => (
                        <tr key={loan._id} className="border-b last:border-b-0 hover:bg-slate-50">
                          <td className="px-4 py-3 text-slate-600">{new Date(loan.createdAt).toLocaleDateString()}</td>
                          <td className="px-4 py-3">{loan.purpose || 'N/A'}</td>
                          <td className="px-4 py-3 font-medium">₹{loan.principalAmount.toLocaleString()}</td>
                          <td className="px-4 py-3 font-semibold">₹{loan.remainingAmount.toLocaleString()}</td>
                          <td className="px-4 py-3 text-right">
                             <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                                loan.status === 'active' ? 'bg-green-100 text-green-700' : 
                                loan.status === 'pending' ? 'bg-blue-100 text-blue-700' :
                                loan.status === 'closed' ? 'bg-slate-100 text-slate-700' :
                                'bg-red-100 text-red-700'
                             }`}>
                              {loan.status.toUpperCase()}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
           )
        })}
        {customers.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
            <p className="text-slate-500">No customers found.</p>
          </div>
        )}
      </div>
      
      <ConfirmModal
        isOpen={!!defaulterId}
        onClose={() => setDefaulterId(null)}
        onConfirm={markAsDefaulter}
        title="Mark Customer as Defaulter"
        message="Are you sure you want to mark all active loans for this customer as defaulted? This action will highlight their profile and move them to the defaulters list."
      />

      {editingCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md overflow-hidden">
            <div className="p-4 border-b">
              <h3 className="text-lg font-semibold text-slate-900">Edit Customer Profile</h3>
            </div>
            <form onSubmit={handleEditSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Customer Name</label>
                <input required type="text" value={editingCustomer.customerName} onChange={e => setEditingCustomer({...editingCustomer, customerName: e.target.value})} className="w-full p-2 border rounded-md" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
                <input required type="text" value={editingCustomer.phoneNumber} onChange={e => setEditingCustomer({...editingCustomer, phoneNumber: e.target.value})} className="w-full p-2 border rounded-md" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input type="email" value={editingCustomer.email || ''} onChange={e => setEditingCustomer({...editingCustomer, email: e.target.value})} className="w-full p-2 border rounded-md" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
                <input type="text" value={editingCustomer.address || ''} onChange={e => setEditingCustomer({...editingCustomer, address: e.target.value})} className="w-full p-2 border rounded-md" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Reference Person</label>
                <input type="text" value={editingCustomer.referencePerson || ''} onChange={e => setEditingCustomer({...editingCustomer, referencePerson: e.target.value})} className="w-full p-2 border rounded-md" />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setEditingCustomer(null)} className="px-4 py-2 border rounded-md text-slate-700 hover:bg-slate-50 transition-colors">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
