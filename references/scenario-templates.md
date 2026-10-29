# 场景组件模板索引

> 代码本体在 `assets/scenario-templates/`（9 个文件，约 4,100 行 TSX + 500 行 CSS）。
> 本文件是**检索入口**——说明什么情况下该打开哪个文件，以及每个文件里有哪些可复用的模式。

**重要**：模板是 **React + TypeScript + 内联样式引用 CSS 变量**。若项目使用 Vue / Svelte / 原生 HTML，
**照取结构模式与 token 用法，不照取语法**。组件结构、状态组织、aria 关联方式都是可迁移的。

---

## 一、何时加载哪个文件

| 你在做什么 | 打开 | 看哪部分 |
|-----------|------|----------|
| 从零起一个新项目 | `tokens.css` → `primitives.css` → `primitives.tsx` | 全部（这是地基） |
| 做表单（任意场景） | `primitives.tsx` | `Field` · `Input` · `Select` · `Textarea` |
| 做模态/抽屉 | `primitives.tsx` | `Modal`（焦点陷阱 + 归还）；`mobile-app.tsx` → `Sheet` |
| 做 toast / 轻提示 | `primitives.tsx` | `ToastProvider`（`aria-live` 不抢焦点 + 悬停暂停） |
| 做数据表格 | `admin-console.tsx` | `MemberTable` · `SortHeader`（`aria-sort` + indeterminate） |
| 做监控/告警 | `monitoring-console.tsx` | `AlertList` · `StatusBar` · `UnknownDataPanel` |
| 做 KPI 数字 | `monitoring-console.tsx` / `dataviz-screen.tsx` | `KpiCard` · `BigKpi`（等宽 + 层次反差） |
| 做图表 | `dataviz-screen.tsx` | `BigLineChart`（三重编码） · `ChartPanel`（三态） |
| 做落地页 | `marketing-landing.tsx` | `Hero`（偏置） · `FeatureComparison` · `Pricing` |
| 做移动端 | `mobile-app.tsx` | 全部（安全区 / 触控目标 / 拇指热区） |
| 做暗色模式 | `tokens.css` | `.dark` 块（注意：不是反转颜色） |
| 调信息密度 | `tokens.css` | `[data-density="…"]` 四个变体 |
| 补三态（空/加载/错） | 各场景文件 | `ProjectList` · `ChartPanel` · `EmptyState` · `TableSkeleton` |

---

## 二、按「模式」检索（跨场景复用）

有些模式只出现在一个场景文件里，但适用于所有场景。

### 2.1 无障碍模式

| 模式 | 位置 | 要点 |
|------|------|------|
| 焦点陷阱 + 焦点归还 | `primitives.tsx` `Modal` | 首尾回环；关闭后 `returnFocusRef.current?.focus()` |
| `aria-describedby` 多源关联 | `primitives.tsx` `Field` | 帮助文本与错误文本 id 拼成一个字符串 |
| 错误摘要 + 字段跳转 | `admin-console.tsx` `ErrorSummary` | 提交后聚焦摘要；每项按钮跳转对应字段 |
| 状态三重编码 | `primitives.css` `.badge` | `::before` 形状（● ▲ ◆ ■）+ 颜色 + 文字 |
| 隐藏装饰性元素 | `primitives.tsx` `VisuallyHidden` | 也用于给图标按钮补读屏文本 |
| `aria-sort` 排序表头 | `admin-console.tsx` `SortHeader` | `ascending` / `descending` / `none` 三态 |
| 轮播可暂停 | `dataviz-screen.tsx` `AlertMarquee` | 聚焦即停；`reduced-motion` 停播 |
| 图表文字摘要 | `dataviz-screen.tsx` `BigLineChart` | `aria-label` 描述系列与最新值 |

### 2.2 状态管理模式

| 模式 | 位置 | 要点 |
|------|------|------|
| 三态渲染 | `user-interface.tsx` `ProjectList` | `loading / empty / error / ready` 四分支，**缺一即缺陷** |
| 骨架尺寸对齐真实行高 | `primitives.tsx` `TableSkeleton` | 防加载完成时的布局跳动 |
| 草稿自动保存 | `mobile-app.tsx` `useDraft` | `sessionStorage`；隐私模式静默降级 |
| 未保存改动拦截 | `mobile-app.tsx` `Sheet` `confirmDiscard` | 关闭前确认，不静默丢弃输入 |
| 乐观更新 + 撤销 | `admin-console.tsx` `useUndoableDelete` | 优于确认框（见 `react-admin` 三种 mutation 模式） |
| 冻结/暂停实时流 | `monitoring-console.tsx` `StatusBar` | 值班员需要定格分析 |

### 2.3 去 AI 味模式（本项目最核心）

| 模式 | 位置 | 演示的反模式 |
|------|------|-------------|
| **偏置 Hero** | `marketing-landing.tsx` `Hero` | 对抗「居中 + 双按钮」对称惯性（D1） |
| **对照表替代三等分卡** | `marketing-landing.tsx` `FeatureComparison` | 对抗「标题+副标题+3 卡片」结构同构（D5） |
| **跨列制造主次** | `monitoring-console.tsx` `MonitoringConsole` | 用 `gridColumn: span 2` 而非加粗阴影 |
| **不等宽栅格** | `marketing-landing.tsx` `Pricing` | 推荐档 1.4 份宽，用尺寸而非阴影 |
| **数字层次反差** | `monitoring-console.tsx` `KpiCard` | 72px vs 12px（≥4×），对抗排版扁平（D4） |
| **主动写清边界** | `marketing-landing.tsx` `Pricing` `boundary` | 对抗语义空洞（D6）——含不利信息才可信 |
| **文案替换测试** | 全部按钮/空状态文案 | 换成竞品名不成立才留 |
| **图表三重编码** | `dataviz-screen.tsx` `BigLineChart` | 颜色 + 线型 + 直标，不靠颜色单独表意 |
| **token 化图表配色** | `tokens.css` `--series-*` | 图表色属设计决策，不散落在组件里（D2） |

---

## 三、token 消费约定（改代码前必读）

```tsx
// ✅ 正确：引用 token
style={{ background: 'var(--color-surface)', padding: 'var(--space-component)' }}

// ❌ 错误：裸值
style={{ background: '#FFFFFF', padding: 13 }}

// ✅ 正确：token 里没有可用的档位 → 说明设计需要重审，而不是打补丁
```

**四层引用链**，跨层引用即破坏可维护性：

```
组件代码  →  var(--component-*)   或  var(--color-*) / var(--space-*)
语义 token →  var(--gray-*) / var(--brand-*) / var(--series-*)
原始 token →  裸值（只允许出现在这一层）
```

**允许裸值的唯一位置**：`tokens.css` 的 Primitive 区。

**已验证的实测结果**：本目录经 `scripts/ai_flavor_audit.py` 审计得 **2.9 / 100（A 档）**，
其中「组件内裸 hex」为 **0**。若你的产出该项非 0，先修这个再看别的。

---

## 四、密度变体速查

给容器加 `data-density` 即可整体切换尺度，**不要手改间距**：

| `data-density` | 适用场景 | 组件内 / 组件间 / 区块间 | 控件高 | 基准字号 |
|:--------------:|----------|--------------------------|:------:|:--------:|
| `compact` | 监控界面 · 数据大屏 | 8 / 12 / 16px | 28px | 13px |
| `dense` | 管理界面 | 12 / 16 / 24px | 32px | 14px |
| `standard` | 用户界面 · C 端移动端 | 12 / 16 / 32px | 36px | 16px |
| `comfortable` | 营销落地页 | 16 / 24 / 48px | 48px | 16px |

```tsx
<div data-density="compact">…</div>
```

暗色同理：`data-theme="dark"` 或 `class="dark"`。

---

## 五、已知限制

1. **仅 React 版本。** Vue / Svelte / 原生 HTML 需按结构模式自行转写。
2. **不使用 Tailwind。** 采用 CSS 变量 + 语义类名，以更清晰地演示 token 纪律。
   `tokens.css` 末尾附有 Tailwind v4 `@theme` 映射，两者可桥接。
3. **未接入图表库。** `BigLineChart` 是纯 SVG 实现，用于演示编码方式；
   真实项目应接 ECharts / Chart.js，但**系列色必须从 `--series-*` 读取**。
4. **数据全为示例。** 所有数字、设备名、证言均为虚构示例，**不得直接用于生产交付**。
5. **未包含测试。** 模板未附单元测试；接入后应按项目规范补 Storybook / Testing Library 用例。
