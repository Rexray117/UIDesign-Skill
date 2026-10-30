# UX 规则体系

按**影响度排序的十类规则**。冲突时按优先级裁决：序号小的优先。

| 优先级 | 类别 | 影响 | 必须做到 | 反面模式 |
|:------:|------|:----:|----------|----------|
| 1 | 无障碍 | **CRITICAL** | 对比 4.5:1、Alt 文本、键盘导航、aria-label | 移除焦点环、纯图标按钮无标签 |
| 2 | 触控与交互 | **CRITICAL** | 最小 44×44px、8px+ 间距、加载反馈 | 只依赖 hover、状态瞬时切换（0ms） |
| 3 | 性能 | HIGH | WebP/AVIF、懒加载、预留空间（CLS < 0.1） | 布局抖动、累积布局偏移 |
| 4 | 风格选择 | HIGH | 匹配产品类型、一致性、SVG 图标 | 随机混搭扁平与拟物、emoji 当图标 |
| 5 | 布局与响应式 | HIGH | 移动优先断点、viewport meta、无横向滚动 | 横向滚动、固定 px 容器宽、禁用缩放 |
| 6 | 排版与色彩 | MEDIUM | 基准字号、行高 1.5、语义化色彩 token | 正文过小、灰底灰字、组件内裸 hex |
| 7 | 动效 | MEDIUM | 语境化时长、动效传达含义、空间连续性 | 所有转场同一时长、动画宽高、忽略 reduced-motion |
| 8 | 表单与反馈 | MEDIUM | 可见标签、错误就近、帮助文本、渐进披露 | 仅占位符当标签、错误只在顶部、一上来铺满 |
| 9 | 导航模式 | HIGH | 可预测返回、底部导航 ≤5、深度链接 | 导航过载、返回行为破坏、无深度链接 |
| 10 | 图表与数据 | LOW | 图例、Tooltip、无障碍配色 | 仅靠颜色区分含义 |

> 详细规则见 `data/ux-guidelines.csv`（119 条）与 `data/react-performance.csv`（44 条）。

---

## 第 1 类 · 无障碍

完整内容见 `accessibility.md`。核心条目：

| 规则 | 要求 |
|------|------|
| color-contrast | 正文 ≥4.5:1；大字 ≥3:1 |
| focus-states | 可见焦点环 2–4px |
| alt-text | 有意义图像给描述性 alt |
| aria-labels | 图标按钮必须有 `aria-label` |
| icon-context | 图标语义按用法判定（装饰/有意义/交互） |
| keyboard-nav | Tab 顺序与视觉顺序一致，全键盘支持 |
| form-labels | 用 `label` + `for` |
| skip-links | 提供跳到主内容 |
| heading-hierarchy | `h1`→`h6` 顺序不跳级 |
| color-not-only | 颜色不是唯一指示 |
| dynamic-type | 支持系统字号缩放，不截断 |
| reduced-motion | 尊重 `prefers-reduced-motion` |
| voiceover-sr | 有意义标签、逻辑阅读顺序 |
| escape-routes | 模态与多步流程提供取消/返回 |
| keyboard-shortcuts | 保留系统快捷键；拖拽给键盘替代 |
| focus-not-obscured | 粘性 UI 不遮挡聚焦控件（WCAG 2.2 AA） |
| dragging-alternative | 拖拽需单指与键盘替代（WCAG 2.2 AA） |
| web-target-size | Web 指针目标 ≥24×24 CSS px（WCAG 2.2 AA） |
| consistent-help | 帮助机制顺序一致（WCAG 2.2 A） |
| redundant-entry | 复用已提供的信息（WCAG 2.2 A） |
| accessible-authentication | 允许密码管理器与粘贴；提供非认知型路径 |
| auto-rotation-controls | 轮播有暂停控件，聚焦或 reduced-motion 时停止 |
| contextual-live-badge-updates | 计数/状态变化以完整短语播报，不移动焦点 |

---

## 第 2 类 · 触控与交互

| 规则 | 要求 |
|------|------|
| touch-target-size | 44×44pt（Apple）/ 48×48dp（Material）；热区可超出视觉边界 |
| touch-spacing | 目标间距 ≥8px |
| hover-vs-tap | 主交互用点击/触控；**不依赖 hover** |
| loading-buttons | 异步时禁用 + 进度指示 |
| error-feedback | 错误信息紧邻问题处 |
| cursor-pointer | 可点击元素加 `cursor: pointer`（Web） |
| gesture-conflicts | 主内容避免横向滑动；优先纵向滚动 |
| tap-delay | 用 `touch-action: manipulation` 消除 300ms 延迟（Web） |
| standard-gestures | 使用平台标准手势，不重新定义 |
| system-gestures | 不阻塞系统手势 |
| press-feedback | 按下有视觉反馈（ripple / 高亮） |
| haptic-feedback | 确认与重要操作用触感，不过度 |
| gesture-alternative | 关键操作提供可见控件替代纯手势 |
| safe-area-awareness | 主触控目标远离刘海、灵动岛、手势条、屏幕边缘 |
| no-precision-required | 不要求像素级精确点击 |
| swipe-clarity | 滑动操作有明确提示 |
| drag-threshold | 设移动阈值防误拖 |

---

## 第 3 类 · 性能

| 规则 | 要求 |
|------|------|
| image-optimization | WebP/AVIF + `srcset`/`sizes` + 非关键图懒加载 |
| image-dimension | 声明 `width`/`height` 或 `aspect-ratio` 防 CLS |
| font-loading | `font-display: swap/optional`；预留空间 |
| font-preload | 只预加载关键字体 |
| critical-css | 首屏 CSS 优先（内联关键 CSS） |
| lazy-loading | 非首屏组件动态导入 / 路由级拆分 |
| bundle-splitting | 按路由/功能拆包，降低首屏与 TTI |
| third-party-scripts | 异步/defer 加载；审计并移除不必要的 |
| reduce-reflows | 批量读、批量写，避免读写交错 |
| content-jumping | 异步内容预留空间（CLS） |
| lazy-load-below-fold | 折叠线以下的图与重媒体用 `loading="lazy"` |
| virtualize-lists | **50+ 条目必须虚拟化** |
| main-thread-budget | 每帧 <16ms（60fps）；重任务移出主线程 |
| progressive-loading | >1s 用骨架屏/微光，不用长期阻塞 spinner |
| input-latency | 点击/滚动反馈 <100ms |
| tap-feedback-speed | 点击后 100ms 内可见反馈 |
| debounce-throttle | 高频事件（scroll/resize/input）加防抖节流 |
| offline-support | 提供离线状态提示与基础降级 |
| network-fallback | 弱网提供降级模式（低清图、少动效） |

---

## 第 4 类 · 风格选择

| 规则 | 要求 |
|------|------|
| style-match | 风格匹配产品类型（查 `references/styles/index.md` 适配矩阵） |
| consistency | 全站使用同一风格 |
| no-emoji-icons | 用 SVG 图标（Lucide / Heroicons / Phosphor），**不用 emoji** |
| color-palette-from-product | 配色从产品/行业出发 |
| effects-match-style | 阴影、模糊、圆角与所选风格一致 |
| platform-adaptive | 尊重平台惯例（iOS HIG vs Material） |
| state-clarity | hover/pressed/disabled 状态清晰且不脱离风格 |
| elevation-consistent | 统一的层级/阴影尺度，**禁止随机阴影值** |
| dark-mode-pairing | 明暗变体一起设计，保持品牌、对比与风格一致 |
| icon-style-consistent | 全站同一图标集（线宽、圆角一致） |
| system-controls | 优先系统原生控件，仅在品牌需要时自定义 |
| blur-purpose | 模糊用于指示背景可关闭（模态/抽屉），**不做装饰** |
| primary-action | 每屏只有 1 个主 CTA；次要动作视觉从属 |

---

## 第 5 类 · 布局与响应式

| 规则 | 要求 |
|------|------|
| viewport-meta | `width=device-width, initial-scale=1`；**不禁用缩放** |
| mobile-first | 移动优先，再放大到平板与桌面 |
| breakpoint-consistency | 系统化断点（375 / 768 / 1024 / 1440） |
| readable-font-size | 移动端正文 ≥16px（避免 iOS 自动缩放） |
| line-length-control | 移动 35–60 字符；桌面 60–75 字符 |
| horizontal-scroll | 移动端无横向滚动 |
| spacing-scale | 4pt/8dp 递增间距体系 |
| touch-density | 组件间距适合触控——不拥挤，不误触 |
| container-width | 桌面统一的 `max-width` |
| z-index-management | 定义层级尺度（0/10/20/40/100/1000） |
| fixed-element-offset | 固定栏为内容预留安全内边距 |
| scroll-behavior | 避免嵌套滚动干扰主滚动 |
| viewport-units | 移动端优先 `min-h-dvh` 而非 `100vh` |
| orientation-support | 横屏可读可用 |
| content-priority | 移动端先显示核心内容，次要内容折叠 |
| visual-hierarchy | 用字号/间距/对比建立层次，**不只靠颜色** |
| compact-label-overflow | 按语义选 badge / 状态标签 / 筛选 chip；保证关键标签可用，不可避免的截断要对指针与键盘用户可见 |
| chip-collection-reflow | 集合先换行再缩标签；`+n` 溢出摘要必须是可操作的下拉披露 |

---

## 第 6 类 · 排版与色彩

| 规则 | 要求 |
|------|------|
| line-height | 正文 1.5–1.75 |
| line-length | 65–75 字符 |
| font-pairing | 标题与正文字体性格匹配 |
| font-scale | 一致的字号尺度（如 12/14/16/18/24/32） |
| contrast-readability | 深字压浅底 |
| text-styles-system | 用平台字阶体系（display/headline/title/body/label） |
| weight-hierarchy | 字重强化层次：标题 600–700、正文 400、标签 500 |
| color-semantic | 定义语义色 token（primary/secondary/error/surface），**不在组件内写裸 hex** |
| color-dark-mode | 暗色用去饱和/更亮的色调变体，**不是反转**；独立测对比 |
| color-accessible-pairs | 前后景对 ≥4.5:1（AA）或 7:1（AAA） |
| color-not-decorative-only | 功能性颜色必须配图标/文字 |
| truncation-strategy | 优先换行；必须截断时用省略号 + Tooltip/展开给全文 |
| letter-spacing | 尊重平台默认字距；**正文不收紧** |
| number-tabular | 数据列、价格、计时用等宽数字防跳动 |
| whitespace-balance | 用留白分组与分隔，避免视觉杂乱 |
| heading-line-balance | 短标题用平衡换行；**不要用不换行空格强行绑住末尾词** |
| long-token-wrapping | URL/ID/用户内容用 `overflow-wrap: anywhere`；**不对正文用 `word-break: break-all`** |

---

## 第 7 类 · 动效

完整内容见 `motion.md`。核心条目：

| 规则 | 要求 |
|------|------|
| duration-timing | 按距离、复杂度、平台、语境选共享时长 token；**不是所有转场同一时长** |
| transform-performance | 只用 `transform`/`opacity`；**不动画 width/height/top/left** |
| loading-states | 反馈匹配预期等待；避免瞬时闪烁与无解释长等待 |
| excessive-motion | 每屏动画元素 ≤1–2 个 |
| easing | 到达减速、离开加速、恒定速率用线性 |
| motion-meaning | 每个动效表达因果，不做装饰 |
| state-transition | 状态变化平滑，不硬切 |
| continuity | 页面转场保持空间连续 |
| parallax-subtle | 视差克制，尊重 reduced-motion |
| spring-physics | 优先弹簧/物理曲线 |
| exit-faster-than-enter | 出场 ≈ 入场 60–70% |
| stagger-sequence | 列表/网格错峰 30–50ms |
| shared-element-transition | 跨屏共享元素转场 |
| interruptible | 用户操作立即取消动画 |
| no-blocking-animation | 动画期间 UI 保持可交互 |
| fade-crossfade | 同容器内容替换用交叉淡入 |
| scale-feedback | 按下缩放 0.95–1.05，松开复位 |
| gesture-feedback | 拖拽/滑动/捏合实时跟随手指 |
| hierarchy-motion | 用位移/缩放方向表达层级（下方进入=更深） |
| motion-consistency | 全局统一时长与缓动 |
| opacity-threshold | 淡出不停在 <0.2 |
| modal-motion | 模态从触发源出发 |
| navigation-direction | 前进左/上，后退右/下 |
| layout-shift-avoid | 动画不引起 reflow 或 CLS |
| cancellable-state-transitions | 快速状态变化安全取消/替换，**正确性不依赖动画结束事件** |

---

## 第 8 类 · 表单与反馈

| 规则 | 要求 |
|------|------|
| input-labels | 每个输入有可见标签（非仅占位符） |
| error-placement | 错误显示在相关字段下方，用 `aria-describedby` 关联 |
| submit-feedback | 提交有 loading → 成功/错误状态 |
| required-indicators | 标记必填字段 |
| empty-states | 无内容时给有帮助的说明与行动 |
| toast-dismiss | toast 3–5s 自动消失 |
| confirmation-dialogs | 破坏性操作前确认 |
| input-helper-text | 复杂输入提供持久帮助文本 |
| disabled-states | 禁用用透明度 0.38–0.5 + cursor 变化 + 语义属性 |
| progressive-disclosure | 复杂选项渐进披露，不一上来铺满 |
| inline-validation | **onBlur 校验**（非逐键）；用户完成输入后才显示错误 |
| input-type-keyboard | 语义化输入类型触发正确键盘 |
| password-toggle | 密码字段提供显示/隐藏 |
| autofill-support | 支持自动填充属性 |
| undo-support | 破坏性或批量操作支持撤销 |
| success-feedback | 完成动作给简短视觉确认 |
| error-recovery | 错误信息含明确恢复路径（重试/编辑/帮助） |
| multi-step-progress | 多步流程显示步骤指示，允许返回 |
| form-autosave | 长表单自动保存草稿 |
| sheet-dismiss-confirm | 有未保存改动时关闭前确认 |
| error-clarity | 错误说明「原因 + 怎么修」，不只写「输入无效」 |
| field-grouping | 相关字段逻辑分组 |
| read-only-distinction | 只读与禁用在视觉与语义上可区分 |
| focus-management | 多错误提交后聚焦错误摘要；无摘要则聚焦首个无效字段 |
| error-summary | 提交失败后顶部放可聚焦摘要，每项链接到字段，保留行内错误 |
| touch-friendly-input | 移动端输入高度 ≥44px |
| destructive-emphasis | 破坏性操作用危险色，并与主操作视觉分离 |
| toast-accessibility | toast 不抢焦点；用 `aria-live="polite"` |
| aria-live-errors | 表单错误用 live region 或 `role="alert"` |
| contrast-feedback | 错误/成功状态色 ≥4.5:1 |
| timeout-feedback | 请求超时有明确反馈与重试 |

---

## 第 9 类 · 导航模式

| 规则 | 要求 |
|------|------|
| bottom-nav-limit | 底部导航 ≤5 项；**图标 + 文字** |
| drawer-usage | 抽屉用于次级导航，不放主要动作 |
| back-behavior | 返回可预期且一致；保留滚动与状态 |
| deep-linking | 所有关键页可达 URL（含筛选与分页） |
| tab-bar-ios | iOS 用底部 Tab Bar 承载顶层导航 |
| top-app-bar-android | Android 用 Top App Bar + 导航图标 |
| nav-label-icon | 导航项必须有图标 + 文字 |
| nav-state-active | 当前位置必须高亮 |
| nav-hierarchy | 一级（Tab/底栏）与二级（抽屉/设置）清晰分离 |
| modal-escape | 模态与抽屉有明确关闭；移动端支持下滑关闭 |
| search-accessible | 搜索易达；提供最近/建议查询 |
| breadcrumb-web | 层级 ≥3 时用面包屑 |
| state-preservation | 返回恢复滚动位置、筛选状态与输入 |
| gesture-nav-support | 支持系统手势导航（iOS 侧滑返回、Android 预测性返回）不冲突 |
| tab-badge | 导航徽标节制使用；访问后清除 |
| overflow-menu | 动作超出空间时用溢出菜单，不硬塞 |
| bottom-nav-top-level | 底部导航只用于顶层，不嵌套子导航 |
| adaptive-navigation | ≥1024px 用侧边栏；小屏用底部/顶部导航 |
| back-stack-integrity | 不静默重置导航栈或意外跳回首页 |
| navigation-consistency | 导航位置全站一致 |
| avoid-mixed-patterns | 同一层级不混用 Tab + 侧栏 + 底部导航 |
| modal-vs-navigation | **不用模态做主导航流程** |
| focus-on-route-change | 路由切换后焦点移到主内容区 |
| persistent-nav | 从深层页仍可达核心导航 |
| destructive-nav-separation | 危险操作（注销、删号）与常规导航视觉与空间分离 |
| empty-nav-state | 导航目的地不可用时解释原因，不静默隐藏 |

---

## 第 10 类 · 图表与数据

完整内容见 `charts.md`。核心条目：

| 规则 | 要求 |
|------|------|
| chart-type | 图表类型匹配数据类型（趋势→折线，比较→柱形，占比→环/饼） |
| color-guidance | 无障碍配色；**避免仅红绿对** |
| data-table | 提供表格替代（图表对屏幕阅读器不友好） |
| pattern-texture | 用图案/纹理/形状补充颜色 |
| legend-visible | 始终显示图例，靠近图表（不在折叠线以下） |
| tooltip-on-interact | hover（Web）或 tap（移动）显示精确值 |
| axis-labels | 坐标轴有单位与可读刻度；移动端不截断不旋转标签 |
| responsive-chart | 小屏重排或简化（横向柱形、减少刻度） |
| empty-data-state | 无数据给有意义空状态，**不留空图表** |
| loading-chart | 骨架屏占位，**不显示空坐标轴** |
| animation-optional | 入场动画尊重 reduced-motion；数据应立即可读 |
| large-dataset | 1000+ 数据点聚合或采样；提供下钻 |
| number-formatting | 按区域格式化数字、日期、货币 |
| touch-target-chart | 图表交互点 ≥44pt 或触摸时扩展 |
| no-pie-overuse | **饼图/环形 >5 类改柱形** |
| contrast-data | 数据线柱 vs 背景 ≥3:1；数据标签 ≥4.5:1 |
| legend-interactive | 图例可点击切换系列显隐 |
| direct-labeling | 小数据集直接在图上标值，减少视线移动 |
| tooltip-keyboard | Tooltip 可键盘触达，不只 hover |
| sortable-table | 表格支持排序并用 `aria-sort` 指示 |
| axis-readability | 刻度不拥挤；小屏自动跳过 |
| data-density | 单图限制信息密度，必要时拆图 |
| trend-emphasis | 强调趋势而非装饰；避免遮挡数据的重渐变/阴影 |
| gridline-subtle | 网格线低对比，不与数据竞争 |
| focusable-elements | 图表交互元素可键盘导航 |
| screen-reader-summary | 提供文字摘要或 `aria-label` 描述图表关键结论 |
| error-state-chart | 数据加载失败显示错误 + 重试，**不显示破图** |
| export-option | 数据密集产品提供 CSV/图片导出 |
| drill-down-consistency | 下钻交互保持清晰返回路径与层级面包屑 |
| time-scale-clarity | 时间序列图明确标注时间粒度（日/周/月）并允许切换 |

---

## 冲突裁决示例

| 冲突 | 裁决 |
|------|------|
| 无障碍（1）vs 视觉简洁（4） | **无障碍胜。** 焦点环不许为「干净」而删 |
| 触控目标（2）vs 信息密度（6） | **触控胜。** 移动端密度必须降到触控可用的水平 |
| 一致性（4）vs 页面局部最优（5） | **一致性胜**（管理界面尤其） |
| 动效表现（7）vs 性能（3） | **性能胜。** 掉帧的动画不如没有动画 |
| 图表装饰（10）vs 数据准确（10） | **准确胜。** 装饰遮挡数据即删除 |
