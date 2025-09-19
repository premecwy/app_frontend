<template>
  <div class="auto-fill-page">
    <!-- Enhanced Top bar -->
    <header class="topbar">
      <div class="container">
        <div class="topbar-content">
          <button class="back-btn" @click="$router.back()" aria-label="Go back">
            <svg viewBox="0 0 24 24" width="20" height="20">
              <path fill="currentColor" d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
            </svg>
          </button>
          <h1 class="page-title">Fill Form</h1>
          <div class="spacer"></div>
        </div>
      </div>
    </header>

    <main class="page">
      <div class="container">
        <!-- Enhanced Main Section -->
        <section class="main-section card">
          <div class="section-header">
            <h2 class="section-title">Form Analysis</h2>
            <p class="section-subtitle">Upload a file or paste text to analyze and extract form data</p>
          </div>

          <!-- Enhanced Input Section -->
          <div class="input-section">
            <div class="form-group">
              <label class="form-label">Text Input</label>
        <textarea
          v-model="text"
                class="form-textarea"
          rows="6"
                placeholder="Paste text to analyze (e.g., history/form data)..."
        ></textarea>
      </div>
  
            <div class="form-group">
              <label class="form-label">Or Upload File</label>
              <div class="file-input-wrapper">
                <input 
                  type="file" 
                  accept=".txt,.pdf,.doc,.docx" 
                  @change="onFile" 
                  class="file-input"
                  id="file-upload"
                />
                <label for="file-upload" class="file-label">
                  <svg viewBox="0 0 24 24" width="20" height="20">
                    <path fill="currentColor" d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                  </svg>
                  Choose File
                </label>
                <span v-if="file" class="file-name">{{ file.name }}</span>
              </div>
            </div>
          </div>

          <!-- Enhanced Action Buttons -->
          <div class="action-buttons">
            <button 
              class="btn-primary" 
              @click="analyze" 
              :disabled="loading"
            >
              <span v-if="loading" class="loading-spinner"></span>
              {{ loading ? 'Analyzing...' : 'Analyze' }}
            </button>
            
            <button 
              class="btn-secondary" 
              @click="submit" 
              :disabled="!result || submitting"
            >
              <span v-if="submitting" class="loading-spinner"></span>
              {{ submitting ? 'Submitting...' : 'Submit' }}
            </button>
            
            <button 
              class="btn-copy" 
              @click="copyJSON" 
              :disabled="!result"
            >
              Copy JSON
        </button>
            
            <button 
              class="btn-clear" 
              @click="clearAll" 
              :disabled="loading || submitting"
            >
              Clear All
        </button>
      </div>
  
          <!-- Enhanced Status Messages -->
          <div v-if="error" class="error-message">
            <svg viewBox="0 0 24 24" width="20" height="20">
              <path fill="currentColor" d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M11,16.5L6.5,12L7.91,10.59L11,13.67L16.59,8.09L18,9.5L11,16.5Z"/>
            </svg>
            {{ error }}
          </div>
          
          <div v-if="info" class="info-message">
            <svg viewBox="0 0 24 24" width="20" height="20">
              <path fill="currentColor" d="M11,9H13V7H11M12,20C7.59,20 4,16.41 4,12C4,7.59 7.59,4 12,4C16.41,4 20,7.59 20,12C20,16.41 16.41,20 12,20M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M11,17H13V11H11V17Z"/>
            </svg>
            {{ info }}
          </div>

          <!-- Enhanced Preview Section -->
          <div v-if="result" class="preview-section">
            <div class="preview-header">
              <h3 class="preview-title">Analysis Results</h3>
              <div class="preview-stats">{{ Object.keys(flat).length }} fields extracted</div>
            </div>
            
            <div class="preview-grid">
              <div v-for="(v, k) in flat" :key="k" class="preview-item">
                <div class="preview-key">{{ k }}</div>
                <div class="preview-value">{{ fmt(v) }}</div>
          </div>
        </div>
  
            <details class="raw-json">
              <summary class="raw-summary">
                <svg viewBox="0 0 24 24" width="16" height="16">
                  <path fill="currentColor" d="M8.59,16.58L13.17,12L8.59,7.41L10,6L16,12L10,18L8.59,16.58Z"/>
                </svg>
                Raw JSON
              </summary>
              <pre class="raw-content">{{ pretty(result) }}</pre>
        </details>
      </div>
    </section>
      </div>
    </main>
  </div>
  </template>
  
<script setup lang="ts">
import { ref, computed } from 'vue'
  
  const API_BASE = (import.meta as any).env.VITE_API_BASE || ''
  
  const text = ref('')
  const file = ref<File | null>(null)
  const result = ref<Record<string, any> | null>(null)
  const loading = ref(false)
  const submitting = ref(false)
  const error = ref('')
  const info = ref('')
  
  function onFile(e: Event) {
    const el = e.target as HTMLInputElement
    file.value = el.files?.[0] || null
  }
  
  async function fetchJSON(res: Response) {
    const ct = res.headers.get('content-type') || ''
    if (!res.ok) {
      const body = ct.includes('application/json')
        ? JSON.stringify(await res.json(), null, 2)
        : await res.text()
      throw new Error(`HTTP ${res.status} ${res.statusText}` + (body ? `\n\n${body}` : ''))
    }
    return ct.includes('application/json') ? res.json() : res.text()
  }
  
  async function analyze() {
    error.value = ''
    info.value = ''
    result.value = null
    loading.value = true
    try {
      let data: any
      if (file.value) {
        const fd = new FormData()
        fd.append('file', file.value, file.value.name)
        const res = await fetch(`${API_BASE}/fillform/analyze`, {
          method: 'POST',
          body: fd,
        })
        data = await fetchJSON(res)
      } else {
        const bodyText = text.value.trim()
        if (!bodyText) throw new Error('ใส่ข้อความหรือเลือกไฟล์ก่อน')
        const res = await fetch(`${API_BASE}/fillform/analyze`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: bodyText }),
        })
        data = await fetchJSON(res)
      }
      result.value = data
      info.value = 'Analyze OK'
    } catch (e: any) {
      error.value = e?.message || 'Analyze failed'
    } finally {
      loading.value = false
    }
  }
  
  async function submit() {
    if (!result.value) return
    error.value = ''
    info.value = ''
    submitting.value = true
    try {
      const res = await fetch(`${API_BASE}/fillform/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(result.value),
      })
      await fetchJSON(res)
      info.value = 'Submitted!'
    } catch (e: any) {
      error.value = e?.message || 'Submit failed'
    } finally {
      submitting.value = false
    }
  }
  
  function clearAll() {
    text.value = ''
    file.value = null
    result.value = null
    error.value = ''
    info.value = ''
  }
  
  function flatten(obj: any, prefix = '', out: Record<string, any> = {}) {
    if (!obj || typeof obj !== 'object') return out
    for (const [k, v] of Object.entries(obj)) {
      const key = prefix ? `${prefix}.${k}` : k
      if (v && typeof v === 'object' && !Array.isArray(v)) flatten(v, key, out)
      else out[key] = v
    }
    return out
  }
  
  const flat = computed(() => (result.value ? flatten(result.value) : {}))
  const fmt = (v: any) => (typeof v === 'object' ? JSON.stringify(v) : String(v))
  const pretty = (o: any) => {
    try { return JSON.stringify(o, null, 2) } catch { return String(o) }
  }
  
  async function copyJSON() {
    if (!result.value) return
    await navigator.clipboard.writeText(pretty(result.value))
    info.value = 'Copied JSON'
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
  --shadow: 0 8px 32px rgba(0,0,0,.06), 0 2px 8px rgba(0,0,0,.04);
  --shadow-lg: 0 12px 40px rgba(0,0,0,.12), 0 4px 12px rgba(0,0,0,.08);
}

/* Global background */
:global(html, body, #app) {
  background: var(--ivory) !important;
  color: var(--textDark) !important;
  min-height: 100vh;
}
:global(html) { height: 100%; }
:global(body) { height: 100%; margin: 0; padding: 0; }
:global(#app) { min-height: 100vh; background: var(--ivory); }

/* Page Layout */
.auto-fill-page {
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
  gap: 8px;
  width: 40%;
  margin-top: 2%;
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
  
  .back-btn {
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
  flex: 1;
}

.spacer {
  width: 42px;
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

/* Main Section */
.main-section {
  padding: clamp(24px, 4vw, 32px);
  margin-bottom: 24px;
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border: 2px solid var(--sage);
}

.section-header {
  text-align: center;
  margin-bottom: 32px;
}

.section-title {
  font-size: clamp(28px, 4vw, 36px);
  font-weight: 800;
  color: var(--textDark);
  margin: 0 0 8px 0;
}

.section-subtitle {
  font-size: 16px;
  color: var(--muted);
  margin: 0;
}

/* Input Section */
.input-section {
  margin-bottom: 32px;
}

.form-group {
  margin-bottom: 24px;
}

.form-label {
  display: block;
  font-size: 16px;
  font-weight: 600;
  color: var(--textDark);
  margin-bottom: 8px;
}

.form-textarea {
  width: 100%;
  padding: 16px 20px;
  border: 2px solid #E5E7EB;
  border-radius: 12px;
  font-size: 16px;
  background: var(--white);
  color: var(--textDark);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  resize: vertical;
  min-height: 120px;
  font-family: inherit;
}

.form-textarea:focus {
  outline: none;
  border-color: var(--sage);
  box-shadow: 0 0 0 4px rgba(105, 132, 116, 0.15);
}

.form-textarea::placeholder {
  color: var(--muted);
}

/* File Input */
.file-input-wrapper {
  position: relative;
}

.file-input {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}

.file-label {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 16px 24px;
  background: var(--white);
  border: 2px dashed #E5E7EB;
  border-radius: 12px;
  color: var(--muted);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  min-width: 200px;
  justify-content: center;
}

.file-label:hover {
  background: #F9FAFB;
  color: var(--textDark);
  border-color: var(--muted);
  border-style: solid;
}

.file-name {
  margin-left: 12px;
  color: var(--textDark);
  font-weight: 500;
}

/* Action Buttons */
.action-buttons {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: center;
  margin-bottom: 24px;
}

.btn-primary,
.btn-secondary,
.btn-outline,
.btn-copy,
.btn-clear {
  padding: 16px 32px;
  border-radius: 12px;
  font-weight: 700;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: none;
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 120px;
  justify-content: center;
}

.btn-primary {
  background: linear-gradient(135deg, #10B981 0%, #059669 100%);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: linear-gradient(135deg, #059669 0%, #047857 100%);
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.btn-secondary {
  background: #dc2626;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background: #a81d1d;
  transform: translateY(-2px);
}

.btn-outline {
  background: var(--white);
  color: var(--sage);
  border: 2px solid var(--sage);
}

.btn-outline:hover:not(:disabled) {
  background: var(--sage);
  color: var(--white);
  transform: translateY(-2px);
}

/* Copy JSON button - Blue theme */
.btn-copy {
  background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%);
  color: white;
  border: 2px solid #3B82F6;
}

.btn-copy:hover:not(:disabled) {
  background: linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%);
  border-color: #2563EB;
  transform: translateY(-2px);
}

/* Clear All button - Orange theme */
.btn-clear {
  background: linear-gradient(135deg, #dd8108 0%, #dd8108 100%);
  color: white;
  /* border: 2px solid #F59E0B; */
}

.btn-clear:hover:not(:disabled) {
  background: linear-gradient(135deg, #be5606 0%, #be5606 100%);
  /* border-color: #D97706; */
  transform: translateY(-2px);
}

.btn-primary:disabled,
.btn-secondary:disabled,
.btn-outline:disabled,
.btn-copy:disabled,
.btn-clear:disabled {
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
  to { transform: rotate(360deg); }
}

/* Status Messages */
.error-message,
.info-message {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px 20px;
  border-radius: 12px;
  font-weight: 500;
  margin-bottom: 16px;
}

.error-message {
  background: #FEF2F2;
  color: #DC2626;
  border: 1px solid #FECACA;
}

.info-message {
  background: #F0FDF4;
  color: #059669;
  border: 1px solid #BBF7D0;
}

/* Preview Section */
.preview-section {
  margin-top: 32px;
  padding: 24px;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-radius: 16px;
  border: 2px solid var(--sage);
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 2px solid var(--sage);
}

.preview-title {
  font-size: 24px;
  font-weight: 700;
  color: var(--textDark);
  margin: 0;
}

.preview-stats {
  background: var(--sage);
  color: var(--white);
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
}

.preview-grid {
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  margin-bottom: 24px;
}

.preview-item {
  background: var(--white);
  border: 2px solid #E5E7EB;
  border-radius: 12px;
  padding: 16px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.preview-item:hover {
  border-color: var(--sage);
  box-shadow: var(--shadow);
}

.preview-key {
  font-weight: 700;
  color: var(--sage);
  margin-bottom: 8px;
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.preview-value {
  word-break: break-word;
  color: var(--textDark);
  font-size: 16px;
  line-height: 1.5;
}

/* Raw JSON */
.raw-json {
  margin-top: 24px;
}

.raw-summary {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: var(--sage);
  color: var(--white);
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.raw-summary:hover {
  background: var(--sageLight);
}

.raw-content {
  background: #1a1a1a;
  color: #f8f8f2;
  padding: 20px;
  border-radius: 8px;
  border: 2px solid #333;
  overflow: auto;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 14px;
  line-height: 1.5;
  margin-top: 8px;
  max-height: 400px;
}

/* Responsive Design */
@media (max-width: 768px) {
  .topbar-content {
    width: 60%;
    margin-top: 1%;
  }
  
  .action-buttons {
    flex-direction: column;
    align-items: stretch;
  }
  
  .btn-primary,
  .btn-secondary,
  .btn-outline {
    width: 100%;
  }
  
  .preview-grid {
    grid-template-columns: 1fr;
  }
  
  .preview-header {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
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
  
  .circle-btn {
    width: 36px;
    height: 36px;
  }
  
  .main-section {
    padding: 20px;
  }
  
  .preview-section {
    padding: 16px;
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
.btn-primary:focus-visible,
.btn-secondary:focus-visible,
.btn-outline:focus-visible,
.btn-copy:focus-visible,
.btn-clear:focus-visible {
  outline: 2px solid var(--sage);
  outline-offset: 2px;
}
  </style>
  