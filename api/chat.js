import { GoogleGenAI } from '@google/genai';

// ============================================
// FUNCIÓN SERVERLESS - CHATBOT ARIA CON GEMINI
// ManndarinKT (con SDK oficial)
// ============================================

export default async function handler(req, res) {
  // Permitir peticiones desde tu dominio (CORS)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método no permitido' });
    return;
  }

  try {
    const { mensaje, paginaActual } = req.body;

    if (!mensaje) {
      res.status(400).json({ error: 'Falta el mensaje' });
      return;
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      res.status(500).json({ error: 'API Key no configurada' });
      return;
    }

    // 1. Inicializar el cliente de Google GenAI
    const ai = new GoogleGenAI({ apiKey });

    // 2. Construir el prompt
    const prompt = construirPrompt(mensaje, paginaActual);

    // 3. Llamar a Gemini con el modelo correcto
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        maxOutputTokens: 800,
      }
    });

    // 4. Devolver la respuesta
    if (response.text) {
      res.status(200).json({ respuesta: response.text });
    } else {
      res.status(200).json({
        respuesta: 'Lo siento, no pude procesar tu mensaje.',
        debug: response
      });
    }

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      detalle: error.message
    });
  }
}

// ============================================
// CONSTRUIR PROMPT SEGÚN LA PÁGINA
// ============================================
function construirPrompt(mensaje, paginaActual) {
  const prompts = {
    'index': 'Eres Aria, asesora de ManndarinKT. Guía al cliente a la sección correcta. Responde breve y amable.',
    'automatiza': 'Eres Aria, asesora de ManndarinKT. Ayuda con automatización con IA. Responde breve y amable.',
    'communitymanager': 'Eres Aria, asesora de ManndarinKT. Ayuda con Community Manager. Responde breve y amable.',
    'paginaweb': 'Eres Aria, asesora de ManndarinKT. Ayuda con Páginas Web. Responde breve y amable.',
    'posicionamientoweb': 'Eres Aria, asesora de ManndarinKT. Ayuda con Posicionamiento SEO. Responde breve y amable.',
    'redessociales': 'Eres Aria, asesora de ManndarinKT. Ayuda con Redes Sociales. Responde breve y amable.'
  };
  const contexto = prompts[paginaActual] || prompts['index'];
  return `${contexto}\n\nPREGUNTA DEL CLIENTE:\n${mensaje}\n\nTU RESPUESTA:`;
}
