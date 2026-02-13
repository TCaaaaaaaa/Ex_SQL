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
              :llm-feedback="llmFeedback"
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
          <a-collapse-panel key="knowledge" header="📊 你的知识状态 (K值)">
            <knowledge-chart />
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
import { Modal, message } from "ant-design-vue";
import { useRouter } from "vue-router";
import KnowledgeChart from "../components/KnowledgeChart.vue";

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
const llmFeedback = ref<string>(""); // 新增 LLM 反馈
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
  llmFeedback.value = ""; // 重置反馈
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
    const diagnosisRes: any = await diagnoseSql(sql, level.value.answer);
    
    // 兼容后端返回结构: { results: [], llm_feedback: "" }
    if (diagnosisRes.results) {
        diagnosisResults.value = diagnosisRes.results;
        llmFeedback.value = diagnosisRes.llm_feedback;
    } else {
        // 旧接口兼容
        diagnosisResults.value = diagnosisRes;
    }
  } else {
    diagnosisResults.value = [];
  }

  // 3. 推荐策略触发 (无论是对是错，都检查一下 K 值状态)
  const rec = knowledgeStore.getRecommendation();
  
  // 场景 1: 负向反馈 (分解/复习) - 仅在做错时强弹窗
  if (resultStatus.value === RESULT_STATUS_ENUM.ERROR && rec && (rec.type === 'DECOMPOSE' || rec.type === 'REVIEW') && rec.levelKey !== level.value.key) {
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

  // 场景 2: 正向反馈 (挑战/下一关) - 仅在做对时弹窗
  if (resultStatus.value === RESULT_STATUS_ENUM.SUCCEED && rec && (rec.type === 'CHALLENGE' || rec.type === 'NEXT')) {
     // 延迟一点弹出，让用户先看到成功的烟花/提示
     setTimeout(() => {
         Modal.success({
            title: '🎉 恭喜过关！',
            content: rec.reason,
            okText: rec.type === 'CHALLENGE' ? '接受挑战' : '下一关',
            onOk() {
                if (rec.levelKey === 'NEXT') {
                    // 简单的下一关逻辑：当前 index + 1
                    const currentIndex = globalStore.allLevels.findIndex(l => l.key === level.value.key);
                    const nextLevel = globalStore.allLevels[currentIndex + 1];
                    if (nextLevel) {
                        router.push(`/learn/${nextLevel.key}`);
                    } else {
                        message.success("恭喜你通关了所有关卡！");
                    }
                } else {
                    router.push(`/learn/${rec.levelKey}`);
                }
            }
        });
     }, 1000);
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
