<template>
    <div class="gbar">
      <div class="group">
        <button @click="start" :disabled="recording">🎙️ Record</button>
        <button @click="stop" :disabled="!recording">⏹️ Stop</button>
        <input type="file" accept="audio/*" @change="onPickFile" />
        <span v-if="recording" class="rec">REC…</span>
      </div>
  
      <div class="group">
        <input v-model.trim="ttsText" placeholder="Type text to speak" />
        <button @click="speak" :disabled="!ttsText">🔊 Speak</button>
      </div>
  
      <audio ref="audioEl" v-if="audioUrl" :src="audioUrl" controls></audio>
  
      <p v-if="transcript" class="transcript">
        <b>Transcript:</b> {{ transcript }}
      </p>
      <p v-if="error" class="error">{{ error }}</p>
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref } from 'vue'
  
  const API_BASE = (import.meta as any).env.VITE_API_BASE || ''
  
  const recording = ref(false)
  const mediaRecorder = ref<MediaRecorder | null>(null)
  const audioEl = ref<HTMLAudioElement | null>(null)
  const audioUrl = ref<string>('')
  
  const ttsText = ref('')
  const transcript = ref('')
  const error = ref('')
  
  function pickSupportedMime(): string {
    const list = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/mp4',           // Safari
      'audio/aac',           // Safari (บางเวอร์ชัน)
      'audio/ogg;codecs=opus',
      'audio/ogg'
    ]
    for (const t of list) if (MediaRecorder?.isTypeSupported?.(t)) return t
    return '' // ให้ browser เลือกเอง
  }
  
  async function start() {
    error.value = ''
    transcript.value = ''
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mt = pickSupportedMime()
      mediaRecorder.value = new MediaRecorder(stream, mt ? { mimeType: mt } : undefined)
      mediaRecorder.value.start()
      recording.value = true
    } catch (e: any) {
      error.value = e?.message || 'Microphone permission denied'
    }
  }
  
  function stopRecording(mr: MediaRecorder): Promise<File> {
    return new Promise(resolve => {
      const parts: BlobPart[] = []
      const onData = (ev: BlobEvent) => parts.push(ev.data)
      mr.addEventListener('dataavailable', onData)
  
      mr.addEventListener('stop', () => {
        const type = mr.mimeType || 'audio/webm'
        const ext = type.includes('mp4') || type.includes('aac') ? 'm4a'
                  : type.includes('ogg') ? 'ogg'
                  : 'webm'
        const blob = new Blob(parts, { type })
        const file = new File([blob], `audio.${ext}`, { type })
        mr.removeEventListener('dataavailable', onData)
        mr.stream.getTracks().forEach(t => t.stop())
        resolve(file)
      }, { once: true })
  
      mr.stop()
    })
  }
  
  async function stop() {
    error.value = ''
    if (!mediaRecorder.value) return
    try {
      const file = await stopRecording(mediaRecorder.value)
      recording.value = false
      await doSTT(file)
    } catch (e: any) {
      error.value = e?.message || 'Stop error'
    } finally {
      mediaRecorder.value = null
    }
  }
  
  async function onPickFile(e: Event) {
    error.value = ''
    const el = e.target as HTMLInputElement
    const file = el.files?.[0]
    if (file) await doSTT(file)
  }
  
  async function doSTT(file: File) {
    const fd = new FormData()
    fd.append('audio', file, file.name || 'audio.webm')
    const res = await fetch(`${API_BASE}/speech/stt`, { method: 'POST', body: fd })
    if (!res.ok) throw new Error(await res.text())
    const data = await res.json()
    transcript.value = String(data?.text || '')
    ttsText.value = transcript.value
  }
  
  async function speak() {
    error.value = ''
    try {
      const res = await fetch(`${API_BASE}/speech/tts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: ttsText.value })
      })
      if (!res.ok) throw new Error(await res.text())
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      audioUrl.value = url
      queueMicrotask(() => audioEl.value?.play().catch(() => {}))
    } catch (e: any) {
      error.value = e?.message || 'TTS failed'
    }
  }
  </script>
  
  <style scoped>
  .gbar {
    display: grid;
    gap: .5rem;
    padding: .5rem;
    border-bottom: 1px solid #eee;
    background: #fafafa;
  }
  .group { display:flex; gap:.5rem; align-items:center; flex-wrap:wrap; }
  .rec { color:#c00; font-weight:700; }
  .error { color:#c00; white-space: pre-wrap; }
  .transcript { margin: 0; }
  input { min-width: 240px; }
  button, input {
    border: 1px solid #ddd; border-radius: 8px; padding: .4rem .6rem; background: #fff;
  }
  </style>
  