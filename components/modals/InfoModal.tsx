
import React from 'react';
import Modal from '../Modal';

type ModalType = 'success' | 'error' | 'info';

interface ActionButton {
  text: string;
  onClick: () => void;
  primary?: boolean;
}

interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type: ModalType;
  actions: ActionButton[];
  isDismissible?: boolean;
}

const InfoModal: React.FC<InfoModalProps> = ({ isOpen, onClose, title, message, type, actions, isDismissible = true }) => {
  if (!isOpen) return null;

  const typeDetails = {
    success: {
      icon: 'fa-solid fa-check-circle',
      color: 'text-green-500',
      bgColor: 'bg-green-100',
      borderColor: 'border-green-200',
    },
    error: {
      icon: 'fa-solid fa-times-circle',
      color: 'text-red-500',
      bgColor: 'bg-red-100',
      borderColor: 'border-red-200',
    },
    info: {
      icon: 'fa-solid fa-info-circle',
      color: 'text-blue-500',
      bgColor: 'bg-blue-100',
      borderColor: 'border-blue-200',
    },
  };

  const details = typeDetails[type];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="" isDismissible={isDismissible}>
      <div className="text-center p-6">
        <div className={`w-20 h-20 mx-auto ${details.bgColor} rounded-full flex items-center justify-center mb-4 border-4 ${details.borderColor}`}>
          <i className={`${details.icon} ${details.color} text-4xl`}></i>
        </div>
        <h3 className="text-2xl font-bold text-[var(--dark)] mb-2">{title}</h3>
        <p className="text-[var(--gray)] whitespace-pre-wrap">{message}</p>
        <div className="mt-6 flex flex-col sm:flex-row-reverse gap-3">
          {actions.map((action, index) => (
            <button
              key={index}
              onClick={action.onClick}
              className={`w-full font-bold py-3 rounded-xl shadow-lg transition-transform hover:scale-105 ${
                action.primary
                  ? 'bg-[var(--primary)] text-white'
                  : 'bg-gray-200 text-[var(--dark)]'
              }`}
            >
              {action.text}
            </button>
          ))}
        </div>
      </div>
    </Modal>
  );
};

export default InfoModal;
