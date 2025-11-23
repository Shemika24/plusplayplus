import React, { useState, useEffect } from 'react';

interface PaymentMethodDetails {
    id: string;
    name: string;
    icon: React.ReactNode;
    placeholder: string;
    inputType?: 'email' | 'text';
}

interface LinkAccountModalProps {
    isOpen: boolean;
    onClose: () => void;
    method: PaymentMethodDetails;
    onSave: (accountDetail: string) => void;
    currentValue?: string;
}

const LinkAccountModal: React.FC<LinkAccountModalProps> = ({ isOpen, onClose, method, onSave, currentValue }) => {
    const [accountDetail, setAccountDetail] = useState(currentValue || '');

    useEffect(() => {
        if (isOpen) {
            setAccountDetail(currentValue || '');
        }
    }, [isOpen, currentValue]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(accountDetail);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-[100] animate-fadeIn" onClick={onClose}>
            <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl shadow-lg max-w-sm w-11/12 relative animate-slideInUp" onClick={e => e.stopPropagation()}>
                <button type="button" className="absolute top-4 right-4 text-gray hover:text-dark" onClick={onClose} aria-label="Close">
                    <i className="fa-solid fa-xmark text-2xl"></i>
                </button>

                <div className="text-center mb-6">
                    <div className="inline-block mb-2">{method.icon}</div>
                    <h2 className="text-xl font-bold text-dark">Link {method.name} Account</h2>
                </div>

                <div>
                    <label htmlFor="account-detail" className="block text-sm font-bold text-gray mb-2">
                        Your {method.name} Details
                    </label>
                    <input
                        id="account-detail"
                        type={method.inputType || 'text'}
                        value={accountDetail}
                        onChange={(e) => setAccountDetail(e.target.value)}
                        placeholder={method.placeholder}
                        className="w-full px-4 py-3 border border-gray-medium rounded-lg bg-white focus:ring-2 focus:ring-primary focus:border-transparent"
                        required
                        autoFocus
                    />
                </div>

                <div className="flex gap-4 mt-6">
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-full bg-gray-medium text-dark font-bold py-3 rounded-xl transition-colors hover:bg-gray-400/50"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="w-full bg-success text-white font-bold py-3 rounded-xl shadow-lg shadow-success/30 transition-transform hover:scale-105"
                    >
                        Save
                    </button>
                </div>
            </form>
        </div>
    );
};

export default LinkAccountModal;
