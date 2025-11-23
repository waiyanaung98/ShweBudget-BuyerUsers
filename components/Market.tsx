import React, { useState, useEffect } from 'react';
import { Coins, TrendingUp, RefreshCw, Calculator, ArrowRightLeft, DollarSign, Banknote } from 'lucide-react';
import { MarketRates } from '../types';

interface MarketProps {
  rates: MarketRates;
  updateRates: (newRates: MarketRates) => void;
}

const Market: React.FC<MarketProps> = ({ rates, updateRates }) => {
  // Local state for calculator
  const [calcAmount, setCalcAmount] = useState<string>('1000');
  const [calcFrom, setCalcFrom] = useState<'THB' | 'USD' | 'MMK'>('THB');
  const [calcResult, setCalcResult] = useState<number>(0);

  // Effect to update calculator when inputs change
  useEffect(() => {
    const amount = parseFloat(calcAmount) || 0;
    let res = 0;

    if (calcFrom === 'THB') {
      res = amount * rates.THB;
    } else if (calcFrom === 'USD') {
      res = amount * rates.USD;
    } else {
      // From MMK to others? For now assume Calculate TO MMK
      res = amount; 
    }
    setCalcResult(res);
  }, [calcAmount, calcFrom, rates]);

  const handleRateChange = (key: keyof MarketRates, value: string) => {
    updateRates({
      ...rates,
      [key]: parseFloat(value) || 0
    });
  };

  const formatMMK = (val: number) => new Intl.NumberFormat('en-US').format(val);

  return (
    <div className="space-y-8 animate-fade-in max-w-7xl mx-auto">
      
      {/* Market Rates Configuration */}
      <div className="grid md:grid-cols-2 gap-6">
        
        {/* Currency Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 relative overflow-hidden">
           <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
              <Banknote size={100} />
           </div>
           <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
                   <ArrowRightLeft size={24} />
                </div>
                <div>
                   <h3 className="text-lg font-bold text-[#1E2A38]">Market Exchange Rates</h3>
                   <p className="text-xs text-gray-500">Update daily for accurate calculations</p>
                </div>
              </div>
              <div className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full animate-pulse">
                Live Edit
              </div>
           </div>

           <div className="space-y-5">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
                 <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-xs">THB</div>
                    <span className="font-semibold text-gray-700">1 Thai Baht</span>
                 </div>
                 <div className="flex items-center gap-2">
                    <span className="text-gray-400 font-medium text-sm">=</span>
                    <input 
                      type="number" 
                      value={rates.THB}
                      onChange={(e) => handleRateChange('THB', e.target.value)}
                      className="w-24 text-right p-2 bg-white border border-gray-300 rounded-lg font-bold text-[#1E2A38] focus:ring-2 focus:ring-[#31d190] outline-none"
                    />
                    <span className="text-xs font-bold text-gray-500">MMK</span>
                 </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
                 <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center font-bold text-xs">USD</div>
                    <span className="font-semibold text-gray-700">1 US Dollar</span>
                 </div>
                 <div className="flex items-center gap-2">
                    <span className="text-gray-400 font-medium text-sm">=</span>
                    <input 
                      type="number" 
                      value={rates.USD}
                      onChange={(e) => handleRateChange('USD', e.target.value)}
                      className="w-24 text-right p-2 bg-white border border-gray-300 rounded-lg font-bold text-[#1E2A38] focus:ring-2 focus:ring-[#31d190] outline-none"
                    />
                    <span className="text-xs font-bold text-gray-500">MMK</span>
                 </div>
              </div>
           </div>
        </div>

        {/* Gold Price Card */}
        <div className="bg-[#1E2A38] rounded-2xl shadow-lg border border-gray-800 p-6 text-white relative overflow-hidden">
           <div className="absolute -right-5 -bottom-5 text-yellow-500/10">
              <Coins size={150} />
           </div>
           <div className="flex items-center gap-3 mb-6 relative z-10">
              <div className="bg-yellow-500/20 p-2 rounded-lg text-yellow-400">
                 <Coins size={24} />
              </div>
              <div>
                 <h3 className="text-lg font-bold text-white">Myanmar Gold Price</h3>
                 <p className="text-xs text-gray-400">Academy / Fire Gold (အခေါက်ရွှေ)</p>
              </div>
           </div>

           <div className="space-y-6 relative z-10">
              <div>
                <label className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-2 block">1 Kyat Thar Price (MMK)</label>
                <div className="relative">
                    <input 
                      type="number"
                      value={rates.Gold}
                      onChange={(e) => handleRateChange('Gold', e.target.value)}
                      className="w-full bg-white/10 border border-white/20 rounded-xl p-4 text-2xl font-bold text-yellow-400 focus:bg-white/20 outline-none transition-all"
                    />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div className="bg-white/5 p-3 rounded-xl border border-white/10">
                    <span className="text-xs text-gray-400 block mb-1">8 Pe (၁ မတ်သား)</span>
                    <span className="font-bold text-lg">{formatMMK(rates.Gold / 2)}</span>
                 </div>
                 <div className="bg-white/5 p-3 rounded-xl border border-white/10">
                    <span className="text-xs text-gray-400 block mb-1">4 Pe (၁ မူးသား)</span>
                    <span className="font-bold text-lg">{formatMMK(rates.Gold / 4)}</span>
                 </div>
                 <div className="bg-white/5 p-3 rounded-xl border border-white/10">
                    <span className="text-xs text-gray-400 block mb-1">2 Pe (၁ ပဲသား)</span>
                    <span className="font-bold text-lg">{formatMMK(rates.Gold / 8)}</span>
                 </div>
                 <div className="bg-white/5 p-3 rounded-xl border border-white/10">
                    <span className="text-xs text-gray-400 block mb-1">1 Pe (၁ ရွေးသား)</span>
                    <span className="font-bold text-lg">{formatMMK(rates.Gold / 16)}</span>
                 </div>
              </div>
           </div>
        </div>
      </div>

      {/* Remittance Calculator */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl shadow-xl text-white p-6 md:p-10">
         <div className="flex items-center gap-3 mb-6 border-b border-white/20 pb-4">
            <Calculator className="text-blue-200" />
            <h3 className="text-2xl font-bold">Remittance Calculator (ငွေလွှဲတွက်ချက်ရန်)</h3>
         </div>

         <div className="flex flex-col lg:flex-row gap-8 items-center">
            <div className="flex-1 w-full space-y-4">
               <div>
                  <label className="block text-sm font-medium text-blue-100 mb-1">Amount to Send / Sell</label>
                  <div className="flex bg-white rounded-xl overflow-hidden">
                     <input 
                        type="number"
                        value={calcAmount}
                        onChange={(e) => setCalcAmount(e.target.value)}
                        className="flex-1 p-4 text-gray-900 font-bold text-xl outline-none min-w-0"
                        placeholder="Enter amount"
                     />
                     <select 
                        value={calcFrom}
                        onChange={(e) => setCalcFrom(e.target.value as any)}
                        className="bg-gray-100 text-gray-900 font-bold border-l px-4 outline-none cursor-pointer hover:bg-gray-200"
                     >
                        <option value="THB">THB</option>
                        <option value="USD">USD</option>
                     </select>
                  </div>
               </div>
               
               <div className="flex justify-center lg:justify-start">
                   <div className="bg-white/20 p-2 rounded-full">
                      <ArrowRightLeft className="text-white rotate-90 lg:rotate-0" />
                   </div>
               </div>

               <div>
                  <label className="block text-sm font-medium text-blue-100 mb-1">You will get (MMK)</label>
                  <div className="bg-white/20 border border-white/30 rounded-xl p-4">
                      <span className="text-3xl font-bold text-white break-all">
                        {formatMMK(calcResult)} <span className="text-base font-normal text-blue-200">MMK</span>
                      </span>
                  </div>
                  <p className="text-xs text-blue-200 mt-2 text-right">
                    * Calculated using your set rate: 1 {calcFrom} = {formatMMK(calcFrom === 'THB' ? rates.THB : rates.USD)} MMK
                  </p>
               </div>
            </div>

            <div className="lg:w-80 bg-white/10 rounded-xl p-6 backdrop-blur-sm border border-white/10">
               <h4 className="font-bold text-lg mb-4">Quick Cheat Sheet</h4>
               <div className="space-y-3 text-sm">
                  <div className="flex justify-between pb-2 border-b border-white/10">
                     <span>1,000 {calcFrom}</span>
                     <span className="font-bold">{formatMMK((calcFrom === 'THB' ? rates.THB : rates.USD) * 1000)}</span>
                  </div>
                  <div className="flex justify-between pb-2 border-b border-white/10">
                     <span>5,000 {calcFrom}</span>
                     <span className="font-bold">{formatMMK((calcFrom === 'THB' ? rates.THB : rates.USD) * 5000)}</span>
                  </div>
                  <div className="flex justify-between pb-2 border-b border-white/10">
                     <span>10,000 {calcFrom}</span>
                     <span className="font-bold">{formatMMK((calcFrom === 'THB' ? rates.THB : rates.USD) * 10000)}</span>
                  </div>
                  <div className="flex justify-between">
                     <span>100,000 {calcFrom}</span>
                     <span className="font-bold">{formatMMK((calcFrom === 'THB' ? rates.THB : rates.USD) * 100000)}</span>
                  </div>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
};

export default Market;