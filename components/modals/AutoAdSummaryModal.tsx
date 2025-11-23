
import React, { useEffect } from 'react';
import { AutoAdSummaryModalProps } from '../../types'; // Ensure AutoAdSummaryModalProps is imported

const AutoAdSummaryModal: React.FC<AutoAdSummaryModalProps> = ({
  isOpen,
  onClose,
  totalAdsCompleted,
  totalPointsEarned,
}) => {
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
        <i className="fa-solid fa-party-popper text-6xl mx-auto text-primary mb-4"></i>
        <h2 className="text-2xl font-bold text-dark mb-2">Auto Ads Session Complete!</h2>
        <p className="text-gray mb-4">
          You have successfully completed{' '}
          <span className="font-bold text-dark">{totalAdsCompleted}</span> auto ads
          and earned a total of{' '}
          <span className="font-bold text-dark">{totalPointsEarned}</span> points!
        </p>
      </div>
    </div>
  );
};

export default AutoAdSummaryModal;