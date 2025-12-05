import subprocess
import os
import shutil
import requests
import webbrowser
import psutil
import cv2
import pytesseract
from PIL import Image
from duckduckgo_search import DDGS
from AppOpener import open as open_app
from youtube_transcript_api import YouTubeTranscriptApi
from bs4 import BeautifulSoup

# --- Basic Tools ---
def run_terminal_command(command):
    try:
        result = subprocess.run(command, shell=True, capture_output=True, text=True, timeout=60)
        output = result.stdout
        if result.stderr: output += f"\nError Output:\n{result.stderr}"
        return output.strip()
    except Exception as e: return f"Error: {e}"

def read_file(path):
    try:
        if not os.path.exists(path): return f"Error: File '{path}' does not exist."
        with open(path, 'r', encoding='utf-8') as f: return f.read()
    except Exception as e: return f"Error: {e}"

def write_file(path, content):
    try:
        os.makedirs(os.path.dirname(os.path.abspath(path)), exist_ok=True)
        with open(path, 'w', encoding='utf-8') as f: f.write(content)
        return f"Successfully wrote to '{path}'."
    except Exception as e: return f"Error: {e}"

def list_directory(path="."):
    try:
        if not os.path.exists(path): return f"Error: Path '{path}' does not exist."
        return "\n".join(os.listdir(path))
    except Exception as e: return f"Error: {e}"

# --- Web & Info ---
def search_web(query):
    try:
        results = DDGS().text(query, max_results=5)
        return "\n".join([f"- {r['title']}: {r['href']}\n  {r['body']}" for r in results]) if results else "No results."
    except Exception as e: return f"Error: {e}"

def get_weather(city):
    try:
        return requests.get(f"https://wttr.in/{city}?format=3").text.strip()
    except Exception as e: return f"Error: {e}"

def get_youtube_transcript(url):
    try:
        video_id = url.split("v=")[1].split("&")[0]
        transcript = YouTubeTranscriptApi.get_transcript(video_id)
        return " ".join([t['text'] for t in transcript])[:5000] # Limit length
    except Exception as e: return f"Error getting transcript: {e}"

def get_morning_briefing():
    try:
        # Tech News (Hacker News)
        headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'}
        hn = requests.get("https://news.ycombinator.com/", headers=headers)
        soup = BeautifulSoup(hn.text, 'html.parser')
        headlines = []
        for item in soup.select('.titleline > a')[:5]:
            title = item.text
            link = item.get('href')
            headlines.append(f"- {title}: {link}")
        
        news = "Top Tech News:\n" + "\n".join(headlines)
        return news
    except Exception as e: return f"Error getting briefing: {e}"

# --- System & Apps ---
def open_application(app_name):
    try:
        open_app(app_name, match_closest=True)
        return f"Opening {app_name}..."
    except Exception as e: return f"Error: {e}"

def draft_email(to, subject, body):
    try:
        import urllib.parse
        webbrowser.open(f"mailto:{to}?subject={urllib.parse.quote(subject)}&body={urllib.parse.quote(body)}")
        return f"Drafted email to {to}."
    except Exception as e: return f"Error: {e}"

def system_health():
    try:
        cpu = psutil.cpu_percent(interval=0)
        ram = psutil.virtual_memory().percent
        battery = psutil.sensors_battery()
        bat_stat = f"{battery.percent}% ({'Plugged In' if battery.power_plugged else 'On Battery'})" if battery else "No Battery"
        return f"CPU: {cpu}%\nRAM: {ram}%\nBattery: {bat_stat}"
    except Exception as e: return f"Error: {e}"

def organize_files(directory_path):
    try:
        if not os.path.exists(directory_path): return "Directory not found."
        
        extensions = {
            "Images": ['.jpg', '.jpeg', '.png', '.gif', '.bmp'],
            "Documents": ['.pdf', '.docx', '.txt', '.xlsx', '.pptx'],
            "Installers": ['.exe', '.msi', '.dmg'],
            "Archives": ['.zip', '.rar', '.7z'],
            "Videos": ['.mp4', '.mkv', '.avi']
        }
        
        moved_count = 0
        for filename in os.listdir(directory_path):
            file_path = os.path.join(directory_path, filename)
            if os.path.isfile(file_path):
                ext = os.path.splitext(filename)[1].lower()
                for folder, exts in extensions.items():
                    if ext in exts:
                        folder_path = os.path.join(directory_path, folder)
                        os.makedirs(folder_path, exist_ok=True)
                        shutil.move(file_path, os.path.join(folder_path, filename))
                        moved_count += 1
                        break
        return f"Organized {moved_count} files in {directory_path}."
    except Exception as e: return f"Error: {e}"

def focus_mode(state: str):
    """ state: 'on' or 'off' """
    distractions = ["steam.exe", "discord.exe", "chrome.exe"]
    try:
        if state.lower() == "on":
            killed = []
            for proc in psutil.process_iter(['pid', 'name']):
                if proc.info['name'].lower() in distractions:
                    proc.kill()
                    killed.append(proc.info['name'])
            return f"Focus Mode ON. Killed: {', '.join(killed)}"
        else:
            return "Focus Mode OFF. You can reopen your apps."
    except Exception as e: return f"Error: {e}"

# --- Security ---
def scan_network():
    # Simple ARP scan wrapper (requires arp -a to work on Windows)
    return run_terminal_command("arp -a")

def get_wifi_password(ssid):
    return run_terminal_command(f"netsh wlan show profile name=\"{ssid}\" key=clear")

# --- Visual ---
def security_cam_snapshot():
    try:
        cap = cv2.VideoCapture(0)
        if not cap.isOpened(): return "Could not open webcam."
        ret, frame = cap.read()
        cap.release()
        if ret:
            path = "snapshot.jpg"
            cv2.imwrite(path, frame)
            return f"Snapshot saved to {os.path.abspath(path)}"
        return "Failed to capture image."
    except Exception as e: return f"Error: {e}"

def read_screen():
    try:
        # Requires pyautogui for screenshot, let's add it or use PIL ImageGrab
        from PIL import ImageGrab
        screenshot = ImageGrab.grab()
        text = pytesseract.image_to_string(screenshot)
        return f"Screen Text:\n{text.strip()[:1000]}" # Limit text
    except Exception as e: return f"Error reading screen (ensure Tesseract is installed): {e}"

AVAILABLE_TOOLS = {
    "run_terminal_command": run_terminal_command,
    "read_file": read_file,
    "write_file": write_file,
    "list_directory": list_directory,
    "search_web": search_web,
    "get_weather": get_weather,
    "open_application": open_application,
    "draft_email": draft_email,
    "get_youtube_transcript": get_youtube_transcript,
    "get_morning_briefing": get_morning_briefing,
    "system_health": system_health,
    "organize_files": organize_files,
    "focus_mode": focus_mode,
    "scan_network": scan_network,
    "get_wifi_password": get_wifi_password,
    "security_cam_snapshot": security_cam_snapshot,
    "read_screen": read_screen
}
