import request from '@/utils/request'
import type { Message, Room } from '@/types'

// 验证系统密令
export const verifySystemPassword = (password: string) => {
  return request.post('/api/verify-system', { password })
}

// 创建房间
export const createRoom = (roomPassword: string) => {
  return request.post<Room>('/api/rooms', { roomPassword })
}

// 加入房间
export const joinRoom = (roomId: string, roomPassword: string) => {
  return request.post(`/api/rooms/${roomId}/join`, { roomPassword })
}

// 获取房间消息
export const getRoomMessages = (roomId: string) => {
  return request.get<Message[]>(`/api/rooms/${roomId}/messages`)
}

// 发送消息
export const sendMessage = (roomId: string, content: string, username: string, userId: string) => {
  return request.post<Message>(`/api/rooms/${roomId}/messages`, { content, username, userId })
}

// 删除房间
export const deleteRoom = (roomId: string, roomPassword: string) => {
  return request.delete(`/api/rooms/${roomId}`, { data: { roomPassword } })
}
