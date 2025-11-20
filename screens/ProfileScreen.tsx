

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { UserProfile, NotificationPreferences, PrivacySettings, PaymentDetails } from '../types';
import { updateUserProfile, deleteUserData } from '../services/firestoreService';
import { deleteCurrentUser, changeUserPassword } from '../services/authService';
import Modal from '../components/Modal';
import InfoModal from '../components/modals/InfoModal';
import NotificationSettingsModal from '../components/modals/NotificationSettingsModal';
import PrivacySettingsModal from '../components/modals/PrivacySettingsModal';
import PaymentMethodModal from '../components/modals/PaymentMethodModal';
import { serverTimestamp } from 'firebase/firestore';

// --- Data & Types ---
interface Country {
  code: string;
  flagUrl: string;
  name: string;
}

interface ApiCountry {
    name: { common: string };
    idd: { root?: string; suffixes?: string[] };
    flags: { svg: string };
}

// --- Sub-Components ---
const InfoRow: React.FC<{ icon: string; label: string; value: string; isEditable?: boolean; onChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void; name?: string; type?: string; as?: 'textarea' }> = 
({ icon, label, value, isEditable = false, onChange, name, type = 'text', as }) => {
    
    if (isEditable) {
        const commonProps = {
            name,
            id: name,
            value: value || '',
            onChange,
            className: "mt-1 w-full p-2 bg-[var(--gray-light)] border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:outline-none transition"
        };
        return (
            <div className="flex items-start py-3 border-b border-gray-100 last:border-b-0">
                <i className={`${icon} text-[var(--gray)] w-6 text-center mr-4 pt-3`}></i>
                <div className="w-full">
                    <label htmlFor={name} className="text-xs text-[var(--gray)]">{label}</label>
                    {as === 'textarea' ? (
                        <textarea {...commonProps} rows={3} />
                    ) : (
                        <input {...commonProps} type={type} />
                    )}
                </div>
            </div>
        );
    }
    
    return (
        <div className="flex items-center py-3 border-b border-gray-100 last:border-b-0">
            <i className={`${icon} text-[var(--gray)] w-6 text-center mr-4`}></i>
            <div>
                <p className="text-xs text-[var(--gray)]">{label}</p>
                <p className="font-semibold text-[var(--dark)] whitespace-pre-wrap">{value || 'Not set'}</p>
            </div>
        </div>
    );
};


const SettingsRow: React.FC<{ icon: string; label: string; onClick?: () => void; isDestructive?: boolean; value?: string | React.ReactNode }> = ({ icon, label, onClick, isDestructive = false, value }) => (
    <button onClick={onClick} className={`w-full flex items-center justify-between py-3.5 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors duration-200 rounded-lg`}>
        <div className="flex items-center flex-1 min-w-0">
             <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 flex-shrink-0 ${isDestructive ? 'bg-red-50' : 'bg-gray-100'}`}>
                <i className={`${icon} ${isDestructive ? 'text-red-500' : 'text-[var(--dark)]'}`}></i>
            </div>
            <div className="text-left flex-1 min-w-0">
                <p className={`font-semibold ${isDestructive ? 'text-red-600' : 'text-[var(--dark)]'}`}>{label}</p>
                {value && <div className="text-xs text-[var(--gray)] mt-0.5 truncate">{value}</div>}
            </div>
        </div>
        {!isDestructive && <i className="fa-solid fa-chevron-right text-[var(--gray)] ml-2 flex-shrink-0"></i>}
    </button>
);

// --- Change Password Modal ---
const ChangePasswordModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setError('');
            setSuccess(false);
            setLoading(false);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        
        if (newPassword !== confirmPassword) {
            setError("New passwords do not match.");
            return;
        }
        if (newPassword.length < 6) {
            setError("Password must be at least 6 characters long.");
            return;
        }
        if (currentPassword === newPassword) {
            setError("New password cannot be the same as the old password.");
            return;
        }

        setLoading(true);
        try {
            await changeUserPassword(currentPassword, newPassword);
            setSuccess(true);
            setTimeout(() => {
                onClose();
            }, 2000);
        } catch (err: any) {
            setError(err.message);
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Change Password">
            {success ? (
                 <div className="text-center p-6 animate-fadeIn">
                    <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-4 border-4 border-green-200">
                        <i className="fa-solid fa-check text-green-500 text-3xl"></i>
                    </div>
                    <h3 className="text-xl font-bold text-[var(--dark)]">Password Updated!</h3>
                    <p className="text-[var(--gray)] mt-2">Your password has been successfully changed.</p>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="p-2 space-y-4">
                    {error && (
                         <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-start animate-fadeIn">
                            <i className="fa-solid fa-circle-exclamation mt-0.5 mr-2 flex-shrink-0"></i>
                            <span>{error}</span>
                        </div>
                    )}
                    
                    <div>
                        <label className="block text-xs font-bold text-[var(--gray)] mb-1 uppercase">Current Password</label>
                        <div className="relative">
                            <input 
                                type={showCurrentPassword ? "text" : "password"}
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:outline-none"
                                placeholder="Enter current password"
                                required
                            />
                             <button
                                type="button"
                                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                            >
                                <i className={`fa-solid ${showCurrentPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-[var(--gray)] mb-1 uppercase">New Password</label>
                        <div className="relative">
                             <input 
                                type={showNewPassword ? "text" : "password"}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:outline-none"
                                placeholder="Enter new password (min. 6 chars)"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowNewPassword(!showNewPassword)}
                                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                            >
                                <i className={`fa-solid ${showNewPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                            </button>
                        </div>
                    </div>

                     <div>
                        <label className="block text-xs font-bold text-[var(--gray)] mb-1 uppercase">Confirm New Password</label>
                        <input 
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:outline-none"
                            placeholder="Re-enter new password"
                            required
                        />
                    </div>

                    <div className="pt-2">
                        <button 
                            type="submit" 
                            disabled={loading}
                            className="w-full bg-[var(--primary)] text-white font-bold py-3 rounded-xl shadow-lg hover:bg-[var(--primary-dark)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? <><i className="fa-solid fa-spinner fa-spin mr-2"></i>Updating...</> : 'Update Password'}
                        </button>
                    </div>
                </form>
            )}
             <style>{`
                @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
                .animate-fadeIn { animation: fadeIn 0.2s ease-out forwards; }
            `}</style>
        </Modal>
    );
}

// --- Delete Confirmation Modal ---
interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

const CONFIRMATION_TEXT = 'delete_my_account';

const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({ isOpen, onClose, onConfirm }) => {
  const [inputText, setInputText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');

  const isConfirmed = inputText === CONFIRMATION_TEXT;

  const handleDelete = async () => {
    if (!isConfirmed) return;
    setIsDeleting(true);
    setError('');
    try {
      await onConfirm();
      // On success, the app will log out and navigate away.
    } catch (e: any) {
      setError(e.message || 'An unexpected error occurred.');
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    if (isDeleting) return;
    setInputText('');
    setError('');
    setIsDeleting(false);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="" isDismissible={!isDeleting}>
      <div className="text-center p-6">
        <div className="w-20 h-20 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-4 border-4 border-red-200">
          <i className="fa-solid fa-triangle-exclamation text-red-500 text-4xl"></i>
        </div>
        <h3 className="text-2xl font-bold text-[var(--dark)] mb-2">Are you sure?</h3>
        <p className="text-[var(--gray)]">
          This action is irreversible. All your data, including points and earnings history, will be permanently deleted.
        </p>
        <p className="text-[var(--gray)] mt-4">
          To confirm, please type "<strong className="text-red-600">{CONFIRMATION_TEXT}</strong>" in the box below.
        </p>

        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          className="mt-4 w-full p-3 bg-[var(--gray-light)] border border-gray-200 rounded-lg focus:ring-2 focus:ring-[var(--error)] focus:outline-none transition text-center"
          placeholder={CONFIRMATION_TEXT}
          disabled={isDeleting}
        />

        {error && <p className="text-red-500 text-sm text-center bg-red-100 p-3 rounded-lg mt-4">{error}</p>}

        <div className="mt-6 flex flex-col sm:flex-row-reverse gap-3">
          <button
            onClick={handleDelete}
            disabled={!isConfirmed || isDeleting}
            className="w-full font-bold py-3 rounded-xl shadow-lg transition-all bg-red-600 text-white hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isDeleting ? <><i className="fa-solid fa-spinner fa-spin mr-2"></i>Deleting...</> : 'Delete My Account'}
          </button>
          <button
            onClick={handleClose}
            disabled={isDeleting}
            className="w-full font-bold py-3 rounded-xl shadow-lg transition-transform hover:scale-105 bg-gray-200 text-[var(--dark)] disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  );
};

interface ProfileScreenProps {
    userProfile: UserProfile;
    onProfileUpdate: (data: Partial<UserProfile>) => void;
}

// --- Main Component ---
const ProfileScreen: React.FC<ProfileScreenProps> = ({ userProfile, onProfileUpdate }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState<Partial<UserProfile>>(userProfile);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    
    const [countries, setCountries] = useState<Country[]>([]);
    const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [countrySearch, setCountrySearch] = useState('');
    const [isLoadingCountries, setIsLoadingCountries] = useState(true);
    const dropdownRef = useRef<HTMLDivElement>(null);
    
    const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
    const [settingsModalContent, setSettingsModalContent] = useState<{ title: string; message: string } | null>(null);
    const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
    const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
    const [isPaymentMethodModalOpen, setIsPaymentMethodModalOpen] = useState(false);
    
    // New state for change password modal
    const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);

    const { canEditPhone, timeLeftForPhoneEdit } = useMemo(() => {
        const lastUpdate = userProfile.lastPhoneUpdate?.toDate();
        if (!lastUpdate) {
            return { canEditPhone: true, timeLeftForPhoneEdit: '' };
        }
    
        const thirtyDaysInMillis = 30 * 24 * 60 * 60 * 1000;
        const nextUpdateTime = new Date(lastUpdate.getTime() + thirtyDaysInMillis);
        const now = new Date();
    
        if (now >= nextUpdateTime) {
            return { canEditPhone: true, timeLeftForPhoneEdit: '' };
        }
    
        const diff = nextUpdateTime.getTime() - now.getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((diff / 1000 / 60) % 60);
    
        return {
            canEditPhone: false,
            timeLeftForPhoneEdit: `${days}d ${hours}h ${minutes}m`,
        };
    }, [userProfile.lastPhoneUpdate]);

    useEffect(() => {
        setFormData(userProfile);
    }, [userProfile]);

    useEffect(() => {
        const fetchCountries = async () => {
            setIsLoadingCountries(true);
            try {
                const response = await fetch('https://restcountries.com/v3.1/all?fields=name,idd,flags');
                if (!response.ok) throw new Error('Failed to fetch');
                const data: ApiCountry[] = await response.json();
                
                const formattedCountries: Country[] = data
                    .filter(c => c.idd?.root && c.idd.suffixes)
                    .flatMap(c => {
                        const root = c.idd.root;
                        // Handle cases like USA with multiple suffixes
                        return c.idd.suffixes!.map(suffix => ({
                            name: c.name.common,
                            code: `${root}${suffix}`,
                            flagUrl: c.flags.svg
                        }));
                    })
                    .filter((c, index, self) => index === self.findIndex((t) => (t.code === c.code && t.name === c.name))) // Ensure unique
                    .sort((a, b) => a.name.localeCompare(b.name));
                
                setCountries(formattedCountries);
                setSelectedCountry(formattedCountries.find(c => c.code === '+1') || formattedCountries[0]);
            } catch (error) {
                console.error("Could not fetch country codes:", error);
                // Fallback or error state can be handled here
            } finally {
                setIsLoadingCountries(false);
            }
        };

        fetchCountries();
    }, []);


    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        const dataToUpdate: Partial<UserProfile> = {
            fullName: formData.fullName,
            bio: formData.bio,
        };
        
        const phoneHasChanged = formData.phone !== userProfile.phone;
    
        if (phoneHasChanged) {
            if (!canEditPhone) {
                alert(`You can only update your phone number once every 30 days. Time left: ${timeLeftForPhoneEdit}`);
                return;
            }
            dataToUpdate.phone = formData.phone;
            dataToUpdate.lastPhoneUpdate = serverTimestamp();
        }
    
        try {
            await updateUserProfile(userProfile.uid, dataToUpdate);
            onProfileUpdate(formData); // Optimistic update
            setIsEditing(false);
        } catch (error) {
            console.error("Failed to update profile:", error);
            alert("Could not save changes. Please try again.");
        }
    };

    const handleNotificationSave = async (newPreferences: NotificationPreferences) => {
        try {
             await updateUserProfile(userProfile.uid, { notificationPreferences: newPreferences });
             onProfileUpdate({ notificationPreferences: newPreferences });
        } catch (error) {
             console.error("Failed to save notification preferences", error);
             throw error;
        }
    };
    
    const handlePrivacySave = async (newSettings: PrivacySettings) => {
        try {
             await updateUserProfile(userProfile.uid, { privacySettings: newSettings });
             onProfileUpdate({ privacySettings: newSettings });
        } catch (error) {
             console.error("Failed to save privacy settings", error);
             throw error;
        }
    };
    
    const handlePaymentMethodSave = async (newMethodsList: PaymentDetails[]) => {
        try {
            await updateUserProfile(userProfile.uid, { savedPaymentMethods: newMethodsList });
            onProfileUpdate({ savedPaymentMethods: newMethodsList });
        } catch (error) {
            console.error("Failed to save payment details", error);
            throw error;
        }
    };

    const handleCancel = () => {
        setFormData(userProfile);
        setIsEditing(false);
    };

    const handleDeleteAccount = async () => {
        await deleteUserData(userProfile.uid);
        await deleteCurrentUser();
        // After this, onAuthStateChanged in App.tsx will handle navigation to AuthScreen
    };

    const filteredCountries = countries.filter(c =>
        c.name.toLowerCase().includes(countrySearch.toLowerCase()) || c.code.includes(countrySearch)
    );

    const getPaymentMethodDisplayText = () => {
        const methods = userProfile.savedPaymentMethods || [];
        if (methods.length === 0) return 'Not Set';
        if (methods.length === 1) {
            const m = methods[0];
            return `${m.method} ${m.cryptoName ? `(${m.cryptoName})` : ''}`;
        }
        return `${methods.length} Methods Linked`;
    };

    return (
        <div className="bg-gray-50 pb-24 min-h-full">
            {/* Profile Header */}
            <div className="bg-gradient-to-b from-white to-gray-50 p-6 flex flex-col items-center text-center border-b border-gray-200">
                <div className="relative">
                    {userProfile.avatarUrl ? (
                         <img src={userProfile.avatarUrl} alt="User Avatar" className="w-24 h-24 rounded-full border-4 border-white shadow-lg bg-gray-300 object-cover" />
                    ) : (
                        <div className="w-24 h-24 rounded-full border-4 border-white shadow-lg bg-gray-300 flex items-center justify-center">
                            <i className="fa-solid fa-user text-5xl text-gray-500"></i>
                        </div>
                    )}
                    <button className="absolute -bottom-1 -right-1 w-8 h-8 bg-[var(--primary)] text-white rounded-full flex items-center justify-center border-2 border-white shadow-md hover:bg-[var(--primary-dark)] transition-colors">
                        <i className="fa-solid fa-camera"></i>
                    </button>
                </div>
                
                <h2 className="text-2xl font-bold text-[var(--dark)] mt-4">{formData.fullName || ''}</h2>
                <p className="text-sm text-[var(--gray)]">@{formData.username}</p>
            </div>

            <div className="p-4 md:p-6 space-y-6">
                {/* Personal Information */}
                <div className="bg-white rounded-xl shadow-lg p-4">
                    <div className="flex justify-between items-center mb-2 px-1">
                        <div className="flex items-center gap-2">
                           <h3 className="font-bold text-lg text-[var(--dark)]">Personal Information</h3>
                           <button onClick={() => setIsInfoModalOpen(true)} className="text-[var(--gray)] hover:text-[var(--primary)] transition-colors text-lg">
                                <i className="fa-solid fa-circle-info"></i>
                           </button>
                        </div>
                        {isEditing ? (
                            <div className="flex gap-3">
                                <button onClick={handleSave} className="text-green-500 hover:text-green-600 text-xl w-8 h-8 flex items-center justify-center rounded-full hover:bg-green-100 transition-colors" aria-label="Save changes">
                                    <i className="fa-solid fa-check"></i>
                                </button>
                                <button onClick={handleCancel} className="text-red-500 hover:text-red-600 text-xl w-8 h-8 flex items-center justify-center rounded-full hover:bg-red-100 transition-colors" aria-label="Cancel editing">
                                    <i className="fa-solid fa-times"></i>
                                </button>
                            </div>
                        ) : (
                            <button onClick={() => setIsEditing(true)} className="text-[var(--primary)] hover:text-[var(--primary-dark)] text-lg w-8 h-8 flex items-center justify-center rounded-full hover:bg-blue-100 transition-colors" aria-label="Edit profile">
                                <i className="fa-solid fa-pencil"></i>
                            </button>
                        )}
                    </div>
                    <InfoRow icon="fa-solid fa-user" label="Full Name" value={formData.fullName || ''} name="fullName" onChange={handleFormChange} isEditable={isEditing} />
                    <InfoRow icon="fa-solid fa-envelope" label="Email" value={formData.email || ''} isEditable={false} />
                    <InfoRow icon="fa-solid fa-align-left" label="Bio" value={formData.bio || ''} name="bio" onChange={handleFormChange} isEditable={isEditing} as="textarea" />
                    <InfoRow icon="fa-solid fa-cake-candles" label="Date of Birth" value={formData.dob || ''} isEditable={false} />
                    <InfoRow icon="fa-solid fa-location-dot" label="Address" value={formData.address || ''} isEditable={false} />

                    {/* Phone Number Input */}
                    <div className="flex items-start py-3">
                         <i className="fa-solid fa-phone text-[var(--gray)] w-6 text-center mr-4 pt-2"></i>
                        <div className="w-full">
                            <p className="text-xs text-[var(--gray)]">Phone Number</p>
                            <div className="flex items-center mt-1">
                                <div className="relative" ref={dropdownRef}>
                                    <button 
                                        onClick={() => setIsDropdownOpen(!isDropdownOpen)} 
                                        disabled={!isEditing}
                                        className="flex items-center justify-center h-10 w-28 bg-gray-100 rounded-l-md border border-r-0 border-gray-300 disabled:bg-gray-200 disabled:cursor-not-allowed"
                                    >
                                        {isLoadingCountries ? <i className="fa-solid fa-spinner fa-spin"></i> : (
                                            selectedCountry && <>
                                                <img src={selectedCountry.flagUrl} alt="" className="w-5 h-auto mr-2" />
                                                <span className="text-sm font-semibold">{selectedCountry.code}</span>
                                            </>
                                        )}
                                    </button>
                                    {isDropdownOpen && isEditing && (
                                        <div className="absolute z-10 bottom-full mb-2 w-64 bg-white border border-gray-200 rounded-md shadow-lg">
                                            <input
                                                type="text"
                                                placeholder="Search country..."
                                                value={countrySearch}
                                                onChange={(e) => setCountrySearch(e.target.value)}
                                                className="w-full px-3 py-2 border-b border-gray-200 focus:outline-none"
                                            />
                                            <div className="max-h-48 overflow-y-auto">
                                                {filteredCountries.map(country => (
                                                    <button key={country.code + country.name} onClick={() => { setSelectedCountry(country); setIsDropdownOpen(false); setCountrySearch(''); }} className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2">
                                                        <img src={country.flagUrl} alt={country.name} className="w-5 h-auto" />
                                                        <span className="truncate">{country.name} ({country.code})</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <input 
                                    type="tel"
                                    name="phone"
                                    value={formData.phone || ''}
                                    onChange={handleFormChange}
                                    disabled={!isEditing || !canEditPhone}
                                    className="h-10 px-3 w-full border border-gray-300 rounded-r-md text-sm font-semibold text-[var(--dark)] focus:ring-1 focus:ring-[var(--primary)] focus:border-[var(--primary)] disabled:bg-gray-200 disabled:cursor-not-allowed" 
                                />
                            </div>
                            {!canEditPhone && isEditing && (
                                <p className="text-xs text-amber-600 mt-1">
                                    You can update your phone number again in {timeLeftForPhoneEdit}.
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Settings */}
                <div className="bg-white rounded-xl shadow-lg p-4">
                     <h3 className="font-bold text-lg text-[var(--dark)] mb-2 px-1">Settings</h3>
                     <SettingsRow 
                         icon="fa-solid fa-credit-card" 
                         label="Payment Methods" 
                         value={getPaymentMethodDisplayText()}
                         onClick={() => setIsPaymentMethodModalOpen(true)} 
                     />
                     <SettingsRow icon="fa-solid fa-shield-halved" label="Privacy Settings" onClick={() => setIsPrivacyModalOpen(true)} />
                     <SettingsRow icon="fa-solid fa-bell" label="Notification Settings" onClick={() => setIsNotificationModalOpen(true)} />
                     <SettingsRow icon="fa-solid fa-key" label="Change Password" onClick={() => setIsChangePasswordModalOpen(true)} />
                </div>
                
                {/* Account Actions */}
                <div className="bg-white rounded-xl shadow-lg p-4">
                     <SettingsRow icon="fa-solid fa-trash-can" label="Delete Account" isDestructive={true} onClick={() => setIsDeleteModalOpen(true)} />
                </div>
            </div>
             <DeleteConfirmationModal 
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDeleteAccount}
            />
            
            <ChangePasswordModal 
                isOpen={isChangePasswordModalOpen}
                onClose={() => setIsChangePasswordModalOpen(false)}
            />

            <InfoModal
                isOpen={isInfoModalOpen}
                onClose={() => setIsInfoModalOpen(false)}
                title="Personal Information"
                message={`Your Full Name, Bio, and Phone Number can be edited.\n\n• Email, Date of Birth, and Address cannot be changed for security reasons.\n• Your Phone Number can only be updated once every 30 days.${!canEditPhone ? `\n\nTime until next phone update: ${timeLeftForPhoneEdit}` : ''}`}
                type="info"
                actions={[{ text: 'Got it', onClick: () => setIsInfoModalOpen(false), primary: true }]}
            />
             {settingsModalContent && (
                <InfoModal
                    isOpen={true}
                    onClose={() => setSettingsModalContent(null)}
                    title={settingsModalContent.title}
                    message={settingsModalContent.message}
                    type="info"
                    actions={[{ text: 'OK', onClick: () => setSettingsModalContent(null), primary: true }]}
                />
            )}

            <NotificationSettingsModal 
                isOpen={isNotificationModalOpen}
                onClose={() => setIsNotificationModalOpen(false)}
                preferences={userProfile.notificationPreferences}
                onSave={handleNotificationSave}
            />
            
            <PrivacySettingsModal
                isOpen={isPrivacyModalOpen}
                onClose={() => setIsPrivacyModalOpen(false)}
                settings={userProfile.privacySettings}
                onSave={handlePrivacySave}
            />

            <PaymentMethodModal 
                isOpen={isPaymentMethodModalOpen}
                onClose={() => setIsPaymentMethodModalOpen(false)}
                currentDetails={userProfile.savedPaymentMethods}
                onSave={handlePaymentMethodSave}
            />
        </div>
    );
};

export default ProfileScreen;