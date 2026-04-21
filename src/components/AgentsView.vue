<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { apiFetch } from '../api.js'

const agents = ref([])
const loading = ref(true)
const error = ref(null)
const selectedAgent = ref(null)
const agentDetail = ref(null)
const detailLoading = ref(false)
const viewMode = ref('cards') // 'cards' or 'table'
const sortKey = ref('name')
const sortAsc = ref(true)

let refreshTimer = null

const managerAgent = computed(() => agents.value.find(a => a.id === 'main') || null)
const tenantAgents = computed(() => agents.value.filter(a => a.id !== 'main'))

const sortedAgents = computed(() => {
  const list = [...agents.value]
  list.sort((a, b) => {
    let va = a[sortKey.value]
    let vb = b[sortKey.value]
    if (typeof va === 'string') va = va.toLowerCase()
    if (typeof vb === 'string') vb = vb.toLowerCase()
    if (typeof va === 'boolean') { va = va ? 1 : 0; vb = vb ? 1 : 0 }
    if (va < vb) return sortAsc.value ? -1 : 1
    if (va > vb) return sortAsc.value ? 1 : -1
    return 0
  })
  return list
})

function toggleSort(key) {
  if (sortKey.value === key) {
    sortAsc.value = !sortAsc.value
  } else {
    sortKey.value = key
    sortAsc.value = true
  }
}

function sortIcon(key) {
  if (sortKey.value !== key) return ' \u2195'
  return sortAsc.value ? ' \u2191' : ' \u2193'
}

async function loadAgents() {
  try {
    error.value = null
    const res = await apiFetch('/api/agents')
    const agentList = res.agents || []
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

async function selectAgent(agent) {
  if (selectedAgent.value?.id === agent.id) {
    selectedAgent.value = null
    agentDetail.value = null
    return
  }
  selectedAgent.value = agent
  detailLoading.value = true
  try {
    const [tokens, conversation] = await Promise.allSettled([
      apiFetch(`/api/agents/${agent.id}/tokens`),
      apiFetch(`/api/agents/${agent.id}/conversation?limit=5`),
    ])
    agentDetail.value = {
      tokens: tokens.status === 'fulfilled' ? tokens.value : null,
      conversation: conversation.status === 'fulfilled' ? conversation.value.turns : [],
    }
  } catch {
    agentDetail.value = null
  } finally {
    detailLoading.value = false
  }
}

function formatCost(val) {
  if (val == null) return '$0.00'
  return `$${Number(val).toFixed(2)}`
}

function formatNum(val) {
  if (val == null || val === 0) return '0'
  if (val >= 1000000) return (val / 1000000).toFixed(1) + 'M'
  if (val >= 1000) return (val / 1000).toFixed(1) + 'K'
  return String(val)
}

function barWidth(val, max) {
  if (!max || !val) return '0%'
  return Math.min(100, Math.round((val / max) * 100)) + '%'
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
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-lg font-semibold text-gray-100">Agent Fleet</h2>
      <div class="flex gap-2">
        <button
          @click="viewMode = 'cards'"
          class="px-3 py-1 text-xs rounded-md transition-colors"
          :class="viewMode === 'cards' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-gray-800 text-gray-400 border border-gray-700 hover:border-gray-600'"
        >Cards</button>
        <button
          @click="viewMode = 'table'"
          class="px-3 py-1 text-xs rounded-md transition-colors"
          :class="viewMode === 'table' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-gray-800 text-gray-400 border border-gray-700 hover:border-gray-600'"
        >Table</button>
      </div>
    </div>

    <div v-if="loading" class="flex items-center justify-center py-20">
      <div class="text-gray-500 text-sm">Loading agents...</div>
    </div>

    <div v-else-if="error" class="p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
      {{ error }}
    </div>

    <!-- TABLE VIEW -->
    <div v-else-if="viewMode === 'table'">
      <div class="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-gray-800 text-gray-400 text-xs uppercase tracking-wider">
              <th class="text-left p-3 cursor-pointer hover:text-gray-200 select-none" @click="toggleSort('name')">
                Agent{{ sortIcon('name') }}
              </th>
              <th class="text-left p-3 cursor-pointer hover:text-gray-200 select-none" @click="toggleSort('id')">
                ID{{ sortIcon('id') }}
              </th>
              <th class="text-left p-3 cursor-pointer hover:text-gray-200 select-none" @click="toggleSort('model')">
                Model{{ sortIcon('model') }}
              </th>
              <th class="text-center p-3 cursor-pointer hover:text-gray-200 select-none" @click="toggleSort('running')">
                Status{{ sortIcon('running') }}
              </th>
              <th class="text-right p-3 cursor-pointer hover:text-gray-200 select-none" @click="toggleSort('todayTurns')">
                Turns{{ sortIcon('todayTurns') }}
              </th>
              <th class="text-right p-3 cursor-pointer hover:text-gray-200 select-none" @click="toggleSort('todayCost')">
                Cost{{ sortIcon('todayCost') }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="agent in sortedAgents"
              :key="agent.id"
              @click="selectAgent(agent)"
              class="border-b border-gray-800/50 hover:bg-gray-800/50 cursor-pointer transition-colors"
              :class="selectedAgent?.id === agent.id ? 'bg-gray-800/70' : ''"
            >
              <td class="p-3">
                <div class="flex items-center gap-2">
                  <span>{{ agent.id === 'main' ? '\uD83D\uDEF0\uFE0F' : '\uD83E\uDD16' }}</span>
                  <span class="font-medium text-gray-100">{{ agent.name }}</span>
                  <span v-if="agent.id === 'main'" class="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400">MANAGER</span>
                </div>
              </td>
              <td class="p-3 text-gray-500 font-mono text-xs">{{ agent.id }}</td>
              <td class="p-3 text-gray-400 font-mono text-xs">{{ agent.model || '-' }}</td>
              <td class="p-3 text-center">
                <span
                  class="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
                  :class="agent.running ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/15 text-red-400'"
                >
                  <span class="w-1.5 h-1.5 rounded-full" :class="agent.running ? 'bg-emerald-400' : 'bg-red-400'"></span>
                  {{ agent.running ? 'Running' : 'Offline' }}
                </span>
              </td>
              <td class="p-3 text-right text-gray-200 font-mono">{{ agent.todayTurns ?? 0 }}</td>
              <td class="p-3 text-right text-amber-400 font-mono">{{ formatCost(agent.todayCost) }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Detail panel below table -->
      <div v-if="selectedAgent && viewMode === 'table'" class="mt-4">
        <div class="bg-gray-900 rounded-lg border border-gray-700 p-5">
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center gap-3">
              <span class="text-2xl">{{ selectedAgent.id === 'main' ? '\uD83D\uDEF0\uFE0F' : '\uD83E\uDD16' }}</span>
              <div>
                <div class="font-semibold text-gray-100 text-lg">{{ selectedAgent.name }}</div>
                <div class="text-xs text-gray-500 font-mono">{{ selectedAgent.model }} &middot; {{ selectedAgent.id }}</div>
              </div>
            </div>
            <button @click="selectedAgent = null; agentDetail = null" class="text-gray-500 hover:text-gray-300 text-lg">&times;</button>
          </div>
          <div v-if="detailLoading" class="text-gray-500 text-sm py-4">Loading details...</div>
          <div v-else-if="agentDetail" class="space-y-5">
            <!-- Token Usage Chart -->
            <div>
              <h4 class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Token Usage (Today)</h4>
              <div class="grid grid-cols-2 gap-4">
                <div class="bg-gray-800 rounded-lg p-4">
                  <div class="text-xs text-gray-500 mb-1">Input Tokens</div>
                  <div class="text-xl font-mono text-blue-400">{{ formatNum(agentDetail.tokens?.totalInputTokens || agentDetail.tokens?.todayTurns * 28000) }}</div>
                  <div class="mt-2 h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div class="h-full bg-blue-500 rounded-full" :style="{ width: barWidth(agentDetail.tokens?.todayTurns || 0, 50) }"></div>
                  </div>
                </div>
                <div class="bg-gray-800 rounded-lg p-4">
                  <div class="text-xs text-gray-500 mb-1">Output Tokens</div>
                  <div class="text-xl font-mono text-purple-400">{{ formatNum(agentDetail.tokens?.totalOutputTokens || agentDetail.tokens?.todayTurns * 2000) }}</div>
                  <div class="mt-2 h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div class="h-full bg-purple-500 rounded-full" :style="{ width: barWidth(agentDetail.tokens?.todayTurns || 0, 50) }"></div>
                  </div>
                </div>
              </div>
            </div>
            <!-- Cost & Model Info -->
            <div class="grid grid-cols-3 gap-4">
              <div class="bg-gray-800 rounded-lg p-4">
                <div class="text-xs text-gray-500 mb-1">Today Cost</div>
                <div class="text-xl font-mono text-amber-400">{{ formatCost(agentDetail.tokens?.todayCost) }}</div>
              </div>
              <div class="bg-gray-800 rounded-lg p-4">
                <div class="text-xs text-gray-500 mb-1">Total Cost</div>
                <div class="text-xl font-mono text-amber-300">{{ formatCost(agentDetail.tokens?.totalCost) }}</div>
              </div>
              <div class="bg-gray-800 rounded-lg p-4">
                <div class="text-xs text-gray-500 mb-1">Model</div>
                <div class="text-sm font-mono text-gray-200 mt-1">{{ selectedAgent.model }}</div>
              </div>
            </div>
            <!-- Turn Stats -->
            <div class="grid grid-cols-2 gap-4">
              <div class="bg-gray-800 rounded-lg p-4">
                <div class="text-xs text-gray-500 mb-1">Turns Today</div>
                <div class="text-2xl font-mono text-gray-100">{{ agentDetail.tokens?.todayTurns ?? 0 }}</div>
              </div>
              <div class="bg-gray-800 rounded-lg p-4">
                <div class="text-xs text-gray-500 mb-1">Total Turns</div>
                <div class="text-2xl font-mono text-gray-100">{{ agentDetail.tokens?.totalTurns ?? 0 }}</div>
              </div>
            </div>
            <!-- Recent Conversation -->
            <div v-if="agentDetail.conversation?.length > 0">
              <h4 class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Recent Activity</h4>
              <div class="space-y-2 max-h-48 overflow-y-auto">
                <div v-for="(turn, i) in agentDetail.conversation" :key="i" class="bg-gray-800 rounded p-3 text-xs">
                  <span class="font-mono text-gray-500">{{ turn.role }}:</span>
                  <span class="text-gray-300 ml-2">{{ (turn.content || '').slice(0, 150) }}{{ (turn.content || '').length > 150 ? '...' : '' }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- CARDS VIEW -->
    <div v-else>
      <!-- Manager Bot Card -->
      <div v-if="managerAgent" class="mb-6">
        <h3 class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Manager Bot</h3>
        <div
          @click="selectAgent(managerAgent)"
          class="bg-gray-900 rounded-lg p-5 border cursor-pointer transition-all hover:border-emerald-400/50"
          :class="selectedAgent?.id === 'main' ? 'border-emerald-400/60 ring-1 ring-emerald-400/20' : 'border-emerald-500/30'"
        >
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center gap-3">
              <span class="text-2xl">\uD83D\uDEF0\uFE0F</span>
              <div>
                <div class="font-semibold text-gray-100 text-lg">{{ managerAgent.name }}</div>
                <div v-if="managerAgent.botUsername" class="text-xs text-gray-500 font-mono">@{{ managerAgent.botUsername }}</div>
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
        <!-- Manager detail panel -->
        <div v-if="selectedAgent?.id === 'main'" class="mt-3 bg-gray-900 rounded-lg border border-gray-700 p-5">
          <div v-if="detailLoading" class="text-gray-500 text-sm py-4">Loading details...</div>
          <div v-else-if="agentDetail" class="space-y-4">
            <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div class="bg-gray-800 rounded-lg p-3">
                <div class="text-[10px] text-gray-500 uppercase">Input Tokens</div>
                <div class="text-lg font-mono text-blue-400">{{ formatNum(agentDetail.tokens?.totalInputTokens || agentDetail.tokens?.todayTurns * 28000) }}</div>
                <div class="mt-1 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                  <div class="h-full bg-blue-500 rounded-full" :style="{ width: barWidth(agentDetail.tokens?.todayTurns || 0, 50) }"></div>
                </div>
              </div>
              <div class="bg-gray-800 rounded-lg p-3">
                <div class="text-[10px] text-gray-500 uppercase">Output Tokens</div>
                <div class="text-lg font-mono text-purple-400">{{ formatNum(agentDetail.tokens?.totalOutputTokens || agentDetail.tokens?.todayTurns * 2000) }}</div>
                <div class="mt-1 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                  <div class="h-full bg-purple-500 rounded-full" :style="{ width: barWidth(agentDetail.tokens?.todayTurns || 0, 50) }"></div>
                </div>
              </div>
              <div class="bg-gray-800 rounded-lg p-3">
                <div class="text-[10px] text-gray-500 uppercase">Today Cost</div>
                <div class="text-lg font-mono text-amber-400">{{ formatCost(agentDetail.tokens?.todayCost) }}</div>
              </div>
              <div class="bg-gray-800 rounded-lg p-3">
                <div class="text-[10px] text-gray-500 uppercase">Total Cost</div>
                <div class="text-lg font-mono text-amber-300">{{ formatCost(agentDetail.tokens?.totalCost) }}</div>
              </div>
            </div>
            <div class="grid grid-cols-3 gap-3">
              <div class="bg-gray-800 rounded-lg p-3">
                <div class="text-[10px] text-gray-500 uppercase">Turns Today</div>
                <div class="text-xl font-mono text-gray-100">{{ agentDetail.tokens?.todayTurns ?? 0 }}</div>
              </div>
              <div class="bg-gray-800 rounded-lg p-3">
                <div class="text-[10px] text-gray-500 uppercase">Total Turns</div>
                <div class="text-xl font-mono text-gray-100">{{ agentDetail.tokens?.totalTurns ?? 0 }}</div>
              </div>
              <div class="bg-gray-800 rounded-lg p-3">
                <div class="text-[10px] text-gray-500 uppercase">Model</div>
                <div class="text-sm font-mono text-gray-200 mt-1">{{ managerAgent.model }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Tenant Agent Cards -->
      <div v-if="tenantAgents.length > 0">
        <h3 class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Tenant Agents</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div v-for="agent in tenantAgents" :key="agent.id">
            <div
              @click="selectAgent(agent)"
              class="bg-gray-900 rounded-lg p-4 border cursor-pointer transition-all hover:border-gray-600"
              :class="selectedAgent?.id === agent.id ? 'border-blue-400/60 ring-1 ring-blue-400/20' : 'border-gray-800'"
            >
              <div class="flex items-center justify-between mb-2">
                <div class="flex items-center gap-2">
                  <span class="text-lg">\uD83E\uDD16</span>
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
            <!-- Tenant detail panel (inline below card) -->
            <div v-if="selectedAgent?.id === agent.id" class="mt-2 bg-gray-900 rounded-lg border border-gray-700 p-4">
              <div v-if="detailLoading" class="text-gray-500 text-sm py-3">Loading...</div>
              <div v-else-if="agentDetail" class="space-y-3">
                <div class="grid grid-cols-2 gap-3">
                  <div class="bg-gray-800 rounded p-3">
                    <div class="text-[10px] text-gray-500 uppercase">Input Tokens</div>
                    <div class="text-lg font-mono text-blue-400">{{ formatNum(agentDetail.tokens?.totalInputTokens || agentDetail.tokens?.todayTurns * 28000) }}</div>
                    <div class="mt-1 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                      <div class="h-full bg-blue-500 rounded-full" :style="{ width: barWidth(agentDetail.tokens?.todayTurns || 0, 50) }"></div>
                    </div>
                  </div>
                  <div class="bg-gray-800 rounded p-3">
                    <div class="text-[10px] text-gray-500 uppercase">Output Tokens</div>
                    <div class="text-lg font-mono text-purple-400">{{ formatNum(agentDetail.tokens?.totalOutputTokens || agentDetail.tokens?.todayTurns * 2000) }}</div>
                    <div class="mt-1 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                      <div class="h-full bg-purple-500 rounded-full" :style="{ width: barWidth(agentDetail.tokens?.todayTurns || 0, 50) }"></div>
                    </div>
                  </div>
                </div>
                <div class="grid grid-cols-3 gap-3">
                  <div class="bg-gray-800 rounded p-2.5">
                    <div class="text-[10px] text-gray-500 uppercase">Today</div>
                    <div class="text-sm font-mono text-amber-400">{{ formatCost(agentDetail.tokens?.todayCost) }}</div>
                  </div>
                  <div class="bg-gray-800 rounded p-2.5">
                    <div class="text-[10px] text-gray-500 uppercase">Total</div>
                    <div class="text-sm font-mono text-amber-300">{{ formatCost(agentDetail.tokens?.totalCost) }}</div>
                  </div>
                  <div class="bg-gray-800 rounded p-2.5">
                    <div class="text-[10px] text-gray-500 uppercase">Turns</div>
                    <div class="text-sm font-mono text-gray-200">{{ agentDetail.tokens?.totalTurns ?? 0 }}</div>
                  </div>
                </div>
              </div>
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
