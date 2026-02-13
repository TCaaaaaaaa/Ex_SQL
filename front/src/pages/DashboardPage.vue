<template>
  <div class="dashboard-page">
    <div class="header">
      <h1 class="title">我的学习数据看板</h1>
      <p class="subtitle">全面掌握你的 SQL 学习进度与知识体系</p>
    </div>

    <a-row :gutter="[24, 24]">
      <!-- 左侧：知识图谱 -->
      <a-col :xs="24" :lg="16">
        <a-card :bordered="false" class="chart-card card-shadow">
          <template #title>
             <span class="card-title">🕸️ SQL 知识结构网络 (动态图谱)</span>
          </template>
          <knowledge-graph-chart />
        </a-card>
      </a-col>

      <!-- 右侧：数据概览 -->
      <a-col :xs="24" :lg="8">
        <a-row :gutter="[0, 24]">
          <a-col :span="24">
             <!-- 学习成就卡片 -->
            <a-card :bordered="false" class="card-shadow achievement-card">
              <template #title>
                 <span class="card-title">🏆 学习成就</span>
              </template>
              
              <div class="progress-section">
                <div class="progress-label">
                  <span>知识点解锁进度</span>
                  <span class="progress-value">{{ unlockedCount }} / {{ totalCount }}</span>
                </div>
                <a-progress 
                  :percent="progressPercent" 
                  :stroke-color="{
                    '0%': '#108ee9',
                    '100%': '#87d068',
                  }"
                  :show-info="false"
                  stroke-width="12"
                />
              </div>
              
              <a-divider style="margin: 20px 0" />
              
              <div class="stats-grid">
                <div class="stat-item">
                  <div class="value green">{{ stableCount }}</div>
                  <div class="label">稳定正域</div>
                  <div class="sub-label">完全掌握</div>
                </div>
                <div class="stat-item">
                  <div class="value blue">{{ positiveEdgeCount }}</div>
                  <div class="label">正域边缘</div>
                  <div class="sub-label">表现良好</div>
                </div>
                <div class="stat-item">
                  <div class="value yellow">{{ extensionCount }}</div>
                  <div class="label">可拓域</div>
                  <div class="sub-label">临界状态</div>
                </div>
                <div class="stat-item">
                  <div class="value red">{{ negativeCount }}</div>
                  <div class="label">负域</div>
                  <div class="sub-label">急需复习</div>
                </div>
              </div>
            </a-card>
          </a-col>

          <a-col :span="24">
             <!-- 掌握趋势卡片 -->
            <a-card :bordered="false" class="chart-card card-shadow">
               <template #title>
                 <span class="card-title">📊 知识点掌握趋势</span>
              </template>
              <knowledge-chart />
            </a-card>
          </a-col>
          
        </a-row>
      </a-col>
    </a-row>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import KnowledgeGraphChart from '../components/KnowledgeGraphChart.vue';
import KnowledgeChart from '../components/KnowledgeChart.vue';
import { useKnowledgeStore, ExtensionState } from '../core/knowledgeStore';
import { KnowledgePoint } from '../core/knowledgeGraph';

const knowledgeStore = useKnowledgeStore();

const totalCount = Object.keys(KnowledgePoint).length;

const unlockedCount = computed(() => {
  return Object.keys(knowledgeStore.currentKnowledgeMap).length;
});

const progressPercent = computed(() => {
  return Math.round((unlockedCount.value / totalCount) * 100);
});

const stableCount = computed(() => {
  return Object.values(knowledgeStore.currentKnowledgeMap).filter(s => s.state === ExtensionState.STABLE_POSITIVE).length;
});

const positiveEdgeCount = computed(() => {
  return Object.values(knowledgeStore.currentKnowledgeMap).filter(s => s.state === ExtensionState.POSITIVE_EDGE).length;
});

const extensionCount = computed(() => {
  return Object.values(knowledgeStore.currentKnowledgeMap).filter(s => s.state === ExtensionState.EXTENSION).length;
});

const negativeCount = computed(() => {
  return Object.values(knowledgeStore.currentKnowledgeMap).filter(s => s.state === ExtensionState.NEGATIVE).length;
});

</script>

<style scoped>
.dashboard-page {
  padding: 24px;
  background: #f0f2f5;
  min-height: 100vh;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif;
}

.header {
  margin-bottom: 32px;
  text-align: center;
}

.title {
  font-size: 32px;
  color: #1f1f1f;
  margin-bottom: 8px;
  font-weight: 700;
  letter-spacing: 1px;
}

.subtitle {
  color: #8c8c8c;
  font-size: 16px;
  font-weight: 300;
}

.card-shadow {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  border-radius: 8px;
  transition: all 0.3s;
}

.card-shadow:hover {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.chart-card {
  height: 100%;
}

.achievement-card {
    background: linear-gradient(to bottom right, #ffffff, #f9f9f9);
}

.progress-section {
    padding: 0 8px;
}

.progress-label {
    display: flex;
    justify-content: space-between;
    margin-bottom: 8px;
    font-size: 14px;
    color: #666;
}

.progress-value {
    font-weight: bold;
    color: #1890ff;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  text-align: center;
}

.stat-item {
    padding: 12px;
    background: #fff;
    border-radius: 8px;
    border: 1px solid #f0f0f0;
}

.stat-item .value {
  font-size: 28px;
  font-weight: bold;
  line-height: 1.2;
  margin-bottom: 4px;
}

.stat-item .label {
  color: #333;
  font-size: 14px;
  font-weight: 500;
}

.stat-item .sub-label {
    color: #999;
    font-size: 12px;
    margin-top: 2px;
}

.green { color: #52c41a; }
.blue { color: #1890ff; }
.yellow { color: #faad14; }
.red { color: #ff4d4f; }
</style>