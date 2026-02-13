<template>
  <div class="login-container">
    <div class="login-box">
      <div class="header">
        <img src="../assets/logo.png" alt="Logo" class="logo" />
        <h2 class="title">可拓 SQL 教育平台</h2>
        <p class="subtitle">智能诊断 · 个性化推荐 · 趣味学习</p>
      </div>

      <a-tabs v-model:activeKey="activeKey" centered>
        <a-tab-pane key="login" tab="登录">
          <a-form :model="loginForm" @finish="handleLogin" layout="vertical">
            <a-form-item
              name="username"
              :rules="[{ required: true, message: '请输入用户名' }]"
            >
              <a-input v-model:value="loginForm.username" placeholder="用户名" size="large">
                <template #prefix><UserOutlined /></template>
              </a-input>
            </a-form-item>
            <a-form-item
              name="password"
              :rules="[{ required: true, message: '请输入密码' }]"
            >
              <a-input-password v-model:value="loginForm.password" placeholder="密码" size="large">
                <template #prefix><LockOutlined /></template>
              </a-input-password>
            </a-form-item>
            <a-form-item>
              <a-button type="primary" html-type="submit" block size="large" :loading="loading">
                登录
              </a-button>
            </a-form-item>
          </a-form>
        </a-tab-pane>

        <a-tab-pane key="register" tab="注册">
          <a-form :model="registerForm" @finish="handleRegister" layout="vertical">
            <a-form-item
              name="username"
              :rules="[{ required: true, message: '请输入用户名' }]"
            >
              <a-input v-model:value="registerForm.username" placeholder="设置用户名" size="large">
                <template #prefix><UserOutlined /></template>
              </a-input>
            </a-form-item>
            <a-form-item
              name="password"
              :rules="[{ required: true, message: '请输入密码' }]"
            >
              <a-input-password v-model:value="registerForm.password" placeholder="设置密码" size="large">
                <template #prefix><LockOutlined /></template>
              </a-input-password>
            </a-form-item>
            <a-form-item
              name="confirmPassword"
              :rules="[
                { required: true, message: '请确认密码' },
                { validator: validateConfirmPassword }
              ]"
            >
              <a-input-password v-model:value="registerForm.confirmPassword" placeholder="确认密码" size="large">
                <template #prefix><LockOutlined /></template>
              </a-input-password>
            </a-form-item>
            <a-form-item>
              <a-button type="primary" html-type="submit" block size="large" :loading="loading">
                注册并登录
              </a-button>
            </a-form-item>
          </a-form>
        </a-tab-pane>
      </a-tabs>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { message } from 'ant-design-vue';
import { UserOutlined, LockOutlined } from '@ant-design/icons-vue';
import { useUserStore } from '../core/userStore';

const router = useRouter();
const userStore = useUserStore();
const activeKey = ref('login');
const loading = ref(false);

const loginForm = reactive({
  username: '',
  password: ''
});

const registerForm = reactive({
  username: '',
  password: '',
  confirmPassword: ''
});

const validateConfirmPassword = async (_rule: any, value: string) => {
  if (value !== registerForm.password) {
    throw new Error('两次输入的密码不一致');
  }
};

const handleLogin = async (values: any) => {
  loading.value = true;
  try {
    await userStore.login(values.username, values.password);
    message.success('登录成功');
    router.push('/');
  } catch (error: any) {
    message.error(error.message || '登录失败，请检查用户名或密码');
  } finally {
    loading.value = false;
  }
};

const handleRegister = async (values: any) => {
  loading.value = true;
  try {
    await userStore.register(values.username, values.password);
    message.success('注册成功');
    router.push('/');
  } catch (error: any) {
    message.error(error.message || '注册失败，用户名可能已存在');
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: #f0f2f5;
  background-image: url('https://gw.alipayobjects.com/zos/rmsportal/TVYTbAXWheQpRcWDaDMu.svg');
  background-repeat: no-repeat;
  background-position: center 110px;
  background-size: 100%;
}

.login-box {
  width: 400px;
  padding: 40px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.header {
  text-align: center;
  margin-bottom: 40px;
}

.logo {
  height: 44px;
  margin-bottom: 16px;
}

.title {
  font-size: 24px;
  color: rgba(0, 0, 0, 0.85);
  font-weight: 600;
  margin-bottom: 8px;
}

.subtitle {
  color: rgba(0, 0, 0, 0.45);
  font-size: 14px;
}
</style>