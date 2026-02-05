<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useChatStore } from '@/stores/chat'
import { createRoom, joinRoom } from '@/api'

const router = useRouter()
const chatStore = useChatStore()

const mode = ref<'create' | 'join'>('create')
const roomPassword = ref('')
const roomId = ref('')
const loading = ref(false)
const errorMsg = ref('')

// 切换模式
const switchMode = (newMode: 'create' | 'join') => {
  mode.value = newMode
  errorMsg.value = ''
  roomPassword.value = ''
  roomId.value = ''
}

// 创建房间
const handleCreateRoom = async () => {
  if (!roomPassword.value.trim()) {
    errorMsg.value = '请输入房间密令'
    return
  }

  loading.value = true
  errorMsg.value = ''

  try {
    const room = await createRoom(roomPassword.value)
    chatStore.initUser()
    chatStore.setRoomInfo(room.id, roomPassword.value)
    router.push(`/chat/${room.id}`)
  } catch (error: any) {
    errorMsg.value = error.message || '创建房间失败'
  } finally {
    loading.value = false
  }
}

// 加入房间
const handleJoinRoom = async () => {
  if (!roomId.value.trim()) {
    errorMsg.value = '请输入房间ID'
    return
  }
  if (!roomPassword.value.trim()) {
    errorMsg.value = '请输入房间密令'
    return
  }

  loading.value = true
  errorMsg.value = ''

  try {
    await joinRoom(roomId.value, roomPassword.value)
    chatStore.initUser()
    chatStore.setRoomInfo(roomId.value, roomPassword.value)
    router.push(`/chat/${roomId.value}`)
  } catch (error: any) {
    errorMsg.value = error.message || '加入房间失败'
  } finally {
    loading.value = false
  }
}

const handleSubmit = () => {
  if (mode.value === 'create') {
    handleCreateRoom()
  } else {
    handleJoinRoom()
  }
}
</script>

<template>
  <div class="room-auth">
    <div class="auth-container fade-in">
      <div class="card">
        <div class="header">
          <h2>{{ mode === 'create' ? '创建房间' : '加入房间' }}</h2>
        </div>

        <div class="mode-switch">
          <button
            :class="['mode-btn', { active: mode === 'create' }]"
            @click="switchMode('create')"
            :disabled="loading"
          >
            创建房间
          </button>
          <button
            :class="['mode-btn', { active: mode === 'join' }]"
            @click="switchMode('join')"
            :disabled="loading"
          >
            加入房间
          </button>
        </div>

        <form @submit.prevent="handleSubmit" class="auth-form">
          <div v-if="mode === 'join'" class="form-group">
            <label>房间ID</label>
            <input
              v-model="roomId"
              type="text"
              class="input"
              placeholder="请输入房间ID"
              :disabled="loading"
            />
          </div>

          <div class="form-group">
            <label>房间密令</label>
            <input
              v-model="roomPassword"
              type="password"
              class="input"
              :placeholder="mode === 'create' ? '设置房间密令' : '请输入房间密令'"
              :disabled="loading"
            />
          </div>

          <div v-if="errorMsg" class="error-msg">
            {{ errorMsg }}
          </div>

          <button type="submit" class="btn btn-primary" :disabled="loading">
            {{ loading ? '处理中...' : mode === 'create' ? '创建并进入' : '加入房间' }}
          </button>
        </form>

        <div class="tips">
          <p v-if="mode === 'create'">
            💡 创建房间后，将生成唯一的房间ID，分享给朋友即可一起聊天
          </p>
          <p v-else>
            💡 输入朋友分享的房间ID和密令即可加入聊天
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.room-auth {
  width: 100%;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.auth-container {
  width: 100%;
  max-width: 500px;
  padding: 20px;
}

.header {
  text-align: center;
  margin-bottom: 24px;
}

.header h2 {
  font-size: 28px;
  color: var(--text-primary);
  font-weight: 700;
}

.mode-switch {
  display: flex;
  gap: 12px;
  margin-bottom: 32px;
  background: var(--bg-gray);
  padding: 4px;
  border-radius: 12px;
}

.mode-btn {
  flex: 1;
  padding: 12px;
  border: none;
  background: transparent;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.3s ease;
}

.mode-btn.active {
  background: white;
  color: var(--primary-color);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.mode-btn:hover:not(.active):not(:disabled) {
  color: var(--text-primary);
}

.mode-btn:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.auth-form {
  margin-bottom: 24px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  color: var(--text-primary);
  font-weight: 500;
  font-size: 14px;
}

.error-msg {
  color: var(--danger-color);
  font-size: 14px;
  margin-bottom: 16px;
  padding: 12px;
  background: #fff5f5;
  border-radius: 8px;
  border-left: 4px solid var(--danger-color);
}

.btn {
  width: 100%;
}

.tips {
  text-align: center;
  padding: 16px;
  background: var(--bg-gray);
  border-radius: 8px;
}

.tips p {
  color: var(--text-secondary);
  font-size: 14px;
  margin: 0;
}
</style>
