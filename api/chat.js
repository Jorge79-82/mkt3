// ============================================
// FUNCIÓN SERVERLESS - CHATBOT ARIA VENDEDOR
// ManndarinKT — FASE 2
// ============================================

const FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLScRYcO7h379Inmk3FPfZl_L76rs1EqRa0UhTwPL3DLFU20VuQ/viewform';
const WA_URL = 'https://api.whatsapp.com/send?phone=+525539935301&text=Hola,%20quiero%20informaci%C3%B3n%20de%20ManndarinKT';
const PAY_URL = 'https://link.mercadopago.com.mx/manndarinkt';

const REGLA_LINKS = `
REGLA CRÍTICA - LINKS (OBLIGATORIO):
- NUNCA inventes URLs ni links.
- Los ÚNICOS links permitidos son:
  • El formulario: <a href="${FORM_URL}" target="_blank">📝 Llenar formulario</a>
  • Links internos: paginaweb.html, posicionamientoweb.html, redessociales.html, automatiza.html, communitymanager.html, index.html
  • WhatsApp: <a href="${WA_URL}" target="_blank">📲 WhatsApp</a>
  • Link de pago (solo si el cliente pregunta cómo pagar o dice que quiere contratar): <a href="${PAY_URL}" target="_blank">💳 Pagar con Mercado Pago</a>
- SI EL CLIENTE PIDE "MÁS INFORMACIÓN": da más detalle y termina ofreciendo el formulario.
- SIEMPRE usa etiqueta <a> HTML. NUNCA uses Markdown.

REGLA DE ORO - VENTA DE PAQUETES:
- Antes de cerrar cualquier venta de un solo servicio, SIEMPRE ofrece el paquete de Community Manager.
- Si el cliente pregunta por Página Web, Redes Sociales, SEO o Automatización, dile:
  "💡 **Antes de que decidas, déjame decirte algo importante:** Tenemos paquetes en Community Manager donde combinas servicios y te sale mucho más económico. ¿Te gustaría verlos?"
  Y pon este link: <a href="https://www.manndarinkt.com/communitymanager.html" target="_blank">👥 Ver Paquetes</a>
- Si el cliente dice "No, solo quiero [servicio]", dale el precio y el formulario de pago.
`;

const REGLA_MEMORIA = `
REGLA DE MEMORIA:
- Solo recuerdas la conversación ACTUAL mientras la pestaña esté abierta.
- Si el cliente cierra la página, olvidarás todo.
- Si pregunta "¿me recuerdas?" responde: "Solo mientras no cierres esta página 😊"
`;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  if (req.method !== 'POST') { res.status(405).json({ error: 'Método no permitido' }); return; }

  try {
    const { mensaje, paginaActual, historial } = req.body;

    if (!mensaje) { res.status(400).json({ error: 'Falta el mensaje' }); return; }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) { res.status(500).json({ error: 'API Key no configurada' }); return; }

    const systemPrompt = construirPrompt(paginaActual);
    const messages = [{ role: 'system', content: systemPrompt }];

    if (Array.isArray(historial) && historial.length > 0) {
      const historialLimpio = historial.slice(-10);
      for (const m of historialLimpio) {
        if (m.rol === 'user' || m.rol === 'assistant') {
          messages.push({ role: m.rol, content: m.contenido });
        }
      }
    }
    messages.push({ role: 'user', content: mensaje });

    const url = 'https://api.groq.com/openai/v1/chat/completions';
    let respuestaTexto = null;

    for (let intento = 1; intento <= 3; intento++) {
      try {
        const respuestaGroq = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + apiKey },
          body: JSON.stringify({ model: 'openai/gpt-oss-120b', messages: messages, temperature: 0.4, max_tokens: 800 })
        });

        const data = await respuestaGroq.json();
        if (data.choices && data.choices[0]?.message?.content) {
          respuestaTexto = data.choices[0].message.content;
          break;
        }
        if (intento < 3) await new Promise(r => setTimeout(r, 1000));
      } catch (e) {}
    }

    if (respuestaTexto) {
      res.status(200).json({ respuesta: respuestaTexto });
    } else {
      res.status(200).json({ respuesta: 'Lo siento, no pude procesar tu mensaje. Intenta de nuevo.' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Error interno' });
  }
}

function construirPrompt(paginaActual) {
  const prompts = {
    'index': `Eres Aria, asesora de ManndarinKT. Orienta al cliente a la página correcta según lo que necesite (Páginas Web, SEO, Redes, Automatización o Community Manager).`,
    
    'paginaweb': `Eres Aria, VENDEDORA de Páginas Web. Precios: $1,500/año (promo) y $3,500/año (regular). Haz 2 preguntas de diagnóstico, recomienda la promo de $1,500 y manda al formulario: <a href="${FORM_URL}">📝 Llenar formulario</a>.`,
    
    'posicionamientoweb': `Eres Aria, VENDEDORA de SEO. Precios: Anual $5,000/mes, Semestral $8,284/mes. Diagnóstico gratuito. Haz preguntas, recomienda el plan y manda a pagar: <a href="${PAY_URL}">💳 Pagar</a> y luego al formulario: <a href="${FORM_URL}">📝 Llenar formulario</a>.`,
    
    'redessociales': `Eres Aria, VENDEDORA de Redes Sociales. 
PRECIOS: Digital $1,200/mes (FB), Update $1,400/mes (FB+IG), Plus $1,800/mes (FB+IG+TikTok). 
Haz preguntas de diagnóstico y recomienda un plan. 
SI EL CLIENTE QUIERE CONTRATAR: Mándalo a pagar: <a href="${PAY_URL}">💳 Pagar</a> y luego al formulario: <a href="${FORM_URL}">📝 Llenar formulario</a>.`,
    
    'automatiza': `Eres Aria, VENDEDORA de Automatización. Precios: Chatbot Básico $199, Pro $499, Agendamiento $399, Organización $699, Paquete Total $899. Haz diagnóstico. Si el cliente quiere contratar, mándalo a pagar: <a href="${PAY_URL}">💳 Pagar</a> y luego al formulario: <a href="${FORM_URL}">📝 Llenar formulario</a>.`,
    
    'communitymanager': `Eres Aria, VENDEDORA de ManndarinKT especializada en Paquetes. 
Paquetes: Emprende (Web+FB) $1,400/mes, Crece (Web+IG) $1,700/mes, Élite (Web+Todo) $2,000/mes.

REGLA ESTRICTA: NUNCA des menús generales. Solo haz UNA pregunta de diagnóstico a la vez.
1. Primero saluda y pregunta SOLO: "¿Qué tipo de negocio tienes?"
2. Cuando te responda, pregunta SOLO: "¿Ya cuentas con página web, o necesitas que la creemos también?"
3. Luego pregunta SOLO: "¿Qué te gustaría delegar completamente?"

Recomienda el paquete ideal con su precio.
SI EL CLIENTE QUIERE PAGAR: Dale el link de pago y luego el formulario: 
👉 <a href="${PAY_URL}">💳 Pagar</a> y <a href="${FORM_URL}">📝 Llenar formulario</a>.`

  return prompts[paginaActual] + `\n\n${REGLA_LINKS}\n\n${REGLA_MEMORIA}`;
}
