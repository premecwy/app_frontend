<template>
	<div class="llm-page">
		<header class="topbar">
			<div class="container">
				<div class="topbar-content">
					<button class="back-btn" @click="$router.back()" aria-label="Go back">
						<svg viewBox="0 0 24 24" width="20" height="20">
							<path fill="currentColor"
								d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
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
				<div v-if="!showTextArea" class="big-dog" :class="{ shake: isShaking, recording: isRecording }" @click="handleDogClick">
					<img src="../src/assets/pic.png" alt="Assistant" class="dog-image" />
					<div v-if="isRecording" class="recording-indicator">
						<!-- <div class="recording-pulse"></div> -->
						<span class="recording-text">Recording...</span>
					</div>
				</div>
				<div v-if="!showTextArea && lastUserMessage" class="user-speech-text">{{ lastUserMessage }}</div>

				<div v-if="showTextArea" class="chat-wrapper">
						<!-- Chat History -->
						<div class="chat-history" ref="chatHistory">
							<div v-if="messages.length === 0" class="empty-chat">
								<div class="empty-icon">💬</div>
								<p>Start a conversation with LUMA!</p>
							</div>

							<div v-else class="messages-list">
								<div v-for="(msg, idx) in messages" :key="idx" class="message-row" :class="msg.role">
									<div class="message-bubble" :class="{ 'has-pending-audio': msg.hasPendingAudio }" 
										@click="msg.hasPendingAudio && playPendingAudio()">
										<div class="message-content">{{ msg.content }}</div>
									</div>
								</div>

								<div v-if="loading" class="message-row assistant">
									<div class="message-bubble loading">
										<div class="typing-indicator">
											<span></span><span></span><span></span>
										</div>
									</div>
								</div>

								<!-- ✅ ปุ่มยืนยันเพิ่มซ้ำ -->
								<div v-if="pendingDuplicate" class="duplicate-confirm">
									<!-- <p class="duplicate-message">พบรายการซ้ำ ต้องการเพิ่มงานนี้อีกครั้งหรือไม่?</p> -->
									<div class="duplicate-buttons">
										<button @click="confirmDuplicate" class="btn-confirm">
											ยืนยันเพิ่มซ้ำ
										</button>
										<button @click="cancelDuplicate" class="btn-cancel">
											ยกเลิก
										</button>
									</div>
								</div>
							</div>
						</div>

						<!-- Text Area -->
						<div class="text-area-container">
							<textarea v-model="messageText" class="message-input"
								placeholder="Type your message here..." rows="2" @keyup.enter.ctrl="sendMessage"></textarea>

							<div class="text-area-actions">
								<button class="btn-send" @click="sendMessage" :disabled="!messageText.trim()">
									<svg viewBox="0 0 24 24" width="20" height="20">
										<path fill="currentColor" d="M2,21L23,12L2,3V10L17,12L2,14V21Z" />
									</svg>
									Send
								</button>
								<button class="btn-clear" @click="messageText = ''">Clear</button>
							</div>
						</div>
					</div>
				</div>
			</div>
		</main>
	</div>
</template>

<script>
import axios from 'axios'
export default {
  
  name: 'LlmPage',
  data() {
  return {
    url: 'https://lumaai-backend-672244117841.asia-southeast1.run.app/api/llm/',
    token: localStorage.getItem('chat_token') || "",
    payloadKey: localStorage.getItem('chat_key') || 'text',
    timeoutMs: Number(localStorage.getItem('chat_timeout') || 1000000),
    showSettings: false,
    draft: '',
    loading: false,
    messages: [],
    isShaking: false,
    showTextArea: false,
    messageText: '',
    mediaRecorder: null,
    isRecording: false,
    pendingDuplicate: null, // 🆕 สำหรับเก็บ payload งานซ้ำ
    lastUserMessage: '', // 🆕 เก็บข้อความล่าสุดของผู้ใช้
    // TTS Efficiency Settings
    ttsSpeed: Number(localStorage.getItem('tts_speed') || 1.0), // Playback speed (0.5-2.0)
    ttsPitch: Number(localStorage.getItem('tts_pitch') || 1.0), // Pitch (0.5-2.0)
    ttsRate: Number(localStorage.getItem('tts_rate') || 1.0), // Speech rate for API (0.5-2.0)
    ttsVolume: Number(localStorage.getItem('tts_volume') || 1.0), // Volume (0.0-1.0)
    ttsCache: new Map(), // Cache for TTS audio to avoid re-fetching
    pendingTTSAudio: null, // Store audio that failed to play due to autoplay restriction
    pendingTTSText: '', // Store text for pending TTS
    audioUnlocked: false, // Track if audio is unlocked for autoplay
  }
},
computed: {
  canSend() {
    return this.messageText.trim().length > 0;
  },
  // Debug computed to check pendingDuplicate
  debugPendingDuplicate() {
    console.log("🔍 DEBUG computed: pendingDuplicate =", this.pendingDuplicate);
    console.log("🔍 DEBUG computed: pendingDuplicate is truthy?", !!this.pendingDuplicate);
    return this.pendingDuplicate;
  },
},
watch: {
  pendingDuplicate(newVal, oldVal) {
    console.log("🔍 DEBUG watcher: pendingDuplicate changed");
    console.log("🔍 DEBUG watcher: old value =", oldVal);
    console.log("🔍 DEBUG watcher: new value =", newVal);
    console.log("🔍 DEBUG watcher: new value is truthy?", !!newVal);
    console.log("🔍 DEBUG watcher: new value type =", typeof newVal);
  },
},
methods: {
  // --- Lifecycle & Auth ---

  async fetchBackendToken() {
    try {
      // Use existing token from localStorage if available
      const existingToken = localStorage.getItem('chat_token');
      if (existingToken) {
        this.token = existingToken;
        console.log("✅ Using existing token from storage");
      }
      
      // Try to fetch new token (with timeout handling)
      try {
        const res = await axios.get("https://luma-model-local.bkkz.org/api/auth/token", {
          timeout: 60000 // 60 seconds
        });
      const token = res.data?.access_token;
        if (token) {
      this.token = token;
      localStorage.setItem('chat_token', token);
          console.log("✅ New access token loaded:", token.slice(0, 20) + "...");
        }
      } catch (fetchError) {
        // Timeout or network error - not critical if we have existing token
        if (existingToken) {
          console.log("ℹ️ Token refresh timeout, using existing token");
        } else {
          console.warn("⚠️ Failed to fetch access token (no existing token):", fetchError.message);
        }
      }
    } catch (e) {
      // Only log if we don't have a fallback token
      if (!localStorage.getItem('chat_token')) {
      console.error("❌ Failed to fetch access token:", e);
      }
    }
  },

  // --- Core Chat Flow ---

  async sendMessage() {
    if (!this.token) await this.fetchBackendToken();
    const q = this.messageText.trim();
    if (!q) return;

    // 💬 แสดงข้อความผู้ใช้บนจอ
    this.messages.push({
      role: "user",
      content: q
    });
    this.lastUserMessage = q;
    this.messageText = '';
    this.loading = true;
    this.$nextTick(() => this.scrollToBottom());
    //ดัก keyword
    const keywordGroups = [
      { keys: ["เพิ่ม", "เพิ่มงาน"], hint: 'คุณต้องการเพิ่มงานอะไรคะ เช่น "เพิ่มงานประชุม"' },
      { keys: ["หา", "ค้นหา"], hint: 'คุณต้องการค้นหาอะไรคะ  เช่น "หาข้อมูลโปรเจกต์ AI"' },
      { keys: ["แพลน", "วางแผน"], hint: 'กรุณาพูด"วางแผน"ต่อด้วยแพลนที่อยากจัด เช่น "แพลนเที่ยวปีใหม่"' },
      { keys: ["ลบ", "ลบงาน"], hint: 'กรุณาพูด"ลบ"ต่อด้วยงานที่อยากลบ เช่น "ลบงานประชุมตอนเช้า"' },
      { keys: ["ตรวจสอบ", "เช็ค"], hint: 'กรุณาพูด"ตรวจสอบ"ต่อด้วยงานที่อยากตรวจสอบ เช่น "ตรวจสอบงานที่ยังไม่เสร็จ"' },
      { keys: ["แก้ไข", "แก้งาน"], hint: 'กรุณาพูด"แก้ไข้"ต่อด้วยงานที่อยากแก้และแก้เป็นอะไร เช่น "แก้ไขงานประชุมเป็น จัดแข่งกีฬา"' },
    ];
    for (const group of keywordGroups) {
      for (const key of group.keys) {
        const regex = new RegExp(`^${key}(\\s+.+)?$`);
        const match = q.match(regex);
        if (match) {
          const hasExtra = match[1] && match[1].trim().length > 0;
          if(!hasExtra){
            this.messages.push({
            role: "assistant",
            content: `⚠️ ${group.hint}`,
          });
          this.$nextTick(() => this.scrollToBottom());
          this.loading = false;
          return;
          }
        }
      }
    }

    try {
      // ✅ Payload ที่จะส่ง
      const payload = {
        text: q
      };
      console.log("📡 Sending to:", this.url);
      console.log("📦 Payload:", payload);

      // ✅ ส่งคำขอไปยัง Cloud Run โดยตรง
      const res = await axios.post(
        "https://lumaai-backend-672244117841.asia-southeast1.run.app/api/llm/",
        payload, {
          timeout: this.timeoutMs,
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${this.token}`,
          },
        }
      );

      let response = res.data; // <--- แก้ไข: ใช้ let แทน const
      console.log("DEBUG 1: RAW RESPONSE DATA:", JSON.stringify(response, null, 2));
      // ตรวจสอบว่า response.results มีอยู่จริงหรือไม่
      console.log("DEBUG 2: Checking response.results...", response?.results);

      if (typeof response === 'string') {
        try {
          console.log("DEBUG: Response was a string. Attempting JSON.parse()...");
          response = JSON.parse(response);
        } catch (e) {
          console.error("DEBUG: Failed to parse string response!", e);
          // ถ้า parse พัง, ก็ใช้ string เดิมไป (เพื่อไปเข้า else)
        }
      }

      console.log("DEBUG 2: response.results is Array?", Array.isArray(response?.results));

      // 🆕 Handle กรณี intent = "SEARCH" หรือข้อความเดี่ยวจาก LLM
      if (!response.results || response.results.length === 0) {
        // ถ้า backend ส่งผลลัพธ์เดี่ยว (ไม่ได้อยู่ใน results array)
        const replyText = response.result || response.message || response.reply || response.text || JSON.stringify(response);
        this.messages.push({
          role: "assistant",
          content: replyText || "ไม่พบข้อมูลจากการค้นหา 🤔",
        });
        this.$nextTick(() => this.scrollToBottom());
        return; // ❗️ออกเลย ไม่ต้องเข้า loop ด้านล่าง
      }

      // === ✅ ตอบกลับจาก Backend ===
      // (ถ้ามี results)
      for (const item of response.results) {
        // 🆕 Intent: SEARCH
        if (item.intent === "SEARCH") {
          console.log("🧠 DEBUG: Intent SEARCH detected:", item.message);
          this.messages.push({
            role: "assistant",
            content: item.message || item.result || "ไม่พบข้อมูลจากการค้นหา 🤔",
          });
          this.$nextTick(() => this.scrollToBottom());
          continue; // ➡️ ข้ามไป intent ถัดไปเลย
        }

        if (item.intent === "CHECK") {
          if (item.output?.length > 0) {
            this.messages.push({
              role: "assistant",
              content: "🧾 งานที่ตรวจพบ:",
            });
            item.output.forEach(task => {
              if (task.id !== "-1") {
                this.messages.push({
                  role: "assistant",
                  content: `• ${task.title || task.name || JSON.stringify(task)}`,
                });
              }
            });

            // 🟢 ถามต่อเลยว่า จะเพิ่มซ้ำไหม
            this.messages.push({
              role: "assistant",
              content: "พบรายการนี้อยู่แล้ว ต้องการเพิ่มซ้ำไหมครับ?",
            });
            // เก็บไว้ให้ปุ่ม confirmDuplicate ใช้
            console.log("🔍 DEBUG: CHECK intent - item.output:", item.output);
            console.log("🔍 DEBUG: CHECK intent - item.output length:", item.output?.length);
            // Log each task in output to see structure
            if (item.output && item.output.length > 0) {
              item.output.forEach((task, index) => {
                console.log(`🔍 DEBUG: CHECK intent - item.output[${index}]:`, task);
                console.log(`🔍 DEBUG: CHECK intent - item.output[${index}].id:`, task.id);
                console.log(`🔍 DEBUG: CHECK intent - item.output[${index}].id type:`, typeof task.id);
                console.log(`🔍 DEBUG: CHECK intent - item.output[${index}].id === "-1":`, task.id === "-1");
                console.log(`🔍 DEBUG: CHECK intent - item.output[${index}].id == "-1":`, task.id == "-1");
                console.log(`🔍 DEBUG: CHECK intent - String(item.output[${index}].id):`, String(task.id));
              });
            }
            // Try multiple ways to find duplicate
            const duplicateTask = item.output.find(t => {
              // Try exact match
              if (t.id === "-1") return true;
              // Try string conversion
              if (String(t.id) === "-1") return true;
              // Try number comparison
              if (Number(t.id) === -1) return true;
              return false;
            });
            console.log("🔍 DEBUG: CHECK intent - duplicateTask found:", duplicateTask);
            // If still not found, use the first item in output if it exists
            if (!duplicateTask && item.output && item.output.length > 0) {
              console.log("🔍 DEBUG: CHECK intent - No task with id='-1' found, using first item in output");
              this.pendingDuplicate = item.output[0];
            } else {
              this.pendingDuplicate = duplicateTask;
            }
            console.log("🔍 DEBUG: CHECK intent - pendingDuplicate set to:", this.pendingDuplicate);
            console.log("🔍 DEBUG: CHECK intent - typeof pendingDuplicate:", typeof this.pendingDuplicate);
            console.log("🔍 DEBUG: CHECK intent - pendingDuplicate is truthy?", !!this.pendingDuplicate);
          } else {
            this.messages.push({
              role: "assistant",
              content: "ตรวจสอบแล้ว ไม่พบบันทึกที่เกี่ยวข้องครับ ✅",
            });
          }
        }
        if (item.intent === "ADD") {
          this.messages.push({
            role: "assistant",
            content: item.message || "เพิ่มงานให้คุณแล้วครับ :D",
          });
        }
        if (item.intent === "EDIT") {
          this.messages.push({
            role: "assistant",
            content: item.message || "แก้ไขงานให้คุณแล้วครับ :D",
          });
        }
        if (item.intent === "REMOVE") {
          this.messages.push({
            role: "assistant",
            content: item.message || "ลบงานให้คุณแล้วครับ :D",
          });
        }
        if (item.intent === "EXIT") {
          this.messages.push({
            role: "assistant",
            content: item.message || "สิ้นสุดการทำงานแล้วครับ 👋",
          });
        }
      }

    } catch (e) {
      console.error("❌ Send error:", e);
      this.messages.push({
        role: "assistant",
        content: "⚠️ เกิดข้อผิดพลาดขณะเชื่อมต่อเซิร์ฟเวอร์ ลองใหม่อีกครั้งครับ",
      });
    } finally {
      this.loading = false;
      this.$nextTick(() => this.scrollToBottom());
    }
  },

  // --- Audio Flow (STT/TTS) ---

  async handleDogClick() {
    // Unlock audio for autoplay on user interaction
    this.unlockAudio();
    
    this.isShaking = true;
    setTimeout(() => (this.isShaking = false), 2000);

    // ถ้ากำลังอัด → หยุดอัด
    if (this.isRecording) {
      if (this.mediaRecorder && this.mediaRecorder.state === "recording") {
        this.mediaRecorder.stop();
        // Play recording stop sound
        this.playRecordingSound(false);
      }
      this.isRecording = false;
      return;
    }

    try {
      // ขอสิทธิ์ไมค์
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true
      });
      this.mediaRecorder = new MediaRecorder(stream);
      let chunks = [];

      this.mediaRecorder.ondataavailable = (e) => chunks.push(e.data);

      this.mediaRecorder.onstop = async () => {
        // Play recording stop sound and update state
        this.playRecordingSound(false);
        this.isRecording = false;
        
        const audioBlob = new Blob(chunks, {
          type: "audio/wav"
        });
        chunks = [];
        
        console.log("🔍 Audio blob size:", audioBlob.size, "bytes");
        
        if (audioBlob.size === 0) {
          console.warn("⚠️ Audio blob is empty - no audio recorded");
          this.messages.push({
            role: "assistant",
            content: "⚠️ ไม่สามารถบันทึกเสียงได้ กรุณาลองอีกครั้ง",
          });
          this.$nextTick(() => this.scrollToBottom());
          this.playTTS("ไม่สามารถบันทึกเสียงได้ กรุณาลองอีกครั้ง");
          return;
        }
        
        // Check if audio is too small (might be just silence)
        if (audioBlob.size < 1000) {
          console.warn("⚠️ Audio blob too small:", audioBlob.size, "bytes - might be silence");
        }

        const formData = new FormData();
        formData.append("file", audioBlob, "audio.wav");

        try {
          // 🧠 1️⃣ ส่งไฟล์เสียงไป /stt เพื่อแปลงเสียงเป็นข้อความ
          console.log("🔍 Sending audio to STT, size:", audioBlob.size, "bytes");
          
          let sttRes;
          try {
            sttRes = await fetch("https://luma-model-local.bkkz.org/stt", {
            method: "POST",
            body: formData,
          });
            console.log("🔍 STT Response status:", sttRes.status, sttRes.statusText);
          } catch (fetchError) {
            // Network error (server unreachable, CORS, etc.)
            console.error("❌ STT Network Error:", fetchError);
            this.messages.push({
              role: "assistant",
              content: "⚠️ ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์แปลงเสียงได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต",
            });
            this.$nextTick(() => this.scrollToBottom());
            this.playTTS("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์แปลงเสียงได้");
            return; // Stop here, don't continue to LLM
          }

          // Check content-type first to determine how to parse
          const contentType = sttRes.headers.get("content-type") || "";
          let sttData;

          // Check if response is OK
          if (!sttRes.ok) {
            // Read error response for logging (check content-type first to avoid JSON parse errors)
            try {
              if (contentType.includes("application/json")) {
                const errorData = await sttRes.json();
                console.error("❌ STT Error (JSON):", sttRes.status, errorData);
              } else {
                const errorText = await sttRes.text();
                console.error("❌ STT Error (Text):", sttRes.status, errorText);
              }
            } catch (e) {
              console.error("❌ STT Error: Could not read error response", e);
            }
            this.messages.push({
              role: "assistant",
              content: `⚠️ เกิดข้อผิดพลาดในการแปลงเสียง (${sttRes.status}) กรุณาลองอีกครั้ง`,
            });
            this.$nextTick(() => this.scrollToBottom());
            return;
          }

          // Response is OK, parse as JSON
          if (contentType.includes("application/json")) {
            try {
              sttData = await sttRes.json();
            } catch (jsonError) {
              console.error("❌ STT JSON Parse Error:", jsonError);
              this.messages.push({
                role: "assistant",
                content: "⚠️ ไม่สามารถประมวลผลการแปลงเสียงได้ กรุณาลองอีกครั้ง",
              });
              this.$nextTick(() => this.scrollToBottom());
              return;
            }
          } else {
            // Non-JSON response (shouldn't happen for STT, but handle it)
            console.error("❌ STT: Unexpected non-JSON response");
            this.messages.push({
              role: "assistant",
              content: "⚠️ ไม่สามารถแปลงเสียงเป็นข้อความได้ กรุณาลองอีกครั้ง",
            });
            this.$nextTick(() => this.scrollToBottom());
            return;
          }

          // Extract text from STT response (handle different response formats)
          let recognizedText = '';
          
          // Try different possible fields in the response
          if (sttData?.text) {
            recognizedText = sttData.text.trim();
          } else if (sttData?.transcript) {
            recognizedText = sttData.transcript.trim();
          } else if (sttData?.message) {
            recognizedText = sttData.message.trim();
          } else if (typeof sttData === 'string') {
            recognizedText = sttData.trim();
          } else if (sttData?.result) {
            recognizedText = sttData.result.trim();
          }
          
          console.log("🔍 STT Response:", sttData);
          console.log("🔍 Recognized Text:", recognizedText);
          console.log("🔍 Text Length:", recognizedText?.length);

          if (!recognizedText || recognizedText.length === 0) {
            console.warn("⚠️ STT returned empty text");
            this.messages.push({
              role: "assistant",
              content: "😅 ฟังไม่ชัดเลย ลองพูดใหม่อีกทีนะครับ",
            });
            this.$nextTick(() => this.scrollToBottom());
            this.playTTS("ฟังไม่ชัดเลย ลองพูดใหม่อีกทีนะครับ");
            return;
          }
          
          // Check if text is too short (might be noise or error)
          if (recognizedText.length < 2) {
            console.warn("⚠️ STT returned text too short:", recognizedText);
            this.messages.push({
              role: "assistant",
              content: "😅 ฟังไม่ชัดเลย ลองพูดใหม่อีกทีนะครับ",
            });
            this.$nextTick(() => this.scrollToBottom());
            this.playTTS("ฟังไม่ชัดเลย ลองพูดใหม่อีกทีนะครับ");
            return;
          }

          // 💬 2️⃣ แสดงข้อความผู้ใช้ (จากเสียง)
          this.messages.push({
            role: "user",
            content: recognizedText
          });
          this.lastUserMessage = recognizedText;
          this.$nextTick(() => this.scrollToBottom());

          //ดัก keyword
          const keywordGroups = [
            { keys: ["เพิ่ม", "เพิ่มงาน"], hint: 'กรุณาพูด"เพิ่ม"ตามด้วยงานที่อยากเพิ่ม เช่น "เพิ่มงานประชุม"' },
            { keys: ["หา", "ค้นหา","หาข้อมูล","ค้นหาข้อมูล",], hint: 'กรุณาพูด"ค้นหา"ตามด้วยสิ่งที่อยากค้นหา เช่น "หาข้อมูลโปรเจกต์ AI"' },
            { keys: ["แพลน", "วางแผน"], hint: 'กรุณาพูด"วางแผน"ต่อด้วยแพลนที่อยากจัด เช่น "แพลนเที่ยวปีใหม่"' },
            { keys: ["ลบ", "ลบงาน"], hint: 'กรุณาพูด"ลบ"ต่อด้วยงานที่อยากลบ เช่น "ลบงานประชุมตอนเช้า"' },
            { keys: ["ตรวจสอบ", "เช็ค"], hint: 'กรุณาพูด"ตรวจสอบ"ต่อด้วยงานที่อยากตรวจสอบ เช่น "ตรวจสอบงานที่ยังไม่เสร็จ"' },
            { keys: ["แก้ไข", "แก้งาน"], hint: 'กรุณาพูด"แก้ไข้"ต่อด้วยงานที่อยากแก้และแก้เป็นอะไร เช่น "แก้ไขงานประชุมเป็น จัดแข่งกีฬา"' },
          ];
          for (const group of keywordGroups) {
            for (const key of group.keys) {
              const regex = new RegExp(`^${key}(\\s+.+)?$`);
              const match = recognizedText.match(regex);
              if (match) {
                const hasExtra = match[1] && match[1].trim().length > 0;
                if(!hasExtra){
                  this.messages.push({
                    role: "assistant",
                    content: `⚠️ ${group.hint}`,
                
                  });
                  this.$nextTick(() => this.scrollToBottom());
                  this.playTTS(group.hint);
                  return;
                }
              }
            }
          }
          const text = recognizedText.trim().toLowerCase();
          
          // Check if user is confirming duplicate task
          if (this.pendingDuplicate){
            // Check for affirmative responses (yes, confirm, add duplicate)
            const affirmativeKeywords = [
              "ใช่", "ได้", "ได้เลย", "ตกลง", "ยืนยัน", "เพิ่ม", "เพิ่มซ้ำ", 
              "โอเค", "ok", "yes", "yeah", "confirm", "add"
            ];
            
            // Check for negative responses (no, cancel, don't add)
            const negativeKeywords = [
              "ไม่", "ไม่ใช่", "ไม่ต้อง", "ยกเลิก", "ไม่เพิ่ม", "ไม่เพิ่มซ้ำ",
              "no", "cancel", "skip", "ไม่เอา"
            ];
            
            // Check if text contains affirmative keywords
            const isAffirmative = affirmativeKeywords.some(keyword => 
              text.includes(keyword.toLowerCase())
            );
            
            // Check if text contains negative keywords
            const isNegative = negativeKeywords.some(keyword => 
              text.includes(keyword.toLowerCase())
            );
            
            if (isAffirmative && !isNegative) {
              // User confirmed - add duplicate
              this.messages.push({
                role: "assistant",
                content: "รับทราบครับ กำลังเพิ่มงานให้เลยครับ",
              });
              this.$nextTick(() => this.scrollToBottom());
              this.playTTS("รับทราบครับ กำลังเพิ่มงานให้เลยครับ");
              await this.confirmDuplicate(); 
              this.pendingDuplicate = null;  
              return;
            } 
            else if (isNegative) {
              // User declined - cancel (negative takes priority if both are present)
              this.messages.push({
                role: "assistant",
                content: "โอเคครับ ยกเลิกการเพิ่มงานนี้แล้วครับ",
              });
              this.$nextTick(() => this.scrollToBottom());
              this.playTTS("โอเคครับ ยกเลิกการเพิ่มงานนี้แล้วครับ");
              await this.cancelDuplicate(); 
              this.pendingDuplicate = null;
              return;
            }
            else {
              // Unclear response - ask again
              const reminderMessage = "⚠️ กรุณาตอบว่า 'ใช่' หรือ 'ยืนยัน' เพื่อเพิ่มงานซ้ำ หรือ 'ไม่' หรือ 'ยกเลิก' เพื่อยกเลิกครับ";
              this.messages.push({
                role: "assistant",
                content: reminderMessage,
              });
              this.$nextTick(() => this.scrollToBottom());
              this.playTTS("กรุณาตอบว่า 'ใช่' หรือ 'ยืนยัน' เพื่อเพิ่มงานซ้ำ หรือ 'ไม่' หรือ 'ยกเลิก' เพื่อยกเลิกครับ");
              return;
            }
          }

          // 🤖 3️⃣ ส่งข้อความต่อไปยัง /llm/ ที่ Cloud Run
          let llmRes;
          try {
            llmRes = await fetch(
            "https://lumaai-backend-672244117841.asia-southeast1.run.app/api/llm/", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${this.token}`,
              },
              body: JSON.stringify({
                text: recognizedText
              }),
            }
          );
          } catch (fetchError) {
            // Network error (server unreachable, CORS, etc.)
            console.error("❌ LLM Network Error:", fetchError);
            throw new Error(`ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ LLM ได้: ${fetchError.message || 'Server unreachable'}`);
          }

          // Check content-type first to determine how to parse
          const llmContentType = llmRes.headers.get("content-type") || "";
          let llmData;

          // Check if response is OK
          if (!llmRes.ok) {
            // Handle 401 (Unauthorized) - token expired
            if (llmRes.status === 401) {
              console.error("❌ 401 Unauthorized - Token may be expired");
              
              // Try to read error response for logging
              try {
                if (llmContentType.includes("application/json")) {
                  const errorData = await llmRes.json();
                  console.error("❌ LLM 401 Error (JSON):", errorData);
                } else {
                  const errorText = await llmRes.text();
                  console.error("❌ LLM 401 Error (Text):", errorText);
                }
              } catch (e) {
                console.error("❌ LLM 401 Error: Could not read error response", e);
              }

          this.messages.push({
            role: "assistant",
                content: "⚠️ หมดอายุการเข้าสู่ระบบ กรุณาเข้าสู่ระบบใหม่",
          });
          this.$nextTick(() => this.scrollToBottom());
              
              // Try to refresh token
              try {
                await this.fetchBackendToken();
                // Retry the request after token refresh
                console.log("🔄 Retrying LLM request after token refresh...");
                // Note: For simplicity, we'll just ask user to try again
                // You could implement auto-retry here if needed
              } catch (tokenError) {
                console.error("❌ Failed to refresh token:", tokenError);
                // Redirect to login if token refresh fails
                setTimeout(() => {
                  window.location.href = "/pages/user";
                }, 2000);
              }
              return;
            }

            // Other errors
            try {
              if (llmContentType.includes("application/json")) {
                const errorData = await llmRes.json();
                console.error("❌ LLM Error (JSON):", llmRes.status, errorData);
              } else {
                const errorText = await llmRes.text();
                console.error("❌ LLM Error (Text):", llmRes.status, errorText);
              }
            } catch (e) {
              console.error("❌ LLM Error: Could not read error response", e);
            }

            this.messages.push({
              role: "assistant",
              content: `⚠️ เกิดข้อผิดพลาดในการประมวลผล (${llmRes.status}) กรุณาลองอีกครั้ง`,
            });
            this.$nextTick(() => this.scrollToBottom());
            return;
          }

          // Response is OK, parse as JSON
          if (llmContentType.includes("application/json")) {
            try {
              llmData = await llmRes.json();
            } catch (jsonError) {
              console.error("❌ LLM JSON Parse Error:", jsonError);
              this.messages.push({
                role: "assistant",
                content: "⚠️ ไม่สามารถประมวลผลคำตอบได้ กรุณาลองอีกครั้ง",
              });
              this.$nextTick(() => this.scrollToBottom());
              return;
            }
          } else {
            // Non-JSON response (unexpected, but handle it)
            console.error("❌ LLM: Unexpected non-JSON response");
            try {
              const errorText = await llmRes.text();
              console.error("❌ LLM Response (text):", errorText);
            } catch (e) {
              console.error("❌ LLM: Could not read response");
            }
            this.messages.push({
              role: "assistant",
              content: "⚠️ ไม่สามารถรับคำตอบจากระบบได้ กรุณาลองอีกครั้ง",
            });
            this.$nextTick(() => this.scrollToBottom());
            return;
          }

          // 🗣️ 4️⃣ Process response like sendMessage() does
          let response = llmData;
          const ttsMessages = []; // Collect all messages for TTS

          // Parse if string
          if (typeof response === 'string') {
            try {
              response = JSON.parse(response);
            } catch (e) {
              console.error("DEBUG: Failed to parse string response!", e);
            }
          }

          console.log("🔊 Voice Mode: Response structure:", response);

          // Handle simple response (no results array)
          if (!response.results || response.results.length === 0) {
            const replyText = response.result || response.message || response.reply || response.text || JSON.stringify(response);
            const finalText = replyText || "ไม่พบข้อมูลจากการค้นหา 🤔";
            this.messages.push({
              role: "assistant",
              content: finalText,
            });
            this.$nextTick(() => this.scrollToBottom());
            this.playTTS(finalText);
            return;
          }

          // Process structured response with intents
          for (const item of response.results) {
            if (item.intent === "SEARCH") {
              const msg = item.message || item.result || "ไม่พบข้อมูลจากการค้นหา 🤔";
              this.messages.push({
                role: "assistant",
                content: msg
              });
              ttsMessages.push(msg);
              this.$nextTick(() => this.scrollToBottom());
              continue;
            }

            if (item.intent === "CHECK") {
              if (item.output?.length > 0) {
                // Check if there's a duplicate (task with id = "-1")
                const duplicateTask = item.output.find(t => {
                  if (t.id === "-1") return true;
                  if (String(t.id) === "-1") return true;
                  if (Number(t.id) === -1) return true;
                  return false;
                });

                // If duplicate found, ask for confirmation
                if (duplicateTask) {
                  this.messages.push({
                    role: "assistant",
                    content: "🧾 งานที่ตรวจพบ:",
                  });
                  
                  // Track unique task names for TTS to avoid duplicates
                  const seenTaskNames = new Set();
                  const uniqueTaskTexts = [];
                  
                  // Show all existing tasks in chat
                  item.output.forEach(task => {
                    if (task.id !== "-1") {
                      const taskText = task.title || task.name || JSON.stringify(task);
                      this.messages.push({
                        role: "assistant",
                        content: `• ${taskText}`,
                      });
                      
                      // Only add unique task names to TTS
                      if (!seenTaskNames.has(taskText)) {
                        seenTaskNames.add(taskText);
                        uniqueTaskTexts.push(taskText);
                      }
                    }
                  });
                  
                  // Add unique tasks to TTS (similar to chat)
                  if (uniqueTaskTexts.length > 0) {
                    ttsMessages.push("งานที่ตรวจพบ");
                    uniqueTaskTexts.forEach(taskText => {
                      ttsMessages.push(taskText);
                    });
                  }
                  
                  // Use confirmation message from response.result if available, otherwise use default
                  const confirmMessage = response.result || 
                                       item.message ||
                                       "พบรายการนี้อยู่แล้ว ต้องการเพิ่มซ้ำไหมครับ? กรุณาตอบว่า 'ใช่' เพื่อยืนยัน หรือ 'ไม่' เพื่อยกเลิก";
                  this.messages.push({
                    role: "assistant",
                    content: confirmMessage,
                  });
                  ttsMessages.push(confirmMessage);
                  
                  // Set pending duplicate and stop processing other intents
                  this.pendingDuplicate = duplicateTask || (item.output && item.output.length > 0 ? item.output[0] : null);
                  
                  // Play TTS and return early - don't process other intents
                  if (ttsMessages.length > 0) {
                    this.$nextTick(() => this.scrollToBottom());
                    // Remove duplicates from TTS messages
                    const uniqueMessages = [];
                    const seenInTTS = new Set();
                    ttsMessages.forEach(msg => {
                      const trimmed = msg.trim();
                      if (trimmed && !seenInTTS.has(trimmed)) {
                        seenInTTS.add(trimmed);
                        uniqueMessages.push(trimmed);
                      }
                    });
                    const combinedText = uniqueMessages.join(". ");
                    console.log("🔊 Final TTS text (duplicate check):", combinedText);
                    this.playTTS(combinedText);
                  }
                  return; // Stop processing - wait for user confirmation
                } else {
                  // No duplicate found, show tasks but don't ask for confirmation
                  this.messages.push({
                    role: "assistant",
                    content: "🧾 งานที่ตรวจพบ:",
                  });
                  
                  // Track unique task names for TTS to avoid duplicates
                  const seenTaskNames = new Set();
                  const uniqueTaskTexts = [];
                  
                  // Show all tasks in chat
                  item.output.forEach(task => {
                    const taskText = task.title || task.name || JSON.stringify(task);
                    this.messages.push({
                      role: "assistant",
                      content: `• ${taskText}`,
                    });
                    
                    // Only add unique task names to TTS
                    if (!seenTaskNames.has(taskText)) {
                      seenTaskNames.add(taskText);
                      uniqueTaskTexts.push(taskText);
                    }
                  });
                  
                  // Add unique tasks to TTS (similar to chat)
                  if (uniqueTaskTexts.length > 0) {
                    ttsMessages.push("งานที่ตรวจพบ");
                    uniqueTaskTexts.forEach(taskText => {
                      ttsMessages.push(taskText);
                    });
                  }
                }
              } else {
                const msg = "ตรวจสอบแล้ว ไม่พบบันทึกที่เกี่ยวข้องครับ ✅";
                this.messages.push({
                  role: "assistant",
                  content: msg
                });
                ttsMessages.push(msg);
              }
            }

            if (item.intent === "ADD") {
              const msg = item.message || "เพิ่มงานให้คุณแล้วครับ :D";
              this.messages.push({
                role: "assistant",
                content: msg
              });
              ttsMessages.push(msg);
            }

            if (item.intent === "EDIT") {
              const msg = item.message || "แก้ไขงานให้คุณแล้วครับ :D";
              this.messages.push({
                role: "assistant",
                content: msg
              });
              ttsMessages.push(msg);
            }

            if (item.intent === "REMOVE") {
              const msg = item.message || "ลบงานให้คุณแล้วครับ :D";
              this.messages.push({
                role: "assistant",
                content: msg
              });
              ttsMessages.push(msg);
            }

            if (item.intent === "EXIT") {
              const msg = item.message || "สิ้นสุดการทำงานแล้วครับ 👋";
              this.messages.push({
                role: "assistant",
                content: msg
              });
              ttsMessages.push(msg);
            }
          }

          // Add response.result to TTS if it exists and hasn't been added yet
          // (response.result might contain a summary or confirmation message)
          if (response.result && response.result.trim()) {
            const resultText = response.result.trim();
            // Check if it's already in ttsMessages (might have been added as confirmMessage)
            const alreadyIncluded = ttsMessages.some(msg => msg.includes(resultText) || resultText.includes(msg));
            if (!alreadyIncluded) {
              // Add at the beginning to provide context
              ttsMessages.unshift(resultText);
              console.log("🔊 Added response.result to TTS:", resultText);
            }
          }

          // Play TTS for all collected messages (same as what's shown in chat)
          if (ttsMessages.length > 0) {
            this.$nextTick(() => this.scrollToBottom());
            // Remove duplicates from TTS messages and combine with pauses
            const uniqueMessages = [];
            const seenInTTS = new Set();
            ttsMessages.forEach(msg => {
              const trimmed = msg.trim();
              if (trimmed && !seenInTTS.has(trimmed)) {
                seenInTTS.add(trimmed);
                uniqueMessages.push(trimmed);
              }
            });
            const combinedText = uniqueMessages.join(". ");
            console.log("🔊 Final TTS text:", combinedText);
            this.playTTS(combinedText);
          }

        } catch (err) {
          console.error("❌ STT→LLM Error:", err);
          
          // Determine error type and provide helpful message
          let errorMessage = "⚠️ เกิดข้อผิดพลาดขณะประมวลผลเสียงหรือการตอบกลับจากโมเดล";
          
          if (err instanceof TypeError && err.message.includes("Load failed")) {
            errorMessage = "⚠️ ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ตและลองอีกครั้ง";
          } else if (err instanceof TypeError && err.message.includes("Failed to fetch")) {
            errorMessage = "⚠️ ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ อาจเป็นเพราะเซิร์ฟเวอร์ไม่พร้อมใช้งานชั่วคราว";
          } else if (err.message) {
            errorMessage = `⚠️ เกิดข้อผิดพลาด: ${err.message}`;
          }
          
          this.messages.push({
            role: "assistant",
            content: errorMessage,
          });
          this.$nextTick(() => this.scrollToBottom());
          
          // Also try to play TTS for the error message
          try {
            this.playTTS(errorMessage);
          } catch (ttsError) {
            console.error("❌ Failed to play TTS for error:", ttsError);
          }
        }
      };

      // ▶️ เริ่มอัดเสียง
      this.mediaRecorder.start();
      this.isRecording = true;
      
      // Play recording start sound
      this.playRecordingSound(true);

    } catch (e) {
      alert("ไม่สามารถเข้าถึงไมโครโฟนได้");
    }
  },

  // Play recording notification sound
  playRecordingSound(start = true) {
    try {
      // Create audio context for beep sound
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Different frequencies for start and stop
      if (start) {
        oscillator.frequency.value = 800; // Higher pitch for start
        gainNode.gain.value = 0.2; // Softer volume
        oscillator.type = 'sine';
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.1); // Short beep
      } else {
        oscillator.frequency.value = 600; // Lower pitch for stop
        gainNode.gain.value = 0.2;
        oscillator.type = 'sine';
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.15); // Slightly longer beep
      }
    } catch (err) {
      // Fallback: Silent fail if Web Audio API not available
      console.log("ℹ️ Audio feedback not available");
    }
  },

  // Unlock audio for autoplay (called on user interaction)
  unlockAudio() {
    if (!this.audioUnlocked) {
      try {
        // Create a silent audio to unlock autoplay
        const unlockAudio = new Audio();
        unlockAudio.src = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=';
        unlockAudio.volume = 0.01;
        
        // Set timeout to prevent hanging
        const timeout = setTimeout(() => {
          unlockAudio.pause();
          unlockAudio.src = '';
          if (!this.audioUnlocked) {
            this.audioUnlocked = true; // Mark as attempted
          }
        }, 100);
        
        unlockAudio.play().then(() => {
          clearTimeout(timeout);
          console.log("✅ Audio unlocked for autoplay");
          this.audioUnlocked = true;
          unlockAudio.pause();
          unlockAudio.src = '';
        }).catch(err => {
          clearTimeout(timeout);
          // AbortError and other errors are expected - just continue
          // Don't log as error since it's not critical
          if (err.name !== 'AbortError') {
            console.log("ℹ️ Audio unlock attempted (not critical):", err.name);
          }
          this.audioUnlocked = true; // Mark as attempted so we don't keep trying
        });
      } catch (err) {
        // Silent fail - not critical
        this.audioUnlocked = true;
      }
    }
  },

  async playTTS(text, options = {}) {
    try {
      const cleanText = text.replace(/[🧾•⚠️✅❌👋🤔]/g, '').trim();
      
      if (!cleanText) {
        console.warn("⚠️ TTS: Empty text, skipping");
        return;
      }

      // Use options or fallback to data properties
      const speed = options.speed ?? this.ttsSpeed;
      const pitch = options.pitch ?? this.ttsPitch;
      const rate = options.rate ?? this.ttsRate;
      const volume = options.volume ?? this.ttsVolume;

      // Check cache first (for exact text matches)
      const cacheKey = `${cleanText}_${rate}_${pitch}`;
      if (this.ttsCache.has(cacheKey)) {
        console.log("🔊 TTS: Using cached audio");
        const cachedUrl = this.ttsCache.get(cacheKey);
        const audio = new Audio(cachedUrl);
        audio.playbackRate = speed;
        audio.volume = volume;
        
        // Try to play with error handling
        try {
          const playPromise = audio.play();
          if (playPromise !== undefined) {
            await playPromise;
            console.log("✅ TTS: Cached audio playing");
            return;
          }
        } catch (playError) {
          if (playError.name === 'NotAllowedError') {
            // Try unlock and retry
            this.unlockAudio();
            await new Promise(resolve => setTimeout(resolve, 100));
            try {
              await audio.play();
              console.log("✅ TTS: Cached audio playing after unlock");
              return;
            } catch (retryError) {
              console.warn("⚠️ TTS: Cached audio still blocked, continuing silently");
              return; // Don't interrupt, just continue
            }
          } else {
            throw playError;
          }
        }
      }

      console.log("🔊 TTS: Requesting audio for:", cleanText);

      // Build request body with optional parameters
      const requestBody = {
        message: cleanText
      };

      // Add optional TTS parameters if backend supports them
      if (rate !== 1.0) requestBody.rate = rate;
      if (pitch !== 1.0) requestBody.pitch = pitch;
      // Some TTS APIs also support: speed, voice, language, quality

      const res = await fetch("https://luma-model-local.bkkz.org/tts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(requestBody)
      });

      if (!res.ok) {
        console.error("❌ TTS: HTTP error", res.status, res.statusText);
        return;
      }

      const blob = await res.blob();
      
      if (!blob || blob.size === 0) {
        console.error("❌ TTS: Empty or invalid blob received");
        return;
      }

      const url = URL.createObjectURL(blob);
      
      // Cache the URL (limit cache size to prevent memory issues)
      if (this.ttsCache.size > 50) {
        const firstKey = this.ttsCache.keys().next().value;
        const oldUrl = this.ttsCache.get(firstKey);
        URL.revokeObjectURL(oldUrl);
        this.ttsCache.delete(firstKey);
      }
      this.ttsCache.set(cacheKey, url);

      const audio = new Audio(url);
      
      // Apply efficiency settings
      audio.playbackRate = speed; // Control playback speed (0.5 = slower, 2.0 = faster)
      audio.volume = volume; // Control volume (0.0 = silent, 1.0 = max)
      
      // Note: pitch cannot be changed via HTML5 Audio API directly
      // It would need to be set in the TTS API request (if supported)

      audio.addEventListener('ended', () => {
        // Keep URL alive for cache reuse
        console.log("🔊 TTS: Audio playback finished");
      });

      audio.addEventListener('error', (e) => {
        console.error("❌ TTS: Audio playback error:", e);
        // Remove from cache if error
        this.ttsCache.delete(cacheKey);
        URL.revokeObjectURL(url);
      });

      // Try to play audio with proper error handling
      // Force play - user already interacted by clicking the dog
      try {
        // Set volume and play immediately
        audio.volume = volume;
        audio.playbackRate = speed;
        
        // Try direct play first
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          await playPromise;
          console.log("✅ TTS: Playing at speed", speed, "volume", volume);
          return; // Success, exit early
        }
      } catch (playError) {
        // If autoplay fails, try to unlock and retry once
        if (playError.name === 'NotAllowedError') {
          console.warn("⚠️ TTS: Autoplay blocked, attempting unlock and retry");
          
          // Try to unlock audio
          this.unlockAudio();
          
          // Wait a tiny bit and retry
          await new Promise(resolve => setTimeout(resolve, 100));
          
          try {
            await audio.play();
            console.log("✅ TTS: Successfully played after unlock");
            return; // Success after retry
          } catch (retryError) {
            // Still blocked - fall back to silent mode (no manual click needed)
            console.warn("⚠️ TTS: Still blocked after retry, continuing silently");
            // Don't show error to user, just log it
            // The message is already shown in chat, user can see it
            return;
          }
        } else {
          // Other playback errors
          console.error("❌ TTS: Playback error", playError);
          // Don't throw, just log - don't interrupt user experience
        }
      }

    } catch (err) {
      console.error("❌ TTS Error:", err);
      // Don't show error to user - audio will play automatically when unlocked
      // The message is already displayed in chat, user can read it
    }
  },

  // Try to play pending audio (called after user interaction)
  async tryPlayPendingAudio() {
    if (this.pendingTTSAudio && this.pendingTTSAudio.readyState >= 2) {
      try {
        await this.pendingTTSAudio.play();
        console.log("✅ TTS: Successfully played pending audio");
        this.pendingTTSAudio = null;
        this.pendingTTSText = '';
      } catch (err) {
        console.warn("⚠️ TTS: Still blocked, waiting for user interaction", err);
      }
    }
  },

  // Manual play audio (called when user clicks on message)
  async playPendingAudio() {
    if (this.pendingTTSAudio) {
      try {
        await this.pendingTTSAudio.play();
        console.log("✅ TTS: Manual playback successful");
        this.pendingTTSAudio = null;
        this.pendingTTSText = '';
      } catch (err) {
        console.error("❌ TTS: Manual playback failed", err);
        if (err.name === 'NotAllowedError') {
          alert("⚠️ กรุณาคลิกบนหน้าจอก่อนเพื่อให้สามารถเล่นเสียงได้");
        }
      }
    }
  },

  // TTS Efficiency Control Methods
  setTTSSpeed(speed) {
    // Clamp between 0.5 and 2.0
    this.ttsSpeed = Math.max(0.5, Math.min(2.0, speed));
    localStorage.setItem('tts_speed', this.ttsSpeed.toString());
    console.log("🔊 TTS Speed set to:", this.ttsSpeed);
  },

  setTTSPitch(pitch) {
    // Clamp between 0.5 and 2.0
    this.ttsPitch = Math.max(0.5, Math.min(2.0, pitch));
    localStorage.setItem('tts_pitch', this.ttsPitch.toString());
    console.log("🔊 TTS Pitch set to:", this.ttsPitch);
  },

  setTTSRate(rate) {
    // Clamp between 0.5 and 2.0
    this.ttsRate = Math.max(0.5, Math.min(2.0, rate));
    localStorage.setItem('tts_rate', this.ttsRate.toString());
    console.log("🔊 TTS Rate set to:", this.ttsRate);
  },

  setTTSVolume(volume) {
    // Clamp between 0.0 and 1.0
    this.ttsVolume = Math.max(0.0, Math.min(1.0, volume));
    localStorage.setItem('tts_volume', this.ttsVolume.toString());
    console.log("🔊 TTS Volume set to:", this.ttsVolume);
  },

  clearTTSCache() {
    // Clean up all cached audio URLs
    for (const url of this.ttsCache.values()) {
      URL.revokeObjectURL(url);
    }
    this.ttsCache.clear();
    console.log("🔊 TTS Cache cleared");
  },

  // --- Duplicate Handling (ย้ายมาจากส่วนที่คุณคอมเมนต์ไว้) ---

  async confirmDuplicate() {
    if (!this.pendingDuplicate) return;
    const task = this.pendingDuplicate;
    this.pendingDuplicate = null;
    const display = task.name + " " + (task.description || "") + " " + (task.dueDate || "") + " " + (task.dueTime || "");
    this.messages.push({
      role: "assistant",
      content: `กำลังเพิ่มงาน ตามข้อมูล ${display || 'รายการใหม่'}`,
    });

    try {
      const targetUrl = "https://lumaai-backend-672244117841.asia-southeast1.run.app/api/task/";
  
      const res = await fetch(targetUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.token}`,
        },
        body: JSON.stringify({
          name: task.name,
          description: task.description || "",
          dueDate: task.dueDate || "",
          dueTime: task.dueTime || "",
          priority: 0,
          category: 0
        }), 
      });
      console.log("🔍 DEBUG: confirmDuplicate response status:", res.status);
      
      // Check if response is JSON before parsing
      const contentType = res.headers.get("content-type");
      let data;
      
      if (contentType && contentType.includes("application/json")) {
        try {
          data = await res.json();
        } catch (jsonError) {
          // If JSON parsing fails, get text instead
          const text = await res.text();
          console.error("🔍 DEBUG: Failed to parse JSON, response text:", text);
          throw new Error(`Failed to parse response: ${text}`);
        }
      } else {
        // If not JSON, get text response
        const text = await res.text();
        console.log("🔍 DEBUG: Non-JSON response:", text);
        if (res.status === 401) {
          throw new Error("Unauthorized: Authentication failed. Please check your token.");
        }
        throw new Error(`Server returned ${res.status}: ${text}`);
      }
      
      console.log("🔍 DEBUG: confirmDuplicate response data:", data);
      
      if (res.ok && !data.error) {
        this.messages.push({
          role: "assistant",
          content: "✅ เพิ่มงานซ้ำสำเร็จแล้วครับ!",
        });
      } else {
        this.messages.push({
          role: "assistant",
          content: `⚠️ เพิ่มงานไม่สำเร็จ: ${data.error || JSON.stringify(data)}`,
        });
      }
    } catch (err) {
      this.messages.push({
        role: "assistant",
        content: "❌ เกิดข้อผิดพลาดในการเพิ่มงานซ้ำ: " + String(err),
      });
    }
    this.$nextTick(() => this.scrollToBottom());
  },
  
  // 🔴 เมื่อผู้ใช้กด "ยกเลิกเพิ่มซ้ำ"
  cancelDuplicate() {
    this.messages.push({
      role: "assistant",
      content: "❌ ยกเลิกการเพิ่มงานซ้ำแล้วครับ",
    });
    this.pendingDuplicate = null;
    this.$nextTick(() => this.scrollToBottom());
  },
  // --- API & Utilities ---
  async callApi(q) {
    this.persist();
    try {
      const res = await axios.post(
        "https://lumaai-backend-672244117841.asia-southeast1.run.app/api/llm/", {
          text: q
        }, {
          timeout: this.timeoutMs,
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${this.token}`,
          },
        }
      );
      const data = res.data;

      // Logic การจัดการ duplicate ในนี้ดูเหมือนจะซ้ำซ้อนกับใน sendMessage
      // แต่ผมจะคงไว้ก่อน
      if (data.errors && Array.isArray(data.errors)) {
        const duplicate = data.errors.find(e => e.intent === "ADD");
        if (duplicate) {
          // สังเกต: ตรงนี้ set pendingDuplicate เป็น Array
          // ในขณะที่ sendMessage set เป็น Object
          // นี่อาจเป็นจุดที่ต้องตรวจสอบ logic ครับ
          this.pendingDuplicate = duplicate.output.filter(x => x.id === "-1");
          const msg = duplicate.message || "พบงานซ้ำ ต้องการเพิ่มอีกไหม?";
          this.messages.push({
            role: "assistant",
            content: msg
          });
          this.$nextTick(() => this.scrollToBottom());
          return msg;
        }
      }
      return this.pickAnswer(data);
    } catch (e) {
      throw new Error(e.message || String(e));
    }
  },

  scrollToBottom() {
    this.$nextTick(() => {
      const container = this.$refs.chatHistory;
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    });
  },

  controllerWithTimeout(ms) {
    const ctrl = new AbortController();
    const id = setTimeout(() => ctrl.abort(), ms);
    return {
      ctrl,
      cancel: () => clearTimeout(id)
    };
  },

  persist() {
    localStorage.setItem('chat_url', this.url);
    localStorage.setItem('chat_key', this.payloadKey);
    localStorage.setItem('chat_timeout', String(this.timeoutMs));
  },

  pickAnswer(obj) {
    if (obj && typeof obj === 'object') {
      if (obj.result) return String(obj.result);
      if (obj.message) return String(obj.message);
      if (obj.text) return String(obj.text);
      try {
        return JSON.stringify(obj, null, 2);
      } catch {
        return String(obj);
      }
    }
    return String(obj ?? '');
  },

},
mounted() {
  console.log("🔍 DEBUG mounted: Component mounted, pendingDuplicate =", this.pendingDuplicate);
  this.fetchBackendToken()
    .then(() => {
      console.log("✅ Token ready on mount:", this.token);
      const greeted = sessionStorage.getItem("tts_greeted");
      if (!greeted) {
        this.playTTS("สวัสดีค่ะ กรุณาพูดเพิ่ม,ลบ,แก้ไข,ตรวจสอบ,กรอกฟอร์ม,แพลนงาน หรือหาข้อมูล ตามด้วยเนื้อหาได้เลยค่ะ");
        sessionStorage.setItem("tts_greeted", "1");
      }
    })
    .catch(err => console.error("❌ Token load failed on mount:", err));
},
updated() {
  console.log("🔍 DEBUG updated: Component updated, pendingDuplicate =", this.pendingDuplicate);
  console.log("🔍 DEBUG updated: pendingDuplicate is truthy?", !!this.pendingDuplicate);
  // Check if duplicate-confirm element exists in DOM
  this.$nextTick(() => {
    const confirmDiv = document.querySelector('.duplicate-confirm');
    const buttonsDiv = document.querySelector('.duplicate-buttons');
    const confirmBtn = document.querySelector('.btn-confirm');
    const cancelBtn = document.querySelector('.btn-cancel');
    console.log("🔍 DEBUG updated (nextTick): .duplicate-confirm exists?", !!confirmDiv);
    console.log("🔍 DEBUG updated (nextTick): .duplicate-buttons exists?", !!buttonsDiv);
    console.log("🔍 DEBUG updated (nextTick): .btn-confirm exists?", !!confirmBtn);
    console.log("🔍 DEBUG updated (nextTick): .btn-cancel exists?", !!cancelBtn);
    if (confirmDiv) {
      console.log("🔍 DEBUG updated: .duplicate-confirm styles:", window.getComputedStyle(confirmDiv));
      console.log("🔍 DEBUG updated: .duplicate-confirm display:", window.getComputedStyle(confirmDiv).display);
      console.log("🔍 DEBUG updated: .duplicate-confirm visibility:", window.getComputedStyle(confirmDiv).visibility);
      console.log("🔍 DEBUG updated: .duplicate-confirm opacity:", window.getComputedStyle(confirmDiv).opacity);
    }
  });
},
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
  display: flex;
  justify-content: center;
  align-items: center;
}

.dog-image {
  width: clamp(220px, 35vw, 350px);
  height: auto;
  object-fit: contain;
  filter: drop-shadow(0 4px 8px rgba(0,0,0,0.1));
  border-radius: 16px;
  transition: transform 0.3s ease;
}

.big-dog:hover .dog-image {
  transform: scale(1.1);
}

.big-dog:active .dog-image {
  transform: scale(0.95);
}

.user-speech-text {
  margin-top: 24px;
  padding: 16px 24px;
  /* background: white; */
  /* border: 2px solid var(--sage); */
  /* border-radius: 16px; */
  color: var(--textDark);
  font-size: 18px;
  font-weight: 500;
  max-width: 600px;
  text-align: center;
  /* box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1); */
  animation: fadeInUp 0.5s ease-out;
}

/* Shake Animation */
.big-dog.shake {
  animation: shake 2s cubic-bezier(0.25, 0.46, 0.45, 0.94) both, vibrate 2s ease-in-out;
}

/* Recording State */
.big-dog.recording {
  position: relative;
}

.big-dog.recording .dog-image {
  filter: drop-shadow(0 4px 8px rgba(0,0,0,0.1)) drop-shadow(0 0 20px rgba(255, 50, 50, 0.6));
  animation: recordingGlow 1.5s ease-in-out infinite;
}

/* Recording Indicator */
.recording-indicator {
  position: absolute;
  bottom: -70px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  z-index: 10;
  animation: fadeInUp 0.3s ease-out;
}

.recording-pulse {
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, #ff3a3a 0%, #ff6b6b 100%);
  border-radius: 50%;
  position: relative;
  animation: recordingPulse 1.5s ease-in-out infinite;
  box-shadow: 0 4px 20px rgba(255, 58, 58, 0.5);
}

.recording-pulse::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 20px;
  height: 20px;
  background: white;
  border-radius: 50%;
  z-index: 1;
}

.recording-pulse::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 60px;
  height: 60px;
  border: 3px solid rgba(255, 255, 255, 0.8);
  border-radius: 50%;
  animation: recordingRipple 1.5s ease-out infinite;
}

.recording-text {
  background: rgba(255, 58, 58, 0.95);
  color: white;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
  white-space: nowrap;
  box-shadow: 0 4px 12px rgba(255, 58, 58, 0.4);
  backdrop-filter: blur(10px);
}

@keyframes recordingPulse {
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.9;
  }
}

@keyframes recordingRipple {
  0% {
    transform: translate(-50%, -50%) scale(1);
    opacity: 0.8;
  }
  100% {
    transform: translate(-50%, -50%) scale(1.5);
    opacity: 0;
  }
}

@keyframes recordingGlow {
  0%, 100% {
    filter: drop-shadow(0 4px 8px rgba(0,0,0,0.1)) drop-shadow(0 0 20px rgba(255, 50, 50, 0.6));
  }
  50% {
    filter: drop-shadow(0 4px 8px rgba(0,0,0,0.1)) drop-shadow(0 0 30px rgba(255, 50, 50, 0.9));
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}

@keyframes shake {
  0% {
    transform: translateX(0) rotate(0deg) scale(1);
  }
  5% {
    transform: translateX(-10px) rotate(-3deg) scale(1.05);
  }
  10% {
    transform: translateX(10px) rotate(3deg) scale(1.08);
  }
  15% {
    transform: translateX(-12px) rotate(-4deg) scale(1.1);
  }
  20% {
    transform: translateX(12px) rotate(4deg) scale(1.1);
  }
  25% {
    transform: translateX(-10px) rotate(-3deg) scale(1.08);
  }
  30% {
    transform: translateX(10px) rotate(3deg) scale(1.05);
  }
  35% {
    transform: translateX(-8px) rotate(-2deg) scale(1.03);
  }
  40% {
    transform: translateX(8px) rotate(2deg) scale(1.02);
  }
  45% {
    transform: translateX(-6px) rotate(-1deg) scale(1.01);
  }
  50% {
    transform: translateX(6px) rotate(1deg) scale(1);
  }
  55% {
    transform: translateX(-4px) rotate(-0.5deg) scale(1);
  }
  60% {
    transform: translateX(4px) rotate(0.5deg) scale(1);
  }
  65% {
    transform: translateX(-2px) rotate(-0.3deg) scale(1);
  }
  70% {
    transform: translateX(2px) rotate(0.3deg) scale(1);
  }
  75% {
    transform: translateX(-1px) rotate(-0.2deg) scale(1);
  }
  80% {
    transform: translateX(1px) rotate(0.2deg) scale(1);
  }
  85% {
    transform: translateX(-0.5px) rotate(-0.1deg) scale(1);
  }
  90% {
    transform: translateX(0.5px) rotate(0.1deg) scale(1);
  }
  95% {
    transform: translateX(-0.2px) rotate(0deg) scale(1);
  }
  100% {
    transform: translateX(0) rotate(0deg) scale(1);
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

@keyframes fadeInUp {
  0% {
    opacity: 0;
    transform: translateY(20px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Responsive styling for user speech text */
@media (max-width: 768px) {
  .user-speech-text {
    font-size: 16px;
    padding: 14px 20px;
    max-width: 90%;
  }
}

@media (max-width: 480px) {
  .user-speech-text {
    font-size: 14px;
    padding: 12px 16px;
    max-width: 95%;
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

/* Duplicate Confirm Buttons */
.duplicate-confirm {
  text-align: center;
  margin: 0;
  padding: 16px;
  background: none;
  border: none;
  border-radius: 12px;
}

.duplicate-message {
  margin: 0 0 16px 0;
  color: #333;
  font-weight: 600;
  font-size: 16px;
}

.duplicate-buttons {
  display: flex;
  gap: 12px;
  justify-content: center;
  align-items: center;
}

.btn-confirm,
.btn-cancel {
  padding: 12px 24px;
  border: none;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.btn-confirm {
  background: #05533a;
  color: white;
}

.btn-confirm:hover {
  background: #033827;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px #516d64;
}

.btn-cancel {
  background: #a41c1c;
  color: white;
}

.btn-cancel:hover {
  background: #751414;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px #744646;
}

.btn-confirm:active,
.btn-cancel:active {
  transform: translateY(0);
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

/* Pending Audio Message */
.message-bubble.has-pending-audio {
  cursor: pointer;
  position: relative;
  border: 2px dashed var(--peach);
  background: linear-gradient(135deg, var(--white) 0%, #fff9f0 100%);
}

.message-bubble.has-pending-audio:hover {
  background: linear-gradient(135deg, #fff9f0 0%, #ffe8d1 100%);
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(255, 152, 0, 0.2);
}

.message-bubble.has-pending-audio::after {
  content: ' 🔊 คลิกเพื่อฟังเสียง';
  display: block;
  font-size: 0.85em;
  color: var(--sage);
  margin-top: 8px;
  font-weight: 600;
  text-align: center;
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

/* Ellipsis version of typing indicator ("...") */
.message-bubble.loading .typing-indicator {
  position: relative;
  align-items: center;
  min-height: 1em;
}

/* Hide the dot spans when showing the ellipsis animation */
.message-bubble.loading .typing-indicator span {
  display: none;
}

.message-bubble.loading .typing-indicator::after {
  content: '...';
  display: inline-block;
  color: var(--sage);
  font-weight: 700;
  letter-spacing: 2px;
  width: 0ch;
  overflow: hidden;
  animation: ellipsis 1.2s steps(4, end) infinite;
}

@keyframes ellipsis {
  0% { width: 0ch; }
  25% { width: 1ch; }
  50% { width: 2ch; }
  75%, 100% { width: 3ch; }
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