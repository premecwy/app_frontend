<template>
  <div class="llm-page">
    <header class="topbar">
      <div class="container">
        <div class="topbar-content">
          <button class="back-btn" @click="$router.back()" aria-label="Go back">
            <svg viewBox="0 0 24 24" width="20" height="20">
              <path fill="currentColor" d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
            </svg>
          </button>
          <h1 class="page-title">LUMA Talk</h1>
          <div class="spacer"></div>
          <button class="settings-btn" @click="showTextArea = !showTextArea" :aria-pressed="showTextArea"
            aria-label="Keyboard">
            <svg viewBox="0 0 24 24" width="28" height="28">
              <path fill="currentColor"
                d="M20 5H4C2.9 5 2 5.9 2 7V17C2 18.1 2.9 19 4 19H20C21.1 19 22 18.1 22 17V7C22 5.9 21.1 5 20 5M20 17H4V7H20V17M5 8H7V10H5V8M8 8H10V10H8V8M11 8H13V10H11V8M14 8H16V10H14V8M17 8H19V10H17V8M5 11H7V13H5V11M8 11H10V13H8V11M11 11H13V13H11V11M14 11H16V13H14V11M17 11H19V13H17V11M8 14H16V16H8V14Z" />
            </svg>
          </button>
        </div>
      </div>
    </header>

    <main class="page">
      <div class="container">
        <div class="dog-container">
          <div v-if="!showTextArea" class="big-dog" :class="{ shake: isShaking }" @click="handleDogClick">🐶</div>

          <div v-if="showTextArea" class="chat-wrapper">
              <!-- Chat History Section -->
              <div class="chat-history" ref="chatHistory">
                <div v-if="messages.length === 0" class="empty-chat">
                  <div class="empty-icon">💬</div>
                  <p>Start a conversation with LUMA!</p>
      </div>
                <div v-else class="messages-list">
                  <div v-for="(msg, idx) in messages" :key="idx" class="message-row" :class="msg.role">
                    <div class="message-bubble">
                      <div class="message-content">{{ msg.content }}</div>
                    </div>
                  </div>
                  <div v-if="loading" class="message-row assistant">
                    <div class="message-bubble loading">
                      <div class="typing-indicator">
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Text Area Container -->
              <div class="text-area-container">
                <textarea v-model="messageText" class="message-input" placeholder="Type your message here..." rows="2"
                  @keyup.enter.ctrl="sendMessage"></textarea>
                <div class="text-area-actions">
                  <button class="btn-send" @click="sendMessage" :disabled="!messageText.trim()"
                    style="display: flex !important;">
                    <svg viewBox="0 0 24 24" width="20" height="20">
                      <path fill="currentColor" d="M2,21L23,12L2,3V10L17,12L2,14V21Z" />
                    </svg>
                    Send
                  </button>
                  <button class="btn-clear" @click="messageText = ''" style="display: flex !important;">Clear</button>
                </div>
              </div>
            </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script>
export default {
  name: 'LlmPage',
  data() {
    return {
      // Where to show result from chat and user
      url: localStorage.getItem('chat_url') || 'http://127.0.0.1:8000/chat',
      payloadKey: localStorage.getItem('chat_key') || 'text',
      timeoutMs: Number(localStorage.getItem('chat_timeout') || 1000000),
      showSettings: false,
      draft: '',
      loading: false,
      messages: [
        { role: 'user', content: 'Hello! Can you help me with my tasks today?' },
        { role: 'assistant', content: 'Of course! I\'d be happy to help you with your tasks. What would you like to work on first?' },
        { role: 'user', content: 'I need to organize my schedule for this week.' },
        { role: 'assistant', content: 'Great! Let me help you organize your schedule. You can start by telling me about your important tasks or deadlines this week, and I\'ll help you prioritize them.' },
        { role: 'user', content: 'I have a meeting on Wednesday and a project deadline on Friday.' },
        { role: 'assistant', content: 'Perfect! I\'ve noted that you have:\n\n1. Meeting on Wednesday\n2. Project deadline on Friday\n\nWould you like me to help you break down the project into smaller tasks to ensure you meet the Friday deadline?' },
      ],
      isShaking: false,
      showTextArea: false,
      messageText: '',
      mediaRecorder: null,
      isRecording: false,
    }
  },
  computed: {
    canSend() {
      // Adjusted to use the correct data property for the text area
      return this.messageText.trim().length > 0;
    },
  },
  methods: {
    async handleDogClick() {
      this.isShaking = true;
      setTimeout(() => (this.isShaking = false), 1000);

      if (this.isRecording) {
        if (this.mediaRecorder && this.mediaRecorder.state === "recording") {
          this.mediaRecorder.stop();
        }
        this.isRecording = false;
        console.log("🔁 stopping recording...");
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        this.mediaRecorder = new MediaRecorder(stream);
        let chunks = [];

        this.mediaRecorder.ondataavailable = (e) => {
          console.log("📦 chunk received:", e.data.size);
          chunks.push(e.data);
        };

        this.mediaRecorder.onstop = async () => {
          console.log("🛑 onstop called");
          const audioBlob = new Blob(chunks, { type: "audio/wav" });
          chunks = [];
          console.log("🎧 audio blob size:", audioBlob.size);

          if (audioBlob.size === 0) {
            console.warn("⚠️ Audio blob is empty, not sending.");
            return;
          }

          try {
            const formData = new FormData();
            formData.append("file", audioBlob, "audio.wav");
            console.log("🚀 sending to STT API...");

            const sttRes = await fetch("http://127.0.0.1:8000/stt", {
              method: "POST",
              body: formData,
            });

            if (!sttRes.ok) throw new Error(`STT server error! status: ${sttRes.status}`);
            const sttData = await sttRes.json();
            const recognizedText = sttData.text;

                  if (recognizedText) {
                    console.log("💬 recognized text:", recognizedText);
                    this.messages.push({ role: 'user', content: recognizedText });
                    this.$nextTick(() => {
                      this.scrollToBottom();
                    });

                    console.log('🚀 Sending to /chat API...');
                    const chatReply = await this.callApi(recognizedText);
                    this.messages.push({ role: 'assistant', content: chatReply });
                    console.log("🤖 LLM replied:", chatReply);
                    this.$nextTick(() => {
                      this.scrollToBottom();
                    });

              if (chatReply) {
                try {
                  console.log("▶️ Requesting TTS from server...");
                  const ttsRes = await fetch("http://localhost:8000/tts", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ message: chatReply }),
                  });
                  if (!ttsRes.ok) throw new Error(`TTS server responded with status ${ttsRes.status}`);

                  const ttsAudioBlob = await ttsRes.blob();
                  const audioUrl = URL.createObjectURL(ttsAudioBlob);
                  const audio = new Audio(audioUrl);
                  audio.play();
                  audio.onended = () => URL.revokeObjectURL(audioUrl);
                  console.log("🔊 Playing TTS audio for:", chatReply);

                } catch (ttsErr) {
                  console.warn("⚠️ TTS Error:", ttsErr);
                }
              }
            } else {
              alert("STT returned no text");
            }
          } catch (err) {
            console.error("❌ Error in onstop handler:", err);
            alert(`An error occurred: ${err.message}`);
          }
        };

        this.mediaRecorder.start();
        this.isRecording = true;
        console.log("🎙️ recording started...");

      } catch (err) {
        console.error("Mic error:", err);
        alert("Cannot access microphone.");
      }
    },

    async sendMessage() {
      const q = this.messageText.trim();
      if (!q) return;

      this.messages.push({ role: 'user', content: q });
      this.messageText = '';
      this.loading = true;
      
      this.$nextTick(() => {
        this.scrollToBottom();
      });

      try {
        const reply = await this.callApi(q);
        this.messages.push({ role: 'assistant', content: reply });
        this.$nextTick(() => {
          this.scrollToBottom();
        });
      } catch (e) {
        this.messages.push({ role: 'assistant', content: 'Request failed: ' + (e && e.message ? e.message : String(e)) });
        this.$nextTick(() => {
          this.scrollToBottom();
        });
      } finally {
        this.loading = false;
      }
    },
    
    scrollToBottom() {
      const chatHistory = this.$refs.chatHistory;
      if (chatHistory) {
        chatHistory.scrollTop = chatHistory.scrollHeight;
      }
    },

    persist() {
      localStorage.setItem('chat_url', this.url);
      localStorage.setItem('chat_key', this.payloadKey);
      localStorage.setItem('chat_timeout', String(this.timeoutMs));
    },

    uid() {
      return Date.now().toString(36) + '-' + Math.random().toString(36).slice(2);
    },

    push(role, text) {
      this.messages.push({ id: this.uid(), role, text: String(text) });
      this.$nextTick(() => {
        const el = this.$refs.scrollArea;
        if (el) el.scrollTop = el.scrollHeight;
      });
    },

    pickAnswer(obj) {
      if (obj && typeof obj === 'object') {
        if ('message' in obj && obj.message != null) return String(obj.message);
        if ('response' in obj && obj.response != null) return String(obj.response);
        if ('answer' in obj && obj.answer != null) return String(obj.answer);
        if ('text' in obj && obj.text != null) return String(obj.text);
        if ('output' in obj && obj.output != null) return String(obj.output);
        const c = Array.isArray(obj.choices) && obj.choices[0];
        if (c?.message?.content != null) return String(c.message.content);
        if (c?.text != null) return String(c.text);
        try {
          return JSON.stringify(obj, null, 2);
        } catch {
          return String(obj);
        }
      }
      return String(obj ?? '');
    },

    controllerWithTimeout(ms) {
      const ctrl = new AbortController();
      const id = setTimeout(() => {
        try {
          ctrl.abort(new DOMException('Timeout', 'AbortError'));
        } catch (e) {
          ctrl.abort();
        }
      }, ms);
      return { ctrl, cancel: () => clearTimeout(id) };
    },

    async callApi(q) {
      this.persist();
      console.log("⏱️ timeoutMs (before call):", this.timeoutMs);
      if (!this.timeoutMs|| this.timeoutMs < 100000){
        this.timeoutMs = 1000000; // 1000s
        localStorage.setItem('chat_timeout', String(this.timeoutMs));
        console.log("⚠️ timeoutMs was too low, reset to:", this.timeoutMs);
      }
      const t = this.controllerWithTimeout(this.timeoutMs);
      try {
        const res = await fetch(this.url, {
          method: 'POST',
          headers: {
            'Accept': 'application/json, text/plain, */*',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ [this.payloadKey || 'text']: q }),
          mode: 'cors',
          signal: t.ctrl.signal,
        });
        t.cancel();

        const ct = res.headers.get('content-type') || '';
        if (!res.ok) {
          let bodyText = '';
          try {
            if (ct.includes('application/json')) {
              const json = await res.json();
              bodyText = this.pickAnswer(json) || JSON.stringify(json, null, 2);
            } else {
              bodyText = await res.text();
            }
          } catch (e) { /* ignore parsing error */ }
          throw new Error('HTTP ' + res.status + ' ' + res.statusText + (bodyText ? '\n\n' + bodyText : ''));
        }

        if (ct.includes('application/json')) return this.pickAnswer(await res.json());
        const txt = await res.text();
        try {
          return this.pickAnswer(JSON.parse(txt));
        } catch {
          return txt;
        }
      } catch (e) {
        const hints = [];
        try {
          const u = new URL(this.url);
          if (location.protocol === 'https:' && u.protocol === 'http:') {
            hints.push('Mixed content: page is HTTPS but API is HTTP.');
          }
        } catch (er) { /* ignore url parsing error */ }
        hints.push('CORS: enable on FastAPI (allow_origins=[\"*\"]...).');
        hints.push('Check server is running and path is correct.');
        hints.push('Timeout: ' + this.timeoutMs + 'ms');
        throw new Error((e && e.message ? e.message : String(e)) + '\n\nHints:\n- ' + hints.join('\n- '));
      }
    },

    async handleSend() {
      const q = this.draft.trim();
      if (!q) return;
      this.push('user', q);
      this.draft = '';
      this.loading = true;
      try {
        const reply = await this.callApi(q);
        this.push('bot', reply);
      } catch (e) {
        this.push('bot', 'Request failed: ' + (e && e.message ? e.message : String(e)));
      } finally {
        this.loading = false;
        if (this.$refs.inputEl) this.$refs.inputEl.focus();
      }
    },

    async testConnection() {
      this.loading = true;
      try {
        const r = await this.callApi('__ping__');
        this.push('bot', 'Test OK: ' + r);
      } catch (e) {
        this.push('bot', 'Test failed: ' + (e && e.message ? e.message : String(e)));
      } finally {
        this.loading = false;
      }
    },
  },
  mounted() {
    // This ref does not exist in the new template, so we can comment it out
    // if (this.$refs.inputEl) this.$refs.inputEl.focus()
  }
}
</script>

<style scoped>
/* Enhanced Color Palette */
:root {
  --sand: #DCA47C;
  --peach: #FFD3B6;
  --ivory: #f7e0b8;
  --sage: #698474;
  --sageLight: #7A9A87;
  --white: #FFFFFF;
  --textDark: #1a1a1a;
  --textLight: #F7FBF9;
  --muted: #6B7280;
  --accent: #FF8FB0;
  --warning: #FFE45E;
  --success: #10B981;
  --error: #EF4444;
  --radius: 24px;
  --shadow: 0 8px 32px rgba(0, 0, 0, .06), 0 2px 8px rgba(0, 0, 0, .04);
  --shadow-lg: 0 12px 40px rgba(0, 0, 0, .12), 0 4px 12px rgba(0, 0, 0, .08);
}

/* Global background */
:global(html,
  body,
  #app) {
  background: var(--ivory) !important;
  color: var(--textDark) !important;
  /* min-height: 100vh; */
}

:global(html) {
  height: 100%;
}

:global(body) {
  height: 100%;
  margin: 0;
  padding: 0;
}

:global(#app) {
  min-height: 100vh;
  background: var(--ivory);
}

/* Page Layout */
.llm-page {
  min-height: 100vh;
  background: var(--ivory);
}

.container {
  width: min(1200px, 92vw);
  margin: 0 auto;
  padding: 0 16px;
}

/* Enhanced Topbar */
.topbar {
  position: sticky;
  top: 0;
  z-index: 50;
  background: linear-gradient(180deg, rgba(247, 224, 184, .95), rgba(247, 224, 184, .7));
  -webkit-backdrop-filter: blur(6px);
  backdrop-filter: blur(6px);
  padding: 10px 0;
}

.topbar-content {
  display: flex;
  align-items: center;
  gap: 16px;
  width: 100%;
  margin-top: 2%;
  padding: 0 0px;
}

/* Responsive adjustments for topbar */
@media (max-width: 768px) {
  .topbar-content {
    width: 60%;
    margin-top: 1%;
  }
}

@media (max-width: 480px) {
  .topbar-content {
    width: 80%;
    margin-top: 0.5%;
  }

  .page-title {
    font-size: clamp(18px, 4vw, 24px);
  }

  .back-btn,
  .settings-btn {
    width: 36px;
    height: 36px;
  }
}

.page {
  min-height: calc(100vh - 64px);
  padding: clamp(12px, 2.5vw, 24px) 0 48px;
  background: linear-gradient(180deg, rgba(247, 224, 184, .95), rgba(247, 224, 184, .7));
}

.back-btn {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background: var(--white);
  border: 2px solid var(--sage);
  color: var(--sage);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: var(--shadow);
}

.back-btn:hover {
  background: var(--sage);
  color: var(--white);
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.page-title {
  font-size: clamp(24px, 3vw, 32px);
  font-weight: 800;
  color: var(--textDark);
  margin: 0;
  text-align: center;
  flex-shrink: 0;
}

.spacer {
  flex: 1;
  min-width: 0;
}

.settings-btn {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background: var(--white);
  border: 2px solid var(--sage);
  color: var(--sage);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: var(--shadow);
}

.settings-btn:hover {
  background: var(--sage);
  color: var(--white);
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}


/* Enhanced Cards */
.card {
  background: var(--white);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  border: none;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.card:hover {
  box-shadow: var(--shadow-lg);
}

/* Settings Popup */

.popup-container {
  position: absolute;
  top: 60px;
  right: 16px;
  background: var(--white);
  border-radius: 16px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  max-width: 400px;
  width: 100%;
  max-height: 70vh;
  overflow: hidden;
  animation: slideInRight 0.3s ease-out;
  border: 2px solid var(--sage);
  z-index: 1000;
}

.popup-container::before {
  content: '';
  position: absolute;
  top: -8px;
  right: 20px;
  width: 16px;
  height: 16px;
  background: var(--white);
  border: 2px solid var(--sage);
  border-bottom: none;
  border-right: none;
  transform: rotate(45deg);
  z-index: 1;
}

.popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px 16px;
  background: linear-gradient(135deg, var(--sage) 0%, #7A9A87 100%);
  color: var(--white);
}

.popup-title {
  font-size: 20px;
  font-weight: 700;
  margin: 0;
  color: var(--white);
}

.popup-content {
  padding: 24px;
  max-height: 50vh;
  overflow-y: auto;
}

.popup-footer {
  padding: 16px 24px 20px;
  background: #f8fafc;
  border-top: 1px solid #e2e8f0;
  display: flex;
  justify-content: flex-end;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(100%);
  }

  to {
    opacity: 1;
    transform: translateX(0);
  }
}


.close-btn {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  color: var(--white);
  border: 1px solid rgba(255, 255, 255, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  border-color: rgba(255, 255, 255, 0.5);
  transform: scale(1.1);
}

.form-group {
  margin-bottom: 24px;
}

.form-label {
  display: block;
  font-weight: 600;
  color: var(--textDark);
  margin-bottom: 8px;
  font-size: 14px;
}

.form-input {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-size: 16px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background: var(--white);
}

.form-input:focus {
  outline: none;
  border-color: var(--sage);
  box-shadow: 0 0 0 3px rgba(105, 132, 116, 0.1);
}

.form-input::placeholder {
  color: #94a3b8;
}


.form-label {
  font-size: 16px;
  font-weight: 600;
  color: var(--textDark);
}

.form-input {
  padding: 12px 16px;
  border: 2px solid #E5E7EB;
  border-radius: 12px;
  font-size: 16px;
  background: var(--white);
  color: var(--textDark);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.form-input:focus {
  outline: none;
  border-color: var(--sage);
  box-shadow: 0 0 0 4px rgba(105, 132, 116, 0.15);
}

.settings-actions {
  display: flex;
  justify-content: center;
  margin-top: 16px;
}

.btn-test {
  padding: 12px 24px;
  background: linear-gradient(135deg, var(--sage) 0%, var(--sageLight) 100%);
  color: var(--white);
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
}

.btn-test:hover:not(:disabled) {
  background: linear-gradient(135deg, var(--sageLight) 0%, #5a7a6a 100%);
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(105, 132, 116, 0.3);
}

.btn-test:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

/* Loading Spinner */
.loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid transparent;
  border-top: 2px solid currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Chat Section */
/* Dog Container */
.dog-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  gap: 24px;
  min-height: calc(100vh - 150px);
  width: 100%;
  padding: 20px;
  padding-top: 60px;
}

.big-dog {
  font-size: clamp(150px, 25vw, 300px);
  line-height: 1;
  user-select: none;
  cursor: pointer;
  transition: transform 0.3s ease;
  animation: float 3s ease-in-out infinite;
  margin-top: 100px;
}

.big-dog:hover {
  transform: scale(1.1);
}

.big-dog:active {
  transform: scale(0.95);
}

/* Shake Animation */
.big-dog.shake {
  animation: shake 0.6s cubic-bezier(0.36, 0.07, 0.19, 0.97) both, vibrate 0.6s ease-in-out;
}

@keyframes shake {

  0%,
  100% {
    transform: translateX(0) rotate(0deg) scale(1);
  }

  10%,
  30%,
  50%,
  70%,
  90% {
    transform: translateX(-15px) rotate(-5deg) scale(1.1);
  }

  20%,
  40%,
  60%,
  80% {
    transform: translateX(15px) rotate(5deg) scale(1.1);
  }
}

@keyframes pulse {
  0% {
    filter: drop-shadow(0 0 0 rgba(105, 132, 116, 0.9)) brightness(1);
  }

  50% {
    filter: drop-shadow(0 0 40px rgba(105, 132, 116, 0.6)) brightness(1.3);
  }

  100% {
    filter: drop-shadow(0 0 0 rgba(105, 132, 116, 0)) brightness(1);
  }
}

@keyframes vibrate {

  0%,
  100% {
    transform: translate(0, 0);
  }

  10% {
    transform: translate(-2px, 2px);
  }

  20% {
    transform: translate(2px, -2px);
  }

  30% {
    transform: translate(-2px, -2px);
  }

  40% {
    transform: translate(2px, 2px);
  }

  50% {
    transform: translate(-2px, 2px);
  }

  60% {
    transform: translate(2px, -2px);
  }

  70% {
    transform: translate(-2px, -2px);
  }

  80% {
    transform: translate(2px, 2px);
  }

  90% {
    transform: translate(-2px, 2px);
  }
}

@keyframes float {

  0%,
  100% {
    transform: translateY(0px);
  }

  50% {
    transform: translateY(-15px);
  }
}

/* Chat Wrapper */
.chat-wrapper {
  width: 100%;
  max-width: 800px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* Chat History */
.chat-history {
  width: 100%;
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border: 3px solid var(--sage);
  border-radius: 24px;
  padding: 24px;
  box-shadow: var(--shadow-lg);
  max-height: 400px;
  min-height: 200px;
  overflow-y: auto;
  scroll-behavior: smooth;
}

/* Custom Scrollbar for Chat History */
.chat-history::-webkit-scrollbar {
  width: 8px;
}

.chat-history::-webkit-scrollbar-track {
  background: rgba(105, 132, 116, 0.1);
  border-radius: 10px;
}

.chat-history::-webkit-scrollbar-thumb {
  background: var(--sage);
  border-radius: 10px;
  transition: background 0.3s ease;
}

.chat-history::-webkit-scrollbar-thumb:hover {
  background: var(--sageLight);
}

.empty-chat {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 150px;
  color: var(--muted);
  text-align: center;
}

.empty-chat .empty-icon {
  font-size: 48px;
  margin-bottom: 12px;
  opacity: 0.8;
}

.empty-chat p {
  font-size: 16px;
  margin: 0;
  font-weight: 500;
}

.messages-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* Text Area Container */
.text-area-container {
  width: 100%;
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border: 3px solid var(--sage);
  border-radius: 24px;
  padding: 24px;
  box-shadow: var(--shadow-lg);
}

.message-input {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid rgba(105, 132, 116, 0.3);
  border-radius: 16px;
  font-size: 16px;
  font-family: inherit;
  color: var(--textDark);
  background: white;
  resize: vertical;
  min-height: 60px;
  transition: all 0.3s ease;
}

.message-input:focus {
  outline: none;
  border-color: var(--sage);
  box-shadow: 0 0 0 4px rgba(105, 132, 116, 0.15);
}

.message-input::placeholder {
  color: var(--muted);
}

.text-area-actions {
  display: flex;
  gap: 12px;
  margin-top: 16px;
  justify-content: center;
  align-items: center;
}

.btn-send,
.btn-clear {
  padding: 12px 24px;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  border: 2px solid;
}

.btn-send {
  background: black;
  color: white;
  /* border-color: var(--sage); */
}

.btn-send:hover:not(:disabled) {
  background: black;
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(105, 132, 116, 0.3);
}

.btn-send:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-clear {
  background: transparent;
  color: var(--muted);
  border-color: rgba(105, 132, 116, 0.3);
}

.btn-clear:hover {
  background: rgba(105, 132, 116, 0.1);
  border-color: var(--sage);
  color: var(--sage);
}

/* Slide Up Transition */
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s ease;
}

.slide-up-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.slide-up-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

/* Fade Transition for Dog */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Empty State */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 60px 20px;
  color: var(--muted);
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
  opacity: 0.8;
}

.empty-state h3 {
  font-size: 24px;
  font-weight: 700;
  color: var(--textDark);
  margin: 0 0 8px 0;
}

.empty-state p {
  font-size: 16px;
  margin: 0;
}

/* Message Rows */
.message-row {
  display: flex;
  margin: 0;
  animation: fadeInMessage 0.3s ease-out;
}

@keyframes fadeInMessage {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.message-row.user {
  justify-content: flex-end;
}

.message-row.assistant,
.message-row.bot {
  justify-content: flex-start;
}

.message-bubble {
  max-width: 75%;
  padding: 12px 16px;
  border-radius: 18px;
  line-height: 1.5;
  white-space: pre-wrap;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: all 0.2s ease;
}

.message-row.user .message-bubble {
  background: linear-gradient(135deg, var(--sage) 0%, var(--sageLight) 100%);
  color: var(--white);
  border-bottom-right-radius: 4px;
}

.message-row.assistant .message-bubble,
.message-row.bot .message-bubble {
  background: var(--white);
  color: var(--textDark);
  border: 2px solid var(--peach);
  border-bottom-left-radius: 4px;
}

.message-bubble:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
}

.message-content {
  word-wrap: break-word;
  word-break: break-word;
}

/* Loading State */
.message-bubble.loading {
  display: flex;
  align-items: center;
  gap: 12px;
}

.typing-indicator {
  display: flex;
  gap: 4px;
}

.typing-indicator span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--sage);
  animation: typing 1.4s infinite ease-in-out;
}

.typing-indicator span:nth-child(1) {
  animation-delay: -0.32s;
}

.typing-indicator span:nth-child(2) {
  animation-delay: -0.16s;
}

@keyframes typing {

  0%,
  80%,
  100% {
    transform: scale(0.8);
    opacity: 0.5;
  }

  40% {
    transform: scale(1);
    opacity: 1;
  }
}

.loading-text {
  color: var(--muted);
  font-style: italic;
}

/* Composer Container */
.composer-container {
  padding: 20px;
  background: var(--white);
  border-top: 2px solid var(--sage);
  border-bottom-left-radius: var(--radius);
  border-bottom-right-radius: var(--radius);
}

.composer {
  max-width: 800px;
  margin: 0 auto;
}

.input-wrapper {
  display: flex;
  gap: 12px;
  align-items: center;
}

.composer-input {
  flex: 1;
  padding: 16px 20px;
  border: 2px solid #E5E7EB;
  border-radius: 25px;
  font-size: 16px;
  background: var(--white);
  color: var(--textDark);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  resize: none;
}

.composer-input:focus {
  outline: none;
  border-color: var(--sage);
  box-shadow: 0 0 0 4px rgba(105, 132, 116, 0.15);
}

.composer-input::placeholder {
  color: var(--muted);
}

.send-btn {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--sage) 0%, var(--sageLight) 100%);
  color: var(--white);
  border: 2px solid var(--sage);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: var(--shadow);
}

.send-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, var(--sageLight) 0%, #5a7a6a 100%);
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.send-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

/* Responsive Design */
@media (max-width: 768px) {
  .topbar-content {
    width: 100%;
    margin-top: 1%;
  }


  .chat-section {
    height: calc(100vh - 130px);
  }

  .chat-messages {
    padding: 16px;
  }

  .composer-container {
    padding: 16px;
  }

  .message-bubble {
    max-width: 95%;
  }
}

@media (max-width: 480px) {
  .topbar-content {
    width: 100%;
    margin-top: 0.5%;
  }

  .page-title {
    font-size: clamp(18px, 4vw, 24px);
  }

  .circle-btn,
  .back-btn,
  .settings-btn {
    width: 36px;
    height: 36px;
  }

  .popup-overlay {
    padding: 60px 10px 10px;
  }

  .popup-container {
    max-width: 350px;
  }

  .popup-header {
    padding: 16px 20px 12px;
  }

  .popup-title {
    font-size: 18px;
  }

  .popup-content {
    padding: 20px;
  }

  .popup-footer {
    padding: 12px 20px 16px;
  }


  .chat-section {
    height: calc(100vh - 110px);
  }

  .chat-messages {
    padding: 12px;
  }

  .composer-container {
    padding: 12px;
  }

  .composer-input {
    padding: 14px 16px;
    font-size: 16px;
  }

  .send-btn {
    width: 44px;
    height: 44px;
  }
}

/* Accessibility */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

/* Focus states */
.back-btn:focus-visible,
.settings-btn:focus-visible,
.close-btn:focus-visible,
.btn-test:focus-visible,
.send-btn:focus-visible {
  outline: 2px solid var(--sage);
  outline-offset: 2px;
}
</style>