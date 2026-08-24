const http = require('http');
const fs = require('fs');
const path = require('path');

async function consultarOllama(mensaje) {
    try {
        const response = await fetch('http://127.0.0.1:11434/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'mistral',
                prompt: `Eres Aria, asistente de ManndarinKT (escribe el nombre de la empresa como "ManndarinKT", con dos "n", nunca "mandarín"). Da respuestas breves pero útiles. Máximo 3 oraciones con información valiosa. Mensaje: ${mensaje}`,
                stream: false
            })
        });
        const data = await response.json();
        return data.response || 'Lo siento, no pude procesar tu solicitud.';
    } catch (error) {
        return '⚠️ No puedo conectar con la IA. Asegúrate de que Ollama esté corriendo.';
    }
}

const server = http.createServer(async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    if (req.url === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ok' }));
        return;
    }

    if (req.url === '/api/chat' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', async () => {
            try {
                const data = JSON.parse(body);
                const mensaje = data.messages?.[0]?.content || '';
                const respuesta = await consultarOllama(mensaje);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ reply: respuesta, content: respuesta }));
            } catch (error) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Error al procesar' }));
            }
        });
        return;
    }

    const filePath = path.join(__dirname, req.url === '/' ? 'index.html' : req.url);
    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(404);
            res.end('Archivo no encontrado');
            return;
        }
        const ext = path.extname(filePath);
        const contentType = {
            '.html': 'text/html',
            '.css': 'text/css',
            '.js': 'text/javascript',
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.json': 'application/json'
        }[ext] || 'text/plain';
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(data);
    });
});

server.listen(3080, () => {
    console.log('🚀 Servidor con IA corriendo en http://localhost:3080');
    console.log('🧠 Usando Ollama con Mistral');
});
 
