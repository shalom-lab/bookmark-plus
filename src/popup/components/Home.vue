<template>
  <div class="popup">
    <header class="header">
      <div class="header-content">
        <h1>Bookmark Plus</h1>
        <a href="https://github.com/shalom-lab/bookmark-plus" 
           target="_blank" 
           class="github-link"
           title="Star us on GitHub">
          <svg height="16" viewBox="0 0 16 16" width="16">
            <path fill="currentColor" d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.75.75 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25z"/>
          </svg>
          Star
        </a>
      </div>
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

      <!-- Upload Tab -->
      <n-tab-pane name="upload" :tab="translations.upload">
        <UploadTab :translations="translations"/>
      </n-tab-pane>
    </n-tabs>
  </div>
</template>

<script setup>
import { ref, inject, onMounted } from 'vue'
import SaveTab from './SaveTab.vue'
import QueryTab from './QueryTab.vue'
import UploadTab from './UploadTab.vue'
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

.header-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.header h1 {
  text-align: center;
  font-size: 1.25rem;
  font-weight: bold;
  color: #2080f0;
  margin: 0;
}

.github-link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  font-size: 12px;
  color: #666;
  text-decoration: none;
  border: 1px solid #ddd;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.github-link:hover {
  color: #2080f0;
  border-color: #2080f0;
  background: rgba(32, 128, 240, 0.1);
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