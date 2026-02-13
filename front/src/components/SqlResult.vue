<template>
  <a-card
    id="sqlResult"
    title="执行结果"
    :extra="RESULT_STATUS_INFO_MAP[resultStatus]"
    :bordered="false"
    style="max-height: 420px; overflow-y: auto"
  >
    <div v-if="diagnosisResults && diagnosisResults.length > 0" style="margin-bottom: 16px">
      <!-- LLM 反馈 -->
      <a-alert
        v-if="llmFeedback"
        message="🤖 AI 助教建议"
        :description="llmFeedback"
        type="info"
        show-icon
        style="margin-bottom: 16px; border: 1px solid #91caff; background-color: #e6f7ff;"
      />
      
      <!-- 规则诊断列表 -->
      <a-alert
        v-for="(item, index) in diagnosisResults"
        :key="index"
        :message="item.message"
        :description="item.suggestion"
        type="warning"
        show-icon
        style="margin-bottom: 8px"
      />
    </div>
    <sql-result-table v-if="!errorMsg" :result="result" />
    <div v-else>❌ 语句错误：{{ errorMsg }}</div>
  </a-card>
</template>

<script setup lang="ts">
import { toRefs } from "vue";
import { QueryExecResult } from "sql.js";
import SqlResultTable from "./SqlResultTable.vue";
import { RESULT_STATUS_INFO_MAP } from "../core/result";
import { DiagnosisResult } from "../core/sqlDiagnosis";

interface Props {
  result: QueryExecResult[];
  answerResult?: QueryExecResult[];
  resultStatus?: number;
  errorMsg?: string;
  // eslint-disable-next-line vue/require-default-prop
  level?: LevelType;
  diagnosisResults?: DiagnosisResult[];
  llmFeedback?: string; // 新增字段
}

const props = withDefaults(defineProps<Props>(), {
  result: () => [],
  answerResult: () => [],
  errorMsg: () => "",
  resultStatus: -1,
  diagnosisResults: () => [],
  llmFeedback: "",
});

// e.g. [{"columns":["a","b"],"values":[[0,"hello"],[1,"world"]]}]
const { result } = toRefs(props);
</script>

<style></style>
