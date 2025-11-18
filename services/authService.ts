
import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged, 
    sendPasswordResetEmail, 
    setPersistence, 
    browserLocalPersistence, 
    browserSessionPersistence,
    deleteUser,
    User
} from "firebase/auth";
import { auth } from '../firebase';
import { createUserProfileDocument } from './firestoreService';

export const onAuthStateChangedListener = (callback: (user: User | null) => void) => {
    return onAuthStateChanged(auth, callback);
};

export const signUpUser = async (name: string, email: string, password: string): Promise<void> => {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        await createUserProfileDocument(user, { fullName: name });
        await signOut(auth); // Sign out to force manual login
    } catch (error: any) {
        throw error;
    }
};

export const signInUser = async (email: string, password: string, rememberMe: boolean): Promise<User> => {
    try {
        const persistence = rememberMe ? browserLocalPersistence : browserSessionPersistence;
        await setPersistence(auth, persistence);
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        return userCredential.user;
    } catch (error: any) {
         if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
            throw new Error('Invalid email or password.');
        }
        throw new Error(error.message);
    }
};

export const signOutUser = async (): Promise<void> => {
    try {
        await signOut(auth);
    } catch (error: any) {
        throw new Error(error.message);
    }
};

export const sendPasswordResetEmailHandler = async (email: string): Promise<void> => {
    try {
        await sendPasswordResetEmail(auth, email);
    } catch (error: any) {
        throw new Error(error.message);
    }
};

export const deleteCurrentUser = async (): Promise<void> => {
    const user = auth.currentUser;
    if (!user) {
        throw new Error("No user is currently signed in.");
    }

    try {
        await deleteUser(user);
    } catch (error: any) {
        console.error("Error deleting user account:", error);
        if (error.code === 'auth/requires-recent-login') {
            throw new Error("This is a sensitive operation and requires you to have recently signed in. Please sign out and sign back in to delete your account.");
        }
        throw new Error("Could not delete your account. Please try again later.");
    }
};
