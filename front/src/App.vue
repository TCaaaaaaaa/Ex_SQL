<template>
  <div id="app">
    <a-row class="header" type="flex" align="middle">
      <a-col flex="160px" style="margin: 0 auto">
        <RouterLink to="/">
          <a-row align="middle">
            <img src="./assets/logo.png" alt="可拓SQL教育平台" class="logo" />
            <span class="title">可拓SQL教育平台</span>
          </a-row>
        </RouterLink>
      </a-col>
      <a-col flex="auto">
        <a-menu
          :selected-keys="selectedKeys"
          mode="horizontal"
          :style="{ lineHeight: '64px' }"
          @click="doClickMenu"
        >
          <a-menu-item key="/learn">学习</a-menu-item>
          <a-menu-item key="/levels">关卡</a-menu-item>
          <a-menu-item key="/playground">广场</a-menu-item>
          <a-menu-item>
            <a href="https://www.code-nav.cn" target="_blank">
              <a-badge
                count="new"
                size="small"
                :offset="[16, 24]"
                color="green"
              >
                编程导航
              </a-badge>
            </a>
          </a-menu-item>
          <a-menu-item>
            <a href="https://www.mianshiya.com" target="_blank">
              <solution-outlined />
              面试真题
            </a>
          </a-menu-item>
        </a-menu>
      </a-col>
      
      <!-- 用户切换组件 -->
      <a-col>
         <a-dropdown>
            <a-button type="link" class="user-btn">
               <UserOutlined />
               {{ userStore.currentUser }}
               <DownOutlined />
            </a-button>
            <template #overlay>
              <a-menu @click="handleUserMenuClick">
                <a-menu-item v-for="user in userStore.users" :key="user">
                  <span v-if="user === userStore.currentUser" style="color: #1890ff">✓ {{ user }}</span>
                  <span v-else>{{ user }}</span>
                </a-menu-item>
                <a-menu-divider />
                <a-menu-item key="ADD_USER">
                  <PlusOutlined /> 新建用户
                </a-menu-item>
                <a-menu-item key="EXPORT_DATA">
                  <DownloadOutlined /> 导出档案
                </a-menu-item>
                <a-menu-item key="IMPORT_DATA">
                  <UploadOutlined /> 导入档案
                </a-menu-item>
              </a-menu>
            </template>
         </a-dropdown>
      </a-col>
    </a-row>
    <div class="content">
      <router-view />
    </div>
    <div class="footer">
      <p>
        <a-space size="middle">
          <a href="https://www.code-nav.cn" target="_blank">编程导航</a>
          <a href="https://www.laoyujianli.com" target="_blank">写简历神器</a>
          <a href="https://www.mianshiya.com" target="_blank">面试刷题</a>
        </a-space>
      </p>
      <p>
        可拓学SQL教育平台 - SQL 自学网站 ©{{ currentYear }}
      </p>
    </div>
    <a-back-top :style="{ right: '24px' }" />
    
    <!-- 新建用户弹窗 -->
    <a-modal
      v-model:visible="isAddUserModalVisible"
      title="新建用户"
      @ok="handleAddUser"
    >
      <a-input v-model:value="newUserName" placeholder="请输入用户名" />
    </a-modal>

    <!-- 隐藏的文件上传 Input -->
    <input
      type="file"
      ref="fileInputRef"
      style="display: none"
      accept=".json"
      @change="handleFileChange"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { 
  BookOutlined, 
  SolutionOutlined,
  UserOutlined,
  DownOutlined,
  PlusOutlined,
  DownloadOutlined,
  UploadOutlined
} from "@ant-design/icons-vue";
import { useUserStore } from "./core/userStore";
import { useGlobalStore } from "./core/globalStore";
import { message } from "ant-design-vue";
import { exportUserData, importUserData } from "./core/dataManager";

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();
const globalStore = useGlobalStore();

// 初始化全局数据和用户数据
globalStore.init();
userStore.init();

const selectedKeys = computed(() => [route.path]);

// 获取当前年份
const currentYear = computed(() => new Date().getFullYear());

const isAddUserModalVisible = ref(false);
const newUserName = ref('');
const fileInputRef = ref<HTMLInputElement>();

const doClickMenu = ({ key }: any) => {
  if (key) {
    router.push({
      path: key,
    });
  }
};

const handleUserMenuClick = ({ key }: any) => {
    if (key === 'ADD_USER') {
        newUserName.value = '';
        isAddUserModalVisible.value = true;
    } else if (key === 'EXPORT_DATA') {
        exportUserData();
    } else if (key === 'IMPORT_DATA') {
        fileInputRef.value?.click();
    } else {
        userStore.setCurrentUser(key);
        message.success(`已切换为用户: ${key}`);
        window.location.reload();
    }
};

const handleAddUser = () => {
    if (!newUserName.value) {
        message.warn('用户名不能为空');
        return;
    }
    if (userStore.users.includes(newUserName.value)) {
        message.warn('用户已存在');
        return;
    }
    userStore.addUser(newUserName.value);
    message.success('创建成功');
    isAddUserModalVisible.value = false;
    // 自动切换到新用户
    userStore.setCurrentUser(newUserName.value);
    window.location.reload();
}

const handleFileChange = (e: Event) => {
    const files = (e.target as HTMLInputElement).files;
    if (files && files.length > 0) {
        importUserData(files[0]);
    }
    // 清空 input，允许重复上传同一文件
    if (fileInputRef.value) {
        fileInputRef.value.value = '';
    }
}
</script>

<style scoped>
.header {
  border-bottom: 1px solid #f0f0f0;
  padding: 0 24px;
}

.ant-menu-horizontal {
  border-bottom: none !important;
}

.logo {
  width: 54px;
}

.title {
  margin-left: 6px;
  font-size: 18px;
  color: #000;
}

.content {
  padding: 24px;
}

.footer {
  padding: 12px;
  text-align: center;
  background: #efefef;

  p {
    margin-bottom: 4px;
  }
}

.user-btn {
    color: rgba(0, 0, 0, 0.65);
    font-size: 14px;
}
.user-btn:hover {
    color: #1890ff;
}
</style>
