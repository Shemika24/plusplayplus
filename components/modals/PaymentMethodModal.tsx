

import React, { useState, useMemo, useRef, useEffect } from 'react';
import Modal from '../Modal';
import { PaymentDetails } from '../../types';

interface PaymentMethodModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentDetails?: PaymentDetails[]; // Received as array now
    onSave: (details: PaymentDetails[]) => Promise<void>;
}

type PaymentMethodType = 'PayPal' | 'Payeer' | 'Payoneer' | 'Airtm' | 'Crypto';

interface MethodConfig {
    name: PaymentMethodType;
    icon: string | React.ReactNode;
    placeholder: string;
    colors: {
        icon: string;
        bg: string;
        border: string;
    };
}

interface CryptoDetails {
    id: string;
    name: string;
    placeholder: string;
}

const cryptocurrencies: CryptoDetails[] = [
    { id: 'TRX', name: 'Tron (TRX)', placeholder: 'Enter your Tron (TRX) address' },
    { id: 'LTC', name: 'Litecoin (LTC)', placeholder: 'Enter your Litecoin (LTC) address' },
    { id: 'BNB', name: 'BNB Smart Chain', placeholder: 'Enter your BNB (BEP20) address' },
    { id: 'USDT_TRC20', name: 'Tether (TRC20)', placeholder: 'Enter your Tether (TRC20) address' },
];

const paymentMethods: MethodConfig[] = [
    { name: 'PayPal', icon: 'fa-brands fa-paypal', placeholder: 'Enter your PayPal email', colors: { icon: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' } },
    { name: 'Payeer', icon: 'fa-solid fa-p', placeholder: 'Enter your Payeer ID (P1...)', colors: { icon: 'text-sky-600', bg: 'bg-sky-50', border: 'border-sky-100' } },
    { name: 'Payoneer', icon: 'fa-brands fa-cc-mastercard', placeholder: 'Enter your Payoneer email', colors: { icon: 'text-red-600', bg: 'bg-red-50', border: 'border-red-100' } },
    { name: 'Airtm', icon: 'fa-solid fa-cloud', placeholder: 'Enter your Airtm email', colors: { icon: 'text-teal-600', bg: 'bg-teal-50', border: 'border-teal-100' } },
    { name: 'Crypto', icon: 'fa-solid fa-coins', placeholder: 'Enter your Crypto Wallet Address', colors: { icon: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-100' } },
];

const PaymentMethodModal: React.FC<PaymentMethodModalProps> = ({ isOpen, onClose, currentDetails = [], onSave }) => {
    const [expandedMethod, setExpandedMethod] = useState<PaymentMethodType | null>(null);
    
    // Form State
    const [detailInput, setDetailInput] = useState('');
    const [selectedCrypto, setSelectedCrypto] = useState<CryptoDetails | null>(null);
    const [isCryptoDropdownOpen, setIsCryptoDropdownOpen] = useState(false);
    
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsCryptoDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleMethodClick = (method: PaymentMethodType) => {
        if (expandedMethod === method) {
            setExpandedMethod(null);
            setDetailInput('');
            setSelectedCrypto(null);
            setError('');
            setSuccessMsg('');
            return;
        }

        setExpandedMethod(method);
        setError('');
        setSuccessMsg('');

        // Try to find existing detail for this method to pre-fill
        // For Crypto, it's tricky because user can have multiple cryptos. 
        // For simplicity in this UI, we will pre-fill if they have ONE crypto saved, or empty if none/multiple.
        // For others (PayPal), just find the entry.
        
        if (method === 'Crypto') {
            const existingCrypto = currentDetails.find(d => d.method === 'Crypto');
            if (existingCrypto) {
                setDetailInput(existingCrypto.detail);
                const cryptoObj = cryptocurrencies.find(c => c.name === existingCrypto.cryptoName);
                if (cryptoObj) setSelectedCrypto(cryptoObj);
            } else {
                setDetailInput('');
                setSelectedCrypto(null);
            }
        } else {
            const existing = currentDetails.find(d => d.method === method);
            setDetailInput(existing ? existing.detail : '');
        }
    };

    const handleSaveMethod = async () => {
        if (!expandedMethod) return;

        setError('');
        setSuccessMsg('');

        if (expandedMethod === 'Crypto' && !selectedCrypto) {
            setError('Please select a cryptocurrency.');
            return;
        }
        if (!detailInput.trim()) {
            setError('Please enter your payment details.');
            return;
        }

        setIsLoading(true);
        try {
            // Create the new entry
            const newEntry: PaymentDetails = {
                method: expandedMethod,
                detail: detailInput.trim(),
            };
            
            if (expandedMethod === 'Crypto' && selectedCrypto) {
                newEntry.cryptoName = selectedCrypto.name;
            }

            // Logic to update the array:
            // If method exists (and matches crypto type if applicable), update it.
            // If standard method (PayPal) exists, overwrite.
            // If Crypto, if we want to allow multiple different cryptos, we push.
            // BUT per prompt "define details for each", usually implies one active config per main type or replacing.
            // Let's adopt: Replace if matches Method Type. Exception: Crypto could potentially be multiples?
            // To keep UI simple for "Withdraw Screen" selection later, let's enforce Unique Method Type per user for now, 
            // OR unique combination of Method + CryptoName. 
            // Let's do: Overwrite existing entry of same Method type.
            
            const updatedList = currentDetails.filter(d => d.method !== expandedMethod);
            updatedList.push(newEntry);

            await onSave(updatedList);
            setSuccessMsg(`${expandedMethod} details saved!`);
            
            // Optional: Close expansion after short delay
            setTimeout(() => {
                 setSuccessMsg('');
                 // setExpandedMethod(null); // Keep open to show result? Or close. Let's keep open.
            }, 2000);

        } catch (err) {
            console.error(err);
            setError('Failed to save payment method.');
        } finally {
            setIsLoading(false);
        }
    };

    const getExistingDetailDisplay = (method: PaymentMethodType) => {
        const found = currentDetails.find(d => d.method === method);
        if (found) {
             if (method === 'Crypto' && found.cryptoName) {
                 return `${found.cryptoName}: ${found.detail}`;
             }
             return found.detail;
        }
        return null;
    };

    const renderContent = (methodConfig: MethodConfig) => {
        const isExpanded = expandedMethod === methodConfig.name;
        const existingDetail = getExistingDetailDisplay(methodConfig.name);
        const isSaved = !!existingDetail;

        return (
            <div key={methodConfig.name} className={`bg-white border rounded-xl mb-3 transition-all duration-300 overflow-hidden ${isExpanded ? `border-[var(--primary)] shadow-md` : 'border-gray-200 hover:border-gray-300'}`}>
                {/* Card Header / Clickable Area */}
                <button 
                    onClick={() => handleMethodClick(methodConfig.name)}
                    className="w-full flex items-center justify-between p-4 bg-white focus:outline-none"
                >
                    <div className="flex items-center">
                         <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-4 ${methodConfig.colors.bg}`}>
                             {typeof methodConfig.icon === 'string' ? <i className={`${methodConfig.icon} ${methodConfig.colors.icon} text-xl`}></i> : methodConfig.icon}
                        </div>
                        <div className="text-left">
                            <p className="font-bold text-[var(--dark)]">{methodConfig.name}</p>
                            {isSaved && !isExpanded && (
                                <p className="text-xs text-green-600 font-medium flex items-center mt-0.5">
                                    <i className="fa-solid fa-check-circle mr-1"></i> Configured
                                </p>
                            )}
                            {!isSaved && !isExpanded && (
                                <p className="text-xs text-gray-400">Tap to configure</p>
                            )}
                        </div>
                    </div>
                    <i className={`fa-solid fa-chevron-down text-gray-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}></i>
                </button>

                {/* Expanded Content */}
                {isExpanded && (
                    <div className="p-4 pt-0 bg-white animate-fadeIn">
                        <div className="h-px bg-gray-100 w-full mb-4"></div>
                        
                         {methodConfig.name === 'Crypto' && (
                            <div className="relative mb-4" ref={dropdownRef}>
                                <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Cryptocurrency</label>
                                <button
                                    onClick={() => setIsCryptoDropdownOpen(!isCryptoDropdownOpen)}
                                    className="w-full flex items-center justify-between px-3 py-3 text-left bg-gray-50 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition-all"
                                >
                                    {selectedCrypto ? (
                                        <span className="text-gray-900 font-medium">{selectedCrypto.name}</span>
                                    ) : (
                                        <span className="text-gray-400">Select Coin...</span>
                                    )}
                                    <i className={`fa-solid fa-chevron-down text-gray-400 transition-transform ${isCryptoDropdownOpen ? 'rotate-180' : ''}`}></i>
                                </button>
                                {isCryptoDropdownOpen && (
                                    <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl max-h-48 overflow-auto">
                                        {cryptocurrencies.map(crypto => (
                                            <button
                                                key={crypto.id}
                                                onClick={() => {
                                                    setSelectedCrypto(crypto);
                                                    setIsCryptoDropdownOpen(false);
                                                    setError('');
                                                }}
                                                className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 border-b border-gray-50 last:border-b-0"
                                            >
                                                {crypto.name}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="mb-4">
                            <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">
                                {methodConfig.name === 'Crypto' ? 'Wallet Address' : 'Account Details'}
                            </label>
                            <input
                                type="text"
                                value={detailInput}
                                onChange={(e) => {
                                    setDetailInput(e.target.value);
                                    setError('');
                                    setSuccessMsg('');
                                }}
                                placeholder={methodConfig.name === 'Crypto' ? (selectedCrypto?.placeholder || 'Select coin first') : methodConfig.placeholder}
                                disabled={methodConfig.name === 'Crypto' && !selectedCrypto}
                                className="w-full px-3 py-3 bg-gray-50 border border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-[var(--primary)] focus:outline-none disabled:bg-gray-100 disabled:text-gray-400 transition-all font-medium"
                            />
                        </div>

                        {error && (
                            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-center mb-3 animate-fadeIn">
                                <i className="fa-solid fa-circle-exclamation mr-2"></i>
                                {error}
                            </div>
                        )}

                         {successMsg && (
                            <div className="bg-green-50 text-green-600 p-3 rounded-lg text-sm flex items-center mb-3 animate-fadeIn">
                                <i className="fa-solid fa-check-circle mr-2"></i>
                                {successMsg}
                            </div>
                        )}

                        <button 
                            onClick={handleSaveMethod}
                            disabled={isLoading}
                            className="w-full bg-[var(--primary)] text-white font-bold py-3 rounded-xl shadow-lg hover:bg-[var(--primary-dark)] transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
                        >
                            {isLoading ? <i className="fa-solid fa-spinner fa-spin"></i> : 'Save Details'}
                        </button>
                    </div>
                )}
            </div>
        );
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Manage Payment Methods">
            <div className="p-4 bg-gray-50 max-h-[70vh] overflow-y-auto">
                <p className="text-sm text-[var(--gray)] mb-4">
                    Configure your withdrawal methods below. You can save multiple methods and choose one when withdrawing.
                </p>

                {paymentMethods.map(config => renderContent(config))}
                
                <style>{`
                    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                    .animate-fadeIn { animation: fadeIn 0.3s ease forwards; }
                `}</style>
            </div>
        </Modal>
    );
};

export default PaymentMethodModal;