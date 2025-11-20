
import React, { useState, useMemo, useRef, useEffect } from 'react';

interface WithdrawScreenProps {
    balance: number;
    onBack: () => void;
    onNewWithdrawal: (amount: number, method: string) => void;
}

type PaymentMethod = 'PayPal' | 'Payeer' | 'Payoneer' | 'Airtm' | 'Crypto';

interface MethodDetails {
    name: PaymentMethod;
    icon: string | React.ReactNode;
    placeholder: string;
    min: number;
    max: number;
    fee: number; // fee as a percentage, e.g., 0.03 for 3%
    colors: {
        icon: string;
        bg: string;
        hoverBorder: string;
    };
}

interface CryptoDetails {
    id: string;
    name: string;
    placeholder: string;
    min: number;
    max: number;
    fee: number;
}


const cryptocurrencies: CryptoDetails[] = [
    { id: 'TRX', name: 'Tron (TRX)', placeholder: 'Enter your Tron (TRX) address', min: 10, max: 1000, fee: 0.03 },
    { id: 'LTC', name: 'Litecoin (LTC)', placeholder: 'Enter your Litecoin (LTC) address', min: 5, max: 500, fee: 0.015 },
    { id: 'BNB', name: 'BNB Smart Chain', placeholder: 'Enter your BNB (BEP20) address', min: 100, max: 1000, fee: 0.02 },
    { id: 'USDT_TRC20', name: 'Tether (TRC20)', placeholder: 'Enter your Tether (TRC20) address', min: 100, max: 1000, fee: 0.02 },
];

const paymentMethods: MethodDetails[] = [
    { name: 'PayPal', icon: 'fa-brands fa-paypal', placeholder: 'Enter your PayPal email', min: 5, max: 500, fee: 0.03, colors: { icon: 'text-blue-600', bg: 'bg-blue-50', hoverBorder: 'hover:border-blue-300' } },
    { name: 'Payeer', icon: 'fa-solid fa-p', placeholder: 'Enter your Payeer ID (P1...)' , min: 2, max: 250, fee: 0.02, colors: { icon: 'text-sky-600', bg: 'bg-sky-50', hoverBorder: 'hover:border-sky-300' } },
    { name: 'Payoneer', icon: 'fa-brands fa-cc-mastercard', placeholder: 'Enter your Payoneer email', min: 50, max: 1000, fee: 0.035, colors: { icon: 'text-red-600', bg: 'bg-red-50', hoverBorder: 'hover:border-red-300' } },
    { name: 'Airtm', icon: 'fa-solid fa-cloud', placeholder: 'Enter your Airtm email', min: 5, max: 300, fee: 0.05, colors: { icon: 'text-teal-600', bg: 'bg-teal-50', hoverBorder: 'hover:border-teal-300' } },
    { name: 'Crypto', icon: 'fa-solid fa-coins', placeholder: 'Enter your Crypto Wallet Address', min: 5, max: 1000, fee: 0, /* Fee is dynamic for crypto */ colors: { icon: 'text-purple-600', bg: 'bg-purple-50', hoverBorder: 'hover:border-purple-300' } },
];

const WithdrawScreen: React.FC<WithdrawScreenProps> = ({ balance, onBack, onNewWithdrawal }) => {
    const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('PayPal');
    const [amount, setAmount] = useState('');
    const [walletAddress, setWalletAddress] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [selectedCrypto, setSelectedCrypto] = useState<CryptoDetails | null>(null);
    const [isCryptoDropdownOpen, setIsCryptoDropdownOpen] = useState(false);
    const [isOnCooldown, setIsOnCooldown] = useState(false);
    const [nextWithdrawalDate, setNextWithdrawalDate] = useState<Date | null>(null);
    const [timeLeft, setTimeLeft] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const lastWithdrawalTimestamp = localStorage.getItem('lastWithdrawalTimestamp');
        if (lastWithdrawalTimestamp) {
            const lastDate = new Date(parseInt(lastWithdrawalTimestamp, 10));
            const sevenDaysLater = new Date(lastDate.getTime() + 7 * 24 * 60 * 60 * 1000);
            const now = new Date();

            if (now < sevenDaysLater) {
                setIsOnCooldown(true);
                setNextWithdrawalDate(sevenDaysLater);
            }
        }
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

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsCryptoDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [dropdownRef]);

    const { feePercentage, minWithdrawal, maxWithdrawal, nameForLimits } = useMemo(() => {
        const methodDetails = paymentMethods.find(m => m.name === selectedMethod);
        if (selectedMethod === 'Crypto' && selectedCrypto) {
            return {
                feePercentage: selectedCrypto.fee,
                minWithdrawal: selectedCrypto.min,
                maxWithdrawal: selectedCrypto.max,
                nameForLimits: selectedCrypto.name
            };
        }
        if (methodDetails) {
            return {
                feePercentage: methodDetails.fee,
                minWithdrawal: methodDetails.min,
                maxWithdrawal: methodDetails.max,
                nameForLimits: methodDetails.name
            };
        }
        return { feePercentage: 0, minWithdrawal: 0, maxWithdrawal: 0, nameForLimits: '' };
    }, [selectedMethod, selectedCrypto]);


    const amountNumber = parseFloat(amount) || 0;
    const fee = amountNumber * feePercentage;
    const amountToReceive = amountNumber - fee;
    
    const canWithdraw = useMemo(() => {
        const isCryptoReady = selectedMethod === 'Crypto' ? selectedCrypto !== null : true;
        return amountNumber > 0 && amountNumber <= balance && walletAddress.trim() !== '' && isCryptoReady && !isOnCooldown;
    }, [amountNumber, balance, walletAddress, selectedMethod, selectedCrypto, isOnCooldown]);


    const handleWithdraw = () => {
        setError('');
        
        if (isOnCooldown) {
            setError("You can only make one withdrawal every 7 days.");
            return;
        }

        if (selectedMethod === 'Crypto' && !selectedCrypto) {
            setError('Please select a cryptocurrency.');
            return;
        }

        if (amountNumber < minWithdrawal) {
            setError(`Minimum withdrawal for ${nameForLimits} is $${minWithdrawal}.`);
            return;
        }

        if (amountNumber > maxWithdrawal) {
            setError(`Maximum withdrawal for ${nameForLimits} is $${maxWithdrawal}.`);
            return;
        }

        if (!canWithdraw) {
            if (amountNumber > balance) setError('Withdrawal amount exceeds your balance.');
            else if (walletAddress.trim() === '') setError('Please enter your payment details.');
            else setError('Please enter a valid amount.');
            return;
        }
        
        const method = selectedMethod === 'Crypto' ? selectedCrypto!.name : selectedMethod;
        onNewWithdrawal(amountNumber, method);
        
        localStorage.setItem('lastWithdrawalTimestamp', Date.now().toString());
        setSuccess(true);
    };

    const selectedMethodDetails = useMemo(() => paymentMethods.find(m => m.name === selectedMethod), [selectedMethod]);
    
    const placeholder = useMemo(() => {
        if (selectedMethod === 'Crypto') {
            return selectedCrypto?.placeholder || 'Select a cryptocurrency first';
        }
        return selectedMethodDetails?.placeholder;
    }, [selectedMethod, selectedCrypto, selectedMethodDetails]);

    const minMaxText = useMemo(() => {
        const details = selectedMethod === 'Crypto' ? selectedCrypto : selectedMethodDetails;
        if (details) {
            return `Min: $${details.min}, Max: $${details.max}`;
        }
        if (selectedMethod === 'Crypto') {
            return 'Select a crypto to see limits';
        }
        return '';
    }, [selectedMethod, selectedCrypto, selectedMethodDetails]);


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
                <h1 className="text-lg font-bold text-gray-800">
                    Withdraw Funds
                </h1>
            </div>

            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 pb-24">
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

                        <div>
                            <h3 className="text-md font-bold text-[var(--dark)] mb-3">Select Method</h3>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                {paymentMethods.map(method => (
                                    <button 
                                        key={method.name}
                                        onClick={() => {
                                            setSelectedMethod(method.name);
                                            setWalletAddress('');
                                            setError('');
                                            if (method.name !== 'Crypto') {
                                                setSelectedCrypto(null);
                                            }
                                        }}
                                        className={`p-3 border-2 rounded-lg flex flex-col items-center justify-center transition-all duration-200 min-h-[100px] ${selectedMethod === method.name ? 'border-[var(--primary)] bg-blue-50 shadow-md' : `border-gray-200 ${method.colors.bg} ${method.colors.hoverBorder}`}`}
                                    >
                                        {typeof method.icon === 'string' ? (
                                            <i className={`${method.icon} text-2xl ${selectedMethod === method.name ? 'text-[var(--primary)]' : method.colors.icon}`}></i>
                                        ) : (
                                            method.icon
                                        )}
                                        <span className={`mt-2 text-xs font-semibold ${selectedMethod === method.name ? 'text-[var(--dark)]' : 'text-gray-600'}`}>{method.name}</span>
                                    </button>
                                ))}
                            </div>
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
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[var(--primary)] focus:border-[var(--primary)]"
                                />
                            </div>

                            {selectedMethod === 'Crypto' && (
                                <div className="relative" ref={dropdownRef}>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Cryptocurrency</label>
                                <button
                                    onClick={() => setIsCryptoDropdownOpen(!isCryptoDropdownOpen)}
                                    className="w-full flex items-center justify-between px-3 py-2 text-left bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-[var(--primary)] focus:border-[var(--primary)]"
                                >
                                    {selectedCrypto ? (
                                        <span className="text-gray-900">{selectedCrypto.name}</span>
                                    ) : (
                                    <span className="text-gray-500">Select Cryptocurrency...</span>
                                    )}
                                    <i className={`fa-solid fa-chevron-down text-gray-400 transition-transform ${isCryptoDropdownOpen ? 'rotate-180' : ''}`}></i>
                                </button>
                                {isCryptoDropdownOpen && (
                                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                                    {cryptocurrencies.map(crypto => (
                                        <button
                                        key={crypto.id}
                                        onClick={() => {
                                            setSelectedCrypto(crypto);
                                            setIsCryptoDropdownOpen(false);
                                            setError('');
                                        }}
                                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                        >
                                        {crypto.name}
                                        </button>
                                    ))}
                                    </div>
                                )}
                                </div>
                            )}

                            <div>
                                <label htmlFor="walletAddress" className="block text-sm font-medium text-gray-700 mb-1">{selectedMethodDetails?.name} Details</label>
                                <input
                                    type="text"
                                    id="walletAddress"
                                    value={walletAddress}
                                    onChange={(e) => {
                                        setWalletAddress(e.target.value);
                                        setError('');
                                    }}
                                    placeholder={placeholder}
                                    disabled={selectedMethod === 'Crypto' && !selectedCrypto}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[var(--primary)] focus:border-[var(--primary)] disabled:bg-gray-100"
                                />
                                <p className="text-xs text-gray-500 mt-1">{minMaxText}</p>
                            </div>
                        </div>
                        
                        <div className="bg-gray-100 p-4 rounded-lg text-sm space-y-2">
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

                        {error && <p className="text-red-600 text-sm text-center bg-red-100 p-3 rounded-lg">{error}</p>}

                        <button 
                            onClick={handleWithdraw}
                            disabled={!canWithdraw}
                            className="w-full bg-gradient-to-r from-green-500 to-teal-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-green-500/30 transition-all hover:scale-[1.01] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 disabled:shadow-none"
                        >
                            Withdraw Now
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

export default WithdrawScreen;