
import React, { useEffect, useState } from 'react';
import { getAdminStats } from '../../services/adminService';

const AdminDashboardScreen: React.FC = () => {
    const [stats, setStats] = useState({ totalUsers: 0, pendingWithdrawals: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetch = async () => {
            const data = await getAdminStats();
            setStats(data);
            setLoading(false);
        };
        fetch();
    }, []);

    const cards = [
        { title: 'Total Users', value: stats.totalUsers, icon: 'fa-users', color: 'bg-blue-500' },
        { title: 'Pending Cashouts', value: stats.pendingWithdrawals, icon: 'fa-clock', color: 'bg-orange-500' },
        { title: 'System Status', value: 'Active', icon: 'fa-server', color: 'bg-green-500' },
    ];

    if (loading) return <div className="p-8 text-center"><i className="fa-solid fa-spinner fa-spin text-2xl"></i></div>;

    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Dashboard Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {cards.map((card, idx) => (
                    <div key={idx} className="bg-white rounded-xl shadow-md p-6 border border-gray-100 flex items-center">
                        <div className={`w-14 h-14 rounded-full flex items-center justify-center text-white text-2xl mr-4 ${card.color}`}>
                            <i className={`fa-solid ${card.icon}`}></i>
                        </div>
                        <div>
                            <p className="text-gray-500 text-sm font-medium">{card.title}</p>
                            <h3 className="text-2xl font-bold text-gray-800">{card.value}</h3>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-8 bg-white rounded-xl shadow-md p-6 border border-gray-100">
                <h3 className="font-bold text-gray-800 mb-4">Quick Actions</h3>
                <div className="flex gap-4">
                    <button className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg font-medium hover:bg-blue-100 transition">
                        <i className="fa-solid fa-download mr-2"></i> Export User Data
                    </button>
                    <button className="px-4 py-2 bg-purple-50 text-purple-600 rounded-lg font-medium hover:bg-purple-100 transition">
                        <i className="fa-solid fa-gear mr-2"></i> Global Settings
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboardScreen;
