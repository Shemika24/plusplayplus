
import React, { useState, useEffect } from 'react';
import { onAuthStateChangedListener, signOutUser } from './services/authService';
import { User } from 'firebase/auth';
import AuthScreen from './screens/AuthScreen';
import AdminDashboardScreen from './screens/admin/AdminDashboardScreen';
import AdminWithdrawalsScreen from './screens/admin/AdminWithdrawalsScreen';
import AdminUsersScreen from './screens/admin/AdminUsersScreen';

type AdminTab = 'Dashboard' | 'Withdrawals' | 'Users';

// Add authorized Admin UIDs here.
// IMPORTANT: For production, this should be enforced via Firestore Rules.
const ALLOWED_ADMINS = [
    '5354405582', // Telegram ID if mapped to UID, or actual Firebase UID
    'YOUR_FIREBASE_UID_HERE' // Add your specific UID after logging in and checking console
];

const AdminApp: React.FC = () => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<AdminTab>('Dashboard');

    useEffect(() => {
        return onAuthStateChangedListener((u) => {
            setUser(u);
            setLoading(false);
        });
    }, []);

    const handleLogout = () => {
        signOutUser();
    };

    if (loading) {
        return <div className="h-screen flex items-center justify-center bg-gray-100"><i className="fa-solid fa-spinner fa-spin text-4xl text-blue-600"></i></div>;
    }

    if (!user) {
        return (
            <div className="h-screen bg-gray-100 flex items-center justify-center">
                <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-xl">
                    <h1 className="text-2xl font-bold text-center mb-6 text-gray-800">Admin Panel Access</h1>
                    <AuthScreen />
                </div>
            </div>
        );
    }

    // Optional: Add logic here to restrict access based on UID
    // if (!ALLOWED_ADMINS.includes(user.uid)) {
    //    return <div className="p-10 text-center text-red-600 font-bold">Access Denied. You are not an administrator.</div>;
    // }

    return (
        <div className="flex h-screen bg-gray-100 font-sans">
            {/* Sidebar */}
            <aside className="w-64 bg-slate-800 text-white flex flex-col shadow-xl">
                <div className="p-6 border-b border-slate-700">
                    <h1 className="text-xl font-bold flex items-center gap-2">
                        <i className="fa-solid fa-shield-halved text-blue-400"></i>
                        DYVERZE Admin
                    </h1>
                </div>
                
                <nav className="flex-1 p-4 space-y-2">
                    <SidebarItem 
                        icon="fa-chart-pie" 
                        label="Dashboard" 
                        active={activeTab === 'Dashboard'} 
                        onClick={() => setActiveTab('Dashboard')} 
                    />
                    <SidebarItem 
                        icon="fa-money-check-dollar" 
                        label="Withdrawals" 
                        active={activeTab === 'Withdrawals'} 
                        onClick={() => setActiveTab('Withdrawals')} 
                    />
                    <SidebarItem 
                        icon="fa-users" 
                        label="Users" 
                        active={activeTab === 'Users'} 
                        onClick={() => setActiveTab('Users')} 
                    />
                </nav>

                <div className="p-4 border-t border-slate-700">
                    <div className="flex items-center gap-3 mb-4 px-2">
                        <div className="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center">
                            <i className="fa-solid fa-user-secret"></i>
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-sm font-bold truncate">{user.displayName || 'Admin'}</p>
                            <p className="text-xs text-slate-400 truncate">{user.email}</p>
                        </div>
                    </div>
                    <button 
                        onClick={handleLogout}
                        className="w-full py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-bold transition-colors"
                    >
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto">
                {activeTab === 'Dashboard' && <AdminDashboardScreen />}
                {activeTab === 'Withdrawals' && <AdminWithdrawalsScreen />}
                {activeTab === 'Users' && <AdminUsersScreen />}
            </main>
        </div>
    );
};

const SidebarItem: React.FC<{ icon: string; label: string; active: boolean; onClick: () => void }> = ({ icon, label, active, onClick }) => (
    <button 
        onClick={onClick}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${active ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-300 hover:bg-slate-700 hover:text-white'}`}
    >
        <i className={`fa-solid ${icon} w-5 text-center`}></i>
        <span className="font-medium">{label}</span>
    </button>
);

export default AdminApp;
