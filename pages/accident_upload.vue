<template>
  <div class="upload-page">
    <!-- Top bar -->
    <header class="topbar">
      <div class="container">
        <div class="topbar-content">
          <button class="back-btn" @click="$router.back()" aria-label="Go back">
            <svg viewBox="0 0 24 24" width="20" height="20">
              <path fill="currentColor" d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
            </svg>
          </button>
          <h1 class="page-title"></h1>
          <div class="spacer"></div>
        </div>
      </div>
    </header>

    <main class="page">
      <div class="container">
        <section class="main-section card">
          <div class="section-header">
            <h2 class="section-title">Upload Car Accident Form</h2>
            <p class="section-subtitle">Upload accident reports, photos, or related documents</p>
          </div>

          <!-- Result Layout Box -->
          <div class="result-layout-box">
            <!-- Action Buttons -->
            <div class="result-box-actions">
              <button @click="toggleEdit" class="icon-btn" :title="isEditing ? 'Lock' : 'Edit'">
                <svg v-if="!isEditing" viewBox="0 0 24 24" width="18" height="18">
                  <path fill="currentColor" d="M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.12,5.12L18.87,8.87M3,17.25V21H6.75L17.81,9.93L14.06,6.18L3,17.25Z"/>
                </svg>
                <svg v-else viewBox="0 0 24 24" width="18" height="18">
                  <path fill="currentColor" d="M12,17A2,2 0 0,0 14,15C14,13.89 13.1,13 12,13A2,2 0 0,0 10,15A2,2 0 0,0 12,17M18,8A2,2 0 0,1 20,10V20A2,2 0 0,1 18,22H6A2,2 0 0,1 4,20V10C4,8.89 4.9,8 6,8H7V6A5,5 0 0,1 12,1A5,5 0 0,1 17,6V8H18M12,3A3,3 0 0,0 9,6V8H15V6A3,3 0 0,0 12,3Z"/>
                </svg>
              </button>
              <button @click="copyResults" class="icon-btn" title="Copy Results">
                <svg viewBox="0 0 24 24" width="18" height="18">
                  <path fill="currentColor" d="M19,21H8V7H19M19,5H8A2,2 0 0,0 6,7V21A2,2 0 0,0 8,23H19A2,2 0 0,0 21,21V7A2,2 0 0,0 19,5M16,1H4A2,2 0 0,0 2,3V17H4V3H16V1Z"/>
                </svg>
              </button>
            </div>
            
            <div class="result-layout-item">
              <span class="field-label">Manufacturer:</span>
              <input v-if="isEditing && result" v-model="result.manufacturer" class="field-input" />
              <span v-else class="field-value">{{ result?.manufacturer || '-' }}</span>
            </div>
            <div class="result-layout-item">
              <span class="field-label">Model Year:</span>
              <input v-if="isEditing && result" v-model="result.model_year" class="field-input" />
              <span v-else class="field-value">{{ result?.model_year || '-' }}</span>
            </div>
            <div class="result-layout-item">
              <span class="field-label">Model:</span>
              <input v-if="isEditing && result" v-model="result.model" class="field-input" />
              <span v-else class="field-value">{{ result?.model || '-' }}</span>
            </div>
            <div class="result-layout-item">
              <span class="field-label">VIN:</span>
              <input v-if="isEditing && result" v-model="result.vin" class="field-input" />
              <span v-else class="field-value">{{ result?.vin || '-' }}</span>
            </div>
            <div class="result-layout-item">
              <span class="field-label">CCM:</span>
              <input v-if="isEditing && result" v-model="result.ccm" class="field-input" />
              <span v-else class="field-value">{{ result?.ccm || '-' }}</span>
            </div>
            <div class="result-layout-item">
              <span class="field-label">Registration:</span>
              <input v-if="isEditing && result" v-model="result.registration" class="field-input" />
              <span v-else class="field-value">{{ result?.registration || '-' }}</span>
            </div>
            <div class="result-layout-item">
              <span class="field-label">Type:</span>
              <input v-if="isEditing && result" v-model="result.type" class="field-input" />
              <span v-else class="field-value">{{ result?.type || '-' }}</span>
            </div>
            <div class="result-layout-item">
              <span class="field-label">Engine:</span>
              <input v-if="isEditing && result" v-model="result.engine" class="field-input" />
              <span v-else class="field-value">{{ result?.engine || '-' }}</span>
            </div>
            <div class="result-layout-item">
              <span class="field-label">Power:</span>
              <input v-if="isEditing && result" v-model="result.power" class="field-input" />
              <span v-else class="field-value">{{ result?.power || '-' }}</span>
            </div>
            <div class="result-layout-item">
              <span class="field-label">Weight:</span>
              <input v-if="isEditing && result" v-model="result.weight" class="field-input" />
              <span v-else class="field-value">{{ result?.weight || '-' }}</span>
            </div>
            <div class="result-layout-item">
              <span class="field-label">Driver Name:</span>
              <input v-if="isEditing && result" v-model="result.driver_name" class="field-input" />
              <span v-else class="field-value">{{ result?.driver_name || '-' }}</span>
            </div>
            <div class="result-layout-item">
              <span class="field-label">Driver Surname:</span>
              <input v-if="isEditing && result" v-model="result.driver_surname" class="field-input" />
              <span v-else class="field-value">{{ result?.driver_surname || '-' }}</span>
            </div>
            <div class="result-layout-item">
              <span class="field-label">Age:</span>
              <input v-if="isEditing && result" v-model="result.age" class="field-input" />
              <span v-else class="field-value">{{ result?.age || '-' }}</span>
            </div>
            <div class="result-layout-item">
              <span class="field-label">Sex:</span>
              <input v-if="isEditing && result" v-model="result.sex" class="field-input" />
              <span v-else class="field-value">{{ result?.sex || '-' }}</span>
            </div>
            <div class="result-layout-item">
              <span class="field-label">License No:</span>
              <input v-if="isEditing && result" v-model="result.license_no" class="field-input" />
              <span v-else class="field-value">{{ result?.license_no || '-' }}</span>
            </div>
            <div class="result-layout-item">
              <span class="field-label">Street:</span>
              <input v-if="isEditing && result" v-model="result.street" class="field-input" />
              <span v-else class="field-value">{{ result?.street || '-' }}</span>
            </div>
            <div class="result-layout-item">
              <span class="field-label">Subdistrict:</span>
              <input v-if="isEditing && result" v-model="result.subdistrict" class="field-input" />
              <span v-else class="field-value">{{ result?.subdistrict || '-' }}</span>
            </div>
            <div class="result-layout-item">
              <span class="field-label">District:</span>
              <input v-if="isEditing && result" v-model="result.district" class="field-input" />
              <span v-else class="field-value">{{ result?.district || '-' }}</span>
            </div>
            <div class="result-layout-item">
              <span class="field-label">Province:</span>
              <input v-if="isEditing && result" v-model="result.province" class="field-input" />
              <span v-else class="field-value">{{ result?.province || '-' }}</span>
            </div>
            <div class="result-layout-item">
              <span class="field-label">Zipcode:</span>
              <input v-if="isEditing && result" v-model="result.zipcode" class="field-input" />
              <span v-else class="field-value">{{ result?.zipcode || '-' }}</span>
            </div>
            <div class="result-layout-item">
              <span class="field-label">Damaged Parts:</span>
              <input v-if="isEditing && result" v-model="result.damaged_parts" class="field-input" />
              <span v-else class="field-value">{{ result?.damaged_parts || '-' }}</span>
            </div>
            <div class="result-layout-item">
              <span class="field-label">Repair Needed:</span>
              <input v-if="isEditing && result" v-model="result.repair_needed" class="field-input" />
              <span v-else class="field-value">{{ result?.repair_needed || '-' }}</span>
            </div>
            <div class="result-layout-item">
              <span class="field-label">Insurance Company:</span>
              <input v-if="isEditing && result" v-model="result.insurance_company" class="field-input" />
              <span v-else class="field-value">{{ result?.insurance_company || '-' }}</span>
            </div>
            <div class="result-layout-item">
              <span class="field-label">Policy No:</span>
              <input v-if="isEditing && result" v-model="result.policy_no" class="field-input" />
              <span v-else class="field-value">{{ result?.policy_no || '-' }}</span>
            </div>
          </div>

          <!-- File Upload Section -->
          <div class="input-section">
            <div class="form-group">
              <label class="form-label">Upload your JSON</label>
              <div class="file-input-wrapper">
                <input 
                  type="file" 
                  accept="image/*,.pdf,.doc,.docx,.txt" 
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

          <!-- Action Buttons -->
          <div class="action-buttons">
            <button 
              class="btn-secondary" 
              @click="submit" 
              :disabled="submitting || !file"
            >
              <span v-if="submitting" class="loading-spinner"></span>
              {{ submitting ? 'Processing...' : 'Submit' }}
            </button>
          </div>

          <!-- Status Messages -->
          <div v-if="error" class="error-message">
            <svg viewBox="0 0 24 24" width="20" height="20">
              <path fill="currentColor" d="M13,13H11V7H13M13,17H11V15H13M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z"/>
            </svg>
            {{ error }}
          </div>
          
          <div v-if="info" class="info-message">
            <svg viewBox="0 0 24 24" width="20" height="20">
              <path fill="currentColor" d="M11,9H13V7H11M12,20C7.59,20 4,16.41 4,12C4,7.59 7.59,4 12,4C16.41,4 20,7.59 20,12C20,16.41 16.41,20 12,20M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M11,17H13V11H11V17Z"/>
            </svg>
            {{ info }}
          </div>

        </section>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref } from "vue";

const file = ref(null);
const submitting = ref(false);
const error = ref("");
const info = ref("");
const result = ref(null);
const isEditing = ref(false);

function onFile(e) {
  const f = e.target.files?.[0];
  if (f) {
    file.value = f;
    error.value = "";
    info.value = `Selected: ${f.name}`;
  }
}

async function submit() {
  if (!file.value) {
    error.value = "Please select a file first";
    return;
  }

  submitting.value = true;
  error.value = "";
  info.value = "";

  try {
    // TODO: Replace with your actual API endpoint
    // const formData = new FormData();
    // formData.append("file", file.value);
    // const response = await fetch("/api/accident/extract", {
    //   method: "POST",
    //   body: formData,
    // });
    // result.value = await response.json();

    // Mock result for demonstration
    await new Promise(resolve => setTimeout(resolve, 1500));
    result.value = {
      "manufacturer": "กิตตวรรณ",
      "model_year": "2005",
      "model": "Civic",
      "vin": "1HGBH41JXMN109186",
      "ccm": "1800",
      "registration": "กข-1234",
      "type": "Sedan",
      "engine": "Petrol",
      "power": "140 HP",
      "weight": "1200 kg",
      "driver_name": "สมชาย",
      "driver_surname": "ใจดี",
      "age": "35",
      "sex": "Male",
      "license_no": "12345678",
      "street": "123 ถนนสุขุมวิท",
      "subdistrict": "คลองเตย",
      "district": "คลองเตย",
      "province": "กรุงเทพมหานคร",
      "zipcode": "10110",
      "damaged_parts": "Front bumper, headlight",
      "repair_needed": "Replace bumper and headlight assembly",
      "insurance_company": "Safe Drive Insurance",
      "policy_no": "POL-2025-001234"
    };
    info.value = "Car accident report processed successfully!";
  } catch (e) {
    error.value = `Failed to process accident report: ${e.message}`;
  } finally {
    submitting.value = false;
  }
}

function toggleEdit() {
  isEditing.value = !isEditing.value;
  info.value = isEditing.value ? "Editing mode enabled" : "Editing mode disabled";
}

async function copyResults() {
  try {
    // Format the data as shown in the box
    const textToCopy = `
Manufacturer: ${result.value?.manufacturer || '-'}
Model Year: ${result.value?.model_year || '-'}
Model: ${result.value?.model || '-'}
VIN: ${result.value?.vin || '-'}
CCM: ${result.value?.ccm || '-'}
Registration: ${result.value?.registration || '-'}
Type: ${result.value?.type || '-'}
Engine: ${result.value?.engine || '-'}
Power: ${result.value?.power || '-'}
Weight: ${result.value?.weight || '-'}
Driver Name: ${result.value?.driver_name || '-'}
Driver Surname: ${result.value?.driver_surname || '-'}
Age: ${result.value?.age || '-'}
Sex: ${result.value?.sex || '-'}
License No: ${result.value?.license_no || '-'}
Street: ${result.value?.street || '-'}
Subdistrict: ${result.value?.subdistrict || '-'}
District: ${result.value?.district || '-'}
Province: ${result.value?.province || '-'}
Zipcode: ${result.value?.zipcode || '-'}
Damaged Parts: ${result.value?.damaged_parts || '-'}
Repair Needed: ${result.value?.repair_needed || '-'}
Insurance Company: ${result.value?.insurance_company || '-'}
Policy No: ${result.value?.policy_no || '-'}
    `.trim();
    
    await navigator.clipboard.writeText(textToCopy);
    info.value = "Results copied to clipboard!";
  } catch (e) {
    error.value = "Failed to copy results";
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
  --radius: 24px;
  --shadow: 0 8px 32px rgba(0,0,0,.06), 0 2px 8px rgba(0,0,0,.04);
  --shadow-lg: 0 12px 40px rgba(0,0,0,.12), 0 4px 12px rgba(0,0,0,.08);
}

.upload-page {
  min-height: 100vh;
  background: var(--ivory);
}

.topbar {
  position: sticky;
  top: 0;
  z-index: 50;
  background: linear-gradient(180deg, rgba(247, 224, 184, .95), rgba(247, 224, 184, .7));
  -webkit-backdrop-filter: blur(6px);
  backdrop-filter: blur(6px);
  padding: 10px 0;
}

.container {
  width: min(1200px, 92vw);
  margin: 0 auto;
  padding: 0 16px;
}

.topbar-content {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 40%;
  margin-top: 2%;
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

.page {
  min-height: calc(100vh - 64px);
  padding: clamp(12px, 2.5vw, 24px) 0 48px;
  background: linear-gradient(180deg, rgba(247, 224, 184, .95), rgba(247, 224, 184, .7));
}

.main-section {
  padding: clamp(24px, 4vw, 32px);
  margin-bottom: 24px;
  background: var(--white);
  border: 2px solid var(--sage);
}

.card {
  background: var(--white);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
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

.result-layout-box {
  border: 2px solid #E5E7EB;
  border-radius: 12px;
  padding: 20px;
  padding-top: 50px;
  margin: 20px auto;
  background: #f8fafc;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  max-width: 400px;
  max-height: 400px;
  overflow-y: auto;
  position: relative;
}

.result-box-actions {
  position: absolute;
  top: 12px;
  right: 12px;
  display: flex;
  gap: 8px;
  z-index: 10;
}

.icon-btn {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: var(--white);
  border: 2px solid var(--sage);
  color: var(--sage);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.icon-btn:hover {
  background: var(--sage);
  color: var(--white);
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(105, 132, 116, 0.3);
}

.icon-btn:active {
  transform: translateY(0);
}

.result-layout-item {
  padding: 12px 0;
  font-size: 16px;
  color: var(--textDark);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.field-label {
  font-weight: 600;
  color: var(--sage);
  flex-shrink: 0;
  min-width: 140px;
}

.field-value {
  color: var(--textDark);
  text-align: right;
  word-break: break-word;
}

.field-input {
  flex: 1;
  padding: 6px 10px;
  border: 1px solid var(--sage);
  border-radius: 6px;
  font-size: 14px;
  color: var(--textDark);
  background: var(--white);
  text-align: right;
  transition: all 0.2s;
}

.field-input:focus {
  outline: none;
  border-color: var(--sageLight);
  box-shadow: 0 0 0 3px rgba(105, 132, 116, 0.1);
}

/* Custom scrollbar styling */
.result-layout-box::-webkit-scrollbar {
  width: 8px;
}

.result-layout-box::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 10px;
}

.result-layout-box::-webkit-scrollbar-thumb {
  background: var(--sage);
  border-radius: 10px;
}

.result-layout-box::-webkit-scrollbar-thumb:hover {
  background: var(--sageLight);
}

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
  margin-bottom: 12px;
}

.file-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
}

.file-input {
  display: none;
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
  font-size: 14px;
  color: var(--muted);
}

.action-buttons {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: center;
  margin-bottom: 24px;
}

.btn-secondary {
  padding: 16px 32px;
  background: #dc2626;
  color: white;
  border: none;
  border-radius: 12px;
  font-weight: 700;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 120px;
  justify-content: center;
}

.btn-secondary:hover:not(:disabled) {
  background: #a81d1d;
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.btn-secondary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid white;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

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

.preview-section {
  margin-top: 32px;
  padding: 24px;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-radius: 16px;
  border: 2px solid var(--sage);
}

.preview-header {
  margin-bottom: 20px;
}

.preview-title {
  font-size: 20px;
  font-weight: 700;
  color: var(--textDark);
  margin: 0;
}

.preview-grid {
  display: grid;
  gap: 16px;
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
  
  .btn-secondary {
    width: 100%;
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
  
  .main-section {
    padding: 20px;
  }
  
  .preview-section {
    padding: 16px;
  }
}
</style>

