import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { BuildingIcon, Users, FileText, Ban, AlertTriangle, History, LayoutDashboard, RefreshCw, BookUser, Activity, BookOpen } from 'lucide-react';
import { auth, googleProvider } from './lib/firebase';
import { signInWithPopup, onAuthStateChanged, User } from 'firebase/auth';

import Dashboard from './pages/dashboard/Dashboard';
import LoanForm from './pages/loans/LoanForm';
import LoanApplications from './pages/loans/LoanApplications';
import ActiveLoans from './pages/loans/ActiveLoans';
import Defaulters from './pages/loans/Defaulters';
import RejectedApplications from './pages/loans/RejectedApplications';
import SettledHistory from './pages/loans/SettledHistory';
import Customers from './pages/customers/Customers';
import Ledger from './pages/dashboard/Ledger';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setIsInitializing(false);
    });
    return () => unsub();
  }, []);

  const login = async () => {
    if (isLoggingIn) return;
    setIsLoggingIn(true);
    setAuthError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.error('Login Error:', err);
      if (err.code === 'auth/network-request-failed') {
        setAuthError('Network error: Unable to connect to authentication server. Please check your internet connection or disable any ad-blockers.');
      } else if (err.code === 'auth/popup-closed-by-user') {
        setAuthError('Sign-in window was closed before completion.');
      } else if (err.code === 'auth/cancelled-popup-request') {
        setAuthError('Previous sign-in request was cancelled. Please try again.');
      } else {
        setAuthError(err.message || 'An unexpected authentication error occurred.');
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-pulse flex flex-col items-center">
          <BuildingIcon className="w-12 h-12 text-blue-600 mb-4" />
          <p className="text-gray-500 font-medium">Initializing LMS...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl text-center space-y-6">
          <div className="bg-blue-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto">
            <BuildingIcon className="w-10 h-10 text-blue-600" />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">LMS</h1>
            <p className="text-gray-500">Enterprise Loan Management System</p>
          </div>

          {authError && (
            <div className="bg-red-50 border border-red-100 text-red-600 p-3 rounded-lg text-sm flex items-center gap-2 text-left">
              <AlertTriangle className="shrink-0 w-4 h-4" />
              <span>{authError}</span>
            </div>
          )}

          <button 
            onClick={login} 
            disabled={isLoggingIn}
            className={`w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-200 ${isLoggingIn ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {isLoggingIn ? (
              <RefreshCw className="w-5 h-5 animate-spin" />
            ) : (
              <LayoutDashboard className="w-5 h-5" />
            )}
            {isLoggingIn ? 'Connecting...' : 'Sign in with Google'}
          </button>
          
          <p className="text-xs text-gray-400">
            Secure administrative access only.
          </p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <div className="flex bg-gray-50 min-h-screen">
        {/* Sidebar */}
        <aside className="w-64 bg-slate-900 text-white min-h-screen p-4 sticky top-0 h-screen overflow-y-auto flex flex-col">
          <div>
            <div className="flex items-center gap-2 mb-8 mt-2 px-2">
              <BuildingIcon className="w-8 h-8 text-blue-400" />
              <h1 className="font-bold text-xl tracking-tight">LMS</h1>
            </div>
            
            <nav className="space-y-1">
              <SidebarLink to="/" icon={<LayoutDashboard size={20} />} label="Dashboard" />
              <SidebarLink to="/ledger" icon={<BookOpen size={20} />} label="General Ledger" />
              <SidebarLink to="/new" icon={<FileText size={20} />} label="New Request" />
              
              <div className="pt-4 pb-2 pb-1">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-2">Management</p>
              </div>
              <SidebarLink to="/customers" icon={<BookUser size={20} />} label="Customer Directory" />
              <SidebarLink to="/applications" icon={<FileText size={20} />} label="Applications" />
              <SidebarLink to="/active" icon={<Activity size={20} />} label="Active Loans" />
               <SidebarLink to="/defaulters" icon={<AlertTriangle size={20} />} label="Defaulters" />
              
              <div className="pt-4 pb-2 pb-1">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-2">Archive</p>
              </div>
              <SidebarLink to="/rejected" icon={<Ban size={20} />} label="Rejected" />
              <SidebarLink to="/settled" icon={<History size={20} />} label="Settled History" />
            </nav>
          </div>
          
          <div className="mt-auto pt-8 pb-4 text-center">
            <p className="text-xs text-slate-500 font-medium">Developed by Vanshraj</p>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">
          <div className="max-w-7xl mx-auto">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/ledger" element={<Ledger />} />
              <Route path="/new" element={<LoanForm />} />
              <Route path="/applications" element={<LoanApplications />} />
              <Route path="/customers" element={<Customers />} />
              <Route path="/active" element={<ActiveLoans />} />
              <Route path="/defaulters" element={<Defaulters />} />
              <Route path="/rejected" element={<RejectedApplications />} />
              <Route path="/settled" element={<SettledHistory />} />
            </Routes>
          </div>
        </main>
      </div>
    </BrowserRouter>
  );
}

function SidebarLink({ to, icon, label }: { to: string, icon: React.ReactNode, label: string }) {
  return (
    <Link to={to} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-800 transition-colors text-slate-300 hover:text-white">
      {icon}
      <span className="font-medium text-sm">{label}</span>
    </Link>
  );
}
