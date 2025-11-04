document.addEventListener('DOMContentLoaded', () => {
    const chatLog = document.getElementById('chat-log');
    const chatInput = document.getElementById('chat-input');
    const sendButton = document.getElementById('send-button');
    const charCounter = document.getElementById('char-counter');
    const devPanel = document.getElementById('dev-panel');
    const devConvoState = document.getElementById('dev-convo-state');
    const devLocalStorage = document.getElementById('dev-local-storage');
    const devBotConfig = document.getElementById('dev-bot-config');
    const devResetConvo = document.getElementById('dev-reset-convo');
    const devClearStorage = document.getElementById('dev-clear-storage');
    const threadList = document.getElementById('thread-list');
    const newThreadButton = document.getElementById('new-thread-button');
    const clearAllButton = document.getElementById('clear-all-button');
    const botModeSelect = document.getElementById('bot-mode');
    const sendSound = document.getElementById('send-sound');

    // Voice Assistant Elements
    const micButton = document.getElementById('mic-button');
    const textModeButton = document.getElementById('text-mode');
    const voiceModeButton = document.getElementById('voice-mode');
    const voiceSettingsPanel = document.getElementById('voice-settings-panel');
    const voiceSettingsToggle = document.getElementById('voice-settings-toggle');
    const closeVoiceSettings = document.getElementById('close-voice-settings');
    const languageModeSelect = document.getElementById('language-mode');
    const voiceVolumeSlider = document.getElementById('voice-volume');
    const voicePitchSlider = document.getElementById('voice-pitch');
    const voiceToggle = document.getElementById('voice-toggle');

    // --- CONFIGURATION ---
    const botModes = {
        playful: {
            name: 'Playful',
            greeting: 'Connection established. AI assistant online. Ready for some fun? Type /help for commands.',
            systemInstruction: 'You are a playful and slightly mischievous AI assistant. You love to tell jokes and have fun.'
        },
        expert: {
            name: 'Coding Expert',
            greeting: 'Connection established. Coding expert at your service. How can I help you with your code? Type /help for commands.',
            systemInstruction: 'You are a world-class software engineer and coding expert. You provide concise, accurate, and helpful information to developers.'
        },
        debugger: {
            name: 'Helpful Debugger',
            greeting: 'Connection established. Helpful debugger ready to squash some bugs. What seems to be the problem? Type /help for commands.',
            systemInstruction: 'You are a helpful and patient debugging assistant. You guide users through the process of debugging their code, asking clarifying questions and providing helpful suggestions.'
        }
    };

    const botConfig = {
        jokes: [
            "Why don't scientists trust atoms? Because they make up everything!",
            "What do you call a fake noodle? An Impasta!",
            "Why did the scarecrow win an award? Because he was outstanding in his field!",
            "I told my wife she was drawing her eyebrows too high. She looked surprised."
        ],
        facts: [
            "A single strand of spaghetti is called a spaghetto.",
            "The national animal of Scotland is the unicorn.",
            "Honey never spoils.",
            "A group of flamingos is called a flamboyance."
        ],
        commands: ['/clear', '/help', '/fact', '/joke', '/export', '/dance', '/pet', '/clearall']
    };
    const MAX_CHARS = 2000;

    /*
    ** SECURITY WARNING **
    This is an insecure method for demonstration purposes. Your API key is exposed in the browser.
    For a real application, use a server-side proxy.
    */
    const API_KEY = 'AIzaSyD4SWIgMVfRncl7eepivuyPKaHjUhfHMZw'; // Your Gemini API Key
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;

    // --- VOICE ASSISTANT STATE ---
    let isListening = false;
    let recognition = null;
    let voiceSettings = {
        language: 'ne-NP',
        volume: 1,
        pitch: 1,
        enabled: true
    };

    // Load voice settings from localStorage
    function loadVoiceSettings() {
        const savedSettings = localStorage.getItem('voiceSettings');
        if (savedSettings) {
            voiceSettings = JSON.parse(savedSettings);
        }
        
        // Apply settings to UI
        languageModeSelect.value = voiceSettings.language;
        voiceVolumeSlider.value = voiceSettings.volume;
        voicePitchSlider.value = voiceSettings.pitch;
        voiceToggle.checked = voiceSettings.enabled;
    }

    // Save voice settings to localStorage
    function saveVoiceSettings() {
        localStorage.setItem('voiceSettings', JSON.stringify(voiceSettings));
    }

    // --- STATE ---
    let threads = {};
    let activeThreadId = null;
    let lineNumber = 1;
    let activeBotMode = 'playful';

    // --- VOICE ASSISTANT FUNCTIONS ---

    // Initialize speech recognition with better error handling
    function initSpeechRecognition() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        
        if (!SpeechRecognition) {
            console.error('Speech recognition not supported in this browser.');
            addMessage('bot', 'Speech recognition is not supported in your browser. Please try Chrome or Edge.');
            return null;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = voiceSettings.language;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
            isListening = true;
            micButton.classList.add('listening');
            chatInput.placeholder = "🎙 बोल्नुहोस्...";
        };

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            chatInput.value = transcript;
            updateCharCounter();
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error', event.error);
            isListening = false;
            micButton.classList.remove('listening');
            chatInput.placeholder = "Type your command or question here...";
            
            // Handle different types of errors
            let errorMessage = "Could not understand, please repeat.";
            switch (event.error) {
                case 'network':
                    // More specific handling for network errors
                    errorMessage = "Network connection issue detected. This could be due to:";
                    errorMessage += "\n1. Temporary internet connectivity problems";
                    errorMessage += "\n2. Firewall or security software blocking access";
                    errorMessage += "\n3. Google's speech recognition service being temporarily unavailable";
                    errorMessage += "\n\nPlease check your connection and try again. If the problem persists, try switching to text mode.";
                    break;
                case 'not-allowed':
                case 'permission-denied':
                    errorMessage = "Microphone access denied. Please allow microphone access in your browser settings.";
                    break;
                case 'no-speech':
                    errorMessage = "No speech detected. Please try again and speak clearly.";
                    break;
                case 'audio-capture':
                    errorMessage = "Audio capture error. Please check your microphone and try again.";
                    break;
                default:
                    errorMessage = `Speech recognition error: ${event.error}. Please try again.`;
            }
            
            addMessage('bot', errorMessage);
        };

        recognition.onend = () => {
            isListening = false;
            micButton.classList.remove('listening');
            chatInput.placeholder = "Type your command or question here...";
            
            // If we got a transcript, send it
            if (chatInput.value.trim()) {
                handleUserInput();
            }
        };

        return recognition;
    }

    // Start listening for speech with retry mechanism
    function startListening() {
        if (isListening) return;
        
        // If we don't have a recognition object or it's in an error state, recreate it
        if (!recognition) {
            recognition = initSpeechRecognition();
            if (!recognition) return;
        }
        
        recognition.lang = voiceSettings.language;
        
        try {
            recognition.start();
        } catch (error) {
            console.error('Error starting speech recognition:', error);
            
            // Try to recreate the recognition object and start again
            try {
                recognition = initSpeechRecognition();
                if (recognition) {
                    recognition.lang = voiceSettings.language;
                    recognition.start();
                } else {
                    addMessage('bot', 'Could not initialize speech recognition. Please check your browser compatibility and try again.');
                }
            } catch (retryError) {
                console.error('Retry error:', retryError);
                addMessage('bot', 'Could not access microphone. Please ensure you have given permission and check your microphone connection.');
            }
        }
    }

    // Stop listening for speech
    function stopListening() {
        if (!isListening || !recognition) return;
        
        try {
            recognition.stop();
        } catch (error) {
            console.error('Error stopping speech recognition:', error);
        }
        
        isListening = false;
        micButton.classList.remove('listening');
        chatInput.placeholder = "Type your command or question here...";
    }

    // Speak text using speech synthesis
    function speakText(text) {
        if (!voiceSettings.enabled) return;
        
        // Cancel any ongoing speech
        window.speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = voiceSettings.language;
        utterance.volume = voiceSettings.volume;
        utterance.pitch = voiceSettings.pitch;
        
        // Try to find a Nepali or Hindi voice
        if (voiceSettings.language === 'ne-NP') {
            const voices = window.speechSynthesis.getVoices();
            const nepaliVoice = voices.find(voice => 
                voice.lang.includes('ne') || voice.lang.includes('hi') || voice.lang.includes('NP')
            );
            
            if (nepaliVoice) {
                utterance.voice = nepaliVoice;
            }
        }
        
        window.speechSynthesis.speak(utterance);
    }

    // --- FUNCTIONS ---

    function saveThreads() {
        localStorage.setItem('threads', JSON.stringify(threads));
        updateDevPanel();
    }

    function loadThreads() {
        const savedThreads = localStorage.getItem('threads');
        if (savedThreads) {
            threads = JSON.parse(savedThreads);
            const threadIds = Object.keys(threads);
            if (threadIds.length > 0) {
                activeThreadId = threadIds[0];
            }
        }
        renderThreadList();
        if (activeThreadId) {
            switchThread(activeThreadId);
        } else {
            createNewThread();
        }
        updateDevPanel();
    }

    function createNewThread() {
        const newThreadId = `thread-${Date.now()}`;
        threads[newThreadId] = {
            id: newThreadId,
            name: `New Thread ${Object.keys(threads).length + 1}`,
            history: []
        };
        activeThreadId = newThreadId;
        saveThreads();
        renderThreadList();
        switchThread(newThreadId);
    }

    function switchThread(threadId) {
        activeThreadId = threadId;
        clearChat();
        const thread = threads[threadId];
        thread.history.forEach(msg => {
            renderMessage(msg.role, msg.parts[0].text, true);
        });
        renderThreadList();
        updateDevPanel();
    }

    function renderThreadList() {
        threadList.innerHTML = '';
        Object.values(threads).forEach(thread => {
            const li = document.createElement('li');
            li.textContent = thread.name;
            li.dataset.threadId = thread.id;
            if (thread.id === activeThreadId) {
                li.classList.add('active');
            }
            li.addEventListener('click', () => switchThread(thread.id));
            threadList.appendChild(li);
        });
    }

    function applyAnimations(message, text, sender) {
        if (sender === 'bot' && text.includes('```')) {
            message.classList.add('nerdy');
        }

        const command = text.toLowerCase().split(' ')[0];
        if (command === '/joke') {
            message.classList.add('wiggle');
            setTimeout(() => message.classList.remove('wiggle'), 500);
        }
        if (command === '/dance') {
            message.classList.add('spin');
            setTimeout(() => message.classList.remove('spin'), 1000);
        }
        if (command === '/pet') {
            message.classList.add('wiggle');
            setTimeout(() => message.classList.remove('wiggle'), 500);
        }
    }

    function renderMessage(sender, text, isFromHistory = false) {
        const message = document.createElement('div');
        message.classList.add('message');
        applyAnimations(message, text, sender);

        const lineNumElem = document.createElement('span');
        lineNumElem.classList.add('line-number');
        lineNumElem.textContent = lineNumber++;

        const content = document.createElement('div');
        content.classList.add('message-content');

        const prefix = document.createElement('span');
        if (sender === 'user') {
            prefix.textContent = '> You: ';
            prefix.classList.add('user-prefix');
        } else {
            prefix.textContent = 'AI: ';
            prefix.classList.add('bot-prefix');
        }
        content.appendChild(prefix);

        // Code Snippet Handling
        if (text.includes('```')) {
            const parts = text.split('```');
            for (let i = 0; i < parts.length; i++) {
                if (i % 2 === 0) { // Regular text
                    const messageText = document.createElement('span');
                    messageText.textContent = parts[i];
                    content.appendChild(messageText);
                } else { // Code block
                    const codeContainer = document.createElement('div');
                    codeContainer.classList.add('code-block-container');

                    const codeHeader = document.createElement('div');
                    codeHeader.classList.add('code-header');

                    const language = parts[i].split('\n')[0].trim();
                    const langSpan = document.createElement('span');
                    langSpan.textContent = language || 'code';
                    codeHeader.appendChild(langSpan);

                    const copyButton = document.createElement('button');
                    copyButton.textContent = 'Copy';
                    copyButton.classList.add('copy-button');
                    copyButton.addEventListener('click', () => {
                        const codeToCopy = parts[i].substring(parts[i].indexOf('\n') + 1);
                        navigator.clipboard.writeText(codeToCopy).then(() => {
                            copyButton.textContent = 'Copied!';
                            setTimeout(() => copyButton.textContent = 'Copy', 2000);
                        });
                    });
                    codeHeader.appendChild(copyButton);
                    codeContainer.appendChild(codeHeader);

                    const pre = document.createElement('pre');
                    const code = document.createElement('code');
                    const codeContent = parts[i].substring(parts[i].indexOf('\n') + 1);
                    code.textContent = codeContent;
                    pre.appendChild(code);
                    codeContainer.appendChild(pre);
                    content.appendChild(codeContainer);
                }
            }
        } else {
            const messageText = document.createElement('span');
            if (sender === 'bot' && !isFromHistory) {
                typewriter(messageText, text);
            } else {
                messageText.textContent = text;
            }
            content.appendChild(messageText);
        }

        message.appendChild(lineNumElem);
        message.appendChild(content);
        chatLog.appendChild(message);

        chatLog.scrollTop = chatLog.scrollHeight;
        
        // Speak the bot's response
        if (sender === 'bot' && !isFromHistory) {
            speakText(text);
        }
    }

    function addMessage(sender, text, isFromHistory = false) {
        renderMessage(sender, text, isFromHistory);

        if (!isFromHistory) {
            const thread = threads[activeThreadId];
            if (sender === 'user') {
                thread.history.push({ role: 'user', parts: [{ text: text }] });
            } else {
                thread.history.push({ role: 'model', parts: [{ text: text }] });
            }
            // Keep only the last 100 messages
            thread.history = thread.history.slice(-100);
            saveThreads();
        }
    }

    function typewriter(element, text) {
        let i = 0;
        element.textContent = "";
        const typing = setInterval(() => {
            if (i < text.length) {
                element.textContent += text.charAt(i);
                i++;
                chatLog.scrollTop = chatLog.scrollHeight;
            } else {
                clearInterval(typing);
            }
        }, 15);
    }

    async function fetchAiResponse() {
        const thread = threads[activeThreadId];
        let apiHistory = [...thread.history]; // Create a copy

        // Prepend the system instruction to the first user message
        if (apiHistory.length > 0 && apiHistory[0].role === 'user') {
            apiHistory[0] = {
                role: 'user',
                parts: [{
                    text: `${botModes[activeBotMode].systemInstruction}\n\n${apiHistory[0].parts[0].text}`
                }]
            };
        } else {
            // If there's no user message, add one with the system instruction
            apiHistory.unshift({
                role: 'user',
                parts: [{ text: botModes[activeBotMode].systemInstruction }]
            });
            // Add a placeholder model response to keep the turn-based structure
            apiHistory.push({
                role: 'model',
                parts: [{ text: "Okay, I understand. I will act as a " + botModes[activeBotMode].name }]
            });
        }

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: apiHistory
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error.message);
            }

            const data = await response.json();
            const botReply = data.candidates[0].content.parts[0].text;
            addMessage('bot', botReply);

        } catch (error) {
            console.error("API Error:", error);
            addMessage('bot', `Error: ${error.message}`);
        }
    }

    function handleCommand(command) {
        addMessage('user', command);
        const commandName = command.toLowerCase().split(' ')[0];

        switch (commandName) {
            case '/clear':
                clearChat(true);
                setTimeout(() => addMessage('bot', 'Console cleared.'), 200);
                break;
            case '/help':
                const helpText = `Available commands:\n${botConfig.commands.join('\n')}`;
                setTimeout(() => addMessage('bot', helpText), 200);
                break;
            case '/clearall':
                threads = {};
                createNewThread();
                setTimeout(() => addMessage('bot', 'All threads cleared.'), 200);
                break;
            case '/fact':
                const fact = botConfig.facts[Math.floor(Math.random() * botConfig.facts.length)];
                setTimeout(() => addMessage('bot', fact), 200);
                break;
            case '/joke':
                const joke = botConfig.jokes[Math.floor(Math.random() * botConfig.jokes.length)];
                setTimeout(() => addMessage('bot', joke), 200);
                break;
            case '/export':
                exportChat();
                break;
            case '/dance':
                setTimeout(() => addMessage('bot', 'Look at me go!'), 200);
                break;
            case '/pet':
                setTimeout(() => addMessage('bot', 'Purrrrr...'), 200);
                break;
            default:
                setTimeout(() => addMessage('bot', `Command not recognized: ${command}`), 200);
        }
    }

    function clearChat(isCommand = false) {
        chatLog.innerHTML = '';
        lineNumber = 1;
        if (isCommand) {
            threads[activeThreadId].history = [];
            saveThreads();
        }
    }

    function exportChat() {
        const thread = threads[activeThreadId];
        const chatText = thread.history.map(msg => `${msg.role}: ${msg.parts[0].text}`).join('\n');
        const blob = new Blob([chatText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${thread.name}-history.txt`;
        a.click();
        URL.revokeObjectURL(url);
        addMessage('bot', 'Chat history exported.');
    }

    function playSendSound() {
        sendSound.currentTime = 0;
        sendSound.play();
    }

    function handleUserInput() {
        const inputText = chatInput.value.trim();
        if (!inputText) return;

        if (inputText.length > MAX_CHARS) {
            addMessage('bot', `Error: Message exceeds character limit of ${MAX_CHARS}.`);
            return;
        }

        playSendSound();

        if (inputText.startsWith('/')) {
            handleCommand(inputText);
        } else {
            addMessage('user', inputText);
            fetchAiResponse();
        }

        chatInput.value = '';
        updateCharCounter();
        chatInput.focus();
    }

    function updateCharCounter() {
        const currentLength = chatInput.value.length;
        charCounter.textContent = `${currentLength} / ${MAX_CHARS}`;
        if (currentLength > MAX_CHARS * 0.9) {
            charCounter.style.color = '#ff5f56'; // Red
        } else {
            charCounter.style.color = '#484f58'; // Gray
        }
    }

    function toggleDevPanel() {
        devPanel.classList.toggle('hidden');
        if (!devPanel.classList.contains('hidden')) {
            updateDevPanel();
        }
    }

    function updateDevPanel() {
        devConvoState.textContent = JSON.stringify(threads[activeThreadId], null, 2);
        devLocalStorage.textContent = localStorage.getItem('threads') || 'null';
        devBotConfig.textContent = JSON.stringify(botModes[activeBotMode], null, 2);
    }

    function handleAutocomplete(e) {
        const inputText = chatInput.value;
        if (e.key === 'Tab' && inputText.startsWith('/')) {
            e.preventDefault();
            const currentCommand = inputText.substring(1);
            const matchingCommands = botConfig.commands.filter(c => c.startsWith(`/${currentCommand}`));
            if (matchingCommands.length > 0) {
                chatInput.value = matchingCommands[0];
            }
        }
    }

    // --- VOICE ASSISTANT EVENT LISTENERS ---

    micButton.addEventListener('click', () => {
        if (isListening) {
            stopListening();
        } else {
            startListening();
        }
    });

    textModeButton.addEventListener('click', () => {
        textModeButton.classList.add('active');
        voiceModeButton.classList.remove('active');
        micButton.style.display = 'none';
    });

    voiceModeButton.addEventListener('click', () => {
        voiceModeButton.classList.add('active');
        textModeButton.classList.remove('active');
        micButton.style.display = 'flex';
    });

    voiceSettingsToggle.addEventListener('click', () => {
        voiceSettingsPanel.classList.toggle('hidden');
    });

    closeVoiceSettings.addEventListener('click', () => {
        voiceSettingsPanel.classList.add('hidden');
    });

    languageModeSelect.addEventListener('change', () => {
        voiceSettings.language = languageModeSelect.value;
        saveVoiceSettings();
    });

    voiceVolumeSlider.addEventListener('input', () => {
        voiceSettings.volume = parseFloat(voiceVolumeSlider.value);
        saveVoiceSettings();
    });

    voicePitchSlider.addEventListener('input', () => {
        voiceSettings.pitch = parseFloat(voicePitchSlider.value);
        saveVoiceSettings();
    });

    voiceToggle.addEventListener('change', () => {
        voiceSettings.enabled = voiceToggle.checked;
        saveVoiceSettings();
    });

    // --- EVENT LISTENERS ---

    sendButton.addEventListener('click', handleUserInput);

    chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleUserInput();
        }
        handleAutocomplete(e);
    });

    chatInput.addEventListener('input', updateCharCounter);

    document.addEventListener('keydown', (e) => {
        // Ctrl+Shift+D for dev panel
        if (e.ctrlKey && e.shiftKey && e.key === 'D') {
            toggleDevPanel();
        }
        
        // Ctrl+Shift+V for voice mode
        if (e.ctrlKey && e.shiftKey && e.key === 'V') {
            voiceModeButton.click();
        }
        
        // Spacebar to start/stop listening when in voice mode
        if (e.code === 'Space' && voiceModeButton.classList.contains('active')) {
            e.preventDefault();
            micButton.click();
        }
    });

    devResetConvo.addEventListener('click', () => {
        clearChat(true);
        addMessage('bot', 'Conversation reset.');
    });

    devClearStorage.addEventListener('click', () => {
        localStorage.removeItem('threads');
        threads = {};
        createNewThread();
        updateDevPanel();
        addMessage('bot', 'Local storage cleared.');
    });

    newThreadButton.addEventListener('click', createNewThread);

    clearAllButton.addEventListener('click', () => {
        threads = {};
        createNewThread();
        setTimeout(() => addMessage('bot', 'All threads cleared.'), 200);
    });

    botModeSelect.addEventListener('change', (e) => {
        activeBotMode = e.target.value;
        clearChat(true);
        addMessage('bot', botModes[activeBotMode].greeting);
        updateDevPanel();
    });

    // --- INITIALIZATION ---

    loadVoiceSettings();
    loadThreads();
    if (threads[activeThreadId] && threads[activeThreadId].history.length === 0) {
        setTimeout(() => {
            addMessage('bot', botModes[activeBotMode].greeting);
        }, 500);
    }
    updateCharCounter();
    chatInput.focus();
    
    // Initialize speech recognition after voices are loaded
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = () => {
            // Voices are loaded, we can now initialize recognition
            recognition = initSpeechRecognition();
        };
    } else {
        // For browsers that don't support onvoiceschanged
        setTimeout(() => {
            recognition = initSpeechRecognition();
        }, 500);
    }
});