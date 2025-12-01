
import { 
    collection, 
    getDocs, 
    query, 
    orderBy, 
    limit, 
    collectionGroup, 
    where, 
    doc, 
    updateDoc, 
    getCountFromServer,
    Timestamp,
    increment,
    writeBatch
} from "firebase/firestore";
import { db } from '../firebase';
import { UserProfile, Withdrawal } from '../types';

// Define an Extended Withdrawal type that includes the UserID (since it comes from a subcollection)
export interface AdminWithdrawal extends Withdrawal {
    userId: string;
    userEmail?: string; // Optional, fetched separately if needed
    docId: string; // The specific document ID of the withdrawal
}

// 1. Get Overall Stats
export const getAdminStats = async () => {
    try {
        const usersColl = collection(db, "users");
        const usersSnapshot = await getCountFromServer(usersColl);
        const totalUsers = usersSnapshot.data().count;

        // Pending Withdrawals Count
        const withdrawalsQuery = query(
            collectionGroup(db, 'withdrawalHistory'), 
            where('status', '==', 'Pending')
        );
        const pendingSnapshot = await getCountFromServer(withdrawalsQuery);
        const pendingWithdrawals = pendingSnapshot.data().count;

        return {
            totalUsers,
            pendingWithdrawals
        };
    } catch (e) {
        console.error("Error fetching stats", e);
        return { totalUsers: 0, pendingWithdrawals: 0 };
    }
};

// 2. Get All Users
export const getAllUsers = async (limitCount = 50): Promise<UserProfile[]> => {
    const usersRef = collection(db, "users");
    const q = query(usersRef, orderBy("points", "desc"), limit(limitCount));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as UserProfile);
};

// 3. Get Global Withdrawals (Using Collection Group)
export const getGlobalWithdrawals = async (statusFilter: 'All' | 'Pending' | 'Completed' | 'Failed' = 'All'): Promise<AdminWithdrawal[]> => {
    let q;
    
    if (statusFilter === 'All') {
        q = query(
            collectionGroup(db, 'withdrawalHistory'), 
            orderBy('timestamp', 'desc'), 
            limit(50)
        );
    } else {
        q = query(
            collectionGroup(db, 'withdrawalHistory'), 
            where('status', '==', statusFilter),
            orderBy('timestamp', 'desc'), 
            limit(50)
        );
    }

    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => {
        const data = doc.data();
        // The parent of the withdrawalHistory subcollection is the User Document
        const userRef = doc.ref.parent.parent; 
        const userId = userRef ? userRef.id : 'unknown';

        return {
            id: doc.id,
            docId: doc.id,
            userId: userId,
            amount: data.amount,
            method: data.method,
            status: data.status,
            date: data.date,
            timestamp: data.timestamp
        } as AdminWithdrawal;
    });
};

// 4. Process Withdrawal (Approve/Reject)
export const processWithdrawal = async (withdrawal: AdminWithdrawal, action: 'Approve' | 'Reject', rejectionReason?: string) => {
    const userRef = doc(db, "users", withdrawal.userId);
    const withdrawalRef = doc(db, "users", withdrawal.userId, "withdrawalHistory", withdrawal.docId);

    const batch = writeBatch(db);
    const pointsToRefund = withdrawal.amount * 100000; // Recalculate based on POINTS_PER_DOLLAR

    if (action === 'Approve') {
        // Just mark as completed, points already deducted
        batch.update(withdrawalRef, { 
            status: 'Completed',
            processedAt: Timestamp.now()
        });
        
        batch.update(userRef, {
            'withdrawalStats.pending': increment(-withdrawal.amount),
            'withdrawalStats.completed': increment(withdrawal.amount)
        });

    } else {
        // Reject: Refund points
        batch.update(withdrawalRef, { 
            status: 'Failed',
            notes: rejectionReason || "Declined by Admin",
            processedAt: Timestamp.now()
        });

        batch.update(userRef, {
            points: increment(pointsToRefund), // Refund
            'withdrawalStats.pending': increment(-withdrawal.amount),
            'withdrawalStats.redeemedCount': increment(-1) // Revert the count increment
        });
    }

    await batch.commit();
};
