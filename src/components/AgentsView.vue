<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { apiFetch } from '../api.js'

const agents = ref([])
const loading = ref(true)
const error = ref(null)

let refreshTimer = null

const managerAgent = computed(() => agents.value.find(a => a.id === 'main') || null)
const tenantAgents = computed(() => agents.value.filter(a => a.id !== 'main'))

async function loadAgents() {
  try {
    error.value = null
    const res = await apiFetch('/api/agents')
    const agentList = res.agents || []

    // Fetch individual status for each agent
    const statusResults = await Promise.allSettled(
      agentList.map(a => apiFetch(`/api/agents/${a.id}/status`))
    )
    agentList.forEach((agent, i) => {
      if (statusResults[i].status === 'fulfilled') {
        agent.running = statusResults[i].value.running
      }
    })

    agents.value = agentList
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

function formatCost(val) {
  if (val == null) return '$0.00'
  return `$${Number(val).toFixed(2)}`
}

onMounted(() => {
  loadAgents()
  refreshTimer = setInterval(loadAgents, 30000)
})

onUnmounted(() => {
  if (refreshTimer) clearInterval(refreshTimer)
})
</script>

<template>
  <div>
    <h2 class="text-lg font-semibold text-gray-100 mb-4">Agent Fleet</h2>

    <div v-if="loading" class="flex items-center justify-center py-20">
      <div class="text-gray-500 text-sm">Loading agents...</div>
    </div>

    <div v-else-if="error" class="p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
      {{ error }}
    </div>

    <div v-else>
      <!-- Manager Bot Card -->
      <div v-if="managerAgent" class="mb-6">
        <h3 class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Manager Bot</h3>
        <div class="bg-gray-900 rounded-lg p-5 border border-emerald-500/30">
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center gap-3">
              <span class="text-2xl">🛰️</span>
              <div>
                <div class="font-semibold text-gray-100 text-lg">{{ managerAgent.name }}</div>
                <div v-if="managerAgent.model" class="text-xs text-gray-500 font-mono">{{ managerAgent.model }}</div>
              </div>
            </div>
            <span
              class="flex items-center gap-1.5 text-sm px-3 py-1 rounded-full"
              :class="managerAgent.running ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'"
            >
              <span class="w-2 h-2 rounded-full" :class="managerAgent.running ? 'bg-emerald-400' : 'bg-red-400'"></span>
              {{ managerAgent.running ? 'Running' : 'Offline' }}
            </span>
          </div>
          <div v-if="managerAgent.description" class="text-sm text-gray-400 mb-3">{{ managerAgent.description }}</div>
          <div class="flex items-center gap-6 text-sm text-gray-400">
            <span>Today: <strong class="text-gray-200">{{ managerAgent.todayTurns ?? 0 }}</strong> turns</span>
            <span>Cost: <strong class="text-amber-400">{{ formatCost(managerAgent.todayCost) }}</strong></span>
          </div>
        </div>
      </div>

      <!-- Tenant Agent Cards -->
      <div v-if="tenantAgents.length > 0">
        <h3 class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Tenant Agents</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div
            v-for="agent in tenantAgents"
            :key="agent.id"
            class="bg-gray-900 rounded-lg p-4 border border-gray-800 hover:border-gray-700 transition-colors"
          >
            <div class="flex items-center justify-between mb-2">
              <div class="flex items-center gap-2">
                <span class="text-lg">🤖</span>
                <span class="font-medium text-gray-100">{{ agent.name }}</span>
              </div>
              <span
                class="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
                :class="agent.running ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-700 text-gray-400'"
              >
                <span class="w-1.5 h-1.5 rounded-full" :class="agent.running ? 'bg-emerald-400' : 'bg-gray-500'"></span>
                {{ agent.running ? 'Running' : 'Offline' }}
              </span>
            </div>
            <div v-if="agent.model" class="text-xs text-gray-600 font-mono mb-1">{{ agent.model }}</div>
            <div v-if="agent.description" class="text-xs text-gray-500 mb-3 line-clamp-2">{{ agent.description }}</div>
            <div class="flex items-center gap-4 text-xs text-gray-400 pt-2 border-t border-gray-800">
              <span>{{ agent.todayTurns ?? 0 }} turns today</span>
              <span>{{ formatCost(agent.todayCost) }}</span>
            </div>
          </div>
        </div>
      </div>

      <div v-if="agents.length === 0" class="text-center py-12 text-gray-500 text-sm">
        No agents found.
      </div>
    </div>
  </div>
</template>
