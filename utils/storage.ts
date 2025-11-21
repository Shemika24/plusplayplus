

/**
 * Utility to handle storage persistence.
 * Defaults to localStorage.
 */

export const storageService = {
    setItem: async (key: string, value: string): Promise<void> => {
        return new Promise((resolve) => {
            try {
                localStorage.setItem(key, value);
            } catch (e) {
                console.error('LocalStorage set error:', e);
            }
            resolve();
        });
    },

    getItem: async (key: string): Promise<string | null> => {
        return new Promise((resolve) => {
            resolve(localStorage.getItem(key));
        });
    },

    removeItem: async (key: string): Promise<void> => {
        return new Promise((resolve) => {
            try {
                localStorage.removeItem(key);
            } catch (e) {}
            resolve();
        });
    }
};