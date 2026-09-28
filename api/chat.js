// ============================================
// FUNCIÓN SERVERLESS - CHATBOT ARIA CON GEMINI
// ManndarinKT (fetch + query param key + reintentos)
// ============================================

export default async function handler(req, res) {
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

    const prompt = construirPrompt(mensaje, paginaActual);
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${apiKey}`;

    // Reintentar hasta 3 veces si Gemini devuelve vacío
    let respuestaTexto = null;
    let ultimoDebug = null;

    for (let intento = 1; intento <= 3; intento++) {
      try {
        const respuestaGemini = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              maxOutputTokens: 800,
              temperature: 0.4
            }
          })
        });

        const data = await respuestaGemini.json();
        ultimoDebug = data;

        if (data.candidates && data.candidates.length > 0 && 
            data.candidates[0].content && 
            data.candidates[0].content.parts && 
            data.candidates[0].content.parts[0].text) {
          respuestaTexto = data.candidates[0].content.parts[0].text;
          break;
        }

        // Esperar 1 segundo antes del siguiente intento
        if (intento < 3) {
          await new Promise(r => setTimeout(r, 1000));
        }
      } catch (e) {
        ultimoDebug = { error: e.message };
      }
    }

    if (respuestaTexto) {
      res.status(200).json({ respuesta: respuestaTexto });
    } else {
      res.status(200).json({
        respuesta: 'Lo siento, no pude procesar tu mensaje. Intenta de nuevo por favor.',
        debug: ultimoDebug
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
"¡Excelente! 🎉 Para preparar tu página web perfecta necesito algunos datos:

📝 Llena este formulario:
https://docs.google.com/forms/d/e/1FAIpQLSfsJ1HCEH0h_QVkV3p38xHpJi4bDfuWwY9PTQYuiHSmqVpEXQ/viewform

Una vez que lo llenes, te contactaremos por WhatsApp. 🚀"

REGLAS:
- Responde SIEMPRE en español, tono amable.
- Sé BREVE: máximo 4-5 líneas + links.
- SIEMPRE usa etiqueta <a> HTML para links, NUNCA Markdown.`,
    'posicionamientoweb': 'Eres Aria, asesora de ManndarinKT. Ayuda con Posicionamiento SEO. Responde breve y amable.',
    'redessociales': 'Eres Aria, asesora de ManndarinKT. Ayuda con Redes Sociales. Responde breve y amable.'
  };
  const contexto = prompts[paginaActual] || prompts['index'];
  return `${contexto}\n\nPREGUNTA DEL CLIENTE:\n${mensaje}\n\nTU RESPUESTA:`;
}


