import ollama

class LLM:
    def __init__(self, model="llama3.1:8b"):
        self.model = model
    def chat(self, messages):
        """
        Send messages to the LLM and get a response.
        messages: list of dicts with 'role' and 'content'
        """
        try:
            response = ollama.chat(model=self.model, messages=messages)
            return response['message']['content']
        except Exception as e:
            return f"Error communicating with Ollama: {e}"

    def chat_stream(self, messages):
        """
        Stream response from the LLM.
        """
        try:
            stream = ollama.chat(model=self.model, messages=messages, stream=True)
            for chunk in stream:
                yield chunk['message']['content']
        except Exception as e:
            yield f"Error communicating with Ollama: {e}"
