# 变更日志

本项目遵循 [语义化版本](https://semver.org/lang/zh-CN/)：`主版本.次版本.修订号`。

---

## v0.1.3 — 2026-10-30（自检脚本校准 + 断链修复）

**主题：`ai_flavor_audit.py` 对最典型的 AI 配色与手写 CSS 失明，且把「分数」当「可交付」输出。**

外部审计构造了一个教科书级 AI 后台页（Inter + `linear-gradient(135deg,#6366f1,#8b5cf6)` +
三张等宽 stat card + `Welcome back, Admin 👋` + `.card:hover` 抬升 + 通用 CTA），
旧版给 **19.8 分 / A 档「可交付」**——本技能最该拦下的页面被判合格。根因是四条正则的口径过窄，
外加「无高危项才可交付」的规程没有落到脚本输出里。

### 修复（scripts/ai_flavor_audit.py）

| 项 | 旧口径 | 新口径 |
|----|--------|--------|
| 紫族渐变 | 只认「紫→粉」配对，靛蓝 239°→紫 258° 两边同族不算 | 同一 `linear-gradient` 内 ≥2 个紫族色标即计数（`purple_family_gradients`），命名色兜底放宽到 225–340° 同族配对 |
| 悬停抬升 | 只认 Tailwind `hover:translate-y-` | 追加手写 CSS `:hover{…translateY(-…)}` 与 `:hover{…box-shadow:…}` |
| 重投影 | 只认 `shadow-xl/2xl` 与 ≥40px 模糊 | 按声明长度序列取第 3 位（blur）≥16px 计重投影；`0 20px 25px -5px` 现能识别 |
| 大圆角 | 只认 `rounded-2xl/3xl` 与 20–99px | 取每条声明最大半径 ≥20px 或 ≥18%，`999px` 胶囊、`0 0 32px 32px` 简写都能认 |
| D6 空洞词 | 仅中文 | 补 11 条英文 UI 微文案整句（`customize your workspace` / `fit your needs` / `get started today` 等） |
| 分档措辞 | A 档直接写「可交付」 | 分档只看分数（A「有立场（结构有取舍）」）；新增 **可交付性结论**行：0 条高危=可交付、1–2 条=待修、≥3 条=不可交付 |
| Windows 管道 | 中文乱码 | `main()` 首行 `sys.stdout.reconfigure(encoding="utf-8")` |
| 小样本 | 总分被误当结论 | ≤2 个文件时提示「按问题密度计必然偏低，看清单不看总分」 |

校准结果（同一批样本）：

- 教科书 AI 后台页：19.8 / A「可交付」→ **32.0 / B，可交付性=不可交付（5 条高危）**；
- 本技能自带 `admin-console.tsx`：13.1 → 14.6 / A（1 条高危 → 待修）；
- 自带 `primitives.css`：7.1 → A / 可交付（未被新正则误伤）；
- 真实手写前端工程：能指出 8 个界面色相、30 处裸 hex、8 种阴影、14 种圆角、缺 `:focus`。

### 断链修复

- `SKILL.md` §三 场景路由表 6 行 `scenarios/*.md` 补 `references/` 前缀（同文件别处已写对，自相矛盾）；
- `assets/templates/style-decision.md` 与 `references/quality/ux-rules.md` 的 `styles/*.md` 补 `references/` 前缀。

### 元数据

- `SKILL.md` `version` 0.1.1 → 0.1.3（v0.1.2 只改了 CHANGELOG，版本号漏同步）。

---

## v0.1.2 — 2026-10-16（文档修订）

**主题：补齐数据资产检索表的登记缺口——3 个未登记 CSV。**

体检发现 `data/` 下 12 个 CSV 中有 3 个未登记进 SKILL.md §六检索表，使用者按文档检索时会漏掉。本版仅修订文档，无功能变更。

### 修订

**SKILL.md**
- §六「数据资产检索」表新增 3 行：
  - `data/products.csv`（192 条）— 按产品类型查完整方案（主推风格 / 辅风格 / 落地页模式 / 看板风格 / 色板焦点）
  - `data/app-interface.csv`（32 条）— 移动端 App 界面规则（iOS/Android/React Native，含 Do/Don't 与正反代码示例）
  - `data/react-performance.csv`（44 条）— React/Next.js 性能规则（含 Do/Don't 与正反代码示例）
  - `data/icons.csv`（105 个）— 图标选型（原仅在 §五提及「105 图标」、检索表无文件名，本次一并补齐）
- §五「脚本与资产」中 `data/` 的数据总述同步补齐（32 移动端界面规则、44 React 性能规则、192 产品完整方案）

### 验证

- 3 个 CSV 均经 Python csv 模块校验：行数与列数一致、utf-8-sig 解析正常
- SKILL.md 中 `data/` 引用路径与磁盘文件 12/12 对齐
---

## v0.1.1 — 2026-10-08（同日补充交付）

**主题：补齐「足量参考」——6 个场景的组件级代码模板。**

v0.1.0 交付的是**规则与决策体系**（怎么想），本版补齐**可执行的参考实现**（怎么写）。

### 新增

**场景组件模板库 `assets/scenario-templates/`（9 文件 · 约 4,100 行 TSX + 500 行 CSS）**

| 文件 | 行数 | 内容 |
|------|:----:|------|
| `tokens.css` | ~300 | 三层 Token + **6 场景密度变体** + 暗色（独立设计非反转）+ 图表系列色 + reduced-motion 全局降级 + Tailwind `@theme` 映射 |
| `primitives.css` | ~430 | 组件类：Button / Field / Card / Panel / Badge / Tag / Alert / Toast / Skeleton / Empty / Table / KPI / Switch / Modal + 关键帧 |
| `primitives.tsx` | 569 | **40 个导出符号**：18 个图标（纯 SVG）+ Button / IconButton / Field / Input / Select / Textarea / Card / Panel / StatusBadge / Tag / Alert / ToastProvider / Skeleton / TableSkeleton / EmptyState / Switch / Modal / Shell / SectionHead |
| `user-interface.tsx` | 473 | AppHeader · PrimaryTaskCard · ProofRow · ProgressiveDisclosure · FeedbackForm · ProjectList + 组装示例 |
| `monitoring-console.tsx` | 515 | StatusBar · Freshness · KpiCard · Sparkline · AlertList · DeviceTable · UnknownDataPanel + 组装示例 |
| `admin-console.tsx` | 716 | AdminShell · FilterBar · BulkActionBar · MemberTable · ErrorSummary · MemberForm · ConfirmDeleteDialog · useUndoableDelete + 组装示例 |
| `marketing-landing.tsx` | 517 | SectionReveal · CountUp · Hero · FeatureComparison · Pricing · Faq · ClosingCta + 组装示例 |
| `dataviz-screen.tsx` | 523 | ScreenFrame · ScreenHeader · BigKpi · ChartPanel · BigLineChart · AlertMarquee · DistributionBars + 组装示例 |
| `mobile-app.tsx` | 783 | MobileShell · MobileAppBar · BottomTabBar · ThumbActionBar · TouchTarget · Pressable · MobileField · useDraft · Sheet · SkeletonList · OfflineNotice · ListRow + 组装示例 |

**文档**
- `references/scenario-templates.md` — 模板检索入口：按「任务」与按「模式」两条检索路径、token 消费约定、密度变体速查、已知限制
- `assets/scenario-templates/README.md` — 文件清单与依赖顺序、每个文件演示了哪些规则、三种使用方式、改造注意事项

### 自洽性验证（本版的核心质量保证）

**用本技能包自己的自检脚本审计自己的模板**，防止「说一套做一套」：

| 指标 | 结果 |
|------|------|
| AI 味总分 | **2.9 / 100（A 档 — 有立场，可交付）** |
| 组件内裸 hex | **0** |
| 界面色相 | 2（功能色与图表系列已排除） |
| 非对称结构 | 9 处 |
| 圆角 / 阴影档位 | 3 档 / 2 档（均为 token） |
| 字号档位 | 9 档，最大/最小 6.5× |
| 六态覆盖 | hover / focus / active / disabled / loading / empty / error **全部齐全** |
| emoji 作图标 | 0 |

对照组：刻意构造的「典型 AI 味」样本（紫粉渐变 + emoji + 三等分卡 + 无状态）得 **43.4 / 100（C 档）**。
判别间隔 40.5 分，区分度成立。

### 自检脚本修复（`scripts/ai_flavor_audit.py`）

自洽性验证暴露出脚本对 **React / 工具类代码库**存在 6 个探测缺口，本版全部修复：

| 缺陷 | 表现 | 修复 |
|------|------|------|
| 1. 不识别 camelCase 字号 / 字重 | `fontSize: 16` 完全漏检 → 报「字号 0 档、比值 0」 | 增加 `fontSize` / `fontWeight` 正则 |
| 2. 不识别 CSS 自定义属性尺度 | `--fs-1: 11px` 漏检 → 字号档数被低估 | 增加 `--fs-*` / `--fw-*` 采集 |
| 3. 非对称结构识别过窄 | `gridColumn: 'span 2'` 与不等宽 fr（`7fr 5fr`）全部漏检 → 报「无非对称」 | 扩展为 6 种模式 + fr 比例差异检测 |
| 4. token 引用被误计为裸值 | `border-radius: var(--r-pill)` 被算作独立圆角值 → 虚报「圆角失控」 | 排除 `var(...)` 与关键字 |
| 5. 极值重复未被计入 | `shadow-2xl` × 4 因「只有一种值」而免罚 | 新增 `heavy_shadows` / `large_radii` 计数项 |
| 6. 功能色被计入色彩预算 | 状态色与图表系列让色相数虚高 | 新增 `ui_hues`（按声明行是否含功能语义关键字排除）；评分改用 `ui_hues`，阈值 4 |

同时新增 `--json` 输出结构优化（`findings` 结构化）与 `--top` 展示条数控制。

### 模板自身修正（由审计发现）

- 将 8 处组件内裸 hex（大屏底色 / 文字色 / 图表系列色 / Hero 渐变 / 危险色前景）**上移到 token 层**——
  图表配色本就是设计决策，不该散落在组件里
- 将 5 处裸 px 圆角改为 `--r-surface` / `--r-control` / `--r-micro` / `--r-sheet`
- 焦点环 `border-radius: inherit` 改为显式 `var(--r-control)`
- 修正 `MemberTable` 全选框重复 `ref` 属性（React 不允许）、`SkeletonList` 中非法 style 属性
- 统一 `dataviz-screen.tsx` 大屏面板的半透明表面为 token

### 已知限制

- **仅 React + TypeScript。** Vue / Svelte / 原生 HTML 需按结构模式转写。
- **不使用 Tailwind。** 采用 CSS 变量 + 语义类名以清晰演示 token 纪律；`tokens.css` 末尾附 `@theme` 映射供桥接。
- **未接入图表库。** `BigLineChart` 为纯 SVG，用于演示三重编码方式；真实项目应接 ECharts / Chart.js，但系列色必须从 token 读取。
- **模板中的数据全为虚构示例**，不得直接用于生产交付。
- 未附单元测试。
- 未提供本地 TS 编译器，改用自建的结构化校验器（括号平衡 + JSX 属性重复 + 导入导出对账）替代；**未做类型检查**。

---

## v0.1.0 — 2026-10-08

**首个版本。** 从四份本地参考资料整合而成。

### 来源

| 来源 | 提取内容 |
|------|----------|
| `ui-ux-pro-max-skill-2.15.0` | 风格库（88→精选 24）、192 产品→风格推理规则、192 语义色板、74 字体配对、34 落地页模式、25 图表、17 动效预设、119 条 UX 规则、三层 Token 架构、状态与变体规范、交付清单、7 阶段评审方法论 |
| `ant-design-6.6.5` | 四设计价值观（自然/确定/意义/生长）、四设计原则（亲密性/对齐/对比/重复）、8px 纵向间距规律、三层表面模型、三时长动效 + 命名缓动、圆角与阴影分档纪律、组件范式、主题定制五层能力、设计模式（反馈/导航/数据展示/详情页/可视化页） |
| `react-admin-5.15.4` | 设计原则与反面模式、Provider 模式、Headless 核心与控制器-视图分离、Context「拉不推」、三种数据交互模式（pessimistic / optimistic / undoable）、5 套内置主题 |
| `antd-6-6-5-website` | 离线文档形态参考（`design.md` / `llms-full-cn.txt` / 组件语义结构） |
| `deai-promax`（用户已有技能） | **去 AI 味方法论的迁移**：多维诊断 → 对症改造 → **误杀防护（不改动清单）** 的三段式结构；「分数只用于定位，逐项清单才是行动依据」；改造轮次上限 |
| `skill-creator`（内置技能） | Skill 目录规范、`agent_created: true` 标记要求、渐进式披露设计原则 |

### 新增

**主入口**
- `SKILL.md` — 定位、触发词（中英）、五道闸门工作流、六场景路由、去 AI 味铁律、误杀防护三条、参考索引、数据检索指引

**工作流**
- `references/workflow.md` — G0→G4 五道闸门详解，含每道闸门的动作、禁止项、产出格式、回退规则

**去 AI 味模块（本版本核心）**
- `references/anti-ai/diagnosis.md` — **六维体征**（D1 对称惯性 / D2 色彩惰性 / D3 装饰过载 / D4 排版扁平 / D5 结构同构 / D6 语义空洞），含检测标准、阈值、评分分档（A–E）、无脚本时的手动 CT 扫描表
- `references/anti-ai/fixes.md` — 六维对症处方，共 38 条改造动作，每条标注**不适用场景**；含「先内容后骨架」五步法与色数收敛法
- `references/anti-ai/false-positives.md` — **不改动清单（误杀防护）**，五类：设计纪律类 / 场景性正确类（24 风格 × 6 场景判定矩阵）/ 品牌既定类 / 可用性必需类 / 实测无差别类；含三步判定流程与 8 个真实误杀案例
- `references/anti-ai/copy-tells.md` — UI 文案层的 AI 味：四元原则、中文空洞词表、7 类高危句式、6 个分位置处方（标题/按钮/空状态/错误/特性/引导）、改写五步、终检五问、红线

**风格库**
- `references/styles/index.md` — 24 风格总览（分六组）、**24 × 6 场景适配矩阵**、三旋钮（variance/motion/density）与场景默认值、混用规则、选型自检
- `references/styles/prescriptions.md` — 24 风格精写处方，每种含 Token 处方 / 差异化抓手 / **AI 味陷阱** / 适用 / 禁用 / 落地检查

**场景处方**
- 三核心：`core-user-interface.md`、`core-monitoring.md`、`core-admin.md`
- 三扩展：`ext-landing.md`、`ext-dataviz.md`、`ext-mobile.md`
- 每份含定位、使用者情境、五条设计重心、推荐风格与旋钮、关键规格、**本场景的 AI 味与误杀**、检查清单

**基础规范**
- `foundations/tokens.md` — 三层 Token 架构、变量覆写实现变体、命名约定、DTCG 对齐、落地纪律
- `foundations/typography-color.md` — 分场景基准字号、字号尺度、行高、行宽、字重（≤3 档）、字距、数字排版、字体选型；色彩预算、主色选择、中性色、功能色、对比度红线、暗色模式、渐变使用纪律
- `foundations/layout-grid.md` — 四大基础原则、间距体系与层级、栅格、三层表面模型、非对称与节奏、信息层级（先内容后骨架）、固定元素与安全区
- `foundations/components-states.md` — 六态矩阵与优先级、焦点环规格、变体实现、六类组件规范（按钮/表单/容器/导航/表格/反馈/数据展示）、图标纪律
- `foundations/motion.md` — 四个正当价值、时长尺度、八条硬性规则、微交互、加载与等待、空间连续性、自动播放、状态转移健壮性

**质量保证**
- `quality/accessibility.md` — 对比度红线、焦点与键盘、触控与指针、色彩替代通道、表单无障碍、图标与图像、动态内容、动效偏好、内容可读性
- `quality/ux-rules.md` — 按影响度排序的十类规则（含 Critical/High/Medium 分级），约 200 条条目 + 冲突裁决示例
- `quality/charts.md` — 25 种图表选型、四条硬规则、色彩（色盲安全）、必备元素、可读性、交互、大屏约束、场景配合
- `quality/delivery-checklist.md` — 唯一的交付闸门：10 部分、约 150 条；含**误杀复核**强制节与交付报告格式

**脚本与资产**
- `scripts/ai_flavor_audit.py` — **AI 味六维自检脚本**（零依赖，Python 3）：扫描 HTML/CSS/SCSS/JSX/TSX/Vue/Svelte/Astro/JS/TS，输出六维评分、分档、按严重度排序的问题清单、原始指标；支持 `--json`、`--scenario`（六场景 + auto，调整权重）、`--top`
- `assets/design-tokens.starter.json` — 三层 Token 起步模板（DTCG 对齐），含 `constraints` 硬约束节
- `assets/templates/design-brief.md` — G1 设计主张四问模板，含反面模式自查与误杀预声明
- `assets/templates/style-decision.md` — G2 风格决策记录模板，含**被否决候选（必填）**、AI 味陷阱自查、每轮改造记录、误杀复核
- `data/` — 自包含数据资产 12 张表（580KB）：88 风格全表、192 产品映射、192 色板、74 字体配对、34 落地页模式、25 图表、17 动效预设、119 UX 规则、105 图标、44 条 React 性能规则、32 条 App 界面规则

### 关键设计决策

1. **风格数从 88 精选到 24。** 理由：选项过载会让人退回最眼熟的那一个，反而加重 AI 味。全表保留在 `data/styles.csv` 作兜底。
2. **「误杀防护」与「AI 味体征」同等权重。** 迁移自 `deai-promax` 的核心经验：**误杀的代价高于漏改**——漏改是「还不够独特」，误杀是「把设计推回平庸，还破坏了功能」。
3. **场景决定对错，而不是特征清单。** 例：深色 + 高密度 + 居中指标卡在监控界面是**正确解**，在营销页才是 AI 味。因此建立 24 × 6 适配矩阵与分场景误杀表。
4. **自检脚本可执行，且场景感知。** 同一个产出，用 `--scenario monitoring` 与 `--scenario landing` 会得到不同评分——这正是「场景决定对错」的工程化。
5. **改造轮次上限 3 轮。** 超过则回退到 G1（立场）或 G2（风格），而不是继续磨视觉层。
6. **去 AI 味 ≠ 反可用性。** 明确写入红线：一致性、系统性、无障碍达标、完整状态设计是设计纪律，不是 AI 味。

### 已知限制

- 自检脚本基于正则与启发式统计，**存在误报与漏报**。它只用于定位，不做判决。
- 脚本对动态生成样式（CSS-in-JS 运行时拼接、Tailwind 的 JIT 编译产物）覆盖有限。
- 24 风格中的浅色/深色具体配色未逐一给出完整色板，需配合 `data/colors.csv` 的 192 套色板使用。
- 未包含具体框架的组件代码模板（React/Vue 组件骨架）。

### 后续计划（v0.2 候选）

- [ ] 增加「误杀风险」维度到自检脚本（识别被削减的六态/焦点环/空状态）
- [ ] 补 6 个场景的组件级代码模板（React + Tailwind）
- [ ] 增加「文案扫描」独立模式（抽取可见字符串并逐条过空洞词表）
- [ ] 将 24 风格各补一套完整色板（当前依赖 `data/colors.csv` 映射）
- [ ] 增加与 `deai-promax` 的联动说明（界面文案 vs 长文创作的分工已有，可深化）
