<template>
  <div class="save-tab" style="padding: 0px;">
    <n-form ref="formRef" :model="saveForm" :rules="rules">
      <n-form-item :label="props. translations.bookmarkUrl" path="url">
        <n-input v-model:value="saveForm.url" :placeholder="props.translations.enterUrl" />
      </n-form-item>
      <n-form-item :label="props.translations.bookmarkTitle" path="title">
        <n-input v-model:value="saveForm.title" :placeholder="props.translations.enterTitle" />
      </n-form-item>
      <n-form-item :label="props.translations.bookmarkCategory" path="category">
        <n-select v-model:value="saveForm.category" :options="categoryOptions" :placeholder="props.translations.selectCategory"
          clearable />
      </n-form-item>
      <n-form-item :label="props.translations.bookmarkTags" path="tags">
        <n-dynamic-tags v-model:value="saveForm.tags" />
      </n-form-item>
      <n-form-item :label="props.translations.bookmarkRating" path="rating">
        <n-rate v-model:value="saveForm.rating" :default-value="3" :count="5">
        </n-rate>
      </n-form-item>
      <n-button type="primary" block @click="handleSave" size="large" strong>
        {{ props.translations.saveBookmark }}
      </n-button>
    </n-form>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, inject } from 'vue'
import { useMessage } from 'naive-ui'

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

const saveForm = ref({
  url: '',
  title: '',
  tags: [],
  category: null,
  rating: 3
})

// 添加本地分类数据
const categories = ref([])

// 从分类数据计算选项
const categoryOptions = computed(() =>
  Array.isArray(categories.value) 
    ? categories.value.map(cat => ({
        label: cat,
        value: cat
      }))
    : []
)

// 表单验证规则
const rules = {
  url: [
    {
      required: true,
      message: () => props.translations.urlRequired,
      trigger: ['blur', 'input']
    },
    {
      validator: (rule, value) => {
        if (!value) return true
        try {
          new URL(value)
          return true
        } catch (e) {
          return false
        }
      },
      message: () => props.translations.invalidUrl,
      trigger: ['blur', 'input']
    }
  ],
  title: {
    required: true,
    message: () => props.translations.titleRequired,
    trigger: ['blur', 'input']
  },
  category: {
    required: true,
    message: () => props.translations.categoryRequired,
    trigger: ['blur', 'input']
  }
}

// 加载分类数据
const loadCategories = () => {
  if (chrome.storage) {
    try {
      chrome.storage.sync.get(['settings'], (result) => {
        if (chrome.runtime.lastError) {
          console.error('Storage error:', chrome.runtime.lastError)
          return
        }
        if (result.settings?.categories) {
          categories.value = Array.isArray(result.settings.categories) 
            ? Array.from(new Set(result.settings.categories)) 
            : ['Default']
          saveForm.value.category = result.settings.defaultCategory || 'Default'
        } else {
          categories.value = ['Default']
          saveForm.value.category = 'Default'
        }
      })
    } catch (error) {
      console.error('Error accessing chrome storage:', error)
      categories.value = ['Default']
      saveForm.value.category = 'Default'
    }
  } else {
    try {
      const storedSettings = localStorage.getItem('settings')
      if (storedSettings) {
        const settings = JSON.parse(storedSettings)
        categories.value = Array.isArray(settings.categories) 
          ? Array.from(new Set(settings.categories)) 
          : ['Default']
        saveForm.value.category = settings.defaultCategory || 'Default'
      } else {
        categories.value = ['Default']
        saveForm.value.category = 'Default'
      }
    } catch (error) {
      console.error('Error loading categories from settings:', error)
      categories.value = ['Default']
      saveForm.value.category = 'Default'
    }
  }
}

// 监听存储变化
if (chrome.storage) {
  try {
    chrome.storage.onChanged.addListener((changes) => {
      if (changes.settings?.newValue?.categories) {
        categories.value = changes.settings.newValue.categories
      }
      // 如果默认分类变化且当前表单为空，更新表单分类
      if (changes.settings?.newValue?.defaultCategory &&
        (!saveForm.value.url && !saveForm.value.title && saveForm.value.tags.length === 0)) {
        saveForm.value.category = changes.settings.newValue.defaultCategory
      }
    })
  } catch (error) {
    console.error('Error setting up storage listener:', error)
  }
}

// 获取当前活动标签页信息
const getCurrentTab = async () => {
  if (!chrome?.tabs) {
    console.warn('Chrome tabs API not available')
    return
  }

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    if (tab) {
      saveForm.value.url = tab.url || ''
      saveForm.value.title = tab.title || ''
    }
  } catch (error) {
    console.error('Error getting current tab:', error)
  }
}

// 初始化时加载分类数据和当前标签页信息
onMounted(() => {
  loadCategories()
  getCurrentTab()
})

// 重置表单时也要重置评分
const resetForm = () => {
  saveForm.value = {
    url: '',
    title: '',
    tags: [],
    category: getCurrentDefaultCategory(),
    rating: 3
  }
}

// 获取当前默认分类
const getCurrentDefaultCategory = () => {
  // 如果使用 chrome.storage
  if (chrome.storage) {
    // 这里我们需要同步获取最新的默认分类
    // 由于 chrome.storage 是异步的，我们可以返回当前 props 中的值
    // 并在加载完成后更新
    return props.settings.defaultCategory
  } else {
    // 在开发环境中，从 localStorage 获取最新设置
    try {
      const storedSettings = localStorage.getItem('settings')
      if (storedSettings) {
        const settings = JSON.parse(storedSettings)
        return settings.defaultCategory || null
      }
    } catch (error) {
      console.error('Error getting default category:', error)
    }
    return props.settings.defaultCategory
  }
}

const handleSave = (e) => {
  e.preventDefault()

  if (!formRef.value) {
    message.error(props.translations.validationError)
    return
  }

  formRef.value.validate(async (errors) => {
    if (errors) {
      console.log(errors)
      return
    }

    // 确保 tags 是数组并转换为原始值
    const tags = Array.isArray(saveForm.value.tags) 
      ? [...saveForm.value.tags].map(tag => tag.toString()) 
      : []

    // 创建新书签对象，使用原始值
    const newBookmark = {
      id: Date.now(),
      url: saveForm.value.url || '',
      title: saveForm.value.title || '',
      category: saveForm.value.category || 'Default',
      rating: Number(saveForm.value.rating) || 0,
      tags: tags,
      createdAt: new Date().toISOString()
    }

    // 存储处理
    if (chrome.storage) {
      try {
        chrome.storage.sync.get(['bookmarks'], (result) => {
          if (chrome.runtime.lastError) {
            message.error(props.translations.saveFailed)
            console.error('Storage error:', chrome.runtime.lastError)
            return
          }

          // 检查URL是否重复
          const storedBookmarks = Array.isArray(result.bookmarks) ? result.bookmarks : []
          const isDuplicate = storedBookmarks.some(b => b.url === newBookmark.url)
          
          if (isDuplicate) {
            message.warning(props.translations.duplicateBookmark)
            return
          }

          const updatedBookmarks = [...storedBookmarks, newBookmark]

          chrome.storage.sync.set({ bookmarks: updatedBookmarks }, () => {
            if (chrome.runtime.lastError) {
              message.error(props.translations.saveFailed)
              return
            }
            resetForm()
            message.success(props.translations.bookmarkSaved)
          })
        })
      } catch (error) {
        console.error('Error saving bookmark:', error)
        message.error(props.translations.saveFailed)
      }
    } else {
      try {
        // 本地存储处理
        const storedBookmarks = localStorage.getItem('bookmarks')
        const bookmarks = storedBookmarks ? JSON.parse(storedBookmarks) : []
        
        // 检查URL是否重复
        const isDuplicate = bookmarks.some(b => b.url === newBookmark.url)
        
        if (isDuplicate) {
          message.warning(props.translations.duplicateBookmark)
          return
        }

        const updatedBookmarks = [...bookmarks, newBookmark]
        localStorage.setItem('bookmarks', JSON.stringify(updatedBookmarks))
        resetForm()
        message.success(props.translations.bookmarkSaved)
      } catch (error) {
        console.error('Error saving to localStorage:', error)
        message.error(props.translations.saveFailed)
      }
    }
  })
}
</script>

<style scoped>
.save-tab {
  height: 100%;
  overflow-y: auto;
  padding: 0px;
}

:deep(.n-form) {
  display: flex;
  flex-direction: column;
}
</style>