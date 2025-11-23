import React, { useState, useEffect, useRef } from 'react';
import { Settings, Coins, Calculator, ArrowRightLeft, Save, RefreshCw, Download, Upload, AlertTriangle } from 'lucide-react';
import { MarketRates } from '../types';

interface ToolsProps {
  rates: MarketRates;
  updateRates: (newRates: MarketRates) => void;
  // Backup Props
  onExportData: () => void;
  onImportData: (file: File) => void;
}

const Tools: React.FC<ToolsProps> = ({ rates, updateRates, onExportData, onImportData }) => {
  // --- Gold Calculator State ---
  const [goldPrice, setGoldPrice] = useState<number>(rates.Gold);
  const [kyat, setKyat] = useState<number>(0);
  const [pae, setPae] = useState<number>(0);
  const [yway, setYway] = useState<number>(0);
  const [totalGoldValue, setTotalGoldValue] = useState<number>(0);

  // --- Currency Converter State ---
  const [convAmount, setConvAmount] = useState<string>('');
  const [convFrom, setConvFrom] = useState<'MMK' | 'THB' | 'USD' | 'SGD'>('THB');
  const [convTo, setConvTo] = useState<'MMK' | 'THB' | 'USD' | 'SGD'>('MMK');
  const [convResult, setConvResult] = useState<number>(0);

  // --- Local Rate State (for editing) ---
  const [localRates, setLocalRates] = useState<MarketRates>(rates);
  const [isSaved, setIsSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update local rates when props change
  useEffect(() => {
    setLocalRates(rates);
    setGoldPrice(rates.Gold);
  }, [rates]);

  // Gold Calculation
  useEffect(() => {
    // 1 Kyat Thar = 16 Pae
    // 1 Pae = 8 Yway
    // Formula: Total Kyat Fraction = Kyat + (Pae/16) + (Yway/128)
    const totalKyatThar = kyat + (pae / 16) + (yway / 128);
    setTotalGoldValue(totalKyatThar * goldPrice);
  }, [goldPrice, kyat, pae, yway]);

  // Currency Calculation
  useEffect(() => {
    const amount = parseFloat(convAmount) || 0;
    
    // Convert everything to MMK first
    let amountInMMK = 0;
    if (convFrom === 'MMK') amountInMMK = amount;
    else if (convFrom === 'THB') amountInMMK = amount * localRates.THB;
    else if (convFrom === 'USD') amountInMMK = amount * localRates.USD;
    else if (convFrom === 'SGD') amountInMMK = amount * localRates.SGD;

    // Convert MMK to Target
    let result = 0;
    if (convTo === 'MMK') result = amountInMMK;
    else if (convTo === 'THB') result = amountInMMK / localRates.THB;
    else if (convTo === 'USD') result = amountInMMK / localRates.USD;
    else if (convTo === 'SGD') result = amountInMMK / localRates.SGD;

    setConvResult(result);
  }, [convAmount, convFrom, convTo, localRates]);

  const handleSaveRates = () => {
    updateRates({ ...localRates, Gold: goldPrice });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onImportData(e.target.files[0]);
    }
  };

  const formatMoney = (val: number, curr: string) => {
    return new Intl.NumberFormat('en-US', { 
        maximumFractionDigits: 2,
        minimumFractionDigits: 0
    }).format(val) + ' ' + curr;
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-7xl mx-auto pb-12">
      
      {/* 1. App Configuration (Exchange Rates) */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-[#B38728]/20 p-6 md:p-8 relative overflow-hidden transition-colors duration-300">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gold-gradient"></div>
        <div className="flex items-center gap-3 mb-8 pb-4 border-b border-gray-100 dark:border-slate-700">
             <div className="bg-[#1E2A38] dark:bg-slate-900 p-2.5 rounded-xl text-[#FCF6BA] shadow-md shadow-black/20">
                <Settings size={22} />
             </div>
             <div>
                <h3 className="text-xl font-bold text-[#1E2A38] dark:text-[#FCF6BA]">App Exchange Rates (App Settings)</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Set these rates to ensure your Dashboard & Analytics are accurate.</p>
             </div>
        </div>

        {/* Responsive Grid for Rates Input - Fixed Cramped Layout */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
            
            {/* THB Card */}
            <div className="bg-gray-50 dark:bg-slate-900 p-5 rounded-2xl border border-gray-200 dark:border-slate-700 hover:border-[#B38728]/50 transition-colors group">
                <label className="flex items-center gap-2 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                    1 THB (Baht)
                </label>
                <div className="flex items-center bg-white dark:bg-slate-800 rounded-xl border border-gray-300 dark:border-slate-600 overflow-hidden group-focus-within:ring-2 group-focus-within:ring-[#B38728] group-focus-within:border-transparent transition-all">
                    <input 
                        type="number" 
                        value={localRates.THB}
                        onChange={(e) => setLocalRates({...localRates, THB: Number(e.target.value)})}
                        className="flex-1 p-4 bg-transparent font-bold text-xl text-[#1E2A38] dark:text-white outline-none min-w-0"
                    />
                    <span className="pr-4 font-bold text-gray-400 text-sm whitespace-nowrap">MMK</span>
                </div>
            </div>

            {/* USD Card */}
            <div className="bg-gray-50 dark:bg-slate-900 p-5 rounded-2xl border border-gray-200 dark:border-slate-700 hover:border-[#B38728]/50 transition-colors group">
                <label className="flex items-center gap-2 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                     <span className="w-2 h-2 rounded-full bg-green-500"></span>
                    1 USD (Dollar)
                </label>
                <div className="flex items-center bg-white dark:bg-slate-800 rounded-xl border border-gray-300 dark:border-slate-600 overflow-hidden group-focus-within:ring-2 group-focus-within:ring-[#B38728] group-focus-within:border-transparent transition-all">
                    <input 
                        type="number" 
                        value={localRates.USD}
                        onChange={(e) => setLocalRates({...localRates, USD: Number(e.target.value)})}
                        className="flex-1 p-4 bg-transparent font-bold text-xl text-[#1E2A38] dark:text-white outline-none min-w-0"
                    />
                    <span className="pr-4 font-bold text-gray-400 text-sm whitespace-nowrap">MMK</span>
                </div>
            </div>

            {/* SGD Card */}
            <div className="bg-gray-50 dark:bg-slate-900 p-5 rounded-2xl border border-gray-200 dark:border-slate-700 hover:border-[#B38728]/50 transition-colors group">
                <label className="flex items-center gap-2 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                     <span className="w-2 h-2 rounded-full bg-red-500"></span>
                    1 SGD (Dollar)
                </label>
                <div className="flex items-center bg-white dark:bg-slate-800 rounded-xl border border-gray-300 dark:border-slate-600 overflow-hidden group-focus-within:ring-2 group-focus-within:ring-[#B38728] group-focus-within:border-transparent transition-all">
                    <input 
                        type="number" 
                        value={localRates.SGD}
                        onChange={(e) => setLocalRates({...localRates, SGD: Number(e.target.value)})}
                        className="flex-1 p-4 bg-transparent font-bold text-xl text-[#1E2A38] dark:text-white outline-none min-w-0"
                    />
                    <span className="pr-4 font-bold text-gray-400 text-sm whitespace-nowrap">MMK</span>
                </div>
            </div>

            {/* Save Button */}
            <div className="flex items-end">
                <button 
                    onClick={handleSaveRates}
                    className={`w-full py-5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg transform active:scale-[0.98] ${
                        isSaved 
                        ? 'bg-green-600 text-white' 
                        : 'bg-[#1E2A38] text-[#FCF6BA] hover:bg-black hover:shadow-[#B38728]/30 dark:bg-gold-gradient dark:text-[#1E2A38]'
                    }`}
                >
                    {isSaved ? <span className="flex items-center gap-2">Saved!</span> : <><Save size={20}/> Update Rates</>}
                </button>
            </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
          
          {/* 2. Gold Calculator - Luxury Gradient */}
          <div className="bg-gold-gradient rounded-2xl shadow-xl text-[#1E2A38] overflow-hidden relative border border-[#B38728]/50">
             <div className="absolute top-0 right-0 p-6 opacity-20 animate-pulse">
                 <Coins size={150} />
             </div>
             
             <div className="p-6 md:p-8 relative z-10">
                <div className="flex items-center gap-3 mb-6">
                    <div className="bg-[#1E2A38] p-2.5 rounded-xl shadow-lg shadow-[#B38728]/20">
                        <Calculator size={24} className="text-[#FCF6BA]"/>
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-[#1E2A38] drop-shadow-sm">Gold Calculator</h3>
                        <p className="text-sm font-semibold text-[#1E2A38]/70">Luxury & Precision</p>
                    </div>
                </div>

                <div className="space-y-6">
                    <div>
                        <label className="block text-[#1E2A38] text-xs font-bold uppercase tracking-wider mb-2 drop-shadow-sm">Current Price (1 Kyat Thar)</label>
                        <div className="relative">
                            <input 
                                type="number"
                                value={goldPrice}
                                onChange={(e) => setGoldPrice(Number(e.target.value))}
                                className="w-full bg-white/60 border border-white/40 rounded-xl p-5 text-[#1E2A38] font-bold text-3xl placeholder-[#1E2A38]/50 focus:bg-white/80 outline-none shadow-inner"
                            />
                            <span className="absolute right-6 top-1/2 -translate-y-1/2 text-[#1E2A38] text-sm font-bold opacity-70">MMK</span>
                        </div>
                    </div>

                    <div className="bg-white/40 rounded-2xl p-6 border border-white/20 backdrop-blur-md shadow-lg">
                        <label className="block text-[#1E2A38] text-xs font-bold uppercase tracking-wider mb-4 border-b border-[#1E2A38]/10 pb-2">Enter Weight (အရွယ်အစား)</label>
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <input 
                                    type="number" min="0" 
                                    value={kyat} onChange={(e) => setKyat(Number(e.target.value))}
                                    className="w-full bg-white text-[#1E2A38] font-bold p-3 rounded-lg text-center outline-none focus:ring-2 focus:ring-[#1E2A38] shadow-sm text-lg"
                                />
                                <span className="text-xs text-[#1E2A38] font-bold text-center block mt-2">Kyat (ကျပ်)</span>
                            </div>
                            <div>
                                <input 
                                    type="number" min="0" max="15"
                                    value={pae} onChange={(e) => setPae(Number(e.target.value))}
                                    className="w-full bg-white text-[#1E2A38] font-bold p-3 rounded-lg text-center outline-none focus:ring-2 focus:ring-[#1E2A38] shadow-sm text-lg"
                                />
                                <span className="text-xs text-[#1E2A38] font-bold text-center block mt-2">Pae (ပဲ)</span>
                            </div>
                            <div>
                                <input 
                                    type="number" min="0" max="7"
                                    value={yway} onChange={(e) => setYway(Number(e.target.value))}
                                    className="w-full bg-white text-[#1E2A38] font-bold p-3 rounded-lg text-center outline-none focus:ring-2 focus:ring-[#1E2A38] shadow-sm text-lg"
                                />
                                <span className="text-xs text-[#1E2A38] font-bold text-center block mt-2">Yway (ရွေး)</span>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-[#1E2A38]/10">
                        <p className="text-[#1E2A38]/80 text-sm mb-1 font-bold uppercase">Estimated Value</p>
                        <p className="text-5xl font-bold tracking-tight break-all text-[#1E2A38] drop-shadow-sm">
                            {formatMoney(totalGoldValue, 'MMK')}
                        </p>
                    </div>
                </div>
             </div>
          </div>

          {/* 3. Currency Converter - Dark Mode Supported */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-gray-100 dark:border-slate-700 overflow-hidden flex flex-col transition-colors duration-300">
             <div className="bg-[#1E2A38] dark:bg-slate-900 p-6 text-white flex items-center justify-between relative overflow-hidden">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-[#B38728] rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 opacity-20 pointer-events-none"></div>
                <div className="flex items-center gap-3 relative z-10">
                    <div className="bg-gold-gradient p-2.5 rounded-lg shadow-lg">
                        <RefreshCw size={24} className="text-[#1E2A38]"/>
                    </div>
                    <h3 className="text-xl font-bold bg-gold-text bg-clip-text text-transparent">Converter</h3>
                </div>
             </div>

             <div className="p-6 md:p-8 flex-1 flex flex-col justify-center space-y-8">
                <div className="relative">
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">From</label>
                    <div className="flex rounded-xl border border-gray-200 dark:border-slate-600 overflow-hidden focus-within:ring-2 focus-within:ring-[#B38728] transition-all bg-gray-50 dark:bg-slate-900">
                        <input 
                            type="number" 
                            value={convAmount}
                            onChange={(e) => setConvAmount(e.target.value)}
                            placeholder="Amount"
                            className="flex-1 p-5 bg-transparent text-2xl font-bold text-gray-900 dark:text-white outline-none placeholder-gray-400 min-w-0"
                        />
                        <select 
                            value={convFrom}
                            onChange={(e) => setConvFrom(e.target.value as any)}
                            className="bg-gray-100 dark:bg-slate-800 border-l border-gray-200 dark:border-slate-600 px-4 font-bold text-gray-700 dark:text-gray-200 outline-none cursor-pointer hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
                        >
                            <option value="MMK">MMK</option>
                            <option value="THB">THB</option>
                            <option value="USD">USD</option>
                            <option value="SGD">SGD</option>
                        </select>
                    </div>
                </div>

                <div className="flex justify-center -my-4 relative z-10">
                    <button 
                        onClick={() => {
                            const temp = convFrom;
                            setConvFrom(convTo);
                            setConvTo(temp);
                        }}
                        className="bg-[#1E2A38] dark:bg-gold-gradient text-[#FCF6BA] dark:text-[#1E2A38] p-4 rounded-full shadow-lg hover:scale-110 transition-transform ring-4 ring-white dark:ring-slate-800"
                    >
                        <ArrowRightLeft size={24} className="rotate-90" />
                    </button>
                </div>

                <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">To</label>
                    <div className="flex rounded-xl border border-gray-200 dark:border-slate-600 overflow-hidden bg-gray-50 dark:bg-slate-900">
                        <div className="flex-1 p-5 text-3xl font-bold text-[#1E2A38] dark:text-[#FCF6BA] break-all flex items-center">
                            {new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(convResult)}
                        </div>
                        <select 
                            value={convTo}
                            onChange={(e) => setConvTo(e.target.value as any)}
                            className="bg-gray-100 dark:bg-slate-800 border-l border-gray-200 dark:border-slate-600 px-4 font-bold text-gray-700 dark:text-gray-200 outline-none cursor-pointer hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
                        >
                            <option value="MMK">MMK</option>
                            <option value="THB">THB</option>
                            <option value="USD">USD</option>
                            <option value="SGD">SGD</option>
                        </select>
                    </div>
                </div>

                <div className="text-center text-xs text-gray-400">
                    Calculated using your App Exchange Rates.
                </div>
             </div>
          </div>
      </div>
      
      {/* 4. Data Management (Backup/Restore) */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-gray-100 dark:border-slate-700 p-8">
         <h3 className="text-xl font-bold text-[#1E2A38] dark:text-white mb-6">Data Management & Backup</h3>
         <div className="flex flex-col md:flex-row gap-6">
            <button 
                onClick={onExportData}
                className="flex-1 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-6 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-all text-left group"
            >
                <div className="flex items-center gap-3 mb-2">
                    <Download className="text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform" />
                    <span className="font-bold text-blue-900 dark:text-blue-200">Backup Data (Download)</span>
                </div>
                <p className="text-xs text-blue-700 dark:text-blue-300">Save all your transactions, rates, and calculator data to a file.</p>
            </button>
            
            <label className="flex-1 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 p-6 rounded-xl hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-all text-left group cursor-pointer">
                <div className="flex items-center gap-3 mb-2">
                    <Upload className="text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform" />
                    <span className="font-bold text-purple-900 dark:text-purple-200">Restore Data (Upload)</span>
                </div>
                <p className="text-xs text-purple-700 dark:text-purple-300">Load a previously saved backup file. This will replace current data.</p>
                <input 
                    type="file" 
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".json"
                    className="hidden"
                />
            </label>
         </div>
      </div>
    </div>
  );
};

export default Tools;