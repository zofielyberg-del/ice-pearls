const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const PUBLIC_DIR = __dirname;
const APPS_FILE = path.join(PUBLIC_DIR, 'applications.json');
const ADMIN_PASSWORD = 'loop26';

const MIME_TYPES = {
  '.html': 'text/html; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.js': 'text/javascript; charset=UTF-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

function readApplications() {
  try {
    if (!fs.existsSync(APPS_FILE)) {
      fs.writeFileSync(APPS_FILE, JSON.stringify([], null, 2));
      return [];
    }
    const data = fs.readFileSync(APPS_FILE, 'utf-8');
    return JSON.parse(data || '[]');
  } catch (err) {
    console.error('Error reading applications:', err);
    return [];
  }
}

function writeApplications(apps) {
  try {
    fs.writeFileSync(APPS_FILE, JSON.stringify(apps, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Error writing applications:', err);
    return false;
  }
}

const server = http.createServer((req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;

  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // --- API Endpoints ---
  if (pathname === '/api/login' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const { password } = JSON.parse(body || '{}');
        if (password === ADMIN_PASSWORD) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, message: 'Inloggad!' }));
        } else {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, message: 'Felaktigt lösenord' }));
        }
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Ogiltigt format' }));
      }
    });
    return;
  }

  if (pathname === '/api/apply' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const payload = JSON.parse(body || '{}');
        const apps = readApplications();
        const now = new Date();
        const formattedDate = now.toLocaleDateString('sv-SE') + ' ' + now.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' });
        
        const newApp = {
          id: 'app_' + Date.now(),
          submittedAt: formattedDate,
          ssoName: (payload.ssoName || '').trim(),
          discord: (payload.discord || '-').trim(),
          age: (payload.age || '').trim(),
          level: (payload.level || '').trim(),
          motivation: (payload.motivation || '').trim(),
          status: 'Ny'
        };

        apps.unshift(newApp);
        writeApplications(apps);

        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, application: newApp }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Kunde inte spara ansökan' }));
      }
    });
    return;
  }

  if (pathname === '/api/applications' && req.method === 'GET') {
    const authHeader = req.headers['authorization'];
    const pass = authHeader ? authHeader.replace(/^Bearer\s+/, '') : parsedUrl.searchParams.get('token');
    if (pass !== ADMIN_PASSWORD) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Obehörig åtkomst' }));
      return;
    }
    const apps = readApplications();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(apps));
    return;
  }

  if (pathname.startsWith('/api/applications/') && req.method === 'DELETE') {
    const authHeader = req.headers['authorization'];
    const pass = authHeader ? authHeader.replace(/^Bearer\s+/, '') : parsedUrl.searchParams.get('token');
    if (pass !== ADMIN_PASSWORD) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Obehörig' }));
      return;
    }
    const id = pathname.replace('/api/applications/', '');
    let apps = readApplications();
    apps = apps.filter(a => a.id !== id);
    writeApplications(apps);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true }));
    return;
  }

  if (pathname.startsWith('/api/applications/') && req.method === 'PATCH') {
    const authHeader = req.headers['authorization'];
    const pass = authHeader ? authHeader.replace(/^Bearer\s+/, '') : parsedUrl.searchParams.get('token');
    if (pass !== ADMIN_PASSWORD) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Obehörig' }));
      return;
    }
    const id = pathname.replace('/api/applications/', '');
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const { status } = JSON.parse(body || '{}');
        let apps = readApplications();
        const app = apps.find(a => a.id === id);
        if (app) {
          app.status = status;
          writeApplications(apps);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, application: app }));
        } else {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Hittades inte' }));
        }
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Felaktig begäran' }));
      }
    });
    return;
  }

  // --- Static File Serving ---
  let reqPath = decodeURI(pathname);
  if (reqPath === '/' || reqPath === '') {
    reqPath = '/index.html';
  }

  const filePath = path.join(PUBLIC_DIR, reqPath);

  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=UTF-8' });
        res.end('404 Not Found');
      } else {
        res.writeHead(500);
        res.end('Server Error');
      }
    } else {
      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
});
