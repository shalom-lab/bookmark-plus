<template>
  <n-dialog-provider>
    <n-message-provider placement="top">
      <n-config-provider :locale="locale" :date-locale="dateLocale" :theme-overrides="themeOverrides">
        <Home/>
      </n-config-provider>
    </n-message-provider>
  </n-dialog-provider>
</template>

<script setup>
import { ref, computed, onMounted, watch, provide } from 'vue'
import { zhCN, dateZhCN, enUS, dateEnUS } from 'naive-ui'
import Home from './components/Home.vue'
import locales from './locales'

// Theme configuration
const themeOverrides = {
  common: {
    primaryColor: '#2080f0',
    primaryColorHover: '#4098f7',
    primaryColorPressed: '#1060c9',
    primaryColorSuppl: '#2080f0',
    successColor: '#2080f0',
    warningColor: '#2080f0',
    errorColor: '#2080f0',
    infoColor: '#2080f0'
  },
  Button: {
    textColorPrimary: '#fff',
    textColorHoverPrimary: '#fff',
    textColorPressedPrimary: '#fff',
    textColorFocusPrimary: '#fff',
    textColorDisabledPrimary: '#fff',
    rippleColor: '#fff',
    colorPrimary: '#2080f0',
    colorHoverPrimary: '#4098f7',
    colorPressedPrimary: '#1060c9',
    colorFocusPrimary: '#4098f7'
  },
  Tag: {
    borderRadius: '4px',
    colorPrimary: '#2080f0',
    colorSuccess: '#2080f0',
    colorWarning: '#2080f0',
    colorError: '#2080f0',
    colorInfo: '#2080f0'
  },
  Select: {
    peers: {
      InternalSelection: {
        textColor: '#333',
      }
    }
  },
  Tabs: {
    tabTextColorActiveLine: '#2080f0',
    barColor: '#2080f0'
  },
  Dialog: {
    colorPrimary: '#2080f0'
  },
  Message: {
    colorPrimary: '#2080f0',
    colorSuccess: '#2080f0',
    colorWarning: '#2080f0',
    colorError: '#2080f0',
    colorInfo: '#2080f0'
  },
  Rate: {
    itemColor: 'rgba(32, 128, 240, 0.2)',
    itemColorActive: '#2080f0',
    itemColorHover: '#4098f7'
  }
}

// Language state and storage management
const currentLang = ref('zh')

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
  },
  addListener: (callback) => {
    if (chrome.storage) {
      chrome.storage.onChanged.addListener(callback)
    } else {
      window.addEventListener('storage', (e) => {
        console.log('change')
        try {
          const newValue = e.newValue ? JSON.parse(e.newValue) : null
          const oldValue = e.oldValue ? JSON.parse(e.oldValue) : null
          callback({
            [e.key]: { newValue, oldValue }
          })
        } catch (error) {
          console.error('Error parsing storage event:', error)
        }
      })
    }
  }
}

// Get the translation object based on current language
const translations = computed(() => locales[currentLang.value] || locales['en'])

// Provide translations to all child components
provide('translations', translations)

// Locale configuration
const locale = computed(() => currentLang.value === 'zh' ? zhCN : enUS)
const dateLocale = computed(() => currentLang.value === 'zh' ? dateZhCN : dateEnUS)

// Load language preference
onMounted(() => {
  storage.get(['settings'], (result) => {
    if (result.settings?.language) {
      currentLang.value = result.settings.language
    }
  })
})

// Watch for settings changes
storage.addListener((changes) => {
  if (changes.settings?.newValue?.language) {
    currentLang.value = changes.settings.newValue.language
  }
})

// Save language preference when it changes
watch(currentLang, (newLang) => {
  storage.get(['settings'], (result) => {
    const settings = result.settings || {}
    settings.language = newLang
    storage.set({ settings })
  })
})
</script>

<style scoped>
* {
  padding: 0;
  margin: 0;
  box-sizing: border-box;
}

html, body {
  height: 100%;
}

:deep(.n-config-provider) {
  height: 100%;
}

:deep(.n-message-provider) {
  height: 100%;
}

:deep(.n-dialog-provider) {
  height: 100%;
}

.popup {
  width: 400px;
  height: 600px;
  background: #fff;
  padding: 15px;
  box-sizing: border-box;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
</style>