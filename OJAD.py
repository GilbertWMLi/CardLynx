import sys
import os

# DEBUG: 讓使用者確認 Python 有被啟動
print("DEBUG: OJAD.py script started...", flush=True)

# --- 設定路徑: 優先使用本地 libs 資料夾內的套件 ---
current_dir = os.path.dirname(os.path.abspath(__file__))
libs_dir = os.path.join(current_dir, 'libs')

if os.path.exists(libs_dir):
    print(f"DEBUG: Found libs directory at {libs_dir}, adding to path.", flush=True)
    sys.path.insert(0, libs_dir)
else:
    print(f"DEBUG: libs directory NOT found at {libs_dir}", flush=True)

# --- 導入套件 ---
try:
    import time
    import requests
    from selenium import webdriver
    from selenium.webdriver.common.by import By
    from selenium.webdriver.chrome.options import Options
    from selenium.webdriver.support.ui import WebDriverWait
    from selenium.webdriver.support import expected_conditions as EC
    print("DEBUG: Successfully imported all modules.", flush=True)
except ImportError as e:
    print(f"OJAD_ERROR:Import failed: {e}")
    sys.exit(1)

# 設定
TARGET_URL = "https://www.gavo.t.u-tokyo.ac.jp/ojad/phrasing/index"
DOWNLOAD_DIR = "ojad_audio"

ABS_DOWNLOAD_DIR = os.path.join(current_dir, DOWNLOAD_DIR)

if not os.path.exists(ABS_DOWNLOAD_DIR):
    os.makedirs(ABS_DOWNLOAD_DIR)

def get_ojad_audio(text, speaker="fa001", speed="1"):
    print(f"DEBUG: Configuring WebDriver...", flush=True)
    chrome_options = Options()
    chrome_options.add_argument("--headless") 
    chrome_options.add_argument("--disable-gpu")
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--log-level=3") 
    
    try:
        driver = webdriver.Chrome(options=chrome_options)
        print(f"DEBUG: WebDriver started. Navigating to {TARGET_URL}", flush=True)
        
        driver.get(TARGET_URL)

        input_box = driver.find_element(By.ID, "PhrasingText")
        input_box.clear()
        input_box.send_keys(text)

        submit_btn = driver.find_element(By.CSS_SELECTOR, "div.submit input[type='submit']")
        submit_btn.click()

        WebDriverWait(driver, 15).until(
            EC.presence_of_element_located((By.ID, "phrasing_main"))
        )

        js_set_options = f"""
            document.getElementById('speaker').value = '{speaker}';
            document.getElementById('speech_rate_mode').value = '{speed}';
        """
        driver.execute_script(js_set_options)

        driver.execute_script("synthesis_and_get_filename();")

        wav_filename = ""
        max_retries = 30
        for _ in range(max_retries):
            wav_filename = driver.execute_script("return wav_filename;")
            if wav_filename:
                break
            time.sleep(0.5)

        if not wav_filename:
            print("DEBUG: Timed out waiting for filename.", flush=True)
            return None

        base_uri = "https://www.gavo.t.u-tokyo.ac.jp/ojad/"
        download_url = f"{base_uri}ajax/tmp_download/{wav_filename}"

        session = requests.Session()
        cookies = driver.get_cookies()
        for cookie in cookies:
            session.cookies.set(cookie['name'], cookie['value'])
            
        print(f"DEBUG: Downloading from {download_url}", flush=True)
        response = session.get(download_url)
        
        if response.status_code == 200:
            timestamp = int(time.time() * 1000)
            filename = f"ojad_{timestamp}.wav"
            save_path = os.path.join(ABS_DOWNLOAD_DIR, filename)
            
            with open(save_path, "wb") as f:
                f.write(response.content)
            
            return save_path
        else:
            print(f"DEBUG: Download failed with status {response.status_code}", flush=True)
            return None

    except Exception as e:
        print(f"DEBUG: Exception occurred: {e}", flush=True)
        return None
    finally:
        if 'driver' in locals():
            driver.quit()

if __name__ == "__main__":
    if len(sys.argv) > 1:
        # 處理 Windows cmd 編碼
        if sys.platform.startswith('win'):
             sys.stdout.reconfigure(encoding='utf-8')
             
        input_text = sys.argv[1]
        result_path = get_ojad_audio(input_text, speaker="fa001", speed="1")
        
        if result_path:
            print(f"OJAD_OUTPUT:{result_path}")
        else:
            print("OJAD_ERROR:Failed to generate")
    else:
        print("OJAD_ERROR:No text provided")