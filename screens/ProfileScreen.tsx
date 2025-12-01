
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { UserProfile, NotificationPreferences, PrivacySettings, PaymentDetails } from '../types';
import { updateUserProfile, deleteUserData } from '../services/firestoreService';
import { deleteCurrentUser, changeUserPassword, reauthenticateUser } from '../services/authService';
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
  minLength: number; // Validation length
}

// Static list with specific lengths (9, 10, 11 etc)
const ALL_COUNTRIES: Country[] = [
    { name: "United States", code: "+1", flagUrl: "https://flagcdn.com/us.svg", minLength: 10 },
    { name: "Mozambique", code: "+258", flagUrl: "https://flagcdn.com/mz.svg", minLength: 9 },
    { name: "United Kingdom", code: "+44", flagUrl: "https://flagcdn.com/gb.svg", minLength: 10 },
    { name: "Brazil", code: "+55", flagUrl: "https://flagcdn.com/br.svg", minLength: 11 },
    { name: "Portugal", code: "+351", flagUrl: "https://flagcdn.com/pt.svg", minLength: 9 },
    { name: "Canada", code: "+1", flagUrl: "https://flagcdn.com/ca.svg", minLength: 10 },
    { name: "South Africa", code: "+27", flagUrl: "https://flagcdn.com/za.svg", minLength: 9 },
    { name: "Nigeria", code: "+234", flagUrl: "https://flagcdn.com/ng.svg", minLength: 10 },
    { name: "India", code: "+91", flagUrl: "https://flagcdn.com/in.svg", minLength: 10 },
    { name: "China", code: "+86", flagUrl: "https://flagcdn.com/cn.svg", minLength: 11 },
    { name: "Russia", code: "+7", flagUrl: "https://flagcdn.com/ru.svg", minLength: 10 },
    { name: "Japan", code: "+81", flagUrl: "https://flagcdn.com/jp.svg", minLength: 10 },
    { name: "Germany", code: "+49", flagUrl: "https://flagcdn.com/de.svg", minLength: 10 }, // Often 10 or 11 without 0
    { name: "France", code: "+33", flagUrl: "https://flagcdn.com/fr.svg", minLength: 9 },
    { name: "Spain", code: "+34", flagUrl: "https://flagcdn.com/es.svg", minLength: 9 },
    { name: "Italy", code: "+39", flagUrl: "https://flagcdn.com/it.svg", minLength: 10 },
    { name: "Australia", code: "+61", flagUrl: "https://flagcdn.com/au.svg", minLength: 9 },
    { name: "Mexico", code: "+52", flagUrl: "https://flagcdn.com/mx.svg", minLength: 10 },
    { name: "Argentina", code: "+54", flagUrl: "https://flagcdn.com/ar.svg", minLength: 10 }, // Mobile 9 + digit 9
    { name: "Colombia", code: "+57", flagUrl: "https://flagcdn.com/co.svg", minLength: 10 },
    { name: "Indonesia", code: "+62", flagUrl: "https://flagcdn.com/id.svg", minLength: 10 }, // Varies, usually 10-12
    { name: "Turkey", code: "+90", flagUrl: "https://flagcdn.com/tr.svg", minLength: 10 },
    { name: "Saudi Arabia", code: "+966", flagUrl: "https://flagcdn.com/sa.svg", minLength: 9 },
    { name: "Egypt", code: "+20", flagUrl: "https://flagcdn.com/eg.svg", minLength: 10 },
    { name: "Vietnam", code: "+84", flagUrl: "https://flagcdn.com/vn.svg", minLength: 9 },
    { name: "Thailand", code: "+66", flagUrl: "https://flagcdn.com/th.svg", minLength: 9 },
    { name: "Kenya", code: "+254", flagUrl: "https://flagcdn.com/ke.svg", minLength: 9 },
    { name: "Angola", code: "+244", flagUrl: "https://flagcdn.com/ao.svg", minLength: 9 },
    { name: "Ghana", code: "+233", flagUrl: "https://flagcdn.com/gh.svg", minLength: 9 },
    { name: "Zimbabwe", code: "+263", flagUrl: "https://flagcdn.com/zw.svg", minLength: 9 },
    { name: "Zambia", code: "+260", flagUrl: "https://flagcdn.com/zm.svg", minLength: 9 },
    { name: "Tanzania", code: "+255", flagUrl: "https://flagcdn.com/tz.svg", minLength: 9 },
    { name: "Botswana", code: "+267", flagUrl: "https://flagcdn.com/bw.svg", minLength: 8 },
    { name: "Namibia", code: "+264", flagUrl: "https://flagcdn.com/na.svg", minLength: 9 },
    { name: "Philippines", code: "+63", flagUrl: "https://flagcdn.com/ph.svg", minLength: 10 },
    { name: "Pakistan", code: "+92", flagUrl: "https://flagcdn.com/pk.svg", minLength: 10 },
    { name: "Bangladesh", code: "+880", flagUrl: "https://flagcdn.com/bd.svg", minLength: 10 },
    { name: "South Korea", code: "+82", flagUrl: "https://flagcdn.com/kr.svg", minLength: 10 },
    { name: "Malaysia", code: "+60", flagUrl: "https://flagcdn.com/my.svg", minLength: 9 },
    { name: "Poland", code: "+48", flagUrl: "https://flagcdn.com/pl.svg", minLength: 9 },
    { name: "Ukraine", code: "+380", flagUrl: "https://flagcdn.com/ua.svg", minLength: 9 },
    { name: "Netherlands", code: "+31", flagUrl: "https://flagcdn.com/nl.svg", minLength: 9 },
    { name: "Belgium", code: "+32", flagUrl: "https://flagcdn.com/be.svg", minLength: 9 },
    { name: "Sweden", code: "+46", flagUrl: "https://flagcdn.com/se.svg", minLength: 9 },
    { name: "Switzerland", code: "+41", flagUrl: "https://flagcdn.com/ch.svg", minLength: 9 },
    { name: "Austria", code: "+43", flagUrl: "https://flagcdn.com/at.svg", minLength: 10 },
    { name: "Greece", code: "+30", flagUrl: "https://flagcdn.com/gr.svg", minLength: 10 },
    { name: "United Arab Emirates", code: "+971", flagUrl: "https://flagcdn.com/ae.svg", minLength: 9 },
    { name: "Israel", code: "+972", flagUrl: "https://flagcdn.com/il.svg", minLength: 9 },
];

// --- Sub-Components ---
const InfoRow: React.FC<{ icon: string; label: string; value: string; isEditable?: boolean; onChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void; name?: string; type?: string; as?: 'textarea'; error?: string }> = 
({ icon, label, value, isEditable = false, onChange, name, type = 'text', as, error }) => {
    
    if (isEditable) {
        const commonProps = {
            name,
            id: name,
            value: value || '',
            onChange,
            className: `mt-1 w-full p-2 bg-[var(--bg-input)] border ${error ? 'border-red-500' : 'border-[var(--border-color)]'} rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:outline-none transition text-[var(--dark)]`
        };
        return (
            <div className="flex items-start py-3 border-b border-[var(--border-color)] last:border-b-0">
                <i className={`${icon} text-[var(--gray)] w-6 text-center mr-4 pt-3`}></i>
                <div className="w-full">
                    <label htmlFor={name} className="text-xs text-[var(--gray)]">{label}</label>
                    {as === 'textarea' ? (
                        <textarea {...commonProps} rows={3} />
                    ) : (
                        <input {...commonProps} type={type} />
                    )}
                    {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
                </div>
            </div>
        );
    }
    
    return (
        <div className="flex items-center py-3 border-b border-[var(--border-color)] last:border-b-0">
            <i className={`${icon} text-[var(--gray)] w-6 text-center mr-4`}></i>
            <div>
                <p className="text-xs text-[var(--gray)]">{label}</p>
                <p className="font-semibold text-[var(--dark)] whitespace-pre-wrap">{value || 'Not set'}</p>
            </div>
        </div>
    );
};


const SettingsRow: React.FC<{ icon: string; label: string; onClick?: () => void; isDestructive?: boolean; value?: string | React.ReactNode }> = ({ icon, label, onClick, isDestructive = false, value }) => (
    <button onClick={onClick} className={`w-full flex items-center justify-between py-3.5 border-b border-[var(--border-color)] last:border-b-0 hover:bg-[var(--bg-card-hover)] transition-colors duration-200 rounded-lg`}>
        <div className="flex items-center flex-1 min-w-0">
             <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 flex-shrink-0 ${isDestructive ? 'bg-red-50 dark:bg-red-900/20' : 'bg-[var(--bg-input)]'}`}>
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
                                className="w-full p-3 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:outline-none text-[var(--dark)]"
                                placeholder="Enter current password"
                                required
                            />
                             <button
                                type="button"
                                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                className="absolute right-3 top-3 text-[var(--gray)] hover:text-[var(--dark)]"
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
                                className="w-full p-3 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:outline-none text-[var(--dark)]"
                                placeholder="Enter new password (min. 6 chars)"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowNewPassword(!showNewPassword)}
                                className="absolute right-3 top-3 text-[var(--gray)] hover:text-[var(--dark)]"
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
                            className="w-full p-3 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:outline-none text-[var(--dark)]"
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
  onConfirm: (password: string) => Promise<void>;
}

const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({ isOpen, onClose, onConfirm }) => {
  const [password, setPassword] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');

  const handleDelete = async () => {
    if (!password) return;
    setIsDeleting(true);
    setError('');
    try {
      await onConfirm(password);
      // On success, the app will log out and navigate away.
    } catch (e: any) {
      setError(e.message || 'An unexpected error occurred.');
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    if (isDeleting) return;
    setPassword('');
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
          Please enter your password to confirm deletion.
        </p>

        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-4 w-full p-3 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg focus:ring-2 focus:ring-[var(--error)] focus:outline-none transition text-center text-[var(--dark)]"
          placeholder="Enter Password"
          disabled={isDeleting}
        />

        {error && <p className="text-red-500 text-sm text-center bg-red-100 p-3 rounded-lg mt-4">{error}</p>}

        <div className="mt-6 flex flex-col sm:flex-row-reverse gap-3">
          <button
            onClick={handleDelete}
            disabled={!password || isDeleting}
            className="w-full font-bold py-3 rounded-xl shadow-lg transition-all bg-red-600 text-white hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isDeleting ? <><i className="fa-solid fa-spinner fa-spin mr-2"></i>Deleting...</> : 'Delete My Account'}
          </button>
          <button
            onClick={handleClose}
            disabled={isDeleting}
            className="w-full font-bold py-3 rounded-xl shadow-transform hover:scale-105 bg-gray-200 text-gray-800 disabled:opacity-50"
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
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    
    // Phone Input Logic
    const [selectedCountry, setSelectedCountry] = useState<Country>(ALL_COUNTRIES[0]); // Default US
    const [phoneNumber, setPhoneNumber] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [countrySearch, setCountrySearch] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
    const [settingsModalContent, setSettingsModalContent] = useState<{ title: string; message: string } | null>(null);
    const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
    const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
    const [isPaymentMethodModalOpen, setIsPaymentMethodModalOpen] = useState(false);
    
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

    // Sync profile data and split phone number intelligently
    useEffect(() => {
        setFormData(userProfile);
        
        // Phone number parsing logic
        if (userProfile.phone) {
            let foundCountry = null;
            // Sort countries by length of code (descending) to match longest prefix first (e.g., match +258 before +25)
            const sortedCountries = [...ALL_COUNTRIES].sort((a, b) => b.code.length - a.code.length);
            
            for (const country of sortedCountries) {
                if (userProfile.phone.startsWith(country.code)) {
                    foundCountry = country;
                    break;
                }
            }

            if (foundCountry) {
                setSelectedCountry(foundCountry);
                // Remove the code from the display string
                const pureNumber = userProfile.phone.substring(foundCountry.code.length);
                setPhoneNumber(pureNumber);
            } else {
                setPhoneNumber(userProfile.phone);
            }
        }
    }, [userProfile]);

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
    
    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // Allow only numbers (mobile validation simulation)
        const numericValue = e.target.value.replace(/[^0-9]/g, '');
        setPhoneNumber(numericValue);
    };

    const handleImageCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result as string;
                setFormData(prev => ({ ...prev, avatarUrl: base64String }));
                
                // Explicitly check if we should save this immediately or wait for "Save" button?
                // The original code waited for handleSave. We will do the same, but
                // we track that the avatar changed in formData.
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = async () => {
        const newErrors: { [key: string]: string } = {};
        
        // Name Validation (Min 3 chars, letters only)
        const name = formData.fullName?.trim() || '';
        const nameRegex = /^[a-zA-Z\s]+$/;

        if (name.length < 3) {
            newErrors.fullName = "Name must be at least 3 characters.";
        } else if (!nameRegex.test(name)) {
            newErrors.fullName = "Name must contain only letters (no numbers or symbols).";
        }

        // DOB Validation (13+ Years)
        if (isEditing && !userProfile.dob && formData.dob) { 
             const birthDate = new Date(formData.dob);
             const today = new Date();
             let age = today.getFullYear() - birthDate.getFullYear();
             const m = today.getMonth() - birthDate.getMonth();
             if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                 age--;
             }
             if (age < 13) {
                 newErrors.dob = "You must be at least 13 years old to use this app.";
             }
        }

        // Phone Validation (Country code specific length)
        const fullPhone = selectedCountry && phoneNumber ? `${selectedCountry.code}${phoneNumber}` : '';
        const phoneHasChanged = fullPhone !== userProfile.phone;

        if (isEditing && phoneHasChanged) {
            if (!phoneNumber || phoneNumber.trim().length === 0) {
                 newErrors.phone = "Phone number is required.";
            } else if (!/^\d+$/.test(phoneNumber)) {
                 newErrors.phone = "Only numbers allowed.";
            } else {
                 // STRICT: Validate against country specific length
                 const requiredLen = selectedCountry.minLength;
                 if (phoneNumber.length !== requiredLen) {
                     newErrors.phone = `Invalid length. ${selectedCountry.name} requires exactly ${requiredLen} digits after the code.`;
                 }
            }
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }
        setErrors({}); // Clear errors

        // Proceed with saving
        const dataToUpdate: Partial<UserProfile> = {
            fullName: formData.fullName,
            bio: formData.bio,
        };

        // Handle Avatar Update
        if (formData.avatarUrl !== userProfile.avatarUrl) {
            dataToUpdate.avatarUrl = formData.avatarUrl;
            dataToUpdate.lastAvatarUpdate = serverTimestamp();
        }

        // Update DOB and Address if they were previously empty and now set
        if (!userProfile.dob && formData.dob) {
            dataToUpdate.dob = formData.dob;
        }
        if (!userProfile.address && formData.address) {
            dataToUpdate.address = formData.address;
        }
        
        if (phoneHasChanged) {
            if (!canEditPhone) {
                alert(`You can only update your phone number once every 30 days. Time left: ${timeLeftForPhoneEdit}`);
                return;
            }
            if (fullPhone) {
                dataToUpdate.phone = fullPhone;
                dataToUpdate.lastPhoneUpdate = serverTimestamp();
            }
        }
    
        try {
            await updateUserProfile(userProfile.uid, dataToUpdate);
            // Update local optimistic state including phone reconstruction
            const updatedProfile = { 
                ...formData, 
                phone: fullPhone,
                lastAvatarUpdate: formData.avatarUrl !== userProfile.avatarUrl ? new Date() : userProfile.lastAvatarUpdate
            };
            onProfileUpdate(updatedProfile);
            setFormData(updatedProfile);
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
        setErrors({});
        
        // Reset phone to original state
        if (userProfile.phone) {
            const sortedCountries = [...ALL_COUNTRIES].sort((a, b) => b.code.length - a.code.length);
            let foundCountry = ALL_COUNTRIES[0];
            let pureNumber = '';
            
            for (const country of sortedCountries) {
                if (userProfile.phone.startsWith(country.code)) {
                    foundCountry = country;
                    pureNumber = userProfile.phone.substring(country.code.length);
                    break;
                }
            }
            setSelectedCountry(foundCountry);
            setPhoneNumber(pureNumber);
        } else {
            setPhoneNumber('');
        }
        
        setIsEditing(false);
    };

    const handleDeleteAccount = async (password: string) => {
        // 1. Verify password first to prevent partial deletion
        await reauthenticateUser(password);
        // 2. Delete database records
        await deleteUserData(userProfile.uid);
        // 3. Delete authentication account
        await deleteCurrentUser();
    };

    const filteredCountries = ALL_COUNTRIES.filter(c =>
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
        <div className="bg-[var(--gray-light)] pb-32 min-h-full transition-colors duration-300">
            {/* Profile Header */}
            <div className="bg-gradient-to-b from-[var(--bg-card)] to-[var(--bg-card)] p-6 flex flex-col items-center text-center border-b border-[var(--border-color)]">
                <div className="relative">
                    {formData.avatarUrl ? (
                         <img src={formData.avatarUrl} alt="User Avatar" className="w-24 h-24 rounded-full border-4 border-[var(--bg-card)] shadow-lg bg-gray-300 object-cover" />
                    ) : (
                        <div className="w-24 h-24 rounded-full border-4 border-[var(--bg-card)] shadow-lg bg-gray-300 flex items-center justify-center">
                            <i className="fa-solid fa-user text-5xl text-gray-500"></i>
                        </div>
                    )}
                    {/* Hidden file input restricted to camera with capture="user" */}
                    <input 
                        type="file" 
                        accept="image/*" 
                        capture="user"
                        ref={fileInputRef}
                        onChange={handleImageCapture}
                        className="hidden"
                    />
                    {isEditing && (
                        <button 
                            onClick={() => fileInputRef.current?.click()}
                            className="absolute -bottom-1 -right-1 w-8 h-8 bg-[var(--primary)] text-white rounded-full flex items-center justify-center border-2 border-[var(--bg-card)] shadow-md hover:bg-[var(--primary-dark)] transition-colors"
                        >
                            <i className="fa-solid fa-camera"></i>
                        </button>
                    )}
                </div>
                
                {/* Removed username display, showing only Full Name from DB */}
                <h2 className="text-2xl font-bold text-[var(--dark)] mt-4">{formData.fullName || 'User'}</h2>
            </div>

            <div className="p-4 md:p-6 space-y-6">
                {/* Personal Information */}
                <div className="bg-[var(--bg-card)] rounded-xl shadow-lg p-4 border border-[var(--border-color)]">
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
                            <button onClick={() => setIsEditing(true)} className="text-[var(--primary)] hover:text-[var(--primary-dark)] text-lg w-8 h-8 flex items-center justify-center rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/20 transition-colors" aria-label="Edit profile">
                                <i className="fa-solid fa-pencil"></i>
                            </button>
                        )}
                    </div>
                    <InfoRow 
                        icon="fa-solid fa-user" 
                        label="Full Name" 
                        value={formData.fullName || ''} 
                        name="fullName" 
                        onChange={handleFormChange} 
                        isEditable={isEditing} 
                        error={errors.fullName}
                    />
                    <InfoRow icon="fa-solid fa-envelope" label="Email" value={formData.email || ''} isEditable={false} />
                    <InfoRow icon="fa-solid fa-align-left" label="Bio" value={formData.bio || ''} name="bio" onChange={handleFormChange} isEditable={isEditing} as="textarea" />
                    <InfoRow 
                        icon="fa-solid fa-cake-candles" 
                        label="Date of Birth" 
                        value={formData.dob || ''} 
                        name="dob"
                        type="date"
                        onChange={handleFormChange}
                        isEditable={isEditing && !userProfile.dob} 
                        error={errors.dob}
                    />
                    <InfoRow 
                        icon="fa-solid fa-location-dot" 
                        label="Address" 
                        value={formData.address || ''} 
                        name="address"
                        onChange={handleFormChange}
                        isEditable={isEditing && !userProfile.address} 
                    />

                    {/* Phone Number Input */}
                    <div className="flex items-start py-3">
                         <i className="fa-solid fa-phone text-[var(--gray)] w-6 text-center mr-4 pt-2"></i>
                        <div className="w-full">
                            <p className="text-xs text-[var(--gray)]">Phone Number</p>
                            {isEditing ? (
                                <div className="flex flex-col mt-1">
                                    <div className="flex items-center">
                                        <div className="relative" ref={dropdownRef}>
                                            <button 
                                                onClick={() => setIsDropdownOpen(!isDropdownOpen)} 
                                                disabled={!canEditPhone}
                                                className="flex items-center justify-center h-10 w-28 bg-[var(--bg-input)] rounded-l-md border border-r-0 border-[var(--border-color)] disabled:bg-gray-200 dark:disabled:bg-gray-800 disabled:cursor-not-allowed text-[var(--dark)] hover:bg-[var(--bg-card-hover)] transition-colors"
                                            >
                                                {selectedCountry && (
                                                    <>
                                                        <img src={selectedCountry.flagUrl} alt="" className="w-5 h-auto mr-2" />
                                                        <span className="text-sm font-semibold">{selectedCountry.code}</span>
                                                    </>
                                                )}
                                            </button>
                                            {isDropdownOpen && (
                                                <div className="absolute z-10 bottom-full mb-2 w-64 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-md shadow-lg">
                                                    <input
                                                        type="text"
                                                        placeholder="Search country..."
                                                        value={countrySearch}
                                                        onChange={(e) => setCountrySearch(e.target.value)}
                                                        className="w-full px-3 py-2 border-b border-[var(--border-color)] focus:outline-none bg-[var(--bg-card)] text-[var(--dark)]"
                                                    />
                                                    <div className="max-h-48 overflow-y-auto">
                                                        {filteredCountries.map(country => (
                                                            <button key={country.code + country.name} onClick={() => { setSelectedCountry(country); setIsDropdownOpen(false); setCountrySearch(''); }} className="w-full text-left px-3 py-2 text-sm text-[var(--dark)] hover:bg-[var(--bg-card-hover)] flex items-center gap-2">
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
                                            value={phoneNumber}
                                            onChange={handlePhoneChange}
                                            placeholder={`e.g. ${'0'.repeat(selectedCountry.minLength)}`}
                                            disabled={!canEditPhone}
                                            className={`h-10 px-3 w-full border ${errors.phone ? 'border-red-500' : 'border-[var(--border-color)]'} rounded-r-md text-sm font-semibold text-[var(--dark)] bg-[var(--bg-input)] focus:ring-1 focus:ring-[var(--primary)] focus:border-[var(--primary)] disabled:bg-gray-200 dark:disabled:bg-gray-800 disabled:cursor-not-allowed outline-none`} 
                                        />
                                    </div>
                                    {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
                                </div>
                            ) : (
                                <p className="font-semibold text-[var(--dark)] mt-1">
                                    {userProfile.phone || 'Not set'}
                                </p>
                            )}
                            {!canEditPhone && isEditing && (
                                <p className="text-xs text-amber-600 mt-1">
                                    You can update your phone number again in {timeLeftForPhoneEdit}.
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Settings */}
                <div className="bg-[var(--bg-card)] rounded-xl shadow-lg p-4 border border-[var(--border-color)]">
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
                <div className="bg-[var(--bg-card)] rounded-xl shadow-lg p-4 border border-[var(--border-color)]">
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
                message={`Your Full Name, Bio, and Phone Number can be edited.\n\n• Name must be 3+ chars, letters only.\n• You must be 13+ years old.\n• Email, Date of Birth, and Address cannot be changed for security reasons once set.\n• Your Phone Number can only be updated once every 30 days.${!canEditPhone ? `\n\nTime until next phone update: ${timeLeftForPhoneEdit}` : ''}`}
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
                userProfile={userProfile}
                onSave={handlePaymentMethodSave}
            />
        </div>
    );
};

export default ProfileScreen;
