import React, { useState } from 'react';
import { Scenario } from '../types';

interface ScenarioFormProps {
  initialScenarios: Scenario[];
  onSave: (scenarios: Scenario[]) => void;
  onCancel: () => void;
}

const TrashIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
    </svg>
);


export const ScenarioForm: React.FC<ScenarioFormProps> = ({ initialScenarios, onSave, onCancel }) => {
  const [scenarios, setScenarios] = useState<Scenario[]>(initialScenarios);

  const handleAddScenario = () => {
    const newScenario: Scenario = {
      label: `Novo Cenário ${scenarios.length + 1}`,
      value: `new-scenario-${Date.now()}`,
      description: '',
    };
    setScenarios([...scenarios, newScenario]);
  };

  const handleRemoveScenario = (index: number) => {
    if (scenarios.length <= 1) {
      alert("Deve haver pelo menos um cenário.");
      return;
    }
    setScenarios(scenarios.filter((_, i) => i !== index));
  };

  const handleChange = (index: number, field: keyof Scenario, value: string) => {
    const updatedScenarios = [...scenarios];
    const scenarioToUpdate = { ...updatedScenarios[index] };

    if (field === 'label') {
        scenarioToUpdate.label = value;
        if (scenarioToUpdate.value.startsWith('new-scenario-')) {
            scenarioToUpdate.value = value.toLowerCase().replace(/\s+/g, '-');
        }
    } else if (field === 'description') {
        scenarioToUpdate.description = value;
    }
    
    updatedScenarios[index] = scenarioToUpdate;
    setScenarios(updatedScenarios);
  };
  
  const handleSave = () => {
      for (const scenario of scenarios) {
          if (!scenario.label.trim()) {
              alert("O rótulo do cenário não pode estar vazio.");
              return;
          }
           if (!scenario.description.trim()) {
              alert(`A descrição para "${scenario.label}" não pode estar vazia. Dê ao Gemini alguns detalhes sobre como este cenário se parece.`);
              return;
          }
      }
      onSave(scenarios);
  };

  return (
    <div className="animate-fade-in mt-8 p-6 flex-grow flex flex-col bg-gray-800 bg-opacity-50 rounded-2xl shadow-2xl backdrop-blur-sm border border-gray-700 max-w-4xl mx-auto w-full">
      <h2 className="text-2xl font-bold text-white mb-6">Gerenciar Cenários</h2>
      <div className="flex-grow space-y-6 overflow-y-auto pr-2">
        {scenarios.map((scenario, index) => (
          <div key={index} className="bg-gray-700/50 p-4 rounded-lg border border-gray-600">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-brand-blue">Cenário {index + 1}</h3>
              <button
                onClick={() => handleRemoveScenario(index)}
                disabled={scenarios.length <= 1}
                className="p-1.5 rounded-full text-gray-400 hover:bg-red-500/20 hover:text-red-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Remover cenário"
              >
                <TrashIcon />
              </button>
            </div>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label htmlFor={`label-${index}`} className="block text-sm font-medium text-gray-300 mb-1">
                  Rótulo
                </label>
                <input
                  type="text"
                  id={`label-${index}`}
                  value={scenario.label}
                  onChange={(e) => handleChange(index, 'label', e.target.value)}
                  className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-2 focus:ring-brand-purple focus:border-brand-purple transition"
                  placeholder="Ex: Pessoa no centro, Integrado ao fundo"
                />
              </div>
              <div>
                <label htmlFor={`description-${index}`} className="block text-sm font-medium text-gray-300 mb-1">
                  Descrição (Prompt para a IA)
                </label>
                <textarea
                  id={`description-${index}`}
                  value={scenario.description}
                  onChange={(e) => handleChange(index, 'description', e.target.value)}
                  rows={5}
                  className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-2 focus:ring-brand-purple focus:border-brand-purple transition"
                  placeholder="Descreva em detalhes como a pessoa da primeira imagem deve ser posicionada na segunda imagem. Ex: Coloque a pessoa no centro da imagem, olhando para a frente..."
                />
              </div>
            </div>
          </div>
        ))}
      </div>
      <button
        onClick={handleAddScenario}
        className="mt-6 w-full text-center py-2 px-4 border-2 border-dashed border-gray-600 text-gray-400 hover:bg-gray-700 hover:border-gray-500 hover:text-white rounded-lg transition-colors"
      >
        Adicionar Novo Cenário
      </button>
      <div className="mt-8 flex justify-end gap-4">
        <button onClick={onCancel} className="py-2 px-6 bg-gray-600 hover:bg-gray-500 text-white font-semibold rounded-lg transition-colors">
          Cancelar
        </button>
        <button onClick={handleSave} className="py-2 px-6 bg-brand-blue hover:bg-brand-blue/90 text-white font-bold rounded-lg transition-colors">
          Salvar Cenários
        </button>
      </div>
    </div>
  );
};