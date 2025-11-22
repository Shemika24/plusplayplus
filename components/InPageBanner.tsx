
import React from 'react';

interface InPageBannerProps {
  className?: string;
}

const InPageBanner: React.FC<InPageBannerProps> = ({ className = "" }) => {
  return (
    <div className={`w-full flex justify-center items-center my-4 ${className}`}>
      {/* 
        Este container é o espaço reservado para o anúncio.
        Você pode colar o script do seu provedor de anúncios (Banner 300x50 ou 320x50) aqui dentro.
      */}
      <div className="relative overflow-hidden w-full max-w-[320px] h-[60px] bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg flex flex-col items-center justify-center shadow-sm">
        
        {/* Placeholder visual (remove or hide this if ad script handles its own container) */}
        <div className="flex flex-col items-center opacity-40">
            <span className="text-[10px] font-bold text-[var(--gray)] tracking-widest uppercase">Advertisement</span>
            <div className="w-16 h-1 bg-[var(--border-color)] mt-1 rounded-full"></div>
        </div>

        {/* 
            Exemplo de onde colar o script de banner (se for script direto):
            <script ...></script> 
            
            Se for um iframe, coloque-o aqui.
        */}
      </div>
    </div>
  );
};

export default InPageBanner;
