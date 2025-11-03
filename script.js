document.addEventListener('DOMContentLoaded', () => {
    const chatLog = document.getElementById('chat-log');
    const chatInput = document.getElementById('chat-input');
    const sendButton = document.getElementById('send-button');
    const charCounter = document.getElementById('char-counter');
    const devPanel = document.getElementById('dev-panel');
    const devConvoState = document.getElementById('dev-convo-state');
    const devLocalStorage = document.getElementById('dev-local-storage');
    const devBotConfig = document.getElementById('dev-bot-config');
    const devActiveMode = document.getElementById('dev-active-mode');
    const devThreadInfo = document.getElementById('dev-thread-info');
    const devResetConvo = document.getElementById('dev-reset-convo');
    const devClearStorage = document.getElementById('dev-clear-storage');
    const devExportAll = document.getElementById('dev-export-all');
    const devImportData = document.getElementById('dev-import-data');
    const threadList = document.getElementById('thread-list');
    const newThreadButton = document.getElementById('new-thread-button');
    const clearAllButton = document.getElementById('clear-all-button');
    const botModeSelect = document.getElementById('bot-mode');
    const sendSound = document.getElementById('send-sound');
    const receiveSound = document.getElementById('receive-sound');
    const soundToggle = document.getElementById('sound-toggle');
    const themeToggle = document.getElementById('theme-toggle');

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
        },
        friendly: {
            name: 'Friendly',
            greeting: 'Hello there! I\'m your friendly AI assistant. How can I help you today? Type /help for commands.',
            systemInstruction: 'You are a friendly and approachable AI assistant. You\'re helpful, kind, and always willing to assist with any questions.'
        },
        coder: {
            name: 'Coder',
            greeting: 'Ready to code! I\'m here to help with programming challenges. Type /help for commands.',
            systemInstruction: 'You are a focused coding assistant. You provide technical solutions, code examples, and programming best practices.'
        },
        helper: {
            name: 'Helper',
            greeting: 'How can I assist you today? I\'m here to help with any questions you might have. Type /help for commands.',
            systemInstruction: 'You are a general-purpose helpful assistant. You provide clear, accurate information on a wide range of topics.'
        },
        debug: {
            name: 'Debug',
            greeting: 'Debug mode activated. I\'ll help you troubleshoot and solve problems. Type /help for commands.',
            systemInstruction: 'You are a specialized debugging assistant. You focus on identifying and solving technical problems with detailed explanations.'
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
        tips: [
            "Remember to always comment your code for future reference!",
            "Use descriptive variable names to make your code more readable.",
            "Test your code frequently to catch bugs early.",
            "Keep your functions small and focused on a single task."
        ],
        commands: ['/clear', '/help', '/fact', '/joke', '/tip', '/export', '/dance', '/pet', '/clearall', '/matrix', '/color']
    };
    const MAX_CHARS = 2000;

    /*
    ** SECURITY WARNING **
    This is an insecure method for demonstration purposes. Your API key is exposed in the browser.
    For a real application, use a server-side proxy.
    */
    const API_KEY = 'AIzaSyD4SWIgMVfRncl7eepivuyPKaHjUhfHMZw'; // Your Gemini API Key
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;

    // --- STATE ---
    let threads = {};
    let activeThreadId = null;
    let lineNumber = 1;
    let activeBotMode = 'playful';
    let userPreferences = {
        theme: 'dark',
        soundEnabled: true,
        autoSave: true
    };

    // --- FUNCTIONS ---

    function saveThreads() {
        localStorage.setItem('threads', JSON.stringify(threads));
        updateDevPanel();
    }

    function savePreferences() {
        localStorage.setItem('userPreferences', JSON.stringify(userPreferences));
        localStorage.setItem('activeBotMode', activeBotMode);
    }

    function loadPreferences() {
        const savedPreferences = localStorage.getItem('userPreferences');
        if (savedPreferences) {
            userPreferences = JSON.parse(savedPreferences);
        }
        
        const savedBotMode = localStorage.getItem('activeBotMode');
        if (savedBotMode && botModes[savedBotMode]) {
            activeBotMode = savedBotMode;
        }
        
        // Apply loaded preferences
        if (soundToggle) {
            soundToggle.textContent = userPreferences.soundEnabled ? '🔊' : '🔇';
        }
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
            li.dataset.threadId = thread.id;
            if (thread.id === activeThreadId) {
                li.classList.add('active');
            }
            
            // Create thread content container
            const threadContent = document.createElement('div');
            threadContent.classList.add('thread-content');
            threadContent.textContent = thread.name;
            threadContent.addEventListener('click', () => switchThread(thread.id));
            
            // Create thread controls
            const threadControls = document.createElement('div');
            threadControls.classList.add('thread-controls');
            
            // Rename button
            const renameButton = document.createElement('button');
            renameButton.textContent = '✏️';
            renameButton.classList.add('thread-control-btn');
            renameButton.title = 'Rename thread';
            renameButton.addEventListener('click', (e) => {
                e.stopPropagation();
                const newName = prompt('Enter new name for thread:', thread.name);
                if (newName && newName.trim() !== '') {
                    thread.name = newName.trim();
                    saveThreads();
                    renderThreadList();
                }
            });
            
            // Delete button
            const deleteButton = document.createElement('button');
            deleteButton.textContent = '🗑️';
            deleteButton.classList.add('thread-control-btn');
            deleteButton.title = 'Delete thread';
            deleteButton.addEventListener('click', (e) => {
                e.stopPropagation();
                if (confirm(`Are you sure you want to delete "${thread.name}"?`)) {
                    delete threads[thread.id];
                    if (activeThreadId === thread.id) {
                        // Switch to another thread or create new one
                        const threadIds = Object.keys(threads);
                        if (threadIds.length > 0) {
                            switchThread(threadIds[0]);
                        } else {
                            createNewThread();
                        }
                    }
                    saveThreads();
                    renderThreadList();
                }
            });
            
            // Export button
            const exportButton = document.createElement('button');
            exportButton.textContent = '📤';
            exportButton.classList.add('thread-control-btn');
            exportButton.title = 'Export thread';
            exportButton.addEventListener('click', (e) => {
                e.stopPropagation();
                exportThread(thread.id);
            });
            
            threadControls.appendChild(renameButton);
            threadControls.appendChild(deleteButton);
            threadControls.appendChild(exportButton);
            
            li.appendChild(threadContent);
            li.appendChild(threadControls);
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
        if (command === '/matrix') {
            message.classList.add('matrix');
            setTimeout(() => message.classList.remove('matrix'), 5000);
        }
    }

    function renderMessage(sender, text, isFromHistory = false) {
        // Use document fragment for better performance
        const fragment = document.createDocumentFragment();
        
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
            prefix.setAttribute('aria-label', 'User message');
        } else {
            prefix.textContent = 'AI: ';
            prefix.classList.add('bot-prefix');
            prefix.setAttribute('aria-label', 'AI message');
        }
        content.appendChild(prefix);

        // Add timestamp
        const timestamp = document.createElement('span');
        timestamp.classList.add('timestamp');
        const now = new Date();
        timestamp.textContent = ` [${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}]`;
        timestamp.setAttribute('aria-label', `Message sent at ${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`);
        content.appendChild(timestamp);

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
                    codeContainer.setAttribute('role', 'region');
                    codeContainer.setAttribute('aria-label', 'Code block');

                    const codeHeader = document.createElement('div');
                    codeHeader.classList.add('code-header');

                    // Extract language if specified
                    const lines = parts[i].split('\n');
                    const language = lines[0].trim();
                    const codeContent = lines.slice(1).join('\n');
                    
                    const langSpan = document.createElement('span');
                    langSpan.textContent = language || 'code';
                    langSpan.setAttribute('aria-label', `Code language: ${language || 'unknown'}`);
                    codeHeader.appendChild(langSpan);

                    // Theme toggle button
                    const themeToggle = document.createElement('button');
                    themeToggle.textContent = '◐';
                    themeToggle.classList.add('code-theme-toggle');
                    themeToggle.title = 'Toggle theme';
                    themeToggle.setAttribute('aria-label', 'Toggle code block theme');
                    themeToggle.addEventListener('click', () => {
                        codeContainer.classList.toggle('light-theme');
                        themeToggle.textContent = codeContainer.classList.contains('light-theme') ? '◑' : '◐';
                    });
                    codeHeader.appendChild(themeToggle);

                    const copyButton = document.createElement('button');
                    copyButton.textContent = 'Copy';
                    copyButton.classList.add('copy-button');
                    copyButton.setAttribute('aria-label', 'Copy code to clipboard');
                    copyButton.addEventListener('click', () => {
                        navigator.clipboard.writeText(codeContent).then(() => {
                            copyButton.textContent = 'Copied!';
                            setTimeout(() => copyButton.textContent = 'Copy', 2000);
                        });
                    });
                    codeHeader.appendChild(copyButton);
                    codeContainer.appendChild(codeHeader);

                    const pre = document.createElement('pre');
                    pre.setAttribute('aria-label', 'Code content');
                    const code = document.createElement('code');
                    code.textContent = codeContent;
                    
                    // Apply basic syntax highlighting
                    if (language === 'javascript' || language === 'js') {
                        code.innerHTML = highlightJavaScript(codeContent);
                    } else if (language === 'html') {
                        code.innerHTML = highlightHTML(codeContent);
                    } else if (language === 'css') {
                        code.innerHTML = highlightCSS(codeContent);
                    } else {
                        code.textContent = codeContent;
                    }
                    
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
        fragment.appendChild(message);
        
        chatLog.appendChild(fragment);

        // Scroll with debouncing for performance
        requestAnimationFrame(() => {
            chatLog.scrollTop = chatLog.scrollHeight;
        });
    }

    // Debounced scroll function for performance
    const debouncedScroll = (() => {
        let timeout;
        return function() {
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                chatLog.scrollTop = chatLog.scrollHeight;
            }, 10);
        };
    })();

    // Throttled update function for character counter
    const throttledUpdateCounter = (() => {
        let timeout;
        return function() {
            clearTimeout(timeout);
            timeout = setTimeout(updateCharCounter, 100);
        };
    })();

    function showTypingIndicator() {
        // Remove any existing typing indicators
        const existingIndicator = document.querySelector('.typing-indicator');
        if (existingIndicator) {
            existingIndicator.remove();
        }
        
        const typingIndicator = document.createElement('div');
        typingIndicator.classList.add('typing-indicator');
        typingIndicator.classList.add('visible');
        
        const lineNumElem = document.createElement('span');
        lineNumElem.classList.add('line-number');
        lineNumElem.textContent = lineNumber++;
        
        const content = document.createElement('div');
        content.classList.add('message-content');
        
        const prefix = document.createElement('span');
        prefix.textContent = 'AI: ';
        prefix.classList.add('bot-prefix');
        content.appendChild(prefix);
        
        const dotsContainer = document.createElement('span');
        for (let i = 0; i < 3; i++) {
            const dot = document.createElement('span');
            dot.classList.add('dot');
            dotsContainer.appendChild(dot);
        }
        content.appendChild(dotsContainer);
        
        typingIndicator.appendChild(lineNumElem);
        typingIndicator.appendChild(content);
        chatLog.appendChild(typingIndicator);
        
        chatLog.scrollTop = chatLog.scrollHeight;
        
        return typingIndicator;
    }

    function hideTypingIndicator(indicator) {
        if (indicator) {
            indicator.classList.remove('visible');
            setTimeout(() => {
                if (indicator.parentNode) {
                    indicator.parentNode.removeChild(indicator);
                }
            }, 300);
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
        
        // Show typing indicator
        const typingIndicator = showTypingIndicator();

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
            
            // Hide typing indicator and add message
            hideTypingIndicator(typingIndicator);
            addMessage('bot', botReply);

        } catch (error) {
            console.error("API Error:", error);
            hideTypingIndicator(typingIndicator);
            addMessage('bot', `Error: ${error.message}`);
        }
    }

    // Simple syntax highlighting functions
    function highlightJavaScript(code) {
        // Basic JavaScript syntax highlighting
        return code
            .replace(/(\/\/.*)/g, '<span class="code-comment">$1</span>')
            .replace(/(\b(function|var|let|const|if|else|for|while|do|break|continue|return|switch|case|default|try|catch|finally|throw|new|this|typeof|instanceof|in|of|await|async|class|extends|super|import|export|from|as)\b)/g, '<span class="code-keyword">$1</span>')
            .replace(/(\b(true|false|null|undefined|NaN|Infinity)\b)/g, '<span class="code-keyword">$1</span>')
            .replace(/(\b(console|window|document|JSON|Math|Date|Array|Object|String|Number|Boolean|RegExp|Error|Promise)\b)/g, '<span class="code-function">$1</span>')
            .replace(/(".*?"|'.*?'|`.*?`)/g, '<span class="code-string">$1</span>')
            .replace(/\b(\d+(?:\.\d+)?)\b/g, '<span class="code-number">$1</span>')
            .replace(/([{}()\[\];,.])/g, '<span class="code-punctuation">$1</span>')
            .replace(/([+\-*/%=<>!&|?:])/g, '<span class="code-operator">$1</span>');
    }

    function highlightHTML(code) {
        // Basic HTML syntax highlighting
        return code
            .replace(/(&lt;!--[\s\S]*?--&gt;)/g, '<span class="code-comment">$1</span>')
            .replace(/(&lt;\/?[a-zA-Z0-9\-]+)/g, '<span class="code-keyword">$1</span>')
            .replace(/([a-zA-Z\-]+=)/g, '<span class="code-function">$1</span>')
            .replace(/(".*?"|'.*?')/g, '<span class="code-string">$1</span>')
            .replace(/(&gt;)/g, '<span class="code-punctuation">$1</span>');
    }

    function highlightCSS(code) {
        // Basic CSS syntax highlighting
        return code
            .replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="code-comment">$1</span>')
            .replace(/([a-zA-Z\-]+)(?=\s*:)/g, '<span class="code-function">$1</span>')
            .replace(/(#?[a-zA-Z\-]+)(?=\s*{)/g, '<span class="code-keyword">$1</span>')
            .replace(/(:\s*[^;]+;?)/g, '<span class="code-string">$1</span>')
            .replace(/([{}])/g, '<span class="code-punctuation">$1</span>');
    }

    function addMessage(sender, text, isFromHistory = false) {
        renderMessage(sender, text, isFromHistory);

        if (!isFromHistory) {
            const thread = threads[activeThreadId];
            if (sender === 'user') {
                thread.history.push({ role: 'user', parts: [{ text: text }] });
            } else {
                thread.history.push({ role: 'model', parts: [{ text: text }] });
                // Play receive sound for bot messages
                playReceiveSound();
            }
            // Keep only the last 100 messages
            thread.history = thread.history.slice(-100);
            saveThreads();
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
            case '/tip':
                const tip = botConfig.tips[Math.floor(Math.random() * botConfig.tips.length)];
                setTimeout(() => addMessage('bot', tip), 200);
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
            case '/matrix':
                // Trigger matrix effect
                triggerMatrixEffect();
                setTimeout(() => addMessage('bot', 'Entering the Matrix...'), 200);
                break;
            case '/color':
                // Change theme colors
                changeThemeColors();
                setTimeout(() => addMessage('bot', 'Theme colors changed!'), 200);
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

    function exportThread(threadId) {
        const thread = threads[threadId];
        if (!thread) return;
        
        const chatText = thread.history.map(msg => `${msg.role}: ${msg.parts[0].text}`).join('\n');
        const blob = new Blob([chatText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${thread.name}-history.txt`;
        a.click();
        URL.revokeObjectURL(url);
        
        // Show confirmation message
        if (threadId === activeThreadId) {
            addMessage('bot', `Thread "${thread.name}" exported.`);
        }
    }

    function exportChat() {
        const thread = threads[activeThreadId];
        const chatText = thread.history.map(msg => `${msg.role}: ${msg.parts[0].text}`).join('\n');
        
        // Offer both JSON and TXT export options
        const exportFormat = prompt('Export format:\n1. Text (.txt)\n2. JSON (.json)\nEnter 1 or 2:', '1');
        
        if (exportFormat === '1') {
            const blob = new Blob([chatText], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${thread.name}-history.txt`;
            a.click();
            URL.revokeObjectURL(url);
            addMessage('bot', 'Chat history exported as text.');
        } else if (exportFormat === '2') {
            const jsonData = {
                threadId: thread.id,
                threadName: thread.name,
                history: thread.history,
                exportDate: new Date().toISOString()
            };
            const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${thread.name}-history.json`;
            a.click();
            URL.revokeObjectURL(url);
            addMessage('bot', 'Chat history exported as JSON.');
        } else {
            addMessage('bot', 'Export cancelled.');
        }
    }

    function playSendSound() {
        sendSound.currentTime = 0;
        sendSound.play();
    }

    function playReceiveSound() {
        if (userPreferences.soundEnabled) {
            receiveSound.currentTime = 0;
            receiveSound.play();
        }
    }

    function handleUserInput() {
        const inputText = chatInput.value.trim();
        if (!inputText) return;

        if (inputText.length > MAX_CHARS) {
            addMessage('bot', `Error: Message exceeds character limit of ${MAX_CHARS}.`);
            return;
        }

        if (userPreferences.soundEnabled) {
            playSendSound();
        }

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
        devActiveMode.textContent = JSON.stringify({
            mode: activeBotMode,
            name: botModes[activeBotMode].name,
            greeting: botModes[activeBotMode].greeting
        }, null, 2);
        devThreadInfo.textContent = JSON.stringify({
            totalThreads: Object.keys(threads).length,
            activeThreadId: activeThreadId,
            activeThreadName: threads[activeThreadId] ? threads[activeThreadId].name : 'None',
            messagesInActiveThread: threads[activeThreadId] ? threads[activeThreadId].history.length : 0
        }, null, 2);
    }

    function handleAutocomplete(e) {
        const inputText = chatInput.value;
        
        // Command autocomplete with dropdown
        if (inputText.startsWith('/') && e.key !== 'Enter' && e.key !== 'Tab') {
            showCommandAutocomplete(inputText);
        } else if (!inputText.startsWith('/')) {
            hideCommandAutocomplete();
        }
        
        // Tab completion for commands
        if (e.key === 'Tab' && inputText.startsWith('/')) {
            e.preventDefault();
            const currentCommand = inputText.substring(1);
            const matchingCommands = botConfig.commands.filter(c => c.startsWith(`/${currentCommand}`));
            if (matchingCommands.length > 0) {
                chatInput.value = matchingCommands[0];
                hideCommandAutocomplete();
            }
        }
        
        // Emoji autocomplete (:smile: -> 😄)
        if (e.key === ':' && inputText.includes(':')) {
            const textBeforeCursor = inputText.substring(0, chatInput.selectionStart);
            const lastColonIndex = textBeforeCursor.lastIndexOf(':');
            if (lastColonIndex >= 0) {
                const emojiQuery = textBeforeCursor.substring(lastColonIndex + 1);
                if (emojiQuery.length > 1) {
                    showEmojiAutocomplete(emojiQuery, lastColonIndex);
                }
            }
        }
    }

    // Show command autocomplete dropdown
    function showCommandAutocomplete(inputText) {
        const currentCommand = inputText.substring(1);
        const matchingCommands = botConfig.commands.filter(c => 
            c.startsWith(`/${currentCommand}`) && c.length > currentCommand.length + 1
        );
        
        if (matchingCommands.length > 0) {
            // Create or update autocomplete dropdown
            let autocompleteDropdown = document.getElementById('autocomplete-dropdown');
            if (!autocompleteDropdown) {
                autocompleteDropdown = document.createElement('div');
                autocompleteDropdown.id = 'autocomplete-dropdown';
                autocompleteDropdown.classList.add('autocomplete-dropdown');
                chatInput.parentNode.appendChild(autocompleteDropdown);
            }
            
            autocompleteDropdown.innerHTML = '';
            matchingCommands.slice(0, 5).forEach(cmd => {
                const item = document.createElement('div');
                item.classList.add('autocomplete-item');
                item.textContent = cmd;
                item.addEventListener('click', () => {
                    chatInput.value = cmd;
                    hideCommandAutocomplete();
                    chatInput.focus();
                });
                autocompleteDropdown.appendChild(item);
            });
            
            autocompleteDropdown.style.display = 'block';
        } else {
            hideCommandAutocomplete();
        }
    }

    // Hide command autocomplete dropdown
    function hideCommandAutocomplete() {
        const autocompleteDropdown = document.getElementById('autocomplete-dropdown');
        if (autocompleteDropdown) {
            autocompleteDropdown.style.display = 'none';
        }
    }

    // Show emoji autocomplete
    function showEmojiAutocomplete(query, position) {
        // Simple emoji mapping for common emojis
        const emojiMap = {
            'smile': '😄',
            'laugh': '😂',
            'heart': '❤️',
            'thumbsup': '👍',
            'thumbsdown': '👎',
            'fire': '🔥',
            'star': '⭐',
            'check': '✅',
            'cross': '❌',
            'question': '❓',
            'exclamation': '❗',
            'cool': '😎',
            'cry': '😢',
            'angry': '😠',
            'sunglasses': '😎',
            'robot': '🤖',
            'computer': '💻',
            'coffee': '☕',
            'beer': '🍺',
            'pizza': '🍕'
        };
        
        const matchingEmojis = Object.keys(emojiMap)
            .filter(key => key.startsWith(query.toLowerCase()))
            .map(key => ({ name: key, emoji: emojiMap[key] }));
        
        if (matchingEmojis.length > 0) {
            // Create or update emoji autocomplete dropdown
            let emojiDropdown = document.getElementById('emoji-dropdown');
            if (!emojiDropdown) {
                emojiDropdown = document.createElement('div');
                emojiDropdown.id = 'emoji-dropdown';
                emojiDropdown.classList.add('autocomplete-dropdown');
                chatInput.parentNode.appendChild(emojiDropdown);
            }
            
            emojiDropdown.innerHTML = '';
            matchingEmojis.slice(0, 5).forEach(item => {
                const emojiItem = document.createElement('div');
                emojiItem.classList.add('autocomplete-item');
                emojiItem.innerHTML = `${item.emoji} :${item.name}`;
                emojiItem.addEventListener('click', () => {
                    const currentValue = chatInput.value;
                    const newValue = currentValue.substring(0, position) + 
                                     item.emoji + 
                                     currentValue.substring(chatInput.selectionStart);
                    chatInput.value = newValue;
                    hideEmojiAutocomplete();
                    chatInput.focus();
                });
                emojiDropdown.appendChild(emojiItem);
            });
            
            // Position the dropdown near the cursor
            const rect = chatInput.getBoundingClientRect();
            emojiDropdown.style.top = `${rect.bottom + window.scrollY}px`;
            emojiDropdown.style.left = `${rect.left + window.scrollX}px`;
            emojiDropdown.style.display = 'block';
        } else {
            hideEmojiAutocomplete();
        }
    }

    // Hide emoji autocomplete dropdown
    function hideEmojiAutocomplete() {
        const emojiDropdown = document.getElementById('emoji-dropdown');
        if (emojiDropdown) {
            emojiDropdown.style.display = 'none';
        }
    }

    // Hide all autocomplete dropdowns when clicking elsewhere
    document.addEventListener('click', (e) => {
        if (e.target !== chatInput) {
            hideCommandAutocomplete();
            hideEmojiAutocomplete();
        }
    });

    // --- EVENT LISTENERS ---

    sendButton.addEventListener('click', handleUserInput);

    chatInput.addEventListener('keydown', (e) => {
        // Shift + Enter for new line
        if (e.key === 'Enter' && e.shiftKey) {
            // Allow default behavior (new line)
            return;
        }
        
        // Enter to send message
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleUserInput();
        }
        
        // Handle autocomplete
        handleAutocomplete(e);
    });

    chatInput.addEventListener('input', throttledUpdateCounter);

    document.addEventListener('keydown', (e) => {
        // Ctrl + L to clear chat
        if (e.ctrlKey && e.key === 'l') {
            e.preventDefault();
            clearChat(true);
            addMessage('bot', 'Console cleared with Ctrl+L.');
        }
        
        // Ctrl + Shift + D to toggle dev panel
        if (e.ctrlKey && e.shiftKey && e.key === 'D') {
            toggleDevPanel();
        }
        
        // Quick mode switching with Ctrl + M + first letter of mode
        if (e.ctrlKey && e.key === 'm') {
            // We'll handle this in the keyup event to capture the next key
            document.addEventListener('keyup', handleModeSwitch, { once: true });
        }
    });
    
    function handleModeSwitch(e) {
        const modeMap = {
            'p': 'playful',
            'e': 'expert',
            'd': 'debugger',
            'f': 'friendly',
            'c': 'coder',
            'h': 'helper',
            'b': 'debug'
        };
        
        if (modeMap[e.key]) {
            e.preventDefault();
            activeBotMode = modeMap[e.key];
            botModeSelect.value = activeBotMode;
            clearChat(true);
            addMessage('bot', `Switched to ${botModes[activeBotMode].name} mode.`);
            updateDevPanel();
        }
    }

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

    devExportAll.addEventListener('click', () => {
        const allData = {
            threads: threads,
            exportDate: new Date().toISOString(),
            botMode: activeBotMode
        };
        const blob = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `chatbot-all-data-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
        addMessage('bot', 'All data exported.');
    });

    devImportData.addEventListener('click', () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = e => {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = event => {
                try {
                    const data = JSON.parse(event.target.result);
                    if (data.threads) {
                        threads = data.threads;
                        if (data.botMode && botModes[data.botMode]) {
                            activeBotMode = data.botMode;
                            botModeSelect.value = activeBotMode;
                        }
                        saveThreads();
                        renderThreadList();
                        if (activeThreadId && threads[activeThreadId]) {
                            switchThread(activeThreadId);
                        } else {
                            createNewThread();
                        }
                        updateDevPanel();
                        addMessage('bot', 'Data imported successfully.');
                    } else {
                        addMessage('bot', 'Invalid data format.');
                    }
                } catch (error) {
                    addMessage('bot', 'Error importing data: ' + error.message);
                }
            };
            reader.readAsText(file);
        };
        input.click();
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
        savePreferences(); // Save the preference
    });

    soundToggle.addEventListener('click', () => {
        userPreferences.soundEnabled = !userPreferences.soundEnabled;
        soundToggle.textContent = userPreferences.soundEnabled ? '🔊' : '🔇';
        savePreferences();
    });

    themeToggle.addEventListener('click', () => {
        userPreferences.theme = userPreferences.theme === 'dark' ? 'light' : 'dark';
        themeToggle.textContent = userPreferences.theme === 'dark' ? '🌙' : '☀️';
        document.body.className = userPreferences.theme;
        savePreferences();
    });

    // --- INITIALIZATION ---

    loadPreferences(); // Load preferences first
    loadThreads();
    if (threads[activeThreadId] && threads[activeThreadId].history.length === 0) {
        setTimeout(() => {
            addMessage('bot', botModes[activeBotMode].greeting);
        }, 500);
    }
    updateCharCounter();
    chatInput.focus();
    
    // Set the bot mode select to the loaded value
    botModeSelect.value = activeBotMode;
});
