import React, { useState } from 'react';
import { createLoan } from '../../lib/db';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';

export default function LoanForm() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    customerName: '',
    phoneNumber: '',
    email: '',
    address: '',
    principalAmount: '',
    interestRate: '5',
    durationDays: '30',
    referencePerson: '',
    purpose: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.customerName.trim()) {
      newErrors.customerName = 'Full Name is required';
    } else if (formData.customerName.trim().length < 2) {
      newErrors.customerName = 'Name must be at least 2 characters';
    } else if (!/^[A-Za-z\s]+$/.test(formData.customerName)) {
      newErrors.customerName = 'Name can only contain letters and spaces';
    }

    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone Number is required';
    } else if (!/^\+?[0-9]{10,14}$/.test(formData.phoneNumber.replace(/[\s-]/g, ''))) {
      newErrors.phoneNumber = 'Enter a valid phone number (e.g. +91 9876543210)';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Enter a valid email address';
    }

    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    } else if (formData.address.trim().length < 10) {
      newErrors.address = 'Address must be at least 10 characters long';
    }

    if (!formData.purpose.trim()) {
      newErrors.purpose = 'Loan Purpose is required';
    } else if (formData.purpose.trim().length < 5) {
      newErrors.purpose = 'Purpose must be at least 5 characters long';
    }

    const principal = parseFloat(formData.principalAmount);
    if (!formData.principalAmount) {
      newErrors.principalAmount = 'Principal Amount is required';
    } else if (isNaN(principal) || principal <= 0) {
      newErrors.principalAmount = 'Must be a valid amount greater than 0';
    }

    const interest = parseFloat(formData.interestRate);
    if (!formData.interestRate) {
      newErrors.interestRate = 'Interest Rate is required';
    } else if (isNaN(interest) || interest < 0 || interest > 100) {
      newErrors.interestRate = 'Rate must be between 0 and 100';
    }

    const duration = parseInt(formData.durationDays);
    if (!formData.durationDays) {
      newErrors.durationDays = 'Duration is required';
    } else if (isNaN(duration) || duration <= 0) {
      newErrors.durationDays = 'Duration must be at least 1 day';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }
    setLoading(true);
    try {
      await createLoan(formData);
      navigate('/applications');
    } catch (err: any) {
      console.error(err);
      if (err instanceof Error && err.message?.includes('offline')) {
        alert('Database connection is offline. Please check your network or configuration.');
      } else {
        alert('Failed to submit application');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => {
        const newErrs = { ...prev };
        delete newErrs[name];
        return newErrs;
      });
    }
  };

  const fillDemoData = () => {
    setFormData({
      customerName: 'Aarav Patel',
      phoneNumber: '+91 9876543210',
      email: 'aarav.patel@example.in',
      address: '45, Jubilee Hills, Hyderabad, Telangana 500033',
      principalAmount: '100000',
      interestRate: '15',
      durationDays: '365',
      referencePerson: 'Diya Patel (Sister)',
      purpose: 'Business Expansion'
    });
    setErrors({});
  };

  return (
    <div className="max-w-2xl mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">New Loan Application</CardTitle>
          <p className="text-sm text-slate-500">Fill in the customer details and loan terms below.</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            <div className="space-y-4">
              <h3 className="font-semibold text-slate-900 border-b pb-2">Customer Details</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Full Name <span className="text-red-500">*</span></label>
                  <input name="customerName" value={formData.customerName} onChange={handleChange} className={`w-full p-2 border rounded-md outline-none transition-colors ${errors.customerName ? 'border-red-500 focus:ring-1 focus:ring-red-500' : 'border-slate-300 focus:ring-1 focus:ring-blue-500 focus:border-blue-500'}`} placeholder="e.g. Rahul Sharma" />
                  {errors.customerName && <p className="text-xs text-red-500">{errors.customerName}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Phone Number <span className="text-red-500">*</span></label>
                  <input name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} className={`w-full p-2 border rounded-md outline-none transition-colors ${errors.phoneNumber ? 'border-red-500 focus:ring-1 focus:ring-red-500' : 'border-slate-300 focus:ring-1 focus:ring-blue-500 focus:border-blue-500'}`} placeholder="+91 9876543210" />
                  {errors.phoneNumber && <p className="text-xs text-red-500">{errors.phoneNumber}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Email Address (Optional)</label>
                <input type="email" name="email" value={formData.email} onChange={handleChange} className={`w-full p-2 border rounded-md outline-none transition-colors ${errors.email ? 'border-red-500 focus:ring-1 focus:ring-red-500' : 'border-slate-300 focus:ring-1 focus:ring-blue-500 focus:border-blue-500'}`} placeholder="e.g. rahul@example.com" />
                {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Address <span className="text-red-500">*</span></label>
                <input name="address" value={formData.address} onChange={handleChange} className={`w-full p-2 border rounded-md outline-none transition-colors ${errors.address ? 'border-red-500 focus:ring-1 focus:ring-red-500' : 'border-slate-300 focus:ring-1 focus:ring-blue-500 focus:border-blue-500'}`} placeholder="e.g. 123 MG Road, Bangalore" />
                {errors.address && <p className="text-xs text-red-500">{errors.address}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Reference Person (Optional)</label>
                <input name="referencePerson" value={formData.referencePerson} onChange={handleChange} className="w-full p-2 border rounded-md outline-none transition-colors border-slate-300 focus:ring-1 focus:ring-blue-500 focus:border-blue-500" placeholder="e.g. Priya Sharma - Colleague" />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Loan Purpose <span className="text-red-500">*</span></label>
                <input name="purpose" value={formData.purpose} onChange={handleChange} className={`w-full p-2 border rounded-md outline-none transition-colors ${errors.purpose ? 'border-red-500 focus:ring-1 focus:ring-red-500' : 'border-slate-300 focus:ring-1 focus:ring-blue-500 focus:border-blue-500'}`} placeholder="e.g. Home Renovation, Business Expansion" />
                {errors.purpose && <p className="text-xs text-red-500">{errors.purpose}</p>}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-slate-900 border-b pb-2">Loan Terms</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Principal Amount (₹) <span className="text-red-500">*</span></label>
                  <input type="number" name="principalAmount" value={formData.principalAmount} onChange={handleChange} className={`w-full p-2 border rounded-md outline-none transition-colors ${errors.principalAmount ? 'border-red-500 focus:ring-1 focus:ring-red-500' : 'border-slate-300 focus:ring-1 focus:ring-blue-500 focus:border-blue-500'}`} placeholder="5000" />
                  {errors.principalAmount && <p className="text-xs text-red-500">{errors.principalAmount}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Interest Rate (%) <span className="text-red-500">*</span></label>
                  <input type="number" step="0.1" name="interestRate" value={formData.interestRate} onChange={handleChange} className={`w-full p-2 border rounded-md outline-none transition-colors ${errors.interestRate ? 'border-red-500 focus:ring-1 focus:ring-red-500' : 'border-slate-300 focus:ring-1 focus:ring-blue-500 focus:border-blue-500'}`} placeholder="5" />
                  {errors.interestRate && <p className="text-xs text-red-500">{errors.interestRate}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Duration (Days) <span className="text-red-500">*</span></label>
                <input type="number" name="durationDays" value={formData.durationDays} onChange={handleChange} className={`w-full p-2 border rounded-md outline-none transition-colors ${errors.durationDays ? 'border-red-500 focus:ring-1 focus:ring-red-500' : 'border-slate-300 focus:ring-1 focus:ring-blue-500 focus:border-blue-500'}`} placeholder="30" />
                {errors.durationDays && <p className="text-xs text-red-500">{errors.durationDays}</p>}
              </div>
            </div>

            <div className="pt-4 flex justify-end gap-3">
              <button type="button" onClick={fillDemoData} className="px-4 py-2 border border-blue-200 text-blue-600 rounded-md hover:bg-blue-50 transition-colors mr-auto">Fill Indian Data</button>
              <button type="button" onClick={() => navigate(-1)} className="px-4 py-2 border border-slate-300 rounded-md text-slate-700 hover:bg-slate-50 transition-colors">Cancel</button>
              <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50">
                {loading ? 'Submitting...' : 'Submit Request'}
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
