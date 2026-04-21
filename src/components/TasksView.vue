<script setup>
import { ref, onMounted } from 'vue'
import { apiFetch } from '../api.js'

const scheduledTasks = ref([])
const missionTasks = ref([])
const loading = ref(true)
const error = ref(null)

async function loadTasks() {
  try {
    error.value = null
    const [schedRes, missionRes] = await Promise.allSettled([
      apiFetch('/api/tasks'),
      apiFetch('/api/mission/tasks'),
    ])

    if (schedRes.status === 'fulfilled') scheduledTasks.value = schedRes.value.tasks || []
    if (missionRes.status === 'fulfilled') missionTasks.value = missionRes.value.tasks || []
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleString()
}

const statusColors = {
  queued: 'bg-gray-600 text-gray-200',
  in_progress: 'bg-blue-500/20 text-blue-400',
  completed: 'bg-emerald-500/20 text-emerald-400',
  failed: 'bg-red-500/20 text-red-400',
}

function getStatusColor(status) {
  return statusColors[status] || 'bg-gray-700 text-gray-300'
}

onMounted(() => {
  loadTasks()
})
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-lg font-semibold text-gray-100">Tasks</h2>
      <button
        @click="loadTasks"
        class="text-xs text-gray-500 hover:text-gray-300 px-2 py-1 rounded bg-gray-800 hover:bg-gray-700 transition-colors"
      >
        Refresh
      </button>
    </div>

    <div v-if="loading" class="flex items-center justify-center py-20">
      <div class="text-gray-500 text-sm">Loading tasks...</div>
    </div>

    <div v-else-if="error" class="p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
      {{ error }}
    </div>

    <div v-else>
      <!-- Scheduled Tasks -->
      <div class="mb-8">
        <h3 class="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Scheduled Tasks</h3>
        <div class="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
          <div v-if="scheduledTasks.length === 0" class="p-4 text-sm text-gray-500">No scheduled tasks.</div>
          <table v-else class="w-full text-sm">
            <thead>
              <tr class="border-b border-gray-800 text-xs text-gray-500 uppercase tracking-wider">
                <th class="text-left p-3">Prompt</th>
                <th class="text-left p-3">Cron</th>
                <th class="text-left p-3">Agent</th>
                <th class="text-left p-3">Last Run</th>
                <th class="text-left p-3">Next Run</th>
                <th class="text-left p-3">Status</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-800">
              <tr v-for="task in scheduledTasks" :key="task.id" class="hover:bg-gray-800/50">
                <td class="p-3 text-gray-300 max-w-xs truncate">{{ task.prompt }}</td>
                <td class="p-3 text-gray-400 font-mono text-xs">{{ task.cron }}</td>
                <td class="p-3">
                  <span class="text-xs px-2 py-0.5 rounded bg-gray-800 text-emerald-400 font-mono">
                    {{ task.agent_id }}
                  </span>
                </td>
                <td class="p-3 text-gray-500 text-xs">{{ formatDate(task.last_run) }}</td>
                <td class="p-3 text-gray-500 text-xs">{{ formatDate(task.next_run) }}</td>
                <td class="p-3">
                  <span
                    class="text-xs px-2 py-0.5 rounded-full"
                    :class="task.paused ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'"
                  >
                    {{ task.paused ? 'Paused' : 'Active' }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Mission Tasks -->
      <div>
        <h3 class="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Mission Tasks</h3>
        <div class="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
          <div v-if="missionTasks.length === 0" class="p-4 text-sm text-gray-500">No mission tasks.</div>
          <table v-else class="w-full text-sm">
            <thead>
              <tr class="border-b border-gray-800 text-xs text-gray-500 uppercase tracking-wider">
                <th class="text-left p-3">Title</th>
                <th class="text-left p-3">Agent</th>
                <th class="text-left p-3">Status</th>
                <th class="text-left p-3">Created</th>
                <th class="text-left p-3">Prompt</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-800">
              <tr v-for="task in missionTasks" :key="task.id" class="hover:bg-gray-800/50">
                <td class="p-3 text-gray-200 font-medium">{{ task.title }}</td>
                <td class="p-3">
                  <span class="text-xs px-2 py-0.5 rounded bg-gray-800 text-emerald-400 font-mono">
                    {{ task.assigned_agent }}
                  </span>
                </td>
                <td class="p-3">
                  <span
                    class="text-xs px-2 py-0.5 rounded-full"
                    :class="getStatusColor(task.status)"
                  >
                    {{ task.status }}
                  </span>
                </td>
                <td class="p-3 text-gray-500 text-xs">{{ formatDate(task.created_at) }}</td>
                <td class="p-3 text-gray-400 max-w-xs truncate text-xs">{{ task.prompt }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>
