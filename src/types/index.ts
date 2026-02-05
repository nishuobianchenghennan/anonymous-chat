// 消息类型
export interface Message {
  id: string
  roomId: string
  userId: string
  username: string
  content: string
  timestamp: number
}

// 房间信息
export interface Room {
  id: string
  createdAt: number
  messageCount: number
}

// API 响应
export interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
}
