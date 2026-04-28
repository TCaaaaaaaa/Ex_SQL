import { useKnowledgeStore } from "./knowledgeStore";
import { useUserStore } from "./userStore";
import { message } from "ant-design-vue";

/**
 * 导出当前用户数据
 */
export const exportUserData = () => {
  const userStore = useUserStore();
  const knowledgeStore = useKnowledgeStore();
  const currentUser = userStore.currentUser;

  // 1. 获取该用户的知识点状态
  const userKnowledge = knowledgeStore.userKnowledgeMap[currentUser] || {};

  // 2. 组装数据包
  const dataPackage = {
    version: "1.0",
    user: currentUser,
    timestamp: Date.now(),
    data: {
      knowledgeMap: userKnowledge,
      // 如果后续 globalStore 支持多用户，也可以在这里添加 studyHistory
    },
  };

  // 3. 转换为 JSON 字符串
  const jsonStr = JSON.stringify(dataPackage, null, 2);

  // 4. 触发下载
  const blob = new Blob([jsonStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${currentUser}_data_${new Date()
    .toISOString()
    .slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  message.success("导出成功，请妥善保存文件");
};

/**
 * 导入用户数据
 * @param file
 */
export const importUserData = (file: File) => {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const jsonStr = e.target?.result as string;
      const dataPackage = JSON.parse(jsonStr);

      // 简单校验
      if (!dataPackage.user || !dataPackage.data) {
        throw new Error("文件格式不正确");
      }

      const userStore = useUserStore();
      const knowledgeStore = useKnowledgeStore();

      const targetUser = dataPackage.user;

      // 1. 如果用户不存在，先创建
      if (!userStore.users.includes(targetUser)) {
        userStore.addUser(targetUser);
      }

      // 2. 切换到该用户
      userStore.setCurrentUser(targetUser);

      // 3. 恢复知识点状态
      // 直接覆盖或合并？这里选择覆盖
      knowledgeStore.userKnowledgeMap[targetUser] =
        dataPackage.data.knowledgeMap;

      message.success(`导入成功，欢迎回来 ${targetUser}`);

      // 刷新页面以应用状态
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err) {
      console.error(err);
      message.error("导入失败，请检查文件是否损坏");
    }
  };
  reader.readAsText(file);
};
