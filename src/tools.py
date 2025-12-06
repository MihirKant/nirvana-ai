import subprocess
import os
import shutil
import requests
import webbrowser
import psutil
import cv2
import pytesseract
import time
from PIL import Image
from duckduckgo_search import DDGS
from AppOpener import open as open_app
from youtube_transcript_api import YouTubeTranscriptApi
from bs4 import BeautifulSoup
import yt_dlp

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
        # Add timeout and better error handling
        results = list(DDGS().text(query, max_results=5))
        if not results:
            return "No results found."
        output = []
        for r in results:
            output.append(f"- {r.get('title', 'No title')}: {r.get('href', '')}\n  {r.get('body', '')}")
        return "\n".join(output)
    except Exception as e:
        return f"Error searching web: {str(e)}"

def get_weather(city):
    try:
        # Use http instead of https to avoid SSL issues
        response = requests.get(f"http://wttr.in/{city}?format=3", timeout=10)
        if response.status_code == 200:
            return response.text.strip()
        else:
            return f"Could not fetch weather for {city}. Status: {response.status_code}"
    except Exception as e:
        return f"Error fetching weather: {str(e)}"

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
        cap = cv2.VideoCapture(0, cv2.CAP_DSHOW)  # Use DirectShow on Windows
        if not cap.isOpened():
            return "Could not open webcam. Make sure no other app is using it."
        
        # Give camera time to warm up
        time.sleep(0.5)
        
        # Try multiple captures
        ret, frame = None, None
        for i in range(5):
            ret, frame = cap.read()
            if ret:
                break
            time.sleep(0.2)
        
        cap.release()
        
        if ret and frame is not None:
            path = "snapshot.jpg"
            cv2.imwrite(path, frame)
            return f"Snapshot saved to {os.path.abspath(path)}"
        return "Failed to capture image. Camera may be in use by another application."
    except Exception as e:
        return f"Error capturing snapshot: {str(e)}"

def read_screen():
    try:
        from PIL import ImageGrab
        screenshot = ImageGrab.grab()
        text = pytesseract.image_to_string(screenshot)
        
        # Clean up the text
        lines = [line.strip() for line in text.split('\n') if line.strip()]
        cleaned_text = '\n'.join(lines)
        
        if not cleaned_text:
            return "No readable text found on screen."
        
        # Limit to 1000 characters
        return f"Screen Text:\n{cleaned_text[:1000]}"
    except Exception as e:
        return f"Error reading screen (ensure Tesseract is installed): {str(e)}"

# --- YouTube Downloader ---
def download_youtube_video(url, quality="best", output_path="."):
    """
    Download YouTube video using yt-dlp
    quality: 'best', 'worst', '720p', '1080p', 'audio_only'
    """
    try:
        # Check if FFmpeg is available
        ffmpeg_available = shutil.which('ffmpeg') is not None
        
        # Configure yt-dlp options
        ydl_opts = {
            'outtmpl': os.path.join(output_path, '%(title)s.%(ext)s'),
            'quiet': False,
            'no_warnings': False,
        }
        
        # Set quality options based on FFmpeg availability
        if quality == 'audio_only':
            if ffmpeg_available:
                ydl_opts['format'] = 'bestaudio/best'
                ydl_opts['postprocessors'] = [{
                    'key': 'FFmpegExtractAudio',
                    'preferredcodec': 'mp3',
                    'preferredquality': '192',
                }]
            else:
                # Download best audio without conversion
                ydl_opts['format'] = 'bestaudio/best'
        elif quality == '720p':
            if ffmpeg_available:
                ydl_opts['format'] = 'bestvideo[height<=720]+bestaudio/best[height<=720]'
            else:
                # Download pre-merged format at 720p or lower
                ydl_opts['format'] = 'best[height<=720]/best'
        elif quality == '1080p':
            if ffmpeg_available:
                ydl_opts['format'] = 'bestvideo[height<=1080]+bestaudio/best[height<=1080]'
            else:
                # Download pre-merged format at 1080p or lower
                ydl_opts['format'] = 'best[height<=1080]/best'
        elif quality == 'worst':
            ydl_opts['format'] = 'worst'
        else:  # best
            if ffmpeg_available:
                ydl_opts['format'] = 'bestvideo+bestaudio/best'
            else:
                # Download best pre-merged format
                ydl_opts['format'] = 'best'
        
        # Download the video
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=True)
            filename = ydl.prepare_filename(info)
            title = info.get('title', 'Unknown')
            
        ffmpeg_note = "" if ffmpeg_available else "\n\nNote: FFmpeg not detected. Downloaded pre-merged format. For better quality options, install FFmpeg: https://ffmpeg.org/download.html"
        return f"Successfully downloaded: {title}\nSaved to: {os.path.abspath(filename)}{ffmpeg_note}"
    except Exception as e:
        return f"Error downloading video: {str(e)}"

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
    "read_screen": read_screen,
    "download_youtube_video": download_youtube_video
}
