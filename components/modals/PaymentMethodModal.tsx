
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
    { id: 'TON', name: 'Toncoin (TON)', placeholder: 'Enter your Toncoin (TON) address' },
    { id: 'USDT_TRC20', name: 'Tether (TRC20)', placeholder: 'Enter your Tether (TRC20) address (Starts with T)' },
];

const paymentMethods: MethodConfig[] = [
    { name: 'PayPal', icon: 'fa-brands fa-paypal', placeholder: 'Enter your PayPal email', colors: { icon: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-100 dark:border-blue-800' } },
    { name: 'Payeer', icon: 'fa-solid fa-p', placeholder: 'Enter your Payeer ID (e.g., P1234567890)', colors: { icon: 'text-sky-600', bg: 'bg-sky-50 dark:bg-sky-900/20', border: 'border-sky-100 dark:border-sky-800' } },
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
        const trimmedInput = detailInput.trim();

        // --- 1. Limit Check (Max 2 Methods) ---
        // Check if we are updating an existing method or adding a new one
        const isUpdatingExisting = currentDetails.some(d => d.method === expandedMethod);
        
        if (!isUpdatingExisting && currentDetails.length >= 2) {
            setError("Limit reached. You can only configure a maximum of 2 payment methods.");
            return;
        }

        // --- 2. Specific Validators ---
        if (expandedMethod === 'Crypto' && !selectedCrypto) {
            setError('Please select a cryptocurrency.');
            return;
        }
        if (!trimmedInput) {
            setError('Please enter your payment details.');
            return;
        }

        // Validate based on type
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        
        if (['PayPal', 'Payoneer', 'Airtm'].includes(expandedMethod)) {
            if (!emailRegex.test(trimmedInput)) {
                setError(`Invalid email format for ${expandedMethod}.`);
                return;
            }
        } else if (expandedMethod === 'Payeer') {
            // Payeer: 1 letter P (case insensitive) followed by exactly 10 numbers
            const payeerRegex = /^[Pp][0-9]{10}$/;
            if (!payeerRegex.test(trimmedInput)) {
                setError("Invalid Payeer ID. It must start with 'P' followed by exactly 10 numbers.");
                return;
            }
        } else if (expandedMethod === 'Crypto') {
            if (selectedCrypto?.id === 'USDT_TRC20') {
                // TRC20 usually starts with T and is around 34 chars
                if (!trimmedInput.startsWith('T')) {
                    setError("Invalid TRC20 address. It must start with the letter 'T'.");
                    return;
                }
                if (trimmedInput.length < 30 || trimmedInput.length > 45) {
                    setError("Invalid TRC20 address length. Please check your wallet address.");
                    return;
                }
            } else if (selectedCrypto?.id === 'TON') {
                // TON addresses are usually 48 chars (raw) or base64url encoded friendly
                if (trimmedInput.length < 40) {
                    setError("Invalid TON address. It appears to be too short.");
                    return;
                }
            }
        }

        setIsLoading(true);
        try {
            const newEntry: PaymentDetails = {
                method: expandedMethod,
                detail: trimmedInput,
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

    const handleDeleteMethod = async (methodName: string) => {
        setIsLoading(true);
        try {
            const updatedList = currentDetails.filter(d => d.method !== methodName);
            await onSave(updatedList);
            setDetailInput('');
            setSelectedCrypto(null);
            setSuccessMsg(`${methodName} removed.`);
            setTimeout(() => setSuccessMsg(''), 2000);
        } catch (err) {
            setError('Failed to remove method.');
        } finally {
            setIsLoading(false);
        }
    }

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
                                    disabled={isSaved}
                                    className="w-full flex items-center justify-between px-3 py-3 text-left bg-[var(--bg-input)] border border-[var(--border-color)] rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                    {selectedCrypto ? (
                                        <span className="text-[var(--dark)] font-medium">{selectedCrypto.name}</span>
                                    ) : (
                                        <span className="text-[var(--gray)]">Select Coin...</span>
                                    )}
                                    <i className={`fa-solid fa-chevron-down text-[var(--gray)] transition-transform ${isCryptoDropdownOpen ? 'rotate-180' : ''}`}></i>
                                </button>
                                {isCryptoDropdownOpen && !isSaved && (
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
                                disabled={(methodConfig.name === 'Crypto' && !selectedCrypto) || isSaved}
                                className="w-full px-3 py-3 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-xl shadow-sm focus:ring-2 focus:ring-[var(--primary)] focus:outline-none disabled:bg-[var(--gray-light)] disabled:text-[var(--gray)] transition-all font-medium text-[var(--dark)] disabled:cursor-not-allowed"
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

                        <div className="mt-4">
                            {isSaved ? (
                                <button 
                                    onClick={() => handleDeleteMethod(methodConfig.name)}
                                    disabled={isLoading}
                                    className="w-full bg-red-500 text-white font-bold py-3 rounded-xl shadow-lg hover:bg-red-600 transition-all disabled:opacity-70 flex items-center justify-center"
                                >
                                    {isLoading ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-solid fa-trash-can text-xl"></i>}
                                </button>
                            ) : (
                                <button 
                                    onClick={handleSaveMethod}
                                    disabled={isLoading}
                                    className="w-full bg-[var(--primary)] text-white font-bold py-3 rounded-xl shadow-lg hover:bg-[var(--primary-dark)] transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
                                >
                                    {isLoading ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-solid fa-check text-xl"></i>}
                                </button>
                            )}
                        </div>
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
                    {/* Security & Limit Info */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-4 flex items-center justify-between">
                         <div>
                            <p className="font-bold text-blue-800 dark:text-blue-200 text-sm">Limit: 2 Methods Max</p>
                            <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                                You have configured <span className="font-bold">{currentDetails.length}/2</span> methods.
                            </p>
                         </div>
                         <div className="h-10 w-10 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-200 font-bold">
                             {currentDetails.length}
                         </div>
                    </div>

                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4 mb-5 flex items-start">
                        <i className="fa-solid fa-triangle-exclamation text-yellow-600 mt-1 mr-3 flex-shrink-0 text-lg"></i>
                        <div>
                            <p className="font-bold text-yellow-800 dark:text-yellow-200 text-sm">Important: Ownership Verification</p>
                            <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                                For security reasons, the account holder for <strong>PayPal, Payeer, Payoneer, and Airtm</strong> MUST match your profile name. We do not process payments to third-party accounts.
                            </p>
                        </div>
                    </div>

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
