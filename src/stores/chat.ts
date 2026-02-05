import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useChatStore = defineStore('chat', () => {
  // 当前用户信息
  const userId = ref<string>('')
  const username = ref<string>('')
  const currentRoomId = ref<string>('')
  const roomPassword = ref<string>('')

  // 生成随机用户名
  const generateUsername = () => {
    const adjectives = ['神秘', '匿名', '隐身', '幽灵', '影子', '暗夜', '星空', '月光']
    const nouns = ['访客', '旅人', '过客', '使者', '行者', '游侠', '探索者', '观察者']
    const randomAdj = adjectives[Math.floor(Math.random() * adjectives.length)]
    const randomNoun = nouns[Math.floor(Math.random() * nouns.length)]
    const randomNum = Math.floor(Math.random() * 1000)
    return `${randomAdj}${randomNoun}${randomNum}`
  }

  // 初始化用户
  const initUser = () => {
    userId.value = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    username.value = generateUsername()
  }

  // 设置房间信息
  const setRoomInfo = (roomId: string, password: string) => {
    currentRoomId.value = roomId
    roomPassword.value = password
  }

  // 清除房间信息
  const clearRoomInfo = () => {
    currentRoomId.value = ''
    roomPassword.value = ''
  }

  return {
    userId,
    username,
    currentRoomId,
    roomPassword,
    initUser,
    setRoomInfo,
    clearRoomInfo
  }
})
