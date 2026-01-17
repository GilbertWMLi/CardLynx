# LexiDeck Local 📚

**LexiDeck Local** is a high-performance, offline-first flashcard application designed for serious language learners (English & Japanese). 

Unlike cloud-based apps, LexiDeck Local runs on your own computer and stores all data (text, images, audio) in your local filesystem (`./Userdata`). It acts as a local server, allowing you to access your deck from any device (phone, tablet) on your home Wi-Fi.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18-green.svg)
![Python](https://img.shields.io/badge/python-3.x-yellow.svg)

## ✨ Features

- **🏠 Local Network Sync**: Run the server on your PC, study on your phone via Wi-Fi.
- **🇯🇵 Japanese Support**: 
  - **OJAD Audio**: Automatically generates pitch-accent accurate audio using Selenium automation.
  - **Furigana/Ruby**: Built-in editor to add readings (e.g., 漢[かん]字[じ]).
  - **Weblio Integration**: Quick link to dictionary definitions.
- **🇺🇸 English Support**:
  - **Cambridge Audio**: Scrapes native pronunciation audio directly from Cambridge Dictionary.
  - **Sentence Analysis**: Checks your grammar and sentence structure in Quiz Mode.
- **📷 Local OCR**: Extract text from images (textbooks, screenshots) using Tesseract.js directly in the browser.
- **🧠 Study Modes**: 
  - **Flashcards**: Spaced-repetition style review with "Forgot", "Hazy", and "Mastered" ratings.
  - **Quiz**: Sentence construction and translation practice.
- **📂 File-System Based**: All your user data, images, and audio files are stored in the `Userdata` folder. You own your data.

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, Lucide Icons.
- **Backend**: Node.js (Express) - handles file I/O and script execution.
- **Automation**: Python (Selenium, BeautifulSoup4, Requests) for audio generation.
- **OCR**: Tesseract.js (WASM).

## 🚀 Installation & Setup

### 1. Prerequisites
Ensure you have the following installed:
- **Node.js** (v18 or higher)
- **Python** (v3.x)
- **Google Chrome** (Required for Japanese audio generation via Selenium)

### 2. Clone & Install Dependencies
```bash
# Install Node.js dependencies
npm install
```

### 3. Setup Python Environment
The app uses Python scripts to fetch audio. You need to install the required libraries:

```bash
pip install requests selenium beautifulsoup4
```

> **Note**: Ensure `python` is added to your system's PATH. You can verify this by typing `python --version` in your terminal.

## 🏃‍♂️ Running the App

To start both the Backend Server (Port 3001) and the Frontend Client (Port 5173), simply run:

```bash
npm run dev
```

You should see output indicating that the server is running:
```text
[0] SERVER RUNNING!
[0] - Local:   http://localhost:3001
[0] - Network: http://192.168.1.101:3001
[0] - Automation: OJAD (JP) & Cambridge (EN) active
```

## 📱 Using on Mobile (Local Network)

1. Ensure your phone and computer are on the **same Wi-Fi network**.
2. Look at the terminal output for the **Network URL** (e.g., `http://192.168.1.101:5173`).
3. Open that URL in your phone's browser.
4. **Important**: On the login screen, click the **Settings (Gear Icon)**.
5. Enter the **Server URL** (e.g., `http://192.168.1.101:3001`) so the frontend knows where to send API requests.

## 📂 Project Structure

- **`server.js`**: The Express server that handles API requests, file saving, and spawns Python scripts.
- **`Cambridge.py`**: Scrapes English audio.
- **`OJAD.py`**: Scrapes Japanese audio via Selenium.
- **`Userdata/`**: Created automatically. Stores `users.json` and individual user folders containing flashcards, images, and audio.
- **`src/`**: React source code.
  - **`components/`**: UI Components (CardForm, ReviewMode, etc.).
  - **`utils/`**: API and Storage logic.

## ⚠️ Troubleshooting

**Audio Generation Fails:**
- **Japanese (OJAD)**: Ensure you have Google Chrome installed. Selenium tries to launch a headless Chrome instance.
- **English (Cambridge)**: Check if your internet connection can access `dictionary.cambridge.org`.
- **General**: Check the server console logs. If you see `'python' is not recognized`, ensure Python is in your system environment variables.

**Mobile App Connection Error:**
- Ensure your firewall allows connections on Port `3001` (Server) and `5173` (Vite).
- Double-check the Server URL in the app settings matches your PC's local IP address.

## 📄 License
MIT
