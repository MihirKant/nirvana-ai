from flask import Flask, request, jsonify
from flask_cors import CORS
from src.agent import Agent
import subprocess
import os
import sys
import threading
import time
import atexit
import json
from datetime import datetime

app = Flask(__name__)
CORS(app)  # Enable CORS for React frontend
agent = Agent()

# Store process references for cleanup
processes = []

# Track current chat filename for updates
current_chat_filename = None
current_chat_title = None

# Create data directory for saved chats
CHAT_STORAGE_DIR = os.path.join(os.path.dirname(__file__), 'data', 'saved_chats')
os.makedirs(CHAT_STORAGE_DIR, exist_ok=True)

def cleanup_processes():
    """Clean up all spawned processes on exit"""
    print("\n🛑 Shutting down servers...")
    for process in processes:
        try:
            process.terminate()
            process.wait(timeout=5)
        except:
            process.kill()

# Register cleanup function
atexit.register(cleanup_processes)

def run_frontend():
    """Run the Vite frontend development server"""
    frontend_dir = os.path.join(os.path.dirname(__file__), 'frontend')
    
    print("🚀 Starting Vite frontend server...")
    try:
        # Run npm run dev in the frontend directory
        process = subprocess.Popen(
            ['npm', 'run', 'dev'],
            cwd=frontend_dir,
            shell=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            universal_newlines=True,
            bufsize=1
        )
        processes.append(process)
        
        # Stream output
        for line in process.stdout:
            print(f"[FRONTEND] {line.strip()}")
            
    except Exception as e:
        print(f"❌ Error starting frontend: {e}")

@app.route('/chat', methods=['POST'])
def chat():
    data = request.json
    user_message = data.get('message')
    
    if not user_message:
        return jsonify({'error': 'No message provided'}), 400

    try:
        # Get response and tool outputs
        response, tool_outputs = agent.chat_with_tools(user_message)
        return jsonify({
            'response': response,
            'tool_outputs': tool_outputs  # Send tool outputs separately
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/save_chat', methods=['POST'])
def save_chat():
    """Save current conversation to a JSON file"""
    global current_chat_filename, current_chat_title
    try:
        data = request.json
        title = data.get('title')
        
        # If no title provided and we have a current chat, update it
        if not title and current_chat_filename:
            title = current_chat_title
            filename = current_chat_filename
        # If title provided, use it (new save or rename)
        elif title:
            # Sanitize filename
            safe_title = "".join(c for c in title if c.isalnum() or c in (' ', '-', '_')).rstrip()
            filename = f"{safe_title}.json"
            current_chat_title = title
            current_chat_filename = filename
        # No title and no current chat - generate default
        else:
            title = f'Chat_{datetime.now().strftime("%Y%m%d_%H%M%S")}'
            safe_title = "".join(c for c in title if c.isalnum() or c in (' ', '-', '_')).rstrip()
            filename = f"{safe_title}.json"
            current_chat_title = title
            current_chat_filename = filename
        
        filepath = os.path.join(CHAT_STORAGE_DIR, filename)
        
        # Prepare chat data
        chat_data = {
            'title': title,
            'timestamp': datetime.now().isoformat(),
            'messages': agent.history
        }
        
        # Save to file
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(chat_data, f, indent=2, ensure_ascii=False)
        
        is_update = data.get('title') is None and current_chat_filename is not None
        
        return jsonify({
            'success': True,
            'message': f'Chat {"updated" if is_update else "saved as"} "{title}"',
            'filename': filename,
            'title': title
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/clear_chat', methods=['POST'])
def clear_chat():
    """Clear current conversation and reset agent"""
    global current_chat_filename, current_chat_title
    try:
        agent.reset_conversation()
        current_chat_filename = None
        current_chat_title = None
        return jsonify({
            'success': True,
            'message': 'Chat cleared successfully'
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/list_chats', methods=['GET'])
def list_chats():
    """List all saved conversations"""
    try:
        chats = []
        for filename in os.listdir(CHAT_STORAGE_DIR):
            if filename.endswith('.json'):
                filepath = os.path.join(CHAT_STORAGE_DIR, filename)
                try:
                    with open(filepath, 'r', encoding='utf-8') as f:
                        data = json.load(f)
                        chats.append({
                            'filename': filename,
                            'title': data.get('title', filename),
                            'timestamp': data.get('timestamp', ''),
                            'message_count': len(data.get('messages', []))
                        })
                except:
                    continue
        
        # Sort by timestamp (newest first)
        chats.sort(key=lambda x: x['timestamp'], reverse=True)
        return jsonify({'chats': chats})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/load_chat', methods=['POST'])
def load_chat():
    """Load a saved conversation"""
    global current_chat_filename, current_chat_title
    try:
        data = request.json
        filename = data.get('filename')
        
        if not filename:
            return jsonify({'error': 'No filename provided'}), 400
        
        filepath = os.path.join(CHAT_STORAGE_DIR, filename)
        
        if not os.path.exists(filepath):
            return jsonify({'error': 'Chat not found'}), 404
        
        with open(filepath, 'r', encoding='utf-8') as f:
            chat_data = json.load(f)
        
        # Load conversation into agent
        agent.load_conversation(chat_data['messages'])
        
        # Track current chat for updates
        current_chat_filename = filename
        current_chat_title = chat_data.get('title', filename)
        
        return jsonify({
            'success': True,
            'message': f'Loaded chat: {chat_data.get("title")}',
            'messages': chat_data['messages'],
            'title': current_chat_title
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/delete_chat', methods=['POST'])
def delete_chat():
    """Delete a saved conversation"""
    try:
        data = request.json
        filename = data.get('filename')
        
        if not filename:
            return jsonify({'error': 'No filename provided'}), 400
        
        filepath = os.path.join(CHAT_STORAGE_DIR, filename)
        
        if not os.path.exists(filepath):
            return jsonify({'error': 'Chat not found'}), 404
        
        os.remove(filepath)
        
        return jsonify({
            'success': True,
            'message': 'Chat deleted successfully'
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    print("=" * 60)
    print("🌟 NIRVANA AI - Starting Development Servers")
    print("=" * 60)
    
    # Start frontend in a separate thread
    frontend_thread = threading.Thread(target=run_frontend, daemon=True)
    frontend_thread.start()
    
    # Give frontend a moment to start
    time.sleep(2)
    
    print("\n🚀 Starting Flask backend server...")
    print("=" * 60)
    print("📍 Backend:  http://localhost:5000")
    print("📍 Frontend: http://localhost:5173")
    print("=" * 60)
    print("\n💡 Press Ctrl+C to stop both servers\n")
    
    try:
        # Start Flask backend (this blocks)
        app.run(debug=True, port=5000, use_reloader=False)
    except KeyboardInterrupt:
        print("\n\n👋 Shutting down gracefully...")
        cleanup_processes()
        sys.exit(0)
