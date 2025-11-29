import sys
from colorama import init, Fore, Style
from src.agent import Agent

# Initialize colorama
init(autoreset=True)

def main():
    print(Fore.CYAN + Style.BRIGHT + "Initializing Nirvana... (Powered by qwen2.5-coder:7b)")
    try:
        agent = Agent()
        print(Fore.GREEN + "Nirvana is online. Type 'exit' to quit.")
    except Exception as e:
        print(Fore.RED + f"Failed to initialize agent: {e}")
        return

    while True:
        try:
            user_input = input(Fore.YELLOW + "\nYou: " + Style.RESET_ALL)
            if user_input.lower() in ['exit', 'quit', 'bye']:
                print(Fore.CYAN + "Nirvana: Goodbye!")
                break
            
            if not user_input.strip():
                continue

            response = agent.chat(user_input)
            
            # Clean up response if it contains the tool call JSON to show only the final text
            # (Optional: depends on how we want to show it. For now, we show what the agent returns)
            # If the agent returns a tool call block as the final message (which shouldn't happen if loop works),
            # we might see it. But the loop in agent.py should handle tool outputs and get a final text response.
            
            print(Fore.CYAN + f"Nirvana: {response}")

        except KeyboardInterrupt:
            print(Fore.CYAN + "\nNirvana: Goodbye!")
            break
        except Exception as e:
            print(Fore.RED + f"An error occurred: {e}")

if __name__ == "__main__":
    main()
