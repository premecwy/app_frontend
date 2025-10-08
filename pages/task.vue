<template>
  <div class="task-page">

    <!-- Enhanced Top bar -->
    <header class="topbar">
      <div class="container">
        <div class="topbar-content">
          <button class="back-btn" @click="$router.back()" aria-label="Go back">
            <svg viewBox="0 0 24 24" width="20" height="20">
              <path fill="currentColor" d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
            </svg>
          </button>
          <h1 class="page-title">Your Tasks</h1>
      <div class="spacer"></div>
        </div>
      </div>
    </header>

    <main class="page">
      <div class="container">
        <!-- Error Message -->
        <div v-if="pageError" class="error-message">
          <svg viewBox="0 0 24 24" width="20" height="20">
            <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
          {{ pageError }}
        </div>

        <!-- Enhanced Task List Section -->
        <section class="task-section card">
          <div class="section-header">
            <h2 class="section-title">My Tasks</h2>
            <div class="header-actions">
              <button class="refresh-btn" @click="loadTasks" :disabled="loading">
                <svg viewBox="0 0 24 24" width="18" height="18">
                  <path fill="currentColor" d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
                </svg>
                {{ loading ? "Loading..." : "Refresh" }}
          </button>
        </div>
      </div>

          <!-- Enhanced Quick Add -->
      <div class="quick-add">
            <div class="input-wrapper">
        <input
          v-model.trim="quickName"
          class="quick-input"
          type="text"
                placeholder="Add a new task..."
          @keyup.enter="addQuick()"
        />
        <button class="quick-btn" :disabled="!quickName || addingQuick" @click="addQuick">
                <svg v-if="!addingQuick" viewBox="0 0 24 24" width="20" height="20">
                  <path fill="currentColor" d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                </svg>
                <span v-else class="loading-spinner"></span>
          {{ addingQuick ? "Adding..." : "Add" }}
        </button>
      </div>
          </div>
          
          <div v-if="quickError" class="error-message">{{ quickError }}</div>

          <!-- Enhanced Task List -->
          <div v-if="tasks.length" class="task-list">
            <div v-for="t in tasks" :key="t.id" class="task-item" :class="{ completed: t.done }" @click="showTaskDetails(t)">
              <div class="task-checkbox">
                <input type="checkbox" v-model="t.done" @change="toggleDone(t)" id="task-{{ t.id }}" @click.stop />
                <label :for="'task-' + t.id" class="checkbox-label"></label>
            </div>
              <div class="task-content">
                <div class="task-header">
                  <h3 class="task-name" :class="{ done: t.done }">{{ t.name }}</h3>
                  <div class="task-actions" @click.stop>
                    <button class="action-btn edit-btn" title="Edit task" @click="startEdit(t)">
                      <svg viewBox="0 0 24 24" width="16" height="16">
                        <path fill="currentColor" d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                      </svg>
                    </button>
                    <button class="action-btn delete-btn" title="Delete task" @click="removeTask(t)">
                      <svg viewBox="0 0 24 24" width="16" height="16">
                        <path fill="currentColor" d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                      </svg>
                    </button>
                </div>
              </div>
              </div>
            </div>
          </div>

          <div v-else class="empty-state">
            <div class="empty-icon">📝</div>
            <h3>No tasks yet</h3>
            <p>Create your first task to get started!</p>
          </div>
    </section>

        <!-- Enhanced Create Button -->
        <button v-if="!openForm" class="create-btn" @click="openCreate()">
          <svg viewBox="0 0 24 24" width="20" height="20">
            <path fill="currentColor" d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
          </svg>
          Create New Task
        </button>

        <!-- Enhanced Form Modal -->
        <div v-if="openForm" class="form-overlay" @click="cancelForm">
          <div class="form-container">
            <section class="form card" @click.stop>
            <div class="form-header">
              <button class="back-btn" @click="cancelForm" aria-label="Close form">
                <svg viewBox="0 0 24 24" width="20" height="20">
                  <path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                </svg>
              </button>
              <h2 class="form-title">{{ editingId ? "Edit Task" : "Create New Task" }}</h2>
        <div class="spacer"></div>
      </div>

            <form @submit.prevent="submit" class="task-form">
              <div class="form-group">
                <label class="form-label">Task Name<span class="required">*</span></label>
        <input
          v-model.trim="form.name"
                  class="form-input"
          type="text"
                  placeholder="Enter task name..."
          required
        />
              </div>

              <div class="form-group">
                <label class="form-label">Description</label>
        <textarea
          v-model.trim="form.description"
                  class="form-textarea"
          rows="3"
                  placeholder="Add a description (optional)..."
        ></textarea>
              </div>

              <div class="datetime-group">
                <div class="form-group">
                  <label class="form-label">Date</label>
                  <div class="input-with-icon">
                    <svg viewBox="0 0 24 24" width="18" height="18">
                      <path fill="currentColor" d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/>
                    </svg>
                    <input v-model="form.date" type="date" class="form-input" />
            </div>
          </div>
                <div class="form-group">
                  <label class="form-label">Time</label>
                  <div class="input-with-icon">
                    <svg viewBox="0 0 24 24" width="18" height="18">
                      <path fill="currentColor" d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z"/>
                    </svg>
                    <input v-model="form.time" type="time" class="form-input" step="60" />
            </div>
          </div>
        </div>

              <div v-if="formError" class="error-message">{{ formError }}</div>

              <div class="form-actions">
                <button class="btn-secondary" type="button" @click="cancelForm">Cancel</button>
                <button class="btn-primary" type="submit" :disabled="submitting">
                  <span v-if="submitting" class="loading-spinner"></span>
                  {{ submitting ? (editingId ? "Saving..." : "Creating...") : (editingId ? "Save Changes" : "Create Task") }}
          </button>
        </div>
      </form>
    </section>
          </div>
        </div>
      </div>
    </main>

    <!-- Task Details Popup -->
    <div v-if="selectedTask" class="task-popup-overlay" @click="closeTaskDetails">
      <div class="task-popup-container" @click.stop>
        <div class="task-popup-header">
          <h3 class="task-popup-title">{{ selectedTask.name }}</h3>
          <button class="close-btn" @click="closeTaskDetails" aria-label="Close details">
            <svg viewBox="0 0 24 24" width="16" height="16">
              <path fill="currentColor" d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"/>
            </svg>
          </button>
        </div>
        
        <div class="task-popup-content">
          <div v-if="selectedTask.description" class="task-detail-section description-section">
            <h4 class="detail-label">Description</h4>
            <div class="description-content">
              <p class="detail-value">{{ selectedTask.description }}</p>
            </div>
          </div>
          
          <div v-if="selectedTask.time_specified" class="task-detail-section schedule-section">
            <h4 class="detail-label">Schedule</h4>
            <div class="schedule-content">
              <div v-if="selectedTask.date" class="meta-item">
                <svg viewBox="0 0 24 24" width="16" height="16">
                  <path fill="currentColor" d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/>
                </svg>
                {{ formatDate(selectedTask.date) }}
              </div>
              <div v-if="selectedTask.time" class="meta-item">
                <svg viewBox="0 0 24 24" width="16" height="16">
                  <path fill="currentColor" d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z"/>
                </svg>
                {{ formatTime(selectedTask.time) }}
              </div>
            </div>
          </div>
          
          <div class="task-detail-section status-section">
            <h4 class="detail-label">Status</h4>
            <div class="status-content">
              <span class="status-badge" :class="{ completed: selectedTask.done }">
                {{ selectedTask.done ? 'Completed' : 'Pending' }}
              </span>
            </div>
          </div>
        </div>
        
        <!-- <div class="task-popup-footer">
          <button class="btn-edit" @click="editFromPopup">
            <svg viewBox="0 0 24 24" width="16" height="16">
              <path fill="currentColor" d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
            </svg>
            Edit Task
          </button>
          <button class="btn-delete" @click="deleteFromPopup">
            <svg viewBox="0 0 24 24" width="16" height="16">
              <path fill="currentColor" d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
            </svg>
            Delete Task
          </button>
        </div> -->
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";

type Task = {
  id: string | number;
  name: string;
  description?: string;
  time_specified: boolean;
  date?: string; // YYYY-MM-DD or ISO
  time?: string; // HH:mm or HH:mm:ss
  done?: boolean;
};

const API_BASE = (import.meta as any).env?.VITE_API_BASE?.replace(/\/+$/, "") || "http://localhost:8080";
const api = (path = "") => `${API_BASE}/api/tasks${path}`;

const tasks = ref<Task[]>([]);
const loading = ref(false);
const pageError = ref("");

/* task details popup */
const selectedTask = ref<Task | null>(null);

/* manual add */
const quickName = ref("");
const addingQuick = ref(false);
const quickError = ref("");

/* form */
const openForm = ref(false);
const editingId = ref<string | number | null>(null);
const submitting = ref(false);
const formError = ref("");

const form = ref<Partial<Task>>({
  name: "",
  description: "",
  time_specified: true,
  date: new Date().toISOString().slice(0, 10),
  time: "19:00",
});

/* ---------- utils ---------- */
function toHHMMSS(t?: string) {
  if (!t) return undefined;
  if (/^\d{2}:\d{2}:\d{2}$/.test(t)) return t;
  if (/^\d{1,2}:\d{2}$/.test(t)) {
    const [h, m] = t.split(":");
    return `${h.padStart(2, "0")}:${m.padStart(2, "0")}:00`;
  }
  return t;
}
function toISODate(d?: string) {
  if (!d) return undefined;
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(d)) {
    const [dd, mm, yyyy] = d.split("/");
    return `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
  }
  return d;
}
function formatDate(d?: string) {
  if (!d) return "";
  if (/^\d{4}-\d{2}-\d{2}/.test(d)) {
    const [y, m, day] = d.substring(0, 10).split("-").map(Number);
    return `${day}/${m}/${y}`;
  }
  return d;
}
function formatTime(t?: string) {
  if (!t) return "";
  const hhmm = toHHMMSS(t);
  return hhmm ? hhmm.slice(0, 5) : t;
}
function parseApiError(e: any) {
  if (typeof e === "string") return e;
  if (e?.detail) {
    if (Array.isArray(e.detail)) return e.detail.map((d:any)=>d.msg||d.detail||JSON.stringify(d)).join(" | ");
    return e.detail;
  }
  return e?.message || "Unknown error";
}

/* ---------- CRUD ---------- */
async function loadTasks() {
  loading.value = true;
  pageError.value = "";
  try {
    const r = await fetch(api(""));
    if (!r.ok) throw await r.json().catch(async () => ({ message: await r.text() }));
    const data = await r.json().catch(() => ({}));
    tasks.value = Array.isArray(data) ? data : data.items || [];
    
    // Add mock data if no tasks exist
    if (tasks.value.length === 0) {
      tasks.value = [
        {
          id: 1,
          name: "Complete project proposal",
          description: "Write and submit the quarterly project proposal for Q1 2024",
          time_specified: true,
          date: new Date().toISOString().slice(0, 10),
          time: "14:00:00",
          done: false
        },
        {
          id: 2,
          name: "Team meeting",
          description: "Weekly standup with the development team",
          time_specified: true,
          date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
          time: "10:00:00",
          done: false
        },
        {
          id: 3,
          name: "Review code changes",
          description: "Review and approve pending pull requests",
          time_specified: true,
          date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
          time: "16:30:00",
          done: true
        },
        {
          id: 4,
          name: "Update documentation",
          description: "Update API documentation for new features",
          time_specified: false,
          done: false
        },
        {
          id: 5,
          name: "Client presentation",
          description: "Prepare and deliver presentation to key client",
          time_specified: true,
          date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
          time: "09:00:00",
          done: false
        }
      ];
    }
  } catch (e: any) {
    pageError.value = "Load failed: " + parseApiError(e);
    // Add mock data even when API fails
    tasks.value = [
      {
        id: 1,
        name: "Complete project proposal",
        description: "Write and submit the quarterly project proposal for Q1 2024",
        time_specified: true,
        date: new Date().toISOString().slice(0, 10),
        time: "14:00:00",
        done: false
      },
      {
        id: 2,
        name: "Team meeting",
        description: "Weekly standup with the development team",
        time_specified: true,
        date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        time: "10:00:00",
        done: false
      },
      {
        id: 3,
        name: "Review code changes",
        description: "Review and approve pending pull requests",
        time_specified: true,
        date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        time: "16:30:00",
        done: true
      },
      {
        id: 4,
        name: "Update documentation",
        description: "Update API documentation for new features",
        time_specified: false,
        done: false
      },
      {
        id: 5,
        name: "Client presentation",
        description: "Prepare and deliver presentation to key client",
        time_specified: true,
        date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        time: "09:00:00",
        done: false
      }
    ];
  } finally {
    loading.value = false;
  }
}

function buildPayload(src: {name?:string, description?:string, time_specified?:any, date?:string, time?:string}) {
  const dateISO = toISODate(src.date);
  const timeFull = toHHMMSS(src.time);
  const datetime = dateISO && timeFull ? `${dateISO}T${timeFull}` : undefined;

  // primary
  const p1: any = { name: src.name, description: src.description || "", time_specified: !!src.time_specified };
  if (src.time_specified) { p1.date = dateISO; p1.time = timeFull; }

  // alt shapes
  const p2 = { title: src.name, details: src.description || "", has_time: !!src.time_specified, date: dateISO, time: timeFull, datetime };
  const p3 = { name: src.name, description: src.description || "", datetime, time_specified: !!src.time_specified };

  return [p1, p3, p2]; // ลองตามลำดับนี้
}

async function createTaskSmart(src: any) {
  const tries = buildPayload(src);
  let lastErr = "";
  for (const payload of tries) {
    try {
      const r = await fetch(api(""), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (!r.ok) {
        const body = await r.json().catch(async () => ({ message: await r.text() }));
        const msg = parseApiError(body);
        if ((r.status === 400 || r.status === 422) && String(msg).toLowerCase().includes("pattern")) { lastErr = msg; continue; }
        throw new Error(msg);
      }
      return await r.json();
    } catch (e:any) { lastErr = parseApiError(e); }
  }
  throw new Error(lastErr || "Create failed");
}

async function updateTask(id: string | number, payload: any) {
  const r = await fetch(api("/" + id), { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
  if (!r.ok) throw await r.json().catch(async () => ({ message: await r.text() }));
  return await r.json();
}
async function deleteTask(id: string | number) {
  const r = await fetch(api("/" + id), { method: "DELETE" });
  if (!r.ok) throw await r.json().catch(async () => ({ message: await r.text() }));
}

/* ---------- Manual add ---------- */
async function addQuick() {
  if (!quickName.value) return;
  quickError.value = ""; addingQuick.value = true;
  try {
    const created = await createTaskSmart({ name: quickName.value, description: "", time_specified: false });
    tasks.value.unshift((created.item ?? created) as Task);
    quickName.value = "";
  } catch (e:any) {
    quickError.value = parseApiError(e);
  } finally {
    addingQuick.value = false;
  }
}

/* ---------- Form handlers ---------- */
function openCreate() {
  editingId.value = null;
  form.value = { name: "", description: "", time_specified: true, date: new Date().toISOString().slice(0, 10), time: "19:00" };
  formError.value = "";
  openForm.value = true;
}
function startEdit(t: Task) {
  editingId.value = t.id;
  form.value = {
    name: t.name,
    description: t.description || "",
    time_specified: !!t.time_specified,
    date: toISODate(t.date) || new Date().toISOString().slice(0, 10),
    time: toHHMMSS(t.time)?.slice(0, 5) || "19:00",
  };
  formError.value = "";
  openForm.value = true;
}
function cancelForm() { openForm.value = false; editingId.value = null; }

async function submit() {
  if (!form.value.name) { formError.value = "กรุณาใส่ Task Name"; return; }
  submitting.value = true; formError.value = "";
  try {
    if (editingId.value == null) {
      const created = await createTaskSmart({
        name: form.value.name!,
        description: form.value.description || "",
        time_specified: form.value.time_specified,
        date: form.value.date,
        time: form.value.time,
      });
      tasks.value.unshift((created.item ?? created) as Task);
    } else {
      const [p1] = buildPayload({
        name: form.value.name!,
        description: form.value.description || "",
        time_specified: form.value.time_specified,
        date: form.value.date,
        time: form.value.time,
      });
      const updated = await updateTask(editingId.value, p1);
      const newData = (updated.item ?? updated) as Task;
      const idx = tasks.value.findIndex((x) => x.id === editingId.value);
      if (idx >= 0) tasks.value[idx] = { ...tasks.value[idx], ...newData };
    }
    cancelForm();
  } catch (e:any) {
    formError.value = parseApiError(e);
  } finally {
    submitting.value = false;
  }
}

async function removeTask(t: Task) {
  const ok = confirm(`Delete task "${t.name}" ?`);
  if (!ok) return;
  const old = [...tasks.value];
  tasks.value = tasks.value.filter((x) => x.id !== t.id);
  try { await deleteTask(t.id); }
  catch (e:any) { tasks.value = old; pageError.value = "Delete failed: " + parseApiError(e); }
}
async function toggleDone(t: Task) {
  const old = t.done;
  try { t.done = !old; await updateTask(t.id, { done: t.done }); }
  catch { t.done = old; }
}

/* task details popup functions */
function showTaskDetails(task: Task) {
  selectedTask.value = task;
}

function closeTaskDetails() {
  selectedTask.value = null;
}

function editFromPopup() {
  if (selectedTask.value) {
    startEdit(selectedTask.value);
    closeTaskDetails();
  }
}

function deleteFromPopup() {
  if (selectedTask.value) {
    removeTask(selectedTask.value);
    closeTaskDetails();
  }
}

onMounted(loadTasks);
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
  color: #1a1a1a !important; 
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
  background: var(--ivory);
}

/* Page Layout */
.task-page {
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
  /* gap: 2px; */
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
  border: 2px solid var(--sage);
  background: var(--white);
  color: var(--sage);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.back-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(105, 132, 116, 0.3);
}

.page-title {
  font-size: clamp(24px, 3vw, 32px);
  font-weight: 800;
  color: #0f0f0f;
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

/* Task Section */
.task-section {
  padding: clamp(24px, 4vw, 32px);
  margin-bottom: 24px;
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border: 2px solid var(--sage);
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 2px solid var(--peach);
}

.section-title {
  font-size: clamp(28px, 4vw, 36px);
  font-weight: 800;
  color: #0f0f0f;
  margin: 0;
}

.refresh-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: var(--sage);
  color: var(--white);
  border: none;
  border-radius: 20px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.refresh-btn:hover:not(:disabled) {
  background: var(--sageLight);
  transform: translateY(-2px);
}

.refresh-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Quick Add */
.quick-add {
  margin-bottom: 24px;
}

.input-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  background: linear-gradient(135deg, var(--peach) 0%, #FFE4D1 100%);
  border-radius: 20px;
  border: 2px solid var(--sand);
}

.quick-input {
  flex: 1;
  border: none;
  background: transparent;
  font-size: 16px;
  color: var(--textDark);
  outline: none;
}

.quick-input::placeholder {
  color: var(--muted);
}

.quick-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: var(--sage);
  color: var(--white);
  border: none;
  border-radius: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.quick-btn:hover:not(:disabled) {
  background: var(--sageLight);
  transform: translateY(-2px);
}

.quick-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Error Messages */
.error-message {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: #FEF2F2;
  color: var(--error);
  border: 1px solid #FECACA;
  border-radius: 12px;
  font-weight: 600;
  margin: 12px 0;
}

/* Task List */
.task-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.task-item {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 20px;
  background: var(--white);
  border: 2px solid var(--peach);
  border-radius: 16px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.task-item:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
  border-color: var(--sand);
}

.task-item.completed {
  opacity: 0.7;
  background: #F9FAFB;
}

.task-checkbox {
  position: relative;
  margin-top: 4px;
}

.task-checkbox input[type="checkbox"] {
  opacity: 0;
  position: absolute;
}

.checkbox-label {
  display: block;
  width: 24px;
  height: 24px;
  border: 2px solid var(--sage);
  border-radius: 6px;
  background: var(--white);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
}

.checkbox-label::after {
  content: '';
  position: absolute;
  left: 6px;
  top: 2px;
  width: 6px;
  height: 12px;
  border: solid var(--white);
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
  opacity: 0;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.task-checkbox input[type="checkbox"]:checked + .checkbox-label {
  background: var(--sage);
  border-color: var(--sage);
}

.task-checkbox input[type="checkbox"]:checked + .checkbox-label::after {
  opacity: 1;
}

.task-content {
  flex: 1;
  min-width: 0;
}

.task-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.task-name {
  font-size: 18px;
  font-weight: 700;
  color: #0f0f0f;
  margin: 0;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.task-name.done {
  text-decoration: line-through;
  color: var(--muted);
}

.task-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  width: 36px;
  height: 36px;
  border: 2px solid #E5E7EB;
  background: var(--white);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.edit-btn:hover {
  border-color: var(--sage);
  background: var(--sage);
  color: var(--white);
}

.delete-btn:hover {
  border-color: var(--error);
  background: var(--error);
  color: var(--white);
}

.task-description {
  color: var(--muted);
  margin: 8px 0;
  line-height: 1.5;
}

.task-meta {
  display: flex;
  gap: 16px;
  margin-top: 12px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--muted);
  font-size: 14px;
  font-weight: 500;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 48px 24px;
  color: var(--muted);
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.empty-state h3 {
  font-size: 24px;
  font-weight: 700;
  color: var(--textDark);
  margin: 0 0 8px;
}

.empty-state p {
  font-size: 16px;
  margin: 0;
}

/* Create Button */
.create-btn {
  position: fixed;
  bottom: 24px;
  right: 24px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px 24px;
  background: linear-gradient(135deg, var(--sage) 0%, var(--sageLight) 100%);
  color: var(--white);
  border: 2px solid var(--sage);
  border-radius: 50px;
  font-weight: 700;
  font-size: 16px;
  cursor: pointer;
  box-shadow: var(--shadow-lg);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 40;
}

.create-btn:hover {
  transform: translateY(-4px);
  box-shadow: 0 16px 48px rgba(105, 132, 116, 0.4);
  background: linear-gradient(135deg, var(--sageLight) 0%, #5a7a6a 100%);
}

/* Form Overlay */
.form-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  z-index: 1000;
  -webkit-backdrop-filter: blur(4px);
  backdrop-filter: blur(4px);
  animation: fadeIn 0.3s ease-out;
}

.form-container {
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  animation: slideUp 0.3s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { 
    opacity: 0;
    transform: translateY(30px);
  }
  to { 
    opacity: 1;
    transform: translateY(0);
  }
}

.form {
  padding: 32px;
  background: linear-gradient(135deg, #fff5f5 0%, #fff5f5 100%);
  border-radius: var(--radius);
  box-shadow: var(--shadow-lg);
  border: 2px solid var(--sage);
}

.form-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 32px;
  padding-bottom: 16px;
  border-bottom: 2px solid var(--sage);
}

.form-title {
  font-size: 28px;
  font-weight: 800;
  color: #0f0f0f;
  margin: 0;
  flex: 1;
  text-align: center;
}

/* Form Elements */
.task-form {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-label {
  font-weight: 700;
  color: var(--textDark);
  font-size: 16px;
}

.required {
  color: var(--error);
  margin-left: 4px;
}

.form-input,
.form-textarea {
  padding: 16px 20px;
  border: 2px solid #E5E7EB;
  border-radius: 12px;
  font-size: 16px;
  background: var(--white);
  color: var(--textDark);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.form-input:focus,
.form-textarea:focus {
  outline: none;
  border-color: var(--sage);
  box-shadow: 0 0 0 4px rgba(105, 132, 116, 0.15);
}

.form-textarea {
  resize: vertical;
  min-height: 100px;
}


.datetime-group {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.input-with-icon {
  position: relative;
}

.input-with-icon svg {
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--muted);
  pointer-events: none;
}

.input-with-icon .form-input {
  padding-left: 48px;
}

.form-actions {
  display: flex;
  gap: 16px;
  justify-content: center;
  margin-top: 32px;
}

.btn-secondary,
.btn-primary {
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
}

.btn-secondary {
  background: #ff4444;
  color: white;
  /* border: 2px solid #ff4444; */
}

.btn-secondary:hover {
  background: #dc2626;
  /* border-color: #dc2626; */
  transform: translateY(-2px);
}

.btn-primary {
  background: linear-gradient(135deg, #10B981 0%, #059669 100%);
  color: white;
  /* border: 2px solid #10B981; */
}

.btn-primary:hover:not(:disabled) {
  background: linear-gradient(135deg, #059669 0%, #047857 100%);
  /* border-color: #059669; */
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
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
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Responsive Design */
@media (max-width: 768px) {
  .container {
    padding: 0 12px;
  }
  
  .datetime-group {
    grid-template-columns: 1fr;
  }
  
  .form {
    padding: 24px;
  }
  
  .create-btn {
    bottom: 16px;
    right: 16px;
    padding: 12px 20px;
    font-size: 14px;
  }
  
  .task-item {
    padding: 16px;
  }
  
  .form-actions {
    flex-direction: column;
  }
}

@media (max-width: 480px) {
  .page-title {
    font-size: 20px;
  }
  
  .section-title {
    font-size: 24px;
  }
  
  .task-name {
    font-size: 16px;
  }
  
  .form-title {
    font-size: 24px;
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
.refresh-btn:focus-visible,
.quick-btn:focus-visible,
.action-btn:focus-visible,
.create-btn:focus-visible,
.btn-secondary:focus-visible,
.btn-primary:focus-visible {
  outline: 2px solid var(--sage);
  outline-offset: 2px;
}

/* Task Details Popup */
.task-popup-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.2s ease-out;
}

.task-popup-container {
  background: #f8fafc;
  border-radius: 16px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow: hidden;
  animation: slideUp 0.3s ease-out;
  border: 2px solid var(--sage);
}

.task-popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px 16px;
  background: linear-gradient(135deg, var(--sage) 0%, var(--sageLight) 100%);
  color: var(--white);
}

.task-popup-title {
  font-size: 20px;
  font-weight: 700;
  margin: 0;
  color: var(--white);
}

.task-popup-content {
  padding: 5px 24px 24px;
  max-height: 50vh;
  overflow-y: auto;
}

.task-detail-section {
  margin-bottom: 15px;
}

.task-detail-section:last-child {
  margin-bottom: 0;
}

.description-section {
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-radius: 12px;
  padding: 5px 20px 20px;
  border: 1px solid #e2e8f0;
  position: relative;
  overflow: hidden;
}

.description-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, var(--sage) 0%, var(--sageLight) 100%);
}

.description-content {
  position: relative;
  z-index: 1;
}

.detail-label {
  font-size: 14px;
  font-weight: 600;
  color: var(--sage);
  margin-bottom: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.detail-label::before {
  content: '📝';
  font-size: 16px;
}

.schedule-section .detail-label::before {
  content: '📅';
}

.status-section .detail-label::before {
  content: '⚡';
}

.detail-value {
  font-size: 16px;
  color: var(--textDark);
  line-height: 1.6;
  margin: 0;
  font-weight: 400;
}

.schedule-section {
  background: linear-gradient(135deg, #fef7f0 0%, #fef3e7 100%);
  border-radius: 12px;
  padding: 5px 20px 20px;
  border: 1px solid #fed7aa;
  position: relative;
}

.schedule-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, #f59e0b 0%, #fbbf24 100%);
}

.schedule-content {
  position: relative;
  z-index: 1;
}

.status-section {
  background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%);
  border-radius: 12px;
  padding: 5px 20px 20px;
  border: 1px solid #bbf7d0;
  position: relative;
}

.status-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, #10b981 0%, #34d399 100%);
}

.status-content {
  position: relative;
  z-index: 1;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  font-size: 14px;
  color: var(--muted);
}

.meta-item:last-child {
  margin-bottom: 0;
}

.meta-item svg {
  color: var(--sage);
}

.status-badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  background: var(--warning);
  color: var(--textDark);
}

.status-badge.completed {
  background: var(--success);
  color: var(--white);
}

.task-popup-footer {
  padding: 16px 24px 20px;
  background: #f8fafc;
  border-top: 1px solid #e2e8f0;
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.btn-edit, .btn-delete {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-edit {
  background: var(--sage);
  color: var(--white);
}

.btn-edit:hover {
  background: var(--sageLight);
  transform: translateY(-1px);
}

.btn-delete {
  background: var(--error);
  color: var(--white);
}

.btn-delete:hover {
  background: #dc2626;
  transform: translateY(-1px);
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

/* Responsive styling for popup */
@media (max-width: 768px) {
  .task-popup-container {
    max-width: 400px;
    width: 95%;
  }
  
  .task-popup-header {
    padding: 16px 20px 12px;
  }
  
  .task-popup-title {
    font-size: 18px;
  }
  
  .task-popup-content {
    padding: 20px;
  }
  
  .task-popup-footer {
    padding: 12px 20px 16px;
    flex-direction: column;
  }
  
  .btn-edit, .btn-delete {
    width: 100%;
    justify-content: center;
  }
}
</style>
