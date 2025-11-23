
import React, { useState, useRef } from 'react';
import { Plus, ArrowDownCircle, ArrowUpCircle, Wallet, Trash2, Calendar, Tag, AlignLeft, Download, Upload, FileSpreadsheet, Repeat, Clock, Check } from 'lucide-react';
import { Transaction, TransactionType, RecurringTransaction } from '../types';

interface TrackerProps {
  transactions: Transaction[];
  addTransaction: (t: Transaction) => void;
  deleteTransaction: (id: string) => void;
  // Recurring Props
  recurringTransactions?: RecurringTransaction[];
  addRecurring?: (r: RecurringTransaction) => void;
  deleteRecurring?: (id: string) => void;
}

const Tracker: React.FC<TrackerProps> = ({ transactions, addTransaction, deleteTransaction, recurringTransactions = [], addRecurring, deleteRecurring }) => {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<TransactionType>(TransactionType.EXPENSE);
  const [currency, setCurrency] = useState<'MMK' | 'THB' | 'USD' | 'SGD'>('MMK');
  const [category, setCategory] = useState('General');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Recurring Modal State
  const [showRecurringModal, setShowRecurringModal] = useState(false);
  const [recurringDay, setRecurringDay] = useState(1);

  const [filterType, setFilterType] = useState<'ALL' | TransactionType>('ALL');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !description) return;

    const newTransaction: Transaction = {
      id: Date.now().toString(),
      date,
      description,
      amount: parseFloat(amount),
      type,
      category,
      currency
    };

    addTransaction(newTransaction);
    setAmount('');
    setDescription('');
  };

  const handleRecurringSubmit = () => {
      if (!amount || !description || !addRecurring) return;
      addRecurring({
          id: Date.now().toString(),
          description,
          amount: parseFloat(amount),
          type,
          category,
          currency,
          dayOfMonth: recurringDay
      });
      setShowRecurringModal(false);
      setAmount('');
      setDescription('');
      alert("Recurring transaction rule added! It will be processed automatically on the due day.");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      const lines = text.split('\n');
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const cols = line.split(',');
        if (cols.length < 4) continue;

        const tDate = cols[0] || new Date().toISOString().split('T')[0];
        const tDesc = cols[1]?.replace(/"/g, '') || 'Imported Transaction';
        const tTypeStr = cols[2]?.toUpperCase() || 'EXPENSE';
        let tType = TransactionType.EXPENSE;
        if (tTypeStr.includes('INCOME')) tType = TransactionType.INCOME;
        if (tTypeStr.includes('SAVING')) tType = TransactionType.SAVING;
        
        const tAmount = parseFloat(cols[3]) || 0;
        const tCurrency = (cols[4]?.trim() || 'MMK') as any;
        const tCategory = cols[5]?.trim() || 'General';

        addTransaction({
          id: Date.now().toString() + Math.random(),
          date: tDate,
          description: tDesc,
          type: tType,
          amount: tAmount,
          currency: tCurrency,
          category: tCategory
        });
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
      alert('Transactions imported successfully!');
    };
    reader.readAsText(file);
  };

  const exportToCSV = () => {
    const headers = ["Date", "Description", "Type", "Amount", "Currency", "Category"];
    const csvContent = [
      headers.join(","),
      ...transactions.map(t => [
        t.date,
        `"${t.description.replace(/"/g, '""')}"`,
        t.type,
        t.amount,
        t.currency,
        t.category
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `ShweBudget_Transactions_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredTransactions = transactions.filter(t => 
    filterType === 'ALL' ? true : t.type === filterType
  ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="space-y-8 max-w-7xl mx-auto w-full relative">
      
      {/* Recurring Modal Overlay */}
      {showRecurringModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in backdrop-blur-sm">
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl border border-[#B38728]/30">
                  <h3 className="text-xl font-bold text-[#1E2A38] dark:text-[#FCD34D] mb-4 flex items-center gap-2">
                      <Repeat size={20} /> Setup Recurring Bill
                  </h3>
                  <div className="space-y-4">
                      <div>
                          <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Description</label>
                          <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} className="w-full p-3 bg-gray-50 dark:bg-slate-700 rounded-lg border dark:border-slate-600 outline-none dark:text-white" placeholder="e.g. Monthly Rent" />
                      </div>
                      <div className="flex gap-3">
                          <div className="flex-1">
                              <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Amount</label>
                              <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full p-3 bg-gray-50 dark:bg-slate-700 rounded-lg border dark:border-slate-600 outline-none dark:text-white" placeholder="0.00" />
                          </div>
                          <div className="w-24">
                              <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Day</label>
                              <input type="number" min="1" max="31" value={recurringDay} onChange={(e) => setRecurringDay(Number(e.target.value))} className="w-full p-3 bg-gray-50 dark:bg-slate-700 rounded-lg border dark:border-slate-600 outline-none dark:text-white" />
                          </div>
                      </div>
                      <div>
                          <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Type</label>
                          <select value={type} onChange={(e) => setType(e.target.value as TransactionType)} className="w-full p-3 bg-gray-50 dark:bg-slate-700 rounded-lg border dark:border-slate-600 outline-none dark:text-white">
                              <option value={TransactionType.EXPENSE}>Expense</option>
                              <option value={TransactionType.INCOME}>Income</option>
                              <option value={TransactionType.SAVING}>Saving</option>
                          </select>
                      </div>
                      <div className="flex gap-3 pt-4">
                          <button onClick={() => setShowRecurringModal(false)} className="flex-1 py-3 rounded-lg bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-300 font-bold">Cancel</button>
                          <button onClick={handleRecurringSubmit} className="flex-1 py-3 rounded-lg bg-[#B38728] text-[#1E2A38] font-bold shadow-lg">Save Rule</button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      <div className="flex flex-col xl:flex-row gap-8">
        
        {/* Add Transaction / Recurring Form */}
        <div className="w-full xl:w-[450px] flex-shrink-0 space-y-6">
          
          {/* Main Form */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl shadow-gray-200/50 dark:shadow-black/30 border border-[#B38728]/20 overflow-hidden transition-colors duration-300">
            <div className="bg-[#1E2A38] dark:bg-slate-900 p-6 text-white flex items-center gap-3 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-20 h-20 bg-[#B38728] rounded-full blur-2xl opacity-20 pointer-events-none"></div>
                <div className="bg-gold-gradient p-2 rounded-lg relative z-10 shadow-lg">
                    <Plus size={24} className="text-[#1E2A38]" strokeWidth={3} />
                </div>
                <h3 className="font-bold text-xl relative z-10 bg-gold-text bg-clip-text text-transparent">New Transaction</h3>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
               {/* Transaction Type Toggle */}
               <div>
                 <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Transaction Type</label>
                 <div className="grid grid-cols-3 gap-2 p-1.5 bg-gray-100 dark:bg-slate-700 rounded-xl">
                   {[TransactionType.INCOME, TransactionType.EXPENSE, TransactionType.SAVING].map((t) => (
                     <button
                       key={t}
                       type="button"
                       onClick={() => setType(t)}
                       className={`py-3 text-xs font-bold rounded-lg transition-all duration-200 shadow-sm ${
                         type === t 
                         ? t === TransactionType.INCOME 
                            ? 'bg-blue-600 text-white ring-2 ring-blue-200 dark:ring-blue-900' 
                            : t === TransactionType.EXPENSE 
                                ? 'bg-red-600 text-white ring-2 ring-red-200 dark:ring-red-900' 
                                : 'bg-gold-gradient text-[#1E2A38] ring-2 ring-yellow-200 dark:ring-yellow-900'
                         : 'bg-white dark:bg-slate-800 text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white'
                       }`}
                     >
                       {t}
                     </button>
                   ))}
                 </div>
               </div>

               <div className="relative group">
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Date Selection</label>
                  <div className="relative">
                    <input 
                      type="date" 
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full px-4 py-4 bg-white dark:bg-slate-700 border-2 border-gray-200 dark:border-slate-600 rounded-xl text-gray-900 dark:text-white text-lg font-bold focus:bg-white dark:focus:bg-slate-700 focus:ring-4 focus:ring-[#B38728]/20 focus:border-[#B38728] outline-none transition-all cursor-pointer hover:border-[#B38728]/50"
                      required
                    />
                    <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 text-[#B38728] pointer-events-none" size={24} />
                  </div>
               </div>

               <div className="flex gap-3">
                  <div className="flex-1 min-w-0">
                     <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Amount</label>
                     <input 
                       type="number" 
                       value={amount}
                       onChange={(e) => setAmount(e.target.value)}
                       placeholder="0.00"
                       className="w-full p-4 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-gray-900 dark:text-white text-xl font-bold focus:bg-white dark:focus:bg-slate-600 focus:ring-2 focus:ring-[#B38728] outline-none transition-all min-w-0"
                       required
                     />
                  </div>
                  <div className="w-32 flex-shrink-0">
                     <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Currency</label>
                     <select 
                        value={currency} 
                        onChange={(e) => setCurrency(e.target.value as any)}
                        className="w-full p-4 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-gray-900 dark:text-white font-bold focus:bg-white dark:focus:bg-slate-600 focus:ring-2 focus:ring-[#B38728] outline-none cursor-pointer"
                      >
                        <option value="MMK">MMK</option>
                        <option value="THB">THB</option>
                        <option value="USD">USD</option>
                        <option value="SGD">SGD</option>
                     </select>
                  </div>
               </div>

               <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Category</label>
                  <div className="relative">
                    <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <select 
                      value={category} 
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-gray-900 dark:text-white text-sm font-bold focus:bg-white dark:focus:bg-slate-600 focus:ring-2 focus:ring-[#B38728] outline-none appearance-none cursor-pointer"
                    >
                      <option value="General">General</option>
                      <option value="Food">Food & Dining</option>
                      <option value="Transport">Transport</option>
                      <option value="Housing">Housing</option>
                      <option value="Salary">Salary</option>
                      <option value="Bonus">Bonus</option>
                      <option value="Investment">Investment</option>
                      <option value="Health">Health</option>
                      <option value="Shopping">Shopping</option>
                      <option value="Entertainment">Entertainment</option>
                    </select>
                  </div>
               </div>

               <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Description</label>
                  <div className="relative">
                    <AlignLeft className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                     <input 
                        type="text" 
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="e.g., Lunch at downtown"
                        className="w-full pl-12 p-4 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-gray-900 dark:text-white text-sm font-medium focus:bg-white dark:focus:bg-slate-600 focus:ring-2 focus:ring-[#B38728] outline-none transition-all placeholder:text-gray-400"
                        required
                     />
                  </div>
               </div>

               <button type="submit" className="w-full bg-[#1E2A38] dark:bg-gold-gradient text-[#B38728] dark:text-[#1E2A38] py-4 rounded-xl hover:bg-[#2a3b4f] dark:hover:shadow-[#B38728]/30 active:scale-[0.98] transition-all font-bold text-lg shadow-lg shadow-[#1E2A38]/20 flex items-center justify-center gap-2">
                 <Plus size={20} strokeWidth={3}/>
                 Add Record
               </button>
            </form>
          </div>

          {/* Recurring Rules List */}
          {recurringTransactions.length > 0 && (
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-slate-700">
                  <h3 className="font-bold text-[#1E2A38] dark:text-white mb-4 flex items-center gap-2">
                      <Clock size={18} className="text-[#D4AF37]" /> Active Recurring Rules
                  </h3>
                  <div className="space-y-3">
                      {recurringTransactions.map(r => (
                          <div key={r.id} className="flex items-center justify-between text-sm p-3 bg-gray-50 dark:bg-slate-900 rounded-lg">
                              <div>
                                  <p className="font-bold text-gray-800 dark:text-gray-200">{r.description}</p>
                                  <p className="text-xs text-gray-500">Repeats on Day {r.dayOfMonth}</p>
                              </div>
                              <button onClick={() => deleteRecurring && deleteRecurring(r.id)} className="text-red-400 hover:text-red-600">
                                  <Trash2 size={16} />
                              </button>
                          </div>
                      ))}
                  </div>
              </div>
          )}
        </div>

        {/* Transaction List */}
        <div className="flex-1 bg-white dark:bg-slate-800 p-6 md:p-8 rounded-2xl shadow-xl shadow-gray-200/50 dark:shadow-black/30 border border-gray-100 dark:border-slate-700 min-w-0 overflow-hidden flex flex-col transition-colors duration-300">
           <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
             <div className="flex items-center gap-3 flex-wrap">
                 <h3 className="text-xl font-bold text-[#1E2A38] dark:text-white">Recent Transactions</h3>
                 
                 {/* Actions */}
                 <div className="flex gap-2">
                    <button 
                        onClick={exportToCSV}
                        className="p-2 text-gray-400 hover:text-[#1E2A38] dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                        title="Export to CSV"
                    >
                        <Download size={20} />
                    </button>
                    <label className="p-2 text-gray-400 hover:text-[#1E2A38] dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer" title="Import CSV">
                        <Upload size={20} />
                        <input 
                           type="file" 
                           ref={fileInputRef}
                           onChange={handleFileUpload}
                           accept=".csv"
                           className="hidden"
                        />
                    </label>
                    <button
                        onClick={() => setShowRecurringModal(true)}
                        className="flex items-center gap-1 px-3 py-2 bg-[#B38728]/10 text-[#B38728] hover:bg-[#B38728] hover:text-white rounded-lg text-xs font-bold transition-all"
                    >
                        <Repeat size={14} /> recurring
                    </button>
                 </div>
             </div>
             <select 
               value={filterType} 
               onChange={(e) => setFilterType(e.target.value as any)}
               className="text-sm font-medium border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-gray-700 dark:text-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-[#B38728] cursor-pointer"
             >
               <option value="ALL">All Types</option>
               <option value={TransactionType.INCOME}>Income Only</option>
               <option value={TransactionType.EXPENSE}>Expenses Only</option>
               <option value={TransactionType.SAVING}>Savings Only</option>
             </select>
           </div>

           <div className="space-y-4">
             {filteredTransactions.length === 0 ? (
               <div className="flex flex-col items-center justify-center py-16 text-gray-400 dark:text-gray-500 border-2 border-dashed border-gray-100 dark:border-slate-700 rounded-2xl bg-gray-50/50 dark:bg-slate-900/50">
                 <div className="bg-white dark:bg-slate-800 p-4 rounded-full mb-4 shadow-sm">
                    <FileSpreadsheet size={32} className="text-[#B38728]"/>
                 </div>
                 <p className="font-medium text-gray-600 dark:text-gray-400">No transactions found.</p>
                 <p className="text-sm mb-4">Start adding manually or import a CSV file.</p>
                 <label className="px-4 py-2 bg-[#1E2A38] dark:bg-gold-gradient text-[#B38728] dark:text-[#1E2A38] rounded-lg text-sm font-bold cursor-pointer hover:bg-[#2a3b4f] transition-colors shadow-lg">
                    Import CSV
                    <input 
                       type="file" 
                       ref={fileInputRef}
                       onChange={handleFileUpload}
                       accept=".csv"
                       className="hidden"
                    />
                 </label>
               </div>
             ) : (
               filteredTransactions.map(t => (
                 <div key={t.id} className="group flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 bg-gray-50 dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 hover:shadow-md hover:border-[#B38728]/30 dark:hover:border-[#B38728]/30 transition-all duration-200 gap-4">
                    <div className="flex items-start gap-4 w-full sm:w-auto min-w-0">
                       <div className={`w-12 h-12 flex-shrink-0 rounded-xl flex items-center justify-center shadow-sm transition-transform group-hover:scale-110 ${
                          t.type === TransactionType.INCOME ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' :
                          t.type === TransactionType.SAVING ? 'bg-[#B38728]/20 text-[#1E2A38] dark:text-[#FCF6BA]' :
                          'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                       }`}>
                          {t.type === TransactionType.INCOME ? <ArrowUpCircle size={24}/> : 
                           t.type === TransactionType.SAVING ? <Wallet size={24}/> : <ArrowDownCircle size={24}/>}
                       </div>
                       <div className="min-w-0 flex-1">
                         <p className="font-bold text-gray-900 dark:text-gray-100 text-base break-words pr-2 leading-snug">{t.description}</p>
                         <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 dark:text-gray-400 mt-1.5">
                           <span className="inline-flex items-center px-2 py-0.5 rounded bg-gray-200/50 dark:bg-slate-800 text-gray-600 dark:text-gray-300 font-medium whitespace-nowrap">
                             {t.category}
                           </span>
                           <span className="text-gray-300 dark:text-gray-600">•</span>
                           <span className="whitespace-nowrap">{t.date}</span>
                         </div>
                       </div>
                    </div>
                    
                    <div className="flex items-center justify-between w-full sm:w-auto gap-4 pl-16 sm:pl-0">
                      <span className={`font-bold text-lg whitespace-nowrap ml-auto ${
                         t.type === TransactionType.INCOME ? 'text-blue-600 dark:text-blue-400' :
                         t.type === TransactionType.SAVING ? 'text-[#B38728] dark:text-[#FCF6BA]' :
                         'text-red-600 dark:text-red-400'
                      }`}>
                        {t.type === TransactionType.EXPENSE ? '-' : '+'}
                        {new Intl.NumberFormat('en-US').format(t.amount)} <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{t.currency}</span>
                      </span>
                      <button 
                        onClick={() => deleteTransaction(t.id)}
                        className="p-2 text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors opacity-100 sm:opacity-0 group-hover:opacity-100"
                        title="Delete"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                 </div>
               ))
             )}
           </div>
        </div>
      </div>
    </div>
  );
};

export default Tracker;
