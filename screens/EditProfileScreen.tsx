import React, { useState, useMemo, useRef } from 'react';
import { EditProfileScreenProps } from '../types';

const EditProfileScreen: React.FC<EditProfileScreenProps> = ({ user, profileEditState, onBack, onSave }) => {
    const [firstName, setFirstName] = useState(user?.first_name || '');
    const [lastName, setLastName] = useState(user?.last_name || '');
    const [email, setEmail] = useState(user?.email || '');
    const [dob, setDob] = useState(user?.dob || '');
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const [dobError, setDobError] = useState('');
    const [emailError, setEmailError] = useState('');

    const fileInputRef = useRef<HTMLInputElement>(null);

    const NAME_COOLDOWN = 7 * 24 * 60 * 60 * 1000;
    const EMAIL_COOLDOWN = 30 * 24 * 60 * 60 * 1000; // Simplified to 30 days

    const { isNameOnCooldown, nameCooldownMessage, isEmailOnCooldown, emailCooldownMessage } = useMemo(() => {
        const now = Date.now();
        const nameCooldownEnd = profileEditState.lastNameUpdate + NAME_COOLDOWN;
        const emailCooldownEnd = profileEditState.lastEmailUpdate + EMAIL_COOLDOWN;

        const isNameCd = now < nameCooldownEnd;
        const isEmailCd = now < emailCooldownEnd;

        const formatCooldown = (ms: number) => {
            const days = Math.ceil(ms / (1000 * 60 * 60 * 24));
            if (days > 1) return `You can edit this again in ${days} days.`;
            const hours = Math.ceil(ms / (1000 * 60 * 60));
            if (hours > 1) return `You can edit this again in ${hours} hours.`;
            const minutes = Math.ceil(ms / (1000 * 60));
            return `You can edit this again in ${minutes} minutes.`;
        };

        return {
            isNameOnCooldown: isNameCd,
            nameCooldownMessage: isNameCd ? formatCooldown(nameCooldownEnd - now) : '',
            isEmailOnCooldown: isEmailCd,
            emailCooldownMessage: isEmailCd ? formatCooldown(emailCooldownEnd - now) : '',
        };
    }, [profileEditState]);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPhotoPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const validateDob = (dateString: string): boolean => {
        if (!dateString) return true; // Empty is valid

        if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
            setDobError('Please use the YYYY-MM-DD format.');
            return false;
        }

        const dateObj = new Date(dateString);
        if (isNaN(dateObj.getTime())) {
            setDobError('The date entered is not a valid calendar date.');
            return false;
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0); 
        
        if (dateObj > today) {
            setDobError('Date of birth cannot be in the future.');
            return false;
        }
        
        return true;
    };

    const validateEmail = (emailString: string): boolean => {
        if (!emailString) return true; // Empty is okay

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(emailString)) {
            setEmailError('Please enter a valid email address.');
            return false;
        }
        return true;
    };

    const handleSaveChanges = () => {
        setDobError('');
        setEmailError('');

        const isDobValid = validateDob(dob);
        const isEmailValid = validateEmail(email);

        if (!isDobValid || !isEmailValid) {
            return;
        }

        onSave({
            first_name: firstName,
            last_name: lastName,
            email,
            dob,
            local_photo_url: photoPreview ?? undefined,
        });
    };

    const hasChanges =
        firstName !== (user?.first_name || '') ||
        lastName !== (user?.last_name || '') ||
        email !== (user?.email || '') ||
        dob !== (user?.dob || '') ||
        !!photoPreview;

    const userPhoto = photoPreview || user?.local_photo_url || user?.photo_url;

    return (
        <div className="animate-fadeIn space-y-6">
            <div className="flex items-center gap-4">
                <button onClick={onBack} className="p-2 -ml-2 text-dark hover:text-primary" aria-label="Go back">
                    <i className="fa-solid fa-arrow-left text-2xl"></i>
                </button>
                <h1 className="text-2xl font-bold text-dark">Edit Profile</h1>
            </div>

            <div className="flex flex-col items-center space-y-4">
                <div className="relative w-32 h-32">
                    <input
                        type="file"
                        accept="image/*"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden"
                    />
                    {userPhoto ? (
                        <img src={userPhoto} alt="Profile" className="w-32 h-32 rounded-full object-cover shadow-lg" />
                    ) : (
                        <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-5xl font-bold shadow-lg">
                            {(user?.first_name || 'U').charAt(0).toUpperCase()}
                        </div>
                    )}
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute bottom-0 right-0 w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center shadow-md border-2 border-white hover:bg-primary-dark transition-all"
                        aria-label="Change profile picture"
                    >
                        <i className="fa-solid fa-camera"></i>
                    </button>
                </div>
            </div>

            <div className="space-y-4">
                 <div>
                    <label htmlFor="username" className="block text-sm font-bold text-gray mb-2">Username</label>
                    <p id="username" className="w-full px-4 py-3 border border-gray-medium rounded-lg bg-gray-light text-gray">
                        {user?.username || 'Not set'}
                    </p>
                </div>
                <div>
                    <label htmlFor="firstName" className="block text-sm font-bold text-gray mb-2">First Name</label>
                    <input
                        id="firstName"
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="Your first name"
                        disabled={isNameOnCooldown}
                        className="w-full px-4 py-3 border border-gray-medium rounded-lg bg-white focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-light disabled:cursor-not-allowed"
                    />
                    {isNameOnCooldown && <p className="text-xs text-warning mt-1">{nameCooldownMessage}</p>}
                </div>
                <div>
                    <label htmlFor="lastName" className="block text-sm font-bold text-gray mb-2">Last Name</label>
                    <input
                        id="lastName"
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Your last name"
                        disabled={isNameOnCooldown}
                        className="w-full px-4 py-3 border border-gray-medium rounded-lg bg-white focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-light disabled:cursor-not-allowed"
                    />
                </div>
                <div>
                    <label htmlFor="email" className="block text-sm font-bold text-gray mb-2">Email Address</label>
                    <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => {
                            setEmail(e.target.value);
                            if (emailError) setEmailError('');
                        }}
                        placeholder="your@email.com"
                        disabled={isEmailOnCooldown}
                        className={`w-full px-4 py-3 border rounded-lg bg-white focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-light disabled:cursor-not-allowed ${emailError ? 'border-error' : 'border-gray-medium'}`}
                    />
                    {isEmailOnCooldown && <p className="text-xs text-warning mt-1">{emailCooldownMessage}</p>}
                    {emailError && <p className="text-xs text-error mt-1">{emailError}</p>}
                </div>

                <div>
                    <label htmlFor="dob" className="block text-sm font-bold text-gray mb-2">Date of Birth</label>
                    <input
                        id="dob"
                        type="date"
                        value={dob}
                        onChange={(e) => {
                            setDob(e.target.value);
                            if (dobError) setDobError('');
                        }}
                        className={`w-full px-4 py-3 border rounded-lg bg-white focus:ring-2 focus:ring-primary focus:border-transparent ${dobError ? 'border-error' : 'border-gray-medium'}`}
                    />
                     {dobError && <p className="text-xs text-error mt-1">{dobError}</p>}
                </div>
            </div>

            <button
                onClick={handleSaveChanges}
                disabled={!hasChanges}
                className="w-full bg-success text-white font-bold py-4 rounded-xl shadow-lg shadow-success/30 transition-all hover:scale-105 disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100 disabled:shadow-none"
            >
                Save Changes
            </button>
        </div>
    );
};

export default EditProfileScreen;