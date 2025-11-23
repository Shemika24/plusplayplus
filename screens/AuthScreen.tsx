
import React, { useState, useEffect } from 'react';
import { signInUser, signUpUser, sendPasswordResetEmailHandler } from '../services/authService';
import InfoModal from '../components/modals/InfoModal';

type ModalType = 'success' | 'error' | 'info';
type AuthView = 'login' | 'signup' | 'forgotPassword';

interface ActionButton {
  text: string;
  onClick: () => void;
  primary?: boolean;
}

interface ModalState {
  isOpen: boolean;
  title: string;
  message: string;
  type: ModalType;
  actions: ActionButton[];
}


const AuthScreen: React.FC = () => {
    const [authView, setAuthView] = useState<AuthView>('login');
    const [modalState, setModalState] = useState<ModalState>({
        isOpen: false,
        title: '',
        message: '',
        type: 'info',
        actions: []
    });

    const closeModal = () => setModalState(prev => ({ ...prev, isOpen: false }));
    
    const renderContent = () => {
        switch (authView) {
            case 'login':
                return <SignInForm onToggleView={setAuthView} />;
            case 'signup':
                return <SignUpForm onToggleView={setAuthView} setModalState={setModalState} />;
            case 'forgotPassword':
                return <ForgotPasswordForm onToggleView={setAuthView} setModalState={setModalState} />;
            default:
                return <SignInForm onToggleView={setAuthView} />;
        }
    };

    return (
        <div className="min-h-screen bg-[var(--gray-light)] flex flex-col justify-center items-center p-4 transition-colors duration-300">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="inline-block bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] p-3 rounded-2xl shadow-lg">
                        <i className="fa-solid fa-gem text-white text-4xl"></i>
                    </div>
                    <h1 className="text-3xl font-bold text-[var(--dark)] mt-4">DYVERZE ADS</h1>
                    <p className="text-[var(--gray)]">
                         {authView === 'login' && 'Welcome back! Please sign in.'}
                         {authView === 'signup' && 'Create an account to get started.'}
                         {authView === 'forgotPassword' && 'Reset your password.'}
                    </p>
                </div>

                <div className="bg-[var(--bg-card)] rounded-2xl shadow-xl p-6 md:p-8 border border-[var(--border-color)] transition-colors duration-300">
                    {renderContent()}
                </div>
            </div>
            <InfoModal 
                isOpen={modalState.isOpen}
                onClose={closeModal}
                title={modalState.title}
                message={modalState.message}
                type={modalState.type}
                actions={modalState.actions}
                isDismissible={false}
            />
        </div>
    );
};

// --- Password Input Component ---
const PasswordInput: React.FC<{ id: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; placeholder?: string }> = ({ id, value, onChange, placeholder = "••••••••" }) => {
    const [showPassword, setShowPassword] = useState(false);
    return (
        <div className="relative">
            <input
                id={id}
                className="w-full p-3 pr-10 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:outline-none transition text-[var(--dark)]"
                type="text" 
                style={{ WebkitTextSecurity: showPassword ? 'none' : 'disc' } as any}
            />
            <input
                id={id}
                className="w-full p-3 pr-10 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:outline-none transition absolute inset-0 z-10 text-[var(--dark)]"
                type={showPassword ? 'text' : 'password'}
                placeholder={placeholder}
                value={value}
                onChange={onChange}
                required
            />
            <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center justify-center w-10 text-[var(--gray)] hover:text-[var(--dark)] z-20"
                aria-label={showPassword ? "Hide password" : "Show password"}
            >
                <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
            </button>
        </div>
    );
};


// --- Sign In Form Component ---
const SignInForm: React.FC<{ onToggleView: (view: AuthView) => void }> = ({ onToggleView }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(true);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await signInUser(email, password, rememberMe);
        } catch (err: any) {
            setError(err.message || 'Failed to sign in. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <h2 className="text-2xl font-bold text-center text-[var(--dark)]">Sign In</h2>
            
            <div>
                <label className="text-sm font-medium text-[var(--gray)]" htmlFor="email">Email</label>
                <input
                    id="email"
                    className="mt-1 w-full p-3 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:outline-none transition text-[var(--dark)]"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
            </div>

            <div>
                 <label className="text-sm font-medium text-[var(--gray)]" htmlFor="password">Password</label>
                 <PasswordInput id="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            
            <div className="flex items-center justify-between">
                <div className="flex items-center">
                    <input type="checkbox" id="rememberMe" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="h-4 w-4 rounded text-[var(--primary)] focus:ring-[var(--primary)] bg-[var(--bg-input)] border-[var(--border-color)]" />
                    <label htmlFor="rememberMe" className="ml-2 block text-sm text-[var(--gray)]">Remember Me</label>
                </div>
                <button type="button" onClick={() => onToggleView('forgotPassword')} className="text-sm text-[var(--primary)] hover:underline">Forgot password?</button>
            </div>

            {error && <p className="text-red-500 text-sm text-center bg-red-100 dark:bg-red-900/20 p-3 rounded-lg border border-red-200 dark:border-red-800">{error}</p>}
            
            <button
                type="submit"
                disabled={loading}
                className="w-full bg-[var(--primary)] text-white font-bold py-3 rounded-lg hover:bg-[var(--primary-dark)] transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {loading ? <i className="fa-solid fa-spinner fa-spin"></i> : 'Sign In'}
            </button>
            
            <p className="text-center text-sm text-[var(--gray)]">
                Don't have an account?{' '}
                <button type="button" onClick={() => onToggleView('signup')} className="font-semibold text-[var(--primary)] hover:underline">
                    Sign Up
                </button>
            </p>
        </form>
    );
};

// --- Sign Up Form Component ---
const SignUpForm: React.FC<{ onToggleView: (view: AuthView) => void; setModalState: React.Dispatch<React.SetStateAction<ModalState>> }> = ({ onToggleView, setModalState }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [acceptedTerms, setAcceptedTerms] = useState(false);
    const [loading, setLoading] = useState(false);
    
    // Telegram Auto-Fill Check
    useEffect(() => {
        const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user;
        if (tgUser) {
            const firstName = tgUser.first_name || '';
            const lastName = tgUser.last_name || '';
            const fullName = `${firstName} ${lastName}`.trim();
            if (fullName) {
                setName(fullName);
            }
        }
    }, []);

    const closeModal = () => setModalState(prev => ({ ...prev, isOpen: false }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!acceptedTerms) {
             setModalState({
                isOpen: true,
                title: 'Terms Required',
                message: 'Please accept the Terms of Service and Privacy Policy to create an account.',
                type: 'error',
                actions: [{ text: 'OK', onClick: closeModal, primary: true }]
            });
            return;
        }

        // --- Validation for Full Name ---
        // Min 3 characters, no numbers, no symbols
        if (name.trim().length < 3) {
             setModalState({
                isOpen: true,
                title: 'Invalid Name',
                message: 'Full Name must be at least 3 characters long.',
                type: 'error',
                actions: [{ text: 'OK', onClick: closeModal, primary: true }]
            });
            return;
        }

        if (!/^[a-zA-Z\s]+$/.test(name.trim())) {
            setModalState({
                isOpen: true,
                title: 'Invalid Name',
                message: 'Full Name must contain only letters (no numbers or symbols).',
                type: 'error',
                actions: [{ text: 'OK', onClick: closeModal, primary: true }]
            });
            return;
        }
        // --------------------------------

        if (password !== confirmPassword) {
            setModalState({
                isOpen: true,
                title: 'Password Mismatch',
                message: 'The passwords you entered do not match. Please try again.',
                type: 'error',
                actions: [{ text: 'OK', onClick: closeModal, primary: true }]
            });
            return;
        }
        if (password.length < 8) {
            setModalState({
                isOpen: true,
                title: 'Invalid Input',
                message: 'Password should be at least 8 characters.',
                type: 'error',
                actions: [{ text: 'OK', onClick: closeModal, primary: true }]
            });
            return;
        }
        setLoading(true);
        try {
            await signUpUser(name, email, password);
            
            setModalState({
                isOpen: true,
                title: 'Account Created!',
                message: 'Your account has been successfully created. Please log in to continue.',
                type: 'success',
                actions: [
                    { text: 'Login', onClick: () => { closeModal(); onToggleView('login'); }, primary: true },
                ]
            });
            setName('');
            setEmail('');
            setPassword('');
            setConfirmPassword('');
            setAcceptedTerms(false);
        } catch (err: any) {
            let errorMessage = err.message || 'Failed to create an account.';
            if (err.code === 'auth/email-already-in-use') {
                errorMessage = 'An account with this email already exists.';
            }
            setModalState({
                isOpen: true,
                title: 'Registration Failed',
                message: errorMessage,
                type: 'error',
                actions: [{ text: 'OK', onClick: closeModal, primary: true }]
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            <h2 className="text-2xl font-bold text-center text-[var(--dark)]">Create Account</h2>
            
            <div>
                 <label className="text-sm font-medium text-[var(--gray)]" htmlFor="name">Full Name</label>
                <input
                    id="name"
                    className="mt-1 w-full p-3 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:outline-none transition text-[var(--dark)]"
                    type="text"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                />
            </div>

             <div>
                <label className="text-sm font-medium text-[var(--gray)]" htmlFor="signup-email">Email</label>
                <input
                    id="signup-email"
                    className="mt-1 w-full p-3 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:outline-none transition text-[var(--dark)]"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
            </div>

            <div>
                 <label className="text-sm font-medium text-[var(--gray)]" htmlFor="signup-password">Password</label>
                <PasswordInput id="signup-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="•••••••• (min. 8 characters)" />
            </div>

             <div>
                 <label className="text-sm font-medium text-[var(--gray)]" htmlFor="confirm-password">Confirm Password</label>
                 <PasswordInput id="confirm-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
            </div>
            
            <div className="flex items-start">
                <div className="flex items-center h-5">
                    <input
                        id="terms"
                        type="checkbox"
                        checked={acceptedTerms}
                        onChange={(e) => setAcceptedTerms(e.target.checked)}
                        className="w-4 h-4 border border-[var(--border-color)] rounded bg-[var(--bg-input)] focus:ring-3 focus:ring-[var(--primary)]"
                    />
                </div>
                <label htmlFor="terms" className="ml-2 text-sm font-medium text-[var(--gray)]">
                    I agree to the <a href="#" target="_blank" rel="noopener noreferrer" className="text-[var(--primary)] hover:underline">Terms of Service</a> and <a href="#" target="_blank" rel="noopener noreferrer" className="text-[var(--primary)] hover:underline">Privacy Policy</a>.
                </label>
            </div>

            <button
                type="submit"
                disabled={loading}
                className="w-full bg-[var(--primary)] text-white font-bold py-3 rounded-lg hover:bg-[var(--primary-dark)] transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {loading ? <i className="fa-solid fa-spinner fa-spin"></i> : 'Create Account'}
            </button>
            
            <p className="text-center text-sm text-[var(--gray)]">
                Already have an account?{' '}
                <button type="button" onClick={() => onToggleView('login')} className="font-semibold text-[var(--primary)] hover:underline">
                    Sign In
                </button>
            </p>
        </form>
    );
};

// --- Forgot Password Form Component ---
const ForgotPasswordForm: React.FC<{ onToggleView: (view: AuthView) => void; setModalState: React.Dispatch<React.SetStateAction<ModalState>> }> = ({ onToggleView, setModalState }) => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);

    const closeModal = () => setModalState(prev => ({ ...prev, isOpen: false }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await sendPasswordResetEmailHandler(email);
            setModalState({
                isOpen: true,
                title: 'Check Your Email',
                message: 'If an account exists for this email, we have sent a password reset link.',
                type: 'info',
                actions: [{ text: 'OK', onClick: () => { closeModal(); onToggleView('login'); }, primary: true }]
            });
            setEmail('');
        } catch (err: any) {
             setModalState({
                isOpen: true,
                title: 'Error',
                message: err.message || 'An unexpected error occurred.',
                type: 'error',
                actions: [{ text: 'OK', onClick: closeModal, primary: true }]
            });
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <h2 className="text-2xl font-bold text-center text-[var(--dark)]">Forgot Password</h2>
            <p className="text-center text-sm text-[var(--gray)]">
                Enter your email address and we'll send you a link to reset your password.
            </p>
            
            <div>
                <label className="text-sm font-medium text-[var(--gray)]" htmlFor="reset-email">Email</label>
                <input
                    id="reset-email"
                    className="mt-1 w-full p-3 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:outline-none transition text-[var(--dark)]"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
            </div>
            
            <button
                type="submit"
                disabled={loading}
                className="w-full bg-[var(--primary)] text-white font-bold py-3 rounded-lg hover:bg-[var(--primary-dark)] transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {loading ? <i className="fa-solid fa-spinner fa-spin"></i> : 'Send Reset Link'}
            </button>
            
            <p className="text-center text-sm text-[var(--gray)]">
                Remember your password?{' '}
                <button type="button" onClick={() => onToggleView('login')} className="font-semibold text-[var(--primary)] hover:underline">
                    Sign In
                </button>
            </p>
        </form>
    );
}

export default AuthScreen;
