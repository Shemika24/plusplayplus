import React from 'react';

const SplashScreen: React.FC = () => {
  return (
    <div 
      className="flex flex-col justify-center items-center h-screen w-screen bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary via-primary-dark to-dark text-white text-center animate-fadeIn"
      role="alert" 
      aria-busy="true"
    >
      <div className="flex-grow flex items-center justify-center w-full">
        <svg
          width="192"
          height="192"
          viewBox="0 0 100 100"
          xmlns="http://www.w3.org/2000/svg"
          className="animate-pulse w-48 h-48 md:w-64 md:h-64"
        >
          <defs>
            <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{ stopColor: '#5a7bff', stopOpacity: 1 }} />
              <stop offset="100%" style={{ stopColor: '#3a5bef', stopOpacity: 1 }} />
            </linearGradient>
          </defs>
          <circle cx="50" cy="50" r="48" stroke="url(#grad1)" strokeWidth="4" fill="none" />
          <text
            x="50"
            y="55"
            fontFamily="Inter, sans-serif"
            fontSize="40"
            fontWeight="800"
            fill="white"
            textAnchor="middle"
            alignmentBaseline="middle"
          >
            SK
          </text>
        </svg>
      </div>
    </div>
  );
};

export default SplashScreen;
