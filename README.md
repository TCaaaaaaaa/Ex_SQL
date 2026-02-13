# ExtenicSQL - 基于可拓学的 SQL 智能辅导系统

ExtenicSQL 是一个融合了 **可拓学（Extenics）** 理论与 **大语言模型（LLM）** 的智能化 SQL 教学平台。不同于传统的 SQL 练习网站，本项目不仅仅是“判对错”，更致力于通过**智能诊断**、**知识点追踪**和**个性化推荐**，帮助学习者真正掌握 SQL 技能。

## 🌟 核心特性

### 1. 🧠 可拓学智能诊断
基于可拓学理论建立 SQL 物元模型，通过计算用户代码与标准答案的“不相容度”，精准定位逻辑错误（如投影缺失、条件冗余、连接类型错误等），并给出具体的修改建议（增、删、扩、缩、置换变换）。

### 2. 🤖 LLM 自然语言反馈
集成了大语言模型（如 GPT-3.5/4），将枯燥的算法诊断结果转化为**像真人助教一样**的自然语言反馈，提供鼓励式教学和启发式引导。

### 3. 📊 知识状态追踪 (K-Value)
独创的 **关联度函数 K(x)** 评价体系：
- **正域 (K ≥ 1)**：完全掌握，推荐挑战高难度关卡（扩充变换）。
- **可拓域 (-1 ≤ K < 0)**：临界状态，推荐变式练习（微调变换）。
- **负域 (K < -1)**：未掌握，推荐基础知识回顾（分解变换）。

实时可视化的 **K值演化曲线**，让学习进步看得见。

### 4. ⚔️ 闯关式学习
内置 30+ 精心设计的关卡，覆盖从 `SELECT` 基础到复杂的 `JOIN`、子查询、窗口函数等核心知识点。

---

## 🛠️ 技术栈

### 前端 (Frontend)
- **框架**: Vue 3 + TypeScript + Vite
- **UI 库**: Ant Design Vue
- **可视化**: ECharts (用于绘制知识状态曲线)
- **状态管理**: Pinia (持久化存储)
- **编辑器**: Monaco Editor

### 后端 (Backend)
- **框架**: FastAPI (Python 3.8+)
- **数据库**: SQLite (轻量级，无需配置) + SQLAlchemy (异步)
- **算法核心**: 
    - `sqlglot` (SQL 解析与 AST 处理)
    - 自研可拓变换引擎 (Matter-Element Modeling)
- **AI 集成**: OpenAI SDK (支持任意兼容接口)

---

## 🚀 快速启动

### 方式一：一键启动 (推荐 Windows 用户)

项目根目录下提供了便捷的批处理脚本：

1. **启动服务**: 双击 `start.bat`
   - 自动开启两个窗口，分别运行前端 (Port 5173) 和后端 (Port 8000)。
   - 浏览器访问: `http://localhost:5173`

2. **停止服务**: 双击 `end.bat`
   - 自动查找并关闭相关端口进程。

### 方式二：手动启动

#### 1. 后端环境准备
```bash
cd back
# 建议创建虚拟环境
python -m venv venv
# Windows 激活: venv\Scripts\activate
# Linux/Mac 激活: source venv/bin/activate

# 安装依赖
pip install -r requirements.txt

# (可选) 配置 LLM API Key
# 复制 .env.example 为 .env 并填入你的 Key
# cp .env.example .env

# 启动服务
uvicorn app.main:app --reload
```

#### 2. 前端环境准备
```bash
cd front
# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

---

## 📂 目录结构

```
ExtenicSQL/
├── back/                   # 后端代码 (FastAPI)
│   ├── app/
│   │   ├── api/            # 接口层 (Levels, SQL, Users)
│   │   ├── core/           # 核心逻辑
│   │   │   ├── diagnosis.py    # 可拓学诊断算法
│   │   │   ├── executor.py     # SQL 执行器
│   │   │   ├── llm.py          # LLM 服务集成
│   │   │   └── ...
│   │   └── data/           # 关卡数据 & 数据库文件
│   └── requirements.txt
├── front/                  # 前端代码 (Vue3)
│   ├── src/
│   │   ├── components/     # UI 组件 (SqlResult, KnowledgeChart...)
│   │   ├── core/           # 前端核心逻辑 (KnowledgeStore, Graph...)
│   │   ├── levels/         # 关卡资源 (Markdown, SQL)
│   │   └── pages/          # 页面视图
│   └── package.json
├── start.bat               # 一键启动脚本
└── end.bat                 # 一键停止脚本
```

---

## ⚙️ 配置说明 (LLM)

如果需要启用真实的 AI 反馈功能，请在 `back` 目录下创建 `.env` 文件：

```ini
LLM_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
LLM_BASE_URL=https://api.openai.com/v1  # 或其他中转地址
LLM_MODEL=gpt-3.5-turbo
```

> 如果未配置，系统将自动降级使用内置的 Mock 模式，生成模拟的鼓励性反馈，不影响核心流程体验。

---

## 📄 许可证

MIT License. 欢迎用于学术研究与教育目的。
