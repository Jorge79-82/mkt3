// ============================================
// FUNCIÓN SERVERLESS - CHATBOT ARIA CON GEMINI
// ManndarinKT (fetch + encabezado x-goog-api-key)
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

    // 1. Construir el prompt
    const prompt = construirPrompt(mensaje, paginaActual);

    // 2. Llamar a Gemini con el encabezado x-goog-api-key
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    
    const respuestaGemini = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          maxOutputTokens: 800
        }
      })
    });

    const data = await respuestaGemini.json();

    // 3. Devolver la respuesta
    if (data.candidates && data.candidates.length > 0) {
      res.status(200).json({
        respuesta: data.candidates[0].content.parts[0].text
      });
    } else {
      res.status(200).json({
        respuesta: 'Lo siento, no pude procesar tu mensaje.',
        debug: data
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
    'paginaweb': `Eres Aria, asesora de ManndarinKT. Ayuda con Páginas Web. Responde breve y amable.

FLUJO DE CONVERSACIÓN:

ETAPA 1 - El cliente pregunta precios:
Responde EXACTAMENTE así:
"💰 Precios Página Web:

🔥 PROMOCIÓN ESPECIAL: $1,500 MXN/año
📌 Precio regular: $3,500 MXN/año

✅ Incluye:
• Dominio .com por 1 año
• Hosting con almacenamiento SSD
• Certificado SSL gratuito
• Diseño responsive (adaptable a celulares)
• SEO optimizado
• Correos profesionales
• Hasta 5 secciones

🎁 Nosotros hacemos TODO por ti.

¿Te gustaría apartar tu promoción? 😊"

ETAPA 2 - El cliente dice "sí", "me interesa", "quiero", "apartar", "adelante":
Responde EXACTAMENTE así:
"¡Excelente! Antes de enviarte el link de pago, necesito algunos datos para preparar tu página perfecta. 🎨

📝 Llena este formulario rápido:
👉 https://docs.google.com/forms/d/e/1FAIpQLSfsJ1HCEH0h_QVkV3p38xHpJi4bDfuWwY9PTQYuiHSmqVpEXQ/viewform

Una vez que lo llenes, te llegará un correo de confirmación y podrás enviarnos un mensaje por WhatsApp para continuar:

👉 https://wa.me/525539935301?text=Hola,%20acabo%20de%20llenar%20el%20formulario%20para%20mi%20página%20web

¡Esto te da más seguridad! 😊"

REGLAS:
- Responde SIEMPRE en español, tono amable.
- Sé BREVE: máximo 4-5 líneas + links.
- NUNCA envíes el link de pago si el cliente no ha llenado el formulario.
- NUNCA des el link de pago si el cliente solo preguntó precios.
- SIEMPRE usa etiqueta <a> HTML para links, NUNCA Markdown.
- MEMORIA: Recuerda la etapa de la conversación y sigue el flujo.`,
    'posicionamientoweb': 'Eres Aria, asesora de ManndarinKT. Ayuda con Posicionamiento SEO. Responde breve y amable.',
    'redessociales': 'Eres Aria, asesora de ManndarinKT. Ayuda con Redes Sociales. Responde breve y amable.'
  };
  const contexto = prompts[paginaActual] || prompts['index'];
  return `${contexto}\n\nPREGUNTA DEL CLIENTE:\n${mensaje}\n\nTU RESPUESTA:`;
}
