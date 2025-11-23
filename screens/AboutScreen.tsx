
import React from 'react';

const AboutScreen: React.FC = () => {
    return (
        <div className="flex flex-col h-full bg-[var(--gray-light)]">
            <div className="p-4 border-b border-[var(--border-color)] bg-[var(--bg-card)] sticky top-0 z-10 flex items-center">
                <h1 className="text-lg font-bold text-[var(--dark)]">About App</h1>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
                <div className="flex flex-col items-center mb-8 animate-fadeIn">
                    <div className="w-24 h-24 bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] rounded-3xl flex items-center justify-center shadow-lg mb-4">
                        <i className="fa-solid fa-gem text-white text-5xl"></i>
                    </div>
                    <h2 className="text-2xl font-bold text-[var(--dark)]">DYVERZE ADS</h2>
                    <p className="text-[var(--gray)] font-medium">Version 2.1.0</p>
                </div>

                <div className="bg-[var(--bg-card)] rounded-xl shadow-sm border border-[var(--border-color)] p-5 mb-6">
                    <h3 className="font-bold text-[var(--dark)] mb-3">Our Mission</h3>
                    <p className="text-sm text-[var(--gray)] leading-relaxed">
                        DYVERZE ADS is dedicated to providing a seamless platform where users can turn their spare time into real rewards. We connect you with advertisers and share the revenue directly with you through a secure and engaging experience.
                    </p>
                </div>

                <div className="bg-[var(--bg-card)] rounded-xl shadow-sm border border-[var(--border-color)] overflow-hidden mb-6">
                    <div className="p-4 border-b border-[var(--border-color)]">
                        <h3 className="font-bold text-[var(--dark)]">Key Features</h3>
                    </div>
                    <div className="divide-y divide-[var(--border-color)]">
                        <FeatureRow icon="fa-list-check" color="text-blue-500" text="Daily Tasks & Ads" />
                        <FeatureRow icon="fa-dharmachakra" color="text-purple-500" text="Lucky Wheel & Games" />
                        <FeatureRow icon="fa-money-bill-transfer" color="text-green-500" text="Fast Withdrawals" />
                        <FeatureRow icon="fa-users" color="text-orange-500" text="Referral Program" />
                        <FeatureRow icon="fa-shield-halved" color="text-red-500" text="Secure & Private" />
                    </div>
                </div>

                <div className="text-center space-y-4 mb-8">
                    <button onClick={() => window.open('https://t.me/dyverze_ads_announcement', '_blank')} className="text-[var(--primary)] hover:underline text-sm font-medium flex items-center justify-center gap-2 w-full">
                        <i className="fa-brands fa-telegram text-lg"></i> Join Telegram Channel
                    </button>
                    <div className="text-xs text-[var(--gray)]">
                        &copy; 2024 Dyverze Inc. All rights reserved.
                    </div>
                </div>
            </div>
             <style>{`
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                .animate-fadeIn { animation: fadeIn 0.5s ease-out forwards; }
            `}</style>
        </div>
    );
};

const FeatureRow: React.FC<{ icon: string; color: string; text: string }> = ({ icon, color, text }) => (
    <div className="flex items-center p-3 hover:bg-[var(--bg-card-hover)] transition-colors">
        <div className="w-8 h-8 rounded-full bg-[var(--bg-input)] flex items-center justify-center mr-3">
            <i className={`fa-solid ${icon} ${color}`}></i>
        </div>
        <span className="text-sm font-medium text-[var(--dark)]">{text}</span>
    </div>
);

export default AboutScreen;
