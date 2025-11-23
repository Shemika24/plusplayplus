import React, { useState, useMemo } from 'react';
import { WalletScreenProps } from '../types';
import { WITHDRAWAL_AMOUNTS } from '../constants';

interface BalanceCardProps {
  balance: number;
  onWithdrawClick: () => void;
}

const BalanceCard: React.FC<BalanceCardProps> = React.memo(({ balance, onWithdrawClick }) => {
  const points = useMemo(() => Math.floor(balance / 0.000001), [balance]);
  
  return (
    <div className="bg-gradient-to-br from-primary to-accent text-white rounded-3xl p-4 shadow-lg shadow-primary/30 w-full mx-auto relative overflow-hidden">
      <button 
        onClick={onWithdrawClick}
        className="absolute top-4 right-4 flex items-center gap-2 bg-white/20 hover:bg-white/30 transition-colors font-bold px-3 py-2 rounded-xl text-sm"
      >
        <i className="fa-solid fa-hand-holding-dollar"></i>
        <span>Withdraw</span>
      </button>
      
      <div className='text-left'>
        <h2 className="text-sm font-medium text-white/80 mb-1">Total Balance</h2>
        <p className="text-4xl font-extrabold text-white tracking-tight">
          <span className="text-2xl font-semibold text-white/80 align-top mr-1">$</span>
          {balance.toFixed(2)}
        </p>
        <p className="text-sm font-medium text-white/70">{points.toLocaleString()} points</p>
      </div>
    </div>
  );
});

interface ReferralCardProps {
    earnings: { direct: number; commission: number; };
}

const ReferralCard: React.FC<ReferralCardProps> = React.memo(({ earnings }) => (
    <div className="bg-white p-4 rounded-2xl shadow-md">
        <div className="flex items-center gap-3 mb-3">
            <i className="fa-solid fa-user-plus text-2xl text-success"></i>
            <h2 className="text-xl font-bold text-dark">Referral Earnings</h2>
        </div>
        <div className="flex justify-around text-center pt-2">
            <div>
                <p className="text-gray text-sm">Direct Bonus</p>
                <p className="font-bold text-lg text-success">${earnings.direct.toFixed(2)}</p>
            </div>
            <div>
                <p className="text-gray text-sm">Commissions</p>
                <p className="font-bold text-lg text-success">${earnings.commission.toFixed(2)}</p>
            </div>
        </div>
    </div>
));


interface ConfirmationModalProps {
    amount: number;
    method: string;
    onConfirm: () => void;
    onCancel: () => void;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ amount, method, onConfirm, onCancel }) => (
    <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-[100] animate-fadeIn" onClick={onCancel}>
        <div className="bg-white p-6 rounded-2xl shadow-lg max-w-sm w-11/12 relative animate-slideInUp text-center" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-dark mb-4">Confirm Withdrawal</h2>
            <p className="text-gray mb-6">
                Are you sure you want to withdraw <span className="font-bold text-dark">${amount.toFixed(2)}</span> via <span className="font-bold text-dark">{method}</span>?
            </p>
            <div className="flex gap-4">
                <button
                    onClick={onCancel}
                    className="w-full bg-gray-medium text-dark font-bold py-3 rounded-xl transition-colors hover:bg-gray-400/50"
                >
                    Cancel
                </button>
                <button
                    onClick={onConfirm}
                    className="w-full bg-success text-white font-bold py-3 rounded-xl shadow-lg shadow-success/30 transition-transform hover:scale-105"
                >
                    Confirm
                </button>
            </div>
        </div>
    </div>
);

const paymentMethods = [
    { id: 'paypal', name: 'PayPal', icon: <i className="fa-brands fa-paypal text-4xl text-[#003087]"></i> },
    { id: 'binance', name: 'Binance Pay', icon: <i className="fa-solid fa-coins text-4xl text-[#F0B90B]"></i> },
    { id: 'payeer', name: 'Payeer', icon: <span className="w-10 h-10 flex items-center justify-center rounded-full bg-[#00A9E0] text-white font-bold text-xl">P</span> },
    { id: 'usdt', name: 'USDT TRC20', icon: <span className="w-10 h-10 flex items-center justify-center rounded-full bg-[#26A17B] text-white font-bold text-xl">T</span> },
];

interface WithdrawalViewProps {
    balance: number;
    onBack: () => void;
    onConfirmWithdrawal: (amount: number, method: string) => void;
}

const WithdrawalView: React.FC<WithdrawalViewProps> = ({ balance, onBack, onConfirmWithdrawal }) => {
    const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
    const [selectedMethod, setSelectedMethod] = useState<string | null>(null);

    const canConfirm = selectedAmount !== null && selectedMethod !== null && balance >= selectedAmount;

    return (
        <div className="space-y-6 animate-fadeIn">
            <div className="flex items-center gap-4">
                <button onClick={onBack} className="p-2 -ml-2 text-dark hover:text-primary"><i className="fa-solid fa-arrow-left text-2xl"></i></button>
                <h2 className="text-2xl font-bold text-dark">New Withdrawal</h2>
            </div>

            <div>
              <h3 className="text-lg font-bold text-dark mb-3">1. Select Amount</h3>
              <div className="grid grid-cols-3 gap-3">
                {WITHDRAWAL_AMOUNTS.map(amount => (
                  <button 
                    key={amount} 
                    className={`p-4 rounded-xl font-bold text-lg text-dark shadow-sm border-2 transition-all ${selectedAmount === amount ? 'border-primary bg-primary/10' : 'bg-white border-gray-200'} hover:shadow-md hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:bg-gray-light`}
                    disabled={balance < amount}
                    onClick={() => setSelectedAmount(amount)}
                  >
                    ${amount}
                  </button>
                ))}
              </div>
            </div>

            <div>
                <h3 className="text-lg font-bold text-dark mb-3">2. Select Method</h3>
                <div className="grid grid-cols-3 gap-3">
                    {paymentMethods.map(method => (
                        <button 
                            key={method.id} 
                            onClick={() => setSelectedMethod(method.name)} 
                            className={`flex flex-col items-center justify-center text-center p-3 rounded-xl border-2 transition-all duration-200 aspect-square ${selectedMethod === method.name ? 'border-primary bg-primary/10' : 'bg-white border-gray-200 hover:shadow-md hover:-translate-y-0.5'}`}
                        >
                            <div className="mb-2">{method.icon}</div>
                            <span className="font-semibold text-xs text-dark">{method.name}</span>
                        </button>
                    ))}
                </div>
            </div>
            
            <button 
                onClick={() => onConfirmWithdrawal(selectedAmount!, selectedMethod!)}
                disabled={!canConfirm}
                className="w-full bg-success text-white font-bold py-4 rounded-xl shadow-lg shadow-success/30 transition-all hover:scale-105 disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100 disabled:shadow-none"
            >
                Confirm Withdrawal
            </button>
        </div>
    );
}

interface InfoCardProps {
    icon: React.ReactNode;
    label: string;
    value: string;
    note?: string;
    colorClass: string;
}

const InfoCard: React.FC<InfoCardProps> = React.memo(({ icon, label, value, note, colorClass }) => (
    <div className={`bg-white p-4 rounded-2xl shadow-md flex items-center gap-4 border-l-4 ${colorClass}`}>
        <div className="text-3xl">{icon}</div>
        <div>
            <p className="text-gray text-sm">{label}</p>
            <p className="font-bold text-xl text-dark">{value}</p>
            {note && <p className="text-xs text-gray mt-1">{note}</p>}
        </div>
    </div>
));

const WalletScreen: React.FC<WalletScreenProps> = ({ balance, transactions, referralEarnings, onOpenHistory, onOpenWithdrawalHistory, pendingWithdrawals, totalWithdrawn }) => {
  const [view, setView] = useState<'main' | 'withdraw'>('main');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [withdrawalDetails, setWithdrawalDetails] = useState<{amount: number, method: string} | null>(null);

  const handleInitiateWithdrawal = (amount: number, method: string) => {
    setWithdrawalDetails({ amount, method });
    setShowConfirmModal(true);
  };

  const handleConfirmWithdrawal = () => {
    if (withdrawalDetails) {
      alert(`Withdrawal for $${withdrawalDetails.amount} via ${withdrawalDetails.method} initiated.`);
      // In a real app, update balance and add a transaction here.
    }
    setShowConfirmModal(false);
    setWithdrawalDetails(null);
    setView('main');
  };

  const handleCancelWithdrawal = () => {
    setShowConfirmModal(false);
    setWithdrawalDetails(null);
  };

  return (
    <>
      {view === 'main' ? (
         <div className="space-y-6 animate-fadeIn">
            <BalanceCard balance={balance} onWithdrawClick={() => setView('withdraw')} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoCard
                    icon={<i className="fa-solid fa-hourglass-half text-warning"></i>}
                    label="Pending Withdrawals"
                    value={`$${pendingWithdrawals.toFixed(2)}`}
                    note={pendingWithdrawals > 0 ? `Processing: approx. 15 days` : 'No pending withdrawals'}
                    colorClass="border-warning"
                />
                <InfoCard
                    icon={<i className="fa-solid fa-circle-check text-success"></i>}
                    label="Total Withdrawn"
                    value={`$${totalWithdrawn.toFixed(2)}`}
                    colorClass="border-success"
                />
            </div>

            <ReferralCard earnings={referralEarnings} />
            <div className="bg-white p-4 rounded-2xl shadow-md">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold text-dark">Withdrawal History</h2>
                    <button 
                        onClick={onOpenWithdrawalHistory} 
                        className="p-2 rounded-full text-primary hover:bg-primary/10 transition-colors"
                        aria-label="View withdrawal history"
                    >
                        <i className="fa-solid fa-clock-rotate-left text-2xl"></i>
                    </button>
                </div>
                <p className="text-sm text-gray mt-1">View all your past withdrawal requests.</p>
            </div>
        </div>
      ) : (
        <WithdrawalView 
            balance={balance} 
            onBack={() => setView('main')}
            onConfirmWithdrawal={handleInitiateWithdrawal}
        />
      )}

      {showConfirmModal && withdrawalDetails && (
        <ConfirmationModal 
            amount={withdrawalDetails.amount}
            method={withdrawalDetails.method}
            onConfirm={handleConfirmWithdrawal}
            onCancel={handleCancelWithdrawal}
        />
      )}
    </>
  );
};

export default WalletScreen;