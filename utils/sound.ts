
export const playSound = (src: string, volume: number = 1.0) => {
    try {
        const audio = new Audio(src);
        audio.volume = volume;
        audio.play().catch(() => {
            // Silently ignore playback errors (e.g. user didn't interact with doc yet)
        });
    } catch (e) {
        // Silently ignore audio initialization errors
    }
};

export const vibrate = (pattern: number | number[]) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
        try {
            navigator.vibrate(pattern);
        } catch (e) {
            // Ignore vibration errors
        }
    }
};

export const SOUNDS = {
    SUCCESS: 'https://actions.google.com/sounds/v1/cartoon/magic_chime.ogg',
    ERROR: 'https://actions.google.com/sounds/v1/cartoon/cartoon_boing.ogg',
};
