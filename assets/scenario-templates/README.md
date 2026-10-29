# 场景组件模板库

6 个场景的**组件级代码模板**，共 9 个文件、约 4,100 行 TSX + 500 行 CSS。

> **这些模板是「技能包自己的规则的可执行版本」。**
> 每一份文件头都标注了它演示了哪些规则条目；审读代码时，规则与实现是一一对应的。

---

## 一、文件清单与依赖关系

```
scenario-templates/
│
├── tokens.css                    ← 第一层地基（三层 Token + 6 场景密度变体 + 暗色）
├── primitives.css                ← 第二层（组件类的视觉实现）
├── primitives.tsx                ← 第三层（React 组件，40 个导出符号）
│
├── user-interface.tsx            ← 场景 1（依赖上面三个）
├── monitoring-console.tsx        ← 场景 2
├── admin-console.tsx             ← 场景 3
├── marketing-landing.tsx         ← 场景 4
├── dataviz-screen.tsx            ← 场景 5
└── mobile-app.tsx                ← 场景 6
```

**引入顺序**（务必按此顺序）：

```tsx
import './tokens.css';        // 1. token 定义（含密度变体与暗色）
import './primitives.css';    // 2. 组件类
import { Button, Card, Field, /* … */ } from './primitives';   // 3. React 原语
import { MonitoringConsole } from './monitoring-console';      // 4. 场景组件
```

---

## 二、场景速查

| # | 文件 | 场景 | 核心组件 | 默认旋钮 |
|---|------|------|----------|----------|
| 1 | `user-interface.tsx` | 用户界面 | `AppHeader` · `PrimaryTaskCard` · `ProofRow` · `ProgressiveDisclosure` · `FeedbackForm` · `ProjectList` | V5 / M4 / D5 |
| 2 | `monitoring-console.tsx` | 企业监控 | `StatusBar` · `KpiCard` · `Sparkline` · `AlertList` · `DeviceTable` · `UnknownDataPanel` · `Freshness` | V3 / M2 / **D9** |
| 3 | `admin-console.tsx` | 管理界面 | `AdminShell` · `FilterBar` · `MemberTable` · `BulkActionBar` · `ErrorSummary` · `MemberForm` · `ConfirmDeleteDialog` | V3 / M2 / D7 |
| 4 | `marketing-landing.tsx` | 营销落地页 | `SectionReveal` · `CountUp` · `Hero` · `FeatureComparison` · `Pricing` · `Faq` · `ClosingCta` | **V7** / M6 / D3 |
| 5 | `dataviz-screen.tsx` | 数据大屏 | `ScreenFrame` · `ScreenHeader` · `BigKpi` · `ChartPanel` · `BigLineChart` · `AlertMarquee` | V4 / M4 / D8 |
| 6 | `mobile-app.tsx` | C 端移动端 | `MobileShell` · `MobileAppBar` · `BottomTabBar` · `ThumbActionBar` · `MobileField` · `Sheet` · `ListRow` · `useDraft` | V5 / M5 / D4 |

每个文件末尾都有一个 `XxxPage()` 组装示例，可直接渲染看效果。

---

## 三、每个文件演示了什么

### `tokens.css`
- 三层架构：Primitive → Semantic → Component（`tokens.md`）
- 色彩预算：2 个界面色相 + 功能色单列（`typography-color.md`）
- 9 档字号、最大/最小 6.5×；3 档字重；3 档圆角 + 2 个说明性例外；3 档阴影（`anti-ai/D2`·`D3`·`D4`）
- 4 档中性色；暗色**独立设计**而非反转（`typography-color.md` 暗色模式）
- **6 场景密度变体**：交换整张间距/字号尺度，而非零散数值（`layout.css`·三旋钮）
- `prefers-reduced-motion` 全局降级 + 告警脉冲降级为静态（`motion.md`）
- 末尾附 Tailwind v4 `@theme` 映射注释

### `primitives.css` / `primitives.tsx`
- **六态齐全**，变体用「变量覆写」实现（`components-states.md`）
- 按下态不改变布局边界；loading 不改变宽度（`anti-ai/D3`·`components-states.md`）
- 焦点环 2px + 2px 偏移，`focus-visible`（`accessibility.md`）
- 状态徽标 = **颜色 + 形状 + 文字**三重编码（色盲安全）
- 图标全 SVG（Lucide 风格，线宽 1.5），**零 emoji**（`anti-ai/D6`）
- `Field` 负责 id / `aria-describedby` / `aria-invalid` 关联（`accessibility.md` 表单）
- `ToastProvider` 用 `aria-live="polite"`，**不抢焦点**，悬停/聚焦时暂停计时
- `Modal` 焦点陷阱 + Esc 关闭 + **焦点归还触发元素**
- 表格骨架尺寸与真实行高一致（防加载完成后布局跳动）

### 场景 1 · 用户界面
- **偏置 Hero + 非对称证据栏**（7:5 切分，非 1:1）（`anti-ai/D1`）
- 每屏唯一主行动；次级动作用文字链降级（`core-user-interface.md` §三）
- 可验证证据行：数字 + 出处，替代「值得信赖」类空话（`anti-ai/D6`）
- 三态齐全（loading / empty / error）；空状态说清原因 + 下一步
- `onBlur` 校验 + 持久帮助文本 + 错误就近

### 场景 2 · 企业监控
- **告警区跨 2 列**（用跨列制造主次，不靠加粗阴影）（`anti-ai/D1`）
- 关键数字 72px 等宽 + `tabular-nums`，与 12px 标签形成 ≥4× 反差
- **状态色配形状**（● 正常 / ▲ 警告 / ◆ 严重 / ■ 信息），色盲可辨
- **无数据 ≠ 正常**：`UnknownDataPanel` 显式区分「未知」与「正常」
- `Freshness` 数据陈旧自动变色 + 提供冻结开关
- 文件头列出 **8 条误杀防护**（高密度、小字号、深色、居中指标卡…）

### 场景 3 · 管理界面
- 左右布局适配：侧栏 240px 固定 + 工作区动态伸缩
- 表格：粘性表头 + `aria-sort` + `indeterminate` 全选 + 数字右对齐 + 空值 `-`
- **`ErrorSummary`**：顶置可聚焦 + 每项链接到字段 + 保留行内错误 + 提交后聚焦
- 表单**标签右对齐（冒号对齐）**，眼球沿冒号列扫描即可找到所有字段
- 破坏性操作：确认对话框 + 「删除这 12 条」的结果导向文案
- `Tag` 只做分类，关键状态用 `Badge`（纪律区分）

### 场景 4 · 营销落地页
- **⭐ 偏置 Hero**（左文 7 栏 + 右证据 5 栏），刻意不做居中对称 + 双按钮
- **⭐ 对照表替代「三等分特性卡 ×6」**——内容间是「有/没有」的对比关系，不是并列
- 定价：标价明确 + **主动写清边界与代价**（含「SOC 2 进行中」这类不利信息）
- 三档定价**不等宽**（推荐档 1.4 份），用尺寸而非阴影制造主次
- `SectionReveal` 用 IntersectionObserver，**reduced-motion 直接落终态**
- `CountUp` 数字滚动同样尊重 reduced-motion

### 场景 5 · 数据可视化大屏
- `ScreenFrame`：**锚定基准分辨率等比缩放** + 安全边距（避让屏体边框/拼接缝）
- **字号按观看距离反推**：3–4m→18px / 4–6m→24px / 6–8m→32px
- 分区数 3–5，视线路径被设计（顶部总览 → 中部主图 → 底部支撑）
- 折线图**三重编码**：颜色 + 线型（虚线）+ 直接标注
- `ChartPanel` 三态齐全；**无数据不留空坐标轴**
- `AlertMarquee` **可暂停** + 聚焦即停 + reduced-motion 停轮播
- 全文零装饰性循环动画；发光仅用于告警与活跃态

### 场景 6 · C 端移动端
- `MobileShell`：`dvh` 而非 `vh` + `env(safe-area-inset-*)` + 吸底栏为内容预留内边距
- `TouchTarget`：视觉图标可小，**热区强制 ≥44px**
- `Pressable`：按压反馈 ≤100ms，**只改背景色不改布局边界**
- 底部导航 4 项，**图标 + 文字**（纯图标伤害可发现性）
- `ThumbActionBar` 固定在拇指热区；**危险操作不放这里**
- `MobileField`：输入框 ≥44px、**字号 16px（低于此值 iOS 会缩放整页）**
- 语义化 `type` / `inputMode` / `autoComplete` 触发正确键盘与系统填充
- 聚焦时 `scrollIntoView` 防键盘遮挡；`useDraft` 草稿自动保存
- `Sheet`：下滑关闭（4px 阈值）+ 未保存改动确认 + 焦点归还
- 列表行**不用横向滑动**（避免与主滚动/系统手势冲突）

---

## 四、使用方式

### 方式 A：直接取用单个组件

复制 `primitives.css` + `primitives.tsx` + `tokens.css`，再按需复制某个场景文件中的组件。

### 方式 B：整场景起手

```bash
cp tokens.css primitives.css primitives.tsx  <你的项目>/src/design/
cp monitoring-console.tsx                    <你的项目>/src/pages/
```

然后改 `tokens.css` 的 Primitive 层（品牌色、字号），其余全部自动跟随。

### 方式 C：只取模式，不取代码

把某份文件当作**结构参考**——例如只看 `admin-console.tsx` 的 `ErrorSummary` 与 `MemberForm`，
理解「顶置摘要 + 行内错误 + 焦点管理」如何组织，然后在自己的技术栈里实现。

---

## 五、改这些模板时要注意

| 注意 | 说明 |
|------|------|
| **改色先改 Primitive 层** | 改 `--brand-*` 会带动 hover/active/ring 全链路；改组件里的 `var(--color-primary)` 则只影响一处，会破坏一致性 |
| **密度改 `data-density`，不要手改间距** | 换密度就是换整张尺度表；手改会造成尺度外数值 |
| **`--r-micro` 与 `--r-sheet` 是说明性例外** | 前者给进度条/小色块，后者给底部面板。除此之外圆角只用 3 档 |
| **图表系列色在 `tokens.css`** | 不在组件里。因为图表配色是设计决策，必须集中管理 |
| **新增色相前先读 `anti-ai/D2`** | 界面色相上限 4（1 主 + 1 强调 + 余量）；功能色与图表系列单列 |
| **不要为了「去 AI 味」删掉状态** | 见每份文件头的误杀防护清单 |

---

## 六、这些模板的实测评分

用本技能包自己的 `scripts/ai_flavor_audit.py` 审计本目录：

| 指标 | 结果 |
|------|------|
| AI 味总分 | **2.9 / 100（A 档 — 有立场，可交付）** |
| 界面色相 | 2（品牌青蓝 + 强调琥珀；功能色与图表系列已排除） |
| 裸 hex（组件内） | **0** |
| 非对称结构 | 9 处 |
| 圆角档位 | 3 档（token）+ 2 个说明性例外 |
| 阴影档位 | 2 档（token） |
| 字号档位 | 9 档，最大/最小 6.5× |
| 状态覆盖 | hover / focus / active / disabled / loading / empty / error **全部齐全** |
| emoji 作图标 | 0 |

作为对照，一个刻意构造的「典型 AI 味」样本（紫粉渐变 + emoji + 三等分卡 + 无状态）得 **43.4 分（C 档）**。

> 复现命令：
> ```bash
> python scripts/ai_flavor_audit.py assets/scenario-templates --scenario ui
> ```

---

## 七、尚未覆盖（v0.3 候选）

- Vue 3 + Element Plus 版本（当前仅 React）
- 场景专属的**空/错/加载**三态独立示范文件（现散落在各场景内）
- 图表组件库（ECharts / Chart.js）的 token 桥接层
- 深色模式的独立校验页（当前靠审计脚本与人工核对）
