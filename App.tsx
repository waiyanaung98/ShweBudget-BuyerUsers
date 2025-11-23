import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Tracker from './components/Tracker';
import Calculator from './components/Calculator';
import Analytics from './components/Analytics';
import Tools from './components/Tools';
import { Transaction, TransactionType, MarketRates, CalculatorData, UserProfile, BackupData, Budget, RecurringTransaction, Badge } from './types';
import { Wallet, ArrowUpCircle, ArrowDownCircle, Settings, Award, Zap, TrendingUp, TrendingDown, ShieldCheck, Cloud, User, Smartphone, CheckCircle, LogIn, Moon, Sun } from 'lucide-react';

// Firebase Imports
import { auth, googleProvider, db } from './firebase';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, setDoc, onSnapshot, collection, addDoc, deleteDoc, writeBatch } from 'firebase/firestore';

// --- INITIAL DATA & CONSTANTS ---
const INITIAL_DATA: Transaction[] = [];

const INITIAL_RATES: MarketRates = {
  THB: 124,
  USD: 4500,
  SGD: 3300, 
  Gold: 6500000 
};

const INITIAL_CALCULATOR_DATA: CalculatorData = {
  targetAmount: 100000000,
  years: 4,
  interestRate: 8,
  monthlyDeposit: 500000,
  fvYears: 3,
  fvRate: 8,
  loanAmount: 30000000,
  loanTermYears: 5,
  loanRate: 10,
  monthlyExpense: 500000,
  fundMonths: 6
};

// Gamification Badges
const BADGES: Badge[] = [
    { id: 'first_step', name: 'First Step', description: 'Add your first transaction', icon: 'Zap', unlocked: false, color: '#60A5FA' },
    { id: 'saver', name: 'Smart Saver', description: 'Have positive savings', icon: 'TrendingUp', unlocked: false, color: '#34D399' },
    { id: 'gold_member', name: 'Gold Member', description: 'Reach 1M MMK Net Worth', icon: 'Award', unlocked: false, color: '#FBBF24' },
    { id: 'disciplined', name: 'Disciplined', description: 'No Budget Overflows', icon: 'ShieldCheck', unlocked: false, color: '#A78BFA' }
];

// Keys for Guest Mode
const KEY_THEME = 'theme';
const KEY_MODE_CHOSEN = 'shwebudget_mode_chosen'; // New key to track if user has seen onboarding
const KEY_GUEST_TRANSACTIONS = 'shwebudget_guest_transactions';
const KEY_GUEST_RATES = 'shwebudget_guest_rates';
const KEY_GUEST_CALC = 'shwebudget_guest_calc';
const KEY_GUEST_BUDGETS = 'shwebudget_guest_budgets';
const KEY_GUEST_RECURRING = 'shwebudget_guest_recurring';

// Google Official Logo
const GoogleLogo = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
);

// Custom Premium Gold Coin Logo (Small for onboarding)
const GoldCoinLogo = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <defs>
      <linearGradient id="coinGrad" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#FFFBEB" />
        <stop offset="25%" stopColor="#FCD34D" />
        <stop offset="50%" stopColor="#D97706" />
        <stop offset="100%" stopColor="#78350F" />
      </linearGradient>
      <linearGradient id="innerGrad" x1="18" y1="18" x2="6" y2="6" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#B45309" />
        <stop offset="40%" stopColor="#F59E0B" />
        <stop offset="100%" stopColor="#FEF3C7" />
      </linearGradient>
    </defs>
    <circle cx="12" cy="12" r="11" fill="url(#coinGrad)" stroke="#92400E" strokeWidth="0.5"/>
    <circle cx="12" cy="12" r="9" fill="none" stroke="#FFFBEB" strokeWidth="0.5" strokeOpacity="0.5" strokeDasharray="0.5 1"/>
    <circle cx="12" cy="12" r="7.5" fill="url(#innerGrad)" stroke="#78350F" strokeWidth="0.2" />
    <text x="12" y="15.5" fontSize="11" fontWeight="900" fontFamily="serif" textAnchor="middle" fill="#78350F">S</text>
  </svg>
);

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // --- THEME ---
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem(KEY_THEME);
    return saved === 'dark';
  });

  // --- AUTH STATE ---
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  
  // --- ONBOARDING STATE ---
  // Check if user has already chosen a mode or is logged in
  const [hasChosenMode, setHasChosenMode] = useState<boolean>(() => {
      return localStorage.getItem(KEY_MODE_CHOSEN) === 'true';
  });

  // --- DATA STATES ---
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_DATA);
  const [marketRates, setMarketRates] = useState<MarketRates>(INITIAL_RATES);
  const [calculatorData, setCalculatorData] = useState<CalculatorData>(INITIAL_CALCULATOR_DATA);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [recurringTransactions, setRecurringTransactions] = useState<RecurringTransaction[]>([]);
  const [badges, setBadges] = useState<Badge[]>(BADGES);
  const [aiInsights, setAiInsights] = useState<string[]>([]);

  // 1. Auth Listener
  useEffect(() => {
    if (!auth) {
        setIsAuthLoading(false);
        return;
    }
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser({
          id: firebaseUser.uid,
          name: firebaseUser.displayName || 'User',
          createdAt: firebaseUser.metadata.creationTime || new Date().toISOString()
        });
        // If logged in, we consider mode chosen
        setHasChosenMode(true);
        localStorage.setItem(KEY_MODE_CHOSEN, 'true');
      } else {
        setUser(null);
      }
      setIsAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 2. Data Loading Logic
  useEffect(() => {
    if (isAuthLoading) return;

    if (user && db) {
        // Cloud Listeners
        const settingsRef = doc(db, 'users', user.id, 'settings', 'config');
        const unsubSettings = onSnapshot(settingsRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.rates) setMarketRates(data.rates);
            if (data.calculator) setCalculatorData(data.calculator);
            if (data.budgets) setBudgets(data.budgets);
            if (data.recurring) setRecurringTransactions(data.recurring);
          } else {
            setDoc(settingsRef, { rates: INITIAL_RATES, calculator: INITIAL_CALCULATOR_DATA }, { merge: true });
          }
        });

        const transRef = collection(db, 'users', user.id, 'transactions');
        const unsubTrans = onSnapshot(transRef, (snapshot) => {
             const tData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
             tData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
             setTransactions(tData);
        });

        return () => {
            unsubSettings();
            unsubTrans();
        };

    } else if (hasChosenMode) {
        // Guest Mode - Load only if mode is chosen
        const savedT = localStorage.getItem(KEY_GUEST_TRANSACTIONS);
        const savedR = localStorage.getItem(KEY_GUEST_RATES);
        const savedC = localStorage.getItem(KEY_GUEST_CALC);
        const savedB = localStorage.getItem(KEY_GUEST_BUDGETS);
        const savedRT = localStorage.getItem(KEY_GUEST_RECURRING);

        setTransactions(savedT ? JSON.parse(savedT) : INITIAL_DATA);
        setMarketRates(savedR ? JSON.parse(savedR) : INITIAL_RATES);
        setCalculatorData(savedC ? JSON.parse(savedC) : INITIAL_CALCULATOR_DATA);
        setBudgets(savedB ? JSON.parse(savedB) : []);
        setRecurringTransactions(savedRT ? JSON.parse(savedRT) : []);
    }
  }, [user, isAuthLoading, hasChosenMode]);

  // 3. Save Data (Guest Mode)
  useEffect(() => { if (!user && hasChosenMode) localStorage.setItem(KEY_GUEST_TRANSACTIONS, JSON.stringify(transactions)); }, [transactions, user, hasChosenMode]);
  useEffect(() => { if (!user && hasChosenMode) localStorage.setItem(KEY_GUEST_RATES, JSON.stringify(marketRates)); }, [marketRates, user, hasChosenMode]);
  useEffect(() => { if (!user && hasChosenMode) localStorage.setItem(KEY_GUEST_CALC, JSON.stringify(calculatorData)); }, [calculatorData, user, hasChosenMode]);
  useEffect(() => { if (!user && hasChosenMode) localStorage.setItem(KEY_GUEST_BUDGETS, JSON.stringify(budgets)); }, [budgets, user, hasChosenMode]);
  useEffect(() => { if (!user && hasChosenMode) localStorage.setItem(KEY_GUEST_RECURRING, JSON.stringify(recurringTransactions)); }, [recurringTransactions, user, hasChosenMode]);

  // 4. RECURRING TRANSACTIONS LOGIC (Runs on load)
  useEffect(() => {
      if (!hasChosenMode) return; // Don't run until mode is chosen

      const today = new Date();
      const currentDay = today.getDate();
      const currentMonthStr = `${today.getFullYear()}-${today.getMonth() + 1}`;
      
      let newTransactions: Transaction[] = [];
      let updatedRecurring: RecurringTransaction[] = [];
      let hasUpdates = false;

      recurringTransactions.forEach(rule => {
          const lastProcessed = rule.lastProcessedDate ? new Date(rule.lastProcessedDate) : null;
          const lastProcessedMonthStr = lastProcessed ? `${lastProcessed.getFullYear()}-${lastProcessed.getMonth() + 1}` : '';

          // If today is past the due day AND it hasn't been processed this month
          if (currentDay >= rule.dayOfMonth && lastProcessedMonthStr !== currentMonthStr) {
              newTransactions.push({
                  id: Date.now().toString() + Math.random(),
                  date: today.toISOString().split('T')[0],
                  description: `Recurring: ${rule.description}`,
                  amount: rule.amount,
                  type: rule.type,
                  category: rule.category,
                  currency: rule.currency
              });
              updatedRecurring.push({ ...rule, lastProcessedDate: today.toISOString() });
              hasUpdates = true;
          } else {
              updatedRecurring.push(rule);
          }
      });

      if (hasUpdates) {
          // Add transactions
          if (user && db) {
              const batch = writeBatch(db);
              newTransactions.forEach(t => {
                  const { id, ...data } = t;
                  batch.set(doc(collection(db, 'users', user.id, 'transactions')), data);
              });
              // Update recurring rules
              batch.set(doc(db, 'users', user.id, 'settings', 'config'), { recurring: updatedRecurring }, { merge: true });
              batch.commit();
              // Local state updates happen via snapshot listeners
          } else {
              setTransactions(prev => [...prev, ...newTransactions]);
              setRecurringTransactions(updatedRecurring);
              alert(`Processed ${newTransactions.length} recurring transactions!`);
          }
      }
  }, [recurringTransactions, user, hasChosenMode]);

  // 5. AI INSIGHTS & GAMIFICATION
  useEffect(() => {
      if (!hasChosenMode) return;

      // Calc totals
      let income = 0, expense = 0;
      transactions.forEach(t => {
          let val = t.amount;
          // Normalize currency
          if (t.currency === 'THB') val *= marketRates.THB;
          if (t.currency === 'USD') val *= marketRates.USD;
          if (t.currency === 'SGD') val *= marketRates.SGD;
          if (t.type === TransactionType.INCOME) income += val;
          if (t.type === TransactionType.EXPENSE) expense += val;
      });
      const netWorth = income - expense;

      // Update Badges
      const newBadges = [...badges];
      if (transactions.length > 0) newBadges.find(b => b.id === 'first_step')!.unlocked = true;
      if (netWorth > 0) newBadges.find(b => b.id === 'saver')!.unlocked = true;
      if (netWorth > 1000000) newBadges.find(b => b.id === 'gold_member')!.unlocked = true;
      // Disciplined check would need budget logic
      setBadges(newBadges);

      // AI Insights
      const insights = [];
      const today = new Date();
      const currentMonth = today.getMonth();
      const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      
      const currMonthExp = transactions.filter(t => t.type === TransactionType.EXPENSE && new Date(t.date).getMonth() === currentMonth).reduce((acc, t) => acc + t.amount, 0);
      const prevMonthExp = transactions.filter(t => t.type === TransactionType.EXPENSE && new Date(t.date).getMonth() === prevMonth).reduce((acc, t) => acc + t.amount, 0);

      if (prevMonthExp > 0) {
          if (currMonthExp > prevMonthExp * 1.2) {
              insights.push(`⚠️ Spending Alert: You have spent 20% more than last month already.`);
          } else if (currMonthExp < prevMonthExp * 0.8) {
              insights.push(`🎉 Great job! Your spending is 20% lower than last month.`);
          }
      }
      if (netWorth > 500000) insights.push(`💡 Wealth Tip: Consider investing your surplus 500k+ in Gold or High Interest savings.`);
      
      setAiInsights(insights.length ? insights : ["Gathering more data for insights..."]);

  }, [transactions, marketRates, hasChosenMode]);


  // --- ACTIONS ---
  const toggleTheme = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    localStorage.setItem(KEY_THEME, newTheme ? 'dark' : 'light');
    if (newTheme) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  };
  
  useEffect(() => { if (isDarkMode) document.documentElement.classList.add('dark'); else document.documentElement.classList.remove('dark'); }, []);

  const handleLogin = async () => {
    if (!auth || !googleProvider) {
        alert("Firebase Configuration Missing.\nPlease set up 'firebase.ts' with your API keys to enable Google Login.");
        return;
    }
    try {
      await signInWithPopup(auth, googleProvider);
      // Auth state listener will handle the rest (setting user and chosen mode)
    } catch (error: any) {
      console.error("Login Error:", error);
      if (error.code === 'auth/configuration-not-found' || error.code === 'auth/api-key-not-valid') {
          alert("Login Failed: Invalid Firebase Configuration. Please check your API Keys.");
      } else if (error.code !== 'auth/popup-closed-by-user') {
          alert("Login failed. Check console for details.");
      }
    }
  };

  const handleGuestMode = () => {
      setHasChosenMode(true);
      localStorage.setItem(KEY_MODE_CHOSEN, 'true');
  };

  const handleLogout = async () => { 
      if (auth) { 
          await signOut(auth); 
          setActiveTab('dashboard'); 
          // Optionally reset chosen mode on logout to show onboarding again?
          // For now, let's keep it simple and just reload, which will check localstorage.
          // If we want to force onboarding again: localStorage.removeItem(KEY_MODE_CHOSEN);
          window.location.reload(); 
      } 
  };

  const addTransaction = async (t: Transaction) => {
      if (user && db) {
          const { id, ...data } = t; 
          await addDoc(collection(db, 'users', user.id, 'transactions'), data);
      } else {
          setTransactions(prev => [...prev, t]);
      }
  };

  const deleteTransaction = async (id: string) => {
      if (user && db) { await deleteDoc(doc(db, 'users', user.id, 'transactions', id)); } 
      else { setTransactions(prev => prev.filter(item => item.id !== id)); }
  };

  // Data Updates
  const updateRates = async (newRates: MarketRates) => {
      setMarketRates(newRates);
      if (user && db) await setDoc(doc(db, 'users', user.id, 'settings', 'config'), { rates: newRates }, { merge: true });
  };
  const updateCalculatorData = async (newData: CalculatorData) => {
      setCalculatorData(newData);
      if (user && db) await setDoc(doc(db, 'users', user.id, 'settings', 'config'), { calculator: newData }, { merge: true });
  };
  const updateBudgets = async (newBudgets: Budget[]) => {
      setBudgets(newBudgets);
      if (user && db) await setDoc(doc(db, 'users', user.id, 'settings', 'config'), { budgets: newBudgets }, { merge: true });
  };
  const addRecurring = async (rule: RecurringTransaction) => {
      const updated = [...recurringTransactions, rule];
      setRecurringTransactions(updated);
      if (user && db) await setDoc(doc(db, 'users', user.id, 'settings', 'config'), { recurring: updated }, { merge: true });
  };
  const deleteRecurring = async (id: string) => {
      const updated = recurringTransactions.filter(r => r.id !== id);
      setRecurringTransactions(updated);
      if (user && db) await setDoc(doc(db, 'users', user.id, 'settings', 'config'), { recurring: updated }, { merge: true });
  };

  // Backup Actions
  const handleExportData = () => {
    const data: BackupData = { profile: user || { id: 'guest', name: 'Guest', createdAt: new Date().toISOString() }, transactions, rates: marketRates, calculator: calculatorData, budgets, recurring: recurringTransactions, version: '2.1' };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `ShweBudget_Backup.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportData = async (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const json = JSON.parse(e.target?.result as string) as BackupData;
            if (json.transactions) {
                 if(confirm(`Restore data?`)) {
                     if (user && db) {
                        const batch = writeBatch(db);
                        const settingsRef = doc(db, 'users', user.id, 'settings', 'config');
                        batch.set(settingsRef, { rates: json.rates, calculator: json.calculator, budgets: json.budgets || [], recurring: json.recurring || [] });
                        await batch.commit();
                        for (const t of json.transactions) { const { id, ...tData } = t; await addDoc(collection(db, 'users', user.id, 'transactions'), tData); }
                     } else {
                        setTransactions(json.transactions);
                        setMarketRates(json.rates);
                        if(json.calculator) setCalculatorData(json.calculator);
                        if(json.budgets) setBudgets(json.budgets);
                        if(json.recurring) setRecurringTransactions(json.recurring);
                        alert('Data restored successfully!');
                     }
                 }
            }
        } catch (err) { alert('Error parsing file.'); }
    };
    reader.readAsText(file);
  };

  // Summary
  const calculateSummary = () => {
    let income = 0, expense = 0, saving = 0;
    transactions.forEach(t => {
        let val = t.amount;
        if (t.currency === 'THB') val *= marketRates.THB;
        if (t.currency === 'USD') val *= marketRates.USD;
        if (t.currency === 'SGD') val *= marketRates.SGD;
        if (t.type === TransactionType.INCOME) income += val;
        if (t.type === TransactionType.EXPENSE) expense += val;
        if (t.type === TransactionType.SAVING) saving += val;
    });
    return { income, expense, saving, balance: income - expense };
  };
  const summary = calculateSummary();

  const DashboardCard = ({ title, amount, icon: Icon, colorClass, bgClass, trend }: any) => (
    <div className="bg-white dark:bg-[#0F172A] p-6 rounded-2xl shadow-lg shadow-gray-200/50 dark:shadow-black/50 border border-gray-100 dark:border-gray-800 transition-transform hover:-translate-y-1 duration-300 min-w-0">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-xl ${bgClass}`}>
          <Icon size={24} className={colorClass} />
        </div>
        {trend && (
             <span className="text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-300 px-2 py-1 rounded-full whitespace-nowrap">This Month</span>
        )}
      </div>
      <div>
        <p className="text-gray-500 dark:text-gray-400 text-sm font-semibold tracking-wide uppercase truncate">{title}</p>
        <h3 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mt-2 break-all leading-none">
          {new Intl.NumberFormat('en-US', { notation: "compact", compactDisplay: "short" }).format(amount)} 
          <span className="text-sm text-gray-400 font-normal ml-1">MMK</span>
        </h3>
      </div>
    </div>
  );

  const renderContent = () => {
    if (isAuthLoading && auth) return <div className="h-full flex items-center justify-center text-[#D4AF37] animate-pulse">Connecting...</div>;

    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="space-y-8 animate-fade-in w-full">
             <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                {/* Net Worth Card */}
                <div className="bg-gradient-to-br from-[#0F172A] to-[#020617] p-8 rounded-3xl shadow-xl text-white relative overflow-hidden xl:col-span-4 flex flex-col md:flex-row items-center justify-between gap-6 border border-[#D4AF37]/30">
                   <div className="absolute -right-10 -top-10 w-64 h-64 bg-[#D4AF37] rounded-full blur-3xl opacity-20 pointer-events-none"></div>
                   <div className="relative z-10 max-w-full">
                      <p className="text-[#94A3B8] text-sm font-bold uppercase tracking-wider mb-2">Total Net Balance</p>
                      <h3 className="text-4xl md:text-5xl font-bold bg-gold-text bg-clip-text text-transparent tracking-tight break-all drop-shadow-sm">
                        {new Intl.NumberFormat('en-US').format(summary.balance)} 
                        <span className="text-lg text-gray-400 font-normal ml-2">MMK</span>
                      </h3>
                      <p className="text-gray-400 mt-3 text-sm flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#D4AF37] flex-shrink-0 animate-pulse"></span>
                        Current available wealth
                      </p>
                   </div>
                   {/* AI Insight Box */}
                   <div className="hidden md:block w-1/3 p-4 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm flex-shrink-0">
                      <p className="text-[#D4AF37] text-xs font-bold uppercase mb-2 flex items-center gap-1"><Zap size={12}/> AI Insight</p>
                      <p className="text-sm text-gray-300 italic">"{aiInsights[0]}"</p>
                   </div>
                </div>

                <DashboardCard title="Total Income" amount={summary.income} icon={ArrowUpCircle} colorClass="text-emerald-500 dark:text-emerald-400" bgClass="bg-emerald-50 dark:bg-emerald-900/20" />
                <DashboardCard title="Total Savings" amount={summary.saving} icon={Wallet} colorClass="text-[#D4AF37] dark:text-[#FCD34D]" bgClass="bg-[#D4AF37]/10 dark:bg-[#D4AF37]/20" />
                <DashboardCard title="Total Expenses" amount={summary.expense} icon={ArrowDownCircle} colorClass="text-red-600 dark:text-red-400" bgClass="bg-red-50 dark:bg-red-900/20" />
                
                {/* Badges / Gamification Card */}
                <div className="bg-white dark:bg-[#0F172A] p-6 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-800 flex flex-col justify-center group transition-all" onClick={() => setActiveTab('tools')}>
                    <div className="flex justify-between items-center mb-4">
                        <p className="text-sm font-bold text-gray-700 dark:text-gray-200">Your Badges</p>
                        <Award size={18} className="text-[#D4AF37]" />
                    </div>
                    <div className="flex gap-2 justify-around">
                        {badges.map(b => (
                            <div key={b.id} className={`p-2 rounded-full border-2 ${b.unlocked ? 'border-[#D4AF37] bg-[#D4AF37]/10 text-[#D4AF37]' : 'border-gray-200 dark:border-gray-700 text-gray-300 dark:text-gray-600 grayscale'}`} title={b.description}>
                                <Award size={20} />
                            </div>
                        ))}
                    </div>
                    <p className="text-xs text-center text-gray-400 mt-3">{badges.filter(b=>b.unlocked).length} / {badges.length} Unlocked</p>
                </div>
             </div>

             <div className="bg-white dark:bg-[#0F172A] p-8 rounded-3xl shadow-lg shadow-gray-200/50 dark:shadow-black/50 border border-gray-100 dark:border-gray-800 overflow-hidden transition-colors duration-300">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-[#1E2A38] dark:text-[#FCD34D]">Financial Overview</h3>
                    <button onClick={() => setActiveTab('analytics')} className="text-sm text-[#D4AF37] dark:text-[#FCD34D] font-bold hover:underline">View Analytics & Budgets</button>
                </div>
                <Analytics transactions={transactions} rates={marketRates} budgets={budgets} updateBudgets={updateBudgets} />
             </div>
          </div>
        );
      case 'tracker':
        return <Tracker 
            transactions={transactions} addTransaction={addTransaction} deleteTransaction={deleteTransaction} 
            recurringTransactions={recurringTransactions} addRecurring={addRecurring} deleteRecurring={deleteRecurring}
        />;
      case 'calculator':
        return <Calculator rates={marketRates} data={calculatorData} onUpdate={updateCalculatorData} />;
      case 'analytics':
        return <Analytics transactions={transactions} rates={marketRates} budgets={budgets} updateBudgets={updateBudgets} />;
      case 'tools':
        return <Tools rates={marketRates} updateRates={updateRates} onExportData={handleExportData} onImportData={handleImportData} />;
      default: return <div>Not Found</div>;
    }
  };

  // --- CONDITIONAL RENDER: ONBOARDING SCREEN ---
  if (!hasChosenMode && !user && !isAuthLoading) {
      return (
          <div className={`flex flex-col items-center justify-center min-h-screen p-6 bg-gray-50 dark:bg-[#020617] transition-colors duration-300 ${isDarkMode ? 'dark' : ''}`}>
              <div className="absolute top-6 right-6">
                  <button 
                    onClick={toggleTheme}
                    className="p-3 rounded-xl bg-white dark:bg-[#1E293B] text-gray-500 dark:text-gray-400 shadow-md hover:text-[#D4AF37] transition-all"
                  >
                    {isDarkMode ? <Moon size={20}/> : <Sun size={20}/>}
                  </button>
              </div>

              <div className="max-w-4xl w-full text-center space-y-8 animate-fade-in">
                  <div className="flex flex-col items-center justify-center gap-4">
                      <div className="w-24 h-24 relative">
                          <div className="absolute inset-0 bg-[#D4AF37] rounded-full blur-2xl opacity-30 animate-pulse"></div>
                          <GoldCoinLogo className="w-full h-full drop-shadow-2xl relative z-10" />
                      </div>
                      <div>
                          <h1 className="text-4xl md:text-5xl font-bold bg-gold-text bg-clip-text text-transparent tracking-tight pb-1">ShweBudget</h1>
                          <p className="text-gray-500 dark:text-gray-400 font-medium mt-2 tracking-wide">Premium Financial Planning for Myanmar</p>
                      </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6 mt-12">
                      {/* Guest Card */}
                      <div className="group bg-white dark:bg-[#0F172A] p-8 rounded-3xl shadow-xl border border-transparent hover:border-[#D4AF37]/30 transition-all hover:-translate-y-1 cursor-pointer relative overflow-hidden" onClick={handleGuestMode}>
                          <div className="absolute top-0 left-0 w-full h-1 bg-gray-200 dark:bg-gray-700 group-hover:bg-[#D4AF37] transition-colors"></div>
                          <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-6 text-gray-500 dark:text-gray-400 group-hover:text-[#D4AF37] transition-colors">
                              <Smartphone size={32} />
                          </div>
                          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Continue as Guest</h3>
                          <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed mb-6">
                              Perfect for trying out the app instantly. Your data is stored securely on <strong>this device only</strong>.
                          </p>
                          <div className="flex items-center text-sm font-bold text-[#D4AF37] gap-2">
                              Start Now <ArrowUpCircle size={16} className="rotate-90"/>
                          </div>
                      </div>

                      {/* Login Card */}
                      <div className="group bg-white dark:bg-[#0F172A] p-8 rounded-3xl shadow-xl border border-transparent hover:border-blue-500/30 transition-all hover:-translate-y-1 cursor-pointer relative overflow-hidden" onClick={handleLogin}>
                          <div className="absolute top-0 left-0 w-full h-1 bg-blue-500/50 group-hover:bg-blue-500 transition-colors"></div>
                          <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center mb-6 text-blue-500 transition-colors">
                              <Cloud size={32} />
                          </div>
                          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Cloud Sync</h3>
                          <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed mb-6">
                              Best for long-term use. Access your finance data from <strong>any device</strong> and never lose it.
                          </p>
                          <button className="w-full flex items-center justify-center gap-3 py-3 bg-white border border-gray-200 dark:border-gray-700 rounded-xl font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors shadow-sm">
                              <GoogleLogo className="w-5 h-5" /> Sign in with Google
                          </button>
                      </div>
                  </div>
                  
                  <p className="text-xs text-gray-400 dark:text-gray-600 pt-8">
                      By continuing, you acknowledge that this is a personal financial tool. <br/>
                      Powered by <strong>PrimeNova Digital Solution</strong>.
                  </p>
              </div>
          </div>
      );
  }

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab} isDarkMode={isDarkMode} toggleTheme={toggleTheme} user={user} onLogin={handleLogin} onLogout={handleLogout}>
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-[#1E2A38] dark:text-white tracking-tight transition-colors">
          {activeTab === 'dashboard' && (user ? `Hello, ${user.name}` : 'Dashboard (Guest Mode)')}
          {activeTab === 'tools' && 'Tools & Settings'}
          {activeTab === 'tracker' && 'Income & Expenses'}
          {activeTab === 'calculator' && 'Financial Calculators'}
          {activeTab === 'analytics' && 'Analytics & Budgets'}
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2 font-medium text-sm md:text-base transition-colors">
          {user ? <span className="text-green-500 font-bold">● Cloud Sync Active</span> : 'Guest Mode'}
          {' | '}{activeTab === 'dashboard' && 'Welcome to your premium dashboard.'}
          {activeTab === 'tools' && 'Manage rates, backup and gold prices.'}
          {activeTab === 'tracker' && 'Track transactions and manage recurring bills.'}
          {activeTab === 'analytics' && 'Visual insights and budget planning.'}
        </p>
      </div>
      {renderContent()}
    </Layout>
  );
};

export default App;