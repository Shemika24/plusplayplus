
export const THEMES = {
    light: {
        '--primary': '#4a6bff',
        '--primary-dark': '#3a5bef',
        '--primary-light': '#5a7bff',
        '--secondary': '#ff9f43',
        '--accent': '#00d2d3',
        '--accent-secondary': '#ff6b9d',
        '--success': '#00b894',
        '--warning': '#fdcb6e',
        '--error': '#e17055',
        
        // Backgrounds
        '--gray-light': '#f3f4f6', // Main Background (Tailwind gray-100)
        '--bg-card': '#ffffff',
        '--bg-card-hover': '#f9fafb', // Light hover
        '--bg-input': '#f9fafb',
        
        // Text & Borders
        '--dark': '#1f2937', // Main Text (Tailwind gray-800)
        '--gray': '#6b7280', // Secondary Text (Tailwind gray-500)
        '--border-color': '#e5e7eb',
        '--text-secondary': '#6b7280',
    },
    dark: {
        '--primary': '#6366f1', // Indigo-500
        '--primary-dark': '#4f46e5',
        '--primary-light': '#818cf8',
        '--secondary': '#f59e0b', // Amber-500
        '--accent': '#14b8a6', // Teal-500
        '--accent-secondary': '#f43f5e', // Rose-500
        '--success': '#10b981',
        '--warning': '#f59e0b',
        '--error': '#ef4444',

        // Backgrounds - Realistic Dark Mode (Not Pure Black)
        '--gray-light': '#111827', // Main Background (Tailwind gray-900)
        '--bg-card': '#1f2937', // Card Background (Tailwind gray-800)
        '--bg-card-hover': '#374151', // Hover state (Tailwind gray-700)
        '--bg-input': '#374151', // Input background
        
        // Text & Borders
        '--dark': '#f9fafb', // Main Text (Tailwind gray-50)
        '--gray': '#9ca3af', // Secondary Text (Tailwind gray-400)
        '--border-color': '#374151', // Border (Tailwind gray-700)
        '--text-secondary': '#9ca3af',
    }
};

export const applyTheme = (themeName: string) => {
    const theme = THEMES[themeName as keyof typeof THEMES] || THEMES.light;
    const root = document.documentElement;
    Object.entries(theme).forEach(([key, value]) => {
        root.style.setProperty(key, value as string);
    });
};

export const toggleTheme = (currentTheme: string): string => {
    return currentTheme === 'dark' ? 'light' : 'dark';
};
