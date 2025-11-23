
/**
 * Utility functions for Telegram Web App integration
 */

export const verifyTelegramData = () => {
    if (!window.Telegram?.WebApp) {
        return { isAuthentic: false, user: null, rawData: '' };
    }

    // Telegram provides a hash to verify data authenticity
    const initData = window.Telegram.WebApp.initData;
    const initDataUnsafe = window.Telegram.WebApp.initDataUnsafe;
    const hash = initDataUnsafe.hash;
    const user = initDataUnsafe.user;

    // In a real production environment, you must validate this hash on your backend
    // using your Bot Token (HMAC-SHA256).
    // Do NOT validate the hash with the bot token on the client-side for security reasons.
    
    if (process.env.NODE_ENV === 'development') {
        console.log("Telegram Hash for Backend Validation:", hash);
    }
  
    return {
      isAuthentic: !!hash, // Simplified client-side existence check
      user: user,
      rawData: initData
    };
};
