<script setup>
import { ref, onMounted } from 'vue'
import { getApiUrl, getToken, getChatId, saveConfig, apiFetch } from '../api.js'

const apiUrl = ref('')
const token = ref('')
const chatId = ref('')
const saved = ref(false)
const testing = ref(false)
const loadingTunnel = ref(false)
const testResult = ref(null)
const tunnelResult = ref(null)

onMounted(() => {
  apiUrl.value = getApiUrl()
  token.value = getToken()
  chatId.value = getChatId()
})

function handleSave() {
  saveConfig(apiUrl.value, token.value, chatId.value)
  saved.value = true
  testResult.value = null
  setTimeout(() => { saved.value = false }, 2000)
}

async function testConnection() {
  testing.value = true
  testResult.value = null
  try {
    saveConfig(apiUrl.value, token.value, chatId.value)
    const res = await apiFetch('/api/health')
    testResult.value = { success: true, message: `Connected. Model: ${res.model || 'unknown'}, Turns: ${res.turns ?? 0}` }
  } catch (e) {
    testResult.value = { success: false, message: e.message }
  } finally {
    testing.value = false
  }
}

async function loadTunnelUrl() {
  loadingTunnel.value = true
  tunnelResult.value = null
  try {
    saveConfig(apiUrl.value, token.value, chatId.value)
    const res = await apiFetch('/api/tunnel-url')
    if (res.found && res.url) {
      apiUrl.value = res.url
      saveConfig(apiUrl.value, token.value, chatId.value)
      tunnelResult.value = { success: true, message: `Loaded: ${res.url}` }
    } else {
      tunnelResult.value = { success: false, message: 'No active tunnel found. Run start-tunnel.bat on your PC first.' }
    }
  } catch (e) {
    tunnelResult.value = { success: false, message: `Could not reach bot: ${e.message}` }
  } finally {
    loadingTunnel.value = false
  }
}
</script>

<template>
  <div class="max-w-2xl">
    <h2 class="text-lg font-semibold text-gray-100 mb-4">Settings</h2>

    <div class="bg-gray-900 rounded-lg p-6 border border-gray-800 mb-6">
      <h3 class="text-sm font-semibold text-gray-300 mb-4">API Configuration</h3>

      <div class="space-y-4">
        <div>
          <label class="block text-xs text-gray-500 mb-1">API URL</label>
          <input
            v-model="apiUrl"
            type="text"
            placeholder="http://localhost:3141"
            class="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>

        <div>
          <label class="block text-xs text-gray-500 mb-1">Dashboard Token</label>
          <input
            v-model="token"
            type="password"
            placeholder="Your API token"
            class="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>

        <div>
          <label class="block text-xs text-gray-500 mb-1">Chat ID</label>
          <input
            v-model="chatId"
            type="text"
            placeholder="Telegram chat ID"
            class="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>

        <div class="flex items-center gap-3 pt-2 flex-wrap">
          <button
            @click="handleSave"
            class="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Save Configuration
          </button>
          <button
            @click="testConnection"
            :disabled="testing"
            class="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            {{ testing ? 'Testing...' : 'Test Connection' }}
          </button>
          <button
            @click="loadTunnelUrl"
            :disabled="loadingTunnel"
            class="px-4 py-2 bg-sky-700 hover:bg-sky-600 text-gray-200 text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
            title="Reads the active Cloudflare tunnel URL from your running bot"
          >
            {{ loadingTunnel ? 'Loading...' : 'Load Tunnel URL' }}
          </button>
          <span v-if="saved" class="text-emerald-400 text-sm">Saved.</span>
        </div>

        <!-- Tunnel URL result -->
        <div
          v-if="tunnelResult"
          class="p-3 rounded-lg text-sm"
          :class="tunnelResult.success ? 'bg-sky-500/10 border border-sky-500/30 text-sky-400' : 'bg-yellow-500/10 border border-yellow-500/30 text-yellow-400'"
        >
          {{ tunnelResult.message }}
        </div>

        <!-- Test result -->
        <div
          v-if="testResult"
          class="p-3 rounded-lg text-sm"
          :class="testResult.success ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400' : 'bg-red-500/10 border border-red-500/30 text-red-400'"
        >
          {{ testResult.message }}
        </div>
      </div>
    </div>

    <!-- Tunnel setup instructions -->
    <div class="bg-gray-900 rounded-lg p-6 border border-gray-800">
      <h3 class="text-sm font-semibold text-gray-300 mb-3">Remote Access via Cloudflare Tunnel</h3>
      <div class="text-sm text-gray-400 space-y-2">
        <p>If you're accessing this dashboard remotely, set up a Cloudflare Tunnel to expose the bot API securely:</p>
        <ol class="list-decimal list-inside space-y-1 text-gray-500">
          <li>Install cloudflared: <code class="text-xs bg-gray-800 px-1 py-0.5 rounded">winget install cloudflare.cloudflared</code></li>
          <li>Authenticate: <code class="text-xs bg-gray-800 px-1 py-0.5 rounded">cloudflared tunnel login</code></li>
          <li>Create a tunnel: <code class="text-xs bg-gray-800 px-1 py-0.5 rounded">cloudflared tunnel create louie-api</code></li>
          <li>Configure the tunnel to point to <code class="text-xs bg-gray-800 px-1 py-0.5 rounded">http://localhost:3141</code></li>
          <li>Add a DNS route: <code class="text-xs bg-gray-800 px-1 py-0.5 rounded">cloudflared tunnel route dns louie-api api.yourdomain.com</code></li>
          <li>Start the tunnel: <code class="text-xs bg-gray-800 px-1 py-0.5 rounded">cloudflared tunnel run louie-api</code></li>
        </ol>
        <p class="text-gray-600 text-xs mt-3">Then update the API URL above to your tunnel domain (e.g., https://api.yourdomain.com).</p>
      </div>
    </div>
  </div>
</template>
