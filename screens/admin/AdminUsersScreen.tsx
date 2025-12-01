
import React, { useEffect, useState } from 'react';
import { getAllUsers } from '../../services/adminService';
import { UserProfile } from '../../types';

const AdminUsersScreen: React.FC = () => {
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            const data = await getAllUsers();
            setUsers(data);
            setLoading(false);
        };
        load();
    }, []);

    return (
        <div className="p-6 h-full flex flex-col">
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-800">User Management</h2>
                <p className="text-sm text-gray-500">View top 50 users by points</p>
            </div>

            <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden flex-1">
                 <div className="overflow-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50 text-gray-600 text-xs uppercase sticky top-0">
                            <tr>
                                <th className="p-4 border-b">User</th>
                                <th className="p-4 border-b">Dyverze ID</th>
                                <th className="p-4 border-b">Points</th>
                                <th className="p-4 border-b">Tasks</th>
                                <th className="p-4 border-b">Referrals</th>
                                <th className="p-4 border-b">Balance</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm">
                            {loading ? (
                                <tr><td colSpan={6} className="p-8 text-center"><i className="fa-solid fa-spinner fa-spin"></i></td></tr>
                            ) : (
                                users.map((u) => (
                                    <tr key={u.uid} className="hover:bg-gray-50 border-b last:border-0">
                                        <td className="p-4">
                                            <div className="flex items-center">
                                                <div className="w-8 h-8 rounded-full bg-gray-200 mr-3 overflow-hidden">
                                                    {u.avatarUrl ? <img src={u.avatarUrl} alt="" className="w-full h-full object-cover"/> : <i className="fa-solid fa-user p-2 text-gray-400"></i>}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-gray-800">{u.fullName}</div>
                                                    <div className="text-xs text-gray-500">{u.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 text-gray-500 font-mono text-xs">{u.dyverzeId}</td>
                                        <td className="p-4 font-bold text-blue-600">{u.points.toLocaleString()}</td>
                                        <td className="p-4">{u.taskStats?.completed || 0}</td>
                                        <td className="p-4">{u.referrals?.count || 0}</td>
                                        <td className="p-4 font-bold text-green-600">${(u.points / 100000).toFixed(2)}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                 </div>
            </div>
        </div>
    );
};

export default AdminUsersScreen;
