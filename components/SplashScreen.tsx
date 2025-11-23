import React, { useMemo } from 'react';

const SplashScreen: React.FC = () => {
    const particles = useMemo(() => {
        return Array.from({ length: 50 }).map((_, i) => {
            const size = Math.random() * 3 + 1;
            const style = {
                width: `${size}px`,
                height: `${size}px`,
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 15}s`,
                animationDuration: `${Math.random() * 10 + 5}s`,
            };
            return <div key={i} className="particle" style={style}></div>;
        });
    }, []);

    return (
        <>
            <style>{`
                .splash-body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 50%, var(--accent) 100%);
                    height: 100vh;
                    width: 100vw;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    overflow: hidden;
                    position: fixed;
                    top: 0;
                    left: 0;
                    z-index: 1000;
                }

                .splash-container {
                    text-align: center;
                    color: white;
                    position: relative;
                    z-index: 10;
                    max-width: 90%;
                }

                .logo-container {
                    margin-bottom: 40px;
                    position: relative;
                }

                .logo-icon {
                    width: 120px;
                    height: 120px;
                    margin: 0 auto 25px;
                    background: linear-gradient(135deg, var(--primary-light), var(--accent));
                    border-radius: 30px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 50px;
                    box-shadow: 0 15px 30px rgba(0, 0, 0, 0.2);
                    animation: float 3s ease-in-out infinite;
                    position: relative;
                    overflow: hidden;
                }

                .logo-icon::before {
                    content: '';
                    position: absolute;
                    top: -50%;
                    left: -50%;
                    width: 200%;
                    height: 200%;
                    background: linear-gradient(45deg, transparent, rgba(255,255,255,0.1), transparent);
                    transform: rotate(45deg);
                    animation: shine 3s infinite;
                }

                @keyframes shine {
                    0% { transform: translateX(-100%) translateY(-100%) rotate(45deg); }
                    100% { transform: translateX(100%) translateY(100%) rotate(45deg); }
                }

                @keyframes float {
                    0%, 100% { transform: translateY(0) rotate(0deg); }
                    33% { transform: translateY(-15px) rotate(2deg); }
                    66% { transform: translateY(-8px) rotate(-1deg); }
                }

                .logo-text {
                    font-size: 3.2rem;
                    font-weight: 800;
                    letter-spacing: 1.5px;
                    text-shadow: 2px 2px 10px rgba(0, 0, 0, 0.3);
                    margin-bottom: 10px;
                    background: linear-gradient(to right, white, var(--gray-light));
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                }

                .logo-subtitle {
                    font-size: 1.3rem;
                    font-weight: 400;
                    opacity: 0.9;
                    color: var(--gray-light);
                }

                .loading-container {
                    margin-top: 40px;
                }

                .loading-text {
                    font-size: 1rem;
                    margin-top: 20px;
                    color: var(--gray-light);
                    font-weight: 500;
                    min-height: 24px;
                }

                .pulse {
                    animation: pulse 2s infinite;
                }

                @keyframes pulse {
                    0% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.05); opacity: 0.9; }
                    100% { transform: scale(1); opacity: 1; }
                }

                .floating-elements {
                    position: absolute;
                    width: 100%;
                    height: 100%;
                    top: 0;
                    left: 0;
                    z-index: 1;
                }

                .floating-element {
                    position: absolute;
                    border-radius: 50%;
                    animation: floatAround 20s infinite linear;
                    opacity: 0.7;
                }

                .floating-element:nth-child(1) { width: 80px; height: 80px; top: 15%; left: 10%; background: linear-gradient(135deg, var(--secondary), var(--accent-secondary)); animation-duration: 25s; animation-delay: 0s; }
                .floating-element:nth-child(2) { width: 120px; height: 120px; top: 70%; left: 85%; background: linear-gradient(135deg, var(--accent), var(--primary-light)); animation-duration: 30s; animation-delay: 2s; }
                .floating-element:nth-child(3) { width: 60px; height: 60px; top: 80%; left: 15%; background: linear-gradient(135deg, var(--success), var(--accent)); animation-duration: 20s; animation-delay: 1s; }
                .floating-element:nth-child(4) { width: 100px; height: 100px; top: 20%; left: 80%; background: linear-gradient(135deg, var(--warning), var(--secondary)); animation-duration: 35s; animation-delay: 3s; }

                @keyframes floatAround {
                    0% { transform: translate(0, 0) rotate(0deg); }
                    25% { transform: translate(40px, 60px) rotate(90deg); }
                    50% { transform: translate(80px, 0) rotate(180deg); }
                    75% { transform: translate(40px, -60px) rotate(270deg); }
                    100% { transform: translate(0, 0) rotate(360deg); }
                }
                
                .version { position: absolute; bottom: 25px; right: 25px; font-size: 0.9rem; color: var(--gray-light); opacity: 0.8; font-weight: 500; }
                .tagline { position: absolute; bottom: 25px; left: 25px; font-size: 0.9rem; color: var(--gray-light); opacity: 0.8; font-weight: 500; }

                @keyframes fadeInUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }

                .splash-container > * { animation: fadeInUp 1s ease-out forwards; opacity: 0; }
                .logo-container { animation-delay: 0.2s; }
                .logo-text { animation-delay: 0.4s; }
                .logo-subtitle { animation-delay: 0.6s; }
                .loading-container { animation-delay: 0.8s; }

                .particles { position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 0; }
                .particle { position: absolute; background: rgba(255, 255, 255, 0.5); border-radius: 50%; animation: particleFloat 15s infinite linear; }

                @keyframes particleFloat {
                    0% { transform: translateY(100vh) rotate(0deg); opacity: 0; }
                    10% { opacity: 1; }
                    90% { opacity: 1; }
                    100% { transform: translateY(-100px) rotate(360deg); opacity: 0; }
                }

                @media (max-width: 768px) {
                    .logo-text { font-size: 2.5rem; }
                    .logo-subtitle { font-size: 1.1rem; }
                    .logo-icon { width: 100px; height: 100px; font-size: 40px; }
                }

                @media (max-width: 480px) {
                    .logo-text { font-size: 2rem; }
                    .logo-subtitle { font-size: 1rem; }
                    .logo-icon { width: 80px; height: 80px; font-size: 35px; }
                    .version, .tagline { font-size: 0.8rem; }
                }
            `}</style>
            <div className="splash-body">
                 <div className="particles" id="particles">{particles}</div>
    
                <div className="floating-elements">
                    <div className="floating-element"></div>
                    <div className="floating-element"></div>
                    <div className="floating-element"></div>
                    <div className="floating-element"></div>
                </div>

                <div className="splash-container">
                    <div className="logo-container">
                        <div className="logo-icon pulse"><i className="fa-solid fa-gem"></i></div>
                        <h1 className="logo-text">DYVERZE ADS</h1>
                        <p className="logo-subtitle">Turn your time into real earnings</p>
                    </div>

                    <div className="loading-container">
                         <div className="loading-text" id="loadingText">
                            <i className="fa-solid fa-spinner fa-spin text-2xl"></i>
                         </div>
                    </div>
                </div>

                <div className="tagline">#1 in ad rewards</div>
                <div className="version">v2.1.0</div>
            </div>
        </>
    );
};

export default SplashScreen;