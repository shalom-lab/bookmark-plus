<template>
  <div class="upload-tab" style="padding: 0px;">
    <n-form ref="formRef" :model="formValue" :rules="rules">
      <!-- GitHub Token -->
      <n-form-item :label="props.translations.githubToken" path="token">
        <n-input v-if="!isTokenSet" v-model:value="formValue.token" type="password"
          :placeholder="props.translations.enterGithubToken" show-password-on="click" />
        <n-input v-else :value="props.translations.tokenConfigured" readonly :placeholder="props.translations.tokenConfigured">
          <template #suffix>
            <n-button text style="font-size: 14px" @click="handleResetToken">
              {{ props.translations.resetToken }}
            </n-button>
          </template>
        </n-input>
      </n-form-item>

      <!-- Repository Selection -->
      <n-form-item :label="props.translations.selectRepository" path="fullRepo">
        <n-select v-model:value="formValue.fullRepo" :loading="loadingRepos" :options="repoOptions"
          :placeholder="props.translations.selectRepository" @focus="fetchRepositories" />
      </n-form-item>

      <!-- Storage Path -->
      <n-form-item :label="props.translations.storagePath" path="path">
        <n-input v-model:value="formValue.path" :placeholder="props.translations.enterStoragePath">
          <template #prefix>/</template>
        </n-input>
      </n-form-item>

      <!-- Save Settings Button -->
      <n-button type="primary" block size="large" :loading="saving" @click="handleSaveSettings"
        style="margin-bottom: 16px;">
        {{ props.translations.saveGithubSettings }}
      </n-button>

      <!-- Filename -->
      <n-form-item :label="props.translations.filename">
        <n-input v-model:value="currentFilename" :placeholder="props.translations.enterFilename" />
      </n-form-item>


      <!-- Upload Button -->
      <n-button type="info" block size="large" :loading="uploading" :disabled="!isConfigValid" @click="handleUpload">
        {{ uploading ? props.translations.uploading : props.translations.uploadToGithub }}
      </n-button>

      <!-- Last Upload Time -->
      <div v-if="lastUploadTime" class="last-upload-time">
        {{ props.translations.lastUpload }}: {{ formatDate(lastUploadTime) }}
      </div>
    </n-form>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, inject } from 'vue'
import { useMessage } from 'naive-ui'

const props = defineProps({
  translations: {
    type: Object,
    required: true
  }
})

const message = useMessage()

const formRef = ref(null)
const saving = ref(false)
const uploading = ref(false)
const loadingRepos = ref(false)
const lastUploadTime = ref(null)
const repoOptions = ref([])
const isTokenSet = ref(false)

// 生成默认文件名
const generateDefaultFilename = () => {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `bookmarks-${year}-${month}-${day}.json`
}

const currentFilename = ref(generateDefaultFilename())

const formValue = ref({
  token: '',
  fullRepo: null, // 格式: owner/repo
  path: 'bookmarks' // 默认存储路径
})

const rules = {
  token: {
    required: true,
    message: () => props.translations.githubTokenRequired,
    trigger: ['blur', 'input']
  },
  fullRepo: {
    required: true,
    message: () => props.translations.repositoryRequired,
    trigger: ['blur', 'change']
  },
  path: {
    required: true,
    message: () => props.translations.storagePathRequired,
    trigger: ['blur', 'input']
  }
}

const isConfigValid = computed(() => {
  return formValue.value.token && formValue.value.fullRepo
})

// 获取仓库列表
const fetchRepositories = async () => {
  if (!formValue.value.token) {
    message.warning(props.translations.enterTokenFirst)
    return
  }

  loadingRepos.value = true
  try {
    const response = await fetch('https://api.github.com/user/repos?sort=updated', {
      headers: {
        'Authorization': `token ${formValue.value.token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    })

    if (!response.ok) {
      throw new Error(await response.text())
    }

    const repos = await response.json()
    repoOptions.value = repos.map(repo => ({
      label: repo.full_name,
      value: repo.full_name
    }))
  } catch (error) {
    console.error('Error fetching repositories:', error)
    message.error(props.translations.failedToLoadRepos)
  } finally {
    loadingRepos.value = false
  }
}

// 格式化日期
const formatDate = (date) => {
  if (!date) return ''
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// 重置 Token
const handleResetToken = async () => {
  // 重置表单数据
  formValue.value.token = ''
  formValue.value.fullRepo = null
  formValue.value.path = 'bookmarks' // 重置为默认值
  isTokenSet.value = false
  repoOptions.value = []
  
  // 清除存储的 GitHub 设置
  try {
    if (chrome.storage) {
      await new Promise((resolve, reject) => {
        chrome.storage.sync.remove(['githubSettings', 'lastUploadTime'], () => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError)
          } else {
            resolve()
          }
        })
      })
    } else {
      localStorage.removeItem('githubSettings')
      localStorage.removeItem('lastUploadTime')
    }
    message.success(props.translations.success)
  } catch (error) {
    console.error('Error clearing GitHub settings:', error)
    message.error(props.translations.error)
  }
}

// 保存设置
const handleSaveSettings = () => {
  formRef.value?.validate(async (errors) => {
    if (errors) {
      const firstError = Array.isArray(errors[0]) ? errors[0][0].message : errors[0].message
      message.error(firstError)
      return
    }

    saving.value = true
    try {
      await saveToStorage({
        githubSettings: {
          token: formValue.value.token,
          fullRepo: formValue.value.fullRepo,
          path: formValue.value.path
        }
      })
      message.success(props.translations.settingsSaved)
      isTokenSet.value = true // 保存成功后设置为已配置状态
    } catch (error) {
      console.error('Error saving settings:', error)
      message.error(props.translations.saveFailed)
    } finally {
      saving.value = false
    }
  })
}

// 上传到GitHub
const handleUpload = async () => {
  if (!isConfigValid.value) {
    message.error(props.translations.configureGithubFirst)
    return
  }

  uploading.value = true
  try {
    // 获取所有书签
    const bookmarks = await getBookmarks()
    if (!bookmarks || !bookmarks.length) {
      message.warning(props.translations.noBookmarksToUpload)
      return
    }

    // 准备上传数据
    const content = JSON.stringify(bookmarks, null, 2)
    const filename = currentFilename.value || generateDefaultFilename()
    const path = formValue.value.path.replace(/^\/+|\/+$/g, '') // 移除开头和结尾的斜杠
    const fullPath = path ? `${path}/${filename}` : filename

    // 调用GitHub API
    const [owner, repo] = formValue.value.fullRepo.split('/')
    const response = await uploadToGithub(content, fullPath, owner, repo)

    if (response.ok) {
      message.success(props.translations.uploadSuccess)
      lastUploadTime.value = new Date().toISOString()
      await saveToStorage({ lastUploadTime: lastUploadTime.value })
      // 更新为新的默认文件名（使用当前日期）
      currentFilename.value = generateDefaultFilename()
    } else {
      throw new Error(await response.text())
    }
  } catch (error) {
    console.error('Upload error:', error)
    message.error(props.translations.uploadFailed + ': ' + error.message)
  } finally {
    uploading.value = false
  }
}

// 从storage获取书签
const getBookmarks = () => {
  return new Promise((resolve) => {
    if (chrome.storage) {
      chrome.storage.sync.get(['bookmarks'], (result) => {
        resolve(result.bookmarks || [])
      })
    } else {
      const bookmarks = JSON.parse(localStorage.getItem('bookmarks') || '[]')
      resolve(bookmarks)
    }
  })
}

// 保存到storage
const saveToStorage = (data) => {
  return new Promise((resolve, reject) => {
    if (chrome.storage) {
      chrome.storage.sync.set(data, () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError)
        } else {
          resolve()
        }
      })
    } else {
      try {
        Object.entries(data).forEach(([key, value]) => {
          localStorage.setItem(key, JSON.stringify(value))
        })
        resolve()
      } catch (error) {
        reject(error)
      }
    }
  })
}

// 上传到GitHub
const uploadToGithub = async (content, filename, owner, repo) => {
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${filename}`

  return fetch(url, {
    method: 'PUT',
    headers: {
      'Authorization': `token ${formValue.value.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: `Upload bookmarks: ${filename}`,
      content: btoa(unescape(encodeURIComponent(content))),
      branch: 'main'
    })
  })
}

// 初始化数据
onMounted(async () => {
  if (chrome.storage) {
    chrome.storage.sync.get(['githubSettings', 'lastUploadTime'], (result) => {
      if (result.githubSettings) {
        formValue.value = { ...formValue.value, ...result.githubSettings }
        isTokenSet.value = !!formValue.value.token // 根据是否有token设置状态
      }
      if (result.lastUploadTime) {
        lastUploadTime.value = result.lastUploadTime
      }
    })
  } else {
    try {
      const settings = JSON.parse(localStorage.getItem('githubSettings') || '{}')
      formValue.value = { ...formValue.value, ...settings }
      isTokenSet.value = !!formValue.value.token // 根据是否有token设置状态
      lastUploadTime.value = localStorage.getItem('lastUploadTime')
    } catch (error) {
      console.error('Error loading settings:', error)
    }
  }
})
</script>

<style scoped>
.upload-tab {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.last-upload-time {
  margin-top: 6px;
  text-align: center;
  color: #666;
  font-size: 0.9em;
}
</style>