import { collection, getDocs, doc, getDoc, setDoc, updateDoc, addDoc, serverTimestamp, query, where, orderBy, deleteDoc } from 'firebase/firestore';
import { db } from './firebase';

export async function getDashboardData() {
  const loansSnapshot = await getDocs(collection(db, 'loans'));
  const entriesSnapshot = await getDocs(query(collection(db, 'entries'), where('type', '==', 'credit')));
  
  const loans = loansSnapshot.docs.map(d => ({ _id: d.id, ...d.data() } as any));
  
  const activeLoans = loans.filter(l => ['active', 'overdue', 'default'].includes(l.status));
  
  let totalCollected = 0;
  entriesSnapshot.forEach(doc => {
    totalCollected += doc.data().amount || 0;
  });

  const portfolioDistribution = [
    { name: 'Active', value: loans.filter(l => l.status === 'active').length },
    { name: 'Default', value: loans.filter(l => l.status === 'default').length },
    { name: 'Closed', value: loans.filter(l => l.status === 'closed').length },
    { name: 'Rejected', value: loans.filter(l => l.status === 'rejected').length },
    { name: 'Pending', value: loans.filter(l => l.status === 'pending').length },
  ].filter(d => d.value > 0);

  const totalPrincipal = activeLoans.reduce((sum, l) => sum + (l.principalAmount || 0), 0);
  const totalExpectedReturn = activeLoans.reduce((sum, l) => sum + (l.totalAmount || 0), 0);

  const capitalStats = [
    { name: 'Principal Disbursed', amount: totalPrincipal },
    { name: 'Expected Return', amount: totalExpectedReturn },
    { name: 'Total Collected', amount: totalCollected },
  ];

  return {
    totalPrincipal,
    totalActiveLoans: loans.filter(l => l.status === 'active').length,
    totalDefaulters: loans.filter(l => l.status === 'default').length,
    totalRemainingAmount: activeLoans.reduce((sum, l) => sum + (l.remainingAmount || 0), 0),
    totalCollected,
    totalProfit: 0,
    settledHistoryCount: loans.filter(l => l.status === 'closed').length,
    rejectedCount: loans.filter(l => l.status === 'rejected').length,
    portfolioDistribution,
    capitalStats
  };
}

export async function createLoan(loanData: any) {
  const startDate = loanData.startDate ? new Date(loanData.startDate) : new Date();
  const dueDate = new Date(startDate);
  dueDate.setDate(dueDate.getDate() + Number(loanData.durationDays));

  const totalAmount = Number(loanData.principalAmount) * (1 + Number(loanData.interestRate) / 100);

  const docRef = await addDoc(collection(db, 'loans'), {
    ...loanData,
    principalAmount: Number(loanData.principalAmount),
    interestRate: Number(loanData.interestRate),
    durationDays: Number(loanData.durationDays),
    startDate: startDate.toISOString(),
    dueDate: dueDate.toISOString(),
    totalAmount,
    remainingAmount: totalAmount,
    status: 'pending',
    createdAt: Date.now(),
    updatedAt: Date.now()
  });
  
  return { _id: docRef.id };
}

export async function getLoans(status?: string) {
  let q;
  if (status) {
    q = query(collection(db, 'loans'), where('status', '==', status));
  } else {
    q = collection(db, 'loans');
  }
  const snapshot = await getDocs(q);
  // Sort them manually if needed or add an index
  const loans = snapshot.docs.map(d => ({ _id: d.id, ...(d.data() as any) } as any));
  return loans;
}

export async function updateLoanStatus(id: string, status: string) {
  await updateDoc(doc(db, 'loans', id), {
    status,
    updatedAt: Date.now()
  });
}

export async function addEntry(loanId: string, amount: number, type: 'credit' | 'debit') {
  const loanRef = doc(db, 'loans', loanId);
  const loanSnap = await getDoc(loanRef);
  if (!loanSnap.exists()) throw new Error('Loan not found');
  
  const loan = loanSnap.data() as any;
  
  await addDoc(collection(db, 'entries'), {
    loanId,
    amount: Number(amount),
    type,
    createdAt: Date.now()
  });

  let remainingAmount = loan.remainingAmount;
  if (type === 'credit') {
    remainingAmount -= Number(amount);
  } else if (type === 'debit') {
    remainingAmount += Number(amount);
  }

  const updates: any = { remainingAmount, updatedAt: Date.now() };
  if (remainingAmount <= 0) {
    updates.status = 'closed';
  }

  await updateDoc(loanRef, updates);
}

export async function getLedgerEntries() {
  const entriesSnapshot = await getDocs(collection(db, 'entries'));
  const loansSnapshot = await getDocs(collection(db, 'loans'));
  
  const loansMap = new Map();
  loansSnapshot.docs.forEach(d => {
    loansMap.set(d.id, { _id: d.id, ...d.data() });
  });

  const entries = entriesSnapshot.docs.map(d => {
    const data = d.data();
    const loan: any = loansMap.get(data.loanId);
    return {
      _id: d.id,
      ...data,
      customerName: loan?.customerName || 'Unknown Customer',
      phoneNumber: loan?.phoneNumber || 'N/A',
      isDisbursement: false,
    };
  });
  
  const loanDisbursements = loansSnapshot.docs.map(d => {
     const data = d.data() as any;
     return {
       _id: `loan_disb_${d.id}`,
       loanId: d.id,
       amount: data.principalAmount,
       type: 'debit', // principal given out
       createdAt: data.createdAt,
       customerName: data.customerName,
       phoneNumber: data.phoneNumber || 'N/A',
       isDisbursement: true,
     };
  });

  const allEntries = [...entries, ...loanDisbursements];
  
  return allEntries.sort((a: any, b: any) => b.createdAt - a.createdAt);
}

export async function updateCustomerInfo(oldPhoneNumber: string, newInfo: { customerName: string, phoneNumber: string, email: string, address: string, referencePerson: string }) {
  const q = query(collection(db, 'loans'), where('phoneNumber', '==', oldPhoneNumber));
  const snap = await getDocs(q);
  
  const promises = snap.docs.map(d => updateDoc(doc(db, 'loans', d.id), {
    ...newInfo,
    updatedAt: Date.now()
  }));
  
  await Promise.all(promises);
}

export async function deleteLoan(id: string) {
  await deleteDoc(doc(db, 'loans', id));
  const entriesSnap = await getDocs(query(collection(db, 'entries'), where('loanId', '==', id)));
  for (const entryDoc of entriesSnap.docs) {
    await deleteDoc(doc(db, 'entries', entryDoc.id));
  }
}
