import React from 'react';
import { ReferredUser } from '../../types';

interface InvitedFriendsModalProps {
    isOpen: boolean;
    onClose: () => void;
    friends: ReferredUser[];
}

const InvitedFriendsModal: React.FC<InvitedFriendsModalProps> = ({ isOpen, onClose, friends }) => {
    if (!isOpen) return null;
    
    return (
        <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-[100] animate-fadeIn" onClick={onClose}>
            <div className="bg-white p-6 rounded-2xl shadow-lg max-w-sm w-11/12 h-[80vh] flex flex-col relative animate-slideInUp" onClick={e => e.stopPropagation()}>
                <button className="absolute top-4 right-4 text-gray hover:text-dark" onClick={onClose} aria-label="Close">
                    <i className="fa-solid fa-xmark text-2xl"></i>
                </button>
                <h2 className="text-2xl font-bold text-center text-dark mb-6">Invited Friends ({friends.length})</h2>
                
                {friends.length === 0 ? (
                    <div className="flex-grow flex items-center justify-center text-center text-gray">
                        <p>You haven't invited anyone yet.<br/>Share your link to start earning!</p>
                    </div>
                ) : (
                    <div className="flex-grow overflow-y-auto pr-2 space-y-3">
                        {friends.map(friend => (
                            <div key={friend.telegramId} className="flex items-center gap-4 py-2 px-3 bg-gray-light rounded-xl">
                                <div className="flex-shrink-0">
                                    {friend.photo_url ? (
                                        <img src={friend.photo_url} alt={friend.username} className="w-12 h-12 rounded-full object-cover"/>
                                    ) : (
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-secondary to-accent-secondary flex items-center justify-center text-white font-bold text-xl">
                                            {friend.username.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                </div>
                                <div className="flex-grow min-w-0">
                                    <p className="font-bold text-dark truncate">@{friend.username}</p>
                                    <p className="text-xs text-gray">ID: {friend.telegramId}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default InvitedFriendsModal;