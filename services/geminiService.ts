import { GoogleGenAI, Modality } from "@google/genai";
import { Scenario } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const fileToGenerativePart = async (file: File) => {
    const base64EncodedDataPromise = new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
        reader.readAsDataURL(file);
    });
    const data = await base64EncodedDataPromise;
    const mimeType = file.type;
    return {
        inlineData: { data, mimeType },
    };
};

// Generate a single fused image from two source images
export const generateFusedImage = async (
  imageOne: File,
  imageTwo: File,
  selectedScenario: Scenario,
): Promise<string> => {
    const imagePartOne = await fileToGenerativePart(imageOne);
    const imagePartTwo = await fileToGenerativePart(imageTwo);

    const textPart = {
        text: `**Tarefa:** Atue como um especialista em VFX (Efeitos Visuais) para cinema, realizando uma montagem fotográfica hiper-realista.
        **Objetivo:** Integrar a pessoa da Imagem 1 na foto de grupo da Imagem 2 de forma completamente indetectável. A pessoa deve parecer que sempre esteve na cena original.
        **Cenário de Posicionamento:** "${selectedScenario.label}". Siga estritamente esta instrução de posicionamento: "${selectedScenario.description}".

        **Critérios de Qualidade (Não Negociáveis):**

        **1. Análise de Iluminação (Prioridade Máxima):** A integração da iluminação é o fator mais crítico. A iluminação na pessoa adicionada deve ser uma réplica exata da luz ambiente na Imagem 2.
            - **Direção e Dureza:** Corresponda perfeitamente à direção da(s) fonte(s) de luz principal(is) e de preenchimento. Recrie a dureza das sombras (nítidas ou suaves) com precisão.
            - **Cor e Temperatura:** Replique a temperatura da cor da luz (quente, fria, neutra) e quaisquer tonalidades de luz colorida presentes na cena.
            - **Sombras Projetadas:** As sombras que a pessoa projeta no ambiente e em outras pessoas, e as sombras que o ambiente projeta nela, devem ser fisicamente corretas em densidade, cor e desfoque.

        **2. Consistência de Câmera e Lente:** A pessoa inserida deve parecer ter sido capturada pela mesma câmera e lente que a foto original.
            - **Granulação e Ruído:** Adicione ruído ou granulação à pessoa que corresponda exatamente ao padrão da Imagem 2.
            - **Nitidez e Profundidade de Campo:** A nitidez da pessoa deve corresponder ao plano focal da foto. Se o grupo estiver ligeiramente desfocado ou se houver um "bokeh" de fundo, a pessoa deve se encaixar perfeitamente nessa profundidade de campo.
            - **Aberração Cromática e Vinhetas:** Se presentes na Imagem 2, replique sutis aberrações cromáticas ou vinhetas nas bordas da pessoa.

        **3. Harmonia de Cores:**
            - **Balanço de Branco e Gradação:** Ajuste o balanço de branco, saturação, contraste e a gradação de cores da pessoa para que ela se funda perfeitamente na paleta de cores da Imagem 2.

        **4. Composição e Perspectiva:**
            - **Escala e Posição:** A escala e a perspectiva da pessoa devem ser perfeitas. Ela deve interagir naturalmente com o espaço e as outras pessoas, respeitando a composição original.

        **Output Final:** O resultado deve ser APENAS a imagem final, uma única fotografia realista e de alta qualidade, sem nenhum texto, borda ou artefato. A fusão deve ser de nível profissional, impossível de ser detectada por um observador atento.`
    };

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [imagePartOne, imagePartTwo, textPart] },
        config: {
            responseModalities: [Modality.IMAGE],
        },
    });

    for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
            return part.inlineData.data;
        }
    }

    throw new Error('Image generation failed to produce an image.');
};

// Edit an image using a mask and a prompt
export const editImageWithMask = async (
    originalImage: File,
    maskImage: File,
    prompt: string
  ): Promise<string> => {
    
    const originalImagePart = await fileToGenerativePart(originalImage);
    const maskImagePart = await fileToGenerativePart(maskImage);
  
    const textPart = {
      text: `This is an image inpainting task. Use the first image as the original image to be edited. Use the second image as the mask. The white area in the mask defines the region to be modified. Replace the content within this masked area with the following description: "${prompt}". Ensure the new content blends seamlessly with the original image in terms of style, lighting, and perspective. The rest of the image outside the mask must remain unchanged. The output must be only the final edited image.`,
    };
  
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [originalImagePart, maskImagePart, textPart] },
      config: {
        responseModalities: [Modality.IMAGE],
      },
    });
  
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return part.inlineData.data;
      }
    }
  
    throw new Error('Image editing failed to produce an image.');
  };