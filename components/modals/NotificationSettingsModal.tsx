
import React, { useState } from 'react';
import Modal from '../Modal';
import { NotificationPreferences } from '../../types';

interface NotificationSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    preferences: NotificationPreferences;
    onSave: (newPreferences: NotificationPreferences) => Promise<void>;
}

const ToggleRow: React.FC<{ 
    icon: string; 
    label: string; 
    description: string; 
    checked: boolean; 
    onChange: (checked: boolean) => void 
}> = ({ icon, label, description, checked, onChange }) => (
    <div className="flex items-center justify-between py-4 border-b border-gray-100 last:border-b-0">
        <div className="flex items-start flex-1 mr-4">
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center mr-3 flex-shrink-0">
                <i className={`${icon} text-[var(--primary)] text-lg`}></i>
            </div>
            <div>
                <p className="font-bold text-sm text-[var(--dark)]">{label}</p>
                <p className="text-xs text-[var(--gray)] mt-0.5">{description}</p>
            </div>
        </div>
        
        <button 
            onClick={() => onChange(!checked)}
            className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ease-in-out relative ${checked ? 'bg-[var(--primary)]' : 'bg-gray-300'}`}
        >
            <div 
                className={`w-4 h-4 rounded-full bg-white shadow-md transform transition-transform duration-300 ${checked ? 'translate-x-6' : 'translate-x-0'}`}
            ></div>
        </button>
    </div>
);

const NotificationSettingsModal: React.FC<NotificationSettingsModalProps> = ({ isOpen, onClose, preferences, onSave }) => {
    const [localPrefs, setLocalPrefs] = useState<NotificationPreferences>(preferences);
    const [isSaving, setIsSaving] = useState(false);

    const handleToggle = (key: keyof NotificationPreferences) => {
        setLocalPrefs(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await onSave(localPrefs);
            onClose();
        } catch (error) {
            console.error("Failed to save notification preferences", error);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Notification Settings">
            <div className="p-4">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 px-2 mb-6">
                    <ToggleRow 
                        icon="fa-solid fa-money-bill-transfer" 
                        label="Withdrawals" 
                        description="Updates on payment status & transactions"
                        checked={localPrefs.withdrawals}
                        onChange={() => handleToggle('withdrawals')}
                    />
                    
                    <ToggleRow 
                        icon="fa-solid fa-calendar-check" 
                        label="Daily Reminders" 
                        description="Don't miss your check-in streak"
                        checked={localPrefs.dailyCheckIn}
                        onChange={() => handleToggle('dailyCheckIn')}
                    />
                    
                    <ToggleRow 
                        icon="fa-solid fa-dharmachakra" 
                        label="Lucky Wheel & Games" 
                        description="When spins or energy are restored"
                        checked={localPrefs.luckyWheel}
                        onChange={() => handleToggle('luckyWheel')}
                    />
                    
                    <ToggleRow 
                        icon="fa-solid fa-users" 
                        label="Referrals" 
                        description="New signups and commission earnings"
                        checked={localPrefs.referrals}
                        onChange={() => handleToggle('referrals')}
                    />
                    
                    <ToggleRow 
                        icon="fa-solid fa-bullhorn" 
                        label="Announcements" 
                        description="App updates, news, and special offers"
                        checked={localPrefs.announcements}
                        onChange={() => handleToggle('announcements')}
                    />
                </div>
                
                <button 
                    onClick={handleSave}
                    disabled={isSaving}
                    className="w-full bg-[var(--primary)] text-white font-bold py-3 rounded-xl shadow-lg hover:bg-[var(--primary-dark)] transition-all disabled:opacity-70"
                >
                    {isSaving ? (
                        <><i className="fa-solid fa-spinner fa-spin mr-2"></i>Saving...</>
                    ) : (
                        'Save Preferences'
                    )}
                </button>
            </div>
        </Modal>
    );
};

export default NotificationSettingsModal;
