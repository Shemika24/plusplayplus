
import React, { useEffect, useState } from 'react';

// Using ipwho.is as it provides extensive connection details over HTTPS (CORS friendly)
const API_URL = 'https://ipwho.is/';

interface SecurityCheckProps {
    children: React.ReactNode;
}

const SecurityCheck: React.FC<SecurityCheckProps> = ({ children }) => {
    const [status, setStatus] = useState<'loading' | 'safe' | 'detected'>('loading');
    const [details, setDetails] = useState<string>('');
    const [reason, setReason] = useState<string>('');

    useEffect(() => {
        let isMounted = true;
        const checkSecurity = async () => {
            // Create a controller to abort the fetch if it takes too long
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3500); // 3.5s timeout

            try {
                const response = await fetch(API_URL, { signal: controller.signal });
                clearTimeout(timeoutId);

                if (!isMounted) return;

                if (!response.ok) {
                    // Fail open on HTTP errors
                    console.warn(`Security check skipped due to HTTP error: ${response.status}`);
                    setStatus('safe');
                    return;
                }

                const data = await response.json();

                if (!data.success) {
                    // If API fails (e.g. rate limit), default to safe
                    setStatus('safe');
                    return;
                }

                // 1. Check Explicit Security Flags (if provided by API)
                if (data.security) {
                    if (data.security.vpn || data.security.proxy || data.security.tor || data.security.hosting) {
                        setDetails(`${data.ip} (${data.connection?.isp})`);
                        setReason('High Risk Connection (VPN/Proxy)');
                        setStatus('detected');
                        return;
                    }
                }

                // 2. Heuristic Check on ISP/Org Names (Common Hosting/VPN Keywords)
                const isp = (data.connection?.isp || '').toLowerCase();
                const org = (data.connection?.org || '').toLowerCase();
                const blockKeywords = [
                    'vpn', 'proxy', 'hosting', 'cloud', 'datacenter', 'digitalocean', 
                    'aws', 'amazon', 'google cloud', 'azure', 'oracle', 'alibaba', 
                    'linode', 'vultr', 'hetzner', 'ovh', 'fly.io', 'render', 
                    'vercel', 'm247', 'data camp', 'hostinger', 'leaseweb'
                ];

                const isSuspicious = blockKeywords.some(keyword => isp.includes(keyword) || org.includes(keyword));

                if (isSuspicious) {
                    setDetails(`${data.ip} - ${data.connection?.org || data.connection?.isp}`);
                    setReason('Hosting/Data Center Network Detected');
                    setStatus('detected');
                    return;
                }

                setStatus('safe');

            } catch (error) {
                // If network error, timeout, or blocked by adblocker, fail open
                if (isMounted) {
                    console.warn("Security check bypassed:", error);
                    setStatus('safe');
                }
            } finally {
                clearTimeout(timeoutId);
            }
        };

        checkSecurity();

        return () => {
            isMounted = false;
        };
    }, []);

    // If a threat is detected, show the blocking screen
    if (status === 'detected') {
        return (
            <div className="fixed inset-0 bg-[#f8f9fa] z-[9999] flex flex-col items-center justify-center p-6 text-center font-sans">
                <div className="w-28 h-28 bg-red-100 rounded-full flex items-center justify-center mb-6 animate-bounce shadow-lg border-4 border-red-50">
                    <i className="fa-solid fa-user-shield text-red-600 text-6xl"></i>
                </div>
                
                <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Access Denied</h1>
                <p className="text-red-600 font-bold text-lg mb-6">{reason}</p>

                <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-200 w-full max-w-sm mb-8 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-red-500"></div>
                    <p className="text-xs text-gray-400 uppercase font-bold mb-2 tracking-wider">Connection Details</p>
                    <p className="text-base font-mono text-gray-800 break-all bg-gray-50 p-2 rounded border border-gray-200">
                        {details || 'Unknown IP'}
                    </p>
                    <div className="mt-4 flex items-center justify-center text-xs text-gray-500">
                        <i className="fa-solid fa-lock mr-1.5"></i>
                        <span>Protection by Dyverze Shield</span>
                    </div>
                </div>

                <p className="text-gray-600 max-w-md leading-relaxed mb-8">
                    To ensure fair play and security for all users, we do not allow connections via <strong>VPN, Proxy, or Hosting Networks</strong>.
                    <br/><br/>
                    Please disable these services and try again.
                </p>

                <button 
                    onClick={() => window.location.reload()} 
                    className="px-8 py-4 bg-gradient-to-r from-red-600 to-red-500 text-white font-bold rounded-xl shadow-lg hover:shadow-red-500/30 hover:-translate-y-1 transition-all duration-300 flex items-center"
                >
                    <i className="fa-solid fa-rotate-right mr-2"></i>
                    Reload Application
                </button>
            </div>
        );
    }

    // In 'loading' or 'safe' state, render children immediately.
    // This allows the SplashScreen (in App.tsx) to be visible while this runs in the background.
    return <>{children}</>;
};

export default SecurityCheck;
