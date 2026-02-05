<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { verifySystemPassword } from '@/api'

const router = useRouter()
const password = ref('')
const loading = ref(false)
const errorMsg = ref('')

const handleSubmit = async () => {
  if (!password.value.trim()) {
    errorMsg.value = '请输入系统密令'
    return
  }

  loading.value = true
  errorMsg.value = ''

  try {
    await verifySystemPassword(password.value)
    // 保存系统密令到本地存储
    localStorage.setItem('systemPassword', password.value)
    // 跳转到房间验证页面
    router.push('/room-auth')
  } catch (error: any) {
    errorMsg.value = error.message || '密令验证失败'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="system-auth">
    <div class="auth-container fade-in">
      <div class="card">
        <div class="logo">
          <div class="logo-icon">💬</div>
          <h1>匿名聊天室</h1>
        </div>

        <p class="subtitle">请输入系统密令以继续</p>

        <form @submit.prevent="handleSubmit" class="auth-form">
          <div class="form-group">
            <input
              v-model="password"
              type="password"
              class="input"
              placeholder="请输入系统密令"
              :disabled="loading"
            />
          </div>

          <div v-if="errorMsg" class="error-msg">
            {{ errorMsg }}
          </div>

          <button type="submit" class="btn btn-primary" :disabled="loading">
            {{ loading ? '验证中...' : '进入' }}
          </button>
        </form>

        <div class="tips">
          <p>💡 提示：系统密令用于防止未授权访问</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.system-auth {
  width: 100%;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.auth-container {
  width: 100%;
  max-width: 450px;
  padding: 20px;
}

.logo {
  text-align: center;
  margin-bottom: 32px;
}

.logo-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.logo h1 {
  font-size: 32px;
  color: var(--text-primary);
  font-weight: 700;
}

.subtitle {
  text-align: center;
  color: var(--text-secondary);
  font-size: 16px;
  margin-bottom: 32px;
}

.auth-form {
  margin-bottom: 24px;
}

.form-group {
  margin-bottom: 16px;
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
