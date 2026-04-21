<script setup>
import { ref, onMounted } from 'vue'
import { apiFetch } from '../api.js'

const stats = ref(null)
const fading = ref([])
const topAccessed = ref([])
const loading = ref(true)
const error = ref(null)

async function loadMemories() {
  try {
    error.value = null
    const res = await apiFetch('/api/memories')
    stats.value = res.stats || null
    fading.value = res.fading || []
    topAccessed.value = res.topAccessed || []
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

function truncate(text, len = 120) {
  if (!text) return ''
  return text.length > len ? text.slice(0, len) + '...' : text
}

onMounted(() => {
  loadMemories()
})
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-lg font-semibold text-gray-100">Memory Browser</h2>
      <button
        @click="loadMemories"
        class="text-xs text-gray-500 hover:text-gray-300 px-2 py-1 rounded bg-gray-800 hover:bg-gray-700 transition-colors"
      >
        Refresh
      </button>
    </div>

    <div v-if="loading" class="flex items-center justify-center py-20">
      <div class="text-gray-500 text-sm">Loading memories...</div>
    </div>

    <div v-else-if="error" class="p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
      {{ error }}
    </div>

    <div v-else>
      <!-- Stats Cards -->
      <div v-if="stats" class="grid grid-cols-3 gap-4 mb-8">
        <div class="bg-gray-900 rounded-lg p-4 border border-gray-800">
          <div class="text-xs text-gray-500 mb-1">Total Memories</div>
          <div class="text-2xl font-bold text-gray-100">{{ stats.total ?? 0 }}</div>
        </div>
        <div class="bg-gray-900 rounded-lg p-4 border border-gray-800">
          <div class="text-xs text-gray-500 mb-1">Pinned</div>
          <div class="text-2xl font-bold text-emerald-400">{{ stats.pinned ?? 0 }}</div>
        </div>
        <div class="bg-gray-900 rounded-lg p-4 border border-gray-800">
          <div class="text-xs text-gray-500 mb-1">Avg Salience</div>
          <div class="text-2xl font-bold text-amber-400">
            {{ stats.avgSalience != null ? Number(stats.avgSalience).toFixed(1) : '—' }}
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Fading Memories -->
        <div>
          <h3 class="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <span class="text-red-400">⚠</span> Fading Memories
          </h3>
          <div class="bg-gray-900 rounded-lg border border-gray-800 divide-y divide-gray-800">
            <div v-if="fading.length === 0" class="p-4 text-sm text-gray-500">No fading memories.</div>
            <div v-for="(mem, i) in fading" :key="i" class="p-3">
              <div class="text-sm text-gray-300">{{ truncate(mem.content || mem.text || mem.summary) }}</div>
              <div class="flex items-center gap-3 mt-1 text-xs text-gray-600">
                <span v-if="mem.salience != null">Salience: {{ Number(mem.salience).toFixed(2) }}</span>
                <span v-if="mem.sector">Sector: {{ mem.sector }}</span>
                <span v-if="mem.access_count != null">Accesses: {{ mem.access_count }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Top Accessed -->
        <div>
          <h3 class="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <span class="text-emerald-400">★</span> Top Accessed
          </h3>
          <div class="bg-gray-900 rounded-lg border border-gray-800 divide-y divide-gray-800">
            <div v-if="topAccessed.length === 0" class="p-4 text-sm text-gray-500">No memories yet.</div>
            <div v-for="(mem, i) in topAccessed" :key="i" class="p-3">
              <div class="text-sm text-gray-300">{{ truncate(mem.content || mem.text || mem.summary) }}</div>
              <div class="flex items-center gap-3 mt-1 text-xs text-gray-600">
                <span v-if="mem.access_count != null">Accesses: {{ mem.access_count }}</span>
                <span v-if="mem.salience != null">Salience: {{ Number(mem.salience).toFixed(2) }}</span>
                <span v-if="mem.sector">Sector: {{ mem.sector }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
