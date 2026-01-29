# 架构升级：神经符号融合的智能反馈生成系统

## 1. 设计理念
本系统采用 **"可拓逻辑为脑，大模型为口" (Symbolic Brain, Generative Mouth)** 的架构设计。
*   **可拓模块**：负责确定性推理，保证诊断的逻辑正确性，避免“幻觉”。
*   **LLM 模块**：负责自然语言生成（NLG），提供富有人性化、教学性的交互体验。

## 2. 交互流程设计

### Step 1: 确定性诊断 (Deterministic Diagnosis)
*   **输入**：用户 SQL AST, 标准 SQL AST。
*   **处理**：执行可拓变换算法。
*   **输出**：结构化诊断日志 (Structured Diagnostic Log)。
    ```json
    {
      "status": "LOGIC_PARTIALLY_CORRECT",
      "diffs": [
        {"type": "MISSING_FILTER", "field": "gender", "value": "F"},
        {"type": "PERFORMANCE_RISK", "detail": "SELECT * used"}
      ],
      "recommended_transform": "ADD_CONDITION",
      "conduction_effect": "Full table scan risk"
    }
    ```

### Step 2: 提示工程构建 (Prompt Engineering)
将结构化日志填入预设 Prompt 模板：

> **Role**: 你是一位耐心的数据库导师。
> **Context**: 学生的代码逻辑有误，系统诊断结果如下：{{diagnostic_log}}。
> **Task**: 
> 1. 用鼓励的语气指出错误（不要直接给代码）。
> 2. 解释为什么缺少 'gender' 条件是错误的（基于业务逻辑）。
> 3. 解释为什么使用 '*' 会带来性能风险（基于传导效应）。
> 4. 引导学生思考如何进行“增变换”。

### Step 3: 自然语言生成
LLM 根据 Prompt 生成最终反馈给用户的文本。

## 3. 优势分析（用于论文论证）
这种架构解决了两个核心问题：
1.  **准确性问题**：纯 LLM 容易看不准复杂的 SQL 逻辑错误，可拓学算法保证了诊断的精准度。
2.  **僵硬性问题**：纯模板式反馈（Template-based）缺乏温度，LLM 提供了拟人化的教学体验。