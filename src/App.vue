<script setup>
import { ref, computed } from 'vue'
import { getToken, getChatId } from './api.js'
import DashboardView from './components/DashboardView.vue'
import AgentsView from './components/AgentsView.vue'
import HiveMindView from './components/HiveMindView.vue'
import MemoryView from './components/MemoryView.vue'
import TasksView from './components/TasksView.vue'
import SettingsView from './components/SettingsView.vue'

const currentTab = ref('dashboard')
const sidebarCollapsed = ref(false)

const tabs = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊' },
  { id: 'agents', label: 'Agents', icon: '🤖' },
  { id: 'hivemind', label: 'Hive Mind', icon: '🧠' },
  { id: 'memory', label: 'Memory', icon: '💾' },
  { id: 'tasks', label: 'Tasks', icon: '📋' },
  { id: 'settings', label: 'Settings', icon: '⚙️' },
]

const isConfigured = computed(() => {
  return getToken() && getChatId()
})
</script>

<template>
  <div class="min-h-screen bg-gray-950 text-gray-100 flex">
    <!-- Sidebar -->
    <aside
      class="flex flex-col border-r border-gray-800 bg-gray-900 transition-all duration-200"
      :class="sidebarCollapsed ? 'w-16' : 'w-56'"
    >
      <div class="flex items-center gap-2 px-4 py-4 border-b border-gray-800">
        <span class="text-xl">🛰️</span>
        <span v-if="!sidebarCollapsed" class="font-bold text-sm text-emerald-400 truncate">
          Mission Control
        </span>
      </div>

      <nav class="flex-1 py-2">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          @click="currentTab = tab.id"
          class="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors"
          :class="currentTab === tab.id
            ? 'bg-gray-800 text-emerald-400 border-r-2 border-emerald-400'
            : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'"
        >
          <span class="text-base">{{ tab.icon }}</span>
          <span v-if="!sidebarCollapsed">{{ tab.label }}</span>
        </button>
      </nav>

      <button
        @click="sidebarCollapsed = !sidebarCollapsed"
        class="px-4 py-3 text-gray-500 hover:text-gray-300 text-xs border-t border-gray-800"
      >
        {{ sidebarCollapsed ? '→' : '← Collapse' }}
      </button>
    </aside>

    <!-- Main content -->
    <div class="flex-1 flex flex-col min-w-0">
      <!-- Header -->
      <header class="flex items-center justify-between px-6 py-3 border-b border-gray-800 bg-gray-900/50">
        <h1 class="text-lg font-semibold text-gray-100">
          louieDevAgent
          <span class="text-emerald-400 font-normal ml-1">Mission Control</span>
        </h1>
        <div class="flex items-center gap-3 text-xs text-gray-500">
          <span v-if="isConfigured" class="flex items-center gap-1">
            <span class="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
            Connected
          </span>
          <span v-else class="flex items-center gap-1">
            <span class="w-2 h-2 rounded-full bg-red-500 inline-block"></span>
            Not configured
          </span>
        </div>
      </header>

      <!-- Setup banner -->
      <div
        v-if="!isConfigured && currentTab !== 'settings'"
        class="mx-6 mt-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-sm flex items-center justify-between"
      >
        <span>API not configured. Set your token and chat ID to connect.</span>
        <button
          @click="currentTab = 'settings'"
          class="ml-4 px-3 py-1 bg-amber-500/20 hover:bg-amber-500/30 rounded text-amber-200 text-xs font-medium"
        >
          Go to Settings
        </button>
      </div>

      <!-- View content -->
      <main class="flex-1 overflow-y-auto p-6">
        <DashboardView v-if="currentTab === 'dashboard'" />
        <AgentsView v-if="currentTab === 'agents'" />
        <HiveMindView v-if="currentTab === 'hivemind'" />
        <MemoryView v-if="currentTab === 'memory'" />
        <TasksView v-if="currentTab === 'tasks'" />
        <SettingsView v-if="currentTab === 'settings'" />
      </main>
    </div>
  </div>
</template>
