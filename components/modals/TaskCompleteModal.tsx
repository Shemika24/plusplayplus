import React, { useEffect } from 'react';

interface TaskCompleteModalProps {
    isOpen: boolean;
    onClose: () => void;
    reward: number | string;
    taskName: string;
}

const TaskCompleteModal: React.FC<TaskCompleteModalProps> = ({ isOpen, onClose, reward, taskName }) => {
    useEffect(() => {
        if (isOpen) {
            const timer = setTimeout(() => {
                onClose();
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [isOpen, onClose]);
    
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-[110] animate-fadeIn" onClick={onClose}>
            <div className="bg-white p-6 rounded-2xl shadow-lg w-11/12 max-w-sm text-center animate-slideInUp" onClick={e => e.stopPropagation()}>
                <i className="fa-solid fa-wand-magic-sparkles text-6xl mx-auto text-success mb-4"></i>
                <h2 className="text-2xl font-bold text-dark mb-2">Task Complete!</h2>
                <p className="text-gray mb-6">
                    You've earned <span className="font-bold text-dark">{reward}</span> points for completing "{taskName}"!
                </p>
            </div>
        </div>
    );
};

export default TaskCompleteModal;