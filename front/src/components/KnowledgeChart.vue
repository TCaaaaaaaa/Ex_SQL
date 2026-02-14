<template>
  <div class="knowledge-chart">
    <div v-if="!hasData" class="empty-state">
      <a-empty description="暂无学习数据，快去挑战关卡吧！" />
    </div>
    <v-chart v-else class="chart" :option="option" autoresize />
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { use } from "echarts/core";
import { CanvasRenderer } from "echarts/renderers";
import { LineChart } from "echarts/charts";
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  DataZoomComponent
} from "echarts/components";
import VChart from "vue-echarts";
import { useKnowledgeStore } from "../core/knowledgeStore";
import { getKnowledgeLabel } from "../core/knowledgeGraph";

// 注册 ECharts 组件
use([
  CanvasRenderer,
  LineChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  DataZoomComponent
]);

const knowledgeStore = useKnowledgeStore();

// 检查是否有数据
const hasData = computed(() => {
  const map = knowledgeStore.currentKnowledgeMap;
  return Object.keys(map).some(key => map[key].history && map[key].history.length > 0);
});

// 生成图表配置
const option = computed(() => {
  const map = knowledgeStore.currentKnowledgeMap;
  const series = [];
  const legendData = [];
  
  // 找出所有知识点中时间跨度最大的，作为 X 轴基准
  // 为了简化展示，我们这里以“次数”作为 X 轴，而不是绝对时间
  // 这样可以将不同时间学习的知识点对齐展示
  
  for (const [kp, status] of Object.entries(map)) {
    if (!status.history || status.history.length === 0) continue;
    
    const label = getKnowledgeLabel(kp);
    legendData.push(label);
    series.push({
      name: label,
      type: 'line',
      data: status.history.map((h, index) => [index + 1, h.value]),
      smooth: true,
      markLine: {
        data: [
          { yAxis: 1, name: '正域阈值', lineStyle: { color: '#52c41a' } },
          { yAxis: 0, name: '可拓域阈值', lineStyle: { color: '#faad14' } },
          { yAxis: -1, name: '负域阈值', lineStyle: { color: '#ff4d4f' } }
        ]
      }
    });
  }

  return {
    title: {
      text: '知识掌握度变化趋势 (K值)',
      left: 'center'
    },
    tooltip: {
      trigger: 'axis',
      formatter: (params: any[]) => {
        let result = `<div style="margin-bottom: 4px; font-weight: bold; border-bottom: 1px solid #eee; padding-bottom: 4px;">练习次数: ${params[0].axisValue}</div>`;
        
        params.forEach(item => {
          const kValue = item.value[1];
          let status = '';
          let color = item.color;
          
          if (kValue >= 1) {
            status = '完全掌握 (稳定正域)';
          } else if (kValue >= 0) {
            status = '基本掌握 (正域边缘)';
          } else if (kValue >= -1) {
            status = '临界状态 (可拓域)';
          } else {
            status = '需加强 (负域)';
          }
          
          result += `
            <div style="margin-top: 6px;">
              <span style="display:inline-block;margin-right:4px;border-radius:10px;width:10px;height:10px;background-color:${color};"></span>
              <span style="font-weight:bold;">${item.seriesName}</span>
            </div>
            <div style="padding-left: 14px; font-size: 12px; color: #666;">
              掌握度(K): <b>${kValue}</b>
            </div>
            <div style="padding-left: 14px; font-size: 12px; color: #888;">
              [${status}]
            </div>
          `;
        });
        
        return result;
      }
    },
    legend: {
      data: legendData,
      bottom: 0,
      type: 'scroll'
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '10%',
      containLabel: true
    },
    xAxis: {
      type: 'value',
      name: '练习次数',
      minInterval: 1
    },
    yAxis: {
      type: 'value',
      name: '掌握度 (K值)',
      min: -5,
      max: 5
    },
    series: series
  };
});
</script>

<style scoped>
.knowledge-chart {
  height: 400px;
  width: 100%;
  background: white;
  padding: 16px;
  border-radius: 8px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.chart {
  height: 100%;
  width: 100%;
}

.empty-state {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>