# UI 设计指南

> **设计类型**: App 设计（应用架构设计）
> **确认检查**: 本指南适用于可交互的应用/网站/工具。

> ℹ️ Section 1 为设计意图与决策上下文。Code agent 实现时以 Section 2 及之后的具体参数为准。

## 1. Design Archetype (设计原型)

### 1.1 内容理解

- **目标用户**: K12 课程顾问，高频使用系统为学生生成专业诊断与规划报告，需兼顾效率与咨询时的亲和力展示
- **核心目的**: 引导行动（快速进入三大功能模块）+ 建立信任（AI 产出的专业报告需具备可读性与权威感）
- **情绪基调**: 亲和、创意、手工感 / 避免冰冷机械感、过度严肃、廉价素材感

### 1.2 设计方向

- **Design Style**: Handwritten Sketch 手绘草稿风 — 用户附件已明确定义该风格 DNA，米黄纸张底 + 墨黑粗边框 + 有机不规则圆角 + 手写字体，完美契合教育咨询的亲和与专业双重需求
- **Application Type**: Admin/SaaS 工作台 — 左侧 Sidebar 导航 + 右侧主内容区的工作面板形态
- **Aesthetic Direction**: 手绘白板笔记 × 便利贴质感 × 有机不规则形态，模拟真实纸笔书写与粘贴的物理触感

## 2. Color System (色彩系统)

**色彩关系**: 暖白纸张底 + 深墨黑主调 + 标记笔红蓝点缀 + 便利贴黄高亮
**配色设计理由**: 手绘草稿风需还原真实纸笔质感，低饱和暖底减少屏幕疲劳，高对比墨黑确保数据可读性
**主色推导**: 墨黑(#2d2d2d)作为 primary 承载所有文字与边框，标记笔红(#ff4d4d)作为关键行动与危害警示的唯一强调色
**使用比例**: 70% 纸张底+白卡 / 20% 墨黑文字边框 / 5% 标记笔红强调 / 5% 钢笔蓝+便利贴黄辅助

### 2.1 主题颜色

| Token                | HSL 值                  | 说明                                     |
| -------------------- | ----------------------- | ---------------------------------------- |
| `background`         | hsl(40 60% 98%)         | 米黄纸张底色，叠加圆点网格纹理           |
| `card`               | hsl(0 0% 100%)          | 白色手绘卡片底                           |
| `foreground`         | hsl(0 0% 18%)           | 墨黑墨水，主要文字与边框                 |
| `muted-foreground`   | hsl(0 0% 18% / 0.6)     | 次要文字、描述文本                       |
| `primary`            | hsl(0 0% 18%)           | 墨黑，按钮填充、激活态、边框             |
| `primary-foreground` | hsl(0 0% 100%)          | 主交互文字/图标                          |
| `accent`             | hsl(40 60% 93%)         | 次级交互反馈（hover/focus/骨架屏背景）   |
| `accent-foreground`  | hsl(0 0% 18%)           | accent 上的文字/图标                     |
| `border`             | hsl(0 0% 18%)           | 墨黑粗边框，全局统一 3px                 |
| `postit-yellow`      | hsl(54 100% 88%)        | 便利贴黄，高亮卡片/Tooltip/KPI 数值底色  |
| `marker-red`         | hsl(0 100% 65%)         | 标记笔红，强调数值、危害标注、图钉       |
| `pen-blue`           | hsl(216 56% 40%)        | 钢笔蓝，链接、标签、辅助强调             |
| `muted`              | hsl(30 16% 87%)         | 次级背景、网格点、虚线分隔               |

### 2.2 导航区配色

- **基调关系**: 复用主配色系统，Sidebar 背景取 `background` 同色系或纯白，与主内容区通过右侧 3px 墨黑边框分隔
- **关键状态**: 激活项用 `marker-red` 左侧竖条 + 文字加粗；Hover 用 `accent` 背景微偏移；文字对比度 ≥ 4.5:1
- **边界与背景**: 非透明背景；右侧 `border-r-[3px] border-ink` 实线分隔

### 2.3 语义颜色

| 用途          | Token            | HSL 值              | 衍生逻辑                       |
| ------------- | ---------------- | ------------------- | ------------------------------ |
| 成功/正向     | `success`        | hsl(142 71% 45%)    | 绿色系，用于完成状态图标       |
| 高亮文本底    | `highlight-bg`   | hsl(48 96% 88%)     | yellow-100，行内关键词底色标记 |
| 黑板反色区块  | `chalkboard`     | hsl(0 0% 18%)       | 墨黑底 + 粉笔白文字            |
| 警告/连锁影响 | `danger-border`  | hsl(0 100% 65%)     | marker-red 边框强调            |

## 3. Typography (字体排版)

- **Heading**: Kalam, cursive + 回退栈 `'Segoe Print', 'Comic Sans MS', cursive`
- **Body**: Patrick Hand, cursive + 回退栈 `'Segoe Print', 'Comic Sans MS', cursive`
- **字体策略**: 标题用 Kalam Bold（font-marker），正文用 Patrick Hand Regular（font-hand）；禁止混入无衬线体；中文回退至系统手写体

## 4. Layout Strategy (布局策略)

- **导航意图**: 应用概要设计已声明全局左侧 Sidebar 导航（工作台/学情诊断/升学规划/知识点查询），原样保留；至多一套；非透明背景；右侧 3px 墨黑边框分隔
- **页面架构**: 左侧 Sidebar + 右侧主内容区；主内容区 `max-w-6xl`（1152px）居中；左右分栏页（学情诊断/升学规划/知识点查询）在容器内 flex/grid 自适应
- **响应式**: ≥1024px 双栏并列；<1024px Sidebar 折叠为顶部汉堡菜单，内容区单栏堆叠

## 5. Visual Language (视觉语言)

- **形态参数**: 圆角 `有机不规则 wobbly border-radius（4组预设轮换）` · 阴影 `hard shadow: 4px 4px 0px 0px #2d2d2d` · 间距基调 `spacious`
- **识别签名**: ① 卡片微旋转 ±0.5~2deg（index 奇偶交替）② 3px 墨黑粗边框 + 零模糊硬阴影 ③ 物理装饰元素（胶带/图钉/别针）每 Section ≤2 处
- **装饰策略**: 透明胶带条（Header/痛点卡片）、红色图钉（KPI）、别针图标（便签角落）；圆点网格纹理铺满 background
- **动效原则**: 卡片上浮 -translate-y-1 + 阴影加深，300ms ease；列表右移 translate-x-1 + 边框变红；标签旋转 -rotate-2
- **可及性**: 墨黑文字 on 纸张底对比度 >12:1；marker-red 仅用于大字号/边框/图标，不用于正文；复杂背景（黑板区块）用粉笔白文字 + 遮罩

## 6. Component Principles (组件原则)

- **状态完整性**: WobblyCard 覆盖 Default/Hover(-translate-y-1 + shadow-hard-xl)/Focus(ring-2 ring-marker-red)/Disabled(opacity-50 grayscale)；表单 Focus 用 pen-blue 边框 + hard shadow-sm
- **层级清晰**: Primary 按钮 = bg-ink text-white + hard shadow；Secondary = bg-postit-yellow text-ink + border-2 border-ink；Ghost = hover:bg-accent
- **一致性**: 所有卡片使用 4 组 wobbly 圆角轮换；边框统一 3px ink；虚线分隔统一 2px dashed ink/20；颜色只用 Color System 语义角色

## 7. Image Direction (图片与视觉资产)

- **Image Role**: 引导插画（学情诊断未生成状态空态）+ 功能入口卡片装饰图标
- **Image Art Direction**: 手绘线条插画风格，墨黑线稿 + marker-red/pen-blue 局部上色，白色/米黄底，无写实渲染，笔触粗糙自然，构图留白充足
- **Image Prompt Keywords**: hand-drawn sketch illustration, black ink line art, loose brush strokes, education theme, notebook paper texture, marker red accent, pen blue accent, minimal composition, white background, child-friendly aesthetic
- **Image Avoidance**: 通用科技渐变插图、3D 渲染商务人物、无主题抽象几何、照片级写实素材、AI 默认光滑线条

## 8. 应避免 (Anti-patterns)

- ❌ 使用常规 rounded-lg/rounded-xl 替代 wobbly 有机圆角（破坏手绘核心签名）
- ❌ 使用模糊阴影 shadow-md/shadow-lg 替代零 blur 硬阴影（丧失平面插画质感）
- ❌ 在手写字体体系中混入 Inter/Roboto 等无衬线体（割裂手绘氛围一致性）

## 9. Codex / 发布注意

Codex 与 Cursor 共用本仓库。发布与权限问题见根目录 **`CODEX.md`**（不是备份文件损坏）。本地可选原生依赖残缺时先跑 `npm run ensure:native`；发布前以 `npm run type:check` 为准，勿因本地 `build:client` 失败单独阻断妙搭发布。

## 10. 系统架构

### 页面路由

| 页面 | 路径 | 组件 |
|------|------|------|
| 工作台首页 | `/` | `pages/Workbench/Workbench.tsx` |
| 学情诊断 | `/diagnosis` | `pages/Diagnosis/Diagnosis.tsx` |
| 升学规划 | `/plan` | `pages/Plan/Plan.tsx` |
| 知识点查询 | `/knowledge` | `pages/Knowledge/Knowledge.tsx` |

### 服务端模块

| 模块 | Controller | 接口 |
|------|-----------|------|
| announcement | `/api/announcements` | GET 公告列表 |
| diagnosis | `/api/diagnosis-records` | GET/POST/PATCH 诊断记录 CRUD |
| plan | `/api/plan-records` | GET/POST/PATCH 规划记录 CRUD |
| knowledge | `/api/knowledge-points` | GET/GET search/GET :id 知识点查询 |
| policy | `/api/admission-policies` | GET 升学政策查询, GET /schools 学校搜索 |

### 数据库表

| 表名 | 用途 |
|------|------|
| diagnosis_record | 学情诊断记录（年级/地区/成绩/报告） |
| plan_record | 升学规划记录（地区/成绩/报告/时间路线） |
| knowledge_point | 知识点数据（版本/学科/章节/内容） |
| admission_policy | 升学政策与分数线（地区/年份/录取线） |

### 插件实例

| 插件 ID | 类型 | 用途 |
|---------|------|------|
| academic_diagnosis_report_generator_1 | ai-text-generate | 学情诊断报告（流式） |
| study_plan_report_generate_1 | ai-text-generate | 升学规划报告（流式） |
| exam_schedule_timeline_generator_1 | ai-text-generate | 时间路线图（流式） |
| exam_policy_search_1 | ai-search-summary | 考情政策搜索（流式） |
| knowledge_point_deep_analysis_1 | ai-text-generate | 知识点深度分析（流式） |

### 公共组件

| 组件 | 路径 | 用途 |
|------|------|------|
| WobblyCard | `components/WobblyCard.tsx` | 手绘风格卡片容器（有机圆角/硬阴影/微旋转） |