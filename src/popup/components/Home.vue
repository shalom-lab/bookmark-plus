<template>
  <div class="popup">
    <header class="header">
      <h1>Bookmark Plus</h1>
    </header>
    <n-tabs type="line" animated>
      <!-- Save Tab -->
      <n-tab-pane name="save" :tab="translations.save">
        <SaveTab :settings="settings" :translations="translations" />
      </n-tab-pane>

      <!-- Query Tab -->
      <n-tab-pane name="query" :tab="translations.query">
        <QueryTab :settings="settings" :translations="translations" />
      </n-tab-pane>

      <!-- Settings Tab -->
      <n-tab-pane name="settings" :tab="translations.settings">
        <SettingsTab :settings="settings" :translations="translations" />
      </n-tab-pane>
    </n-tabs>
  </div>
</template>

<script setup>
import { ref, inject, onMounted } from 'vue'
import SaveTab from './SaveTab.vue'
import QueryTab from './QueryTab.vue'
import SettingsTab from './SettingsTab.vue'
const translations = inject('translations')

// Settings
const settings = ref({
  language: 'zh',
  categories: ['Default'],
  defaultCategory: 'Default'
})

// Storage wrapper for consistent API
const storage = {
  get: (keys, callback) => {
    if (chrome.storage) {
      chrome.storage.sync.get(keys, callback)
    } else {
      try {
        const result = {}
        keys.forEach(key => {
          const item = localStorage.getItem(key)
          result[key] = item ? JSON.parse(item) : null
        })
        callback(result)
      } catch (error) {
        console.error('Error reading from localStorage:', error)
        callback({})
      }
    }
  },
  set: (data) => {
    if (chrome.storage) {
      return chrome.storage.sync.set(data)
    } else {
      try {
        Object.entries(data).forEach(([key, value]) => {
          localStorage.setItem(key, JSON.stringify(value))
        })
        return Promise.resolve()
      } catch (error) {
        console.error('Error writing to localStorage:', error)
        return Promise.reject(error)
      }
    }
  }
}

onMounted(() => {
  storage.get(['settings'], (result) => {
    if (result.settings) {
      settings.value = {
        language: result.settings.language || 'zh',
        categories: Array.isArray(result.settings.categories) ? result.settings.categories : ['Default'],
        defaultCategory: result.settings.defaultCategory || 'Default'
      }
    } else {
      storage.set({ settings: settings.value })
    }
  })
})
</script>

<style scoped>
.popup {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.header {
  padding: 12px 16px;
  flex-shrink: 0;
}

.header h1 {
  text-align: center;
  font-size: 1.25rem;
  font-weight: bold;
  color: #2080f0;
  margin: 0;
}

:deep(.n-tabs) {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

:deep(.n-tabs-nav) {
  flex-shrink: 0;
}

:deep(.n-tab-pane) {
  padding-top: 0px;
  height: 100%;
  overflow: hidden;
}

:deep(.n-tabs-content) {
  flex: 1;
  overflow: hidden;
}
</style>