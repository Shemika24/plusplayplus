import React, { useState, useEffect } from 'react';

const OfflineStatusDetector: React.FC = () => {
    const [isOnline, setIsOnline] = useState(navigator.onLine);

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    if (isOnline) {
        return null;
    }

    return (
        <>
            {/* Overlay */}
            <div
                className="fixed inset-0 bg-black bg-opacity-70 z-[100] transition-opacity duration-300 animate-fade-in"
                aria-hidden="true"
            ></div>

            {/* Modal */}
            <div
                className="fixed inset-0 z-[101] flex items-center justify-center p-4"
                role="dialog"
                aria-modal="true"
                aria-labelledby="offline-modal-title"
            >
                <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm text-center p-6 md:p-8 transform transition-all duration-300 scale-95 opacity-0 animate-modal-pop-in">
                    <div className="w-20 h-20 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-4 border-4 border-red-200">
                        <i className="fa-solid fa-wifi-slash text-red-500 text-4xl"></i>
                    </div>
                    <h2 id="offline-modal-title" className="text-2xl font-bold text-[var(--dark)] mb-2">
                        You're Offline
                    </h2>
                    <p className="text-[var(--gray)]">
                        Please check your internet connection to continue using the app. We'll reconnect you automatically.
                    </p>
                     <div className="mt-6">
                        <i className="fa-solid fa-spinner fa-spin text-3xl text-[var(--primary)]"></i>
                    </div>
                </div>
            </div>
             <style>{`
                @keyframes modal-pop-in {
                  to { transform: scale(1); opacity: 1; }
                }
                @keyframes fade-in {
                  to { opacity: 1; }
                }
                .animate-modal-pop-in {
                  animation: modal-pop-in 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
                }
                .animate-fade-in {
                  animation: fade-in 0.3s ease forwards;
                  opacity: 0;
                }
            `}</style>
        </>
    );
};

export default OfflineStatusDetector;
