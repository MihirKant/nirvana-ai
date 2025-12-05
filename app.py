from flask import Flask, request, jsonify
from flask_cors import CORS
from src.agent import Agent
import subprocess
import os
import sys
import threading
import time
import atexit

app = Flask(__name__)
CORS(app)  # Enable CORS for React frontend
agent = Agent()

# Store process references for cleanup
processes = []

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
