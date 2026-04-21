<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { apiFetch } from '../api.js'

const health = ref(null)
const agents = ref([])
const hiveMind = ref([])
const tokens = ref(null)
const loading = ref(true)
const error = ref(null)

let refreshTimer = null

async function loadData() {
  try {
    error.value = null
    const [healthRes, agentsRes, hiveRes, tokensRes] = await Promise.allSettled([
      apiFetch('/api/health'),
      apiFetch('/api/agents'),
      apiFetch('/api/hive-mind?limit=10'),
      apiFetch('/api/tokens'),
    ])

    if (healthRes.status === 'fulfilled') health.value = healthRes.value
    if (agentsRes.status === 'fulfilled') agents.value = agentsRes.value.agents || []
    if (hiveRes.status === 'fulfilled') hiveMind.value = hiveRes.value.entries || []
    if (tokensRes.status === 'fulfilled') tokens.value = tokensRes.value.stats || null
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

function timeAgo(dateStr) {
  if (!dateStr) return ''
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (seconds < 60) return `${seconds}s ago`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  return `${Math.floor(seconds / 86400)}d ago`
}

function formatCost(val) {
  if (val == null) return '$0.00'
  return `$${Number(val).toFixed(2)}`
}

onMounted(() => {
  loadData()
  refreshTimer = setInterval(loadData, 30000)
})

onUnmounted(() => {
  if (refreshTimer) clearInterval(refreshTimer)
})
</script>

<template>
  <div>
    <!-- Loading state -->
    <div v-if="loading" class="flex items-center justify-center py-20">
      <div class="text-gray-500 text-sm">Loading dashboard...</div>
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
      Failed to load: {{ error }}
    </div>

    <div v-else>
      <!-- System Health Cards -->
      <h2 class="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">System Health</h2>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div class="bg-gray-900 rounded-lg p-4 border border-gray-800">
          <div class="text-xs text-gray-500 mb-1">Context Used</div>
          <div class="text-2xl font-bold" :class="health?.contextPct > 80 ? 'text-red-400' : 'text-emerald-400'">
            {{ health?.contextPct ?? '—' }}%
          </div>
        </div>
        <div class="bg-gray-900 rounded-lg p-4 border border-gray-800">
          <div class="text-xs text-gray-500 mb-1">Turns</div>
          <div class="text-2xl font-bold text-gray-100">{{ health?.turns ?? '—' }}</div>
        </div>
        <div class="bg-gray-900 rounded-lg p-4 border border-gray-800">
          <div class="text-xs text-gray-500 mb-1">Compactions</div>
          <div class="text-2xl font-bold text-gray-100">{{ health?.compactions ?? 0 }}</div>
        </div>
        <div class="bg-gray-900 rounded-lg p-4 border border-gray-800">
          <div class="text-xs text-gray-500 mb-1">Telegram</div>
          <div class="text-2xl font-bold" :class="health?.telegramConnected ? 'text-emerald-400' : 'text-red-400'">
            {{ health?.telegramConnected ? 'Online' : 'Offline' }}
          </div>
        </div>
      </div>

      <!-- Token Cost Summary -->
      <div v-if="tokens" class="mb-8">
        <h2 class="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Token Costs</h2>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div class="bg-gray-900 rounded-lg p-4 border border-gray-800">
            <div class="text-xs text-gray-500 mb-1">Today's Cost</div>
            <div class="text-xl font-bold text-amber-400">{{ formatCost(tokens.todayCost) }}</div>
          </div>
          <div class="bg-gray-900 rounded-lg p-4 border border-gray-800">
            <div class="text-xs text-gray-500 mb-1">Total Cost</div>
            <div class="text-xl font-bold text-gray-100">{{ formatCost(tokens.totalCost) }}</div>
          </div>
          <div class="bg-gray-900 rounded-lg p-4 border border-gray-800">
            <div class="text-xs text-gray-500 mb-1">Today's Turns</div>
            <div class="text-xl font-bold text-gray-100">{{ tokens.todayTurns ?? 0 }}</div>
          </div>
          <div class="bg-gray-900 rounded-lg p-4 border border-gray-800">
            <div class="text-xs text-gray-500 mb-1">Total Turns</div>
            <div class="text-xl font-bold text-gray-100">{{ tokens.totalTurns ?? 0 }}</div>
          </div>
        </div>
      </div>

      <!-- Agent Status Grid -->
      <h2 class="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Agents</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <div
          v-for="agent in agents"
          :key="agent.id"
          class="bg-gray-900 rounded-lg p-4 border border-gray-800"
        >
          <div class="flex items-center justify-between mb-2">
            <span class="font-medium text-gray-100">{{ agent.name }}</span>
            <span
              class="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
              :class="agent.running ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-700 text-gray-400'"
            >
              <span class="w-1.5 h-1.5 rounded-full" :class="agent.running ? 'bg-emerald-400' : 'bg-gray-500'"></span>
              {{ agent.running ? 'Running' : 'Offline' }}
            </span>
          </div>
          <div v-if="agent.description" class="text-xs text-gray-500 mb-2 line-clamp-2">{{ agent.description }}</div>
          <div class="flex items-center gap-4 text-xs text-gray-400">
            <span>{{ agent.todayTurns ?? 0 }} turns</span>
            <span>{{ formatCost(agent.todayCost) }}</span>
          </div>
        </div>
      </div>

      <!-- Recent Hive Mind -->
      <h2 class="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Recent Activity</h2>
      <div class="bg-gray-900 rounded-lg border border-gray-800 divide-y divide-gray-800">
        <div v-if="hiveMind.length === 0" class="p-4 text-sm text-gray-500">No recent activity.</div>
        <div v-for="(entry, i) in hiveMind" :key="i" class="px-4 py-3 flex items-start gap-3">
          <span class="shrink-0 text-xs px-2 py-0.5 rounded bg-gray-800 text-emerald-400 font-mono">
            {{ entry.agent_id }}
          </span>
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2">
              <span class="text-xs font-medium text-amber-400">{{ entry.action }}</span>
              <span class="text-xs text-gray-600">{{ timeAgo(entry.created_at) }}</span>
            </div>
            <div class="text-sm text-gray-300 mt-0.5 truncate">{{ entry.summary }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
