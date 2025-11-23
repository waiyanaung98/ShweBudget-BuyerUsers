import React, { useState, useEffect } from 'react';
import { Target, TrendingUp, ShieldCheck, Car, Home, Calendar, Globe } from 'lucide-react';
import { MarketRates, CalculatorData } from '../types';

type CalculatorTab = 'target' | 'fv' | 'loan' | 'emergency';

interface CalculatorProps {
    rates: MarketRates;
    data: CalculatorData;
    onUpdate: (newData: CalculatorData) => void;
}

const Calculator: React.FC<CalculatorProps> = ({ rates, data, onUpdate }) => {
  const [activeTab, setActiveTab] = useState<CalculatorTab>('target');

  // --- Common State ---
  const [currency, setCurrency] = useState<'MMK' | 'THB' | 'USD' | 'SGD'>('MMK');
  
  // --- Derived Calculations State ---
  const [monthlySave, setMonthlySave] = useState<number>(0);
  const [futureValue, setFutureValue] = useState<number>(0);
  const [monthlyPayment, setMonthlyPayment] = useState<number>(0);
  const [totalInterest, setTotalInterest] = useState<number>(0);
  const [fundTotal, setFundTotal] = useState<number>(0);

  // --- Calculations ---

  // 1. Target PMT
  useEffect(() => {
    const r = data.interestRate / 100;
    const n = data.years;
    let pmt = 0;
    if (r === 0) pmt = data.targetAmount / (n * 12);
    else {
        const monthlyRate = r / 12;
        const numMonths = n * 12;
        pmt = data.targetAmount * monthlyRate / (Math.pow(1 + monthlyRate, numMonths) - 1);
    }
    setMonthlySave(pmt);
  }, [data.targetAmount, data.years, data.interestRate]);

  // 2. FV
  useEffect(() => {
     const r = data.fvRate / 100 / 12;
     const n = data.fvYears * 12;
     let fv = 0;
     if (r === 0) fv = data.monthlyDeposit * n;
     else fv = data.monthlyDeposit * ((Math.pow(1 + r, n) - 1) / r);
     setFutureValue(fv);
  }, [data.monthlyDeposit, data.fvYears, data.fvRate]);

  // 3. Loan (EMI)
  useEffect(() => {
    const r = data.loanRate / 100 / 12;
    const n = data.loanTermYears * 12;
    let emi = 0;
    if (r === 0) emi = data.loanAmount / n;
    else emi = (data.loanAmount * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    
    setMonthlyPayment(emi);
    setTotalInterest((emi * n) - data.loanAmount);
  }, [data.loanAmount, data.loanTermYears, data.loanRate]);

  // 4. Emergency Fund
  useEffect(() => {
    setFundTotal(data.monthlyExpense * data.fundMonths);
  }, [data.monthlyExpense, data.fundMonths]);


  // --- Helpers ---
  const formatMoney = (amount: number, curr: string = currency) => {
    if (isNaN(amount) || !isFinite(amount)) return '0 ' + curr;
    return new Intl.NumberFormat('en-US', {
      style: 'decimal',
      maximumFractionDigits: 0
    }).format(amount) + ' ' + curr;
  };

  // Projection Helper for FV
  const calculateProjection = (months: number) => {
    const r = data.fvRate / 100 / 12;
    if (r === 0) return data.monthlyDeposit * months;
    return data.monthlyDeposit * ((Math.pow(1 + r, months) - 1) / r);
  };

  const InputField = ({ label, value, onChange, type = "number", suffix = "" }: any) => (
    <div className="group w-full">
      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 group-focus-within:text-[#1E2A38] dark:group-focus-within:text-[#FCD34D] transition-colors">
        {label}
      </label>
      <div className="relative">
        <input 
          type={type}
          value={value}
          onChange={onChange}
          className="w-full p-4 pr-20 bg-gray-50 dark:bg-[#1E293B] border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white font-medium text-lg focus:bg-white dark:focus:bg-[#0F172A] focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent outline-none transition-all shadow-sm min-w-0"
        />
        {suffix && <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium text-sm pointer-events-none hidden sm:inline">{suffix}</span>}
      </div>
    </div>
  );

  const TabButton = ({ id, icon: Icon, label }: { id: CalculatorTab, icon: any, label: string }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`flex items-center gap-2 px-4 py-3 rounded-xl transition-all duration-200 font-bold text-sm sm:text-base whitespace-nowrap flex-1 justify-center border ${
        activeTab === id
          ? 'bg-[#0F172A] dark:bg-gold-gradient text-[#FCD34D] dark:text-[#0F172A] border-[#0F172A] shadow-lg shadow-[#D4AF37]/20'
          : 'bg-white dark:bg-[#1E293B] text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-[#334155] hover:text-gray-900 dark:hover:text-white'
      }`}
    >
      <Icon size={18} />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );

  return (
    <div className="space-y-8 animate-fade-in max-w-6xl mx-auto w-full">
      
      {/* Tabs */}
      <div className="flex flex-wrap gap-2 md:gap-4 overflow-x-auto pb-2 scrollbar-hide">
        <TabButton id="target" icon={Target} label="Savings Target" />
        <TabButton id="fv" icon={TrendingUp} label="Investment Growth" />
        <TabButton id="loan" icon={Home} label="Loan Calculator" />
        <TabButton id="emergency" icon={ShieldCheck} label="Emergency Fund" />
      </div>

      {/* Calculator Body */}
      <div className="bg-white dark:bg-[#0F172A] rounded-2xl shadow-xl shadow-gray-200/50 dark:shadow-black/50 border border-[#D4AF37]/20 overflow-hidden transition-colors duration-300">
        
        {/* --- Tab 1: Target Planner --- */}
        {activeTab === 'target' && (
          <>
            <div className="bg-[#0F172A] dark:bg-[#020617] p-8 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-10">
                <Target size={120} />
              </div>
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-3">
                   <span className="p-2 bg-gold-gradient rounded-lg text-[#0F172A]"><Target size={24}/></span>
                   <h2 className="text-2xl font-bold bg-gold-text bg-clip-text text-transparent">Savings Goal Planner</h2>
                </div>
                <p className="text-gray-300 font-padauk text-lg">လိုချင်တာရဖို့ (Target) ဆိုရင် တစ်လဘယ်လောက်စုရမလဲ?</p>
              </div>
            </div>

            <div className="p-6 md:p-8 grid lg:grid-cols-12 gap-8 lg:gap-12">
              <div className="lg:col-span-7 space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Target Amount (လိုချင်သောပမာဏ)</label>
                  <div className="flex rounded-xl shadow-sm">
                    <input 
                      type="number" 
                      value={data.targetAmount}
                      onChange={(e) => onUpdate({...data, targetAmount: Number(e.target.value)})}
                      className="w-full flex-1 p-4 bg-gray-50 dark:bg-[#1E293B] border border-gray-200 dark:border-gray-700 rounded-l-xl text-gray-900 dark:text-white font-bold text-xl focus:bg-white dark:focus:bg-[#0F172A] focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent outline-none transition-all z-10 min-w-0"
                    />
                    <select 
                      value={currency} 
                      onChange={(e) => setCurrency(e.target.value as any)}
                      className="bg-gray-100 dark:bg-[#334155] border-y border-r border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 font-semibold px-4 rounded-r-xl hover:bg-gray-200 dark:hover:bg-[#475569] transition-colors outline-none cursor-pointer"
                    >
                      <option value="MMK">MMK</option>
                      <option value="THB">THB</option>
                      <option value="USD">USD</option>
                      <option value="SGD">SGD</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <InputField label="Time (Years)" value={data.years} onChange={(e: any) => onUpdate({...data, years: Number(e.target.value)})} suffix="Years" />
                  <InputField label="Interest Rate (%)" value={data.interestRate} onChange={(e: any) => onUpdate({...data, interestRate: Number(e.target.value)})} suffix="% / Year" />
                </div>
              </div>

              <div className="lg:col-span-5 flex flex-col justify-center">
                <div className="bg-[#0F172A] dark:bg-[#020617] rounded-2xl p-6 text-white shadow-lg relative overflow-hidden group border border-[#D4AF37]/30">
                  <h3 className="text-[#FCD34D] text-sm font-bold uppercase tracking-wider mb-4 border-b border-gray-700 pb-2">Required Monthly Savings</h3>
                  <div className="mb-6">
                    <span className="text-3xl md:text-4xl font-bold tracking-tight break-all block text-white bg-gold-text bg-clip-text text-transparent drop-shadow-sm">{formatMoney(monthlySave, currency)}</span>
                    <p className="text-gray-400 text-sm font-padauk mt-2">လတိုင်းဒီပမာဏစုဖို့လိုပါမယ်</p>
                  </div>
                  
                  {/* Foreign Currency Equivalents */}
                  {currency === 'MMK' && (
                    <div className="space-y-3 mt-6 pt-6 border-t border-gray-700/50">
                        <div className="flex items-center gap-2 mb-2">
                             <Globe size={14} className="text-[#FCD34D]"/>
                             <p className="text-xs font-bold text-[#FCD34D] uppercase tracking-wide">Or Save In Foreign Currency</p>
                        </div>
                        <div className="bg-white/5 rounded-xl p-3 border border-white/10 flex justify-between items-center hover:bg-white/10 transition-colors">
                            <span className="text-xs text-gray-400 font-medium">Thai Baht (THB)</span>
                            <p className="font-bold text-white break-all text-sm">{formatMoney(monthlySave / rates.THB, 'THB')}</p>
                        </div>
                        <div className="bg-white/5 rounded-xl p-3 border border-white/10 flex justify-between items-center hover:bg-white/10 transition-colors">
                            <span className="text-xs text-gray-400 font-medium">US Dollar (USD)</span>
                            <p className="font-bold text-white break-all text-sm">{formatMoney(monthlySave / rates.USD, 'USD')}</p>
                        </div>
                         <div className="bg-white/5 rounded-xl p-3 border border-white/10 flex justify-between items-center hover:bg-white/10 transition-colors">
                            <span className="text-xs text-gray-400 font-medium">SG Dollar (SGD)</span>
                            <p className="font-bold text-white break-all text-sm">{formatMoney(monthlySave / rates.SGD, 'SGD')}</p>
                        </div>
                        <p className="text-[10px] text-gray-500 text-center pt-2 italic">Calculated based on your App Exchange Rates</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {/* --- Tab 2: Future Value & Savings Projection --- */}
        {activeTab === 'fv' && (
          <>
            <div className="bg-gold-gradient p-8 text-[#0F172A] relative">
              <div className="flex items-center gap-3 mb-3">
                <span className="p-2 bg-[#0F172A]/10 rounded-lg"><TrendingUp size={24} className="text-[#0F172A]"/></span>
                <h2 className="text-2xl font-bold">Investment Growth (FV)</h2>
              </div>
              <p className="text-[#0F172A]/80 font-padauk text-lg font-medium">ကိုယ်ကဒီလောက်စုရင် တစ်နှစ်မှာဘယ်လောက်စုမိမလဲ?</p>
            </div>

            <div className="p-6 md:p-8">
                <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 mb-12">
                    <div className="lg:col-span-7 space-y-6">
                        <InputField label="Monthly Deposit (MMK)" value={data.monthlyDeposit} onChange={(e: any) => onUpdate({...data, monthlyDeposit: Number(e.target.value)})} suffix="MMK" />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <InputField label="Duration (Years)" value={data.fvYears} onChange={(e: any) => onUpdate({...data, fvYears: Number(e.target.value)})} suffix="Years" />
                            <InputField label="Interest Rate (%)" value={data.fvRate} onChange={(e: any) => onUpdate({...data, fvRate: Number(e.target.value)})} suffix="% / Year" />
                        </div>
                    </div>

                    <div className="lg:col-span-5">
                        <div className="h-full bg-gray-50 dark:bg-[#1E293B]/50 border-2 border-dashed border-[#D4AF37]/30 rounded-2xl p-6 flex flex-col justify-center">
                            <div className="text-center mb-6">
                                <span className="inline-block bg-[#D4AF37]/20 text-[#0F172A] dark:text-[#FCD34D] text-xs font-bold px-3 py-1 rounded-full mb-2">Future Value</span>
                                <p className="text-3xl md:text-4xl font-bold text-[#0F172A] dark:text-white mt-2 break-all">{formatMoney(futureValue, 'MMK')}</p>
                            </div>
                            <div className="space-y-3 bg-white dark:bg-[#0F172A] p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                                <div className="flex justify-between text-sm border-b border-gray-100 dark:border-gray-700 pb-2">
                                    <span className="text-gray-500 dark:text-gray-400">Total Principal</span>
                                    <span className="font-semibold text-gray-900 dark:text-gray-200 break-all pl-2">{formatMoney(data.monthlyDeposit * 12 * data.fvYears, 'MMK')}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500 dark:text-gray-400">Interest Earned</span>
                                    <span className="font-bold text-[#B45309] dark:text-[#FCD34D] break-all pl-2">+{formatMoney(futureValue - (data.monthlyDeposit * 12 * data.fvYears), 'MMK')}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Savings Milestone Projection */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-8">
                    <div className="flex items-center gap-2 mb-6">
                         <Calendar className="text-[#D4AF37]" size={20}/>
                         <h3 className="text-lg font-bold text-[#0F172A] dark:text-white">Savings Milestone Projection (If you save {new Intl.NumberFormat('en-US', {notation:"compact"}).format(data.monthlyDeposit)} monthly)</h3>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        {[
                            { label: '6 Months', m: 6 },
                            { label: '1 Year', m: 12 },
                            { label: '3 Years', m: 36 },
                            { label: '5 Years', m: 60 },
                            { label: '10 Years', m: 120 }
                        ].map((item) => {
                            const val = calculateProjection(item.m);
                            return (
                                <div key={item.label} className="bg-gray-50 dark:bg-[#1E293B] p-4 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-[#D4AF37] dark:hover:border-[#D4AF37] transition-all group">
                                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1 group-hover:text-[#D4AF37]">{item.label}</p>
                                    <p className="text-lg font-bold text-[#0F172A] dark:text-white break-all">
                                        {new Intl.NumberFormat('en-US', { notation: "compact", maximumFractionDigits: 1 }).format(val)}
                                    </p>
                                    <p className="text-[10px] text-gray-400 mt-1">{new Intl.NumberFormat('en-US').format(val)}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
          </>
        )}

        {/* --- Tab 3: Loan Calculator --- */}
        {activeTab === 'loan' && (
          <>
             <div className="bg-indigo-950 dark:bg-[#0F172A] p-8 text-white relative">
                <div className="flex items-center gap-3 mb-3">
                    <span className="p-2 bg-indigo-600 rounded-lg text-white"><Car size={24}/></span>
                    <h2 className="text-2xl font-bold">Loan Repayment Calculator</h2>
                </div>
                <p className="text-indigo-200 font-padauk text-lg">ချေးငွေယူရင် လစဉ်ဘယ်လောက်ပြန်ဆပ်ရမလဲ?</p>
             </div>

             <div className="p-6 md:p-8 grid lg:grid-cols-12 gap-8 lg:gap-12">
                <div className="lg:col-span-7 space-y-6">
                    <InputField label="Loan Amount (Principal)" value={data.loanAmount} onChange={(e: any) => onUpdate({...data, loanAmount: Number(e.target.value)})} suffix="MMK" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <InputField label="Loan Term (Years)" value={data.loanTermYears} onChange={(e: any) => onUpdate({...data, loanTermYears: Number(e.target.value)})} suffix="Years" />
                        <InputField label="Interest Rate (%)" value={data.loanRate} onChange={(e: any) => onUpdate({...data, loanRate: Number(e.target.value)})} suffix="% / Year" />
                    </div>
                </div>
                <div className="lg:col-span-5">
                    <div className="bg-indigo-50 dark:bg-[#1E293B] rounded-2xl p-6 border border-indigo-100 dark:border-gray-700 shadow-sm">
                        <h3 className="text-indigo-900 dark:text-indigo-200 font-bold text-lg mb-4">Repayment Summary</h3>
                        <div className="space-y-6">
                            <div>
                                <p className="text-sm text-indigo-600 dark:text-indigo-300 font-semibold mb-1">Monthly Payment (EMI)</p>
                                <p className="text-3xl font-bold text-indigo-950 dark:text-white break-all">{formatMoney(monthlyPayment, 'MMK')}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-indigo-200 dark:border-gray-600">
                                <div>
                                    <p className="text-xs text-indigo-500 dark:text-indigo-300 uppercase font-bold">Total Payment</p>
                                    <p className="font-semibold text-indigo-900 dark:text-gray-200 break-all text-sm">{formatMoney(monthlyPayment * data.loanTermYears * 12, 'MMK')}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-indigo-500 dark:text-indigo-300 uppercase font-bold">Total Interest</p>
                                    <p className="font-semibold text-red-500 dark:text-red-400 break-all text-sm">{formatMoney(totalInterest, 'MMK')}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
             </div>
          </>
        )}

        {/* --- Tab 4: Emergency Fund --- */}
        {activeTab === 'emergency' && (
            <>
                <div className="bg-rose-950 dark:bg-[#0F172A] p-8 text-white relative">
                    <div className="flex items-center gap-3 mb-3">
                        <span className="p-2 bg-rose-600 rounded-lg text-white"><ShieldCheck size={24}/></span>
                        <h2 className="text-2xl font-bold">Emergency Fund Calculator</h2>
                    </div>
                    <p className="text-rose-200 font-padauk text-lg">အရေးပေါ်အတွက် ဘယ်လောက်စုထားသင့်လဲ?</p>
                </div>
                
                <div className="p-6 md:p-8 grid lg:grid-cols-12 gap-8 lg:gap-12">
                    <div className="lg:col-span-7 space-y-6">
                        <InputField label="Monthly Necessary Expenses" value={data.monthlyExpense} onChange={(e: any) => onUpdate({...data, monthlyExpense: Number(e.target.value)})} suffix="MMK" />
                        <div className="space-y-2">
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Coverage Duration (Months)</label>
                            <input 
                              type="range" 
                              min="1" max="12" 
                              value={data.fundMonths} 
                              onChange={(e) => onUpdate({...data, fundMonths: Number(e.target.value)})}
                              className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-[#D4AF37]"
                            />
                            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 font-medium">
                                <span>1 Month</span>
                                <span className="text-[#0F172A] dark:text-white font-bold text-base">{data.fundMonths} Months</span>
                                <span>1 Year</span>
                            </div>
                        </div>
                        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/10 rounded-xl border border-yellow-100 dark:border-yellow-800 text-sm text-yellow-800 dark:text-yellow-200 leading-relaxed">
                            <strong>Tip:</strong> Most financial experts recommend saving 3 to 6 months of expenses. If you have unstable income, aim for 6-12 months.
                        </div>
                    </div>
                    <div className="lg:col-span-5 flex items-center">
                        <div className="w-full bg-white dark:bg-[#1E293B] border-2 border-rose-100 dark:border-rose-900/50 rounded-2xl p-6 shadow-lg text-center relative">
                             <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-rose-500 text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                                 Your Safety Net
                             </div>
                             <p className="text-gray-500 dark:text-gray-400 font-medium mt-4">Total Recommended Fund</p>
                             <p className="text-4xl font-bold text-rose-600 dark:text-rose-400 mt-2 break-all">{formatMoney(fundTotal, 'MMK')}</p>
                        </div>
                    </div>
                </div>
            </>
        )}

      </div>
    </div>
  );
};

export default Calculator;