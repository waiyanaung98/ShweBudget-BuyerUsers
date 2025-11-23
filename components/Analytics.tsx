
import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { Transaction, TransactionType, MarketRates, Budget } from '../types';
import { PieChart as PieIcon, Activity, Target, Zap, AlertTriangle, CheckCircle } from 'lucide-react';

interface AnalyticsProps {
  transactions: Transaction[];
  rates: MarketRates;
  budgets?: Budget[];
  updateBudgets?: (budgets: Budget[]) => void;
}

type Timeframe = 'daily' | 'monthly' | 'yearly';

const COLORS = ['#D4AF37', '#10B981', '#EF4444', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#6366F1'];
const INCOME_COLOR = '#10B981';
const EXPENSE_COLOR = '#EF4444';
const NET_COLOR = '#D4AF37';

const Analytics: React.FC<AnalyticsProps> = ({ transactions, rates, budgets = [], updateBudgets }) => {
  const [timeframe, setTimeframe] = useState<Timeframe>('monthly');
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [editingBudget, setEditingBudget] = useState<string | null>(null);
  const [newLimit, setNewLimit] = useState<string>('');

  // Helper: Convert to MMK
  const toMMK = (amount: number, currency: string) => {
    if (currency === 'THB') return amount * rates.THB;
    if (currency === 'USD') return amount * rates.USD;
    if (currency === 'SGD') return amount * rates.SGD;
    return amount;
  };

  const availableYears = useMemo(() => {
    const years = new Set<number>(transactions.map(t => new Date(t.date).getFullYear()));
    years.add(new Date().getFullYear());
    return Array.from(years).sort((a, b) => b - a);
  }, [transactions]);

  // Chart Data
  const chartData = useMemo(() => {
    const data: Record<string, any> = {};
    transactions.forEach(t => {
      const date = new Date(t.date);
      const year = date.getFullYear();
      if (timeframe !== 'yearly' && year !== selectedYear) return;

      let key = '', label = '';
      if (timeframe === 'daily') {
        key = t.date; 
        label = new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      } else if (timeframe === 'monthly') {
        key = `${year}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        label = new Date(t.date).toLocaleDateString('en-US', { month: 'short' });
      } else {
        key = year.toString();
        label = year.toString();
      }

      const amountMMK = toMMK(t.amount, t.currency);
      if (!data[key]) data[key] = { name: label, fullDate: key, Income: 0, Expense: 0, Saving: 0, Net: 0 };

      if (t.type === TransactionType.INCOME) {
          data[key].Income += amountMMK;
          data[key].Net += amountMMK;
      } else if (t.type === TransactionType.EXPENSE) {
          data[key].Expense += amountMMK;
          data[key].Net -= amountMMK;
      } else if (t.type === TransactionType.SAVING) {
          data[key].Saving += amountMMK;
      }
    });
    return Object.values(data).sort((a, b) => a.fullDate.localeCompare(b.fullDate));
  }, [transactions, timeframe, selectedYear, rates]);

  // Category Data
  const categoryData = useMemo(() => {
    const catMap: Record<string, number> = {};
    transactions
      .filter(t => t.type === TransactionType.EXPENSE)
      .filter(t => timeframe === 'yearly' || new Date(t.date).getFullYear() === selectedYear)
      .forEach(t => {
        const amountMMK = toMMK(t.amount, t.currency);
        catMap[t.category] = (catMap[t.category] || 0) + amountMMK;
      });
    return Object.keys(catMap).map(name => ({ name, value: catMap[name] }));
  }, [transactions, timeframe, selectedYear, rates]);

  // AI Insights Calculation
  const insights = useMemo(() => {
      const list = [];
      const totalIncome = chartData.reduce((acc, curr) => acc + curr.Income, 0);
      const totalExpense = chartData.reduce((acc, curr) => acc + curr.Expense, 0);
      
      if (totalExpense > totalIncome && totalIncome > 0) {
          list.push({ type: 'danger', text: 'You are spending more than you earn this period.' });
      }
      
      const savingsRatio = (totalIncome - totalExpense) / totalIncome;
      if (savingsRatio > 0.2) {
          list.push({ type: 'success', text: 'Great! You are saving more than 20% of your income.' });
      }

      // Highest Category
      if (categoryData.length > 0) {
          const highest = categoryData.reduce((prev, current) => (prev.value > current.value) ? prev : current);
          list.push({ type: 'info', text: `Your highest spending is on ${highest.name} (${new Intl.NumberFormat('en-US', {notation: "compact"}).format(highest.value)} MMK).` });
      }

      return list;
  }, [chartData, categoryData]);

  // Budget Handlers
  const handleSetBudget = (category: string) => {
      if (!updateBudgets || !newLimit) return;
      const limit = parseFloat(newLimit);
      if (isNaN(limit)) return;

      const newBudgets = budgets.filter(b => b.category !== category);
      newBudgets.push({ category, limit });
      updateBudgets(newBudgets);
      setEditingBudget(null);
      setNewLimit('');
  };

  const formatCurrency = (val: number) => new Intl.NumberFormat('en-US', { notation: "compact" }).format(val);

  return (
    <div className="space-y-8 animate-fade-in w-full">
      
      {/* Controls */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-white dark:bg-[#0F172A] p-4 rounded-xl border border-gray-200 dark:border-gray-800 gap-4 transition-colors">
         <h2 className="text-lg font-bold text-[#1E2A38] dark:text-[#FCD34D] flex items-center gap-2">
            <Activity size={20} className="text-[#D4AF37]"/>
            Analytics Dashboard
         </h2>
         <div className="flex gap-3">
            {timeframe !== 'yearly' && (
              <div className="relative">
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="pl-4 pr-8 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-bold text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-[#D4AF37] cursor-pointer"
                >
                  {availableYears.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
            )}
            <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
              {(['daily', 'monthly', 'yearly'] as Timeframe[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setTimeframe(t)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-md capitalize transition-all ${
                    timeframe === t
                      ? 'bg-white dark:bg-gray-600 text-[#1E2A38] dark:text-white shadow-sm border border-gray-200 dark:border-gray-500'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
         </div>
      </div>

      {/* AI Insights Section */}
      <div className="bg-gradient-to-r from-[#1E2A38] to-[#0F172A] p-6 rounded-2xl shadow-lg border border-[#D4AF37]/30 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10"><Zap size={80}/></div>
          <h3 className="text-[#D4AF37] font-bold text-sm uppercase tracking-wider mb-4 flex items-center gap-2"><Zap size={16}/> AI Financial Insights</h3>
          <div className="grid md:grid-cols-3 gap-4 relative z-10">
              {insights.map((insight, idx) => (
                  <div key={idx} className="bg-white/5 border border-white/10 p-3 rounded-lg backdrop-blur-sm flex items-start gap-3">
                      {insight.type === 'danger' && <AlertTriangle className="text-red-400 shrink-0" size={20}/>}
                      {insight.type === 'success' && <CheckCircle className="text-green-400 shrink-0" size={20}/>}
                      {insight.type === 'info' && <Activity className="text-blue-400 shrink-0" size={20}/>}
                      <p className="text-sm text-gray-300 leading-snug">{insight.text}</p>
                  </div>
              ))}
              {insights.length === 0 && <p className="text-gray-400 text-sm">Add more transaction data to generate insights.</p>}
          </div>
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-6">
          {/* Bar Chart */}
          <div className="bg-white dark:bg-[#0F172A] p-6 rounded-2xl shadow-lg border border-[#D4AF37]/20 transition-colors relative overflow-hidden">
             <div className="mb-6 relative z-10">
                <h3 className="font-bold text-[#1E2A38] dark:text-white">Cash Flow</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">Income vs Expenses</p>
             </div>
             <div className="h-[300px] relative z-10">
                <ResponsiveContainer width="100%" height="100%">
                   <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" strokeOpacity={0.1} />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 11, fill: '#9ca3af'}} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{fontSize: 11, fill: '#9ca3af'}} tickFormatter={formatCurrency} />
                      <Tooltip 
                         cursor={{fill: 'rgba(255,255,255,0.05)'}}
                         contentStyle={{borderRadius: '12px', border: '1px solid rgba(212,175,55,0.2)', backgroundColor: '#0F172A', color: '#fff'}}
                         formatter={(value: number) => new Intl.NumberFormat('en-US').format(Math.round(value))}
                      />
                      <Legend />
                      <Bar dataKey="Income" fill={INCOME_COLOR} radius={[4, 4, 0, 0]} barSize={20} />
                      <Bar dataKey="Expense" fill={EXPENSE_COLOR} radius={[4, 4, 0, 0]} barSize={20} />
                   </BarChart>
                </ResponsiveContainer>
             </div>
          </div>

          {/* Line Chart */}
          <div className="bg-white dark:bg-[#0F172A] p-6 rounded-2xl shadow-lg border border-[#D4AF37]/20 transition-colors relative overflow-hidden">
             <div className="mb-6 relative z-10">
                <h3 className="font-bold text-[#1E2A38] dark:text-white">Net Wealth</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">Accumulated Savings</p>
             </div>
             <div className="h-[300px] relative z-10">
                <ResponsiveContainer width="100%" height="100%">
                   <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" strokeOpacity={0.1} />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 11, fill: '#9ca3af'}} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{fontSize: 11, fill: '#9ca3af'}} tickFormatter={formatCurrency} />
                      <Tooltip 
                         contentStyle={{borderRadius: '12px', border: '1px solid rgba(212,175,55,0.2)', backgroundColor: '#0F172A', color: '#fff'}}
                         formatter={(value: number) => new Intl.NumberFormat('en-US').format(Math.round(value))}
                      />
                      <Line type="monotone" dataKey="Net" stroke={NET_COLOR} strokeWidth={3} dot={{r: 4}} activeDot={{r: 6}} />
                   </LineChart>
                </ResponsiveContainer>
             </div>
          </div>
      </div>

      {/* Budget Planning Section */}
      <div className="bg-white dark:bg-[#0F172A] p-6 rounded-2xl shadow-lg border border-[#D4AF37]/20 transition-colors">
          <div className="flex justify-between items-center mb-6">
              <div>
                  <h3 className="font-bold text-[#1E2A38] dark:text-white">Budget Planning</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Set monthly limits for categories</p>
              </div>
              <Target className="text-[#D4AF37]" />
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {categoryData.map((cat) => {
                  const budget = budgets.find(b => b.category === cat.name);
                  const limit = budget ? budget.limit : 0;
                  const percentage = limit > 0 ? (cat.value / limit) * 100 : 0;
                  const isOverBudget = percentage > 100;
                  const color = isOverBudget ? 'bg-red-500' : percentage > 80 ? 'bg-yellow-500' : 'bg-green-500';

                  return (
                      <div key={cat.name} className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700">
                          <div className="flex justify-between items-center mb-2">
                              <span className="font-bold text-gray-700 dark:text-gray-200">{cat.name}</span>
                              {editingBudget === cat.name ? (
                                  <div className="flex gap-1">
                                      <input 
                                          type="number" 
                                          className="w-20 text-xs p-1 rounded border dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                          placeholder="Limit"
                                          value={newLimit}
                                          onChange={(e) => setNewLimit(e.target.value)}
                                          autoFocus
                                      />
                                      <button onClick={() => handleSetBudget(cat.name)} className="text-green-500 text-xs font-bold">✓</button>
                                      <button onClick={() => setEditingBudget(null)} className="text-red-500 text-xs font-bold">✕</button>
                                  </div>
                              ) : (
                                  <button onClick={() => { setEditingBudget(cat.name); setNewLimit(limit.toString()); }} className="text-xs text-[#D4AF37] font-bold hover:underline">
                                      {limit > 0 ? 'Edit Limit' : 'Set Limit'}
                                  </button>
                              )}
                          </div>
                          
                          <div className="flex justify-between text-xs mb-1 text-gray-500 dark:text-gray-400">
                              <span>Spent: {formatCurrency(cat.value)}</span>
                              <span>Limit: {limit > 0 ? formatCurrency(limit) : '∞'}</span>
                          </div>
                          
                          {limit > 0 && (
                              <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                  <div className={`h-full ${color} transition-all duration-500`} style={{ width: `${Math.min(percentage, 100)}%` }}></div>
                              </div>
                          )}
                          {limit > 0 && isOverBudget && <p className="text-[10px] text-red-500 font-bold mt-1">Over Budget!</p>}
                      </div>
                  );
              })}
              {categoryData.length === 0 && <p className="text-gray-400 text-sm col-span-3 text-center">No expense data available to set budgets.</p>}
          </div>
      </div>

      {/* Breakdown Pie Chart */}
      <div className="bg-white dark:bg-[#0F172A] p-6 rounded-2xl shadow-lg border border-[#D4AF37]/20 transition-colors">
         <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-[#1E2A38] dark:text-white">Expense Breakdown</h3>
            <PieIcon className="text-gray-300 dark:text-gray-600" />
         </div>
         <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                    >
                        {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip 
                        contentStyle={{borderRadius: '12px', backgroundColor: '#0F172A', color: '#fff'}}
                        formatter={(value: number) => new Intl.NumberFormat('en-US').format(Math.round(value)) + ' MMK'} 
                    />
                    <Legend />
                </PieChart>
            </ResponsiveContainer>
         </div>
      </div>
    </div>
  );
};

export default Analytics;
