<template>
  <div class="settings-tab" style="padding: 0px;">
    <n-form ref="formRef" :model="formValue" :rules="rules">
      <!-- Language Settings -->
      <n-form-item :label="translations.language">
        <n-select v-model:value="formValue.language" :options="languageOptions" @update:value="handleLanguageChange" />
      </n-form-item>

      <!-- Category Management -->
      <n-form-item :label="translations.categories">
        <n-dynamic-tags v-model:value="formValue.categories" />
      </n-form-item>

      <!-- Default Category -->
      <n-form-item :label="translations.defaultCategory">
        <n-select v-model:value="formValue.defaultCategory" :options="categoryOptions" clearable />
      </n-form-item>

      <!-- Save Button -->
      <div class="form-actions">
        <n-button type="primary" block size="large" strong @click="handleSaveSettings">
          {{ translations.saveSettings }}
        </n-button>
      </div>
    </n-form>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, inject, nextTick } from 'vue'
import { useMessage } from 'naive-ui'

const translations = inject('translations')

const props = defineProps({
  settings: {
    type: Object,
    required: true
  },
  translations: {
    type: Object,
    required: true
  }
})

const message = useMessage()
const formRef = ref(null)

// 表单数据
const formValue = ref({
  language: 'zh',
  categories: ['Default'],
  defaultCategory: 'Default'
})

// 表单验证规则
const rules = {
  language: {
    required: true,
    message: 'Please select a language',
    trigger: ['blur', 'change']
  },
  categories: {
    validator: (rule, value) => Array.isArray(value) && value.length > 0,
    message: 'At least one category is required',
    trigger: 'change'
  }
}

// 语言选项
const languageOptions = [
  { label: '中文', value: 'zh' },
  { label: 'English', value: 'en' },
  { label: '日本語', value: 'ja' },
  { label: '한국어', value: 'ko' },
  { label: 'Français', value: 'fr' },
  { label: 'Deutsch', value: 'de' },
  { label: 'Español', value: 'es' },
  { label: 'Português', value: 'pt' },
  { label: 'Italiano', value: 'it' },
  { label: 'Русский', value: 'ru' },
  { label: 'Nederlands', value: 'nl' },
  { label: 'Türkçe', value: 'tr' },
  { label: 'Tiếng Việt', value: 'vi' },
  { label: 'Bahasa Indonesia', value: 'id' }
]

// 计算属性
const categoryOptions = computed(() => {
  return formValue.value.categories.map(cat => ({
    label: cat,
    value: cat
  }))
})

// 方法
const handleLanguageChange = (value) => {
  formRef.value?.validate(['language'])
    .then(() => {
      formValue.value.language = value
    })
    .catch(() => { })
}

// 添加保存设置的方法
const handleSaveSettings = () => {
  // Ensure categories is an array before validation
  if (!Array.isArray(formValue.value.categories)) {
    formValue.value.categories = ['Default']
  }

  formRef.value?.validate(async (errors) => {
    if (errors) {
      const firstError = Array.isArray(errors[0]) ? errors[0][0].message : errors[0].message
      message.error(firstError)
      return
    }

    await saveSettings()
    nextTick()
    reloadData()
  })
}

// 存储相关
const saveSettings = () => {
  if (chrome.storage) {
    chrome.storage.sync.set({
      settings: {
        ...formValue.value,
        categories: Array.from(new Set(formValue.value.categories))
      }
    }, () => {
      if (chrome.runtime.lastError) {
        message.error(props.translations.saveFailed)
        return
      }
      message.success(props.translations.settingsSaved)
    })
  } else {
    try {
      localStorage.setItem('settings', JSON.stringify(formValue.value))
      message.success(props.translations.settingsSaved)
    } catch (error) {
      console.error('Error saving settings:', error)
      message.error(props.translations.saveFailed)
    }
  }
}

// 重新加载数据
const reloadData = () => {
  if (chrome.storage) {
    chrome.storage.sync.get(['settings'], (result) => {
      if (result.settings) {
        // 更新所有设置字段，确保 categories 是数组
        const categories = Array.isArray(result.settings.categories) ? result.settings.categories : ['Default']
        formValue.value = {
          language: result.settings.language || 'zh',
          categories: categories,
          defaultCategory: result.settings.defaultCategory || categories[0] || 'Default'
        }
      } else {
        // 如果没有设置，使用默认值
        formValue.value = {
          language: 'zh',
          categories: ['Default'],
          defaultCategory: 'Default'
        }
      }
    })
  } else {
    try {
      const storedSettings = localStorage.getItem('settings')
      if (storedSettings) {
        const settings = JSON.parse(storedSettings)
        const categories = Array.isArray(settings.categories) ? settings.categories : ['Default']
        formValue.value = {
          language: settings.language || 'zh',
          categories: categories,
          defaultCategory: settings.defaultCategory || categories[0] || 'Default'
        }
      } else {
        formValue.value = {
          language: 'zh',
          categories: ['Default'],
          defaultCategory: 'Default'
        }
      }
    } catch (error) {
      console.error('Error loading data:', error)
      // 发生错误时使用默认值
      formValue.value = {
        language: 'zh',
        categories: ['Default'],
        defaultCategory: 'Default'
      }
    }
  }
}

// 初始化数据
onMounted(() => {
  reloadData()
})
</script>

<style scoped>
.settings-tab {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 0px;
}
</style>