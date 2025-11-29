from flask import Flask, render_template, request, jsonify
from src.agent import Agent

app = Flask(__name__)
agent = Agent()

@app.route('/')
def home():
    return render_template('index.html')

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
    app.run(debug=True, port=5000)
