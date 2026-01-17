import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// --- DEBUG: Global Request Logger ---
app.use((req, res, next) => {
  console.log(`[Incoming Request] ${req.method} ${req.url}`);
  next();
});

const DATA_DIR = path.join(__dirname, 'Userdata');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR);
}

// Serve uploaded images and audio
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

  const userDir = getUserDir(userId);
  if (!fs.existsSync(userDir)) {
    fs.mkdirSync(userDir, { recursive: true });
  }

  const filePath = path.join(userDir, 'flashcards.json');
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
  const protocol = req.protocol;
  const host = req.get('host');

  if (!userId || !imageBase64 || !filename) {
    return res.status(400).json({ error: 'Missing upload data' });
  }

  try {
    const userDir = getUserDir(userId);
    if (!fs.existsSync(userDir)) {
      fs.mkdirSync(userDir, { recursive: true });
    }

    const userImagesDir = path.join(userDir, 'images');
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

app.post('/api/generate-audio', (req, res) => {
  const { userId, text, language } = req.body;
  
  console.log(`[Audio Gen] Request. User: ${userId}, Lang: ${language}, Text: "${text}"`);

  const protocol = req.protocol;
  const host = req.get('host');

  if (!userId || !text) {
    return res.status(400).json({ error: 'Missing data' });
  }

  // Determine script based on language
  const isEnglish = language === 'EN';
  const scriptName = isEnglish ? 'Cambridge.py' : 'OJAD.py';
  const pythonScript = path.join(__dirname, scriptName);
  
  // Clean text
  const cleanText = text.replace(/\[[^\]]+\]/g, '').trim();
  
  // Prepare args (pass timestamp for unique filenames in Cambridge)
  const args = [pythonScript, cleanText, Date.now().toString()];
  
  console.log(`[Audio Gen] Spawning: python ${scriptName} "${cleanText}"`);
  
  const pythonProcess = spawn('python', args, { cwd: __dirname });
  
  let resultData = '';
  let errorData = '';

  pythonProcess.on('error', (err) => {
    console.error(`[Audio Gen] CRITICAL ERROR: Failed to launch Python.`);
    if (!res.headersSent) {
      return res.status(500).json({ 
        error: 'Failed to launch Python.', 
        details: 'Check if Python is installed and in PATH.' 
      });
    }
  });

  pythonProcess.stdout.on('data', (data) => {
    const str = data.toString();
    if (str.startsWith('DEBUG:')) {
       console.log(`[Py Log] ${str.trim()}`);
    } else {
       resultData += str;
    }
  });

  pythonProcess.stderr.on('data', (data) => {
    errorData += data.toString();
    console.error(`[Py Err] ${data}`);
  });

  pythonProcess.on('close', (code) => {
    // Check specifically for Cambridge Not Found error
    if (resultData.includes('CAMBRIDGE_ERROR:NotFound')) {
        console.warn(`[Audio Gen] Word not found in Cambridge Dictionary: ${cleanText}`);
        return res.status(404).json({ error: '該單字未收錄進字典，無法提供音檔' });
    }
    
    // Check for other script errors
    if (code !== 0 || resultData.includes('_ERROR:')) {
      console.error(`[Audio Gen] Script failed. Code: ${code}`);
      if (!res.headersSent) {
        return res.status(500).json({ error: 'Audio generation failed', details: errorData || resultData });
      }
      return;
    }

    // Determine expected output prefix
    const outputPrefix = isEnglish ? 'CAMBRIDGE_OUTPUT:' : 'OJAD_OUTPUT:';
    
    const lines = resultData.split('\n');
    const outputLine = lines.find(line => line.startsWith(outputPrefix));
    
    if (outputLine) {
      const tempPath = outputLine.replace(outputPrefix, '').trim();
      
      const userDir = getUserDir(userId);
      const userAudioDir = path.join(userDir, 'audio');
      
      if (!fs.existsSync(userAudioDir)) {
        fs.mkdirSync(userAudioDir, { recursive: true });
      }

      const filename = path.basename(tempPath);
      const destPath = path.join(userAudioDir, filename);

      try {
        // Move file from temp/script dir to user dir
        // fs.renameSync works if on same partition, otherwise copy+unlink
        fs.copyFileSync(tempPath, destPath);
        fs.unlinkSync(tempPath);
        
        const audioUrl = `${protocol}://${host}/userdata/${userId}/audio/${filename}`;
        console.log(`[Audio Gen] Success! ${audioUrl}`);
        res.json({ url: audioUrl });
      } catch (err) {
        console.error("Move file error:", err);
        res.status(500).json({ error: 'Failed to save audio file' });
      }
    } else {
      console.error("[Audio Gen] No output filename found in stdout.");
      res.status(500).json({ error: 'Audio generation failed (No output)' });
    }
  });
});

function getLocalIp() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

app.listen(PORT, '0.0.0.0', () => {
  const ip = getLocalIp();
  console.log(`\n==================================================`);
  console.log(`SERVER RUNNING!`);
  console.log(`- Local:   http://localhost:${PORT}`);
  console.log(`- Network: http://${ip}:${PORT}`);
  console.log(`- Automation: OJAD (JP) & Cambridge (EN) active`);
  console.log(`==================================================\n`);
});