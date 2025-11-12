import React, { useState, useCallback, useEffect } from 'react';
import { Header } from './components/Header';
import { ImageUploader } from './components/ImageUploader';
import { ImageDisplay } from './components/ImageDisplay';
import { Footer } from './components/Footer';
import { generateFusedImage, editImageWithMask } from './services/geminiService';
import { Scenario } from './types';
import { SCENARIOS } from './constants';
import { SpinnerIcon } from './components/icons/SpinnerIcon';
import { ScenarioForm } from './components/ScenarioForm';
import { PlusIcon } from './components/icons/PlusIcon';
import { ImageMaskEditor } from './components/ImageMaskEditor';
import { ImageCropper } from './components/ImageCropper';

interface ScenarioSelectorProps {
  scenarios: Scenario[];
  selectedScenario: Scenario;
  onScenarioChange: (scenario: Scenario) => void;
}

const ScenarioSelector: React.FC<ScenarioSelectorProps> = ({ scenarios, selectedScenario, onScenarioChange }) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 gap-3">
      {scenarios.map((scenario) => (
        <button
          key={scenario.value}
          onClick={() => onScenarioChange(scenario)}
          className={`px-4 py-2 text-sm font-semibold rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-brand-purple
            ${selectedScenario.value === scenario.value
              ? 'bg-brand-purple text-white shadow-md'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
        >
          {scenario.label}
        </button>
      ))}
    </div>
  );
};

const App: React.FC = () => {
  const [page, setPage] = useState<'main' | 'form'>('main');
  const [isMaskEditorOpen, setIsMaskEditorOpen] = useState(false);
  const [editingImage, setEditingImage] = useState<{ id: 'one' | 'two', url: string } | null>(null);

  const [scenarios, setScenarios] = useState<Scenario[]>(() => {
    try {
      const savedScenarios = localStorage.getItem('futureScenarios');
      return savedScenarios ? JSON.parse(savedScenarios) : SCENARIOS;
    } catch (e) {
      console.error("Failed to parse scenarios from localStorage", e);
      return SCENARIOS;
    }
  });

  const [imageOne, setImageOne] = useState<File | null>(null);
  const [imageUrlOne, setImageUrlOne] = useState<string | null>(null);
  const [imageTwo, setImageTwo] = useState<File | null>(null);
  const [imageUrlTwo, setImageUrlTwo] = useState<string | null>(null);

  const [generatedImageUrls, setGeneratedImageUrls] = useState<string[] | null>(null);
  const [selectedGeneratedImageIndex, setSelectedGeneratedImageIndex] = useState<number>(0);
  const [selectedScenarioValue, setSelectedScenarioValue] = useState<string>(scenarios[0].value);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const selectedScenario = scenarios.find(s => s.value === selectedScenarioValue) || scenarios[0];
  
  const handleScenarioChange = (scenario: Scenario) => {
    setSelectedScenarioValue(scenario.value);
  };

  useEffect(() => {
    if (!scenarios.find(s => s.value === selectedScenarioValue)) {
      setSelectedScenarioValue(scenarios[0]?.value || '');
    }
  }, [scenarios, selectedScenarioValue]);

  const handleImageOneUpload = (file: File) => {
    setImageOne(file);
    setImageUrlOne(URL.createObjectURL(file));
    setGeneratedImageUrls(null);
    setError(null);
  };

  const handleImageTwoUpload = (file: File) => {
    setImageTwo(file);
    setImageUrlTwo(URL.createObjectURL(file));
    setGeneratedImageUrls(null);
    setError(null);
  };
  
  const isScenarioPromptProvided = selectedScenario?.description?.trim() !== '';

  const handleGenerateClick = useCallback(async () => {
    if (!imageOne || !imageTwo) {
      setError('Por favor, faça o upload de duas imagens para começar.');
      return;
    }
    
    if (!isScenarioPromptProvided) {
      setError('Por favor, adicione uma descrição ao cenário selecionado antes de gerar.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setGeneratedImageUrls(null);
    setSelectedGeneratedImageIndex(0);

    try {
      const generatedImageBase64 = await generateFusedImage(imageOne, imageTwo, selectedScenario);
      setGeneratedImageUrls([`data:image/png;base64,${generatedImageBase64}`]);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, [imageOne, imageTwo, selectedScenario, isScenarioPromptProvided]);

  const handleSaveScenarios = (updatedScenarios: Scenario[]) => {
    setScenarios(updatedScenarios);
    localStorage.setItem('futureScenarios', JSON.stringify(updatedScenarios));
    setPage('main');
  };

  const handleGenerateInpaint = async (maskBase64: string, prompt: string) => {
    if (!generatedImageUrls || selectedGeneratedImageIndex === null) {
      setError("Nenhuma imagem gerada para editar.");
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const originalImageUrl = generatedImageUrls[selectedGeneratedImageIndex];
      
      const originalImageRes = await fetch(originalImageUrl);
      const originalImageBlob = await originalImageRes.blob();
      const originalImageFile = new File([originalImageBlob], 'original.png', { type: 'image/png' });
  
      const maskImageRes = await fetch(maskBase64);
      const maskImageBlob = await maskImageRes.blob();
      const maskImageFile = new File([maskImageBlob], 'mask.png', { type: 'image/png' });
  
      const newImageBase64 = await editImageWithMask(originalImageFile, maskImageFile, prompt);
  
      const newUrls = [...generatedImageUrls];
      newUrls[selectedGeneratedImageIndex] = `data:image/png;base64,${newImageBase64}`;
      setGeneratedImageUrls(newUrls);
      setIsMaskEditorOpen(false);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Ocorreu um erro desconhecido durante a edição.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenCropper = (id: 'one' | 'two') => {
    const url = id === 'one' ? imageUrlOne : imageUrlTwo;
    if (url) {
        setEditingImage({ id, url });
    }
  };
  
  const handleSaveCrop = (croppedImageFile: File) => {
      if (!editingImage) return;
  
      if (editingImage.id === 'one') {
          handleImageOneUpload(croppedImageFile);
      } else {
          handleImageTwoUpload(croppedImageFile);
      }
      
      setEditingImage(null);
  };

  return (
    <div className="min-h-screen flex flex-col p-4 sm:p-6 md:p-8 bg-gradient-to-br from-gray-900 to-gray-800">
      {isMaskEditorOpen && generatedImageUrls && (
        <ImageMaskEditor
          imageUrl={generatedImageUrls[selectedGeneratedImageIndex]}
          onClose={() => setIsMaskEditorOpen(false)}
          onGenerate={handleGenerateInpaint}
          isLoading={isLoading}
        />
      )}
      {editingImage && (
        <ImageCropper
            imageUrl={editingImage.url}
            onClose={() => setEditingImage(null)}
            onSave={handleSaveCrop}
        />
       )}
      <div className="w-full mx-auto flex flex-col flex-grow">
        <Header />
        {page === 'main' ? (
          <main className="mt-8 p-6 flex-grow flex flex-col bg-gray-800 bg-opacity-50 rounded-2xl shadow-2xl backdrop-blur-sm border border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start flex-grow">
              {/* Left Column: Input Images */}
              <div className="flex flex-col gap-8">
                <ImageUploader 
                  title="1. Foto da Pessoa"
                  onImageUpload={handleImageOneUpload} 
                  imageUrl={imageUrlOne}
                  className="h-full"
                  onEditClick={() => handleOpenCropper('one')}
                />
                <ImageUploader
                  title="2. Foto do Grupo"
                  onImageUpload={handleImageTwoUpload}
                  imageUrl={imageUrlTwo}
                  className="h-full"
                  onEditClick={() => handleOpenCropper('two')}
                />
              </div>

              {/* Right Column: Controls & Output */}
              <div className="flex flex-col gap-6 sticky top-8">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <h2 className="text-lg font-semibold text-gray-300">3. Escolha um cenário</h2>
                    <button
                      onClick={() => setPage('form')}
                      className="p-1.5 rounded-full text-gray-400 hover:bg-gray-700 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-brand-purple"
                      aria-label="Adicionar novo cenário"
                      title="Adicionar novo cenário"
                    >
                      <PlusIcon />
                    </button>
                  </div>
                  <ScenarioSelector
                    scenarios={scenarios}
                    selectedScenario={selectedScenario}
                    onScenarioChange={handleScenarioChange}
                  />
                </div>
                
                <div>
                  <button
                    onClick={handleGenerateClick}
                    disabled={!imageOne || !imageTwo || !isScenarioPromptProvided || isLoading}
                    className="w-full flex justify-center items-center gap-2 bg-brand-blue hover:bg-brand-blue/90 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg shadow-brand-blue/20"
                  >
                    {isLoading ? (
                      <>
                        <SpinnerIcon />
                        Gerando Fusão...
                      </>
                    ) : (
                      'Gerar Fusão com IA'
                    )}
                  </button>
                  {!isScenarioPromptProvided && imageOne && imageTwo && !isLoading && (
                    <p className="text-yellow-400 text-center text-sm mt-2">
                      Adicione uma descrição ao cenário para continuar.
                    </p>
                  )}
                </div>
                
                {error && <p className="text-red-400 text-center mt-2">{error}</p>}

                <ImageDisplay
                  title="4. Veja o Resultado"
                  subtitle={generatedImageUrls ? `Cenário: ${selectedScenario.label}` : undefined}
                  originalImageUrl={null} // Not showing a single original image anymore
                  imageUrls={generatedImageUrls}
                  isLoading={isLoading}
                  selectedImageIndex={selectedGeneratedImageIndex}
                  onSelectImageIndex={setSelectedGeneratedImageIndex}
                  onEditClick={() => setIsMaskEditorOpen(true)}
                />
              </div>
            </div>
          </main>
        ) : (
          <ScenarioForm 
            initialScenarios={scenarios}
            onSave={handleSaveScenarios}
            onCancel={() => setPage('main')}
          />
        )}
        <Footer />
      </div>
    </div>
  );
};

export default App;