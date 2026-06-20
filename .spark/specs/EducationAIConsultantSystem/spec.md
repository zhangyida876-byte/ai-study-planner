# 技术方案

## 开发元信息

- 开发模式: 全栈应用
- 涉及层级: [数据库, 插件, 服务端, 前端]

## 页面路由与导航

### 页面路由

| 页面 | 路径 |
|------|------|
| 工作台首页 | `/` |
| 学情诊断 | `/diagnosis` |
| 升学规划 | `/plan` |
| 知识点查询 | `/knowledge` |

### 导航设计

- 导航机制：页面路由
- 导航项：
  - 工作台
  - 学情诊断
  - 升学规划
  - 知识点查询

## 业务组件

| 组件 | 来源 | 关联页面 | 对应功能点 |
|------|------|---------|-----------|
| Table | `@lark-apaas/client-toolkit/antd-table` | 升学规划页 | 展示分数线表格、分数拆解表格 |
| UserSelect | `@client/src/components/business-ui/user-select` | 所有页面 | 系统用户选择 |
| Streamdown | `@client/src/components/ui/streamdown` | 学情诊断页、升学规划页 | 渲染AI生成的Markdown格式报告 |
| WobblyCard | 自定义核心组件 | 所有页面 | 手绘风格卡片容器 |

## 数据模型

### 数据库设计

#### 学情诊断记录表（diagnosis_record）
用途：存储学生信息和生成的学情诊断报告，对应学情诊断模块。
核心字段：
- grade: varchar (年级)
- region: varchar (地区)
- scores: json (各科成绩，key为科目名，value为分数)
- problem_desc: text (学习困扰描述)
- report: text (生成的诊断报告内容)
- status: varchar ['pending', 'generating', 'completed', 'failed'] (生成状态)
关联关系：独立表，无外键关联。

#### 升学规划记录表（plan_record）
用途：存储学生成绩和生成的升学规划报告与时间路线图，对应升学规划模块。
核心字段：
- region: varchar (地区)
- scores: json (各科当前成绩)
- policy_data: json (地区政策与分数线数据快照)
- plan_report: text (生成的升学规划报告)
- timeline: json (时间路线图节点数据)
- status: varchar ['pending', 'generating', 'completed', 'failed'] (生成状态)
关联关系：独立表，无外键关联。

#### 知识点表（knowledge_point）
用途：存储各版本各学科知识点详情，对应知识点查询模块。
核心字段：
- version: varchar (教材版本)
- subject: varchar (学科)
- chapter: varchar (章节)
- name: varchar (知识点名称)
- content: json (知识点详情：核心知识点、解题方法、易错点)
关联关系：独立表，无外键关联。

#### 升学政策表（admission_policy）
用途：存储各地区中考政策、分数线数据，对应升学规划模块。
核心字段：
- region: varchar (地区)
- year: int (年份)
- total_score: int (中考总分)
- score_structure: json (各科分值构成)
- admission_lines: json (各批次学校录取分数线)
- policy_content: text (政策概要内容)
关联关系：独立表，无外键关联。

## 插件设计

| 插件名称 | 基础插件 | 用途 | 调用方式 | 关联页面 | 输入参数 | 输出类型 |
|---------|---------|------|---------|---------|---------|---------|
| 学情诊断报告生成 | ai-text-generate | 根据学生信息生成结构化学情诊断报告 | 前端 callStream | 学情诊断页 | {grade: string, region: string, scores: object, problemDesc: string} | stream\<string\> |
| 升学规划报告生成 | ai-text-generate | 根据学生成绩和地区政策生成升学规划报告 | 前端 callStream | 升学规划页 | {region: string, scores: object, policyData: object} | stream\<string\> |
| 时间路线图生成 | ai-text-generate | 根据学生年级生成中考关键节点时间路线图 | 前端 call | 升学规划页 | {grade: string, region: string} | {nodes: Array<{date: string, title: string, content: string}>} |
| 多维表格数据查询 | feishu-bitable | 查询本地多维表格中的政策、分数线、知识点数据 | 前端 call | 升学规划页、知识点查询页 | {appToken: string, tableId: string, filter: object} | {records: Array<object>} |
| 考情信息搜索 | ai-search-summary | 搜索互联网最新考情政策信息 | 前端 callStream | 升学规划页 | {query: string, region: string, year: string} | stream\<string\> |

## 业务模型

### API 设计

#### 工作台首页 相关

**页面路径**: /

**功能全景**：
| 功能 | 实现方式 | 说明 |
|------|----------|------|
| 展示系统公告 | API | GET /api/announcements |
| 获取当前用户信息 | 平台能力 | 内置用户系统 |

**所需 API**:
```typescript
// 获取系统公告列表 [领域模型: Announcement] [对应页面功能: 系统公告展示]
GET /api/announcements
Response: {
  items: Array<{
    title: string;
    content: string;
    createdAt: string;
  }>;
}
```

#### 学情诊断页 相关

**页面路径**: /diagnosis

**功能全景**：
| 功能 | 实现方式 | 说明 |
|------|----------|------|
| 提交学生信息生成诊断报告 | API | POST /api/diagnosis-records |
| 获取历史诊断记录 | API | GET /api/diagnosis-records |
| AI生成诊断报告 | 插件 | ai-text-generate |

**所需 API**:
```typescript
// 创建诊断记录 [领域模型: DiagnosisRecord] [对应页面功能: 提交学生信息]
POST /api/diagnosis-records
Request Body: {
  grade: string;
  region: string;
  scores: Record<string, number>;
  problemDesc: string;
}
Response: {
  id: string;
  status: string;
}

// 获取诊断记录列表 [领域模型: DiagnosisRecord] [对应页面功能: 历史记录查询]
GET /api/diagnosis-records?page=1&pageSize=20
Response: {
  items: Array<{
    id: string;
    grade: string;
    region: string;
    status: string;
    createdAt: string;
  }>;
  total: number;
}

// 获取单条诊断记录详情 [领域模型: DiagnosisRecord] [对应页面功能: 查看诊断报告]
GET /api/diagnosis-records/:id
Response: {
  id: string;
  grade: string;
  region: string;
  scores: Record<string, number>;
  problemDesc: string;
  report: string;
  status: string;
  createdAt: string;
}

// 更新诊断报告内容 [领域模型: DiagnosisRecord] [对应页面功能: 保存生成的报告]
PATCH /api/diagnosis-records/:id
Request Body: {
  report: string;
  status: string;
}
Response: {
  success: boolean;
}
```

#### 升学规划页 相关

**页面路径**: /plan

**功能全景**：
| 功能 | 实现方式 | 说明 |
|------|----------|------|
| 查询地区升学政策与分数线 | API | GET /api/admission-policies |
| 提交成绩生成升学规划 | API | POST /api/plan-records |
| AI生成规划报告 | 插件 | ai-text-generate |
| AI生成时间路线图 | 插件 | ai-text-generate |
| 查询多维表格政策数据 | 插件 | feishu-bitable |

**所需 API**:
```typescript
// 查询地区升学政策 [领域模型: AdmissionPolicy] [对应页面功能: 政策与分数线展示]
GET /api/admission-policies?region=xxx&year=2026
Response: {
  items: Array<{
    id: string;
    region: string;
    year: number;
    totalScore: number;
    scoreStructure: Record<string, number>;
    admissionLines: Array<{batch: string, school: string, score: number}>;
    policyContent: string;
  }>;
}

// 创建升学规划记录 [领域模型: PlanRecord] [对应页面功能: 提交成绩生成规划]
POST /api/plan-records
Request Body: {
  region: string;
  scores: Record<string, number>;
}
Response: {
  id: string;
  status: string;
}

// 获取规划记录详情 [领域模型: PlanRecord] [对应页面功能: 查看规划报告与路线图]
GET /api/plan-records/:id
Response: {
  id: string;
  region: string;
  scores: Record<string, number>;
  policyData: object;
  planReport: string;
  timeline: Array<{date: string, title: string, content: string}>;
  status: string;
  createdAt: string;
}

// 更新规划记录内容 [领域模型: PlanRecord] [对应页面功能: 保存生成的规划与路线图]
PATCH /api/plan-records/:id
Request Body: {
  planReport?: string;
  timeline?: Array<object>;
  status: string;
}
Response: {
  success: boolean;
}
```

#### 知识点查询页 相关

**页面路径**: /knowledge

**功能全景**：
| 功能 | 实现方式 | 说明 |
|------|----------|------|
| 按版本/学科/章节查询知识点 | API | GET /api/knowledge-points |
| 按关键词搜索知识点 | API | GET /api/knowledge-points/search |
| 查询多维表格知识点数据 | 插件 | feishu-bitable |

**所需 API**:
```typescript
// 查询知识点列表 [领域模型: KnowledgePoint] [对应页面功能: 按版本查询知识点]
GET /api/knowledge-points?version=xxx&subject=xxx&chapter=xxx&page=1&pageSize=20
Response: {
  items: Array<{
    id: string;
    version: string;
    subject: string;
    chapter: string;
    name: string;
  }>;
  total: number;
}

// 搜索知识点 [领域模型: KnowledgePoint] [对应页面功能: 按关键词反查知识点]
GET /api/knowledge-points/search?keyword=xxx&page=1&pageSize=20
Response: {
  items: Array<{
    id: string;
    version: string;
    subject: string;
    chapter: string;
    name: string;
  }>;
  total: number;
}

// 获取知识点详情 [领域模型: KnowledgePoint] [对应页面功能: 查看知识点详情]
GET /api/knowledge-points/:id
Response: {
  id: string;
  version: string;
  subject: string;
  chapter: string;
  name: string;
  content: {
    coreKnowledge: string;
    solutionMethods: string;
    commonMistakes: string;
  };
}