<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { apiFetch } from '../api.js'

const entries = ref([])
const loading = ref(true)
const error = ref(null)

let refreshTimer = null

const agentColors = {}
const colorPool = [
  'text-emerald-400 bg-emerald-500/20',
  'text-blue-400 bg-blue-500/20',
  'text-purple-400 bg-purple-500/20',
  'text-amber-400 bg-amber-500/20',
  'text-rose-400 bg-rose-500/20',
  'text-cyan-400 bg-cyan-500/20',
  'text-orange-400 bg-orange-500/20',
  'text-teal-400 bg-teal-500/20',
]
let colorIndex = 0

function getAgentColor(agentId) {
  if (!agentColors[agentId]) {
    agentColors[agentId] = colorPool[colorIndex % colorPool.length]
    colorIndex++
  }
  return agentColors[agentId]
}

function timeAgo(dateStr) {
  if (!dateStr) return ''
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (seconds < 60) return `${seconds}s ago`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  return `${Math.floor(seconds / 86400)}d ago`
}

async function loadEntries() {
  try {
    error.value = null
    const res = await apiFetch('/api/hive-mind?limit=20')
    entries.value = res.entries || []
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadEntries()
  refreshTimer = setInterval(loadEntries, 30000)
})

onUnmounted(() => {
  if (refreshTimer) clearInterval(refreshTimer)
})
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-lg font-semibold text-gray-100">Hive Mind Activity</h2>
      <button
        @click="loadEntries"
        class="text-xs text-gray-500 hover:text-gray-300 px-2 py-1 rounded bg-gray-800 hover:bg-gray-700 transition-colors"
      >
        Refresh
      </button>
    </div>

    <div v-if="loading" class="flex items-center justify-center py-20">
      <div class="text-gray-500 text-sm">Loading activity...</div>
    </div>

    <div v-else-if="error" class="p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
      {{ error }}
    </div>

    <div v-else>
      <div v-if="entries.length === 0" class="text-center py-12 text-gray-500 text-sm">
        No hive mind activity yet.
      </div>

      <div class="space-y-2">
        <div
          v-for="(entry, i) in entries"
          :key="i"
          class="bg-gray-900 rounded-lg p-4 border border-gray-800"
        >
          <div class="flex items-start gap-3">
            <span
              class="shrink-0 text-xs px-2 py-0.5 rounded font-mono font-medium"
              :class="getAgentColor(entry.agent_id)"
            >
              {{ entry.agent_id }}
            </span>
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2 mb-1">
                <span class="text-xs font-semibold text-gray-300 uppercase tracking-wide bg-gray-800 px-1.5 py-0.5 rounded">
                  {{ entry.action }}
                </span>
                <span class="text-xs text-gray-600">{{ timeAgo(entry.created_at) }}</span>
              </div>
              <p class="text-sm text-gray-300 leading-relaxed">{{ entry.summary }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
