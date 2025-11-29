# Nirvana AI 🧘‍♂️

> Your Personal AI Butler - Locally Powered, Infinitely Capable

[![Python](https://img.shields.io/badge/Python-3.8+-blue.svg)](https://www.python.org/downloads/)
[![Flask](https://img.shields.io/badge/Flask-3.0+-green.svg)](https://flask.palletsprojects.com/)
[![Ollama](https://img.shields.io/badge/Ollama-Llama%203.1-purple.svg)](https://ollama.ai/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

Nirvana is an advanced, locally-running AI assistant that combines the power of Large Language Models with practical system tools, web capabilities, and multimodal features. Unlike cloud-based assistants, Nirvana runs entirely on your machine, ensuring **complete privacy** and **offline functionality**.

![Nirvana AI Interface](https://via.placeholder.com/800x400/8b5cf6/ffffff?text=Nirvana+AI+Interface)

## ✨ Features

### 🎯 Core Capabilities
- **🔒 100% Local & Private** - No data sent to cloud servers
- **🛠️ Tool-Augmented AI** - Can actually DO things, not just chat
- **🎤 Voice & Vision** - Multimodal interaction (speech, camera, screen reading)
- **🎨 Modern UI** - Sleek purple-themed web interface with smooth animations
- **🔌 Extensible** - Easy to add new tools and capabilities

### 🧰 17 Built-in Tools

#### System & File Management
- Execute terminal commands
- Read/write files
- Auto-organize files by type
- System health monitoring (CPU/RAM/Battery)
- Focus mode (kill distracting apps)

#### Web & Information
- Web search (DuckDuckGo)
- Weather information
- Morning tech news briefing
- YouTube transcript extraction

#### Apps & Communication
- Launch desktop applications
- Draft emails

#### Security & Network
- Network device scanning
- WiFi password retrieval

#### Visual & Multimodal
- Webcam snapshots
- Screen reading (OCR)

## 🚀 Quick Start

### Prerequisites
1. **Python 3.8+**
2. **Ollama** - [Download here](https://ollama.ai)
3. **Tesseract OCR** (optional, for screen reading)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/yourusername/nirvana-ai.git
cd nirvana-ai

# 2. Install Python dependencies
pip install -r requirements.txt

# 3. Install Ollama and pull the model
ollama pull llama3.1:8b

# 4. Run the application
python app.py

# 5. Open your browser
# Navigate to http://localhost:5000
```

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    USER INTERFACE                        │
│  (Web App - HTML/CSS/JavaScript + Flask Backend)        │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│                  FLASK WEB SERVER                        │
│              (app.py - HTTP API)                         │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│                   AGENT LAYER                            │
│  (agent.py - Orchestrates LLM + Tools)                  │
└────────────┬───────────────────────┬────────────────────┘
             │                       │
             ▼                       ▼
┌────────────────────┐    ┌──────────────────────────────┐
│    LLM LAYER       │    │      TOOLS LAYER             │
│  • Ollama API      │    │  • 17 Different Tools        │
│  • Llama 3.1 8B    │    │  • File/Web/System/Vision    │
└────────────────────┘    └──────────────────────────────┘
```

## 💻 Tech Stack

### Backend
- **Python 3.x** - Core language
- **Flask** - Web framework
- **Ollama** - Local LLM inference
- **Llama 3.1 8B** - Language model

### Frontend
- **HTML5/CSS3/JavaScript** - Pure vanilla, no frameworks
- **Web Speech API** - Voice recognition
- **Speech Synthesis API** - Text-to-speech
- **MediaDevices API** - Camera access

### Key Libraries
- `ollama` - LLM integration
- `flask` - Web server
- `duckduckgo-search` - Web search
- `opencv-python` - Camera/vision
- `pytesseract` - OCR
- `psutil` - System monitoring
- `beautifulsoup4` - Web scraping

## 📁 Project Structure

```
AIVANA/
├── app.py                 # Flask web server
├── main.py                # CLI version
├── requirements.txt       # Python dependencies
├── src/
│   ├── agent.py          # AI agent orchestration
│   ├── llm.py            # LLM interface (Ollama)
│   └── tools.py          # All 17 tools implementation
├── templates/
│   └── index.html        # Web UI
└── static/
    ├── style.css         # Purple theme + animations
    └── script.js         # Frontend logic
```

## 🎯 Usage Examples

### Voice Interaction
```
You: "Nirvana, what's the weather in Mumbai?"
Nirvana: "Mumbai: ⛅️ 28°C, partly cloudy"
```

### File Management
```
You: "Create a Python file called hello.py with a hello world program"
Nirvana: [Creates the file]
```

### Web Search
```
You: "Search for AI trends 2024"
Nirvana: [Returns top 5 search results]
```

### System Control
```
You: "What's my CPU usage?"
Nirvana: "CPU: 45%, RAM: 62%, Battery: 85% (Plugged In)"
```

## 🎨 UI Features

- **Purple/Violet Theme** - Modern, vibrant color scheme
- **Glassmorphism** - Frosted glass aesthetic
- **Smooth Animations** - 60fps transitions and effects
- **Mic Toggle Switch** - Continuous listening mode
- **Logo Pulsing** - Visual feedback when AI speaks
- **Responsive Design** - Works on all screen sizes

## 🔧 Adding Custom Tools

1. Define your function in `src/tools.py`:
```python
def my_custom_tool(param1, param2):
    # Your implementation
    return "Result"
```

2. Add to `AVAILABLE_TOOLS` dictionary:
```python
AVAILABLE_TOOLS = {
    # ... existing tools
    "my_custom_tool": my_custom_tool
}
```

3. Update system prompt in `src/agent.py` to include tool description

## 🔒 Privacy & Security

- **100% Local Execution** - All processing happens on your machine
- **No Data Collection** - Your conversations never leave your device
- **Offline Capable** - Works without internet (except web search)
- **Open Source** - Fully transparent, audit the code yourself

## 🚧 Roadmap

- [ ] Long-term memory system
- [ ] Calendar integration
- [ ] Plugin system for community tools
- [ ] Multi-language UI support
- [ ] Mobile companion app
- [ ] Voice cloning
- [ ] RAG for document Q&A

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Ollama](https://ollama.ai/) - For making local LLMs accessible
- [Meta AI](https://ai.meta.com/llama/) - For Llama 3.1
- [Flask](https://flask.palletsprojects.com/) - For the web framework

## 📧 Contact

For questions or support, please open an issue on GitHub.

---

**Built with ❤️ for privacy-conscious AI enthusiasts**

*Nirvana AI - Because your data should stay yours.*
