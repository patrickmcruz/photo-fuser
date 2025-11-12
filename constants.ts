import { Scenario } from './types';

export const SCENARIOS: Scenario[] = [
  { 
    label: 'Pessoa no Centro', 
    value: 'pessoa-no-centro',
    description: "Insira a pessoa da primeira imagem no centro do grupo na segunda imagem. A IA deve ajustar o grupo existente para abrir um espaço natural para a nova pessoa, cuidando da interação, sobreposição e sombras."
  },
  { 
    label: 'Pessoa à Esquerda', 
    value: 'pessoa-a-esquerda',
    description: "Posicione a pessoa da primeira imagem no lado esquerdo do grupo na segunda imagem. Ela deve parecer que sempre esteve lá, com iluminação e perspectiva consistentes com as pessoas ao seu lado."
  },
  { 
    label: 'Pessoa à Direita', 
    value: 'pessoa-a-direita',
    description: "Posicione a pessoa da primeira imagem no lado direito do grupo na segunda imagem. A integração deve ser crível, fazendo com que a pessoa pareça parte da composição original do grupo."
  },
  { 
    label: 'Integrado ao Fundo', 
    value: 'integrado-ao-fundo',
    description: "Integre a pessoa da primeira imagem sutilmente ao fundo do grupo na segunda imagem, talvez um pouco atrás de outras pessoas. O objetivo é uma inclusão discreta e natural na cena. Regra crítica: É essencial que o rosto da pessoa inserida permaneça, no mínimo, parcialmente visível. Ela não deve ser completamente coberta ou obscurecida por outras pessoas ou objetos na cena."
  },
];