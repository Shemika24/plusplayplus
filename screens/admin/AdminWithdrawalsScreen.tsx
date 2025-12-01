
import React, { useEffect, useState } from 'react';
import { getGlobalWithdrawals, processWithdrawal, AdminWithdrawal } from '../../services/adminService';
import Modal from '../../components/Modal';

const AdminWithdrawalsScreen: React.FC = () => {
    const [withdrawals, setWithdrawals] = useState<AdminWithdrawal[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'All' | 'Pending'>('Pending');
    
    // Action Modal State
    const [selectedItem, setSelectedItem] = useState<AdminWithdrawal | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [processing, setProcessing] = useState(false);

    const loadData = async () => {
        setLoading(true);
        const data = await getGlobalWithdrawals(filter);
        setWithdrawals(data);
        setLoading(false);
    };

    useEffect(() => {
        loadData();
    }, [filter]);

    const handleAction = async (action: 'Approve' | 'Reject') => {
        if (!selectedItem) return;
        setProcessing(true);
        try {
            await processWithdrawal(selectedItem, action);
            setIsModalOpen(false);
            setSelectedItem(null);
            loadData(); // Refresh list
        } catch (e) {
            alert("Error processing request");
            console.error(e);
        } finally {
            setProcessing(false);
        }
    };

    const StatusBadge = ({ status }: { status: string }) => {
        const colors: any = {
            Pending: 'bg-yellow-100 text-yellow-700',
            Completed: 'bg-green-100 text-green-700',
            Failed: 'bg-red-100 text-red-700'
        };
        return <span className={`px-2 py-1 rounded-full text-xs font-bold ${colors[status] || 'bg-gray-100'}`}>{status}</span>;
    };

    return (
        <div className="p-6 h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Withdrawal Requests</h2>
                <div className="flex gap-2">
                    <button 
                        onClick={() => setFilter('Pending')}
                        className={`px-3 py-1 rounded-lg text-sm font-bold ${filter === 'Pending' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}
                    >
                        Pending
                    </button>
                    <button 
                         onClick={() => setFilter('All')}
                         className={`px-3 py-1 rounded-lg text-sm font-bold ${filter === 'All' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}
                    >
                        All History
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden flex-1 flex flex-col">
                <div className="overflow-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50 text-gray-600 text-xs uppercase sticky top-0">
                            <tr>
                                <th className="p-4 border-b">Date</th>
                                <th className="p-4 border-b">User ID</th>
                                <th className="p-4 border-b">Method</th>
                                <th className="p-4 border-b">Amount</th>
                                <th className="p-4 border-b">Status</th>
                                <th className="p-4 border-b text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm">
                            {loading ? (
                                <tr><td colSpan={6} className="p-8 text-center"><i className="fa-solid fa-spinner fa-spin"></i></td></tr>
                            ) : withdrawals.length === 0 ? (
                                <tr><td colSpan={6} className="p-8 text-center text-gray-500">No records found.</td></tr>
                            ) : (
                                withdrawals.map((w) => (
                                    <tr key={w.id} className="hover:bg-gray-50 border-b last:border-0">
                                        <td className="p-4 whitespace-nowrap text-gray-500">
                                            {new Date(w.date).toLocaleDateString()}
                                        </td>
                                        <td className="p-4 font-mono text-xs text-gray-500">{w.userId.substring(0, 8)}...</td>
                                        <td className="p-4 font-bold text-gray-700">{w.method}</td>
                                        <td className="p-4 font-bold text-green-600">${w.amount.toFixed(2)}</td>
                                        <td className="p-4"><StatusBadge status={w.status} /></td>
                                        <td className="p-4 text-right">
                                            {w.status === 'Pending' && (
                                                <button 
                                                    onClick={() => { setSelectedItem(w); setIsModalOpen(true); }}
                                                    className="bg-blue-500 text-white px-3 py-1.5 rounded-lg text-xs hover:bg-blue-600 transition"
                                                >
                                                    Review
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Action Modal */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Process Withdrawal">
                {selectedItem && (
                    <div className="p-4">
                        <div className="bg-gray-50 p-4 rounded-lg mb-6 text-sm">
                            <p className="flex justify-between mb-2"><span>User ID:</span> <span className="font-mono">{selectedItem.userId}</span></p>
                            <p className="flex justify-between mb-2"><span>Method:</span> <span className="font-bold">{selectedItem.method}</span></p>
                            <p className="flex justify-between mb-2"><span>Amount:</span> <span className="font-bold text-green-600">${selectedItem.amount.toFixed(2)}</span></p>
                            <div className="mt-4 pt-4 border-t border-gray-200">
                                <p className="text-xs text-gray-500 mb-1">Warning: Payment must be sent manually via your payment processor before clicking Approve.</p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                             <button 
                                onClick={() => handleAction('Reject')}
                                disabled={processing}
                                className="flex-1 bg-red-100 text-red-600 py-3 rounded-xl font-bold hover:bg-red-200 transition"
                            >
                                {processing ? 'Processing...' : 'Reject & Refund'}
                            </button>
                            <button 
                                onClick={() => handleAction('Approve')}
                                disabled={processing}
                                className="flex-1 bg-green-500 text-white py-3 rounded-xl font-bold hover:bg-green-600 transition"
                            >
                                {processing ? 'Processing...' : 'Mark as Sent'}
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default AdminWithdrawalsScreen;
