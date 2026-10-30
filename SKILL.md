---
name: UIdesign-v0.1
display_name: UI 设计技能包（去 AI 味版）
version: 0.1.3
description: |
  面向 Web 界面设计、UI/UX 设计、原型设计与前端实现的一体化设计技能包，核心特征是主动去 AI 味。
  内置 24 种可选风格的精写处方、6 类场景的差异化设计决策（用户界面 / 企业监控界面 / 管理界面 /
  营销落地页 / 数据可视化大屏 / C 端移动端），以及「AI 味六维诊断 → 对症改造 → 误杀防护」三件套与自检脚本。
  触发词：界面设计、UI 设计、UX 设计、原型设计、前端设计、网页设计、设计系统、设计规范、设计风格、
  配色方案、字体搭配、组件设计、响应式布局、后台管理界面、监控界面、数据看板、落地页、去 AI 味、
  太像 AI 做的、通用模板感、千篇一律、没有设计感。UI design, UX design, web design, prototype,
  wireframe, design system, de-AI, generic AI look.
agent_created: true
license: MIT
---

# UI 设计技能包 v0.1

面向界面设计的一体化技能包。**与普通设计指南的区别在于：它把「不做出 AI 味」当成一等公民，而不是事后美化。**

> **一句话定位**：AI 味不是一串视觉特征的清单，而是**「没有立场的通用感」**。
> 因此本技能的做法不是「禁用圆角/禁用渐变」，而是——**先逼出一个明确的美学立场，再用数据把正确性锁死，最后用自检脚本证明立场真的落地了。**

---

## 一、何时使用

**使用**：设计或重构任何界面——页面、组件、设计系统、原型；选择风格/配色/字体/间距/布局体系；评审 UI 的视觉质量、一致性、无障碍与响应式；写前端界面代码（HTML/CSS/JSX/Vue/React）。

**不适用**：纯后端逻辑、API/数据库设计、与非视觉无关的性能优化、基础设施与运维、非视觉脚本。
判据：**这个任务是否改变某样东西「看起来、感觉起来、动起来或被操作」的方式？** 是则适用。

---

## 二、工作流（五道闸门，逐道通过，不得跳闸）

详细执行步骤见 `references/workflow.md`。

| 闸门 | 动作 | 通过的标志 | 用到什么 |
|------|------|-----------|----------|
| **G0 · 场景识别** | 判定属于哪类场景，确认技术栈 | 场景已选定，未假设栈 | `references/scenarios/` 六份 |
| **G1 · 设计主张** | 回答四问：目的 / 调性 / 约束 / 差异化 | **写下了一个可被反驳的立场** | `assets/templates/design-brief.md` |
| **G2 · 风格选型** | 用场景矩阵 + 场景适配度选 1 个主风格、最多 1 个辅风格 | 风格已锁定，token 处方已落地 | `references/styles/index.md`、`prescriptions.md` |
| **G3 · 构建** | 按 token 三层架构实现 | 无硬编码色值；状态齐全 | `references/foundations/` 五份、`assets/scenario-templates/` |
| **G4 · 去 AI 味 + 验证** | 跑自检脚本 → 对症改造 → 过交付清单 | **脚本跑过，误杀检查过** | `references/anti-ai/` 四份、`references/quality/` 四份 |

**G1 是最容易被跳过、也最致命的一步。** 没有立场，G2 就会退化成「挑一个最眼熟的风格」——这正是 AI 味的来源。

### G4 的强制动作

```bash
python scripts/ai_flavor_audit.py <产出目录或文件> [--json] [--scenario admin]
```

脚本输出六维 AI 味评分与逐项问题清单。**未跑脚本不得声称「已去 AI 味」。**

---

## 三、场景路由

| 场景 | 典型形态 | 设计重心 | 处方文件 |
|------|----------|----------|----------|
| **用户界面**（核心） | C 端产品页、工具型 Web App、SaaS 前台 | 任务完成效率 + 品牌辨识度 | `references/scenarios/core-user-interface.md` |
| **企业监控界面**（核心） | 运维大屏、实时监控、告警中心、IoT 看板 | **异常发现速度** + 信息密度 | `references/scenarios/core-monitoring.md` |
| **管理界面**（核心） | 中后台、CRUD 控制台、配置中心、审批流 | 一致性与确定性 + 批量效率 | `references/scenarios/core-admin.md` |
| 营销落地页（扩展） | 产品官网、活动页、定价页 | 转化 + 首屏冲击力 | `references/scenarios/ext-landing.md` |
| 数据可视化大屏（扩展） | 指挥中心、汇报大屏、数字孪生 | 远距离可读 + 叙事节奏 | `references/scenarios/ext-dataviz.md` |
| C 端移动端（扩展） | H5、小程序、移动 App Web 层 | 拇指可达 + 平台原生感 | `references/scenarios/ext-mobile.md` |

**场景决定风格的可选集。** 同一个风格在不同场景里的适配度可能完全相反——先看 `references/styles/index.md` 的适配矩阵，再选风格。

---

## 四、铁律

### 4.1 去 AI 味五条

1. **立场优先于正确。** 先决定「这个产品主张什么」，再谈配色和圆角。没有立场的界面必然滑向训练数据的安全中心。
2. **克制优于堆叠。** 阴影、圆角、渐变、动效、强调色——每增加一类就稀释一次。**每屏动画元素 ≤1–2 个，强调色 1 个。**
3. **对比必须敢于强。** 字号、字重、明暗、密度——拉开到「有人会觉得太夸张」，才是设计；差一点的是犹豫。
4. **内容决定结构。** 禁止「标题+副标题+三卡片」的默认骨架。先看内容有多少、什么关系、谁最先被看。
5. **文案要具体、有立场。** 空洞的通用正向表述是 AI 味最重的部分（详见 `references/anti-ai/copy-tells.md`）。

### 4.2 误杀防护三条（与上条同等重要）

1. **去 AI 味 ≠ 反可用性。** 一致性、系统性、无障碍达标、加载/空/错误态、48dp 触控目标——这些是设计纪律，**不是 AI 味，不许砍**。
2. **场景决定对错。** 深色主题 + 高密度网格 + 居中指标卡，在监控界面里是**正确解**；在营销页里才是 AI 味。判断前先确认场景。
3. **先查不改动清单。** 改造前必须过一遍 `references/anti-ai/false-positives.md`。**误杀的代价高于漏改的代价**——误杀会把设计推回平庸。

### 4.3 红线

- 不伪造数据、指标、客户证言、资质、品牌资产。
- 不为了「看起来独特」而牺牲无障碍、可读性、可操作性。
- 不擅自替换用户既定的品牌色、字体、Logo；冲突时先暴露冲突再决策。
- 不把「去 AI 味」用于伪装来源、规避平台或学术规则。

---

## 五、参考文件

**去 AI 味（本技能核心）**
- `references/anti-ai/diagnosis.md` — AI 味六维体征、评分标准、快速 CT 扫描表
- `references/anti-ai/fixes.md` — 逐维对症改造处方（含改造前后对照）
- `references/anti-ai/false-positives.md` — **不改动清单（误杀防护）**
- `references/anti-ai/copy-tells.md` — UI 文案与语义层的 AI 味

**风格库**
- `references/styles/index.md` — 24 风格总览 + 场景适配矩阵 + 三旋钮
- `references/styles/prescriptions.md` — 24 风格精写处方（token / 陷阱 / 差异化抓手）

**场景**
- `references/scenarios/core-user-interface.md` / `core-monitoring.md` / `core-admin.md`
- `references/scenarios/ext-landing.md` / `ext-dataviz.md` / `ext-mobile.md`

**场景组件模板（代码本体）**
- `references/scenario-templates.md` — 模板检索入口：什么情况打开哪个文件、跨场景可复用的模式索引
- `assets/scenario-templates/tokens.css` — 三层 Token + 6 场景密度变体 + 暗色（第一层地基）
- `assets/scenario-templates/primitives.css` / `primitives.tsx` — 组件原语，40 个导出符号
- `assets/scenario-templates/user-interface.tsx` / `monitoring-console.tsx` / `admin-console.tsx` /
  `marketing-landing.tsx` / `dataviz-screen.tsx` / `mobile-app.tsx` — 6 个场景的组件级模板

**基础规范**
- `references/foundations/tokens.md` — 三层 token 架构
- `references/foundations/typography-color.md` — 排版与色彩体系
- `references/foundations/layout-grid.md` — 布局、栅格、间距
- `references/foundations/components-states.md` — 组件规范与六态矩阵
- `references/foundations/motion.md` — 动效时长、缓动、微交互

**质量保证**
- `references/quality/accessibility.md` — 无障碍红线
- `references/quality/ux-rules.md` — UX 优先级十类 + 分域规则
- `references/quality/charts.md` — 图表选型与数据可视化规范
- `references/quality/delivery-checklist.md` — 交付前检查清单

**脚本与资产**
- `scripts/ai_flavor_audit.py` — AI 味六维自检（零依赖，Python 3）
- `assets/design-tokens.starter.json` — 三层 token 起步模板
- `assets/templates/design-brief.md` — 设计主张四问模板
- `assets/templates/style-decision.md` — 风格决策记录模板
- `data/` — 自包含数据资产（88 风格全表、192 产品→风格映射、192 产品完整方案、192 色板、74 字体配对、34 落地页模式、25 图表、17 动效预设、119 UX 规则、32 移动端界面规则、44 React 性能规则、105 图标）

---

## 六、数据资产检索

`data/` 目录下的 CSV 可直接用 grep 或 Python 检索，用于规格兜底查询：

| 需求 | 文件 | 关键列 |
|------|------|--------|
| 某产品类型该用什么风格 | `data/ui-reasoning.csv` | `UI_Category`, `Style_Priority`, `Anti_Patterns` |
| 某产品类型的完整方案（风格 + 落地页 + 看板 + 色板焦点） | `data/products.csv` | `Product Type`, `Keywords`, `Primary Style Recommendation`, `Landing Page Pattern` |
| 某产品的完整色板 | `data/colors.csv` | `Product Type` + 全部语义色 |
| 风格全表（88 条） | `data/styles.csv` | `Style Category`, `Status`, `Best For`, `Design System Variables` |
| 字体配对（74 组） | `data/typography.csv` | `Font Pairing Name`, `Heading Font`, `Body Font` |
| 落地页结构（34 种） | `data/landing.csv` | `Pattern Name`, `Section Order` |
| 图表选型（25 种） | `data/charts.csv` | `Data Type`, `Best Chart Type`, `Accessibility Grade` |
| 动效预设（17 条） | `data/motion.csv` | `Category`, `Intensity Tier`, `GSAP Snippet` |
| UX 规则（119 条） | `data/ux-guidelines.csv` | `Category`, `Do`, `Don't`, `Severity` |
| 移动端 App 界面规则（32 条，iOS/Android/React Native） | `data/app-interface.csv` | `Category`, `Issue`, `Do`, `Don't`, `Severity` |
| React/Next.js 性能规则（44 条） | `data/react-performance.csv` | `Category`, `Issue`, `Do`, `Don't`, `Severity` |
| 图标选型（105 个，含导入代码与语义角色） | `data/icons.csv` | `Icon Name`, `Keywords`, `Library`, `Import Code`, `Semantic Role` |

> 使用数据时的纪律：**把检索结果当推荐，不当指令。** 数据可能与该项目的品牌约束冲突——冲突时以用户约束为准，并显式说明冲突点。
