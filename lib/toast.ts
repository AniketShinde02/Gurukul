import { toast as hotToast } from 'react-hot-toast';
import { SOUNDS } from '@/hooks/useSound';

// Helper to play sound (works without React context)
const playSound = (soundKey: keyof typeof SOUNDS) => {
    try {
        const audio = new Audio(SOUNDS[soundKey]);
        audio.volume = 0.7;
        audio.play().catch(() => {
            // Silently fail if autoplay is blocked
        });
    } catch (e) {
        // Ignore errors
    }
};

// Enhanced toast with automatic sound effects
export const toast = {
    success: (message: string, options?: any) => {
        playSound('SUCCESS');
        return hotToast.success(message, options);
    },
    error: (message: string, options?: any) => {
        playSound('ERROR');
        return hotToast.error(message, options);
    },
    // Pass through other methods
    loading: hotToast.loading,
    custom: hotToast.custom,
    dismiss: hotToast.dismiss,
    remove: hotToast.remove,
    promise: hotToast.promise,
};

// Re-export the default toast for cases where we just want the original
export { toast as default };
