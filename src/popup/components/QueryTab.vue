<template>
  <div class="query-tab" style="padding: 0px;">
    <!-- 搜索区域 -->
    <div class="search-section">
      <n-input v-model:value="searchQuery" :placeholder="props.translations.searchPlaceholder" clearable>
        <template #prefix>
          <n-icon>
            <SearchOutline />
          </n-icon>
        </template>
      </n-input>

      <!-- 标签筛选 - 平铺展示 -->
      <div class="tags-filter">
        <div class="tags-filter-header">
          <n-text>{{ props.translations.filterByTags }}</n-text>
          <n-button v-if="selectedTags.length > 0" text type="primary" size="small" @click="selectedTags = []">
            {{ props.translations.clearTags }}
          </n-button>
        </div>
        <div class="tags-list">
          <n-tag v-for="tag in tagOptions" :key="tag.value" :style="getTagFilterStyle(tag.value)" size="small" round
            clickable @click="toggleTagSelection(tag.value)">
            {{ tag.label }}
          </n-tag>
        </div>
      </div>
    </div>

    <!-- 操作栏 -->
    <div class="action-bar">
      <n-space justify="space-between">
        <n-button-group>
          <n-tooltip trigger="hover">
            <template #trigger>
              <n-button secondary size="tiny" style="padding:0 10px" @click="handleSelectAll">
                <n-icon>
                  <component :is="isAllSelected ? CheckBoxOutlined : CheckBoxOutlineBlankFilled" />
                </n-icon>
              </n-button>
            </template>
            {{ isAllSelected ? translations.unselectAll : translations.selectAll }}
          </n-tooltip>
          <n-tooltip trigger="hover">
            <template #trigger>
              <n-button secondary size="tiny" style="padding:0 10px" @click="handleInvertSelection">
                <n-icon>
                  <SwapHorizontalOutline />
                </n-icon>
              </n-button>
            </template>
            {{ translations.invertSelection }}
          </n-tooltip>
        </n-button-group>
        <n-button-group>
          <n-tooltip trigger="hover">
            <template #trigger>
              <n-button primary size="tiny" :disabled="!selectedBookmarks.length" @click="handleDeleteSelected"
                style="padding:0 10px">
                <n-icon>
                  <TrashOutline />
                </n-icon>
              </n-button>
            </template>
            {{ translations.deleteSelectedConfirm }}
          </n-tooltip>
          <n-tooltip trigger="hover">
            <template #trigger>
              <n-button primary size="tiny" style="padding:0 10px" @click="handleImport">
                <n-icon>
                  <FileUploadOutlined />
                </n-icon>
              </n-button>
            </template>
            {{ translations.importBookmarks }}
          </n-tooltip>
          <n-tooltip trigger="hover">
            <template #trigger>
              <n-button primary size="tiny" style="padding:0 10px" :disabled="!selectedBookmarks.length"
                @click="handleExport">
                <n-icon>
                  <FileDownloadOutlined />
                </n-icon>
              </n-button>
            </template>
            {{ translations.exportBookmarks }}
          </n-tooltip>
        </n-button-group>
      </n-space>
    </div>

    <!-- 分类标签页 -->
    <n-tabs type="line" animated v-model:value="activeTab">
      <n-tab-pane name="all" :tab="translations.allBookmarks">
        <div class="bookmarks-list">
          <n-list hoverable clickable v-if="getFilteredBookmarksByTab('all').length > 0">
            <n-list-item v-for="bookmark in getFilteredBookmarksByTab('all')" :key="bookmark.id">
              <div class="bookmark-item">
                <div class="bookmark-header">
                  <n-checkbox :checked="selectedBookmarks.includes(bookmark.id)"
                    @update:checked="(checked) => handleCheckboxChange(checked, bookmark.id)" />
                  <n-ellipsis style="max-width: 90%">
                    <a :href="bookmark.url" target="_blank" rel="noopener noreferrer" class="bookmark-title">
                      {{ bookmark.title }}
                    </a>
                  </n-ellipsis>
                  <div class="bookmark-actions">
                    <n-button text type="error" @click.stop="handleDelete(bookmark)">
                      <template #icon>
                        <n-icon>
                          <TrashOutline />
                        </n-icon>
                      </template>
                    </n-button>
                  </div>
                </div>
                <div class="bookmark-tags" style="margin-left: 36px">
                  <n-tag v-for="tag in bookmark.tags" :key="tag" :style="getTagStyle(tag)" size="small" round>
                    {{ tag }}
                  </n-tag>
                </div>
              </div>
            </n-list-item>
          </n-list>
          <n-empty v-else :description="props.translations.noBookmarksFound" />
        </div>
      </n-tab-pane>

      <n-tab-pane v-for="category in categories" :key="category" :name="category" :tab="category">
        <div class="bookmarks-list">
          <n-list hoverable clickable v-if="getFilteredBookmarksByTab(category).length > 0">
            <n-list-item v-for="bookmark in getFilteredBookmarksByTab(category)" :key="bookmark.id">
              <div class="bookmark-item">
                <div class="bookmark-header">
                  <n-checkbox :checked="selectedBookmarks.includes(bookmark.id)"
                    @update:checked="(checked) => handleCheckboxChange(checked, bookmark.id)" />
                  <n-ellipsis style="max-width: 90%">
                    <a :href="bookmark.url" target="_blank" rel="noopener noreferrer" class="bookmark-title">
                      {{ bookmark.title }}
                    </a>
                  </n-ellipsis>
                  <div class="bookmark-actions">
                    <n-button text type="error" @click.stop="handleDelete(bookmark)">
                      <template #icon>
                        <n-icon>
                          <TrashOutline />
                        </n-icon>
                      </template>
                    </n-button>
                  </div>
                </div>
                <div class="bookmark-tags" style="margin-left: 36px">
                  <n-tag v-for="tag in bookmark.tags" :key="tag" :style="getTagStyle(tag)" size="small" round>
                    {{ tag }}
                  </n-tag>
                </div>
              </div>
            </n-list-item>
          </n-list>
          <n-empty v-else :description="translations.noBookmarksFound" />
        </div>
      </n-tab-pane>
    </n-tabs>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, inject } from 'vue'
import { SearchOutline, TrashOutline, SwapHorizontalOutline } from '@vicons/ionicons5'
import { CheckBoxOutlined, CheckBoxOutlineBlankFilled, FileUploadOutlined, FileDownloadOutlined } from '@vicons/material'
import { useMessage, useDialog } from 'naive-ui'

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
const dialog = useDialog()

// 本地状态
const bookmarks = ref([])
const categories = ref([])
const searchQuery = ref('')
const selectedTags = ref([])
const selectedBookmarks = ref([])
const activeTab = ref('all')

// 标签颜色
const tagColors = [
  { bg: '#e3f2fd', text: '#1976d2' },
  { bg: '#f3e5f5', text: '#7b1fa2' },
  { bg: '#e8f5e9', text: '#388e3c' },
  { bg: '#fff3e0', text: '#f57c00' },
  { bg: '#fbe9e7', text: '#d84315' }
]

const tagColorMap = new Map()
let colorIndex = 0

// 计算属性
const tagOptions = computed(() => {
  const tags = new Set()
  if (Array.isArray(bookmarks.value)) {
    bookmarks.value.forEach(bookmark => {
      if (bookmark && Array.isArray(bookmark.tags)) {
        bookmark.tags.forEach(tag => {
          if (tag) tags.add(tag.toString())
        })
      }
    })
  }
  return Array.from(tags).map(tag => ({
    label: tag,
    value: tag
  }))
})

const filteredBookmarks = computed(() => {
  if (!Array.isArray(bookmarks.value)) return []
  
  return bookmarks.value.filter(bookmark => {
    if (!bookmark) return false
    
    // 搜索匹配
    const matchesSearch = !searchQuery.value ||
      (bookmark.title && bookmark.title.toLowerCase().includes(searchQuery.value.toLowerCase())) ||
      (bookmark.url && bookmark.url.toLowerCase().includes(searchQuery.value.toLowerCase()))

    // 标签匹配
    const matchesTags = !selectedTags.value.length ||
      (Array.isArray(bookmark.tags) && selectedTags.value.some(tag => bookmark.tags.includes(tag)))

    return matchesSearch && matchesTags
  })
})

// 按分类标签页筛选书签
const getFilteredBookmarksByTab = (tabName) => {
  if (!Array.isArray(filteredBookmarks.value)) return []
  
  return filteredBookmarks.value.filter(bookmark => {
    if (!bookmark) return false
    if (tabName === 'all') return true
    return bookmark.category === tabName
  })
}

// 处理复选框变化
const handleCheckboxChange = (checked, bookmarkId) => {
  if (checked) {
    selectedBookmarks.value.push(bookmarkId)
  } else {
    selectedBookmarks.value = selectedBookmarks.value.filter(id => id !== bookmarkId)
  }
}

// 方法
const handleDelete = (bookmark) => {
  dialog.warning({
    title: props.translations.deleteBookmarkConfirm,
    content: bookmark.title,
    positiveText: props.translations.yes,
    negativeText: props.translations.no,
    onPositiveClick: () => {
      removeBookmark(bookmark)
    }
  })
}

const removeBookmark = (bookmark) => {
  try {
    if (chrome.storage) {
      chrome.storage.sync.get(['bookmarks'], (result) => {
        const existingBookmarks = Array.isArray(result.bookmarks) ? result.bookmarks : []
        const updatedBookmarks = existingBookmarks.filter(b => b.id !== bookmark.id)
        
        chrome.storage.sync.set({ bookmarks: updatedBookmarks }, () => {
          if (chrome.runtime.lastError) {
            message.error(props.translations.saveFailed)
            return
          }
          bookmarks.value = updatedBookmarks
          message.success(props.translations.bookmarkDeleted)
        })
      })
    } else {
      const storedBookmarks = localStorage.getItem('bookmarks')
      const existingBookmarks = storedBookmarks ? JSON.parse(storedBookmarks) : []
      const updatedBookmarks = existingBookmarks.filter(b => b.id !== bookmark.id)
      
      localStorage.setItem('bookmarks', JSON.stringify(updatedBookmarks))
      bookmarks.value = updatedBookmarks
      message.success(props.translations.bookmarkDeleted)
    }
  } catch (error) {
    console.error('Error removing bookmark:', error)
    message.error(props.translations.saveFailed)
  }
}

const handleDeleteSelected = () => {
  if (!selectedBookmarks.value.length) return

  dialog.warning({
    title: props.translations.deleteSelectedConfirm,
    content: `${selectedBookmarks.value.length} ${props.translations.bookmarksWillBeDeleted}`,
    positiveText: props.translations.yes,
    negativeText: props.translations.no,
    onPositiveClick: () => {
      removeSelectedBookmarks()
    }
  })
}

const handleImport = () => {
  // Create file input element
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.json'

  input.onchange = (e) => {
    const file = e.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target.result)
        const importedBookmarks = Array.isArray(importedData) ? importedData : [importedData]

        // 验证每个书签的必要字段并标准化数据
        const validBookmarks = importedBookmarks.filter(bookmark => {
          return (
            bookmark &&
            typeof bookmark === 'object' &&
            typeof bookmark.url === 'string' &&
            bookmark.url.trim() !== '' &&
            typeof bookmark.title === 'string' &&
            bookmark.title.trim() !== ''
          )
        }).map(bookmark => ({
          id: Date.now() + Math.floor(Math.random() * 1000), // 生成新的唯一ID
          url: bookmark.url.trim(),
          title: bookmark.title.trim(),
          category: bookmark.category || 'Default',
          rating: Number(bookmark.rating) || 0,
          tags: Array.isArray(bookmark.tags) ? [...new Set(bookmark.tags.map(tag => tag.toString().trim()))] : [],
          createdAt: new Date().toISOString()
        }))

        if (validBookmarks.length === 0) {
          message.error(props.translations.importError)
          return
        }

        // 存储处理
        if (chrome.storage) {
          chrome.storage.sync.get(['bookmarks'], (result) => {
            if (chrome.runtime.lastError) {
              message.error(props.translations.importError)
              return
            }

            const existingBookmarks = Array.isArray(result.bookmarks) ? result.bookmarks : []
            
            // 使用URL作为唯一标识进行去重
            const uniqueBookmarks = [...existingBookmarks]
            let importCount = 0

            validBookmarks.forEach(newBookmark => {
              const existingIndex = uniqueBookmarks.findIndex(b => b.url === newBookmark.url)
              if (existingIndex === -1) {
                // 如果不存在，添加新书签
                uniqueBookmarks.push(newBookmark)
                importCount++
              } else {
                // 如果存在，使用新数据更新现有书签
                uniqueBookmarks[existingIndex] = {
                  ...newBookmark,
                  id: uniqueBookmarks[existingIndex].id // 保留原有ID
                }
              }
            })

            // 保存更新后的书签列表
            chrome.storage.sync.set({ bookmarks: uniqueBookmarks }, () => {
              if (chrome.runtime.lastError) {
                message.error(props.translations.saveFailed)
                return
              }
              if (importCount > 0) {
                message.success(props.translations.bookmarksImported.replace('{count}', importCount))
              } else {
                message.info(props.translations.noNewBookmarks)
              }
            })
          })
        } else {
          try {
            const storedBookmarks = localStorage.getItem('bookmarks')
            const existingBookmarks = storedBookmarks ? JSON.parse(storedBookmarks) : []
            
            // 使用URL作为唯一标识进行去重
            const uniqueBookmarks = [...existingBookmarks]
            let importCount = 0

            validBookmarks.forEach(newBookmark => {
              const existingIndex = uniqueBookmarks.findIndex(b => b.url === newBookmark.url)
              if (existingIndex === -1) {
                // 如果不存在，添加新书签
                uniqueBookmarks.push(newBookmark)
                importCount++
              } else {
                // 如果存在，使用新数据更新现有书签
                uniqueBookmarks[existingIndex] = {
                  ...newBookmark,
                  id: uniqueBookmarks[existingIndex].id // 保留原有ID
                }
              }
            })

            // 保存更新后的书签列表
            localStorage.setItem('bookmarks', JSON.stringify(uniqueBookmarks))
            
            if (importCount > 0) {
              message.success(props.translations.bookmarksImported.replace('{count}', importCount))
            } else {
              message.info(props.translations.noNewBookmarks)
            }
          } catch (error) {
            console.error('Error saving to localStorage:', error)
            message.error(props.translations.importError)
          }
        }
      } catch (error) {
        console.error('Import error:', error)
        message.error(props.translations.importError)
      }
    }

    reader.onerror = () => {
      message.error(props.translations.importError)
    }

    reader.readAsText(file)
  }

  input.click()
}

const handleExport = () => {
  if (!selectedBookmarks.value.length) return

  // Get selected bookmarks data
  const selectedBookmarksData = bookmarks.value.filter(b => selectedBookmarks.value.includes(b.id))

  // Create date string in YYYY-MM-DD format
  const date = new Date().toISOString().split('T')[0]
  const filename = `bookmarks_${date}.json`

  // Create blob and download link
  const jsonStr = JSON.stringify(selectedBookmarksData, null, 2)
  const blob = new Blob([jsonStr], { type: 'application/json' })
  const url = URL.createObjectURL(blob)

  // Create and trigger download
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()

  // Cleanup
  document.body.removeChild(link)
  URL.revokeObjectURL(url)

  message.success(props.translations.bookmarksExported)
}

const removeSelectedBookmarks = () => {
  try {
    if (chrome.storage) {
      chrome.storage.sync.get(['bookmarks'], (result) => {
        const existingBookmarks = Array.isArray(result.bookmarks) ? result.bookmarks : []
        const updatedBookmarks = existingBookmarks.filter(b => !selectedBookmarks.value.includes(b.id))
        
        chrome.storage.sync.set({ bookmarks: updatedBookmarks }, () => {
          if (chrome.runtime.lastError) {
            message.error(props.translations.saveFailed)
            return
          }
          bookmarks.value = updatedBookmarks
          selectedBookmarks.value = []
          message.success(props.translations.bookmarksDeleted)
        })
      })
    } else {
      const storedBookmarks = localStorage.getItem('bookmarks')
      const existingBookmarks = storedBookmarks ? JSON.parse(storedBookmarks) : []
      const updatedBookmarks = existingBookmarks.filter(b => !selectedBookmarks.value.includes(b.id))
      
      localStorage.setItem('bookmarks', JSON.stringify(updatedBookmarks))
      bookmarks.value = updatedBookmarks
      selectedBookmarks.value = []
      message.success(props.translations.bookmarksDeleted)
    }
  } catch (error) {
    console.error('Error removing bookmarks:', error)
    message.error(props.translations.saveFailed)
  }
}

// 存储相关
const saveBookmarks = () => {
  try {
    if (chrome.storage) {
      chrome.storage.sync.set({ bookmarks: bookmarks.value }, () => {
        if (chrome.runtime.lastError) {
          console.error('Error saving bookmarks:', chrome.runtime.lastError)
          message.error(props.translations.saveFailed)
        }
      })
    } else {
      localStorage.setItem('bookmarks', JSON.stringify(bookmarks.value))
    }
  } catch (error) {
    console.error('Error saving bookmarks:', error)
    message.error(props.translations.saveFailed)
  }
}

const getTagStyle = (tag) => {
  if (!tagColorMap.has(tag)) {
    tagColorMap.set(tag, tagColors[colorIndex % tagColors.length])
    colorIndex++
  }
  const color = tagColorMap.get(tag)
  return {
    backgroundColor: color.bg,
    color: color.text,
    border: 'none'
  }
}

// 切换标签选择
const toggleTagSelection = (tag) => {
  const index = selectedTags.value.indexOf(tag)
  if (index === -1) {
    selectedTags.value.push(tag)
  } else {
    selectedTags.value.splice(index, 1)
  }
}

// 获取标签筛选样式
const getTagFilterStyle = (tag) => {
  if (!tagColorMap.has(tag)) {
    tagColorMap.set(tag, tagColors[colorIndex % tagColors.length])
    colorIndex++
  }
  const color = tagColorMap.get(tag)
  const isSelected = selectedTags.value.includes(tag)

  return {
    backgroundColor: isSelected ? color.bg : '#f5f5f5',
    color: isSelected ? color.text : '#999',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.3s'
  }
}

// 加载数据
const loadData = () => {
  if (chrome.storage) {
    chrome.storage.sync.get(['bookmarks', 'settings'], (result) => {
      try {
        // Ensure bookmarks is an array and handle each item
        const rawBookmarks = result.bookmarks || []
        bookmarks.value = Array.isArray(rawBookmarks) ? rawBookmarks.map(bookmark => ({
          id: bookmark.id || Date.now(),
          url: bookmark.url || '',
          title: bookmark.title || '',
          category: bookmark.category || 'Default',
          rating: Number(bookmark.rating) || 0,
          tags: Array.isArray(bookmark.tags) ? bookmark.tags.map(tag => tag.toString()) : [],
          createdAt: bookmark.createdAt || new Date().toISOString()
        })) : []

        // 从所有书签中提取唯一的分类
        const uniqueCategories = new Set(['Default']) // 确保默认分类总是存在
        bookmarks.value.forEach(bookmark => {
          if (bookmark.category) {
            uniqueCategories.add(bookmark.category)
          }
        })
        categories.value = Array.from(uniqueCategories)

      } catch (error) {
        console.error('Error processing bookmarks:', error)
        bookmarks.value = []
        categories.value = ['Default']
      }
    })
  } else {
    try {
      const storedBookmarks = localStorage.getItem('bookmarks')
      const storedSettings = localStorage.getItem('settings')
      
      // Handle bookmarks data
      if (storedBookmarks) {
        const parsedBookmarks = JSON.parse(storedBookmarks)
        bookmarks.value = Array.isArray(parsedBookmarks) ? parsedBookmarks.map(bookmark => ({
          id: bookmark.id || Date.now(),
          url: bookmark.url || '',
          title: bookmark.title || '',
          category: bookmark.category || 'Default',
          rating: Number(bookmark.rating) || 0,
          tags: Array.isArray(bookmark.tags) ? bookmark.tags.map(tag => tag.toString()) : [],
          createdAt: bookmark.createdAt || new Date().toISOString()
        })) : []

        // 从所有书签中提取唯一的分类
        const uniqueCategories = new Set(['Default']) // 确保默认分类总是存在
        bookmarks.value.forEach(bookmark => {
          if (bookmark.category) {
            uniqueCategories.add(bookmark.category)
          }
        })
        categories.value = Array.from(uniqueCategories)

      } else {
        bookmarks.value = []
        categories.value = ['Default']
      }
    } catch (error) {
      console.error('Error loading data:', error)
      bookmarks.value = []
      categories.value = ['Default']
    }
  }
}

// 监听存储变化
if (chrome.storage) {
  chrome.storage.onChanged.addListener((changes) => {
    try {
      if (changes.bookmarks) {
        const newBookmarks = changes.bookmarks.newValue
        bookmarks.value = Array.isArray(newBookmarks) ? newBookmarks.map(bookmark => ({
          id: bookmark.id || Date.now(),
          url: bookmark.url || '',
          title: bookmark.title || '',
          category: bookmark.category || 'Default',
          rating: Number(bookmark.rating) || 0,
          tags: Array.isArray(bookmark.tags) ? bookmark.tags.map(tag => tag.toString()) : [],
          createdAt: bookmark.createdAt || new Date().toISOString()
        })) : []

        // 从所有书签中提取唯一的分类
        const uniqueCategories = new Set(['Default']) // 确保默认分类总是存在
        bookmarks.value.forEach(bookmark => {
          if (bookmark.category) {
            uniqueCategories.add(bookmark.category)
          }
        })
        categories.value = Array.from(uniqueCategories)
      }
    } catch (error) {
      console.error('Error processing storage changes:', error)
    }
  })
}

// 初始化数据
onMounted(() => {
  loadData()
})

const isAllSelected = computed(() => {
  const currentTabBookmarks = getFilteredBookmarksByTab(activeTab.value)
  return currentTabBookmarks.length > 0 && currentTabBookmarks.every(b => selectedBookmarks.value.includes(b.id))
})

const handleSelectAll = () => {
  const currentTabBookmarks = getFilteredBookmarksByTab(activeTab.value)
  if (isAllSelected.value) {
    // Unselect all
    selectedBookmarks.value = selectedBookmarks.value.filter(id =>
      !currentTabBookmarks.some(b => b.id === id)
    )
  } else {
    // Select all
    const newSelectedIds = currentTabBookmarks.map(b => b.id)
    selectedBookmarks.value = [...new Set([...selectedBookmarks.value, ...newSelectedIds])]
  }
}

const handleInvertSelection = () => {
  const currentTabBookmarks = getFilteredBookmarksByTab(activeTab.value)
  currentTabBookmarks.forEach(bookmark => {
    if (selectedBookmarks.value.includes(bookmark.id)) {
      selectedBookmarks.value = selectedBookmarks.value.filter(id => id !== bookmark.id)
    } else {
      selectedBookmarks.value.push(bookmark.id)
    }
  })
}
</script>

<style scoped>
.query-tab {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 0px;
}

.search-section {
  flex-shrink: 0;
  margin-bottom: 16px;
}

.tags-filter {
  flex-shrink: 0;
  margin-top: 16px;
}

.tags-filter-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
}

.action-bar {
  flex-shrink: 0;
  margin-bottom: 16px;
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

:deep(.n-tabs-content) {
  flex: 1;
  overflow: hidden;
}

:deep(.n-tab-pane) {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.bookmarks-list {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
  padding-bottom: 20px;
}

:deep(.n-list-item) {
  padding: 3px 20px 3px 0 !important;
}

.bookmark-item {
  padding: 2px 0;
}

.bookmark-header {
  width: 100%;
  display: grid;
  grid-template-columns: 10px 1fr 10px;
  align-items: center;
  gap: 20px;
}

.bookmark-title {
  color: #2080f0;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s;
}

.bookmark-title:hover {
  color: #4098fc;
}

.bookmark-actions {
  margin-left: auto;
  display: flex;
  gap: 4px;
}

.bookmark-tags {
  margin-top: 2px;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
</style>