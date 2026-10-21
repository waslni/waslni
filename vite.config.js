import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import fs from 'fs';
import path from 'path';
import { loadEnv } from 'vite';

const serverEnv = loadEnv(process.env.NODE_ENV === 'production' ? 'production' : 'development', process.cwd(), '');
process.env.TELEGRAM_BOT_TOKEN ||= serverEnv.TELEGRAM_BOT_TOKEN;
process.env.TELEGRAM_CHAT_ID ||= serverEnv.TELEGRAM_CHAT_ID;

const STORE_PATH = path.resolve(__dirname, 'data/store.json');

function readStore() {
  try {
    if (!fs.existsSync(STORE_PATH)) {
      const fallback = {
        orders: [],
        users: [],
        settings: { whatsappNumber: '966558840806' },
        maintenance: { enabled: false },
        lastUpdated: Date.now()
      };
      fs.mkdirSync(path.dirname(STORE_PATH), { recursive: true });
      fs.writeFileSync(STORE_PATH, JSON.stringify(fallback, null, 2), 'utf8');
      return fallback;
    }
    const raw = fs.readFileSync(STORE_PATH, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading store.json:', err);
    return { orders: [], users: [], settings: {}, maintenance: { enabled: false } };
  }
}

function writeStore(data) {
  try {
    data.lastUpdated = Date.now();
    fs.mkdirSync(path.dirname(STORE_PATH), { recursive: true });
    fs.writeFileSync(STORE_PATH, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('Error writing store.json:', err);
  }
}

function waslniStoragePlugin() {
  return {
    name: 'waslni-storage-api',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        // Set CORS headers for local network testing
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        if (req.method === 'OPTIONS') {
          res.statusCode = 204;
          res.end();
          return;
        }

        // Serve PDF with explicit MIME and inline headers
        if (req.url === '/WASLNI_USER_GUIDE.pdf' && req.method === 'GET') {
          const pdfPath = path.resolve(__dirname, 'public/WASLNI_USER_GUIDE.pdf');
          if (fs.existsSync(pdfPath)) {
            const stat = fs.statSync(pdfPath);
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Length', stat.size);
            res.setHeader('Content-Disposition', 'inline; filename="WASLNI_USER_GUIDE.pdf"');
            const stream = fs.createReadStream(pdfPath);
            stream.pipe(res);
            return;
          }
        }

        // API endpoints
        if (req.url.startsWith('/api/')) {
          const url = req.url.split('?')[0];

          // Prevent any caching on mobile browsers / iOS Safari
          res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
          res.setHeader('Pragma', 'no-cache');
          res.setHeader('Expires', '0');

          // GET /api/data
          if (url === '/api/data' && req.method === 'GET') {
            res.setHeader('Content-Type', 'application/json');
            const store = readStore();
            res.end(JSON.stringify(store));
            return;
          }

          // Read body for POST requests
          if (req.method === 'POST') {
            let body = '';
            req.on('data', chunk => { body += chunk; });
            req.on('end', () => {
              res.setHeader('Content-Type', 'application/json');
              let payload = {};
              try {
                payload = JSON.parse(body);
              } catch (e) {
                payload = {};
              }

              if (url === '/api/telegram/message' || url === '/api/telegram/receipt') {
                const token = process.env.TELEGRAM_BOT_TOKEN;
                const defaultChatId = process.env.TELEGRAM_CHAT_ID;
                if (!token || !defaultChatId) {
                  res.statusCode = 503;
                  res.end(JSON.stringify({ success: false, message: 'Telegram server configuration is missing' }));
                  return;
                }
                const chatId = payload.chatId || defaultChatId;
                const endpoint = url.endsWith('/receipt') ? 'sendPhoto' : 'sendMessage';
                let telegramRequest;
                if (endpoint === 'sendPhoto') {
                  const match = /^data:image\/(jpeg|jpg|png|webp);base64,(.+)$/s.exec(payload.image || '');
                  if (!match) {
                    res.statusCode = 400;
                    res.end(JSON.stringify({ success: false, message: 'Unsupported receipt image' }));
                    return;
                  }
                  const bytes = Buffer.from(match[2], 'base64');
                  if (!bytes.length || bytes.length > 10 * 1024 * 1024) {
                    res.statusCode = 400;
                    res.end(JSON.stringify({ success: false, message: 'Invalid or oversized receipt image' }));
                    return;
                  }
                  const mime = match[1] === 'jpg' ? 'jpeg' : match[1];
                  const form = new FormData();
                  form.append('chat_id', chatId);
                  form.append('caption', `إيصال تحويل للطلب ${payload.orderNumber || ''} — العميل: ${payload.customerName || ''}`);
                  form.append('photo', new Blob([bytes], { type: `image/${mime}` }), `receipt.${mime}`);
                  telegramRequest = { method: 'POST', body: form };
                } else {
                  telegramRequest = { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chat_id: chatId, text: payload.text, parse_mode: 'HTML' }) };
                }
                fetch(`https://api.telegram.org/bot${token}/${endpoint}`, telegramRequest).then(async telegramResponse => {
                  const result = await telegramResponse.json();
                  res.statusCode = telegramResponse.ok ? 200 : 502;
                  res.end(JSON.stringify({ success: telegramResponse.ok && result.ok, message: result.description }));
                }).catch(error => {
                  res.statusCode = 502;
                  res.end(JSON.stringify({ success: false, message: error.message }));
                });
                return;
              }

              const store = readStore();

              if (url === '/api/orders') {
                const newOrder = payload;
                if (!newOrder.id) newOrder.id = 'WS-' + Math.floor(100000 + Math.random() * 900000);
                if (!newOrder.orderNumber) newOrder.orderNumber = newOrder.id;
                if (!newOrder.timestamp) newOrder.timestamp = Date.now();

                const customer = store.users.find(user => user.role === 'customer' && (
                  (newOrder.customerId && user.id === newOrder.customerId) ||
                  (newOrder.customerPhone && String(user.phone || '').replace(/\D/g, '') === String(newOrder.customerPhone).replace(/\D/g, ''))
                ));
                if (customer) {
                  const cutoff = Date.now() - 24 * 60 * 60 * 1000;
                  const customerPhone = String(customer.phone || '').replace(/\D/g, '');
                  const recentCount = store.orders.filter(order => {
                    const sameCustomer = order.customerId === customer.id || String(order.customerPhone || '').replace(/\D/g, '') === customerPhone;
                    const orderTime = Number(order.timestamp) || Date.parse(order.createdAt || '');
                    return sameCustomer && Number.isFinite(orderTime) && orderTime >= cutoff;
                  }).length;
                  const activeGrants = (customer.orderQuotaGrants || []).filter(grant => Number(grant.expiresAt) > Date.now());
                  const maxOrders = 3 + activeGrants.reduce((sum, grant) => sum + Math.max(0, Number(grant.amount) || 0), 0);
                  const duplicate = store.orders.some(order => order.id === newOrder.id || order.orderNumber === newOrder.orderNumber);
                  if (!duplicate && recentCount >= maxOrders) {
                    res.statusCode = 429;
                    res.end(JSON.stringify({ success: false, message: 'وصلت إلى الحد المسموح من الطلبات خلال آخر 24 ساعة.' }));
                    return;
                  }
                }
                
                const existingIndex = store.orders.findIndex(o => o.id === newOrder.id || o.orderNumber === newOrder.orderNumber);
                if (existingIndex !== -1) {
                  store.orders[existingIndex] = { ...store.orders[existingIndex], ...newOrder };
                } else {
                  store.orders.unshift(newOrder);
                }
                store.orders.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
                writeStore(store);
                res.end(JSON.stringify({ success: true, order: newOrder }));
                return;
              }

              if (url === '/api/orders/update') {
                const { id, updates } = payload;
                const index = store.orders.findIndex(o => o.id === id || o.orderNumber === id);
                if (index !== -1) {
                  store.orders[index] = { ...store.orders[index], ...updates };
                  writeStore(store);
                  res.end(JSON.stringify({ success: true, order: store.orders[index] }));
                  return;
                }
                // If order wasn't found, try to add it with updates if updates has orderNumber
                if (updates && (updates.id || updates.orderNumber)) {
                  store.orders.unshift(updates);
                  writeStore(store);
                  res.end(JSON.stringify({ success: true, order: updates }));
                  return;
                }
                res.statusCode = 404;
                res.end(JSON.stringify({ success: false, message: 'Order not found' }));
                return;
              }

              if (url === '/api/orders/delete') {
                const { id } = payload;
                store.orders = store.orders.filter(o => o.id !== id && o.orderNumber !== id);
                writeStore(store);
                res.end(JSON.stringify({ success: true }));
                return;
              }

              if (url === '/api/packages') {
                store.packages = payload;
                writeStore(store);
                res.end(JSON.stringify({ success: true, packages: store.packages }));
                return;
              }

              if (url === '/api/maintenance') {
                store.maintenance = { ...store.maintenance, ...payload };
                writeStore(store);
                res.end(JSON.stringify({ success: true, maintenance: store.maintenance }));
                return;
              }

              if (url === '/api/settings') {
                store.settings = { ...store.settings, ...payload };
                writeStore(store);
                res.end(JSON.stringify({ success: true, settings: store.settings }));
                return;
              }

              if (url === '/api/users') {
                const newUser = payload;
                const existingIdx = store.users.findIndex(u => u.id === newUser.id || (u.phone && u.phone === newUser.phone) || (u.username && u.username === newUser.username));
                if (existingIdx !== -1) {
                  store.users[existingIdx] = { ...store.users[existingIdx], ...newUser };
                } else {
                  store.users.push(newUser);
                }
                writeStore(store);
                res.end(JSON.stringify({ success: true, user: newUser }));
                return;
              }

              if (url === '/api/users/delete') {
                const { id } = payload;
                store.users = store.users.filter(u => u.id !== id);
                writeStore(store);
                res.end(JSON.stringify({ success: true }));
                return;
              }

              // Default fallback for other endpoints
              res.end(JSON.stringify({ success: true }));
            });
            return;
          }
        }

        next();
      });
    }
  };
}

// https://vite.dev/config/
export default defineConfig({
  base: process.env.GITHUB_ACTIONS === 'true'
    ? `/${process.env.GITHUB_REPOSITORY?.split('/')[1] || ''}/`
    : '/',
  plugins: [
    react(),
    tailwindcss(),
    waslniStoragePlugin()
  ],
  server: {
    host: '0.0.0.0', // Listen on all network interfaces (Home Wi-Fi & LAN)
    port: 5173,
    cors: true
  }
});
