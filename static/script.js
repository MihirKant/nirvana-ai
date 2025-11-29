document.addEventListener('DOMContentLoaded', () => {
    const chatContainer = document.getElementById('chat-container');
    const userInput = document.getElementById('user-input');
    const sendBtn = document.getElementById('send-btn');
    const micToggle = document.getElementById('mic-toggle');
    const cameraBtn = document.getElementById('camera-btn');
    const videoContainer = document.getElementById('video-container');
    const userVideo = document.getElementById('user-video');
    const logo = document.querySelector('.logo');

    let micEnabled = false;

    // --- Speech Recognition Setup ---
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    let recognition = null;
    if (SpeechRecognition) {
        recognition = new SpeechRecognition();
        recognition.continuous = true; // Changed to continuous for toggle behavior
        recognition.lang = 'en-US';

        recognition.onstart = () => {
            micToggle.classList.add('listening');
            userInput.placeholder = "Listening...";
        };

        recognition.onend = () => {
            micToggle.classList.remove('listening');
            if (micEnabled) {
                // Restart if mic is still enabled
                try {
                    recognition.start();
                } catch (e) {
                    console.log('Recognition restart failed:', e);
                }
            } else {
                userInput.placeholder = "Type a message...";
            }
        };

        recognition.onerror = (event) => {
            console.error("Speech recognition error", event.error);
            if (event.error === 'no-speech') {
                // Ignore no-speech errors in continuous mode
                return;
            }
            micToggle.classList.remove('listening');
            userInput.placeholder = "Error: " + event.error;
            setTimeout(() => { userInput.placeholder = "Type a message..."; }, 3000);
        };

        recognition.onresult = (event) => {
            const transcript = event.results[event.results.length - 1][0].transcript;
            userInput.value = transcript;
            sendMessage(); // Auto-send on voice input
        };
    } else {
        micToggle.style.display = 'none'; // Hide if not supported
        console.log("Speech Recognition not supported");
        alert("Speech Recognition is not supported in this browser. Try Chrome.");
    }

    // --- Camera Setup ---
    let stream = null;
    cameraBtn.addEventListener('click', async () => {
        if (videoContainer.classList.contains('hidden')) {
            // Start Camera
            try {
                // Request camera with specific constraints
                stream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        width: { ideal: 640 },
                        height: { ideal: 480 },
                        facingMode: "user"
                    }
                });
                userVideo.srcObject = stream;

                // Wait for video to be ready
                userVideo.onloadedmetadata = () => {
                    userVideo.play();
                };

                videoContainer.classList.remove('hidden');
                cameraBtn.classList.add('active');
            } catch (err) {
                console.error("Camera error:", err);
                alert("Could not access camera: " + err.message + "\n\nMake sure:\n1. Camera is not in use by another app\n2. You granted permission\n3. Camera drivers are working");
            }
        } else {
            // Stop Camera
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
                stream = null;
            }
            userVideo.srcObject = null;
            videoContainer.classList.add('hidden');
            cameraBtn.classList.remove('active');
        }
    });

    // Mic Toggle Handler
    micToggle.addEventListener('click', () => {
        if (!recognition) return;

        micEnabled = !micEnabled;

        if (micEnabled) {
            micToggle.classList.add('active');
            try {
                recognition.start();
            } catch (e) {
                console.log('Recognition already started');
            }
        } else {
            micToggle.classList.remove('active', 'listening');
            try {
                recognition.stop();
            } catch (e) {
                console.log('Recognition already stopped');
            }
            userInput.placeholder = "Type a message...";
        }
    });

    // --- Chat Logic ---

    function appendMessage(text, sender, emotion = 'neutral') {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', sender);

        const contentDiv = document.createElement('div');
        contentDiv.classList.add('content');

        // Apply emotion color if AI
        if (sender === 'ai') {
            updateEmotionUI(emotion);
            contentDiv.style.borderLeftColor = `var(--emotion-${emotion})`;
        }

        contentDiv.textContent = text;

        messageDiv.appendChild(contentDiv);
        chatContainer.appendChild(messageDiv);
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    function updateEmotionUI(emotion) {
        const root = document.documentElement;
        let color = 'var(--emotion-neutral)';

        switch (emotion.toLowerCase()) {
            case 'happy': color = 'var(--emotion-happy)'; break;
            case 'sad': color = 'var(--emotion-sad)'; break;
            case 'angry': color = 'var(--emotion-angry)'; break;
            case 'surprised': color = 'var(--emotion-surprised)'; break;
            case 'thinking': color = 'var(--emotion-thinking)'; break;
            default: color = 'var(--emotion-neutral)';
        }

        root.style.setProperty('--accent-color', color);
    }

    function speak(text) {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            // Try to find a good voice
            const voices = window.speechSynthesis.getVoices();
            const preferredVoice = voices.find(v => v.name.includes('Google US English') || v.name.includes('Microsoft David'));
            if (preferredVoice) utterance.voice = preferredVoice;

            // Add logo pulsing animation when speaking
            utterance.onstart = () => {
                logo.classList.add('speaking');
            };

            utterance.onend = () => {
                logo.classList.remove('speaking');
            };

            window.speechSynthesis.speak(utterance);
        }
    }

    async function sendMessage() {
        const text = userInput.value.trim();
        if (!text) return;

        // Disable input
        userInput.value = '';
        userInput.disabled = true;
        sendBtn.disabled = true;

        appendMessage(text, 'user');

        try {
            const response = await fetch('/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ message: text })
            });

            const data = await response.json();

            if (data.error) {
                appendMessage(`Error: ${data.error}`, 'system');
            } else {
                // Display tool outputs verbatim first
                if (data.tool_outputs && data.tool_outputs.length > 0) {
                    data.tool_outputs.forEach(toolResult => {
                        // Show tool output in a code-like format
                        appendMessage(`[${toolResult.tool}]\n${toolResult.output}`, 'system');
                    });
                }

                // Parse emotion from response
                // Format: "[EMOTION] Message..."
                let aiText = data.response;
                let emotion = 'neutral';

                const emotionMatch = aiText.match(/^\[(HAPPY|SAD|ANGRY|SURPRISED|THINKING|NEUTRAL)\]\s*(.*)/i);
                if (emotionMatch) {
                    emotion = emotionMatch[1].toLowerCase();
                    aiText = emotionMatch[2];
                }

                appendMessage(aiText, 'ai', emotion);
                speak(aiText);
            }
        } catch (err) {
            appendMessage(`Connection Error: ${err.message}`, 'system');
        } finally {
            userInput.disabled = false;
            sendBtn.disabled = false;
            userInput.focus();
        }
    }

    sendBtn.addEventListener('click', sendMessage);

    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
});
