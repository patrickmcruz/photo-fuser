import React, { useState, useRef, useEffect, useCallback } from 'react';
import { SpinnerIcon } from './icons/SpinnerIcon';

interface ImageMaskEditorProps {
  imageUrl: string;
  onClose: () => void;
  onGenerate: (maskBase64: string, prompt: string) => void;
  isLoading: boolean;
}

export const ImageMaskEditor: React.FC<ImageMaskEditorProps> = ({ imageUrl, onClose, onGenerate, isLoading }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [prompt, setPrompt] = useState('');
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushSize, setBrushSize] = useState(40);
  const lastPoint = useRef<{x: number, y: number} | null>(null);


  const setCanvasSize = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (canvas && container) {
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
    }
  }, []);

  useEffect(() => {
    setCanvasSize();
    window.addEventListener('resize', setCanvasSize);
    return () => window.removeEventListener('resize', setCanvasSize);
  }, [setCanvasSize]);

  const getMousePos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const pos = getMousePos(e);
    lastPoint.current = pos;
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    lastPoint.current = null;
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !lastPoint.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const currentPoint = getMousePos(e);
    
    ctx.beginPath();
    ctx.moveTo(lastPoint.current.x, lastPoint.current.y);
    ctx.lineTo(currentPoint.x, currentPoint.y);
    ctx.strokeStyle = 'white';
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.closePath();

    lastPoint.current = currentPoint;
  };

  const handleGenerate = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const maskCanvas = document.createElement('canvas');
      const image = new Image();
      image.crossOrigin = "anonymous";
      image.src = imageUrl;
      image.onload = () => {
        maskCanvas.width = image.naturalWidth;
        maskCanvas.height = image.naturalHeight;
        const maskCtx = maskCanvas.getContext('2d');
        if(!maskCtx) return;

        maskCtx.fillStyle = 'black';
        maskCtx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);
        
        maskCtx.drawImage(canvas, 0, 0, maskCanvas.width, maskCanvas.height);
        
        const maskBase64 = maskCanvas.toDataURL('image/png');
      
        if (!prompt.trim()) {
          alert("Por favor, descreva o que você quer gerar na área mascarada.");
          return;
        }

        onGenerate(maskBase64, prompt);
      };
      image.onerror = () => {
          alert("Failed to load image for mask generation. Please try again.");
      }
  };
  
  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 animate-fade-in p-4">
      <div className="bg-gray-800 rounded-2xl shadow-xl w-full max-w-5xl flex flex-col max-h-[90vh]">
        <header className="p-4 border-b border-gray-700 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">Editar com Máscara (Beta)</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-3xl leading-none">&times;</button>
        </header>
        
        <main className="flex-grow p-4 flex flex-col md:flex-row gap-4 overflow-y-auto">
            <div className="flex-grow flex flex-col items-center justify-center">
                <p className="text-gray-400 mb-2 text-center">Pinte sobre a área que você deseja alterar.</p>
                <div ref={containerRef} className="relative w-full aspect-video max-w-full max-h-[60vh] bg-black">
                    <img src={imageUrl} alt="Para editar" className="absolute inset-0 w-full h-full object-contain pointer-events-none" />
                    <canvas
                        ref={canvasRef}
                        className="absolute inset-0 w-full h-full cursor-crosshair"
                        onMouseDown={startDrawing}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                        onMouseMove={draw}
                    />
                </div>
            </div>

            <div className="w-full md:w-72 flex-shrink-0 flex flex-col gap-4">
                 <div>
                    <label htmlFor="brush-size" className="block text-sm font-medium text-gray-300 mb-2">
                        Tamanho do Pincel: {brushSize}
                    </label>
                    <input
                        id="brush-size"
                        type="range"
                        min="5"
                        max="100"
                        value={brushSize}
                        onChange={(e) => setBrushSize(parseInt(e.target.value, 10))}
                        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                    />
                </div>
                
                 <button 
                    onClick={handleClear}
                    className="w-full text-center py-2 px-4 border border-gray-600 text-gray-300 hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    Limpar Máscara
                </button>

                <div>
                    <label htmlFor="mask-prompt" className="block text-sm font-medium text-gray-300 mb-1">
                        Prompt de Edição
                    </label>
                    <textarea
                        id="mask-prompt"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        rows={4}
                        className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-2 focus:ring-brand-purple focus:border-brand-purple transition"
                        placeholder="Ex: um carro futurista, uma árvore, um prédio de vidro..."
                    />
                </div>
                
                <button
                  onClick={handleGenerate}
                  disabled={isLoading}
                  className="w-full flex justify-center items-center gap-2 bg-brand-purple hover:bg-brand-purple/90 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-all duration-300"
                >
                  {isLoading ? <><SpinnerIcon /> Gerando...</> : 'Gerar Edição'}
                </button>
            </div>
        </main>
      </div>
    </div>
  );
};