import React from 'react';

export const Header: React.FC = () => {
  return (
    <header className="text-center mb-8 animate-fade-in">
      <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-brand-blue to-brand-purple">
        Hipervisor Unificador de Fotos
      </h1>
      <p className="mt-4 text-lg text-gray-400 max-w-2xl mx-auto">
        Adicione uma pessoa a uma foto de grupo. Faça o upload da foto da pessoa e da foto do grupo, e a IA irá integrá-los de forma natural e realista.
      </p>
    </header>
  );
};