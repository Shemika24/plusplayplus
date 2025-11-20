
/**
 * Utility to handle storage persistence.
 * It attempts to use Telegram CloudStorage if available (version >= 6.9)
 * to ensure data persists across sessions in the Telegram Web App.
 * Falls back to localStorage for web browsers or older Telegram clients.
 */

const isTelegramCloudStorageSupported = (): boolean => {
    return (
        typeof window !== 'undefined' &&
        !!window.Telegram?.WebApp?.CloudStorage &&
        !!window.Telegram.WebApp.isVersionAtLeast &&
        window.Telegram.WebApp.isVersionAtLeast('6.9')
    );
};

export const storageService = {
    setItem: async (key: string, value: string): Promise<void> => {
        return new Promise((resolve) => {
            if (isTelegramCloudStorageSupported()) {
                window.Telegram!.WebApp!.CloudStorage!.setItem(key, value, (err, stored) => {
                    if (err) {
                        console.warn('CloudStorage set error:', err);
                        // Fallback to local if cloud fails
                        try {
                            localStorage.setItem(key, value);
                        } catch (e) {}
                    }
                    resolve();
                });
            } else {
                try {
                    localStorage.setItem(key, value);
                } catch (e) {
                    console.error('LocalStorage set error:', e);
                }
                resolve();
            }
        });
    },

    getItem: async (key: string): Promise<string | null> => {
        return new Promise((resolve) => {
            if (isTelegramCloudStorageSupported()) {
                window.Telegram!.WebApp!.CloudStorage!.getItem(key, (err, value) => {
                    if (err) {
                        console.warn('CloudStorage get error:', err);
                        // Fallback to local
                        resolve(localStorage.getItem(key));
                    } else {
                        // Telegram returns empty string if not found sometimes, normalize to null if necessary
                        // checking docs: returns value or empty string if key doesn't exist.
                        // We treat empty string as null if that's the behavior, but usually it's distinct.
                        // Let's prefer the value if truthy or explicit empty string.
                        // If value is undefined/null from SDK, check local.
                        
                        if (value !== undefined && value !== null) {
                             resolve(value);
                        } else {
                             resolve(localStorage.getItem(key));
                        }
                    }
                });
            } else {
                resolve(localStorage.getItem(key));
            }
        });
    },

    removeItem: async (key: string): Promise<void> => {
        return new Promise((resolve) => {
            if (isTelegramCloudStorageSupported()) {
                window.Telegram!.WebApp!.CloudStorage!.removeItem(key, (err, deleted) => {
                    if (err) console.warn('CloudStorage remove error:', err);
                    try {
                        localStorage.removeItem(key);
                    } catch (e) {}
                    resolve();
                });
            } else {
                try {
                    localStorage.removeItem(key);
                } catch (e) {}
                resolve();
            }
        });
    }
};
