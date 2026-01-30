import { defineStore } from 'pinia';
import { KnowledgePoint, LevelKnowledgeMap, KnowledgeDependency } from './knowledgeGraph';
import { message } from 'ant-design-vue';
import { useUserStore } from './userStore';
import { useGlobalStore } from './globalStore';

// 关联函数参数
const W1 = 1.5; // 正确率权重 (Score)
const W2 = 0.5; // 时间效率权重 (Time)
const BIAS = 0.5; // 偏差值
const TIME_LIMIT = 60; // 假设基准时间 60秒

// 域状态定义
export enum ExtensionState {
  STABLE_POSITIVE = 'STABLE_POSITIVE', // 稳定正域 (K >= 1)
  POSITIVE_EDGE = 'POSITIVE_EDGE',     // 正域边缘 (0 <= K < 1)
  EXTENSION = 'EXTENSION',             // 可拓域 (-1 <= K < 0) - 最需要关注
  NEGATIVE = 'NEGATIVE',               // 负域 (K < -1)
}

interface KnowledgeStatus {
  kValue: number;
  state: ExtensionState;
  lastUpdated: number;
}

interface Recommendation {
  type: 'REVIEW' | 'NEXT' | 'CHALLENGE' | 'DECOMPOSE';
  levelKey: string;
  reason: string;
}

export const useKnowledgeStore = defineStore('knowledge', {
  state: () => ({
    // 用户知识点状态映射: Record<userId, Record<KnowledgePoint, KnowledgeStatus>>
    userKnowledgeMap: {} as Record<string, Record<string, KnowledgeStatus>>,
    // 记录用户最近一次操作的关卡，用于推荐上下文
    lastLevelKey: '',
  }),
  
  persist: {
    key: "knowledge-store",
    storage: window.localStorage,
  },

  getters: {
    // 获取当前用户的知识状态
    currentKnowledgeMap(state): Record<string, KnowledgeStatus> {
      const userStore = useUserStore();
      const userId = userStore.currentUser;
      if (!state.userKnowledgeMap[userId]) {
        state.userKnowledgeMap[userId] = {};
      }
      return state.userKnowledgeMap[userId];
    }
  },

  actions: {
    /**
     * 更新知识点状态 (核心算法 Step 1 & 4)
     * K(x) = w1 * Score + w2 * (1 - Time/Limit) - Bias
     */
    updateState(levelKey: string, isCorrect: boolean, timeSeconds: number) {
      this.lastLevelKey = levelKey;
      const kps = LevelKnowledgeMap[levelKey];
      
      if (!kps || kps.length === 0) return;

      const userStore = useUserStore();
      const userId = userStore.currentUser;
      
      // 确保当前用户有数据结构
      if (!this.userKnowledgeMap[userId]) {
        this.userKnowledgeMap[userId] = {};
      }
      const currentUserMap = this.userKnowledgeMap[userId];

      // 1. 计算本次表现的 K 值增量 (Delta K)
      const score = isCorrect ? 1 : -1; // 正确 +1，错误 -1
      const timeRatio = Math.min(timeSeconds / TIME_LIMIT, 2); // 限制最大时间惩罚
      const timeScore = 1 - timeRatio; // 时间越短越好
      
      // 单次关联度 k_instance
      const kInstance = (W1 * score) + (W2 * timeScore) - BIAS;

      // 2. 更新累积 K 值 (Accumulated K)
      // 采用移动平均或累加逻辑，这里采用累加但有衰减，模拟记忆曲线
      kps.forEach(kp => {
        const current = currentUserMap[kp] || { kValue: 0, state: ExtensionState.EXTENSION, lastUpdated: 0 };
        
        // 简单的累加模型，但也引入衰减 (每次更新前，旧值 * 0.9)
        let newK = (current.kValue * 0.9) + kInstance;
        
        // 限制 K 值范围 [-5, 5] 防止溢出
        newK = Math.max(-5, Math.min(5, newK));
        
        // 3. 判定域状态 (Step 1)
        let newState: ExtensionState;
        if (newK >= 1) newState = ExtensionState.STABLE_POSITIVE;
        else if (newK >= 0) newState = ExtensionState.POSITIVE_EDGE;
        else if (newK >= -1) newState = ExtensionState.EXTENSION;
        else newState = ExtensionState.NEGATIVE;

        currentUserMap[kp] = {
          kValue: parseFloat(newK.toFixed(2)),
          state: newState,
          lastUpdated: Date.now()
        };
        
        console.log(`[Knowledge Update] User: ${userId}, KP: ${kp}, Delta: ${kInstance.toFixed(2)}, New K: ${newK.toFixed(2)}, State: ${newState}`);
      });
    },

    /**
     * 获取推荐策略 (核心算法 Step 3)
     */
    getRecommendation(): Recommendation | null {
      if (!this.lastLevelKey) return null;
      
      const currentKps = LevelKnowledgeMap[this.lastLevelKey];
      if (!currentKps) return null;

      const userStore = useUserStore();
      const userId = userStore.currentUser;
      const currentUserMap = this.userKnowledgeMap[userId] || {};

      // 检查当前关卡涉及的知识点状态
      // 优先处理最差的状态
      let worstKp = currentKps[0];
      let minK = 999;

      currentKps.forEach(kp => {
        const status = currentUserMap[kp];
        if (status && status.kValue < minK) {
          minK = status.kValue;
          worstKp = kp;
        }
      });

      const status = currentUserMap[worstKp];
      if (!status) return null;

      // 策略分支
      
      // 场景 B: 负域 (K < -1) -> 分解变换
      // 推荐前置知识点的关卡
      if (status.state === ExtensionState.NEGATIVE) {
        const depKp = KnowledgeDependency[worstKp];
        if (depKp) {
          const level = this.findLevelByKp(depKp);
          if (level) {
             return {
               type: 'DECOMPOSE',
               levelKey: level.key,
               reason: `检测到你对 [${worstKp}] 掌握不牢固，建议先复习基础知识点 [${depKp}]。`
             };
          }
        }
        // 如果没有前置依赖，或者找不到关卡，降级为 Review
      }

      // 场景 A: 可拓域 (-1 <= K < 0) -> 微调变换
      // 推荐同类知识点的其他关卡（或重试当前关卡）
      if (status.state === ExtensionState.EXTENSION) {
         // 寻找含有相同 KP 的其他关卡
         const similarLevel = this.findSimilarLevel(worstKp, this.lastLevelKey);
         if (similarLevel) {
           return {
             type: 'REVIEW',
             levelKey: similarLevel.key,
             reason: `你处于学习临界区，建议通过练习相似关卡 [${similarLevel.title}] 来巩固 [${worstKp}]。`
           };
         } else {
            return {
             type: 'REVIEW',
             levelKey: this.lastLevelKey,
             reason: `你处于学习临界区，建议再次挑战本关以巩固 [${worstKp}]。`
           };
         }
      }

      // 场景 C: 稳定正域 (K >= 1) -> 扩充变换
      // 推荐下一关 (默认逻辑)
      if (status.state === ExtensionState.STABLE_POSITIVE) {
         // 这里简单推荐下一关，实际可以推荐包含 复合KP 的难关
         return {
            type: 'NEXT',
            levelKey: 'NEXT', // 特殊标记，由 UI 处理
            reason: `你已经完全掌握了 [${worstKp}] (K=${status.kValue})，继续挑战下一关吧！`
         };
      }
      
      // 正域边缘 (0 <= K < 1) -> 正常推进
      return {
          type: 'NEXT',
          levelKey: 'NEXT',
          reason: `表现不错，继续加油！`
      };
    },

    // 辅助：根据 KP 找关卡
    findLevelByKp(kp: string) {
      const globalStore = useGlobalStore();
      // 简单遍历所有关卡找到第一个匹配的 (实际可以找没做过的)
      for (const level of globalStore.allLevels) {
        if (LevelKnowledgeMap[level.key]?.includes(kp as KnowledgePoint)) {
          return level;
        }
      }
      return null;
    },

    // 辅助：找相似关卡 (同 KP 但不同 Key)
    findSimilarLevel(kp: string, currentKey: string) {
       const globalStore = useGlobalStore();
       for (const level of globalStore.allLevels) {
        if (level.key !== currentKey && LevelKnowledgeMap[level.key]?.includes(kp as KnowledgePoint)) {
          return level;
        }
      }
      return null;
    }
  }
});
