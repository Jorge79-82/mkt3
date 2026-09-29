// ============================================
// FUNCIÓN SERVERLESS - CHATBOT ARIA CON GROQ
// ManndarinKT (fetch + API key en header)
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

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      res.status(500).json({ error: 'API Key no configurada' });
      return;
    }

    const prompt = construirPrompt(mensaje, paginaActual);

    const url = 'https://api.groq.com/openai/v1/chat/completions';

    let respuestaTexto = null;
    let ultimoDebug = null;

    for (let intento = 1; intento <= 3; intento++) {
      try {
        const respuestaGroq = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + apiKey
          },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [
              { role: 'user', content: prompt }
            ],
            temperature: 0.4,
            max_tokens: 800
          })
        });

        const data = await respuestaGroq.json();
        ultimoDebug = data;

        if (data.choices && data.choices.length > 0 && 
            data.choices[0].message && 
            data.choices[0].message.content) {
          respuestaTexto = data.choices[0].message.content;
          break;
        }

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


