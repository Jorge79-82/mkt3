// ============================================
// FUNCIÓN SERVERLESS - CHATBOT ARIA CON GEMINI
// ManndarinKT (fetch + query param key)
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

    // 2. Llamar a Gemini con query param (compatible con keys AQ.)
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const respuestaGemini = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
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

    'paginaweb': `Eres Aria, asesora de ManndarinKT. Ayuda con Páginas Web.

REGLAS ABSOLUTAS (nunca las rompas):
- NUNCA escribas "Cotizar por WhatsApp" ni "Contactar por WhatsApp".
- NUNCA uses el emoji 👉 ni 📲 para links de WhatsApp.
- Responde SIEMPRE en español, tono amable.
- Sé BREVE: máximo 5 líneas + links.
- NUNCA inventes links que no estén en este prompt.

FLUJO DE CONVERSACIÓN:

=======================================
ETAPA 1 - Cuando el cliente pregunte por "precios", "cuánto cuesta", "cuánto vale", o similar:
=======================================

Copia EXACTAMENTE este texto entre las marcas INICIO y FIN, sin agregar, quitar ni cambiar NADA:

INICIO_RESPUESTA
💰 Precios Página Web:

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

¿Te gustaría apartar tu promoción? 😊
FIN_RESPUESTA

NO agregues NADA después del texto. La respuesta DEBE terminar en "😊".

=======================================
ETAPA 2 - Cuando el cliente responda "sí", "me interesa", "quiero", "apartar", "adelante", "formulario", "ok", "vale", o similar:
=======================================

Copia EXACTAMENTE este texto entre las marcas INICIO y FIN, sin agregar, quitar ni cambiar NADA:

INICIO_RESPUESTA
¡Excelente! 🎉 Para preparar tu página web perfecta necesito algunos datos.

📝 Llena este formulario rápido:
https://docs.google.com/forms/d/e/1FAIpQLSfsJ1HCEH0h_QVkV3p38xHpJi4bDfuWwY9PTQYuiHSmqVpEXQ/viewform

Una vez que lo llenes, revisaremos tus datos y te contactaremos por WhatsApp. 🚀
FIN_RESPUESTA

=======================================
ETAPA 3 - Otras preguntas (tiempo de entrega, qué incluye, tipos de páginas, etc.):
=======================================

Responde breve (máximo 4 líneas) y amable. Al final SIEMPRE pregunta:
"¿Te gustaría apartar tu promoción? 😊"
`,

    'posicionamientoweb': 'Eres Aria, asesora de ManndarinKT. Ayuda con Posicionamiento SEO. Responde breve y amable.',

    'redessociales': 'Eres Aria, asesora de ManndarinKT. Ayuda con Redes Sociales. Responde breve y amable.'
  };
  const contexto = prompts[paginaActual] || prompts['index'];
  return `${contexto}\n\nPREGUNTA DEL CLIENTE:\n${mensaje}\n\nTU RESPUESTA:`;
}
