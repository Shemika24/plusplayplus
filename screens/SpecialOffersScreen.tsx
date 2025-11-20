
import React from 'react';

const SpecialOffersScreen: React.FC = () => {
    const offers = [
        { id: 1, title: "Install & Open", reward: 500, description: "Download the app and open it for 30 seconds.", icon: "fa-solid fa-download", color: "bg-blue-100 text-blue-600" },
        { id: 2, title: "Complete Survey", reward: 1200, description: "Answer a few questions about your shopping habits.", icon: "fa-solid fa-clipboard-question", color: "bg-green-100 text-green-600" },
        { id: 3, title: "Play Game (Level 10)", reward: 2500, description: "Reach level 10 in the game to claim rewards.", icon: "fa-solid fa-gamepad", color: "bg-purple-100 text-purple-600" },
        { id: 4, title: "Sign Up", reward: 800, description: "Register a free account on the partner website.", icon: "fa-solid fa-user-plus", color: "bg-orange-100 text-orange-600" },
    ];

    return (
        <div className="flex flex-col h-full bg-gray-50">
            <div className="p-4 border-b border-gray-200 bg-white sticky top-0 z-10 flex items-center">
                <h1 className="text-lg font-bold text-gray-800">Special Offers</h1>
            </div>
            <div className="flex-1 overflow-y-auto p-4 pb-24 space-y-4">
                {offers.map((offer) => (
                    <div key={offer.id} className="bg-white rounded-xl shadow-md p-4 flex items-center border border-gray-100">
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-xl ${offer.color} mr-4 flex-shrink-0`}>
                            <i className={offer.icon}></i>
                        </div>
                        <div className="flex-1">
                            <h3 className="font-bold text-[var(--dark)]">{offer.title}</h3>
                            <p className="text-xs text-[var(--gray)] mt-1 line-clamp-2">{offer.description}</p>
                        </div>
                        <div className="flex flex-col items-end ml-2">
                            <span className="font-bold text-[var(--success)] text-sm mb-2">+{offer.reward}</span>
                            <button className="bg-[var(--primary)] text-white text-xs font-bold py-1.5 px-3 rounded-lg shadow hover:bg-[var(--primary-dark)] transition-colors">
                                Start
                            </button>
                        </div>
                    </div>
                ))}
                
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 text-center mt-6">
                    <i className="fa-solid fa-rotate-right text-blue-500 text-2xl mb-2"></i>
                    <h3 className="font-bold text-blue-800">Check back later!</h3>
                    <p className="text-sm text-blue-600 mt-1">We update our special offers daily.</p>
                </div>
            </div>
        </div>
    );
};

export default SpecialOffersScreen;
