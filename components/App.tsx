
import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Tracker from './components/Tracker';
import Calculator from './components/Calculator';
import Analytics from './components/Analytics';
import Tools from './components/Tools';
import { Transaction, TransactionType, MarketRates, CalculatorData, UserProfile, BackupData, Budget, RecurringTransaction, Badge } from './types';
import { Wallet, ArrowUpCircle, ArrowDownCircle, Settings, Award, Zap, TrendingUp, TrendingDown } from 'lucide-react';

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
const KEY_GUEST_TRANSACTIONS = 'shwebudget_guest_transactions';
const KEY_GUEST_RATES = 'shwebudget_guest_rates';
const KEY_GUEST_CALC = 'shwebudget_guest_calc';
const KEY_GUEST_BUDGETS = 'shwebudget_guest_budgets';
const KEY_GUEST_RECURRING = 'shwebudget_guest_recurring';

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

    } else {
        // Guest Mode
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
  }, [user, isAuthLoading]);

  // 3. Save Data (Guest Mode)
  useEffect(() => { if (!user) localStorage.setItem(KEY_GUEST_TRANSACTIONS, JSON.stringify(transactions)); }, [transactions, user]);
  useEffect(() => { if (!user) localStorage.setItem(KEY_GUEST_RATES, JSON.stringify(marketRates)); }, [marketRates, user]);
  useEffect(() => { if (!user) localStorage.setItem(KEY_GUEST_CALC, JSON.stringify(calculatorData)); }, [calculatorData, user]);
  useEffect(() => { if (!user) localStorage.setItem(KEY_GUEST_BUDGETS, JSON.stringify(budgets)); }, [budgets, user]);
  useEffect(() => { if (!user) localStorage.setItem(KEY_GUEST_RECURRING, JSON.stringify(recurringTransactions)); }, [recurringTransactions, user]);

  // 4. RECURRING TRANSACTIONS LOGIC (Runs on load)
  useEffect(() => {
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
  }, [recurringTransactions, user]); // Dependency on recurringTransactions might loop if not careful, but logic prevents double add

  // 5. AI INSIGHTS & GAMIFICATION
  useEffect(() => {
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

  }, [transactions, marketRates]);


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
    if (!auth) { alert("Firebase Configuration Missing"); return; }
    try { await signInWithPopup(auth, googleProvider); } catch (error: any) { alert("Login failed."); }
  };

  const handleLogout = async () => { if (auth) { await signOut(auth); setActiveTab('dashboard'); window.location.reload(); } };

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
