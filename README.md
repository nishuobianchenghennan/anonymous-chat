# 匿名聊天室

一个轻量级的匿名聊天应用，使用 Vue 3 + Cloudflare Pages Functions + KV 构建。

## 功能特性

- 🔐 系统密令保护，防止未授权访问
- 🚪 房间密令机制，创建和加入私密聊天室
- 👤 自动分配匿名身份
- 💬 实时消息刷新（每3秒）
- 🗑️ 房间删除功能，自动清理所有数据
- 📱 响应式设计，支持移动端
- 🎨 现代化 UI 界面

## 技术栈

### 前端
- Vue 3 (Composition API)
- TypeScript
- Vite
- Pinia (状态管理)
- Vue Router
- Axios

### 后端
- Cloudflare Pages Functions
- Cloudflare Workers KV (键值存储)

### 部署
- Cloudflare Pages（前后端一体化部署，通过 GitHub 自动构建）

## 快速部署

**前后端一起部署，超级简单！只需 5 分钟！**

详细步骤请查看：**[DEPLOY.md](DEPLOY.md)**

### 简要步骤

1. **推送代码到 GitHub**
2. **连接 Cloudflare Pages**（选择仓库）
3. **配置构建**（Framework = Vue, Build = `npm run build`, Output = `dist`）
4. **创建 KV 命名空间**（`CHAT_KV`）
5. **配置环境变量**（`SYSTEM_PASSWORD`）
6. **绑定 KV**（变量名 `CHAT_KV`）
7. **部署完成**！

### 优势

✅ **超级简单** - 前后端一起部署，无需单独配置 Worker
✅ **自动部署** - 推送代码到 GitHub 自动触发部署
✅ **同域名** - 前后端在同一域名下，无需 CORS
✅ **全球 CDN** - 自动分发到全球节点
✅ **完全免费** - 基本功能完全免费

---

## 本地开发

1. 安装依赖：
```bash
npm install
```

2. 启动开发服务器：
```bash
npm run dev
```

3. 访问 `http://localhost:3000`

**注意**：本地开发时，API 请求会发送到相对路径 `/api/*`，需要配置代理或部署后测试。

---

## 使用说明

### 1. 系统密令验证
- 首次访问需要输入系统密令
- 系统密令在 Cloudflare Pages 环境变量中设置
- 验证通过后会保存在本地存储

### 2. 创建房间
- 点击"创建房间"
- 设置房间密令
- 系统会生成唯一的房间 ID
- 分享房间 ID 和密令给朋友

### 3. 加入房间
- 点击"加入房间"
- 输入房间 ID 和密令
- 进入聊天室

### 4. 聊天
- 进入房间后自动分配匿名身份
- 输入消息并发送
- 消息每 3 秒自动刷新

### 5. 删除房间
- 点击右上角的删除按钮
- 确认删除
- 房间和所有消息将被永久删除

---

## 项目结构

```
anonymous-chat/
├── src/                    # 前端源码
│   ├── api/               # API 接口
│   ├── router/            # 路由配置
│   ├── stores/            # Pinia 状态管理
│   ├── styles/            # 全局样式
│   ├── types/             # TypeScript 类型定义
│   ├── utils/             # 工具函数
│   ├── views/             # 页面组件
│   │   ├── SystemAuth.vue    # 系统密令验证
│   │   ├── RoomAuth.vue      # 房间创建/加入
│   │   └── ChatRoom.vue      # 聊天室
│   ├── App.vue            # 根组件
│   └── main.ts            # 入口文件
├── functions/             # Cloudflare Pages Functions
│   └── api/
│       └── [[path]].js    # API 处理函数（捕获所有 /api/* 路由）
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── DEPLOY.md              # 部署指南
└── README.md
```

---

## API 接口

所有 API 都在 `/api/*` 路径下，由 Cloudflare Pages Functions 处理。

### 验证系统密令
```
POST /api/verify-system
Body: { password: string }
```

### 创建房间
```
POST /api/rooms
Headers: X-System-Password
Body: { roomPassword: string }
Response: { id, createdAt, messageCount }
```

### 加入房间
```
POST /api/rooms/:roomId/join
Headers: X-System-Password
Body: { roomPassword: string }
```

### 获取消息
```
GET /api/rooms/:roomId/messages
Headers: X-System-Password
Response: Message[]
```

### 发送消息
```
POST /api/rooms/:roomId/messages
Headers: X-System-Password
Body: { content: string, username: string }
```

### 删除房间
```
DELETE /api/rooms/:roomId
Headers: X-System-Password
Body: { roomPassword: string }
```

---

## 安全说明

- 系统密令用于防止未授权访问整个应用
- 房间密令用于保护特定聊天室
- 所有密令都通过 HTTPS 传输
- 数据存储在 Cloudflare KV，具有高可用性和安全性
- 删除房间会永久清除所有数据
- 每个房间最多保留最近 100 条消息

---

## 注意事项

- 消息不会永久保存，删除房间后无法恢复
- 建议定期清理不再使用的房间以节省存储空间
- 匿名身份仅在当前会话有效
- 建议使用强密令保护系统和房间

---

## 费用说明

- **Pages**: 完全免费，无限带宽，每月 500 次构建
- **Pages Functions**: 免费额度每天 100,000 次请求
- **KV**: 免费额度每天 100,000 次读取，1,000 次写入

个人使用基本都在免费额度内！

---

## 许可证

MIT License

---

## 贡献

欢迎提交 Issue 和 Pull Request！
