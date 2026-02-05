/**
 * Cloudflare Pages Functions API for Anonymous Chat
 * 使用 KV 存储聊天数据
 *
 * 这个文件会被 Cloudflare Pages 自动识别并部署为 API 端点
 * 路径：/api/* 会被路由到这个函数
 */

// CORS 头
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-System-Password',
}

// 响应工具函数
function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders,
    },
  })
}

function successResponse(data, message = '操作成功') {
  return jsonResponse({
    code: 200,
    message,
    data,
  })
}

function errorResponse(message, code = 400) {
  return jsonResponse({
    code,
    message,
    data: null,
  }, code)
}

// 生成唯一ID
function generateId() {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// 验证系统密令
function verifySystemPassword(request, env) {
  const systemPassword = request.headers.get('X-System-Password')
  return systemPassword === env.SYSTEM_PASSWORD
}

// 主处理函数
export async function onRequest(context) {
  const { request, env } = context
  const url = new URL(request.url)
  const path = url.pathname
  const method = request.method

  // 处理 OPTIONS 请求（CORS 预检）
  if (method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  // 验证系统密令（除了系统验证接口外的所有接口）
  if (path !== '/api/verify-system' && !verifySystemPassword(request, env)) {
    return errorResponse('系统密令验证失败', 401)
  }

  try {
    // 路由处理
    if (path === '/api/verify-system' && method === 'POST') {
      return await handleVerifySystem(request, env)
    }

    if (path === '/api/rooms' && method === 'POST') {
      return await handleCreateRoom(request, env)
    }

    if (path.match(/^\/api\/rooms\/[^/]+\/join$/) && method === 'POST') {
      return await handleJoinRoom(request, env)
    }

    if (path.match(/^\/api\/rooms\/[^/]+\/messages$/) && method === 'GET') {
      return await handleGetMessages(request, env)
    }

    if (path.match(/^\/api\/rooms\/[^/]+\/messages$/) && method === 'POST') {
      return await handleSendMessage(request, env)
    }

    if (path.match(/^\/api\/rooms\/[^/]+$/) && method === 'DELETE') {
      return await handleDeleteRoom(request, env)
    }

    if (path === '/api/cleanup' && method === 'POST') {
      return await handleCleanupAll(request, env)
    }

    return errorResponse('接口不存在', 404)
  } catch (error) {
    console.error('Error:', error)
    return errorResponse('服务器错误: ' + error.message, 500)
  }
}

// 验证系统密令
async function handleVerifySystem(request, env) {
  const body = await request.json()
  const { password } = body

  if (password === env.SYSTEM_PASSWORD) {
    return successResponse(true, '验证成功')
  }

  return errorResponse('系统密令错误', 401)
}

// 创建房间
async function handleCreateRoom(request, env) {
  const body = await request.json()
  const { roomPassword } = body

  if (!roomPassword) {
    return errorResponse('房间密令不能为空')
  }

  const roomId = generateId()
  const room = {
    id: roomId,
    password: roomPassword,
    createdAt: Date.now(),
    messageCount: 0,
  }

  // 保存房间信息到 KV
  await env.CHAT_KV.put(`room:${roomId}`, JSON.stringify(room))

  // 初始化空消息列表
  await env.CHAT_KV.put(`messages:${roomId}`, JSON.stringify([]))

  return successResponse({
    id: roomId,
    createdAt: room.createdAt,
    messageCount: 0,
  }, '房间创建成功')
}

// 加入房间
async function handleJoinRoom(request, env) {
  const url = new URL(request.url)
  const roomId = url.pathname.split('/')[3]
  const body = await request.json()
  const { roomPassword } = body

  // 获取房间信息
  const roomData = await env.CHAT_KV.get(`room:${roomId}`)

  if (!roomData) {
    return errorResponse('房间不存在', 404)
  }

  const room = JSON.parse(roomData)

  if (room.password !== roomPassword) {
    return errorResponse('房间密令错误', 401)
  }

  return successResponse({
    id: room.id,
    createdAt: room.createdAt,
    messageCount: room.messageCount,
  }, '加入房间成功')
}

// 获取房间消息
async function handleGetMessages(request, env) {
  const url = new URL(request.url)
  const roomId = url.pathname.split('/')[3]

  // 验证房间是否存在
  const roomData = await env.CHAT_KV.get(`room:${roomId}`)
  if (!roomData) {
    return errorResponse('房间不存在', 404)
  }

  // 获取消息列表
  const messagesData = await env.CHAT_KV.get(`messages:${roomId}`)
  const messages = messagesData ? JSON.parse(messagesData) : []

  return successResponse(messages, '获取消息成功')
}

// 发送消息
async function handleSendMessage(request, env) {
  const url = new URL(request.url)
  const roomId = url.pathname.split('/')[3]
  const body = await request.json()
  const { content, username, userId } = body

  if (!content || !username) {
    return errorResponse('消息内容和用户名不能为空')
  }

  // 验证房间是否存在
  const roomData = await env.CHAT_KV.get(`room:${roomId}`)
  if (!roomData) {
    return errorResponse('房间不存在', 404)
  }

  const room = JSON.parse(roomData)

  // 获取现有消息
  const messagesData = await env.CHAT_KV.get(`messages:${roomId}`)
  const messages = messagesData ? JSON.parse(messagesData) : []

  // 创建新消息
  const message = {
    id: generateId(),
    roomId,
    userId: userId || generateId(),
    username,
    content,
    timestamp: Date.now(),
  }

  // 添加消息
  messages.push(message)

  // 限制消息数量（最多保留最近 100 条，避免 KV 值过大）
  if (messages.length > 100) {
    messages.splice(0, messages.length - 100)
  }

  // 保存消息列表
  await env.CHAT_KV.put(`messages:${roomId}`, JSON.stringify(messages))

  // 更新房间消息计数
  room.messageCount = messages.length
  await env.CHAT_KV.put(`room:${roomId}`, JSON.stringify(room))

  // 返回完整消息列表，解决 KV 最终一致性问题
  return successResponse(messages, '消息发送成功')
}

// 删除房间
async function handleDeleteRoom(request, env) {
  const url = new URL(request.url)
  const roomId = url.pathname.split('/')[3]
  const body = await request.json()
  const { roomPassword } = body

  // 获取房间信息
  const roomData = await env.CHAT_KV.get(`room:${roomId}`)

  if (!roomData) {
    return errorResponse('房间不存在', 404)
  }

  const room = JSON.parse(roomData)

  if (room.password !== roomPassword) {
    return errorResponse('房间密令错误', 401)
  }

  // 删除房间和消息
  await env.CHAT_KV.delete(`room:${roomId}`)
  await env.CHAT_KV.delete(`messages:${roomId}`)

  return successResponse(null, '房间删除成功')
}

// 清理所有房间（定时任务调用）
async function handleCleanupAll(request, env) {
  try {
    // 验证系统密令（防止未授权调用）
    const systemPassword = request.headers.get('X-System-Password')
    if (systemPassword !== env.SYSTEM_PASSWORD) {
      return errorResponse('系统密令验证失败', 401)
    }

    // 列出所有以 room: 开头的键
    const roomsList = await env.CHAT_KV.list({ prefix: 'room:' })
    const messagesList = await env.CHAT_KV.list({ prefix: 'messages:' })

    // 删除所有房间
    const deletePromises = []
    for (const key of roomsList.keys) {
      deletePromises.push(env.CHAT_KV.delete(key.name))
    }

    // 删除所有消息
    for (const key of messagesList.keys) {
      deletePromises.push(env.CHAT_KV.delete(key.name))
    }

    await Promise.all(deletePromises)

    return successResponse({
      deletedRooms: roomsList.keys.length,
      deletedMessages: messagesList.keys.length
    }, '清理完成')
  } catch (error) {
    console.error('清理失败:', error)
    return errorResponse('清理失败: ' + error.message, 500)
  }
}
