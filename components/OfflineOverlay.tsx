import React from 'react';

const OfflineOverlay: React.FC = () => {
  return (
    <div
      className="fixed inset-0 bg-dark/90 flex flex-col justify-center items-center z-[120] text-white p-4 text-center animate-fadeIn"
      role="alert"
      aria-live="assertive"
    >
      <i className="fa-solid fa-wifi-slash text-6xl mb-4 text-error"></i>
      <h2 className="text-3xl font-bold mb-2">You Are Offline</h2>
      <p className="text-lg mb-6">
        Please check your internet connection to continue using Shemi-Kash.
        <br />
        We'll reconnect automatically when you're back online.
      </p>
      <div className="flex items-center gap-2 text-sm text-gray-light">
        <i className="fa-solid fa-circle-notch fa-spin"></i>
        <span>Attempting to reconnect...</span>
      </div>
    </div>
  );
};

export default OfflineOverlay;