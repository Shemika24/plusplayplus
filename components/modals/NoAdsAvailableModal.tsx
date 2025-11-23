import React from 'react';

interface NoAdsAvailableModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const NoAdsAvailableModal: React.FC<NoAdsAvailableModalProps> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-[110] animate-fadeIn" onClick={onClose}>
            <div className="bg-white p-6 rounded-2xl shadow-lg w-11/12 max-w-sm text-center animate-slideInUp" onClick={e => e.stopPropagation()}>
                <i className="fa-solid fa-triangle-exclamation text-6xl mx-auto text-warning mb-4"></i>
                <h2 className="text-2xl font-bold text-dark mb-2">No Ads Available</h2>
                <p className="text-gray mb-6">
                    We couldn't find an ad to show you at this moment. Please try again later.
                </p>
                <button
                    onClick={onClose}
                    className="w-full bg-primary text-white font-bold py-3 rounded-xl shadow-lg shadow-primary/30 transition-transform hover:scale-105"
                >
                    OK
                </button>
            </div>
        </div>
    );
};

export default NoAdsAvailableModal;
