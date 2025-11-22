
import React from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  maxWidth?: string;
  isDismissible?: boolean;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, maxWidth = 'max-w-md', isDismissible = true }) => {
  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black bg-opacity-60 z-40 transition-opacity duration-300 animate-fade-in"
        onClick={isDismissible ? onClose : undefined}
        aria-hidden="true"
      ></div>

      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className={`relative bg-[var(--bg-card)] rounded-2xl shadow-2xl w-full ${maxWidth} transform transition-all duration-300 scale-95 opacity-0 animate-modal-pop-in border border-[var(--border-color)]`}>
          {title && (
            <div className="flex items-center justify-between p-4 border-b border-[var(--border-color)]">
              <h2 id="modal-title" className="text-lg font-bold text-[var(--dark)]">
                {title}
              </h2>
              {isDismissible && (
                <button
                  onClick={onClose}
                  className="text-[var(--gray)] hover:text-[var(--dark)] w-8 h-8 flex items-center justify-center rounded-full hover:bg-[var(--bg-input)]"
                  aria-label="Close modal"
                >
                  <i className="fa-solid fa-times text-xl"></i>
                </button>
              )}
            </div>
          )}
          
          {!title && isDismissible && (
             <button
                onClick={onClose}
                className="absolute top-2 right-2 text-[var(--gray)] bg-[var(--bg-card)]/70 hover:text-[var(--dark)] w-8 h-8 flex items-center justify-center rounded-full hover:bg-[var(--bg-input)] z-10"
                aria-label="Close modal"
              >
                <i className="fa-solid fa-times text-xl"></i>
              </button>
          )}

          <div className={!title ? "p-0 overflow-hidden rounded-2xl" : "p-2 md:p-3"}>
            {children}
          </div>
        </div>
      </div>
      <style>{`
        @keyframes modal-pop-in {
          to { transform: scale(1); opacity: 1; }
        }
        @keyframes fade-in {
          to { opacity: 1; }
        }
        .animate-modal-pop-in {
          animation: modal-pop-in 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease forwards;
          opacity: 0;
        }
      `}</style>
    </>
  );
};

export default Modal;
