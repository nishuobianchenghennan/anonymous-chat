# 匿名聊天室 - 超简单部署指南

使用 **Cloudflare Pages Functions + GitHub**，前后端一起部署，无需单独配置 Worker！

---

## 🚀 一键部署（5分钟完成）

### 第一步：推送代码到 GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/your-username/your-repo.git
git push -u origin main
```

### 第二步：连接 Cloudflare Pages

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 选择 **Workers & Pages**
3. 点击 **Create application**
4. 选择 **Pages** 标签
5. 点击 **Connect to Git**
6. 选择 **GitHub**（首次需要授权）
7. 选择你的仓库

### 第三步：配置构建设置

在构建配置页面：

- **Project name**: `anonymous-chat`（或自定义名称）
- **Production branch**: `main`
- **Framework preset**: 选择 `Vue`
- **Build command**: `npm run build`
- **Build output directory**: `dist`

### 第四步：创建 KV 命名空间

1. 在 Cloudflare Dashboard，进入 **Workers & Pages**
2. 点击 **KV** 标签
3. 点击 **Create a namespace**
4. 输入命名空间名称：`CHAT_KV`
5. 点击 **Add**
6. **记录命名空间 ID**（类似：`abc123def456`）

### 第五步：配置环境变量和绑定

回到 Pages 项目配置页面：

#### 1. 添加环境变量

在 **Environment variables** 部分：

- 点击 **Add variable**
- **Variable name**: `SYSTEM_PASSWORD`
- **Value**: 输入你的系统密令（例如：`MyStrongPassword123`）
- 环境选择：**Production** 和 **Preview** 都勾选

#### 2. 添加 KV 绑定

在 **Functions** 部分（或 **Settings** -> **Functions** -> **KV namespace bindings**）：

- 点击 **Add binding**
- **Variable name**: `CHAT_KV`（必须是这个名字）
- **KV namespace**: 选择刚才创建的 `CHAT_KV`

### 第六步：开始部署

1. 点击 **Save and Deploy**
2. Cloudflare Pages 会自动：
   - 克隆你的 GitHub 仓库
   - 安装依赖（npm install）
   - 构建前端（npm run build）
   - 部署前端和 API 到全球 CDN

### 第七步：等待部署完成

- 部署过程大约需要 2-5 分钟
- 可以在 **Deployments** 标签查看进度
- 部署成功后会显示访问 URL，类似：
  ```
  https://anonymous-chat.pages.dev
  ```

### 第八步：开始使用

1. 访问你的 Cloudflare Pages URL
2. 输入系统密令（你在环境变量中设置的 `SYSTEM_PASSWORD`）
3. 创建房间，设置房间密令
4. 分享房间 ID 和密令给朋友
5. 开始聊天！

---

## 🕐 配置定时清理（可选）

系统支持每天自动清理所有聊天室，保护隐私。

### 方法一：使用 GitHub Actions（推荐）

1. 进入 GitHub 仓库的 **Settings** -> **Secrets and variables** -> **Actions**
2. 添加以下 Secrets：
   - `CLEANUP_URL`: 你的清理 API 地址（例如：`https://your-app.pages.dev/api/cleanup`）
   - `SYSTEM_PASSWORD`: 你的系统密令（与 Cloudflare Pages 中设置的相同）
3. GitHub Actions 会在每天北京时间 0:00 自动执行清理

### 方法二：使用 Cloudflare Cron Triggers

1. 修改 `functions/_worker.js` 中的域名为你的实际域名
2. 在 Cloudflare Pages 项目中添加 Cron Trigger：
   - 进入 **Settings** -> **Functions** -> **Cron Triggers**
   - 添加触发器：`0 16 * * *`（UTC 16:00 = 北京时间 0:00）

### 手动清理

如果需要立即清理所有房间，可以在 GitHub Actions 中手动触发 `cleanup` 工作流。

---

## 🎯 架构说明

### 前后端一体化部署

```
GitHub 仓库
    ↓
Cloudflare Pages 自动构建
    ↓
├── 前端（Vue 3）→ 部署到 CDN
└── 后端（Pages Functions）→ /api/* 路由
    └── 使用 KV 存储数据
```

### 优势

✅ **超级简单** - 只需配置一次 Pages，前后端一起部署
✅ **无需单独 Worker** - Pages Functions 自动处理 API
✅ **自动部署** - 推送代码到 GitHub 自动触发部署
✅ **同域名** - 前后端在同一域名下，无需 CORS 配置
✅ **完全免费** - 基本功能完全免费

---

## 🔄 更新代码

只需推送代码到 GitHub：

```bash
git add .
git commit -m "Update feature"
git push
```

Cloudflare Pages 会**自动重新构建和部署**！

---

## 🔧 配置自定义域名（可选）

1. 进入 Pages 项目
2. 点击 **Custom domains**
3. 点击 **Set up a custom domain**
4. 输入域名（例如：`chat.yourdomain.com`）
5. 按提示配置 DNS

---

## ❓ 常见问题

### Q: 找不到 KV namespace bindings 选项？
A:
1. 确保已经创建了 KV 命名空间
2. 在 Pages 项目的 **Settings** -> **Functions** 中查找
3. 如果还是找不到，可以在部署后再添加，然后触发重新部署

### Q: API 返回 500 错误？
A: 检查：
1. KV 绑定的变量名是否为 `CHAT_KV`
2. 环境变量 `SYSTEM_PASSWORD` 是否设置
3. 查看 Pages 项目的 **Functions** -> **Logs** 查看详细错误

### Q: 前端无法连接后端？
A:
1. 检查浏览器控制台是否有错误
2. 确认 API 路径是 `/api/*`
3. 查看 Pages 部署日志确认 Functions 是否正确部署

### Q: 如何查看 Functions 日志？
A:
1. 进入 Pages 项目
2. 点击 **Functions** 标签
3. 点击 **Real-time logs**
4. 可以看到所有 API 请求的日志

### Q: 如何修改系统密令？
A:
1. 进入 Pages 项目
2. 点击 **Settings** -> **Environment variables**
3. 编辑 `SYSTEM_PASSWORD`
4. 点击 **Save**
5. 触发重新部署（推送任意代码或手动重新部署）

### Q: 如何查看 KV 中的数据？
A:
1. 进入 **Workers & Pages** -> **KV**
2. 点击 `CHAT_KV` 命名空间
3. 可以查看所有存储的键值对

### Q: 构建失败怎么办？
A:
1. 查看 **Deployments** 中的构建日志
2. 确保 package.json 中的依赖版本正确
3. 检查是否有语法错误
4. 如果遇到 `vue-tsc` 相关错误（如 "Search string not found"），说明 TypeScript 检查工具与 Node.js 版本不兼容。本项目已将构建命令改为 `vite build`（不包含类型检查），可以正常构建

---

## 💰 费用说明

- **Pages**: 完全免费，无限带宽，每月 500 次构建
- **Pages Functions**: 免费额度每天 100,000 次请求
- **KV**: 免费额度每天 100,000 次读取，1,000 次写入

个人使用基本都在免费额度内！

---

## 📁 项目结构

```
anonymous-chat/
├── src/                    # 前端源码
│   ├── views/             # 页面组件
│   ├── api/               # API 接口
│   ├── stores/            # 状态管理
│   └── ...
├── functions/             # Cloudflare Pages Functions
│   └── api/
│       └── [[path]].js    # API 处理函数（捕获所有 /api/* 路由）
├── index.html
├── package.json
└── vite.config.ts
```

---

## 🎉 完成

现在你的匿名聊天室已经完全部署在 Cloudflare 上了！

- ✅ 前后端一体化部署
- ✅ 全球 CDN 加速
- ✅ 自动 HTTPS
- ✅ 完全免费

开始使用吧！🚀
