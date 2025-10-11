<template>
  <div class="home">
    <!-- Enhanced top bar -->
    <header class="topbar">
      <div class="container">
        <div class="topbar-content">
          <!-- <button class="circle-btn" aria-label="settings" @click="go('/settings')">
            <svg viewBox="0 0 24 24" width="22" height="22">
              <path fill="currentColor"
                d="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Zm9.4 3.5c0-.47-.03-.93-.1-1.38l2.02-1.57-2-3.46-2.47 1a7.7 7.7 0 0 0-2.38-1.38l-.37-2.6h-4.84l-.37 2.6a7.7 7.7 0 0 0-2.38 1.38l-2.47-1-2 3.46 2.02 1.57c-.07.45-.1.91-.1 1.38s.03.93.1 1.38L1.68 15l2 3.46 2.47-1a7.7 7.7 0 0 0 2.38 1.38l.37 2.6h4.84l.37-2.6a7.7 7.7 0 0 0 2.38-1.38l2.47 1 2-3.46-2.02-1.57c.07-.45.1-.91.1-1.38Z"/>
            </svg>
          </button> -->

          <div class="spacer"></div>

          <RouterLink class="circle-btn" aria-label="user" to="/user">
            <svg viewBox="0 0 24 24" width="22" height="22">
              <path fill="currentColor"
                d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5Zm0 2c-4.42 0-8 2.24-8 5v1h16v-1c0-2.76-3.58-5-8-5Z"/>
            </svg>
          </RouterLink>
        </div>
      </div>
    </header>

    <main class="page">
      <div class="container">
        <!-- Enhanced Hero Section -->
        <RouterLink class="hero card" :style="heroCardStyle" to="/llm">
          <div class="hero-content">
            <div class="hero-text">
              <h1 class="hero-title">
                <span class="line">Talk with LUMA</span>
                <!-- <span class="line">with LUMA</span> -->
              </h1>
              <p class="hero-subtitle">Your intelligent assistant is ready to help</p>
            </div>
            <div class="hero-dog" aria-hidden="true">🐶</div>
          </div>
        </RouterLink>

        <!-- Enhanced Action Cards -->
        <div class="grid grid-2 actions-grid">
          <RouterLink class="card action" :style="taskCardStyle" to="/task">
            <div class="action-content">
              <div class="action-icon">📄✔️</div>
              <div class="action-text">
                <h3 class="action-title">Your Task</h3>
                <p class="action-description">Manage your daily tasks</p>
              </div>
            </div>
          </RouterLink>

          <RouterLink class="card action" :style="fillCardStyle" to="/fillform">
            <div class="action-content">
              <div class="action-icon">📝</div>
              <div class="action-text">
                <h3 class="action-title">Fill Form</h3>
                <p class="action-description">Auto-fill forms quickly</p>
              </div>
            </div>
          </RouterLink>
        </div>

        <!-- Enhanced History Section -->
        <!-- <section class="history card" :style="historyCardStyle">
          <header class="history-head">
            <h2 class="history-title">Recent Activity</h2>
            <button class="seeall" @click="go('/history')">
              <span>See all</span>
              <svg viewBox="0 0 24 24" width="16" height="16">
                <path fill="currentColor" d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/>
              </svg>
            </button>
          </header>
          
          <div class="history-content">
            <div class="timeline">
              <div class="timeline-item">
                <div class="dot pink"></div>
                <div class="entry">Hello, Is there anything I forgot to do?</div>
              </div>
              <div class="timeline-item">
                <div class="dot yellow"></div>
                <div class="entry">Yes, you forget to plan a trip since 15 May 2025</div>
              </div>
              <div class="timeline-item">
                <div class="dot pink"></div>
                <div class="entry">Thank you, can you add this task to my Today's plan?</div>
              </div>
              <div class="timeline-item">
                <div class="dot yellow"></div>
                <div class="entry">Sure!</div>
              </div>
              <div class="timeline-item">
                <div class="dot yellow"></div>
                <div class="entry">The task added.</div>
              </div>
            </div>
          </div>
        </section> -->
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
const router = useRouter()
const go = (path: string) => router.push(path).catch(() => {})

/* Enhanced color palette */
const PALETTE = {
  sand:  '#DCA47C',   // Task card
  peach: '#FFD3B6',   // Fill form card
  ivory: '#FCF8F3',   // Background
  sage:  '#698474',   // Hero + History
  sageLight: '#7A9A87', // Lighter sage for hover states
  white: '#FFFFFF',
  textLight: '#F7FBF9',
  textDark: '#2A2A2A',
  accent: '#FF8FB0',  // Pink accent
  warning: '#FFE45E', // Yellow accent
}

/* Enhanced base card styles */
const baseCard = {
  border: 'none',
  borderRadius: '24px',
  boxShadow: '0 8px 32px rgba(0,0,0,.06), 0 2px 8px rgba(0,0,0,.04)',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  cursor: 'pointer',
} as const

/* Enhanced hero card */
const heroCardStyle = {
  ...baseCard,
  background: `linear-gradient(135deg, ${PALETTE.sage} 0%, ${PALETTE.sageLight} 100%)`,
  color: PALETTE.white,
  padding: 'clamp(24px, 4vw, 40px)',
  marginBottom: 'clamp(20px, 3vw, 32px)',
  minHeight: 'clamp(220px, 32vh, 380px)',
  position: 'relative' as const,
  overflow: 'hidden',
  display: 'block',
  width: '100%',
}

/* Enhanced task card */
const taskCardStyle = {
  ...baseCard,
  background: `linear-gradient(135deg, ${PALETTE.sand} 0%, #E6B085 100%)`,
  color: PALETTE.white,
  padding: 'clamp(20px, 3vw, 28px)',
  minHeight: 'clamp(180px, 22vh, 250px)',
  display: 'flex',
  flexDirection: 'column' as const,
  justifyContent: 'space-between',
}

/* Enhanced fill form card */
const fillCardStyle = {
  ...baseCard,
  background: `linear-gradient(135deg, ${PALETTE.peach} 0%, #FFE4D1 100%)`,
  color: '#5A3F2E',
  padding: 'clamp(20px, 3vw, 28px)',
  minHeight: 'clamp(180px, 22vh, 250px)',
  display: 'flex',
  flexDirection: 'column' as const,
  justifyContent: 'space-between',
}

/* Enhanced history card */
const historyCardStyle = {
  ...baseCard,
  background: `linear-gradient(135deg, ${PALETTE.sage} 0%, ${PALETTE.sageLight} 100%)`,
  color: PALETTE.white,
  padding: 'clamp(24px, 4vw, 32px)',
  borderBottomLeftRadius: '48px',
  borderBottomRightRadius: '48px',
  minHeight: 'clamp(240px, 30vh, 400px)',
  position: 'relative' as const,
}
</script>

<style scoped>
/* Global background */
:global(html, body, #app) { 
  background: #f7e0b8 !important; 
  color: #2a2a2a !important; 
  min-height: 100vh;
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
  background: #f7e0b8;
}

.home { 
  min-height: 100vh; 
  height: 100%;
  position: relative;
  background: #f7e0b8;
  display: flex;
  flex-direction: column;
}

/* main.page {
  flex: 1;
  display: flex;
  align-items: center;
  padding: clamp(20px, 3vw, 40px) 0;
}

main.page .container {
  width: 100%;
} */

/* Enhanced Topbar */
.topbar-content {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
}

.circle-btn {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  transform: translateY(0);
}

.circle-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(105, 132, 116, 0.3);
}

.circle-btn:active {
  transform: translateY(0);
}

/* Enhanced Hero Section */
.hero-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: clamp(16px, 3vw, 32px);
  width: 100%;
  position: relative;
  z-index: 2;
  text-decoration: none;
}

.hero.card {
  text-decoration: none;
}

.hero.card:hover {
  text-decoration: none;
}

.hero-text {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
  min-width: 0;
}

.hero-title {
  margin: 0;
  font-weight: 800;
  font-size: clamp(28px, 4vw, 48px);
  line-height: 1.1;
  letter-spacing: -0.02em;
}

.hero-title .line {
  display: block;
  background: linear-gradient(135deg, #ffffff 0%, #f0f8f0 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero-subtitle {
  margin: 0;
  font-size: clamp(14px, 1.8vw, 18px);
  font-weight: 500;
  opacity: 0.9;
  line-height: 1.4;
}

.hero-dog {
  font-size: clamp(80px, 8vw, 140px);
  filter: drop-shadow(0 4px 8px rgba(0,0,0,0.1));
  animation: float 3s ease-in-out infinite;
  flex-shrink: 0;
  line-height: 1;
}

@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
}

/* Enhanced Action Cards */
.actions-grid {
  margin-bottom: clamp(24px, 4vw, 40px);
}

.action {
  position: relative;
  overflow: hidden;
  text-decoration: none;
}

.action:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 40px rgba(0,0,0,0.12), 0 4px 12px rgba(0,0,0,0.08);
  text-decoration: none;
}

.action:visited {
  text-decoration: none;
}

.action:focus {
  text-decoration: none;
}

.action-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: 100%;
}

.action-icon {
  font-size: clamp(36px, 4vw, 64px);
  margin-bottom: 8px;
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1));
}

.action-text {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.action-title {
  margin: 0;
  font-size: clamp(18px, 2vw, 24px);
  font-weight: 700;
  line-height: 1.2;
}

.action-description {
  margin: 0;
  font-size: clamp(12px, 1.2vw, 14px);
  opacity: 0.8;
  line-height: 1.3;
}

/* Enhanced History Section */
.history-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: clamp(16px, 2.5vw, 24px);
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(255,255,255,0.2);
}

.history-title {
  margin: 0;
  font-size: clamp(20px, 2.5vw, 28px);
  font-weight: 700;
  color: #ffffff;
}

.seeall {
  background: transparent;
  border: none;
  color: rgba(255,255,255,0.8);
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border-radius: 12px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  font-size: clamp(14px, 1.4vw, 16px);
}

.seeall:hover {
  background: rgba(255,255,255,0.1);
  color: #ffffff;
  transform: translateX(4px);
}

.history-content {
  margin-top: 16px;
}

.timeline {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: clamp(16px, 2vw, 20px);
}

.timeline::before {
  content: "";
  position: absolute;
  left: 8px;
  top: 12px;
  bottom: 12px;
  width: 2px;
  background: linear-gradient(180deg, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0.3) 100%);
  border-radius: 1px;
}

.timeline-item {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  position: relative;
  z-index: 1;
}

.dot {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 3px solid #ffffff;
  flex-shrink: 0;
  margin-top: 2px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
}

.dot.pink { 
  background: #FF8FB0; 
  animation: pulse 2s infinite;
}

.dot.yellow { 
  background: #FFE45E; 
  animation: pulse 2s infinite 1s;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

.entry {
  color: rgba(255,255,255,0.9);
  font-size: clamp(14px, 1.4vw, 16px);
  line-height: 1.5;
  margin: 0;
  padding: 8px 0;
}

/* Responsive Design */
@media (max-width: 640px) {
  .hero-content {
    flex-direction: column;
    text-align: center;
    gap: 20px;
  }
  
  .hero-dog {
    order: -1;
    font-size: clamp(60px, 12vw, 80px);
  }
  
  .action-content {
    text-align: center;
  }
  
  .timeline-item {
    gap: 12px;
  }
  
  .timeline::before {
    left: 6px;
  }
  
  .dot {
    width: 12px;
    height: 12px;
  }
}

@media (min-width: 1024px) {
  .hero-content {
    gap: 48px;
  }
  
  .actions-grid {
    gap: 24px;
  }
  
  .action:hover {
    transform: translateY(-6px);
  }
}

@media (min-width: 1280px) {
  .container {
    max-width: 1200px;
  }
  
  .hero-title {
    font-size: clamp(40px, 3.5vw, 56px);
  }
  
  .action-title {
    font-size: clamp(20px, 1.8vw, 26px);
  }
}

/* Accessibility improvements */
@media (prefers-reduced-motion: reduce) {
  .hero-dog,
  .dot.pink,
  .dot.yellow {
    animation: none;
  }
  
  .circle-btn,
  .action,
  .seeall {
    transition: none;
  }
}

/* Focus states for accessibility */
.circle-btn:focus-visible,
.action:focus-visible,
.seeall:focus-visible {
  outline: 2px solid #ffffff;
  outline-offset: 2px;
}
</style>
