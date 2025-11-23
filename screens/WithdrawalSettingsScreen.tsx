import React, { useState } from 'react';
import { WithdrawalSettingsScreenProps } from '../types';
import LinkAccountModal from '../components/modals/LinkAccountModal';

// Defining this here to be self-contained, but could be moved to a shared constant file
const paymentMethods = [
    { 
      id: 'paypal', 
      name: 'PayPal', 
      icon: <div className="w-10 h-10 flex items-center justify-center"><i className="fa-brands fa-paypal text-4xl text-[#003087]"></i></div>,
      placeholder: 'your.paypal@email.com',
      inputType: 'email' as const
    },
    { 
      id: 'binance', 
      name: 'Binance Pay', 
      icon: <div className="w-10 h-10 flex items-center justify-center"><i className="fa-solid fa-coins text-4xl text-[#F0B90B]"></i></div>,
      placeholder: 'Binance User ID or Email',
      inputType: 'text' as const
    },
    { 
      id: 'payeer', 
      name: 'Payeer', 
      icon: <span className="w-10 h-10 flex items-center justify-center rounded-full bg-[#00A9E0] text-white font-bold text-xl">P</span>,
      placeholder: 'P12345678',
      inputType: 'text' as const
    },
    { 
      id: 'usdt', 
      name: 'USDT TRC20', 
      icon: <span className="w-10 h-10 flex items-center justify-center rounded-full bg-[#26A17B] text-white font-bold text-xl">T</span>,
      placeholder: 'Your TRC20 Wallet Address',
      inputType: 'text' as const
    },
];

const WithdrawalSettingsScreen: React.FC<WithdrawalSettingsScreenProps> = ({ onBack, withdrawalAccounts, setWithdrawalAccounts }) => {
    const [modalMethod, setModalMethod] = useState<(typeof paymentMethods)[0] | null>(null);

    const handleSave = (accountDetail: string) => {
        if (modalMethod) {
            setWithdrawalAccounts(prev => ({
                ...prev,
                [modalMethod.id]: accountDetail
            }));
        }
        setModalMethod(null);
    };

    return (
        <>
            <div className="animate-fadeIn space-y-6">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-2 -ml-2 text-dark hover:text-primary" aria-label="Go back">
                        <i className="fa-solid fa-arrow-left text-2xl"></i>
                    </button>
                    <h1 className="text-2xl font-bold text-dark">Withdrawal Settings</h1>
                </div>

                <p className="text-gray text-center bg-primary/10 p-4 rounded-xl">
                    Link your withdrawal accounts here. This information will be used for all future withdrawals.
                </p>

                <div className="space-y-4">
                    {paymentMethods.map(method => {
                        const linkedAccount = withdrawalAccounts[method.id];
                        return (
                            <div key={method.id} className="bg-white p-4 rounded-2xl shadow-md flex items-center gap-4">
                                <div className="flex-shrink-0">{method.icon}</div>
                                <div className="flex-grow min-w-0">
                                    <h3 className="font-bold text-dark">{method.name}</h3>
                                    <p className={`text-sm truncate ${linkedAccount ? 'text-gray font-mono' : 'text-gray italic'}`}>
                                        {linkedAccount || 'Not linked'}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setModalMethod(method)}
                                    className="flex-shrink-0 bg-primary text-white font-bold py-2 px-4 rounded-xl shadow-lg shadow-primary/20 transition-transform hover:scale-105"
                                >
                                    {linkedAccount ? 'Change' : 'Link'}
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>
            
            {modalMethod && (
                <LinkAccountModal
                    isOpen={!!modalMethod}
                    onClose={() => setModalMethod(null)}
                    method={modalMethod}
                    onSave={handleSave}
                    currentValue={withdrawalAccounts[modalMethod.id]}
                />
            )}
        </>
    );
};

export default WithdrawalSettingsScreen;