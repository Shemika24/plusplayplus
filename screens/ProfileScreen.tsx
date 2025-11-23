import React from 'react';
import { ProfileScreenProps } from '../types';

const ProfileScreen: React.FC<ProfileScreenProps> = ({ user, onEditProfile }) => {
    
    const userPhoto = user?.local_photo_url || user?.photo_url;
    
    return (
        <div className="relative animate-fadeIn space-y-6 pt-8">
            <button
                onClick={onEditProfile}
                className="absolute top-0 right-0 p-2 text-primary hover:text-primary-dark transition-colors"
                aria-label="Edit Profile"
            >
                <i className="fa-solid fa-pencil text-2xl"></i>
            </button>

            <div className="flex flex-col items-center space-y-4">
                {userPhoto ? (
                    <img src={userPhoto} alt="Profile" className="w-32 h-32 rounded-full object-cover shadow-lg border-4 border-primary/20" />
                ) : (
                    <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-5xl font-bold shadow-lg">
                        {(user?.first_name || 'U').charAt(0).toUpperCase()}
                    </div>
                )}
                <h2 className="text-xl font-bold text-dark">{user?.first_name} {user?.last_name}</h2>
                {user?.username && <p className="text-gray text-base">@{user.username}</p>}
            </div>

            <div className="space-y-3 bg-white p-6 rounded-2xl shadow-md">
                <div className="flex items-center gap-4 border-b border-gray-light pb-3">
                    <i className="fa-solid fa-envelope text-primary text-2xl"></i>
                    <div>
                        <p className="text-gray text-sm">Email</p>
                        <p className="font-semibold text-dark">{user?.email || 'Not set'}</p>
                    </div>
                </div>
                <div className="flex items-center gap-4 pt-3">
                    <i className="fa-solid fa-calendar text-primary text-2xl"></i>
                    <div>
                        <p className="text-gray text-sm">Date of Birth</p>
                        <p className="font-semibold text-dark">{user?.dob || 'Not set'}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfileScreen;