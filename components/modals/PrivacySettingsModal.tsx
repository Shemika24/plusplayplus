
import React, { useState } from 'react';
import Modal from '../Modal';
import { PrivacySettings } from '../../types';

interface PrivacySettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    settings: PrivacySettings;
    onSave: (newSettings: PrivacySettings) => Promise<void>;
}

const ToggleRow: React.FC<{ 
    icon: string; 
    label: string; 
    description: string; 
    checked: boolean; 
    onChange: (checked: boolean) => void 
}> = ({ icon, label, description, checked, onChange }) => (
    <div className="flex items-center justify-between py-4 border-b border-[var(--border-color)] last:border-b-0">
        <div className="flex items-start flex-1 mr-4">
            <div className="w-10 h-10 rounded-full bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center mr-3 flex-shrink-0">
                <i className={`${icon} text-purple-600 text-lg`}></i>
            </div>
            <div>
                <p className="font-bold text-sm text-[var(--dark)]">{label}</p>
                <p className="text-xs text-[var(--gray)] mt-0.5">{description}</p>
            </div>
        </div>
        
        <button 
            onClick={() => onChange(!checked)}
            className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ease-in-out relative ${checked ? 'bg-purple-600' : 'bg-gray-300'}`}
        >
            <div 
                className={`w-4 h-4 rounded-full bg-white shadow-md transform transition-transform duration-300 ${checked ? 'translate-x-6' : 'translate-x-0'}`}
            ></div>
        </button>
    </div>
);

const PrivacySettingsModal: React.FC<PrivacySettingsModalProps> = ({ isOpen, onClose, settings, onSave }) => {
    const [localSettings, setLocalSettings] = useState<PrivacySettings>(settings);
    const [isSaving, setIsSaving] = useState(false);

    const handleToggle = (key: keyof PrivacySettings) => {
        setLocalSettings(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await onSave(localSettings);
            onClose();
        } catch (error) {
            console.error("Failed to save privacy settings", error);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Privacy Settings">
            <div className="p-4">
                <div className="bg-[var(--bg-card)] rounded-xl shadow-sm border border-[var(--border-color)] px-2 mb-6">
                    <ToggleRow 
                        icon="fa-solid fa-trophy" 
                        label="Rank Visibility" 
                        description="Show my profile in the Top Earners list"
                        checked={localSettings.showInRanking}
                        onChange={() => handleToggle('showInRanking')}
                    />
                    
                    <ToggleRow 
                        icon="fa-solid fa-bullseye" 
                        label="Ad Personalization" 
                        description="Use data to show relevant ads"
                        checked={localSettings.allowPersonalizedAds}
                        onChange={() => handleToggle('allowPersonalizedAds')}
                    />
                    
                    <ToggleRow 
                        icon="fa-solid fa-user-group" 
                        label="Referral Privacy" 
                        description="Show my real name to my referrals"
                        checked={localSettings.visibleToReferrals}
                        onChange={() => handleToggle('visibleToReferrals')}
                    />
                    
                    <ToggleRow 
                        icon="fa-solid fa-toggle-on" 
                        label="Online Status" 
                        description="Let others see when I am active"
                        checked={localSettings.showOnlineStatus}
                        onChange={() => handleToggle('showOnlineStatus')}
                    />
                </div>
                
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-100 dark:border-yellow-800 rounded-xl p-3 mb-6 flex items-start">
                    <i className="fa-solid fa-shield-halved text-yellow-600 mt-1 mr-3"></i>
                    <p className="text-xs text-yellow-800 dark:text-yellow-200">
                        We value your privacy. Your sensitive data (email, phone, payment info) is never shared publicly, regardless of these settings.
                    </p>
                </div>
                
                <button 
                    onClick={handleSave}
                    disabled={isSaving}
                    className="w-full bg-purple-600 text-white font-bold py-3 rounded-xl shadow-lg hover:bg-purple-700 transition-all disabled:opacity-70"
                >
                    {isSaving ? (
                        <><i className="fa-solid fa-spinner fa-spin mr-2"></i>Saving...</>
                    ) : (
                        'Save Settings'
                    )}
                </button>
            </div>
        </Modal>
    );
};

export default PrivacySettingsModal;
