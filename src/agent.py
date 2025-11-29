import json
import re
from .llm import LLM
from .tools import AVAILABLE_TOOLS

SYSTEM_PROMPT = """
You are Nirvana, an advanced AI agent running locally. You are the user's digital butler, researcher, and developer.
You have access to the following tools:

**System & Files**:
1. run_terminal_command(command: str): Execute shell commands.
2. read_file(path: str): Read file content.
3. write_file(path: str, content: str): Write/Create files.
4. list_directory(path: str): List files.
5. organize_files(directory_path: str): Move files into folders by type (Images, Docs, etc).
6. focus_mode(state: str): Turn 'on' (kill distractions) or 'off'.
7. system_health(): Get CPU/RAM/Battery stats.

**Web & Info**:
8. search_web(query: str): Search DuckDuckGo.
9. get_weather(city: str): Get weather.
10. get_morning_briefing(): Get top tech news headlines.
11. get_youtube_transcript(url: str): Get text from a YouTube video.

**Apps & Email**:
12. open_application(app_name: str): Open desktop apps.
13. draft_email(to: str, subject: str, body: str): Open mail client.

**Security**:
14. scan_network(): List devices on local network (ARP scan).
15. get_wifi_password(ssid: str): Get saved wifi password.

**Visual**:
16. security_cam_snapshot(): Take a photo with webcam.
17. read_screen(): Take screenshot and read text (OCR).

**CRITICAL RULES**:
1. **Tool Usage**: To perform ANY action (like creating a file, scanning network, searching web), you **MUST** use a tool.
2. **JSON Format**: You MUST respond with a JSON block strictly in the following format to use a tool:
```json
{
    "tool": "tool_name",
    "args": { "arg_name": "value" }
}
```
3. **ONLY JSON**: When using a tool, output **ONLY** the JSON block. Do NOT write any text before or after it.
4. **No Hallucination**: Do NOT say you have done something unless you have used the tool and received the output.
5. **Wait for Output**: After using a tool, stop and wait for the "Tool Output". Do not make up the output.
6. **Full Output**: When reporting lists (like files, network devices, news), show the FULL list to the user. Do not summarize unless asked.

**Emotions**:
Start response with [HAPPY], [THINKING], [SAD], [SURPRISED], [ANGRY], [NEUTRAL].

**Guidelines**:
- If asked to "Clean my room/folder", use `organize_files`.
- If asked "What's on my screen?", use `read_screen`.
- If asked "Network scan", use `scan_network`.
- If asked "Create a file", use `write_file`.
- If given a YouTube URL, use `get_youtube_transcript`.
- **CRITICAL**: When you receive tool output, show it VERBATIM to the user. Do NOT summarize, paraphrase, or say "the results show...". Just present the actual data.
"""

class Agent:
    def __init__(self):
        self.llm = LLM()
        self.history = [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": "List files in the current directory."},
            {"role": "assistant", "content": '```json\n{\n    "tool": "list_directory",\n    "args": {\n        "path": "."\n    }\n}\n```'},
            {"role": "user", "content": "Tool Output: requirements.txt\nmain.py\nsrc/"},
            {"role": "assistant", "content": "[NEUTRAL] I found requirements.txt, main.py, and the src directory."},
            {"role": "user", "content": "Who is the CEO of OpenAI?"},
            {"role": "assistant", "content": '```json\n{\n    "tool": "search_web",\n    "args": {\n        "query": "CEO of OpenAI"\n    }\n}\n```'},
            {"role": "user", "content": "Tool Output: - Sam Altman is the CEO of OpenAI..."},
            {"role": "assistant", "content": "[NEUTRAL] Sam Altman is the CEO of OpenAI."},
            {"role": "user", "content": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"},
            {"role": "assistant", "content": '```json\n{\n    "tool": "get_youtube_transcript",\n    "args": {\n        "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"\n    }\n}\n```'},
            {"role": "user", "content": "Tool Output: Never gonna give you up, never gonna let you down..."},
            {"role": "assistant", "content": "[NEUTRAL] The video transcript is: Never gonna give you up, never gonna let you down..."}
        ]

    def chat(self, user_input):
        self.history.append({"role": "user", "content": user_input})
        
        while True:
            response_content = ""
            print("Nirvana is thinking...", end="\r")
            
            response_content = self.llm.chat(self.history)
            
            tool_call = self._parse_tool_call(response_content)
            
            if tool_call:
                print(f"\n[Using Tool: {tool_call['tool']}]")
                tool_output = self._execute_tool(tool_call)
                
                self.history.append({"role": "assistant", "content": response_content})
                # Force verbatim output by being very explicit
                self.history.append({"role": "user", "content": f"Tool Output (show this EXACTLY as-is to the user):\n{tool_output}"})
            else:
                self.history.append({"role": "assistant", "content": response_content})
                return response_content

    def chat_with_tools(self, user_input):
        """Chat method that returns tool outputs separately for verbatim display"""
        self.history.append({"role": "user", "content": user_input})
        tool_outputs = []
        
        while True:
            response_content = ""
            print("Nirvana is thinking...", end="\r")
            
            response_content = self.llm.chat(self.history)
            
            tool_call = self._parse_tool_call(response_content)
            
            if tool_call:
                print(f"\n[Using Tool: {tool_call['tool']}]")
                tool_output = self._execute_tool(tool_call)
                tool_outputs.append({
                    'tool': tool_call['tool'],
                    'output': tool_output
                })
                
                self.history.append({"role": "assistant", "content": response_content})
                self.history.append({"role": "user", "content": f"Tool Output: {tool_output}"})
            else:
                self.history.append({"role": "assistant", "content": response_content})
                return response_content, tool_outputs

    def _parse_tool_call(self, content):
        try:
            match = re.search(r'```json\s*(\{.*?\})\s*```', content, re.DOTALL)
            if match: return json.loads(match.group(1))
            match = re.search(r'(\{.*"tool":.*\})', content, re.DOTALL)
            if match: return json.loads(match.group(1))
        except Exception: pass
        return None

    def _execute_tool(self, tool_call):
        tool_name = tool_call.get("tool")
        args = tool_call.get("args", {})
        
        if tool_name in AVAILABLE_TOOLS:
            try:
                return AVAILABLE_TOOLS[tool_name](**args)
            except Exception as e:
                return f"Error executing tool {tool_name}: {e}"
        else:
            return f"Error: Tool '{tool_name}' not found."
