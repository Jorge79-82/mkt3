// ============================================
// FUNCIÓN SERVERLESS - CHATBOT ARIA CON GEMINI
// ManndarinKT
// ============================================

export default async function handler(req, res) {
  // Permitir peticiones desde tu dominio (CORS)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Responder a preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Solo aceptar POST
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método no permitido' });
    return;
  }

  try {
    // 1. Recibir el mensaje del usuario
    const { mensaje, paginaActual } = req.body;

    if (!mensaje) {
      res.status(400).json({ error: 'Falta el mensaje' });
      return;
    }

    // 2. Obtener la API Key desde las variables de entorno
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      res.status(500).json({ error: 'API Key no configurada' });
      return;
    }

    // 3. Construir el prompt según la página
    const prompt = construirPrompt(mensaje, paginaActual);

    // 4. Llamar a Gemini
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const respuestaGemini = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          maxOutputTokens: 800
        }
      })
    });

    const data = await respuestaGemini.json();

    // 5. Devolver la respuesta
    if (data.candidates && data.candidates.length > 0) {
      res.status(200).json({
        respuesta: data.candidates[0].content.parts[0].text
      });
    } else {
      res.status(200).json({
        respuesta: 'Lo siento, no pude procesar tu mensaje.'
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

  return `${contexto}

PREGUNTA DEL CLIENTE:
${mensaje}

TU RESPUESTA:`;
}
