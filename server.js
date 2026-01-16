import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

const DATA_DIR = path.join(__dirname, 'Userdata');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR);
}

// Serve uploaded images
app.use('/userdata', express.static(DATA_DIR));

const USERS_FILE = path.join(DATA_DIR, 'users.json');

const getUsers = () => {
  if (!fs.existsSync(USERS_FILE)) return [];
  const data = fs.readFileSync(USERS_FILE, 'utf-8');
  return JSON.parse(data);
};

const saveUsers = (users) => {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
};

const getUserDir = (userId) => path.join(DATA_DIR, userId);

// --- API Routes ---

app.post('/api/register', (req, res) => {
  const { username, password } = req.body;
  const users = getUsers();

  if (users.find(u => u.username === username)) {
    return res.status(400).json({ error: 'Username already exists' });
  }

  const id = Date.now().toString(); 
  const newUser = { id, username, password };
  users.push(newUser);
  saveUsers(users);

  const userDir = getUserDir(id);
  if (!fs.existsSync(userDir)) {
    fs.mkdirSync(userDir);
    fs.writeFileSync(path.join(userDir, 'flashcards.json'), '[]');
  }

  res.json({ id: newUser.id, username: newUser.username });
});

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const users = getUsers();
  const user = users.find(u => u.username === username && u.password === password);

  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  res.json({ id: user.id, username: user.username });
});

app.get('/api/cards', (req, res) => {
  const userId = req.query.userId;
  if (!userId) return res.status(400).json({ error: 'User ID required' });

  const filePath = path.join(getUserDir(userId), 'flashcards.json');
  if (!fs.existsSync(filePath)) return res.json([]);

  const data = fs.readFileSync(filePath, 'utf-8');
  res.json(JSON.parse(data));
});

app.post('/api/cards', (req, res) => {
  const { userId, card } = req.body;
  if (!userId || !card) return res.status(400).json({ error: 'Missing data' });

  const filePath = path.join(getUserDir(userId), 'flashcards.json');
  let cards = [];
  if (fs.existsSync(filePath)) {
    cards = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  }

  const existingIndex = cards.findIndex(c => c.id === card.id);
  if (existingIndex >= 0) {
    cards[existingIndex] = card;
  } else {
    cards.push(card);
  }

  fs.writeFileSync(filePath, JSON.stringify(cards, null, 2));
  res.json({ success: true });
});

app.delete('/api/cards/:id', (req, res) => {
  const { userId } = req.query;
  const cardId = req.params.id;
  
  if (!userId) return res.status(400).json({ error: 'User ID required' });

  const filePath = path.join(getUserDir(userId), 'flashcards.json');
  if (!fs.existsSync(filePath)) return res.json({ success: true });

  let cards = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  cards = cards.filter(c => c.id !== cardId);

  fs.writeFileSync(filePath, JSON.stringify(cards, null, 2));
  res.json({ success: true });
});

app.post('/api/upload', (req, res) => {
  const { userId, imageBase64, filename } = req.body;
  // Get the host from the request to construct the correct URL
  // This ensures images load on mobile even if the server IP changes
  const protocol = req.protocol;
  const host = req.get('host'); // e.g., 192.168.1.5:3001

  if (!userId || !imageBase64 || !filename) {
    return res.status(400).json({ error: 'Missing upload data' });
  }

  try {
    const userImagesDir = path.join(getUserDir(userId), 'images');
    if (!fs.existsSync(userImagesDir)) {
      fs.mkdirSync(userImagesDir, { recursive: true });
    }

    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, 'base64');
    
    const uniqueName = `${Date.now()}-${filename}`;
    const filePath = path.join(userImagesDir, uniqueName);
    
    fs.writeFileSync(filePath, buffer);

    const imageUrl = `${protocol}://${host}/userdata/${userId}/images/${uniqueName}`;
    res.json({ url: imageUrl });

  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ error: 'Failed to upload image' });
  }
});

// Helper to find LAN IP
function getLocalIp() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // Skip internal (localhost) and non-IPv4 addresses
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

// Listen on 0.0.0.0 to accept external connections
app.listen(PORT, '0.0.0.0', () => {
  const ip = getLocalIp();
  console.log(`\n==================================================`);
  console.log(`SERVER RUNNING!`);
  console.log(`- Local:   http://localhost:${PORT}`);
  console.log(`- Network: http://${ip}:${PORT}  (Use this IP on your phone!)`);
  console.log(`Data stored in: ${DATA_DIR}`);
  console.log(`==================================================\n`);
});