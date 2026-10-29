# 三层 Token 架构

> **为什么必须建 token**：它是本技能包唯一贯穿所有环节的工程基石。
> 没有 token，G4 的去 AI 味改造会变成「到处打补丁」——每改一处就引入一处新的不一致。

---

## 一、三层结构

```
┌──────────────────────────────────────────────┐
│  Component Tokens（组件层）                   │  按组件覆写
│  --button-bg / --card-padding                │
├──────────────────────────────────────────────┤
│  Semantic Tokens（语义层）                    │  按用途取别名
│  --color-primary / --spacing-section         │
├──────────────────────────────────────────────┤
│  Primitive Tokens（原始层）                   │  裸设计值
│  --color-blue-600 / --space-4                │
└──────────────────────────────────────────────┘
```

| 层 | 目的 | 什么时候改 |
|----|------|-----------|
| Primitive | 基础值（颜色、尺寸） | 极少改——地基 |
| Semantic | 赋予含义 | **切换主题时** |
| Component | 组件定制 | 按组件需要 |

```css
/* Primitive */
--color-blue-600: #2563EB;

/* Semantic */
--color-primary: var(--color-blue-600);

/* Component */
--button-bg: var(--color-primary);
```

### 三层换来的三个能力

1. **主题切换零成本** —— 暗色只覆盖语义层
   ```css
   .dark { --color-background: var(--color-gray-900); }
   ```
2. **组件定制不污染全局** —— 改 `--button-bg` 不影响 Card
3. **可被工具校验** —— 能扫描出「绕过 token 的硬编码值」

---

## 二、原始层（Primitive）

```css
:root {
  /* 色彩：按色相 + 明度档命名 */
  --color-gray-50: #F9FAFB;
  --color-gray-900: #111827;
  --color-blue-500: #3B82F6;
  --color-blue-600: #2563EB;

  /* 间距：4px 基数 */
  --space-1: 0.25rem;  /* 4px  */
  --space-2: 0.5rem;   /* 8px  */
  --space-3: 0.75rem;  /* 12px */
  --space-4: 1rem;     /* 16px */
  --space-6: 1.5rem;   /* 24px */
  --space-8: 2rem;     /* 32px */
  --space-12: 3rem;    /* 48px */
  --space-16: 4rem;    /* 64px */

  /* 字号 */
  --font-size-xs: 0.75rem;   /* 12px */
  --font-size-sm: 0.875rem;  /* 14px */
  --font-size-base: 1rem;    /* 16px */
  --font-size-lg: 1.125rem;  /* 18px */
  --font-size-xl: 1.25rem;   /* 20px */

  /* 圆角：3 档纪律 */
  --radius-sm: 0.25rem;      /* 控件 */
  --radius-default: 0.5rem;  /* 表面 */
  --radius-full: 9999px;     /* 胶囊 */

  /* 阴影：3 档纪律 */
  --shadow-raised: 0 1px 2px rgb(0 0 0 / 0.05);
  --shadow-card:   0 2px 8px rgb(0 0 0 / 0.08);
  --shadow-popup:  0 6px 16px rgb(0 0 0 / 0.12);

  /* 时长 */
  --duration-fast: 100ms;
  --duration-normal: 150ms;
  --duration-slow: 300ms;
}
```

### 原始层的纪律

- **圆角 ≤3 档**、**阴影 ≤3 档**。超过就是 D3 装饰过载。
- 间距只允许取尺度内的值。**禁止魔法数字**（`11px`、`13px`）。
- 色相数量在原始层就可以收敛：**≤3 个色相 + 中性灰阶**。

---

## 三、语义层（Semantic）

```css
:root {
  /* 背景与前景 */
  --color-background: var(--color-gray-50);
  --color-foreground: var(--color-gray-900);

  /* 表面（三层模型） */
  --color-surface:        #FFFFFF;   /* 容器表面 */
  --color-surface-layout: #F5F5F5;   /* 页面背景 */
  --color-surface-raised: #FFFFFF;   /* 浮层，靠阴影区分 */

  /* 主色 */
  --color-primary:            var(--color-blue-600);
  --color-primary-hover:      var(--color-blue-700);
  --color-primary-foreground: #FFFFFF;

  /* 中性文字 4 档 */
  --color-text-primary:   var(--color-gray-900);
  --color-text-secondary: var(--color-gray-600);
  --color-text-tertiary:  var(--color-gray-500);
  --color-text-disabled:  var(--color-gray-400);

  /* 功能色 */
  --color-success: #16A34A;
  --color-warning: #D97706;
  --color-error:   #DC2626;
  --color-info:    #2563EB;

  /* 边框与焦点 */
  --color-border: var(--color-gray-200);
  --color-ring:   var(--color-blue-500);

  /* 间距语义 */
  --spacing-component: var(--space-4);   /* 16px 组件内 */
  --spacing-section:   var(--space-8);   /* 32px 区块间 */
  --spacing-page:      var(--space-12);  /* 48px 章节间 */
}
```

### 语义层的关键约定

1. **文字用 `rgba(0,0,0,α)` 体系优于不透明灰 hex。**
   原因：文字浮在有色卡片上时，不透明灰会「破坏色相」，半透明黑能自然融合。
   标准四档：`0.88`（主）/ `0.65`（次）/ `0.45`（三级）/ `0.25`（占位与禁用）。
2. **`--color-surface-raised` 与 `--color-surface` 可能同色**，靠阴影区分——这是刻意的（三层表面模型）。
3. **功能色只用于状态，不用于装饰。** 分类色（标签、图表）另设，**不得用于主操作**。

### 暗色覆盖

```css
.dark {
  --color-background: var(--color-gray-950);
  --color-foreground: var(--color-gray-50);
  --color-surface:        var(--color-gray-900);
  --color-surface-layout: var(--color-gray-950);
  --color-text-primary:   var(--color-gray-50);
  --color-text-secondary: var(--color-gray-400);
  --color-border:         var(--color-gray-800);
  /* 注意：暗色下必须重设边框，不可沿用亮色值 */
}
```

> ⚠️ **暗色不是反转颜色。** 必须：去饱和、重设边框、独立测对比、单独检视状态色。

---

## 四、组件层（Component）

```css
:root {
  /* Button */
  --button-bg:         var(--color-primary);
  --button-fg:         var(--color-primary-foreground);
  --button-bg-hover:   var(--color-primary-hover);
  --button-padding-x:  var(--space-4);
  --button-padding-y:  var(--space-2);
  --button-radius:     var(--radius-sm);
  --button-height:     32px;

  /* Input */
  --input-bg:          var(--color-surface);
  --input-border:      var(--color-border);
  --input-focus-ring:  var(--color-ring);
  --input-height:      32px;

  /* Card */
  --card-bg:      var(--color-surface);
  --card-border:  var(--color-border);
  --card-padding: var(--space-6);
  --card-radius:  var(--radius-default);
  --card-shadow:  var(--shadow-card);
}
```

### 组件层的核心用法：变量覆写实现变体

**这是最优雅的变体实现方式**——组件只消费 `--component-*`，变体只覆写这些局部变量：

```css
.button        { --button-height: 40px; --button-radius: var(--radius-sm); }
.button.sm     { --button-height: 32px; }
.button.lg     { --button-height: 48px; }

.button.primary     { --button-bg: var(--color-primary); }
.button.secondary   { --button-bg: var(--color-surface); }
.button.destructive { --button-bg: var(--color-error); }

.button {
  height: var(--button-height);
  border-radius: var(--button-radius);
  background: var(--button-bg, var(--color-primary));
  color: var(--button-fg, #fff);
}
```

**好处**：不写重复 CSS，变体正交组合，新增变体不改主样式。

---

## 五、命名约定

```
--{category}-{item}-{variant}-{state}
```

| 形式 | 示例 |
|------|------|
| category-item | `--color-primary` |
| category-item-state | `--color-primary-hover` |
| component-property-state | `--button-bg-hover` |
| category-semantic-variant | `--space-section-sm` |

| 分类 | 取值 |
|------|------|
| color | primary / secondary / muted / destructive / success / warning / error / info |
| space | 1, 2, 3, 4, 6, 8, 12, 16 / component / section / page |
| font-size | xs, sm, base, lg, xl |
| radius | sm, default, full |
| shadow | raised, card, popup |
| duration | fast, normal, slow |

---

## 六、W3C DTCG 格式

若需与 Design Tokens 生态工具互通，token JSON 应遵循 DTCG 规范：

```json
{
  "color": {
    "blue": {
      "600": { "$value": "#2563EB", "$type": "color" }
    }
  },
  "space": {
    "4": { "$value": "1rem", "$type": "dimension" }
  }
}
```

起步模板见 `assets/design-tokens.starter.json`。

---

## 七、文件组织

```
tokens/
├── primitives.css     # 原始值
├── semantic.css       # 用途别名
├── components.css     # 组件 token
└── index.css          # 汇总导入
```

或单文件 + 分层注释：

```css
/* === PRIMITIVES === */
:root { ... }

/* === SEMANTIC === */
:root { ... }

/* === COMPONENTS === */
:root { ... }

/* === DARK MODE === */
.dark { ... }
```

---

## 八、落地纪律

| 纪律 | 说明 |
|------|------|
| **组件内禁止裸 hex** | 一律引用语义 token。这是 D2-4 的判定标准 |
| **禁止魔法数字间距** | 尺度里没有的档位 → 设计需要重审，不是打补丁 |
| **暗色独立设计** | 不反转颜色、去饱和、重设边框、独立测对比 |
| **圆角与阴影限档** | 各 ≤3 档 |
| **语义优先** | 组件消费语义 token，语义消费原始 token |
| **文档化** | 每个 token 记录用途 |
