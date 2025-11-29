
import React, { useState } from 'react';

const FAQItem: React.FC<{ question: string; answer: string; isOpen: boolean; onClick: () => void }> = ({ question, answer, isOpen, onClick }) => {
    return (
        <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)] overflow-hidden transition-all duration-300">
            <button 
                onClick={onClick}
                className="w-full flex items-center justify-between p-4 text-left focus:outline-none hover:bg-[var(--bg-card-hover)] transition-colors"
            >
                <span className="font-bold text-[var(--dark)] text-sm pr-4">{question}</span>
                <i className={`fa-solid fa-chevron-down text-[var(--gray)] transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}></i>
            </button>
            <div 
                className={`overflow-hidden transition-all duration-300 bg-[var(--bg-input)] ${isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}
            >
                <div className="p-4 pt-2 text-sm text-[var(--gray)] leading-relaxed">
                    {answer}
                </div>
            </div>
        </div>
    );
};

const HelpCenterScreen: React.FC = () => {
    const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

    const faqs = [
        {
            question: "How do I earn points?",
            answer: "You can earn points by completing tasks in the 'Tasks' tab, spinning the Lucky Wheel, checking in daily, and referring friends. Premium tasks and special offers provide higher rewards."
        },
        {
            question: "When can I withdraw my earnings?",
            answer: "You can withdraw your earnings once you reach the minimum threshold for your selected payment method (e.g., $5.00 for PayPal). Go to the Wallet screen to request a withdrawal."
        },
        {
            question: "How long do withdrawals take?",
            answer: "Withdrawal requests are typically processed within 15 business days. Please ensure your payment details are correct to avoid delays."
        },
        {
            question: "My task points weren't added. What do I do?",
            answer: "Points are usually added immediately. If you experience a delay, check your internet connection and refresh the app. If the issue persists, try clearing the cache or contact support."
        },
        {
            question: "How does the referral program work?",
            answer: "Share your unique link with friends. You earn a $0.10 bonus for every new user, plus a lifetime 10% commission on their task earnings."
        },
        {
            question: "Can I change my profile information?",
            answer: "Yes, go to the Profile screen to edit your Bio and Full Name. Note that sensitive info like Email and DOB cannot be changed after setup for security reasons."
        }
    ];

    const handleEmailSupport = () => {
        window.location.href = "mailto:support@dyverzeads.com?subject=Support Request";
    };

    const handleTelegramSupport = () => {
        const url = "https://t.me/dyverze_ads_support";
        if (window.Telegram?.WebApp) {
            window.Telegram.WebApp.openTelegramLink(url);
        } else {
            window.open(url, '_blank');
        }
    };

    return (
        <div className="flex flex-col h-full bg-[var(--gray-light)]">
            <div className="p-4 border-b border-[var(--border-color)] bg-[var(--bg-card)] sticky top-0 z-10 flex items-center">
                <h1 className="text-lg font-bold text-[var(--dark)]">Help Center</h1>
            </div>

            <div className="flex-1 overflow-y-auto p-4 md:p-6 pb-32">
                {/* Hero Section */}
                <div className="text-center mb-8 animate-fadeIn">
                    <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-blue-100 dark:border-blue-800">
                        <i className="fa-solid fa-life-ring text-4xl text-[var(--primary)]"></i>
                    </div>
                    <h2 className="text-2xl font-bold text-[var(--dark)]">How can we help?</h2>
                    <p className="text-[var(--gray)] mt-2 text-sm">Find answers to common questions or contact our support team.</p>
                </div>

                {/* Contact Options */}
                <div className="grid grid-cols-2 gap-4 mb-8">
                    <button 
                        onClick={handleEmailSupport}
                        className="bg-[var(--bg-card)] p-4 rounded-xl shadow-sm border border-[var(--border-color)] flex flex-col items-center hover:border-[var(--primary)] transition-colors group"
                    >
                        <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                            <i className="fa-regular fa-envelope text-orange-500 text-xl"></i>
                        </div>
                        <span className="font-bold text-[var(--dark)] text-sm">Email Support</span>
                    </button>

                    <button 
                        onClick={handleTelegramSupport}
                        className="bg-[var(--bg-card)] p-4 rounded-xl shadow-sm border border-[var(--border-color)] flex flex-col items-center hover:border-[var(--primary)] transition-colors group"
                    >
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                            <i className="fa-brands fa-telegram text-blue-500 text-xl"></i>
                        </div>
                        <span className="font-bold text-[var(--dark)] text-sm">Telegram Chat</span>
                    </button>
                </div>

                {/* FAQ Section */}
                <h3 className="font-bold text-[var(--dark)] mb-4 text-lg">Frequently Asked Questions</h3>
                <div className="space-y-3">
                    {faqs.map((faq, index) => (
                        <FAQItem 
                            key={index}
                            question={faq.question}
                            answer={faq.answer}
                            isOpen={openFaqIndex === index}
                            onClick={() => setOpenFaqIndex(openFaqIndex === index ? null : index)}
                        />
                    ))}
                </div>

                {/* Bottom Text */}
                <div className="mt-8 text-center bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-xl border border-yellow-100 dark:border-yellow-800">
                    <i className="fa-solid fa-lightbulb text-yellow-500 mb-2 text-xl"></i>
                    <p className="text-xs text-yellow-800 dark:text-yellow-200">
                        Tip: Check the "About App" section for more details about the latest version and features.
                    </p>
                </div>
            </div>
             <style>{`
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                .animate-fadeIn { animation: fadeIn 0.5s ease-out forwards; }
            `}</style>
        </div>
    );
};

export default HelpCenterScreen;
