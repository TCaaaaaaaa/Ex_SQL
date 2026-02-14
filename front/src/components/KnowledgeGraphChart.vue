<template>
  <div class="knowledge-graph-container">
    <div v-if="!hasData" class="empty-state">
      <a-empty description="暂无知识图谱数据，快去挑战关卡解锁知识点吧！" />
    </div>
    <v-chart v-else class="chart" :option="option" autoresize />
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { use } from "echarts/core";
import { CanvasRenderer } from "echarts/renderers";
import { GraphChart } from "echarts/charts";
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent
} from "echarts/components";
import VChart from "vue-echarts";
import { useKnowledgeStore, ExtensionState } from "../core/knowledgeStore";
import { KnowledgePoint, KnowledgeDependency, getKnowledgeLabel } from "../core/knowledgeGraph";

// Register ECharts components
use([
  CanvasRenderer,
  GraphChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent
]);

const knowledgeStore = useKnowledgeStore();

const hasData = computed(() => {
  return true;
});

const option = computed(() => {
  const map = knowledgeStore.currentKnowledgeMap;
  
  // 1. Prepare Nodes with enhanced styling
  const nodes = Object.values(KnowledgePoint).map(kp => {
    const status = map[kp];
    // Modern color palette
    let color = '#f0f0f0'; // Default grey (Locked)
    let borderColor = '#d9d9d9';
    let size = 40;
    let kValueDisplay = '未解锁';
    let labelColor = '#666';
    let category = 4; // Default category index

    if (status) {
      kValueDisplay = `K=${status.kValue}`;
      if (status.state === ExtensionState.STABLE_POSITIVE) {
        color = '#f6ffed'; // Light Green bg
        borderColor = '#52c41a'; // Green border
        labelColor = '#389e0d';
        size = 60;
        category = 0;
      } else if (status.state === ExtensionState.POSITIVE_EDGE) {
        color = '#e6f7ff'; // Light Blue bg
        borderColor = '#1890ff'; // Blue border
        labelColor = '#096dd9';
        size = 50;
        category = 1;
      } else if (status.state === ExtensionState.EXTENSION) {
        color = '#fffbe6'; // Light Yellow bg
        borderColor = '#faad14'; // Yellow border
        labelColor = '#d48806';
        size = 50;
        category = 2;
      } else if (status.state === ExtensionState.NEGATIVE) {
        color = '#fff1f0'; // Light Red bg
        borderColor = '#ff4d4f'; // Red border
        labelColor = '#cf1322';
        size = 45;
        category = 3;
      }
    }

    return {
      id: kp,
      name: getKnowledgeLabel(kp).split(' ')[0],
      fullName: getKnowledgeLabel(kp),
      value: status?.kValue || 0,
      kValueDisplay,
      category,
      symbolSize: size,
      itemStyle: { 
        color,
        borderColor,
        borderWidth: 2,
        shadowBlur: 5,
        shadowColor: 'rgba(0, 0, 0, 0.1)'
      },
      label: { 
        show: true,
        color: labelColor,
        fontWeight: 'bold',
        fontSize: 12
      },
      // Fixed position for root nodes to improve layout stability
      // fixed: kp === KnowledgePoint.BASIC_SELECT
    };
  });

  // 2. Prepare Edges with arrow and style
  const links = Object.entries(KnowledgeDependency).map(([target, source]) => {
    return {
      source: source,
      target: target,
      symbol: ['none', 'arrow'], // Add arrow
      symbolSize: [0, 8],
      lineStyle: {
        curveness: 0.2,
        color: '#bfbfbf',
        width: 1.5
      }
    };
  });

  // 3. Categories
  const categories = [
    { name: '稳定正域 (完全掌握)', itemStyle: { color: '#52c41a' } },
    { name: '正域边缘 (良好)', itemStyle: { color: '#1890ff' } },
    { name: '可拓域 (临界)', itemStyle: { color: '#faad14' } },
    { name: '负域 (需复习)', itemStyle: { color: '#ff4d4f' } },
    { name: '未解锁', itemStyle: { color: '#d9d9d9' } }
  ];

  return {
    backgroundColor: '#fafafa', // Subtle background
    title: {
      text: 'SQL 知识图谱网络',
      subtext: '节点大小与颜色代表掌握度 (K值)',
      top: 20,
      left: 20,
      textStyle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333'
      },
      subtextStyle: {
        color: '#888'
      }
    },
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#eee',
      borderWidth: 1,
      textStyle: { color: '#333' },
      formatter: (params: any) => {
        if (params.dataType === 'node') {
            const data = params.data;
            return `
                <div style="margin-bottom: 4px; font-weight: bold; border-bottom: 1px solid #eee; padding-bottom: 4px;">
                  ${data.fullName}
                </div>
                <div>状态: <span style="color:${data.itemStyle.borderColor}">${categories[data.category].name.split(' ')[0]}</span></div>
                <div>K值: <b>${data.value}</b></div>
                <div style="margin-top:4px;padding-top:4px;border-top:1px dashed #eee;">
                  <span style="font-size:12px;color:#888">K>1:完全掌握; K<0:需复习</span>
                </div>
            `;
        }
        return `${params.data.source} -> ${params.data.target}`;
      }
    },
    legend: {
      data: categories.map(c => c.name),
      bottom: 20,
      right: 20,
      orient: 'vertical',
      backgroundColor: 'rgba(255,255,255,0.8)',
      borderRadius: 4,
      padding: 10,
      shadowBlur: 5,
      shadowColor: 'rgba(0,0,0,0.05)'
    },
    series: [
      {
        type: 'graph',
        layout: 'force',
        data: nodes,
        links: links,
        categories: categories,
        roam: true,
        draggable: true, // Allow user to drag nodes
        label: {
          position: 'bottom',
          formatter: '{b}'
        },
        force: {
          repulsion: 400, // Increase repulsion for less clutter
          gravity: 0.05,
          edgeLength: 120, // Longer edges
          layoutAnimation: true
        },
        lineStyle: {
          opacity: 0.6
        },
        emphasis: {
          focus: 'adjacency',
          scale: true,
          lineStyle: {
            width: 3,
            opacity: 1
          }
        }
      }
    ]
  };
});
</script>

<style scoped>
.knowledge-graph-container {
  height: 600px;
  width: 100%;
  border-radius: 12px; /* Softer corners */
  overflow: hidden;
  /* Removed shadow here as card has it, added internal border */
  border: 1px solid #f0f0f0; 
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
  background: #fafafa;
}
</style>