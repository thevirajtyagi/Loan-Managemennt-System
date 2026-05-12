import React, { useState, useEffect } from 'react';
import { getDashboardData } from '../../lib/db';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { DollarSign, Pickaxe, Users, AlertCircle, RefreshCw, XCircle, CheckCircle2, IndianRupee, Activity, TrendingUp } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#10b981', '#f43f5e', '#64748b', '#f59e0b', '#3b82f6'];

export default function Dashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setError(null);
    try {
      const result = await getDashboardData();
      setData(result);
    } catch (err: any) {
      console.error(err);
      if (err instanceof Error && err.message?.includes('offline')) {
        setError('Database connection is offline. Please check your network or configuration.');
      } else {
        setError('Failed to load data. See console for details.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-slate-500 flex items-center justify-center min-h-[50vh]"><Activity className="animate-spin mr-2" /> Loading dashboard...</div>;
  
  if (error) {
    return (
      <div className="p-8">
        <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-lg flex items-start gap-3">
          <AlertCircle className="shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold">Setup Required</h3>
            <p className="text-sm mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!data) return <div className="p-8 flex items-center justify-center min-h-[50vh]">Failed to load data.</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Dashboard Overview</h1>
          <p className="text-slate-500 mt-1">Here's what's happening with your lending portfolio today.</p>
        </div>
        <div className="flex gap-4 items-center">
          <button onClick={fetchData} className="flex gap-2 items-center px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 shadow-sm rounded-lg hover:bg-slate-50 transition-colors">
            <RefreshCw size={16} /> Refresh Data
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Capital in Market" value={`₹${data.totalPrincipal.toLocaleString()}`} icon={<IndianRupee size={22} />} trend="Active deployed capital" colorClass="bg-emerald-100 text-emerald-700" />
        <StatCard title="Remaining to Collect" value={`₹${data.totalRemainingAmount.toLocaleString()}`} icon={<Pickaxe size={22} />} trend="Including interest" colorClass="bg-blue-100 text-blue-700" />
        <StatCard title="Total Collected" value={`₹${data.totalCollected.toLocaleString()}`} icon={<CheckCircle2 size={22} />} trend="From all entries" colorClass="bg-indigo-100 text-indigo-700" />
        <StatCard title="Total Profit Earned" value={`₹${data.totalProfit.toLocaleString()}`} icon={<TrendingUp size={22} />} trend="From closed loans" colorClass="bg-violet-100 text-violet-700" />
        
        <StatCard title="Active Customers" value={data.totalActiveLoans} icon={<Users size={22} />} trend="Currently active loans" colorClass="bg-amber-100 text-amber-700" />
        <StatCard title="Defaulters (30d+)" value={data.totalDefaulters} icon={<AlertCircle size={22} />} trend="Requires recovery" colorClass="bg-rose-100 text-rose-700" />
        <StatCard title="Rejected Applications" value={data.rejectedCount} icon={<XCircle size={22} />} trend="Archived requests" colorClass="bg-slate-100 text-slate-700" />
        <StatCard title="Successfully Settled" value={data.settledHistoryCount} icon={<CheckCircle2 size={22} />} trend="Closed operations" colorClass="bg-teal-100 text-teal-700" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-sm border-slate-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-800">Portfolio Distribution</CardTitle>
          </CardHeader>
          <CardContent className="h-80 w-full">
            {data.portfolioDistribution && data.portfolioDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.portfolioDistribution}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    innerRadius={60}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {data.portfolioDistribution.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} loans`, 'Count']} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400">No portfolio data yet</div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-800">Capital Flow Overview</CardTitle>
          </CardHeader>
          <CardContent className="h-80 w-full text-sm">
             {data.capitalStats && data.capitalStats.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.capitalStats} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} tickFormatter={(val) => `₹${val/1000}k`} />
                  <Tooltip 
                    formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Amount']} 
                    cursor={{ fill: '#f1f5f9' }}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="amount" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={60}>
                    {data.capitalStats.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={['#10b981', '#3b82f6', '#8b5cf6'][index % 3]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
             ) : (
              <div className="flex items-center justify-center h-full text-slate-400">No capital flow data yet</div>
             )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, trend, colorClass = "bg-blue-50 text-blue-600" }: { title: string, value: string | number, icon: React.ReactNode, trend?: string, colorClass?: string }) {
  return (
    <Card className="hover:shadow-md transition-shadow duration-200 border-slate-200 overflow-hidden group">
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-500 tracking-tight">{title}</p>
            <p className="text-3xl font-bold tracking-tight text-slate-900">{value}</p>
          </div>
          <div className={`p-3 rounded-xl ${colorClass} group-hover:scale-110 transition-transform duration-300`}>
            {icon}
          </div>
        </div>
        {trend && (
          <div className="mt-4 flex items-center text-sm">
            <span className="text-slate-500 font-medium">{trend}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
