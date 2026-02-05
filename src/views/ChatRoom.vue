<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useChatStore } from '@/stores/chat'
import { getRoomMessages, sendMessage, deleteRoom } from '@/api'
import type { Message } from '@/types'

const route = useRoute()
const router = useRouter()
const chatStore = useChatStore()

const messages = ref<Message[]>([])
const messageInput = ref('')
const loading = ref(false)
const sending = ref(false)
const messagesContainer = ref<HTMLElement>()
const showDeleteConfirm = ref(false)
const deleting = ref(false)

let refreshTimer: number | null = null
let lastMessageCount = 0

// 获取房间消息
const fetchMessages = async (silent = false) => {
  try {
    const roomId = route.params.roomId as string
    const data = await getRoomMessages(roomId)

    // 智能更新：只在消息数量变化时更新界面和滚动
    if (data.length !== lastMessageCount) {
      messages.value = data
      lastMessageCount = data.length

      if (!silent) {
        await nextTick()
        scrollToBottom()
      }
    }
  } catch (error: any) {
    console.error('获取消息失败:', error)
  }
}

// 发送消息
const handleSendMessage = async () => {
  if (!messageInput.value.trim() || sending.value) return

  const content = messageInput.value.trim()
  messageInput.value = ''
  sending.value = true

  try {
    const roomId = route.params.roomId as string
    // 发送消息后，后端返回完整的消息列表，立即更新界面
    const updatedMessages = await sendMessage(roomId, content, chatStore.username, chatStore.userId)
    messages.value = updatedMessages
    lastMessageCount = updatedMessages.length
    await nextTick()
    scrollToBottom()
  } catch (error: any) {
    alert('发送失败: ' + error.message)
    messageInput.value = content
  } finally {
    sending.value = false
  }
}

// 滚动到底部
const scrollToBottom = () => {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

// 删除房间
const handleDeleteRoom = async () => {
  if (!confirm('确定要删除房间吗？删除后所有聊天记录将被清空！')) {
    showDeleteConfirm.value = false
    return
  }

  deleting.value = true
  try {
    const roomId = route.params.roomId as string
    await deleteRoom(roomId, chatStore.roomPassword)
    alert('房间已删除')
    chatStore.clearRoomInfo()
    router.push('/room-auth')
  } catch (error: any) {
    alert('删除失败: ' + error.message)
  } finally {
    deleting.value = false
    showDeleteConfirm.value = false
  }
}

// 退出房间
const handleLeaveRoom = () => {
  if (confirm('确定要退出房间吗？')) {
    chatStore.clearRoomInfo()
    router.push('/room-auth')
  }
}

// 复制房间ID
const copyRoomId = () => {
  const roomId = route.params.roomId as string
  navigator.clipboard.writeText(roomId).then(() => {
    alert('房间ID已复制到剪贴板')
  })
}

// 格式化时间
const formatTime = (timestamp: number) => {
  const date = new Date(timestamp)
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  return `${hours}:${minutes}`
}

// 判断是否是自己的消息
const isOwnMessage = (msg: Message) => {
  return msg.userId === chatStore.userId
}

onMounted(async () => {
  loading.value = true
  await fetchMessages()
  loading.value = false

  // 每1秒刷新一次消息（静默模式，只在有新消息时更新）
  refreshTimer = window.setInterval(() => {
    fetchMessages(true)
  }, 1000)
})

onUnmounted(() => {
  if (refreshTimer) {
    clearInterval(refreshTimer)
  }
})
</script>

<template>
  <div class="chat-room">
    <!-- 顶部导航栏 -->
    <div class="chat-header">
      <div class="header-left">
        <div class="room-info">
          <h3>匿名聊天室</h3>
          <p class="room-id" @click="copyRoomId" title="点击复制">
            房间ID: {{ route.params.roomId }}
          </p>
        </div>
      </div>
      <div class="header-right">
        <span class="username">{{ chatStore.username }}</span>
        <button class="btn-icon" @click="handleLeaveRoom" title="退出房间">
          🚪
        </button>
        <button class="btn-icon btn-danger" @click="showDeleteConfirm = true" title="删除房间">
          🗑️
        </button>
      </div>
    </div>

    <!-- 消息列表 -->
    <div ref="messagesContainer" class="messages-container">
      <div v-if="loading" class="loading">
        <div class="loading-spinner"></div>
        <p>加载中...</p>
      </div>

      <div v-else-if="messages.length === 0" class="empty-messages">
        <div class="empty-icon">💬</div>
        <p>还没有消息，开始聊天吧！</p>
      </div>

      <div v-else class="messages-list">
        <div
          v-for="msg in messages"
          :key="msg.id"
          :class="['message-item', { 'own-message': isOwnMessage(msg) }]"
        >
          <div class="message-bubble">
            <div class="message-header">
              <span class="message-username">{{ msg.username }}</span>
              <span class="message-time">{{ formatTime(msg.timestamp) }}</span>
            </div>
            <div class="message-content">{{ msg.content }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 输入框 -->
    <div class="chat-input">
      <form @submit.prevent="handleSendMessage" class="input-form">
        <input
          v-model="messageInput"
          type="text"
          class="input"
          placeholder="输入消息..."
          :disabled="sending"
          maxlength="500"
        />
        <button type="submit" class="btn btn-primary send-btn" :disabled="sending || !messageInput.trim()">
          {{ sending ? '发送中' : '发送' }}
        </button>
      </form>
    </div>

    <!-- 删除确认弹窗 -->
    <div v-if="showDeleteConfirm" class="modal-overlay" @click="showDeleteConfirm = false">
      <div class="modal-content" @click.stop>
        <h3>删除房间</h3>
        <p>确定要删除这个房间吗？</p>
        <p class="warning">⚠️ 删除后所有聊天记录将被永久清空！</p>
        <div class="modal-actions">
          <button class="btn" @click="showDeleteConfirm = false" :disabled="deleting">
            取消
          </button>
          <button class="btn btn-danger" @click="handleDeleteRoom" :disabled="deleting">
            {{ deleting ? '删除中...' : '确认删除' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.chat-room {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--bg-gray);
}

/* 顶部导航栏 */
.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background: white;
  border-bottom: 1px solid var(--border-color);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.room-info h3 {
  font-size: 18px;
  color: var(--text-primary);
  margin: 0 0 4px 0;
}

.room-id {
  font-size: 12px;
  color: var(--text-secondary);
  margin: 0;
  cursor: pointer;
  user-select: all;
}

.room-id:hover {
  color: var(--primary-color);
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.username {
  font-size: 14px;
  color: var(--text-primary);
  font-weight: 500;
  padding: 6px 12px;
  background: var(--bg-gray);
  border-radius: 6px;
}

.btn-icon {
  width: 40px;
  height: 40px;
  border: none;
  background: var(--bg-gray);
  border-radius: 8px;
  font-size: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-icon:hover {
  background: var(--border-color);
  transform: scale(1.05);
}

.btn-icon.btn-danger:hover {
  background: #fff5f5;
}

/* 消息容器 */
.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--text-secondary);
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid var(--border-color);
  border-top-color: var(--primary-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.empty-messages {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--text-secondary);
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.messages-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.message-item {
  display: flex;
  animation: fadeIn 0.3s ease;
}

.message-item.own-message {
  justify-content: flex-end;
}

.message-bubble {
  max-width: 60%;
  padding: 12px 16px;
  border-radius: 12px;
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.own-message .message-bubble {
  background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
  color: white;
}

.message-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
  gap: 12px;
}

.message-username {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
}

.own-message .message-username {
  color: rgba(255, 255, 255, 0.9);
}

.message-time {
  font-size: 11px;
  color: var(--text-secondary);
  opacity: 0.7;
}

.own-message .message-time {
  color: rgba(255, 255, 255, 0.8);
}

.message-content {
  font-size: 15px;
  line-height: 1.5;
  word-wrap: break-word;
  color: var(--text-primary);
}

.own-message .message-content {
  color: white;
}

/* 输入框 */
.chat-input {
  padding: 16px 24px;
  background: white;
  border-top: 1px solid var(--border-color);
}

.input-form {
  display: flex;
  gap: 12px;
}

.input-form .input {
  flex: 1;
}

.send-btn {
  width: 100px;
  padding: 12px 24px;
}

.send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 模态框 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.3s ease;
}

.modal-content {
  background: white;
  border-radius: 16px;
  padding: 32px;
  max-width: 400px;
  width: 90%;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.modal-content h3 {
  margin: 0 0 16px 0;
  font-size: 24px;
  color: var(--text-primary);
}

.modal-content p {
  margin: 0 0 12px 0;
  color: var(--text-secondary);
}

.modal-content .warning {
  color: var(--danger-color);
  font-weight: 500;
  padding: 12px;
  background: #fff5f5;
  border-radius: 8px;
  margin-bottom: 24px;
}

.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.modal-actions .btn {
  padding: 10px 20px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .chat-header {
    padding: 12px 16px;
  }

  .room-info h3 {
    font-size: 16px;
  }

  .username {
    display: none;
  }

  .messages-container {
    padding: 16px;
  }

  .message-bubble {
    max-width: 80%;
  }

  .chat-input {
    padding: 12px 16px;
  }
}
</style>
