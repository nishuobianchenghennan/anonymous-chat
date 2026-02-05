/**
 * Cloudflare Pages Functions Worker
 * 支持定时任务（Cron Triggers）
 */

export default {
  async fetch(request, env, ctx) {
    // 导入并执行 Pages Functions 的路由处理
    const { onRequest } = await import('./api/[[path]].js')
    return onRequest({ request, env, ctx })
  },

  async scheduled(event, env, ctx) {
    // 定时任务：每天 UTC 0:00（北京时间 8:00）清理所有房间
    console.log('开始执行定时清理任务...')

    try {
      // 调用清理 API
      const cleanupUrl = 'https://your-domain.pages.dev/api/cleanup'

      const response = await fetch(cleanupUrl, {
        method: 'POST',
        headers: {
          'X-System-Password': env.SYSTEM_PASSWORD,
          'Content-Type': 'application/json'
        }
      })

      const result = await response.json()
      console.log('清理完成:', result)
    } catch (error) {
      console.error('清理失败:', error)
    }
  }
}
