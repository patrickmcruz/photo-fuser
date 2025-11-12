import React, { useRef } from 'react';
import { PencilIcon } from './icons/PencilIcon';

interface ImageUploaderProps {
  onImageUpload: (file: File) => void;
  imageUrl: string | null;
  className?: string;
  title: string;
  onEditClick?: () => void;
}

const UploadIcon: React.FC = () => (
  <svg className="w-10 h-10 mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
);

export const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageUpload, imageUrl, className, title, onEditClick }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      if(file.type.startsWith('image/')) {
        onImageUpload(file);
      } else {
        alert("Please upload a valid image file.");
      }
    }
  };

  const onDragOver = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
  };
  
  const onDrop = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    if (event.dataTransfer.files && event.dataTransfer.files[0]) {
      const file = event.dataTransfer.files[0];
       if(file.type.startsWith('image/')) {
        onImageUpload(file);
      } else {
        alert("Please upload a valid image file.");
      }
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
        <h2 className="text-lg font-semibold text-gray-300">{title}</h2>
        <div className="flex-grow flex items-center justify-center w-full">
            <label 
                htmlFor={`dropzone-file-${title}`} 
                className={`relative flex flex-col items-center justify-center w-full h-full min-h-[200px] border-2 border-gray-600 border-dashed rounded-lg cursor-pointer bg-gray-700/50 hover:bg-gray-700/80 transition-colors ${imageUrl ? 'border-none' : ''}`}
                onDragOver={onDragOver}
                onDrop={onDrop}
            >
                {imageUrl ? (
                    <>
                        <img src={imageUrl} alt="Uploaded preview" className="w-full h-full object-cover rounded-lg" />
                         <div 
                            className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity gap-4"
                            onClick={(e) => { e.preventDefault(); triggerFileInput(); }}
                         >
                            <span className="text-white text-lg font-semibold">Trocar Imagem</span>
                            {onEditClick && (
                              <button
                                  onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      onEditClick();
                                  }}
                                  className="p-2 bg-black/50 rounded-full text-white hover:bg-black/80 transition-colors"
                                  title="Editar Imagem"
                              >
                                  <PencilIcon />
                              </button>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
                        <UploadIcon />
                        <p className="mb-2 text-sm text-gray-400"><span className="font-semibold">Clique para enviar</span> ou arraste e solte</p>
                        <p className="text-xs text-gray-500">PNG, JPG, WEBP</p>
                    </div>
                )}
                <input 
                    id={`dropzone-file-${title}`}
                    ref={fileInputRef} 
                    type="file" 
                    className="hidden" 
                    onChange={handleFileChange} 
                    accept="image/*"
                />
            </label>
        </div>
    </div>
  );
};