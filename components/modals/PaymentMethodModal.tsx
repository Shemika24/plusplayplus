
import React, { useState, useMemo, useRef, useEffect } from 'react';
import Modal from '../Modal';
import { PaymentDetails, UserProfile } from '../../types';

interface PaymentMethodModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentDetails?: PaymentDetails[]; // Received as array now
    onSave: (details: PaymentDetails[]) => Promise<void>;
    userProfile: UserProfile;
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
    { name: 'PayPal', icon: 'fa-brands fa-paypal', placeholder: 'Enter your PayPal email', colors: { icon: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-100 dark:border-blue-800' } },
    { name: 'Payeer', icon: 'fa-solid fa-p', placeholder: 'Enter your Payeer ID (P1...)', colors: { icon: 'text-sky-600', bg: 'bg-sky-50 dark:bg-sky-900/20', border: 'border-sky-100 dark:border-sky-800' } },
    { name: 'Payoneer', icon: 'fa-brands fa-cc-mastercard', placeholder: 'Enter your Payoneer email', colors: { icon: 'text-red-600', bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-100 dark:border-red-800' } },
    { name: 'Airtm', icon: 'fa-solid fa-cloud', placeholder: 'Enter your Airtm email', colors: { icon: 'text-teal-600', bg: 'bg-teal-50 dark:bg-teal-900/20', border: 'border-teal-100 dark:border-teal-800' } },
    { name: 'Crypto', icon: 'fa-solid fa-coins', placeholder: 'Enter your Crypto Wallet Address', colors: { icon: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20', border: 'border-purple-100 dark:border-purple-800' } },
];

const PaymentMethodModal: React.FC<PaymentMethodModalProps> = ({ isOpen, onClose, currentDetails = [], onSave, userProfile }) => {
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

    // Calculate missing fields
    const missingFields = useMemo(() => {
        const missing: string[] = [];
        if (!userProfile.fullName || userProfile.fullName.trim() === '') missing.push('Full Name');
        if (!userProfile.dob || userProfile.dob.trim() === '') missing.push('Date of Birth');
        if (!userProfile.address || userProfile.address.trim() === '') missing.push('Address');
        if (!userProfile.phone || userProfile.phone.trim() === '') missing.push('Phone Number');
        return missing;
    }, [userProfile]);

    const isProfileComplete = missingFields.length === 0;

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
            const newEntry: PaymentDetails = {
                method: expandedMethod,
                detail: detailInput.trim(),
            };
            
            if (expandedMethod === 'Crypto' && selectedCrypto) {
                newEntry.cryptoName = selectedCrypto.name;
            }

            const updatedList = currentDetails.filter(d => d.method !== expandedMethod);
            updatedList.push(newEntry);

            await onSave(updatedList);
            setSuccessMsg(`${expandedMethod} details saved!`);
            
            setTimeout(() => {
                 setSuccessMsg('');
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
            <div key={methodConfig.name} className={`bg-[var(--bg-card)] border rounded-xl mb-3 transition-all duration-300 overflow-hidden ${isExpanded ? `border-[var(--primary)] shadow-md` : 'border-[var(--border-color)] hover:border-gray-400 dark:hover:border-gray-600'}`}>
                {/* Card Header / Clickable Area */}
                <button 
                    onClick={() => handleMethodClick(methodConfig.name)}
                    className="w-full flex items-center justify-between p-4 bg-[var(--bg-card)] focus:outline-none"
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
                                <p className="text-xs text-[var(--gray)]">Tap to configure</p>
                            )}
                        </div>
                    </div>
                    <i className={`fa-solid fa-chevron-down text-[var(--gray)] transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}></i>
                </button>

                {/* Expanded Content */}
                {isExpanded && (
                    <div className="p-4 pt-0 bg-[var(--bg-card)] animate-fadeIn">
                        <div className="h-px bg-[var(--border-color)] w-full mb-4"></div>
                        
                         {methodConfig.name === 'Crypto' && (
                            <div className="relative mb-4" ref={dropdownRef}>
                                <label className="block text-xs font-bold text-[var(--gray)] mb-1 uppercase">Cryptocurrency</label>
                                <button
                                    onClick={() => setIsCryptoDropdownOpen(!isCryptoDropdownOpen)}
                                    className="w-full flex items-center justify-between px-3 py-3 text-left bg-[var(--bg-input)] border border-[var(--border-color)] rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition-all"
                                >
                                    {selectedCrypto ? (
                                        <span className="text-[var(--dark)] font-medium">{selectedCrypto.name}</span>
                                    ) : (
                                        <span className="text-[var(--gray)]">Select Coin...</span>
                                    )}
                                    <i className={`fa-solid fa-chevron-down text-[var(--gray)] transition-transform ${isCryptoDropdownOpen ? 'rotate-180' : ''}`}></i>
                                </button>
                                {isCryptoDropdownOpen && (
                                    <div className="absolute z-20 w-full mt-1 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl shadow-xl max-h-48 overflow-auto">
                                        {cryptocurrencies.map(crypto => (
                                            <button
                                                key={crypto.id}
                                                onClick={() => {
                                                    setSelectedCrypto(crypto);
                                                    setIsCryptoDropdownOpen(false);
                                                    setError('');
                                                }}
                                                className="w-full text-left px-4 py-3 text-sm text-[var(--dark)] hover:bg-[var(--bg-card-hover)] border-b border-[var(--border-color)] last:border-b-0"
                                            >
                                                {crypto.name}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="mb-4">
                            <label className="block text-xs font-bold text-[var(--gray)] mb-1 uppercase">
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
                                className="w-full px-3 py-3 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-xl shadow-sm focus:ring-2 focus:ring-[var(--primary)] focus:outline-none disabled:bg-[var(--gray-light)] disabled:text-[var(--gray)] transition-all font-medium text-[var(--dark)]"
                            />
                        </div>

                        {error && (
                            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 p-3 rounded-lg text-sm flex items-center mb-3 animate-fadeIn">
                                <i className="fa-solid fa-circle-exclamation mr-2"></i>
                                {error}
                            </div>
                        )}

                         {successMsg && (
                            <div className="bg-green-50 dark:bg-green-900/20 text-green-600 p-3 rounded-lg text-sm flex items-center mb-3 animate-fadeIn">
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

    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Manage Payment Methods">
             {isProfileComplete ? (
                <div className="p-4 bg-[var(--bg-input)] max-h-[70vh] overflow-y-auto">
                    {/* Important Security Notice */}
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4 mb-5 flex items-start">
                        <i className="fa-solid fa-triangle-exclamation text-yellow-600 mt-1 mr-3 flex-shrink-0 text-lg"></i>
                        <div>
                            <p className="font-bold text-yellow-800 dark:text-yellow-200 text-sm">Important: Ownership Verification</p>
                            <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                                For security reasons, the account holder for <strong>PayPal, Payeer, Payoneer, and Airtm</strong> MUST match your profile name. We do not process payments to third-party accounts.
                            </p>
                        </div>
                    </div>

                    <p className="text-sm text-[var(--gray)] mb-4">
                        Configure your withdrawal methods below. You can save multiple methods and choose one when withdrawing.
                    </p>

                    {paymentMethods.map(config => renderContent(config))}
                </div>
            ) : (
                 <div className="p-6 bg-[var(--bg-card)] flex flex-col items-center text-center">
                    <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4 text-red-500">
                        <i className="fa-solid fa-user-lock text-3xl"></i>
                    </div>
                    <h3 className="text-xl font-bold text-[var(--dark)] mb-2">Profile Incomplete</h3>
                    <p className="text-[var(--gray)] mb-6 text-sm">
                        To ensure security and regulatory compliance, you must complete your profile information before adding payment methods.
                    </p>
                    
                    <div className="w-full bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-xl p-4 mb-6 text-left">
                        <p className="text-xs font-bold text-red-800 dark:text-red-300 uppercase tracking-wide mb-2">Missing Information:</p>
                        <ul className="space-y-2">
                            {missingFields.map((field, idx) => (
                                <li key={idx} className="flex items-center text-red-700 dark:text-red-400 text-sm">
                                    <i className="fa-solid fa-circle-xmark mr-2"></i> {field}
                                </li>
                            ))}
                        </ul>
                    </div>
                 </div>
            )}
             <style>{`
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                .animate-fadeIn { animation: fadeIn 0.3s ease forwards; }
            `}</style>
        </Modal>
    );
};

export default PaymentMethodModal;
