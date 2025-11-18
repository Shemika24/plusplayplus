
import React, { useState, useEffect } from 'react';
import { getNotifications } from '../services/firestoreService';
import { Notification, UserProfile } from '../types';

interface NotificationsScreenProps {
    userProfile: UserProfile;
}

const NotificationItem: React.FC<{ notification: Notification }> = ({ notification }) => {
    return (
        <div className={`flex items-start p-4 border-b border-gray-200 last:border-b-0 ${!notification.isRead ? 'bg-blue-50' : 'bg-white'}`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-4 ${!notification.isRead ? 'bg-blue-100' : 'bg-gray-100'}`}>
                <i className={`${notification.icon} ${notification.iconColor} text-lg`}></i>
            </div>
            <div className="flex-1">
                <div className="flex justify-between items-center">
                    <p className="font-bold text-sm text-gray-800">{notification.title}</p>
                    <p className="text-xs text-gray-500">{notification.time}</p>
                </div>
                <p className="text-sm text-gray-600 mt-0.5">{notification.description}</p>
            </div>
            {!notification.isRead && (
                 <div className="w-2.5 h-2.5 bg-blue-500 rounded-full ml-4 mt-1 self-center shrink-0"></div>
            )}
        </div>
    )
}

const NotificationsScreen: React.FC<NotificationsScreenProps> = ({ userProfile }) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchNotifications = async () => {
            setIsLoading(true);
            const userNotifications = await getNotifications(userProfile.uid);
            setNotifications(userNotifications);
            setIsLoading(false);
        };
        fetchNotifications();
    }, [userProfile.uid]);

    const unreadCount = notifications.filter(n => !n.isRead).length;

    return (
        <div className="flex flex-col h-full bg-gray-50">
            <div className="p-4 border-b border-gray-200 bg-white sticky top-0 z-10">
                <div className="flex justify-between items-center">
                    <h1 className="text-lg font-bold text-gray-800">
                        Notifications {unreadCount > 0 && `(${unreadCount})`}
                    </h1>
                    <button className="text-sm font-medium text-[var(--primary)] hover:text-[var(--primary-dark)]">
                        Mark all as read
                    </button>
                </div>
            </div>
            <div className="flex-1 overflow-y-auto">
                 {isLoading ? (
                    <div className="text-center p-8 text-gray-500">
                        <i className="fa-solid fa-spinner fa-spin text-4xl mb-4"></i>
                        <p>Loading notifications...</p>
                    </div>
                 ) : notifications.length > 0 ? (
                    notifications.map(notification => (
                        <NotificationItem key={notification.id} notification={notification} />
                    ))
                 ) : (
                    <div className="text-center p-8 text-gray-500">
                        <i className="fa-solid fa-inbox text-4xl mb-4"></i>
                        <p>Your inbox is empty.</p>
                        <p className="text-sm">You have no new notifications.</p>
                    </div>
                 )}
            </div>
        </div>
    );
};

export default NotificationsScreen;
