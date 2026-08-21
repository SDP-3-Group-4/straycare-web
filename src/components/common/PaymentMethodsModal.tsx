import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  CreditCard, Smartphone, Building2, Plus, Trash2, CheckCircle2,
  X, Check, Loader2, ShieldCheck, AlertCircle, Receipt, ArrowRight,
  ExternalLink, Sparkles, ChevronRight
} from 'lucide-react';
import {
  getSavedPaymentMethods,
  savePaymentMethod,
  deletePaymentMethod,
  setDefaultPaymentMethod,
  getPaymentHistory,
  type SavedPaymentMethod,
  type PaymentMethodType,
} from '../../services/payments';

interface PaymentMethodsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PaymentMethodsModal({ isOpen, onClose }: PaymentMethodsModalProps) {
  const [activeTab, setActiveTab] = useState<'methods' | 'history'>('methods');
  const [methods, setMethods] = useState<SavedPaymentMethod[]>(getSavedPaymentMethods());
  const [history] = useState(getPaymentHistory());
  const [showAddForm, setShowAddForm] = useState(false);

  // Form states
  const [gatewayType, setGatewayType] = useState<PaymentMethodType>('bkash');
  const [accountHolder, setAccountHolder] = useState('');
  const [phoneOrCardNumber, setPhoneOrCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [bankName, setBankName] = useState('');
  const [isDefaultNew, setIsDefaultNew] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState<'input' | 'otp' | 'success'>('input');
  const [simulatedOtp, setSimulatedOtp] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const handleUpdate = (e: any) => {
      if (e.detail) setMethods(e.detail);
    };
    window.addEventListener('straycare:payment-methods-updated', handleUpdate);
    return () => window.removeEventListener('straycare:payment-methods-updated', handleUpdate);
  }, []);

  if (!isOpen) return null;

  const handleStartAdd = () => {
    setGatewayType('bkash');
    setAccountHolder('');
    setPhoneOrCardNumber('');
    setExpiry('');
    setCvv('');
    setBankName('');
    setIsDefaultNew(methods.length === 0);
    setStep('input');
    setErrorMessage(null);
    setShowAddForm(true);
  };

  const handleProcessGateway = () => {
    setErrorMessage(null);
    if (!accountHolder.trim()) {
      setErrorMessage('Please enter the account or cardholder name.');
      return;
    }
    if (!phoneOrCardNumber.trim()) {
      setErrorMessage('Please enter the account number or card number.');
      return;
    }

    if (gatewayType === 'card') {
      if (!expiry || !cvv) {
        setErrorMessage('Please enter expiry date and CVV.');
        return;
      }
    }

    setIsProcessing(true);

    // Simulate Payment Gateway Handshake (SSLCommerz / bKash Direct PGW API)
    setTimeout(() => {
      setIsProcessing(false);
      if (['bkash', 'nagad', 'rocket'].includes(gatewayType)) {
        const testOtp = Math.floor(100000 + Math.random() * 900000).toString();
        setSimulatedOtp(testOtp);
        setOtpInput('');
        setStep('otp');
      } else {
        // Complete card/bank addition directly
        finishSaveMethod();
      }
    }, 1200);
  };

  const handleVerifyOtp = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      finishSaveMethod();
    }, 1000);
  };

  const finishSaveMethod = () => {
    let title = '';
    let identifier = '';
    let cardBrand: 'visa' | 'mastercard' | undefined = undefined;

    if (gatewayType === 'bkash') {
      title = 'bKash Account';
      identifier = phoneOrCardNumber.replace(/(\d{3})\d{4}(\d{4})/, '$1••••$2');
    } else if (gatewayType === 'nagad') {
      title = 'Nagad Account';
      identifier = phoneOrCardNumber.replace(/(\d{3})\d{4}(\d{4})/, '$1••••$2');
    } else if (gatewayType === 'rocket') {
      title = 'Rocket Account';
      identifier = phoneOrCardNumber.replace(/(\d{3})\d{4}(\d{4})/, '$1••••$2');
    } else if (gatewayType === 'card') {
      cardBrand = phoneOrCardNumber.startsWith('5') ? 'mastercard' : 'visa';
      title = `${cardBrand === 'visa' ? 'Visa' : 'Mastercard'} Card`;
      const last4 = phoneOrCardNumber.replace(/\s/g, '').slice(-4) || '4242';
      identifier = `•••• •••• •••• ${last4}`;
    } else {
      title = `${bankName || 'Bank'} Direct Wire`;
      identifier = `Acct: ••••${phoneOrCardNumber.slice(-4)}`;
    }

    const updated = savePaymentMethod({
      type: gatewayType,
      title,
      identifier,
      accountHolder: accountHolder.trim(),
      isDefault: isDefaultNew || methods.length === 0,
      expiry: gatewayType === 'card' ? expiry : undefined,
      cardBrand,
    });

    setMethods(updated);
    setStep('success');
    setTimeout(() => {
      setShowAddForm(false);
      setStep('input');
    }, 1500);
  };

  const handleDelete = (id: string) => {
    const updated = deletePaymentMethod(id);
    setMethods(updated);
  };

  const handleSetDefault = (id: string) => {
    const updated = setDefaultPaymentMethod(id);
    setMethods(updated);
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-xs" onClick={onClose} />
      <div className="relative bg-white rounded-3xl w-full max-w-lg overflow-hidden flex flex-col border border-[var(--sc-border)] shadow-2xl animate-in zoom-in-95 duration-200 max-h-[88vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[var(--sc-border)] bg-gray-50/70">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-50 text-[var(--sc-brand-600)]">
              <CreditCard size={18} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[var(--sc-text-primary)]">
                Payment Methods & Wallet
              </h2>
              <span className="text-[11px] text-gray-500">Secure gateway for medical crowd-funding & donations</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 bg-white hover:bg-gray-100 p-2 rounded-full transition-colors border border-[var(--sc-border)]"
          >
            <X size={17} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-[var(--sc-border)] bg-gray-50/50 px-4 pt-2 gap-2">
          <button
            onClick={() => { setActiveTab('methods'); setShowAddForm(false); }}
            className={`pb-2.5 px-3 text-xs font-bold transition-all border-b-2 ${
              activeTab === 'methods'
                ? 'border-[var(--sc-brand-600)] text-[var(--sc-brand-600)]'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            Saved Methods ({methods.length})
          </button>
          <button
            onClick={() => { setActiveTab('history'); setShowAddForm(false); }}
            className={`pb-2.5 px-3 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 ${
              activeTab === 'history'
                ? 'border-[var(--sc-brand-600)] text-[var(--sc-brand-600)]'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <Receipt size={13} /> Donation History
          </button>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex flex-col gap-4">
          
          {/* TAB 1: SAVED METHODS & ADD FLOW */}
          {activeTab === 'methods' && (
            <>
              {showAddForm ? (
                /* ADD NEW PAYMENT METHOD FORM */
                <div className="flex flex-col gap-4 animate-in fade-in duration-200">
                  
                  {step === 'input' && (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[var(--sc-text-primary)] uppercase tracking-wider">
                          Select Gateway Type
                        </span>
                        <button
                          onClick={() => setShowAddForm(false)}
                          className="text-xs font-bold text-gray-500 hover:text-gray-800"
                        >
                          Cancel
                        </button>
                      </div>

                      {/* Gateway Type Selector */}
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() => setGatewayType('bkash')}
                          className={`p-3 rounded-2xl border text-center flex flex-col items-center gap-1.5 transition-all ${
                            gatewayType === 'bkash'
                              ? 'border-pink-500 bg-pink-50 text-pink-700 font-bold ring-2 ring-pink-200'
                              : 'border-[var(--sc-border)] bg-gray-50 hover:bg-gray-100 text-gray-700'
                          }`}
                        >
                          <Smartphone size={18} className="text-pink-600" />
                          <span className="text-xs">bKash</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setGatewayType('nagad')}
                          className={`p-3 rounded-2xl border text-center flex flex-col items-center gap-1.5 transition-all ${
                            gatewayType === 'nagad'
                              ? 'border-orange-500 bg-orange-50 text-orange-700 font-bold ring-2 ring-orange-200'
                              : 'border-[var(--sc-border)] bg-gray-50 hover:bg-gray-100 text-gray-700'
                          }`}
                        >
                          <Smartphone size={18} className="text-orange-600" />
                          <span className="text-xs">Nagad</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setGatewayType('card')}
                          className={`p-3 rounded-2xl border text-center flex flex-col items-center gap-1.5 transition-all ${
                            gatewayType === 'card'
                              ? 'border-blue-500 bg-blue-50 text-blue-700 font-bold ring-2 ring-blue-200'
                              : 'border-[var(--sc-border)] bg-gray-50 hover:bg-gray-100 text-gray-700'
                          }`}
                        >
                          <CreditCard size={18} className="text-blue-600" />
                          <span className="text-xs">Card / Visa</span>
                        </button>
                      </div>

                      {errorMessage && (
                        <div className="p-2.5 bg-red-50 text-red-600 text-xs rounded-xl flex items-center gap-2 border border-red-200">
                          <AlertCircle size={14} className="shrink-0" />
                          <span>{errorMessage}</span>
                        </div>
                      )}

                      {/* Fields */}
                      <div className="flex flex-col gap-3">
                        <div>
                          <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                            Account Holder Name
                          </label>
                          <input
                            type="text"
                            value={accountHolder}
                            onChange={(e) => setAccountHolder(e.target.value)}
                            placeholder="e.g. Shopnil Karmakar"
                            className="w-full px-3.5 py-2.5 bg-gray-50 border border-[var(--sc-border)] rounded-xl text-xs sm:text-sm font-medium outline-none focus:border-[var(--sc-brand-400)] focus:bg-white transition-all"
                          />
                        </div>

                        <div>
                          <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                            {['bkash', 'nagad', 'rocket'].includes(gatewayType) ? 'Mobile Number' : 'Card Number'}
                          </label>
                          <input
                            type="text"
                            value={phoneOrCardNumber}
                            onChange={(e) => setPhoneOrCardNumber(e.target.value)}
                            placeholder={['bkash', 'nagad', 'rocket'].includes(gatewayType) ? '01712345678' : '4242 •••• •••• 4242'}
                            className="w-full px-3.5 py-2.5 bg-gray-50 border border-[var(--sc-border)] rounded-xl text-xs sm:text-sm font-medium outline-none focus:border-[var(--sc-brand-400)] focus:bg-white transition-all"
                          />
                        </div>

                        {gatewayType === 'card' && (
                          <div className="grid grid-cols-2 gap-2.5">
                            <div>
                              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                                Expiration Date
                              </label>
                              <input
                                type="text"
                                value={expiry}
                                onChange={(e) => setExpiry(e.target.value)}
                                placeholder="MM/YY"
                                maxLength={5}
                                className="w-full px-3.5 py-2.5 bg-gray-50 border border-[var(--sc-border)] rounded-xl text-xs sm:text-sm font-medium outline-none focus:border-[var(--sc-brand-400)] focus:bg-white transition-all"
                              />
                            </div>
                            <div>
                              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                                CVV Code
                              </label>
                              <input
                                type="password"
                                value={cvv}
                                onChange={(e) => setCvv(e.target.value)}
                                placeholder="•••"
                                maxLength={4}
                                className="w-full px-3.5 py-2.5 bg-gray-50 border border-[var(--sc-border)] rounded-xl text-xs sm:text-sm font-medium outline-none focus:border-[var(--sc-brand-400)] focus:bg-white transition-all"
                              />
                            </div>
                          </div>
                        )}

                        <label className="flex items-center gap-2 cursor-pointer pt-1">
                          <input
                            type="checkbox"
                            checked={isDefaultNew}
                            onChange={(e) => setIsDefaultNew(e.target.checked)}
                            className="rounded text-[var(--sc-brand-600)] focus:ring-[var(--sc-brand-400)]"
                          />
                          <span className="text-xs text-gray-600">Set as primary payment method for donations</span>
                        </label>
                      </div>

                      <button
                        onClick={handleProcessGateway}
                        disabled={isProcessing}
                        className="w-full py-3 font-bold text-white bg-[var(--sc-brand-600)] hover:bg-[var(--sc-brand-700)] rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 text-xs sm:text-sm"
                      >
                        {isProcessing ? (
                          <>
                            <Loader2 size={16} className="animate-spin" /> Verifying Gateway...
                          </>
                        ) : (
                          <>
                            <ShieldCheck size={16} /> Save Payment Method
                          </>
                        )}
                      </button>
                    </>
                  )}

                  {/* OTP Simulator Step for Mobile Banking */}
                  {step === 'otp' && (
                    <div className="flex flex-col items-center text-center gap-3 p-3">
                      <div className="w-12 h-12 rounded-full bg-purple-100 text-[var(--sc-brand-600)] flex items-center justify-center">
                        <Smartphone size={22} />
                      </div>
                      <h4 className="font-bold text-sm text-[var(--sc-text-primary)]">Verify Mobile Banking</h4>
                      <p className="text-xs text-gray-500">
                        Enter the verification code sent to <strong>{phoneOrCardNumber}</strong>
                      </p>
                      
                      <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-800 font-mono">
                        Demo Test Code: <strong>{simulatedOtp}</strong>
                      </div>

                      <input
                        type="text"
                        value={otpInput}
                        onChange={(e) => setOtpInput(e.target.value)}
                        placeholder="Enter 6-digit OTP"
                        maxLength={6}
                        className="text-center font-mono text-lg tracking-widest px-4 py-2 border rounded-xl w-48 bg-gray-50 outline-none focus:border-[var(--sc-brand-400)]"
                      />

                      <button
                        onClick={handleVerifyOtp}
                        disabled={isProcessing}
                        className="w-full py-2.5 font-bold text-white bg-[var(--sc-brand-600)] hover:bg-[var(--sc-brand-700)] rounded-xl transition-all shadow-xs text-xs flex items-center justify-center gap-2"
                      >
                        {isProcessing ? <Loader2 size={15} className="animate-spin" /> : 'Confirm & Link Account'}
                      </button>
                    </div>
                  )}

                  {/* Success Step */}
                  {step === 'success' && (
                    <div className="flex flex-col items-center text-center gap-2 py-6">
                      <div className="w-14 h-14 rounded-full bg-green-100 text-green-600 flex items-center justify-center animate-in zoom-in-95">
                        <Check size={28} />
                      </div>
                      <h4 className="font-bold text-sm text-green-800">Payment Method Linked</h4>
                      <p className="text-xs text-gray-500">Your account is ready for 1-click rescue contributions.</p>
                    </div>
                  )}

                </div>
              ) : (
                /* SAVED METHODS LIST */
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Active Payment Methods
                    </span>
                    <button
                      onClick={handleStartAdd}
                      className="flex items-center gap-1 text-xs font-bold text-[var(--sc-brand-600)] hover:text-[var(--sc-brand-700)] bg-[var(--sc-brand-50)] hover:bg-[var(--sc-brand-100)] px-3 py-1.5 rounded-xl transition-all"
                    >
                      <Plus size={14} /> Add Method
                    </button>
                  </div>

                  {methods.length > 0 ? (
                    <div className="flex flex-col gap-2.5">
                      {methods.map((pm) => (
                        <div
                          key={pm.id}
                          className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                            pm.isDefault
                              ? 'bg-purple-50/40 border-[var(--sc-brand-200)] shadow-xs'
                              : 'bg-white border-[var(--sc-border)] hover:bg-gray-50/70'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={`p-2.5 rounded-xl shrink-0 ${
                              pm.type === 'bkash'
                                ? 'bg-pink-100 text-pink-600'
                                : pm.type === 'nagad'
                                ? 'bg-orange-100 text-orange-600'
                                : 'bg-blue-100 text-blue-600'
                            }`}>
                              {['bkash', 'nagad', 'rocket'].includes(pm.type) ? <Smartphone size={18} /> : <CreditCard size={18} />}
                            </div>

                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-xs sm:text-sm text-[var(--sc-text-primary)] truncate">
                                  {pm.title}
                                </span>
                                {pm.isDefault && (
                                  <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold rounded-md">
                                    Primary
                                  </span>
                                )}
                              </div>
                              <span className="text-xs text-gray-500 font-mono block truncate mt-0.5">
                                {pm.identifier}
                              </span>
                              <span className="text-[11px] text-gray-400 block truncate">
                                {pm.accountHolder}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {!pm.isDefault && (
                              <button
                                onClick={() => handleSetDefault(pm.id)}
                                className="text-[11px] font-bold text-[var(--sc-brand-600)] hover:bg-[var(--sc-brand-50)] px-2.5 py-1 rounded-lg border border-[var(--sc-brand-200)] transition-colors"
                              >
                                Set Primary
                              </button>
                            )}
                            <button
                              onClick={() => handleDelete(pm.id)}
                              className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                              title="Delete method"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center bg-gray-50 rounded-2xl border border-[var(--sc-border)] flex flex-col items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-gray-400 mb-2 border border-gray-200">
                        <CreditCard size={20} />
                      </div>
                      <span className="font-bold text-xs text-gray-700">No Payment Methods</span>
                      <span className="text-[11px] text-gray-400 mt-0.5 mb-3">
                        Link a bKash, Nagad, or Debit card for instant rescue crowd-support.
                      </span>
                      <button
                        onClick={handleStartAdd}
                        className="px-4 py-2 bg-[var(--sc-brand-600)] text-white text-xs font-bold rounded-xl shadow-xs"
                      >
                        Add First Payment Method
                      </button>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* TAB 2: DONATION INVOICES & HISTORY */}
          {activeTab === 'history' && (
            <div className="flex flex-col gap-3">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Recent Contributions & Invoices
              </span>

              <div className="flex flex-col gap-2.5">
                {history.map((tx) => (
                  <div
                    key={tx.id}
                    className="p-3.5 bg-gray-50 rounded-2xl border border-[var(--sc-border)] flex flex-col gap-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-[var(--sc-text-primary)] line-clamp-1">
                        {tx.campaignTitle}
                      </span>
                      <span className="font-bold text-xs text-green-700 bg-green-50 px-2 py-0.5 rounded-md">
                        {tx.currency}{tx.amount}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-gray-400">
                      <span>{tx.date} · {tx.methodTitle}</span>
                      <span className="font-mono text-gray-500">{tx.transactionRef}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[var(--sc-border)] bg-gray-50/50 flex items-center justify-between">
          <div className="flex items-center gap-1 text-[11px] text-gray-400">
            <ShieldCheck size={14} className="text-green-600" />
            <span>256-bit Encrypted & PCI-DSS Compliant</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 font-bold text-gray-700 bg-white hover:bg-gray-100 border border-[var(--sc-border)] rounded-xl transition-all text-xs"
          >
            Close
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
}
