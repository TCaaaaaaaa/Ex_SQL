<template>
  <div id="indexPage">
    <a-row :gutter="[16, 16]">
      <a-col :lg="11" :xs="24">
        <question-board :level="level" :result-status="resultStatus" />
      </a-col>
      <a-col :lg="13" :xs="24">
        <sql-editor
          :level="level"
          :editor-style="{ height: '280px' }"
          :result-status="resultStatus"
          :on-submit="onSubmit"
        />
        <a-collapse v-model:active-key="activeKeys" style="margin-top: 16px">
          <a-collapse-panel
            key="result"
            header="查看执行结果"
            class="result-collapse-panel"
          >
            <sql-result
              :level="level"
              :result="result"
              :result-status="resultStatus"
              :answer-result="answerResult"
              :error-msg="errorMsgRef"
              :diagnosis-results="diagnosisResults"
              style="margin-top: 16px"
            />
          </a-collapse-panel>
          <a-collapse-panel v-if="level.hint" key="hint" header="查看提示">
            <p>{{ level.hint }}</p>
          </a-collapse-panel>
          <a-collapse-panel key="ddl" header="查看建表语句">
            <code-editor
              :init-value="level.initSQL"
              :editor-style="{ minHeight: '400px' }"
              read-only
            />
          </a-collapse-panel>
          <a-collapse-panel key="answer" header="查看答案">
            <code-editor
              :init-value="level.answer"
              :editor-style="{ minHeight: '400px' }"
              read-only
            />
          </a-collapse-panel>
        </a-collapse>
      </a-col>
    </a-row>
  </div>
</template>

<script setup lang="ts">
import hljs from 'highlight.js';
import { format } from "sql-formatter";
import SqlEditor from "../components/SqlEditor.vue";
import QuestionBoard from "../components/QuestionBoard.vue";
import SqlResult from "../components/SqlResult.vue";
import { computed, ref, watch } from "vue";
import { QueryExecResult } from "sql.js";
import { getLevelByKey } from "../levels";
import { checkResult, RESULT_STATUS_ENUM } from "../core/result";
import CodeEditor from "../components/CodeEditor.vue";
import { diagnoseSql, DiagnosisResult } from "../core/sqlDiagnosis";
import { useKnowledgeStore } from "../core/knowledgeStore";
import { useGlobalStore } from "../core/globalStore";
import { Modal } from "ant-design-vue";
import { useRouter } from "vue-router";

interface IndexPageProps {
  levelKey?: string;
}

const props = defineProps<IndexPageProps>();
const router = useRouter();
const knowledgeStore = useKnowledgeStore();
const globalStore = useGlobalStore();

const level = computed(() => {
  if (props.levelKey) {
    return getLevelByKey(globalStore.allLevels, props.levelKey);
  }
  return globalStore.allLevels[0] || {};
});

const result = ref<QueryExecResult[]>([]);
const answerResult = ref<QueryExecResult[]>([]);
const errorMsgRef = ref<string>();
const resultStatus = ref<number>(-1);
const diagnosisResults = ref<DiagnosisResult[]>([]);
const defaultActiveKeys = ["result"];
const activeKeys = ref([...defaultActiveKeys]);
const startTime = ref(Date.now()); // 记录开始时间

/**
 * 切换关卡时，重置状态
 */
watch([level], () => {
  activeKeys.value = [...defaultActiveKeys];
  result.value = [];
  answerResult.value = [];
  errorMsgRef.value = "";
  resultStatus.value = -1;
  diagnosisResults.value = [];
  startTime.value = Date.now(); // 重置计时
});

/**
 * 执行结果
 * @param sql
 * @param res
 * @param answerRes
 * @param errorMsg
 */
const onSubmit = async (
  sql: string,
  res: QueryExecResult[],
  answerRes: QueryExecResult[],
  errorMsg?: string
) => {
  result.value = res;
  answerResult.value = answerRes;
  errorMsgRef.value = errorMsg;
  resultStatus.value = checkResult(res, answerRes);

  // --- Step 2: 个性化路径推荐核心逻辑 ---
  
  // 1. 计算耗时
  const timeUsed = (Date.now() - startTime.value) / 1000;
  const isCorrect = resultStatus.value === RESULT_STATUS_ENUM.SUCCEED;
  
  // 2. 更新知识点状态 (计算 K 值)
  knowledgeStore.updateState(level.value.key, isCorrect, timeUsed);
  
  // 智能诊断：当结果错误且没有语法错误时触发
  if (resultStatus.value === RESULT_STATUS_ENUM.ERROR && !errorMsg) {
    diagnosisResults.value = await diagnoseSql(sql, level.value.answer);
    
    // 3. 错误时的推荐策略 (如果 K 值过低，触发推荐)
    const rec = knowledgeStore.getRecommendation();
    // 只有当建议是“分解”或“微调”时才打断用户
    if (rec && (rec.type === 'DECOMPOSE' || rec.type === 'REVIEW') && rec.levelKey !== level.value.key) {
       Modal.confirm({
          title: '💡 学习路径推荐',
          content: rec.reason,
          okText: '接受建议',
          cancelText: '我再试试',
          onOk() {
              router.push(`/learn/${rec.levelKey}`);
          }
      });
    }

  } else {
    diagnosisResults.value = [];
  }
};

const highlightCode = (code: string) => {
  return hljs.highlightAuto(code).value;
};

</script>

<style>
.result-collapse-panel .ant-collapse-content-box {
  padding: 0 !important;
}
</style>
