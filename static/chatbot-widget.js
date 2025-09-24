(function() {
    'use strict';

    // Configuration
    const CONFIG = {
        apiUrl: 'http://localhost:5001', // Updated to correct port
        widgetId: 'ai-chatbot-widget',
        position: 'bottom-right', // bottom-right, bottom-left, top-right, top-left
        theme: 'default', // default, dark, light
        primaryColor: '#374151', // default grey
        secondaryColor: '#1f2937', // darker grey
        speechInput: true,
        textToSpeech: true,
        authToken: null,
        username: null,
        companyConfig: null,
        botId: null
    };

    // Load company configuration
    async function loadCompanyConfig() {
        try {
            const username = detectUsername();
            detectApiUrl();
            if (!username) return;
            
            const response = await fetch(`${CONFIG.apiUrl}/get_company_config?username=${encodeURIComponent(username)}`);
            const data = await response.json();
            
            if (data.success && data.config) {
                CONFIG.companyConfig = data.config;
                
                // Update colors based on company config
                if (data.config.primaryColor) {
                    CONFIG.primaryColor = data.config.primaryColor;
                }
                
                // Update widget appearance
                updateWidgetTheme();

                // Add custom welcome message if provided
                try {
                    const welcome = String(data.config.welcomeMessage || '').trim();
                    if (welcome) {
                        // Only add if no messages yet
                        const chatMessages = document.getElementById('chat-messages');
                        if (chatMessages && chatMessages.children.length === 0) {
                            addMessage(welcome, false);
                        }
                    }
                } catch(_) {}
            }
        } catch (error) {
            console.log('Could not load company config:', error);
        }
    }
    
    // Resolve asset URL (handle relative paths like /assets/... when embedded cross-origin)
    function resolveAssetUrl(url) {
        try {
            if (!url) return '';
            const u = String(url).trim();
            if (u.startsWith('http://') || u.startsWith('https://') || u.startsWith('data:')) return u;
            if (u.startsWith('//')) return (window.location.protocol === 'https:' ? 'https:' : 'http:') + u;
            // Treat as relative to API base
            const base = String(CONFIG.apiUrl || '').replace(/\/$/, '');
            const path = u.startsWith('/') ? u : '/' + u;
            return base + path;
        } catch(_) { return url; }
    }

    // Update widget theme based on company configuration
    function updateWidgetTheme() {
        if (!CONFIG.companyConfig) return;
        
        const config = CONFIG.companyConfig;
        
        // Update header text
        const headerTitle = document.querySelector(`#${CONFIG.widgetId} .chat-header h3`);
        if (headerTitle && config.companyName) {
            headerTitle.textContent = `${config.companyName} Assistant`;
        }
        // Update header subtitle
        const headerSubtitle = document.querySelector(`#${CONFIG.widgetId} .chat-header p`);
        if (headerSubtitle && config.companyDescription) {
            headerSubtitle.textContent = config.companyDescription.substring(0, 100) + (config.companyDescription.length > 100 ? '...' : '');
        }
        // Update brand logo
        const brandLogo = document.getElementById('brand-logo');
        if (brandLogo) {
            brandLogo.innerHTML = '';
            if (config.avatarUrl) {
                const img = document.createElement('img');
                img.src = resolveAssetUrl(config.avatarUrl); img.alt = 'logo';
                brandLogo.appendChild(img);
            }
        }
        
        // Update colors in CSS
        updateWidgetColors();
    }
    
    // Update widget colors dynamically
    function updateWidgetColors() {
        const style = document.querySelector(`#${CONFIG.widgetId}-dynamic-styles`);
        if (style) style.remove();
        
        const dynamicStyle = document.createElement('style');
        dynamicStyle.id = `${CONFIG.widgetId}-dynamic-styles`;
        dynamicStyle.textContent = `
            #${CONFIG.widgetId} .chat-toggle {
                background: linear-gradient(135deg, ${CONFIG.primaryColor} 0%, ${CONFIG.secondaryColor} 100%);
            }
            #${CONFIG.widgetId} .message.bot .message-avatar {
                background: linear-gradient(135deg, ${CONFIG.primaryColor} 0%, ${CONFIG.secondaryColor} 100%);
            }
            #${CONFIG.widgetId} .message.user .message-content {
                background: ${CONFIG.primaryColor};
            }
            #${CONFIG.widgetId} .chat-input:focus {
                border-color: ${CONFIG.primaryColor};
            }
            #${CONFIG.widgetId} .send-button {
                background: ${CONFIG.primaryColor};
            }
            #${CONFIG.widgetId} .slot-btn.selected {
                background: ${CONFIG.primaryColor};
            }
            #${CONFIG.widgetId} .btn.primary {
                background: ${CONFIG.primaryColor};
            }
        `;
        document.head.appendChild(dynamicStyle);
    }

    // Attempt to detect username from multiple sources if not explicitly set
    function detectUsername() {
        if (CONFIG.username && String(CONFIG.username).trim() !== '') return CONFIG.username;
        try {
            if (typeof window !== 'undefined') {
                if (window.CHATBOT_USERNAME && String(window.CHATBOT_USERNAME).trim() !== '') {
                    CONFIG.username = String(window.CHATBOT_USERNAME).trim();
                    return CONFIG.username;
                }
                // Look for the script tag including this widget with data-username attribute
                var scripts = document.getElementsByTagName('script');
                for (var i = scripts.length - 1; i >= 0; i--) {
                    var s = scripts[i];
                    var src = s.getAttribute('src') || '';
                    if (src.indexOf('chatbot-widget.js') !== -1) {
                        var du = s.getAttribute('data-username');
                        if (du && du.trim() !== '') { CONFIG.username = du.trim(); return CONFIG.username; }
                        break;
                    }
                }
                // Try cookie set by dashboard
                var ck = (document.cookie || '').split('; ').find(function(r){return r.indexOf('dashboard_username=')===0;});
                if (ck) {
                    var val = decodeURIComponent(ck.split('=')[1] || '');
                    if (val) { CONFIG.username = val; return CONFIG.username; }
                }
                // Fallback to localStorage on the embedding site
                try { var lsU = localStorage.getItem('username'); if (lsU) { CONFIG.username = lsU; return CONFIG.username; } } catch(_){ }
            }
        } catch(_) {}
        return CONFIG.username;
    }

    // Detect API base URL from globals or script tag attribute
    function detectApiUrl() {
        try {
            if (CONFIG.apiUrl && !/localhost:5001$/.test(CONFIG.apiUrl)) return CONFIG.apiUrl;
            if (typeof window !== 'undefined') {
                if (window.CHATBOT_API_URL && String(window.CHATBOT_API_URL).trim() !== '') {
                    CONFIG.apiUrl = String(window.CHATBOT_API_URL).trim();
                    return CONFIG.apiUrl;
                }
                var scripts = document.getElementsByTagName('script');
                for (var i = scripts.length - 1; i >= 0; i--) {
                    var s = scripts[i];
                    var src = s.getAttribute('src') || '';
                    if (src.indexOf('chatbot-widget.js') !== -1) {
                        var du = s.getAttribute('data-api-url');
                        if (du && du.trim() !== '') { CONFIG.apiUrl = du.trim(); return CONFIG.apiUrl; }
                        break;
                    }
                }
            }
        } catch(_) {}
        return CONFIG.apiUrl;
    }

    // Create widget styles
    function createStyles() {
        const style = document.createElement('style');
        style.textContent = `
            #${CONFIG.widgetId} {
                position: fixed;
                ${CONFIG.position.includes('right') ? 'right: 20px;' : 'left: 20px;'}
                ${CONFIG.position.includes('bottom') ? 'bottom: 20px;' : 'top: 20px;'}
                z-index: 999999;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            }

            #${CONFIG.widgetId} .chat-toggle {
                width: 60px;
                height: 60px;
                border-radius: 50%;
                background: linear-gradient(135deg, ${CONFIG.primaryColor} 0%, ${CONFIG.secondaryColor} 100%);
                border: none;
                color: white;
                font-size: 24px;
                cursor: pointer;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
                transition: all 0.3s ease;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            #${CONFIG.widgetId} .chat-toggle:hover {
                transform: scale(1.1);
                box-shadow: 0 6px 25px rgba(0, 0, 0, 0.2);
            }

            #${CONFIG.widgetId} .chat-window {
                position: absolute;
                ${CONFIG.position.includes('right') ? 'right: 0;' : 'left: 0;'}
                ${CONFIG.position.includes('bottom') ? 'bottom: 80px;' : 'top: 80px;'}
                width: 350px;
                height: 500px;
                background: white;
                border-radius: 20px;
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
                display: none;
                flex-direction: column;
                overflow: hidden;
                border: 1px solid #e5e7eb;
            }

            #${CONFIG.widgetId} .chat-header {
                background: linear-gradient(135deg, #0a0a0a 0%, #111827 60%, #0b1220 100%);
                color: #ffffff;
                padding: 14px 14px 18px 14px;
                position: relative;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
                display: flex;
                align-items: flex-end;
                justify-content: space-between;
                gap: 10px;
            }

            #${CONFIG.widgetId} .header-brand { display: flex; align-items: flex-end; gap: 10px; }
            #${CONFIG.widgetId} .brand-logo {
                width: 28px; height: 28px; border-radius: 50%; overflow: hidden; border: 1px solid rgba(255,255,255,.25);
                background: radial-gradient(circle at 30% 30%, ${CONFIG.primaryColor}, ${CONFIG.secondaryColor});
                flex-shrink: 0;
            }
            #${CONFIG.widgetId} .brand-logo img { width: 100%; height: 100%; object-fit: cover; border-radius: 50%; }

            #${CONFIG.widgetId} .chat-header h3 {
                margin: 0;
                font-size: 18px;
                font-weight: 600;
                text-shadow: 0 1px 2px rgba(0,0,0,.25);
            }

            #${CONFIG.widgetId} .chat-header p {
                margin: 5px 0 0 0;
                font-size: 14px;
                opacity: 0.95;
                text-shadow: 0 1px 2px rgba(0,0,0,.25);
            }

            #${CONFIG.widgetId} .header-actions{ position: static; margin-left: auto; display:flex; gap:8px; align-items:flex-end; z-index:2; }
            #${CONFIG.widgetId} .header-actions .btn,
            #${CONFIG.widgetId} .header-actions .tts-button,
            #${CONFIG.widgetId} .header-actions .close-btn {
                width: 34px;
                height: 34px;
                padding: 0;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                border-radius: 10px;
                font-size: 14px;
            }
            #${CONFIG.widgetId} .close-btn {
                background: #ffffff;
                border: 1px solid #000000;
                color: #000000; width: 32px; height: 32px; border-radius: 10px; cursor:pointer; display:flex; align-items:center; justify-content:center;
            }
            #${CONFIG.widgetId} .close-btn:hover { background: #f3f4f6; }
            #${CONFIG.widgetId}.light .close-btn { background:#ffffff; border-color:#000000; color:#000000; }

            #${CONFIG.widgetId} .chat-messages {
                flex: 1;
                padding: 20px;
                overflow-y: auto;
                background: linear-gradient(135deg, #0a0a0a 0%, #0f1115 50%, #111827 100%);
            }

            #${CONFIG.widgetId} .message {
                margin-bottom: 15px;
                display: flex;
                align-items: flex-start;
                gap: 10px;
            }

            #${CONFIG.widgetId} .message.user {
                flex-direction: row-reverse;
            }

            #${CONFIG.widgetId} .message-avatar {
                width: 32px;
                height: 32px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 14px;
                font-weight: 600;
                flex-shrink: 0;
            }

            #${CONFIG.widgetId} .message.bot .message-avatar {
                background: linear-gradient(135deg, ${CONFIG.primaryColor} 0%, ${CONFIG.secondaryColor} 100%);
                color: white;
            }

            #${CONFIG.widgetId} .message.user .message-avatar {
                background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
                color: white;
            }

            #${CONFIG.widgetId} .message-content {
                max-width: 80%;
                padding: 12px 16px;
                border-radius: 18px;
                font-size: 14px;
                line-height: 1.4;
                word-wrap: break-word;
            }

            #${CONFIG.widgetId} .message.bot .message-content {
                background: rgba(55, 65, 81, 0.25);
                color: #e5e7eb;
                border: 1px solid rgba(255, 255, 255, 0.12);
                backdrop-filter: blur(8px);
            }

            #${CONFIG.widgetId} .message.user .message-content {
                background: #374151;
                color: #ffffff;
                box-shadow: 0 4px 15px rgba(0, 0, 0, 0.25);
            }

            #${CONFIG.widgetId} .chat-input-container {
                padding: 20px;
                background: linear-gradient(135deg, #0a0a0a 0%, #111827 50%, #0b1220 100%);
                border-top: 1px solid rgba(255, 255, 255, 0.1);
            }

            #${CONFIG.widgetId} .chat-input-wrapper {
                display: flex;
                gap: 10px;
                align-items: center;
            }

            #${CONFIG.widgetId} .chat-input {
                flex: 1;
                padding: 12px 16px;
                border: 2px solid rgba(255, 255, 255, 0.2);
                border-radius: 25px;
                font-size: 14px;
                outline: none;
                transition: border-color 0.2s;
                background: rgba(255, 255, 255, 0.1);
                color: #ffffff;
                backdrop-filter: blur(10px);
            }

            #${CONFIG.widgetId} .chat-input:focus {
                border-color: ${CONFIG.primaryColor};
                box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.2);
            }
            #${CONFIG.widgetId} .chat-input::placeholder { color: #ffffff; }

            #${CONFIG.widgetId} .icon-button { width: 40px; height: 40px; background: transparent; border: 1px solid rgba(255,255,255,.28); border-radius: 12px; color:#fff; cursor:pointer; display:flex; align-items:center; justify-content:center; transition: transform .15s, border-color .15s, background .15s; margin-right: 6px; }
            #${CONFIG.widgetId} .icon-button svg{ stroke: currentColor; }
            #${CONFIG.widgetId} .icon-button:hover { transform: translateY(-1px); border-color: ${CONFIG.primaryColor}; background: rgba(124,58,237,.1); }
            #${CONFIG.widgetId} .send-button { }
            #${CONFIG.widgetId} .mic-button { }
            #${CONFIG.widgetId} .mic-button.listening { 
                border-color: #ef4444;
                background: rgba(239, 68, 68, 0.12);
            }

            #${CONFIG.widgetId} .tts-button { width: 34px; height: 34px; background: rgba(255,255,255,0.16); border:1px solid rgba(255,255,255,0.25); border-radius:10px; color:#fff; cursor:pointer; display:flex; align-items:center; justify-content:center; }
            #${CONFIG.widgetId} .tts-button.active {
                border-color: #10b981; background: rgba(16,185,129,.12);
            }

            #${CONFIG.widgetId} .send-button:hover {
                transform: scale(1.05);
            }

            #${CONFIG.widgetId} .send-button:disabled {
                opacity: 0.5;
                cursor: not-allowed;
                transform: none;
            }

            #${CONFIG.widgetId} .loading-dots {
                display: inline-block;
            }

            #${CONFIG.widgetId} .loading-dots::after {
                content: '';
                animation: dots 1.5s infinite;
            }

            @keyframes dots {
                0%, 20% { content: ''; }
                40% { content: '.'; }
                60% { content: '..'; }
                80%, 100% { content: '...'; }
            }

            /* Modal */
            #${CONFIG.widgetId} .modal-overlay {
                position: fixed;
                inset: 0;
                background: rgba(0,0,0,0.5);
                display: none;
                align-items: center;
                justify-content: center;
                z-index: 1000000;
            }
            #${CONFIG.widgetId} .modal {
                background: linear-gradient(135deg, #000000 0%, #1a0b2e 50%, #2d1b69 100%);
                border: 1px solid rgba(255, 255, 255, 0.2);
                width: 90%;
                max-width: 420px;
                border-radius: 16px;
                box-shadow: 0 20px 40px rgba(0,0,0,0.6);
                overflow: hidden;
                backdrop-filter: blur(10px);
            }
            #${CONFIG.widgetId} .modal-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 14px 16px;
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                font-weight: 600;
                color: #ffffff;
                background: linear-gradient(135deg, #000000 0%, #1a0b2e 50%, #2d1b69 100%);
            }
            #${CONFIG.widgetId} .modal-body { padding: 16px; background: transparent; }
            #${CONFIG.widgetId} .modal-actions { padding: 12px 16px; display: flex; justify-content: flex-end; gap: 8px; border-top: 1px solid rgba(255, 255, 255, 0.1); background: transparent; }
            #${CONFIG.widgetId} .btn { border: 1px solid rgba(255, 255, 255, 0.2); background: rgba(255, 255, 255, 0.1); color: #ffffff; padding: 8px 12px; border-radius: 8px; cursor: pointer; backdrop-filter: blur(10px); }
            #${CONFIG.widgetId} .btn.primary { background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); color: #fff; border: none; box-shadow: 0 4px 15px rgba(124, 58, 237, 0.3); }
            #${CONFIG.widgetId} .slot-btn { width: 100%; text-align: left; border: 1px solid rgba(255, 255, 255, 0.2); border-radius: 8px; padding: 10px 12px; margin-bottom: 8px; background: rgba(255, 255, 255, 0.1); color: #ffffff; cursor: pointer; backdrop-filter: blur(10px); }
            #${CONFIG.widgetId} .slot-btn.selected { background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); color: #fff; box-shadow: 0 4px 15px rgba(124, 58, 237, 0.3); }
            #${CONFIG.widgetId} .slot-status { font-size: 12px; padding: 2px 6px; border-radius: 6px; margin-left: 8px; background: rgba(255, 255, 255, 0.2); color: #ffffff; }

            /* Feedback styles */
            #${CONFIG.widgetId} .stars { display:flex; gap:8px; justify-content:center; margin:10px 0; }
            #${CONFIG.widgetId} .star { width:36px; height:36px; border-radius:50%; display:flex; align-items:center; justify-content:center; cursor:pointer; border:1px solid rgba(255,255,255,.2); background: rgba(255,255,255,.08); color:#fff; font-weight:700; }
            #${CONFIG.widgetId} .star.active { background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); border-color: transparent; }
            #${CONFIG.widgetId} .emoji { font-size:28px; text-align:center; height:34px; }

            @media (max-width: 480px) {
                #${CONFIG.widgetId} .chat-window {
                    width: calc(100vw - 40px);
                    height: calc(100vh - 40px);
                    ${CONFIG.position.includes('right') ? 'right: -20px;' : 'left: -20px;'}
                    ${CONFIG.position.includes('bottom') ? 'bottom: -20px;' : 'top: -20px;'}
                    border-radius: 0;
                }
            }

            /* Branding badge */
            #${CONFIG.widgetId} .brand-badge {
                position: absolute;
                ${CONFIG.position.includes('right') ? 'right: 76px;' : 'left: 76px;'}
                bottom: 10px;
                display: inline-flex;
                align-items: center;
                gap: 8px;
                padding: 6px 10px;
                border-radius: 9999px;
                background: rgba(255,255,255,0.95);
                color: #0f172a;
                border: 1px solid #cbd5e1;
                box-shadow: 0 6px 16px rgba(0,0,0,.15);
                font-size: 12px;
                text-decoration: none;
                white-space: nowrap;
                z-index: 999999; /* ensure above page UI */
            }
            #${CONFIG.widgetId} .brand-badge .dot {
                width: 8px; height: 8px; border-radius: 50%; background: ${CONFIG.primaryColor}; box-shadow: 0 0 0 2px rgba(124,58,237,.15);
            }
            #${CONFIG.widgetId}.light .brand-badge { background:#ffffff; color:#0f172a; border-color:#e2e8f0; }

            /* Light theme overrides on the widget root */
            #${CONFIG.widgetId}.light .chat-header { background: #f1f5f9; color: #0f172a; box-shadow: 0 2px 10px rgba(0,0,0,.08); }
            #${CONFIG.widgetId}.light .chat-messages { background: #ffffff; }
            #${CONFIG.widgetId}.light .message.bot .message-content { background: rgba(15,23,42,0.06); color: #0f172a; border: 1px solid rgba(0,0,0,0.08); }
            #${CONFIG.widgetId}.light .message.user .message-content { background: #e2e8f0; color: #0f172a; }
            #${CONFIG.widgetId}.light .chat-input-container { background: #f8fafc; border-top: 1px solid #e5e7eb; }
            #${CONFIG.widgetId}.light .chat-input { background: #ffffff; color: #0f172a; border-color: #cbd5e1; }
            #${CONFIG.widgetId}.light .chat-input::placeholder { color: #0f172a; opacity: .7; }
            #${CONFIG.widgetId}.light .icon-button { border-color: #cbd5e1; color: #0f172a; }
            #${CONFIG.widgetId}.light .btn { border-color: #cbd5e1; color: #0f172a; }
            #${CONFIG.widgetId}.light .slot-btn { background:#ffffff; color:#0f172a; border-color:#cbd5e1; }
            #${CONFIG.widgetId}.light .slot-status { background:#f1f5f9; color:#0f172a; }
            /* Feedback stars readability in light theme */
            #${CONFIG.widgetId}.light .star { background:#eef2ff; color:#0f172a; border-color:#cbd5e1; }
            #${CONFIG.widgetId}.light .star.active { background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); color:#fff; border-color: transparent; }
            /* Feedback close button */
            #${CONFIG.widgetId} .fb-close { position:absolute; top:-6px; right:-6px; width:22px; height:22px; border-radius:50%; border:1px solid #000; background:#fff; color:#000; cursor:pointer; display:flex; align-items:center; justify-content:center; font-weight:700; }
            #${CONFIG.widgetId}.light .fb-close { border-color:#000; background:#fff; color:#000; }
        `;
        document.head.appendChild(style);
    }

    // Create widget HTML
    function createWidget() {
        const widget = document.createElement('div');
        widget.id = CONFIG.widgetId;
        widget.innerHTML = `
            <button class="chat-toggle" onclick="toggleChat()" aria-label="Open chat">
                💬
            </button>
            <div class="chat-window" id="chat-window">
                <div class="chat-header">
                    
                    <div class="header-brand">
                      <div class="brand-logo" id="brand-logo"></div>
                      <div>
                        <h3 style="margin:0">AI Assistant</h3>
                        <p style="margin:5px 0 0 0"></p>
                      </div>
                    </div>
                    <div class="header-actions">
                      <button class="btn" id="chat-theme-toggle" title="Toggle theme">🌙</button>
                      <button class="tts-button" id="tts-button" title="Read bot messages">🔈</button>
                      <button class="btn" id="refresh-chat" title="Restart chat">↻</button>
                      <button class="close-btn" onclick="closeChat()" aria-label="Close chat">&times;</button>
                    </div>
                </div>
                <div class="chat-messages" id="chat-messages">
                </div>
                <div class="chat-input-container">
                    <div class="chat-input-wrapper">
                        <input type="text" class="chat-input" id="user-input" placeholder="Type your message..." autocomplete="off">
                        <button class="icon-button mic-button" id="mic-button" title="Voice input">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 1a3 3 0 0 0-3 3v6a3 3 0 1 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v1a7 7 0 0 1-14 0v-1"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
                        </button>
                        <button class="icon-button send-button" id="send-button" onclick="sendMessage()" title="Send">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="22" y1="2" x2="11" y2="13"></line>
                                <polygon points="22,2 15,22 11,13 2,9"></polygon>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
            <a class="brand-badge" href="https://www.imsoultions.in/" target="_blank" rel="noopener noreferrer" aria-label="Powered by IM Solutions" style="display:none;">
              <span class="dot"></span>
              Powered by IM Solutions
            </a>
            <!-- Calendar Modal -->
            <div class="modal-overlay" id="calendar-overlay">
              <div class="modal">
                <div class="modal-header">
                  <span>Select Date and Slot</span>
                  <button class="btn" onclick="closeCalendarModal()">✕</button>
                </div>
                <div class="modal-body">
                  <label style="display:block;font-size:14px;color:#374151;margin-bottom:6px;">Pick a date</label>
                  <input type="date" id="appointment-date-input" style="width:100%;padding:10px 12px;border:2px solid #e5e7eb;border-radius:8px;margin-bottom:12px;outline:none"/>
                  <label style="display:block;font-size:14px;color:#374151;margin:8px 0;">Choose a 2-hour slot</label>
                  <div id="slot-buttons-container"></div>
                </div>
                <div class="modal-actions">
                  <button class="btn" onclick="closeCalendarModal()">Cancel</button>
                  <button class="btn primary" onclick="confirmAppointmentFromModal()">Confirm</button>
                </div>
              </div>
            </div>
        `;
        document.body.appendChild(widget);
    }

    // Widget functionality
    let isOpen = false;
    let loadingMessage = null;
    const sessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
    let lastUserMessage = '';
    const appointmentState = { isScheduling: false, title: null, slotStartISO: null };
    const leadState = { active: false, step: 0, data: { name: '', email: '', phone: '', message: '' } };
    const cancelState = { active: false };
    let userMessageCount = 0;
    let recognition = null;
    let isListening = false;
    // Track feedback state only for the current chat session
    let FEEDBACK_GIVEN_SESSION = false;

    function getTone(){
        try { return (CONFIG.companyConfig && CONFIG.companyConfig.tone) ? String(CONFIG.companyConfig.tone) : 'Professional'; } catch(_) { return 'Professional'; }
    }
    function getFollowupMessage(){
        const tone = getTone();
        switch(tone){
            case 'Friendly': return 'Anything else I can help you with? 😊';
            case 'Humorous': return 'Anything else I can help you with before I power down? 😄';
            case 'Expert': return 'Is there anything else I can assist you with?';
            case 'Caring': return 'Is there anything else I can help you with? I’m here for you.';
            case 'Enthusiastic': return 'Anything else I can help you with? 🚀';
            case 'Formal': return 'Is there anything else with which I may assist you?';
            case 'Casual': return 'Need anything else?';
            default: return 'Is there anything else I can help you with?';
        }
    }

    function toggleChat() {
        const chatWindow = document.getElementById('chat-window');
        const badge = document.querySelector(`#${CONFIG.widgetId} .brand-badge`);
        isOpen = !isOpen;
        chatWindow.style.display = isOpen ? 'flex' : 'none';
        if(badge){ badge.style.display = isOpen ? 'inline-flex' : 'none'; }
        
        if (isOpen) {
            const input = document.getElementById('user-input');
            input.focus();
        }
    }

    function applyWidgetTheme(theme){
        try{
            const root = document.getElementById(CONFIG.widgetId);
            const isLight = theme === 'light';
            root.classList.toggle('light', isLight);
            const btn = document.getElementById('chat-theme-toggle');
            if(btn){ btn.textContent = isLight ? '☀️' : '🌙'; }
            try { localStorage.setItem('chatbot_theme', isLight ? 'light' : 'dark'); } catch(_){ }
        }catch(_){ }
    }

    function closeChat() {
        // Ask for feedback before closing if not given in this session
        if (!FEEDBACK_GIVEN_SESSION) {
            showFeedbackPrompt(function(){
                const chatWindow = document.getElementById('chat-window');
                isOpen = false;
                chatWindow.style.display = 'none';
            });
            return;
        }
        const chatWindow = document.getElementById('chat-window');
        isOpen = false;
        chatWindow.style.display = 'none';
    }

    function addMessage(content, isUser = false) {
        if (loadingMessage) {
            loadingMessage.remove();
            loadingMessage = null;
        }

        const chatMessages = document.getElementById('chat-messages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${isUser ? 'user' : 'bot'}`;
        
        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        if (!isUser) {
            // Always use a generic bot icon for messages
            avatar.style.background = 'transparent';
            avatar.style.border = '1px solid rgba(255,255,255,.25)';
            avatar.style.overflow = 'hidden';
            const svg = document.createElement('div');
            svg.innerHTML = `<svg width="32" height="32" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="6" y="14" width="36" height="22" rx="11" fill="url(#g)"/><defs><linearGradient id="g" x1="6" y1="14" x2="42" y2="36"><stop stop-color="${CONFIG.primaryColor}"/><stop offset="1" stop-color="${CONFIG.secondaryColor}"/></linearGradient></defs><circle cx="20" cy="25" r="3" fill="#fff"/><circle cx="28" cy="25" r="3" fill="#fff"/></svg>`;
            svg.style.width='100%'; svg.style.height='100%';
            avatar.appendChild(svg);
        } else {
            avatar.textContent = 'U';
        }
        
        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        messageContent.textContent = content;
        
        messageDiv.appendChild(avatar);
        messageDiv.appendChild(messageContent);
        chatMessages.appendChild(messageDiv);
        
        chatMessages.scrollTop = chatMessages.scrollHeight;

        // Speak bot responses (optional)
        if (!isUser && CONFIG.textToSpeech && 'speechSynthesis' in window) {
            try {
                const utter = new SpeechSynthesisUtterance(String(content));
                utter.rate = 1.0;
                utter.pitch = 1.0;
                window.speechSynthesis.cancel();
                window.speechSynthesis.speak(utter);
            } catch (_) { /* ignore */ }
        }

        // If user sent something that looks like a misclick or if chat seems ended, offer feedback once per browser
        // Removed auto end-of-chat trigger to avoid popping right after refresh
    }

    function showLoading() {
        if (loadingMessage) return;
        
        const chatMessages = document.getElementById('chat-messages');
        loadingMessage = document.createElement('div');
        loadingMessage.className = 'message bot';
        
        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.textContent = 'AI';
        
        const messageContent = document.createElement('div');
        messageContent.className = 'message-content loading-dots';
        messageContent.textContent = 'Thinking';
        
        loadingMessage.appendChild(avatar);
        loadingMessage.appendChild(messageContent);
        chatMessages.appendChild(loadingMessage);
        
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function sendMessage() {
        const userInput = document.getElementById('user-input');
        const sendButton = document.getElementById('send-button');
        const message = userInput.value.trim();
        
        if (!message) return;

        lastUserMessage = message;
        userMessageCount += 1;
        if (appointmentState.isScheduling && !appointmentState.title) {
            appointmentState.title = message;
        }

        addMessage(message, true);
        userInput.value = '';
        sendButton.disabled = true;
        
        // Check for explicit lead capture requests
        const leadTriggers = [
            'i want to share my details',
            'share my details',
            'share contact',
            'share contact details',
            'give my details',
            'provide my details',
            'contact details',
            'my contact info',
            'contact information',
            'lead capture',
            'capture lead'
        ];
        
        const messageLower = message.toLowerCase();
        const isLeadRequest = leadTriggers.some(trigger => messageLower.includes(trigger));
        
        if (isLeadRequest && !leadState.active) {
            startLeadFlow();
            sendButton.disabled = false;
            return;
        }

        // Conversational lead capture flow
        if (leadState.active) {
            handleLeadMessage(message);
            sendButton.disabled = false;
            return;
        }

        // Chat-based cancel flow
        if (/\bcancel\b/i.test(message) && !cancelState.active) {
            cancelState.active = true;
            addMessage('Sure, please provide your Appointment ID to cancel (e.g., APT-12345).', false);
            sendButton.disabled = false;
            return;
        }

        // If awaiting appointment ID for cancellation
        if (cancelState.active) {
            const aptId = message.replace(/^(appointment\s*id\s*:?)\s*/i, '').trim();
            if (!aptId) {
                addMessage('Please type your Appointment ID to proceed with cancellation.', false);
                sendButton.disabled = false;
                return;
            }
            detectUsername();
            const token = localStorage.getItem('token') || CONFIG.authToken;
            const headers = { 'Content-Type': 'application/json' };
            if (token) { headers['Authorization'] = `Bearer ${token}`; }
            addMessage('Processing your cancellation...', false);
            fetch(`${CONFIG.apiUrl}/cancel_appointment`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ appointment_id: aptId, username: CONFIG.username || '' })
            })
            .then(r => r.json())
            .then(data => {
                if (data && data.success) {
                    addMessage('Your appointment has been cancelled successfully.', false);
                    setTimeout(()=>{ addMessage(getFollowupMessage(), false); }, 500);
                } else {
                    const err = (data && (data.error || data.message)) || 'Failed to cancel the appointment.';
                    addMessage('Error: ' + String(err), false);
                }
            })
            .catch(() => addMessage('Network error while cancelling. Please try again.', false))
            .finally(() => { cancelState.active = false; sendButton.disabled = false; });
            return;
        }

        // Detect wrong-button or misclick phrases
        try {
            if (/clicked wrong|wrong button|not helpful|didn\'t help|wrong/i.test(message)) {
                if (!FEEDBACK_GIVEN_SESSION) {
                    showFeedbackPrompt();
                } else {
                    closeChat();
                }
            }
        } catch(_) {}

        showLoading();

        // Ensure username is detected before sending
        detectUsername();
        
        // Get authentication token
        const token = localStorage.getItem('token') || CONFIG.authToken;
        
        const headers = {
            'Content-Type': 'application/json',
        };
        
        // Add authorization header if token exists
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        fetch(`${CONFIG.apiUrl}/send_message`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({
                message: message,
                session_id: sessionId,
                username: CONFIG.username || '',
                bot_id: CONFIG.botId || ''
            })
        })
        .then(response => response.json())
        .then(data => {
            if (loadingMessage) {
                loadingMessage.remove();
                loadingMessage = null;
            }
            addMessage(data.response, false);

            const resp = String(data.response || '');
            if (resp.toLowerCase().includes('first, please tell me the title')) {
                appointmentState.isScheduling = true;
            }
            if (resp.toLowerCase().includes('please select the date and time')) {
                // render inline calendar inside the chat instead of external modal
                setTimeout(() => { showInlineCalendar(); }, 300);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            if (loadingMessage) {
                loadingMessage.remove();
                loadingMessage = null;
            }
            addMessage('Sorry, I encountered an error. Please try again.', false);
        })
        .finally(() => {
            sendButton.disabled = false;
        });
    }

    // Make functions globally available
    window.toggleChat = toggleChat;
    window.closeChat = closeChat;
    window.sendMessage = sendMessage;

    // Calendar helpers
    function showCalendarModal() {
        const overlay = document.getElementById('calendar-overlay');
        const dateInput = document.getElementById('appointment-date-input');
        overlay.style.display = 'flex';

        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const iso = new Date(tomorrow.getTime() - tomorrow.getTimezoneOffset()*60000).toISOString().slice(0,10);
        dateInput.min = iso;
        if (!dateInput.value) dateInput.value = iso;

        renderSlots();
        dateInput.onchange = function(){
            renderSlots();
            try{
                const cont = document.getElementById('slot-buttons-container');
                if(cont){ cont.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
            }catch(_){ }
        };
    }
    function closeCalendarModal() {
        document.getElementById('calendar-overlay').style.display = 'none';
    }
    function renderSlots() {
        const dateStr = document.getElementById('appointment-date-input').value;
        const container = document.getElementById('slot-buttons-container');
        container.innerHTML = '';
        if (!dateStr) return;

        const slots = [
            { label: '9:30 AM - 11:30 AM', start: { h:9, m:30 } },
            { label: '11:30 AM - 1:30 PM', start: { h:11, m:30 } },
            { label: '2:30 PM - 4:30 PM', start: { h:14, m:30 } },
            { label: '4:30 PM - 6:30 PM', start: { h:16, m:30 } }
        ];

        fetch(`${CONFIG.apiUrl}/get_slot_locks?date=${encodeURIComponent(dateStr)}&username=${encodeURIComponent(CONFIG.username||'')}&botId=${encodeURIComponent(CONFIG.botId||'')}`)
            .then(r => r.json())
            .then(({ locks }) => {
                slots.forEach(slot => {
                    const btn = document.createElement('button');
                    btn.type = 'button';
                    btn.className = 'slot-btn';
                    btn.textContent = slot.label;

                    const [y, mm, dd] = dateStr.split('-').map(Number);
                    const local = new Date(y, mm-1, dd, slot.start.h, slot.start.m, 0, 0);
                    const isoLocal = local.toISOString();
                    const utc = new Date(isoLocal);
                    const slotKey = `${utc.getUTCFullYear()}${String(utc.getUTCMonth()+1).padStart(2,'0')}${String(utc.getUTCDate()).padStart(2,'0')}-${String(utc.getUTCHours()).padStart(2,'0')}${String(utc.getUTCMinutes()).padStart(2,'0')}`;
                    const status = locks ? locks[slotKey] : undefined;
                    const isBooked = status && status !== 'cancelled';

                    if (isBooked) {
                        btn.disabled = true;
                        const badge = document.createElement('span');
                        badge.className = 'slot-status';
                        badge.textContent = 'Booked';
                        btn.appendChild(badge);
                    } else {
                        btn.onclick = () => {
                            Array.from(container.children).forEach(c => c.classList.remove('selected'));
                            btn.classList.add('selected');
                            appointmentState.slotStartISO = isoLocal;
                        };
                        const badge = document.createElement('span');
                        badge.className = 'slot-status';
                        badge.textContent = 'Available';
                        btn.appendChild(badge);
                    }
                    container.appendChild(btn);
                });
            })
            .catch(() => {
                // Fallback: allow selection without lock info
                slots.forEach(slot => {
                    const btn = document.createElement('button');
                    btn.type = 'button';
                    btn.className = 'slot-btn';
                    btn.textContent = slot.label;
                    btn.onclick = () => {
                        Array.from(container.children).forEach(c => c.classList.remove('selected'));
                        btn.classList.add('selected');
                        const [y, mm, dd] = dateStr.split('-').map(Number);
                        const local = new Date(y, mm-1, dd, slot.start.h, slot.start.m, 0, 0);
                        appointmentState.slotStartISO = local.toISOString();
                    };
                    container.appendChild(btn);
                });
            });
    }
    function confirmAppointmentFromModal() {
        if (!appointmentState.slotStartISO) { 
            alert('Please select a time slot.'); 
            return; 
        }
        closeCalendarModal();
        detectUsername();
        
        // Get authentication token
        const token = localStorage.getItem('token') || CONFIG.authToken;
        const headers = { 'Content-Type': 'application/json' };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        // Show loading message
        addMessage('Scheduling your appointment...', false);
        
        fetch(`${CONFIG.apiUrl}/schedule_appointment`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({
                title: appointmentState.title || 'Appointment',
                time: appointmentState.slotStartISO,
                username: CONFIG.username || '',
                bot_id: CONFIG.botId || '',
                session_id: sessionId,
                contact_name: (leadState && leadState.data && leadState.data.name) ? leadState.data.name : ''
            })
        })
        .then(r => {
            if (!r.ok) {
                throw new Error(`HTTP ${r.status}: ${r.statusText}`);
            }
            return r.json();
        })
        .then(data => {
            if (data && data.success) {
                addMessage(`Perfect! I've scheduled your appointment:\n\nTitle: ${appointmentState.title || 'Appointment'}\nDate/Time: ${new Date(appointmentState.slotStartISO).toLocaleString()}\nAppointment ID: ${data.appointment_id}\n\nPlease save this appointment ID for future reference.`, false);
                // Inform the user that the selected slot is booked
                try {
                  const utc = new Date(appointmentState.slotStartISO);
                  const slotKey = `${utc.getUTCFullYear()}${String(utc.getUTCMonth()+1).padStart(2,'0')}${String(utc.getUTCDate()).padStart(2,'0')}-${String(utc.getUTCHours()).padStart(2,'0')}${String(utc.getUTCMinutes()).padStart(2,'0')}`;
                  addMessage(`Your selected slot (${new Date(appointmentState.slotStartISO).toLocaleString()}) is now booked.`, false);
                } catch(_) {}
                // Follow-up prompt
                setTimeout(()=>{ addMessage(getFollowupMessage(), false); }, 600);
                appointmentState.isScheduling = false;
                appointmentState.title = null;
                appointmentState.slotStartISO = null;
            } else {
                const errorMsg = data && data.error ? data.error : 'Failed to schedule appointment.';
                addMessage(`Error: ${errorMsg}`, false);
            }
        })
        .catch(error => {
            console.error('Appointment scheduling error:', error);
            addMessage(`Failed to schedule appointment: ${error.message}. Please try again.`, false);
        });
    }
    window.showCalendarModal = showCalendarModal;
    window.closeCalendarModal = closeCalendarModal;
    window.confirmAppointmentFromModal = confirmAppointmentFromModal;

    // Feedback prompt
    function showFeedbackPrompt(onDone){
        // Always show feedback for the current session regardless of prior sessions
        const chatMessages = document.getElementById('chat-messages');
        const wrap = document.createElement('div');
        wrap.className = 'message bot';
        const avatar = document.createElement('div'); avatar.className='message-avatar'; avatar.textContent='AI';
        const content = document.createElement('div'); content.className='message-content';
        content.style.position = 'relative';
        content.innerHTML = `
          <div style="max-width:320px;text-align:center">
            <button class="fb-close" title="Close" onclick="(function(el){ try{ el.closest('.message').remove(); }catch(_){ } })(this)">×</button>
            <div style="font-weight:700;margin-bottom:6px">How was your chat experience?</div>
            <div class="stars" id="fb-stars">
              <div class="star" data-v="1">1</div>
              <div class="star" data-v="2">2</div>
              <div class="star" data-v="3">3</div>
              <div class="star" data-v="4">4</div>
              <div class="star" data-v="5">5</div>
            </div>
            <div class="emoji" id="fb-emoji">😐</div>
            <div style="margin-top:8px">
              <input id="fb-reason" placeholder="Optional comment" style="width:100%;padding:8px 10px;border:1px solid rgba(255,255,255,.25);border-radius:8px;background:rgba(255,255,255,.08);color:#fff"/>
            </div>
          </div>`;
        wrap.appendChild(avatar); wrap.appendChild(content); chatMessages.appendChild(wrap); chatMessages.scrollTop = chatMessages.scrollHeight;
        // Focus the optional comment input to let users start typing immediately
        try { setTimeout(()=>{ const inp = content.querySelector('#fb-reason'); if (inp) inp.focus(); }, 50); } catch(_) {}

        const stars = content.querySelectorAll('.star');
        stars.forEach(s=>{
          s.onclick = ()=>{
            const val = Number(s.getAttribute('data-v'))||0;
            stars.forEach(k=>k.classList.remove('active'));
            for(let i=0;i<val;i++){ stars[i].classList.add('active'); }
            const emo = content.querySelector('#fb-emoji');
            const faces=['😞','🙁','😐','🙂','🤩'];
            emo.textContent = faces[val-1] || '🙂';
            FEEDBACK_GIVEN_SESSION = true;
            // Optionally send to backend
            try{
              const token = localStorage.getItem('token') || CONFIG.authToken;
              const headers = { 'Content-Type':'application/json' };
              if(token){ headers['Authorization'] = `Bearer ${token}`; }
              const reason = (content.querySelector('#fb-reason')||{}).value || '';
              fetch(`${CONFIG.apiUrl}/feedback`,{ method:'POST', headers, body: JSON.stringify({ username: CONFIG.username||'', session_id: sessionId, rating: val, reason }) }).catch(()=>{});
            }catch(_){ }
            // Acknowledge inside chat, keep window open
            const thanks = ['Thanks for the feedback!','Appreciate your rating!','Got it, thank you!'];
            addMessage(thanks[Math.floor(Math.random()*thanks.length)], false);
            // Give users 20 seconds to add an optional note before auto-closing
            if(typeof onDone === 'function'){ setTimeout(onDone, 20000); }
          };
        });
    }

    // Inline calendar inside chat
    function showInlineCalendar(){
        const chatMessages = document.getElementById('chat-messages');
        const wrap = document.createElement('div');
        wrap.className = 'message bot';
        const avatar = document.createElement('div'); avatar.className='message-avatar'; avatar.textContent='AI';
        const content = document.createElement('div'); content.className='message-content';
        content.innerHTML = `
          <div style=\"max-width:320px\">
            <div style=\"font-weight:600;margin-bottom:6px;\">Select Date and Slot</div>
            <label style=\"display:block;font-size:14px;color:#374151;margin-bottom:6px;\">Pick a date (next 10 days)</label>
            <div id=\"inline-days\" style=\"display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px;\"></div>
            <label style=\"display:block;font-size:14px;color:#374151;margin:8px 0;\">Choose a 2-hour slot</label>
            <div id=\"inline-slots\"></div>
            <div style=\"display:flex;gap:8px;justify-content:flex-end;margin-top:10px;\">
              <button class=\"btn\" id=\"inline-confirm\">Confirm</button>
            </div>
          </div>`;
        wrap.appendChild(avatar); wrap.appendChild(content); chatMessages.appendChild(wrap); chatMessages.scrollTop = chatMessages.scrollHeight;

        const daysContainer = content.querySelector('#inline-days');
        const slotsContainer = content.querySelector('#inline-slots');
        const today = new Date(); const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
        // Build next 10 days buttons
        const days = [];
        for(let i=0;i<10;i++){ const d = new Date(tomorrow); d.setDate(tomorrow.getDate()+i); days.push(d); }
        let selectedDateStr = '';
        days.forEach((d, idx)=>{
          const btn = document.createElement('button');
          btn.type='button'; btn.className='btn';
          const y = d.getFullYear(); const m=String(d.getMonth()+1).padStart(2,'0'); const day=String(d.getDate()).padStart(2,'0');
          const label = d.toLocaleDateString(undefined,{month:'short',day:'numeric'});
          btn.textContent = label; btn.style.padding='6px 10px';
          const val = `${y}-${m}-${day}`;
          btn.onclick = ()=>{ selectedDateStr = val; Array.from(daysContainer.children).forEach(c=>c.classList.remove('selected')); btn.classList.add('selected'); render(); try{ const sc = content.querySelector('#inline-slots'); if(sc){ sc.scrollIntoView({ behavior:'smooth', block:'center' }); } }catch(_){ } };
          if(idx===0){ selectedDateStr = val; btn.classList.add('selected'); }
          daysContainer.appendChild(btn);
        });

        function render(){
            const dateStr = selectedDateStr; slotsContainer.innerHTML=''; if(!dateStr) return;
            const slots = [
              { label: '9:30 AM - 11:30 AM', start: { h:9, m:30 } },
              { label: '11:30 AM - 1:30 PM', start: { h:11, m:30 } },
              { label: '2:30 PM - 4:30 PM', start: { h:14, m:30 } },
              { label: '4:30 PM - 6:30 PM', start: { h:16, m:30 } }
            ];
            fetch(`${CONFIG.apiUrl}/get_slot_locks?date=${encodeURIComponent(dateStr)}&username=${encodeURIComponent(CONFIG.username||'')}&botId=${encodeURIComponent(CONFIG.botId||'')}`)
              .then(r=>r.json())
              .then(({locks})=>{
                slots.forEach(slot=>{
                  const btn = document.createElement('button'); btn.type='button'; btn.className='slot-btn'; btn.textContent=slot.label; btn.style.marginBottom='8px';
                  const [y, mm, dd] = dateStr.split('-').map(Number);
                  const local = new Date(y, mm-1, dd, slot.start.h, slot.start.m, 0, 0);
                  const isoLocal = local.toISOString();
                  const utc = new Date(isoLocal);
                  const slotKey = `${utc.getUTCFullYear()}${String(utc.getUTCMonth()+1).padStart(2,'0')}${String(utc.getUTCDate()).padStart(2,'0')}-${String(utc.getUTCHours()).padStart(2,'0')}${String(utc.getUTCMinutes()).padStart(2,'0')}`;
                  const status = locks ? locks[slotKey] : undefined; const isBooked = status && status !== 'cancelled';
                  if(isBooked){ btn.disabled = true; const b = document.createElement('span'); b.className='slot-status'; b.textContent='Booked'; btn.appendChild(b); }
                  else {
                    btn.onclick=()=>{ Array.from(slotsContainer.children).forEach(c=>c.classList.remove('selected')); btn.classList.add('selected'); appointmentState.slotStartISO = isoLocal; };
                    const b = document.createElement('span'); b.className='slot-status'; b.textContent='Available'; btn.appendChild(b);
                  }
                  slotsContainer.appendChild(btn);
                });
              })
              .catch(()=>{
                slots.forEach(slot=>{
                  const btn = document.createElement('button'); btn.type='button'; btn.className='slot-btn'; btn.textContent=slot.label; btn.style.marginBottom='8px';
                  btn.onclick=()=>{ Array.from(slotsContainer.children).forEach(c=>c.classList.remove('selected')); btn.classList.add('selected'); const [y,mm,dd] = dateStr.split('-').map(Number); const local = new Date(y,mm-1,dd,slot.start.h,slot.start.m,0,0); appointmentState.slotStartISO = local.toISOString(); };
                  slotsContainer.appendChild(btn);
                });
              });
        }
        render();
        content.querySelector('#inline-confirm').onclick = ()=>{ 
            if(!appointmentState.slotStartISO){ 
                alert('Please select a time slot.'); 
                return; 
            } 
            confirmAppointmentFromModal(); 
        };
    }

    // Lead capture (conversational)
    function startLeadFlow() {
        if (leadState.active) return;
        leadState.active = true;
        leadState.step = 0;
        leadState.data = { name: '', email: '', phone: '', message: '' };
        addMessage("Great! I can share your details with our team. What's your name?", false);
    }
    function handleLeadMessage(text) {
        const t = String(text || '').trim();
        if (!t) { addMessage('Please type a response.', false); return; }
        
        // Allow users to cancel at any time
        if (t.toLowerCase().includes('cancel') || t.toLowerCase().includes('stop')) {
            addMessage("No problem! Feel free to ask me anything else.", false);
            leadState.active = false;
            leadState.step = 0;
            leadState.data = { name: '', email: '', phone: '', message: '' };
            return;
        }

        if (leadState.step === 0) {
            leadState.data.name = t;
            leadState.step = 1;
            addMessage(`Thanks, ${t}! What's your email address? (You can say "skip" if you prefer not to share it)`, false);
            return;
        }
        
        if (leadState.step === 1) {
            if (t.toLowerCase() !== 'skip') {
                const looksLikeEmail = t.includes('@') && t.includes('.');
                const digits = t.replace(/\D/g, '');
                const hasDigits = digits.length > 0;
                
                // In step 1, we're asking for email, so be strict about email validation
                if (looksLikeEmail) {
                    leadState.data.email = t;
                    leadState.step = 2;
                    addMessage("Perfect! What's your phone number? (You can say 'skip' if you prefer not to share it)", false);
                    return;
                } else if (hasDigits) {
                    // If user enters digits in email step, ask them to provide email or skip
                    addMessage("Please enter a valid email address or say 'skip' if you prefer not to share your email.", false);
                    return;
                } else {
                    // Treat as email even if it doesn't look like one (for non-digit inputs)
                    leadState.data.email = t;
                    leadState.step = 2;
                    addMessage("Got it! What's your phone number? (You can say 'skip' if you prefer not to share it)", false);
                    return;
                }
            } else {
                leadState.step = 2;
                addMessage("No problem! What's your phone number? (You can say 'skip' if you prefer not to share it)", false);
                return;
            }
        }
        
        if (leadState.step === 2) {
            if (t.toLowerCase() !== 'skip') {
                // Validate Indian phone number - must be exactly 10 digits starting with 6, 7, 8, or 9
                const digits = t.replace(/\D/g, '');
                if (digits.length > 10) {
                    addMessage('Please enter a valid phone number.', false);
                    return;
                } else if (digits.length < 10) {
                    addMessage('Please enter a valid phone number.', false);
                    return;
                } else if (digits.length === 10 && /^[6-9]/.test(digits)) {
                    leadState.data.phone = t;
                } else if (digits.length === 10) {
                    addMessage('Please enter a valid phone number.', false);
                    return;
                } else {
                    addMessage('Please enter a valid phone number.', false);
                    return;
                }
            }
            
            // Only proceed if we have a valid phone number or user skipped
            // Check if we have at least one contact method
            if (!leadState.data.email && !leadState.data.phone) {
                addMessage('Please share at least one way to contact you (email or phone). What would you prefer?', false);
                leadState.step = 1;
                return;
            }
            
            leadState.step = 3;
            addMessage("Almost done! Any additional message for us? (You can say 'skip' to finish)", false);
            return;
        }
        
        if (leadState.step === 3) {
            if (t.toLowerCase() !== 'skip') {
                leadState.data.message = t;
            }
            
            // Submit the lead
            detectUsername();
            
            // Get authentication token
            const token = localStorage.getItem('token') || CONFIG.authToken;
            const headers = { 'Content-Type': 'application/json' };
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }
            
            fetch(`${CONFIG.apiUrl}/create_lead`, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({
                    name: leadState.data.name,
                    email: leadState.data.email,
                    phone: leadState.data.phone,
                    message: leadState.data.message,
                    username: CONFIG.username || '',
                    bot_id: CONFIG.botId || '',
                    session_id: sessionId
                })
            })
            .then(r => r.json())
            .then(data => {
                if (data && data.success) {
                    addMessage("Perfect! I've shared your details with our team. We'll reach out to you soon.", false);
                    setTimeout(()=>{ addMessage(getFollowupMessage(), false); }, 400);
                } else {
                    addMessage(String((data && data.message) || 'Failed to submit your details. Please try again.'), false);
                }
            })
            .catch(() => addMessage('Sorry, I couldn\'t submit your details due to a network error. Please try again later.', false))
            .finally(() => {
                leadState.active = false;
                leadState.step = 0;
                leadState.data = { name: '', email: '', phone: '', message: '' };
            });
        }
    }

    // Removed lead modal helpers and UI as per requirement to remove call option

    // Initialize widget
    function init() {
        createStyles();
        createWidget();
        
        // Load company configuration
        loadCompanyConfig();
        
        // TTS toggle
        const ttsBtn = document.getElementById('tts-button');
        if (ttsBtn) {
            CONFIG.textToSpeech = false; // start disabled
            ttsBtn.classList.remove('active');
            ttsBtn.addEventListener('click', () => {
                CONFIG.textToSpeech = !CONFIG.textToSpeech;
                if (CONFIG.textToSpeech) { ttsBtn.classList.add('active'); ttsBtn.textContent='🔊'; }
                else { ttsBtn.classList.remove('active'); ttsBtn.textContent='🔈'; window.speechSynthesis && window.speechSynthesis.cancel(); }
            });
        }
        // Theme toggle (persist like dashboard)
        try{
            const saved = localStorage.getItem('chatbot_theme') || 'dark';
            applyWidgetTheme(saved);
        }catch(_){ }
        const themeBtn = document.getElementById('chat-theme-toggle');
        if(themeBtn){ themeBtn.addEventListener('click', function(){
            const cur = (localStorage.getItem('chatbot_theme') || 'dark');
            applyWidgetTheme(cur === 'light' ? 'dark' : 'light');
        }); }
        
        // Refresh chat button
        const refreshBtn = document.getElementById('refresh-chat');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                // If feedback not given in this session, ask first, then refresh
                if (!FEEDBACK_GIVEN_SESSION) {
                    showFeedbackPrompt(function(){
                        doRefreshChat();
                    });
                } else {
                    doRefreshChat();
                }
            });
        }

        function doRefreshChat(){
            try { localStorage.removeItem('im_bot_feedback_asked'); } catch(_) {}
            // we intentionally keep im_bot_feedback_given so we don't prompt immediately on fresh chat
            FEEDBACK_GIVEN_SESSION = false;
            const msgs = document.getElementById('chat-messages');
            msgs.innerHTML = '';
            // Re-run company config welcome
            loadCompanyConfig();
            addMessage('Hi! I\'m here to help. How may I assist?', false);
        }

        // Add event listener for Enter key
        document.addEventListener('keydown', function(e) {
            if (isOpen && e.key === 'Enter' && e.target.id === 'user-input') {
                e.preventDefault();
                sendMessage();
            }
        });

        // Voice input setup
        if (CONFIG.speechInput) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (SpeechRecognition) {
                recognition = new SpeechRecognition();
                recognition.lang = 'en-US';
                recognition.interimResults = true;
                recognition.continuous = false;
                recognition.onresult = (event) => {
                    const transcript = Array.from(event.results).map(r => r[0].transcript).join('');
                    const input = document.getElementById('user-input');
                    input.value = transcript;
                    if (event.results[0].isFinal) {
                        stopListening();
                        sendMessage();
                    }
                };
                recognition.onend = () => { stopListening(); };

                const micBtn = document.getElementById('mic-button');
                if (micBtn) {
                    micBtn.addEventListener('click', () => {
                        if (isListening) { stopListening(); } else { startListening(); }
                    });
                }
            } else {
                const micBtn = document.getElementById('mic-button');
                if (micBtn) micBtn.style.display = 'none';
            }
        }
    }

    function startListening() {
        if (!recognition || isListening) return;
        isListening = true;
        const micBtn = document.getElementById('mic-button');
        if (micBtn) micBtn.classList.add('listening');
        try { recognition.start(); } catch (_) {}
    }
    function stopListening() {
        if (!recognition) return;
        isListening = false;
        const micBtn = document.getElementById('mic-button');
        if (micBtn) micBtn.classList.remove('listening');
        try { recognition.stop(); } catch (_) {}
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Export configuration for customization
    window.ChatbotWidget = {
        config: CONFIG,
        updateConfig: function(newConfig) {
            Object.assign(CONFIG, newConfig);
            // Recreate styles with new config
            const oldStyle = document.querySelector(`style`);
            if (oldStyle) oldStyle.remove();
            createStyles();
            // Reload company configuration if username changed
            if (newConfig.username) {
                loadCompanyConfig();
            }
            // If a welcomeMessage is provided directly, show it if no messages yet
            if (newConfig.welcomeMessage) {
                const chatMessages = document.getElementById('chat-messages');
                if (chatMessages && chatMessages.children.length === 0) {
                    addMessage(String(newConfig.welcomeMessage), false);
                }
            }
        },
        loadCompanyConfig: loadCompanyConfig,
        updateWidgetTheme: updateWidgetTheme
    };

})();
