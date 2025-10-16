import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

// A chave da API foi inserida diretamente no código para facilitar a fase de testes, conforme solicitado.
const ai = new GoogleGenAI({ apiKey: "AIzaSyB1SGptDVNzOh888rzlNSkXCiT5P2goNo0" });

export async function callGemini(prompt: string, useWebSearch: boolean = false): Promise<string> {
  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      ...(useWebSearch && { config: { tools: [{ googleSearch: {} }] } }),
    });

    let text = response.text;
    
    if (response.candidates && response.candidates[0] && response.candidates[0].finishReason === 'SAFETY') {
      return "Erro: A resposta foi bloqueada devido a configurações de segurança. O seu prompt pode conter conteúdo sensível.";
    }

    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (useWebSearch && groundingChunks && groundingChunks.length > 0) {
      // FIX: Cast groundingChunks to any[] to handle cases where its type is inferred as unknown[], which breaks chained method type inference and causes errors downstream.
      const sources = (groundingChunks as any[])
        .map((chunk) => chunk.web)
        .filter((web): web is { uri: string; title?: string } => !!web && !!web.uri)
        .map((web) => {
          let displayTitle = web.title;
          // If no title is provided, create a cleaner one from the URI itself.
          if (!displayTitle) {
            try {
              const url = new URL(web.uri);
              // Combine hostname (without www) and pathname for a concise but descriptive title.
              displayTitle = url.hostname.replace(/^www\./, '') + (url.pathname.length > 1 ? url.pathname : '');
            } catch (e) {
              // Fallback to the original URI if it's not a valid URL for parsing.
              displayTitle = web.uri;
            }
          }
          return { title: displayTitle, uri: web.uri };
        });
      
      const uniqueSources = Array.from(new Map(sources.map(item => [item.uri, item])).values());

      if (uniqueSources.length > 0) {
        // FIX: Format sources as Markdown links to hide long URLs and improve readability.
        const sourcesText = uniqueSources
          .map((source, index) => `${index + 1}. [${source.title}](${source.uri})`)
          .join('\n');
        // Use a more descriptive title for the sources section
        text += `\n\n---\n**Fontes da Web:**\n${sourcesText}`;
      }
    }

    if (text) {
      return text;
    }
    
    return "Erro: A resposta da API não continha texto gerado. Verifique o seu prompt.";

  } catch (error: any) {
    console.error("Erro ao chamar a API Gemini:", error);

    const errorMessage = error.message || '';

    if (errorMessage.includes('API key not valid')) {
        return `Erro: A chave de API fornecida não é válida. Verifique se a chave está correta e se a API Generative Language está ativada no seu projeto Google Cloud.`;
    }
    
    if (errorMessage.includes('429') || errorMessage.includes('RESOURCE_EXHAUSTED')) {
        const retryMatch = errorMessage.match(/retryDelay": "(\d+\.?\d*)s"/);
        let retryMessage = "Por favor, tente novamente mais tarde.";
        if (retryMatch && retryMatch[1]) {
            const delay = Math.ceil(parseFloat(retryMatch[1]));
            retryMessage = ` Por favor, aguarde cerca de ${delay} segundos antes de tentar novamente.`;
        }
        return `Erro: Limite de utilização da API excedido (cota). Você fez muitas solicitações num curto espaço de tempo.${retryMessage} Se o problema persistir, verifique o seu plano de faturação da API Gemini.`;
    }

    return `Erro: Falha na comunicação com a API. Verifique a sua ligação à Internet. Detalhes: ${errorMessage}`;
  }
}