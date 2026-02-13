import os
import openai
from dotenv import load_dotenv

# 加载环境变量
load_dotenv()

class LLMService:
    def __init__(self):
        self.api_key = os.getenv("LLM_API_KEY")
        self.base_url = os.getenv("LLM_BASE_URL", "https://api.openai.com/v1")
        self.model = os.getenv("LLM_MODEL", "gpt-3.5-turbo")
        
        if self.api_key:
            self.client = openai.OpenAI(
                api_key=self.api_key,
                base_url=self.base_url
            )
        else:
            self.client = None

    def generate_feedback(self, user_sql: str, answer_sql: str, diagnosis_results: list) -> str:
        """
        根据诊断结果生成自然语言反馈
        """
        # Mock mode: 如果没有 API Key，返回模拟数据
        if not self.client:
            return self._mock_feedback(diagnosis_results)

        # 构建 Prompt
        diagnosis_str = "\n".join([f"- {d['message']} (建议: {d['suggestion']})" for d in diagnosis_results])
        
        prompt = f"""
你是一位耐心的SQL教学助教。请根据以下信息，为学生提供一段友好的、启发式的反馈。

【学生代码】
{user_sql}

【标准答案】
{answer_sql}

【系统检测到的问题】
{diagnosis_str}

【要求】
1. 语气亲切，以鼓励为主。
2. 解释错误的原因，但不要直接给出正确代码。
3. 结合“系统检测到的问题”，用通俗易懂的语言进行解释。
4. 字数控制在100字以内。
"""
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "你是一位专业的SQL编程导师。"},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=200
            )
            return response.choices[0].message.content.strip()
        except Exception as e:
            print(f"LLM调用失败: {e}")
            return self._mock_feedback(diagnosis_results)

    def _mock_feedback(self, diagnosis_results: list) -> str:
        """
        模拟反馈（当没有配置 LLM 时使用）
        """
        if not diagnosis_results:
            return "看起来你的代码没有明显的逻辑错误，但结果不正确。请仔细检查题目要求。"
        
        msgs = [d['message'] for d in diagnosis_results]
        return f"🤖 [AI助教] 发现 {len(msgs)} 个问题：主要涉及 {', '.join(msgs)}。试着调整一下思路？"

# 单例实例
llm_service = LLMService()
