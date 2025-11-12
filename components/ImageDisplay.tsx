import React from 'react';
import { SpinnerIcon } from './icons/SpinnerIcon';
import { BrushIcon } from './icons/BrushIcon';

interface ImageDisplayProps {
  title: string;
  subtitle?: string;
  originalImageUrl: string | null;
  imageUrls: string[] | null;
  isLoading: boolean;
  className?: string;
  selectedImageIndex: number;
  onSelectImageIndex: (index: number) => void;
  onEditClick?: () => void;
}

const Placeholder: React.FC = () => (
    <div className="w-full h-full bg-gray-700/50 rounded-lg flex flex-col items-center justify-center text-gray-500">
        <svg className="w-12 h-12 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <p>A imagem fundida aparecerá aqui</p>
    </div>
);


export const ImageDisplay: React.FC<ImageDisplayProps> = ({
  title,
  subtitle,
  imageUrls,
  isLoading,
  className,
  selectedImageIndex,
  onSelectImageIndex,
  onEditClick
}) => {
    const selectedImageUrl = imageUrls ? imageUrls[selectedImageIndex] : null;

    return (
        <div className={`flex flex-col gap-2 ${className}`}>
            <div className="flex justify-between items-baseline">
                <h2 className="text-lg font-semibold text-gray-300">{title}</h2>
                {subtitle && <p className="text-sm text-gray-400 truncate">{subtitle}</p>}
            </div>
            <div className="relative flex-grow w-full h-full min-h-[200px] bg-gray-900 rounded-lg overflow-hidden">
                {isLoading && (
                    <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center z-10">
                        <SpinnerIcon />
                        <p className="text-white mt-2">Gerando a fusão...</p>
                    </div>
                )}
                {!selectedImageUrl && !isLoading && <Placeholder />}
                {selectedImageUrl && <img src={selectedImageUrl} alt="Generated result" className="w-full h-full object-cover" />}

                {selectedImageUrl && !isLoading && onEditClick && (
                    <button
                    onClick={onEditClick}
                    className="absolute top-3 right-3 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-brand-purple"
                    title="Editar com Máscara"
                    >
                    <BrushIcon />
                    </button>
                )}
            </div>
            {imageUrls && imageUrls.length > 1 && (
                <div className="grid grid-cols-4 gap-2 mt-2">
                    {imageUrls.map((url, index) => (
                        <button key={index} onClick={() => onSelectImageIndex(index)} className={`rounded-md overflow-hidden border-2 transition-all ${selectedImageIndex === index ? 'border-brand-blue' : 'border-transparent hover:border-gray-500'}`}>
                            <img src={url} alt={`Variation ${index + 1}`} className="w-full h-full object-cover aspect-square" />
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};