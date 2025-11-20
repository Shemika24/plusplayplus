

import React, { useState, useMemo, useEffect } from 'react';
import { UserProfile, PaymentDetails } from '../types';
import { storageService } from '../utils/storage';

interface WithdrawScreenProps {
    balance: number;
    onBack: () => void;
    onNewWithdrawal: (amount: number, method: string) => void;
    userProfile?: UserProfile; 
}

const WithdrawScreen: React.FC<WithdrawScreenProps> = ({ balance, onBack, onNewWithdrawal, userProfile }) => {
    const [amount, setAmount] = useState('');
    const [selectedMethodIndex, setSelectedMethodIndex] = useState<number | null>(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [isOnCooldown, setIsOnCooldown] = useState(false);
    const [timeLeft, setTimeLeft] = useState('');
    const [nextWithdrawalDate, setNextWithdrawalDate] = useState<Date | null>(null);

    const savedMethods = userProfile?.savedPaymentMethods || [];

    // Set default selected method if only one exists
    useEffect(() => {
        if (savedMethods.length === 1 && selectedMethodIndex === null) {
            setSelectedMethodIndex(0);
        }
    }, [savedMethods.length, selectedMethodIndex]);

    const selectedPaymentDetails = selectedMethodIndex !== null ? savedMethods[selectedMethodIndex] : null;

    useEffect(() => {
        const checkCooldown = async () => {
            const lastWithdrawalTimestamp = await storageService.getItem('lastWithdrawalTimestamp');
            if (lastWithdrawalTimestamp) {
                const lastDate = new Date(parseInt(lastWithdrawalTimestamp, 10));
                const sevenDaysLater = new Date(lastDate.getTime() + 7 * 24 * 60 * 60 * 1000);
                const now = new Date();

                if (now < sevenDaysLater) {
                    setIsOnCooldown(true);
                    setNextWithdrawalDate(sevenDaysLater);
                }
            }
        };
        checkCooldown();
    }, []);

    useEffect(() => {
        if (!isOnCooldown || !nextWithdrawalDate) return;

        const calculateTimeLeft = () => {
            const now = new Date();
            const difference = nextWithdrawalDate.getTime() - now.getTime();
            
            if (difference <= 0) {
                setTimeLeft('00d 00h 00m 00s');
                setIsOnCooldown(false);
                return;
            }

            const days = Math.floor(difference / (1000 * 60 * 60 * 24));
            const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
            const minutes = Math.floor((difference / 1000 / 60) % 60);
            const seconds = Math.floor((difference / 1000) % 60);

            const pad = (num: number) => num.toString().padStart(2, '0');

            setTimeLeft(`${pad(days)}d ${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`);
        };

        calculateTimeLeft();
        const timer = setInterval(calculateTimeLeft, 1000);

        return () => clearInterval(timer);
    }, [isOnCooldown, nextWithdrawalDate]);

    const getMethodSpecs = (method: string, cryptoName?: string) => {
        // Defaults
        let fee = 0.03;
        let min = 5;
        let max = 500;

        switch (method) {
            case 'PayPal': fee = 0.03; min = 5; max = 500; break;
            case 'Payeer': fee = 0.02; min = 2; max = 250; break;
            case 'Payoneer': fee = 0.035; min = 50; max = 1000; break;
            case 'Airtm': fee = 0.05; min = 5; max = 300; break;
            case 'Crypto':
                if (cryptoName?.includes('TRX')) { fee = 0.03; min = 10; max = 1000; }
                else if (cryptoName?.includes('LTC')) { fee = 0.015; min = 5; max = 500; }
                else if (cryptoName?.includes('BNB')) { fee = 0.02; min = 100; max = 1000; }
                else if (cryptoName?.includes('TRC20')) { fee = 0.02; min = 100; max = 1000; }
                else { fee = 0.03; min = 10; max = 1000; } 
                break;
        }
        return { fee, min, max };
    };

    const { feePercentage, minWithdrawal, maxWithdrawal } = useMemo(() => {
        if (!selectedPaymentDetails) return { feePercentage: 0, minWithdrawal: 0, maxWithdrawal: 0 };
        return getMethodSpecs(selectedPaymentDetails.method, selectedPaymentDetails.cryptoName);
    }, [selectedPaymentDetails]);

    const amountNumber = parseFloat(amount) || 0;
    const fee = amountNumber * feePercentage;
    const amountToReceive = amountNumber - fee;

    const canWithdraw = useMemo(() => {
        return selectedPaymentDetails && amountNumber > 0 && amountNumber <= balance && !isOnCooldown;
    }, [amountNumber, balance, selectedPaymentDetails, isOnCooldown]);

    const handleWithdraw = async () => {
        setError('');
        
        if (isOnCooldown) {
            setError("You can only make one withdrawal every 7 days.");
            return;
        }

        if (!selectedPaymentDetails) {
            setError("Please select a payment method.");
            return;
        }

        if (amountNumber < minWithdrawal) {
            setError(`Minimum withdrawal for this method is $${minWithdrawal}.`);
            return;
        }

        if (amountNumber > maxWithdrawal) {
            setError(`Maximum withdrawal for this method is $${maxWithdrawal}.`);
            return;
        }

        if (amountNumber > balance) {
            setError('Withdrawal amount exceeds your balance.');
            return;
        }

        const methodString = selectedPaymentDetails.method === 'Crypto' && selectedPaymentDetails.cryptoName 
            ? `${selectedPaymentDetails.cryptoName}` 
            : selectedPaymentDetails.method;

        onNewWithdrawal(amountNumber, methodString);
        
        await storageService.setItem('lastWithdrawalTimestamp', Date.now().toString());
        setSuccess(true);
    };

    const getIconClass = (method: string) => {
        switch (method) {
            case 'PayPal': return 'fa-brands fa-paypal text-blue-600';
            case 'Payeer': return 'fa-solid fa-p text-sky-600';
            case 'Payoneer': return 'fa-brands fa-cc-mastercard text-red-600';
            case 'Airtm': return 'fa-solid fa-cloud text-teal-600';
            case 'Crypto': return 'fa-solid fa-coins text-purple-600';
            default: return 'fa-solid fa-wallet text-gray-600';
        }
    };

    if (success) {
        return (
            <div className="flex flex-col items-center justify-center text-center h-full p-6 bg-gray-50">
                 <div className="w-24 h-24 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-6 border-4 border-green-200">
                    <i className="fa-solid fa-check-double text-green-500 text-5xl"></i>
                </div>
                <h2 className="text-2xl font-bold text-[var(--dark)] mb-2">Withdrawal Requested!</h2>
                <p className="text-[var(--gray)]">
                    Your request to withdraw <span className="font-bold text-[var(--dark)]">${amountNumber.toFixed(2)}</span> has been submitted.
                </p>
                <p className="text-sm text-[var(--gray)] mt-2">It will be processed within 15 business days.</p>
                <button 
                    onClick={onBack}
                    className="mt-6 w-full max-w-xs bg-[var(--primary)] text-white font-bold py-3 rounded-xl shadow-lg transition-transform hover:scale-105"
                >
                    Back to Wallet
                </button>
            </div>
        );
    }
    
    return (
        <div className="flex flex-col h-full bg-gray-50">
            <div className="p-4 border-b border-gray-200 bg-white sticky top-0 z-10 flex items-center">
                <button onClick={onBack} className="mr-3 text-gray-600">
                    <i className="fa-solid fa-arrow-left text-lg"></i>
                </button>
                <h1 className="text-lg font-bold text-gray-800">
                    Withdraw Funds
                </h1>
            </div>

            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
                {isOnCooldown ? (
                    <div className="flex flex-col items-center justify-center text-center h-full p-6 bg-white rounded-xl shadow-lg">
                        <i className="fa-solid fa-clock-rotate-left text-5xl text-blue-500 mb-6"></i>
                        <h2 className="text-2xl font-bold text-[var(--dark)] mb-2">Withdrawal Cooldown</h2>
                        <p className="text-[var(--gray)]">
                            You can make another withdrawal request in:
                        </p>
                        <p className="font-mono text-lg font-bold text-[var(--dark)] mt-2 bg-blue-100 p-3 rounded-lg w-full tracking-wider">
                            {timeLeft}
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="bg-white p-4 rounded-xl shadow-lg flex justify-between items-center">
                            <div>
                                <p className="text-sm text-[var(--gray)]">Available Balance</p>
                                <p className="text-2xl font-bold text-[var(--dark)]">${balance.toFixed(2)}</p>
                            </div>
                            <i className="fa-solid fa-wallet text-3xl text-[var(--primary)]"></i>
                        </div>

                        {/* Method Selection */}
                        <div>
                            <h3 className="text-md font-bold text-[var(--dark)] mb-3">Select Payment Method</h3>
                            
                            {savedMethods.length > 0 ? (
                                <div className="space-y-3">
                                    {/* Custom Dropdown or List */}
                                    <div className="relative">
                                        <select 
                                            value={selectedMethodIndex !== null ? selectedMethodIndex : ''}
                                            onChange={(e) => setSelectedMethodIndex(parseInt(e.target.value))}
                                            className="w-full appearance-none bg-white border border-gray-200 rounded-xl p-4 pr-10 shadow-sm focus:ring-2 focus:ring-[var(--primary)] focus:outline-none font-semibold text-gray-800"
                                        >
                                            <option value="" disabled>Choose a method...</option>
                                            {savedMethods.map((method, index) => (
                                                <option key={index} value={index}>
                                                    {method.method} {method.cryptoName ? `(${method.cryptoName})` : ''} - {method.detail.substring(0, 15)}...
                                                </option>
                                            ))}
                                        </select>
                                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                                            <i className="fa-solid fa-chevron-down"></i>
                                        </div>
                                    </div>

                                    {selectedPaymentDetails && (
                                        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex items-center animate-fadeIn">
                                            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center mr-3 shadow-sm">
                                                <i className={`${getIconClass(selectedPaymentDetails.method)} text-xl`}></i>
                                            </div>
                                            <div className="flex-1 overflow-hidden">
                                                <p className="font-bold text-[var(--dark)] text-sm">
                                                    {selectedPaymentDetails.method}
                                                    {selectedPaymentDetails.cryptoName && <span className="font-normal text-gray-500 ml-1">({selectedPaymentDetails.cryptoName})</span>}
                                                </p>
                                                <p className="text-xs text-gray-600 truncate">{selectedPaymentDetails.detail}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="bg-yellow-50 p-5 rounded-xl border border-yellow-100 text-center">
                                    <div className="w-12 h-12 mx-auto bg-yellow-100 rounded-full flex items-center justify-center mb-3">
                                        <i className="fa-solid fa-triangle-exclamation text-yellow-600 text-xl"></i>
                                    </div>
                                    <h4 className="font-bold text-yellow-800 mb-1">No Payment Methods</h4>
                                    <p className="text-sm text-yellow-700 mb-4">You haven't saved any withdrawal methods yet.</p>
                                    <button 
                                        onClick={() => alert("Please go to Profile > Settings > Payment Methods to add one.")}
                                        className="bg-white text-yellow-700 font-bold py-2 px-4 rounded-lg border border-yellow-200 shadow-sm hover:bg-yellow-50"
                                    >
                                        Add Method in Profile
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="bg-white p-5 rounded-xl shadow-lg space-y-4">
                            <div>
                                <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">Amount (USD)</label>
                                <input
                                    type="number"
                                    id="amount"
                                    value={amount}
                                    onChange={(e) => {
                                        setAmount(e.target.value);
                                        setError('');
                                    }}
                                    placeholder="0.00"
                                    disabled={!selectedPaymentDetails}
                                    className="w-full px-3 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] disabled:bg-gray-100 outline-none font-bold text-lg"
                                />
                            </div>

                            {selectedPaymentDetails && (
                                <div className="bg-gray-50 p-3 rounded-lg">
                                    <p className="text-xs text-gray-500">
                                        Min: <span className="font-semibold">${minWithdrawal}</span> • Max: <span className="font-semibold">${maxWithdrawal}</span>
                                    </p>
                                </div>
                            )}
                        </div>
                        
                        {selectedPaymentDetails && (
                            <div className="bg-gray-100 p-4 rounded-xl text-sm space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Withdrawal Amount:</span>
                                    <span className="font-medium text-gray-800">${amountNumber.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Fee ({(feePercentage * 100).toFixed(1)}%):</span>
                                    <span className="font-medium text-red-600">-${fee.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between font-bold text-base border-t border-gray-300 pt-2 mt-2">
                                    <span className="text-gray-800">You Will Receive:</span>
                                    <span className="text-[var(--primary)]">${amountToReceive.toFixed(2)}</span>
                                </div>
                            </div>
                        )}

                        {error && <p className="text-red-600 text-sm text-center bg-red-100 p-3 rounded-lg">{error}</p>}

                        <button 
                            onClick={handleWithdraw}
                            disabled={!canWithdraw}
                            className="w-full bg-gradient-to-r from-green-500 to-teal-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-green-500/30 transition-all hover:scale-105 hover:brightness-110 active:scale-100 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 disabled:shadow-none"
                        >
                            Withdraw Now
                        </button>
                    </>
                )}
            </div>
            <style>{`
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                .animate-fadeIn { animation: fadeIn 0.3s ease forwards; }
            `}</style>
        </div>
    );
};

export default WithdrawScreen;
