import React, { useState, useEffect } from 'react';
import { Task } from '../../types';

interface AdViewerModalProps {
    isOpen: boolean;
    onClose: () => void;
    task: Task;
    onClaim: () => void;
}

type View = 'viewing' | 'congrats';

const AdViewerModal: React.FC<AdViewerModalProps> = ({ isOpen, onClose, task, onClaim }) => {
    // Wait time is total time minus 4 seconds for the user to claim, with a minimum of 1 second.
    const viewingDuration = Math.max(1, task.time - 4); // Alterado de -3 para -4

    const [view, setView] = useState<View>('viewing');
    const [countdown, setCountdown] = useState(viewingDuration);

    useEffect(() => {
        if (isOpen) {
            setView('viewing');
            // Ensure the countdown starts immediately when the modal opens
            setCountdown(viewingDuration);
        }
    }, [isOpen, viewingDuration, task]); // Dependência 'task' adicionada para resetar corretamente em caso de mudança de tarefa
    
    useEffect(() => {
        if (isOpen && view === 'viewing' && countdown > 0) {
            const timer = setTimeout(() => setCountdown(prev => prev - 1), 1000);
            return () => clearTimeout(timer);
        } else if (countdown === 0 && view === 'viewing') {
            setView('congrats');
        }
    }, [isOpen, view, countdown]);

    useEffect(() => {
        if (view === 'congrats') {
            const timer = setTimeout(() => {
                onClaim();
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [view, onClaim]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-[100] animate-fadeIn" onClick={onClose}>
            <div className="bg-white p-6 rounded-2xl shadow-lg max-w-sm w-11/12 relative animate-slideInUp text-center" onClick={e => e.stopPropagation()}>
                <button className="absolute top-4 right-4 text-gray hover:text-dark" onClick={onClose} aria-label="Close">
                    <i className="fa-solid fa-xmark text-2xl"></i>
                </button>
                
                {view === 'viewing' ? (
                    <>
                        <h2 className="text-2xl font-bold text-dark mb-4">Viewing Ad...</h2>
                        <p className="text-gray mb-6">Please wait for the timer to finish.</p>
                        <div className="w-32 h-32 mx-auto rounded-full border-8 border-gray-medium flex items-center justify-center">
                            <span className="text-5xl font-bold text-primary">{countdown}</span>
                        </div>
                    </>
                ) : (
                    <>
                        <i className="fa-solid fa-wand-magic-sparkles text-6xl mx-auto text-success mb-4"></i>
                        <h2 className="text-2xl font-bold text-dark mb-2">Congratulations!</h2>
                        <p className="text-gray mb-6">You've earned <span className="font-bold text-dark">{task.reward}</span> points!</p>
                    </>
                )}
            </div>
        </div>
    );
};

export default AdViewerModal;