import React, { useState, useRef, useEffect, useCallback, MouseEvent } from 'react';

interface ImageCropperProps {
  imageUrl: string;
  onClose: () => void;
  onSave: (croppedFile: File) => void;
}

interface Crop {
  x: number;
  y: number;
  width: number;
  height: number;
}

const dataURLtoFile = (dataurl: string, filename: string): File => {
    const arr = dataurl.split(',');
    const mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch) throw new Error("Could not find mime type in dataURL");
    const mime = mimeMatch[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
}

export const ImageCropper: React.FC<ImageCropperProps> = ({ imageUrl, onClose, onSave }) => {
    const imageRef = useRef<HTMLImageElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const cropAreaRef = useRef<HTMLDivElement>(null);

    const [crop, setCrop] = useState<Crop>({ x: 10, y: 10, width: 80, height: 80 });
    const [aspect, setAspect] = useState<number | null>(null);
    const [dragState, setDragState] = useState<{ type: string; startX: number; startY: number; startCrop: Crop } | null>(null);
    const [imageGeom, setImageGeom] = useState({ top: 0, left: 0, width: 0, height: 0 });

    const handleSetAspect = (newAspect: number | null, currentCrop = crop) => {
        setAspect(newAspect);
        if (newAspect) {
            setCrop(c => {
                const oldCrop = currentCrop || c;
                const newWidth = Math.min(oldCrop.width, oldCrop.height * newAspect);
                const newHeight = newWidth / newAspect;
                return {
                    ...oldCrop,
                    width: newWidth,
                    height: newHeight,
                    x: oldCrop.x + (oldCrop.width - newWidth) / 2,
                    y: oldCrop.y + (oldCrop.height - newHeight) / 2,
                };
            });
        }
    };

    const initializeCrop = useCallback(() => {
        const image = imageRef.current;
        const container = containerRef.current;
        if (image && container) {
            const { naturalWidth, naturalHeight } = image;
            const { width: containerWidth, height: containerHeight } = container.getBoundingClientRect();

            const imageAspectRatio = naturalWidth / naturalHeight;
            const containerAspectRatio = containerWidth / containerHeight;

            let renderWidth, renderHeight, left, top;

            if (imageAspectRatio > containerAspectRatio) {
                renderWidth = containerWidth;
                renderHeight = containerWidth / imageAspectRatio;
                top = (containerHeight - renderHeight) / 2;
                left = 0;
            } else {
                renderHeight = containerHeight;
                renderWidth = containerHeight * imageAspectRatio;
                left = (containerWidth - renderWidth) / 2;
                top = 0;
            }
            
            setImageGeom({ top, left, width: renderWidth, height: renderHeight });
            const initialCrop = { x: 10, y: 10, width: 80, height: 80 };
            setCrop(initialCrop);
            if(aspect) {
                handleSetAspect(aspect, initialCrop);
            }
        }
    }, [aspect]);


    useEffect(() => {
        const image = imageRef.current;
        const container = containerRef.current;
        if (container) {
            const resizeObserver = new ResizeObserver(() => {
                if(image?.complete) initializeCrop();
            });
            resizeObserver.observe(container);

            if (image) {
                 if (image.complete) {
                    initializeCrop();
                } else {
                    image.onload = initializeCrop;
                }
            }
            return () => resizeObserver.disconnect();
        }
    }, [imageUrl, initializeCrop]);

    const handleMouseDown = (e: MouseEvent<HTMLDivElement>, type: string) => {
        e.preventDefault();
        e.stopPropagation();
        if (!cropAreaRef.current) return;
        const rect = cropAreaRef.current.getBoundingClientRect();
        setDragState({
            type,
            startX: (e.clientX - rect.left) / rect.width * 100,
            startY: (e.clientY - rect.top) / rect.height * 100,
            startCrop: { ...crop }
        });
    };

    const handleMouseMove = useCallback((e: globalThis.MouseEvent) => {
        if (!dragState || !cropAreaRef.current) return;
        
        const rect = cropAreaRef.current.getBoundingClientRect();
        const mouseX = (e.clientX - rect.left) / rect.width * 100;
        const mouseY = (e.clientY - rect.top) / rect.height * 100;
        const dx = mouseX - dragState.startX;
        const dy = mouseY - dragState.startY;

        let newCrop = { ...dragState.startCrop };

        if (dragState.type === 'move') {
            newCrop.x += dx;
            newCrop.y += dy;
        }

        if (dragState.type.includes('left')) {
            newCrop.x += dx;
            newCrop.width -= dx;
        }
        if (dragState.type.includes('right')) {
            newCrop.width += dx;
        }
        if (dragState.type.includes('top')) {
            newCrop.y += dy;
            newCrop.height -= dy;
        }
        if (dragState.type.includes('bottom')) {
            newCrop.height += dy;
        }

        if (aspect) {
            if (dragState.type.includes('left') || dragState.type.includes('right')) {
                 newCrop.height = newCrop.width / aspect;
            } else {
                 newCrop.width = newCrop.height * aspect;
            }
            if (dragState.type.includes('top')) {
                newCrop.y = dragState.startCrop.y + (dragState.startCrop.height - newCrop.height);
            }
        }
        
        newCrop.x = Math.max(0, newCrop.x);
        newCrop.y = Math.max(0, newCrop.y);
        newCrop.width = Math.min(100 - newCrop.x, newCrop.width);
        newCrop.height = Math.min(100 - newCrop.y, newCrop.height);
        
        if (newCrop.width < 5) newCrop.width = 5;
        if (newCrop.height < 5) newCrop.height = 5;

        setCrop(newCrop);
    }, [dragState, aspect]);

    const handleMouseUp = useCallback(() => {
        setDragState(null);
    }, []);
    
    useEffect(() => {
        if (dragState) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        }
        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [dragState, handleMouseMove, handleMouseUp]);
    
    const handleSave = () => {
        const image = imageRef.current;
        if (!image) return;
        
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
    
        const scaleX = image.naturalWidth / 100;
        const scaleY = image.naturalHeight / 100;
    
        const sx = crop.x * scaleX;
        const sy = crop.y * scaleY;
        const sWidth = crop.width * scaleX;
        const sHeight = crop.height * scaleY;
    
        canvas.width = sWidth;
        canvas.height = sHeight;
    
        ctx.drawImage(image, sx, sy, sWidth, sHeight, 0, 0, sWidth, sHeight);
    
        const dataUrl = canvas.toDataURL('image/png');
        const file = dataURLtoFile(dataUrl, 'cropped_image.png');
        onSave(file);
    };

    const handles = ['top-left', 'top', 'top-right', 'left', 'right', 'bottom-left', 'bottom', 'bottom-right'];
    const hasImage = imageGeom.width > 0 && imageGeom.height > 0;

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 animate-fade-in p-4">
            <div className="bg-gray-800 rounded-2xl shadow-xl w-full max-w-5xl flex flex-col max-h-[90vh]">
                <header className="p-4 border-b border-gray-700 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-white">Editar Imagem</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white text-3xl leading-none">&times;</button>
                </header>

                <main className="flex-grow p-4 flex flex-col md:flex-row gap-4 overflow-y-auto">
                    <div ref={containerRef} className="relative flex-grow flex items-center justify-center bg-black/50 rounded-lg overflow-hidden select-none">
                        <img ref={imageRef} src={imageUrl} alt="" className="absolute opacity-0 pointer-events-none -z-10" crossOrigin="anonymous" />
                        
                        {hasImage && (
                            <div
                                ref={cropAreaRef}
                                className="absolute"
                                style={{
                                    width: imageGeom.width,
                                    height: imageGeom.height,
                                    top: imageGeom.top,
                                    left: imageGeom.left,
                                }}
                            >
                                <img src={imageUrl} alt="A editar" className="w-full h-full pointer-events-none" />

                                <div className="absolute inset-0 bg-black/50" style={{
                                    clipPath: `polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 0%, ${crop.x}% ${crop.y}%, ${crop.x}% ${crop.y + crop.height}%, ${crop.x + crop.width}% ${crop.y + crop.height}%, ${crop.x + crop.width}% ${crop.y}%, ${crop.x}% ${crop.y}%)`,
                                    clipRule: 'evenodd'
                                }}></div>

                                <div
                                    className="absolute border-2 border-white/80 cursor-move"
                                    style={{
                                        left: `${crop.x}%`,
                                        top: `${crop.y}%`,
                                        width: `${crop.width}%`,
                                        height: `${crop.height}%`,
                                    }}
                                    onMouseDown={(e) => handleMouseDown(e, 'move')}
                                >
                                    <div className="absolute top-1/3 left-0 w-full h-px bg-white/40"></div>
                                    <div className="absolute top-2/3 left-0 w-full h-px bg-white/40"></div>
                                    <div className="absolute left-1/3 top-0 h-full w-px bg-white/40"></div>
                                    <div className="absolute left-2/3 top-0 h-full w-px bg-white/40"></div>
                                   
                                    {handles.map(handle => {
                                        const cursor = `${handle.includes('top') ? 'n' : ''}${handle.includes('bottom') ? 's' : ''}${handle.includes('left') ? 'w' : ''}${handle.includes('right') ? 'e' : ''}-resize`;
                                        return (
                                            <div
                                                key={handle}
                                                className="absolute w-4 h-4 -m-2"
                                                style={{
                                                    top: handle.includes('bottom') ? '100%' : handle.includes('top') ? '0%' : '50%',
                                                    left: handle.includes('right') ? '100%' : handle.includes('left') ? '0%' : '50%',
                                                    cursor: cursor
                                                }}
                                                onMouseDown={(e) => handleMouseDown(e, handle)}
                                            >
                                                <div className="w-full h-full bg-white rounded-full border border-gray-800"></div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="w-full md:w-60 flex-shrink-0 flex flex-col gap-3">
                        <h3 className="text-lg font-semibold text-gray-300">Proporção</h3>
                        <div className="grid grid-cols-2 gap-2">
                            <button onClick={() => handleSetAspect(null)} className={`py-2 px-4 rounded-lg transition-colors ${!aspect ? 'bg-brand-blue text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>Livre</button>
                            <button onClick={() => handleSetAspect(1)} className={`py-2 px-4 rounded-lg transition-colors ${aspect === 1 ? 'bg-brand-blue text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>Quadrado</button>
                            <button onClick={() => handleSetAspect(4/3)} className={`py-2 px-4 rounded-lg transition-colors ${aspect === 4/3 ? 'bg-brand-blue text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>4:3</button>
                            <button onClick={() => handleSetAspect(16/9)} className={`py-2 px-4 rounded-lg transition-colors ${aspect === 16/9 ? 'bg-brand-blue text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>16:9</button>
                        </div>
                        <button onClick={initializeCrop} className="w-full text-left py-2 px-4 mt-4 border border-gray-600 text-gray-300 hover:bg-gray-700 rounded-lg transition-colors">Resetar</button>
                    </div>
                </main>
                <footer className="p-4 border-t border-gray-700 flex justify-end gap-4">
                    <button onClick={onClose} className="py-2 px-6 bg-gray-600 hover:bg-gray-500 text-white font-semibold rounded-lg transition-colors">
                        Cancelar
                    </button>
                    <button
                        onClick={handleSave}
                        className="py-2 px-6 bg-brand-blue hover:bg-brand-blue/90 text-white font-bold rounded-lg transition-colors">
                        Salvar Corte
                    </button>
                </footer>
            </div>
        </div>
    );
};