import sys
import os
import requests
from bs4 import BeautifulSoup

# 設定編碼以支援 Windows Console
sys.stdout.reconfigure(encoding='utf-8')

# 設定存檔資料夾 (與 server.js 中的邏輯配合，這裡暫存，server 會移動它)
current_dir = os.path.dirname(os.path.abspath(__file__))
DOWNLOAD_DIR = os.path.join(current_dir, "cambridge_audio")

if not os.path.exists(DOWNLOAD_DIR):
    os.makedirs(DOWNLOAD_DIR)

def download_cambridge_audio(word):
    # 1. 建構字典網頁網址
    page_url = f"https://dictionary.cambridge.org/zht/詞典/英語-漢語-繁體/{word}"
    
    # 2. 偽裝成瀏覽器
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Referer": "https://dictionary.cambridge.org/",
        "Accept-Language": "zh-TW,zh;q=0.9,en-US;q=0.8,en;q=0.7"
    }

    try:
        print(f"DEBUG: Analyzing page for word: {word} ...", flush=True)
        
        response = requests.get(page_url, headers=headers, timeout=10)
        
        if response.status_code != 200:
            print(f"DEBUG: Page status code: {response.status_code}", flush=True)
            # 視為找不到
            print("CAMBRIDGE_ERROR:NotFound", flush=True)
            return

        soup = BeautifulSoup(response.text, 'html.parser')
        
        # 尋找美式發音 (US)
        us_area = soup.select_one(".us.dpron-i source[type='audio/mpeg']")
        
        if not us_area:
            print(f"DEBUG: No US audio source found for '{word}'", flush=True)
            print("CAMBRIDGE_ERROR:NotFound", flush=True)
            return
            
        audio_src = us_area.get('src')
        full_audio_url = f"https://dictionary.cambridge.org{audio_src}"
        print(f"DEBUG: Found Audio URL: {full_audio_url}", flush=True)

        # 下載 MP3
        mp3_res = requests.get(full_audio_url, headers=headers, stream=True)
        
        if mp3_res.status_code == 200:
            filename = f"cambridge_{word}_{int(sys.argv[2] if len(sys.argv) > 2 else 0)}.mp3"
            save_path = os.path.join(DOWNLOAD_DIR, filename)
            
            with open(save_path, 'wb') as f:
                for chunk in mp3_res.iter_content(chunk_size=1024):
                    f.write(chunk)
            
            print(f"CAMBRIDGE_OUTPUT:{save_path}", flush=True)
        else:
            print(f"DEBUG: Failed to download MP3. Status: {mp3_res.status_code}", flush=True)
            print("CAMBRIDGE_ERROR:DownloadFailed", flush=True)

    except Exception as e:
        print(f"DEBUG: Exception: {e}", flush=True)
        print("CAMBRIDGE_ERROR:ScriptException", flush=True)

if __name__ == "__main__":
    if len(sys.argv) > 1:
        word_input = sys.argv[1]
        download_cambridge_audio(word_input)
    else:
        print("CAMBRIDGE_ERROR:NoInput", flush=True)
