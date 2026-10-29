/* ============================================================================
 * 场景模板 1 / 6 · 用户界面（core-user-interface）
 * ----------------------------------------------------------------------------
 * 定位：让用户第一次就知道该做什么，第十次依然顺手。
 * 判据：首次任务完成率 + 重复使用效率（两者常冲突，解决冲突就是设计内容）。
 *
 * 演示规则：
 *   · core-user-interface.md §三  每屏只有一个主行动；首次可用、进阶可深
 *   · core-user-interface.md §5.6 信任来自可验证信息（具体数字 + 明确边界 + 代价）
 *   · anti-ai/D1                  偏置布局，非居中对称（Hero 左文右览）
 *   · anti-ai/D3                  圆角 ≤3 档、阴影 ≤3 档；只有可点击卡才抬升
 *   · anti-ai/D5                  结构由内容决定，不用「标题+副标题+三卡片」
 *   · anti-ai/D6                  文案含具体数字与边界，无空洞正向词
 *   · components-states.md        六态齐全；loading 不改宽度
 *   · layout-grid.md              区块间距 ≥ 内部间距 ×3；非对称 ≥3 处
 *   · accessibility.md            焦点可见、语义标签、色非唯一指示
 *
 * 场景默认旋钮：--variance 5 / --motion 4 / --density 5
 * 推荐风格：01 Swiss Minimalism · 09 Glassmorphism · 22 Material 3 Expressive
 * ==========================================================================*/

import React, { useState } from 'react';
import {
  Alert, Button, Card, Field, IconArrowRight, IconButton, IconCheck, IconClose,
  EmptyState, Input, Panel, SectionHead, Skeleton, StatusBadge, Tag,
  ToastProvider, VisuallyHidden,
} from './primitives';

/* ==========================================================================
 * 1 · 应用头部 —— 一级类目 2–7 项，标题 4–15 字符，当前项必须高亮
 * ========================================================================*/

export function AppHeader({
  items, current, onNavigate, user,
}: {
  items: Array<{ id: string; label: string }>;
  current: string;
  onNavigate: (id: string) => void;
  user: { name: string; initials: string };
}) {
  return (
    <header
      data-sticky
      style={{
        position: 'sticky', top: 0, zIndex: 'var(--z-sticky)',
        display: 'flex', alignItems: 'center', gap: 'var(--space-gap)',
        padding: '0 var(--space-block)', height: 56,
        background: 'var(--color-surface)',
        borderBottom: '1px solid var(--color-border)',
      }}
    >
      {/* 偏置：品牌靠左、导航居中偏左、账户推到最右 —— 刻意不做均分 */}
      <a href="/" style={{
        display: 'flex', alignItems: 'center', gap: 'var(--sp-2)',
        fontWeight: 'var(--fw-semibold)', fontSize: 'var(--fs-5)',
        color: 'var(--color-text-1)', textDecoration: 'none',
      }}>
        <span aria-hidden="true" style={{
          width: 22, height: 22, borderRadius: 'var(--r-control)',
          background: 'var(--color-primary)', color: 'var(--color-primary-fg)',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 12, fontWeight: 600,
        }}>L</span>
        Leakwatch
      </a>

      <nav aria-label="主导航">
        <ul style={{ display: 'flex', gap: 'var(--sp-1)', listStyle: 'none', margin: 0, padding: 0 }}>
          {items.map((it) => {
            const active = it.id === current;
            return (
              <li key={it.id}>
                <button
                  type="button"
                  aria-current={active ? 'page' : undefined}
                  onClick={() => onNavigate(it.id)}
                  style={{
                    height: 32, padding: '0 var(--sp-3)',
                    border: 0, borderRadius: 'var(--r-control)',
                    background: active ? 'var(--color-surface-layout)' : 'transparent',
                    color: active ? 'var(--color-text-1)' : 'var(--color-text-2)',
                    fontWeight: active ? 'var(--fw-medium)' : 'var(--fw-regular)',
                    fontSize: 'var(--fs-4)', cursor: 'pointer',
                  }}
                >
                  {it.label}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div style={{ marginInlineStart: 'auto', display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
        <form role="search" onSubmit={(e) => e.preventDefault()}>
          <label htmlFor="global-search" className="sr-only">搜索</label>
          <Input
            id="global-search" type="search" placeholder="搜索项目、日志…"
            style={{ width: 200, minHeight: 32 }}
            onChange={() => { /* 受控省略 */ }}
          />
        </form>
        <IconButton
          label={`账户：${user.name}`}
          icon={<span aria-hidden="true" style={{ fontSize: 12, fontWeight: 600 }}>{user.initials}</span>}
          style={{ borderRadius: 'var(--r-pill)', background: 'var(--color-surface-layout)' }}
        />
      </div>
    </header>
  );
}

/* ==========================================================================
 * 2 · 主任务卡 —— 每屏唯一的清晰下一步
 * 差异法：突出方法不限于强化重点，也可以是弱化其他项
 * ========================================================================*/

export function PrimaryTaskCard({
  title, why, estimate, actionLabel, onAction, onDismiss,
}: {
  title: string; why: string; estimate: string;
  actionLabel: string; onAction: () => void; onDismiss: () => void;
}) {
  return (
    <Card primary style={{ padding: 'var(--space-gap)' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-gap)' }}>
        <div className="grow">
          {/* 标题与正文对比 ≥2×（24 / 13），含具体动作而非泛词 */}
          <h2 style={{ margin: 0, fontSize: 'var(--fs-6)', fontWeight: 600, letterSpacing: '-0.01em' }}>
            {title}
          </h2>
          <p style={{ margin: 'var(--sp-2) 0 0', color: 'var(--color-text-2)', fontSize: 'var(--fs-4)' }}>
            {why}
          </p>
          <p style={{ margin: 'var(--sp-1) 0 0', color: 'var(--color-text-3)', fontSize: 'var(--fs-3)' }}>
            大约 {estimate}
          </p>
        </div>
        <IconButton label="稍后处理" icon={<IconClose size={16} />} onClick={onDismiss} />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)', marginTop: 'var(--space-component)' }}>
        <Button icon={<IconCheck size={16} />} onClick={onAction}>{actionLabel}</Button>
        {/* 次级动作在视觉上明显降级为文字链 */}
        <a href="#detail" style={{
          color: 'var(--color-text-2)', fontSize: 'var(--fs-4)',
          textDecoration: 'underline', textUnderlineOffset: 3,
        }}>
          先看风险详情
        </a>
      </div>
    </Card>
  );
}

/* ==========================================================================
 * 3 · 可验证证据行 —— 信任来自具体数字，而非形容词
 * ==========================================================================*/

export function ProofRow({
  stats,
}: { stats: Array<{ value: string; unit?: string; label: string; source: string }> }) {
  return (
    <section aria-labelledby="proof-head">
      <SectionHead
        title={<span id="proof-head">上个月的实测</span>}
        desc="数据来自已接入的 1,240 个生产环境，非抽样估算"
      />
      <div style={{
        display: 'grid',
        // 非对称：3 项内容用 5 列切分（2/2/1），而非等宽三等分
        gridTemplateColumns: '2fr 2fr 1fr',
        gap: 'var(--space-gap)',
      }}>
        {stats.map((s) => (
          <Card key={s.label}>
            <div className="kpi__value kpi__value--sm">
              {s.value}
              {s.unit && <span className="kpi__unit">{s.unit}</span>}
            </div>
            <div style={{ marginTop: 'var(--sp-2)', fontSize: 'var(--fs-4)', color: 'var(--color-text-1)' }}>
              {s.label}
            </div>
            <div style={{ marginTop: 'var(--sp-1)', fontSize: 'var(--fs-2)', color: 'var(--color-text-3)' }}>
              来源：{s.source}
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}

/* ==========================================================================
 * 4 · 渐进披露 —— 高级选项默认收起，不一次铺满
 * ==========================================================================*/

export function ProgressiveDisclosure({
  title, count, children, defaultOpen = false,
}: { title: string; count: number; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const id = React.useId();
  return (
    <div>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((v) => !v)}
        style={{
          display: 'flex', alignItems: 'center', gap: 'var(--sp-2)',
          width: '100%', minHeight: 44, padding: '0 var(--space-component)',
          background: 'none', border: 0, cursor: 'pointer',
          color: 'var(--color-text-2)', font: 'inherit', fontSize: 'var(--fs-4)',
          textAlign: 'start',
        }}
      >
        <span className="grow">{title}</span>
        <Tag>{count} 项</Tag>
        <span aria-hidden="true" style={{
          transform: open ? 'rotate(180deg)' : 'none',
          transition: 'transform var(--dur-normal) var(--ease-move)',
          display: 'inline-flex',
        }}>
          ⌄
        </span>
        <VisuallyHidden>{open ? '已展开' : '已收起'}</VisuallyHidden>
      </button>
      {open && <div id={id} style={{ padding: 'var(--space-component)' }}>{children}</div>}
    </div>
  );
}

/* ==========================================================================
 * 5 · 反馈设置表单 —— 标签可见 · 持久帮助 · onBlur 校验 · 错误就地
 * ========================================================================*/

export function FeedbackForm({
  onSubmit,
}: { onSubmit: (payload: { email: string; message: string }) => Promise<void> }) {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [emailError, setEmailError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  // onBlur 校验：用户完成输入后才提示，不在逐键时打扰
  const validateEmail = () => {
    if (!email.trim()) { setEmailError('请填写邮箱——我们会用它回复你'); return; }
    setEmailError(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
      ? undefined
      : '邮箱缺少 @ 或域名部分，例如 name@company.com');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    validateEmail();
    if (emailError || !email.trim()) return;
    setBusy(true);
    try {
      await onSubmit({ email, message });
      setSent(true);
    } finally {
      setBusy(false);
    }
  };

  if (sent) {
    return (
      <Alert severity="ok" title="已收到，工单号 #48213">
        我们会在 1 个工作日内回复 <strong>{email}</strong>。如需撤回，点邮件里的链接即可。
      </Alert>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-gap)' }}>
      <Field label="邮箱" required hint="只用于回复，不会加入任何邮件列表" error={emailError}>
        {(p) => (
          <Input
            {...p} type="email" name="email" autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={validateEmail}
          />
        )}
      </Field>

      <Field label="发生了什么" hint="附上复现步骤会快很多；不用写得工整">
        {(p) => (
          <textarea
            {...p} rows={5} className="field__control" name="message"
            value={message} onChange={(e) => setMessage(e.target.value)}
            style={{ padding: 'var(--sp-2) var(--sp-3)', resize: 'vertical' }}
          />
        )}
      </Field>

      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)' }}>
        <Button type="submit" loading={busy}>提交给工程组</Button>
        <span style={{ fontSize: 'var(--fs-3)', color: 'var(--color-text-3)' }}>
          通常 4 小时内有人回
        </span>
      </div>
    </form>
  );
}

/* ==========================================================================
 * 6 · 列表区三态 —— loading / empty / error 齐全（缺一即缺陷）
 * ========================================================================*/

export function ProjectList({
  state, projects, onRetry, onCreate,
}: {
  state: 'loading' | 'empty' | 'error' | 'ready';
  projects: Array<{ id: string; name: string; env: string; lastRun: string; healthy: boolean }>;
  onRetry: () => void;
  onCreate: () => void;
}) {
  if (state === 'loading') {
    return (
      <div aria-busy="true" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
        <VisuallyHidden>正在加载项目</VisuallyHidden>
        <Skeleton h="72px" />
        <Skeleton h="72px" />
        <Skeleton h="72px" />
      </div>
    );
  }

  if (state === 'error') {
    return (
      <Alert
        severity="err"
        title="没能读到项目列表"
        action={<Button variant="secondary" onClick={onRetry}>重试</Button>}
      >
        网关在 12:04 返回 503。大概率是后端在重启，本地缓存的数据仍可查看。
      </Alert>
    );
  }

  if (state === 'empty') {
    return (
      <EmptyState
        title="还没有接入任何项目"
        hint="接入后，Leakwatch 会在每次部署后自动跑一遍检查，并把结果记在这里。"
        action={<Button onClick={onCreate}>接入第一个项目</Button>}
      />
    );
  }

  return (
    <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
      {projects.map((p) => (
        <li key={p.id}>
          <Card interactive onClick={() => { /* 导航到详情 */ }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-gap)' }}>
              <div className="grow">
                {/* 名称与元信息对比 4×（16 / 12？此处 20/13 ≈1.5×，靠字重补足） */}
                <div style={{ fontSize: 'var(--fs-5)', fontWeight: 'var(--fw-medium)' }}>{p.name}</div>
                <div style={{ marginTop: 2, fontSize: 'var(--fs-3)', color: 'var(--color-text-3)' }}>
                  {p.env} · 上次检查 {p.lastRun}
                </div>
              </div>
              <StatusBadge severity={p.healthy ? 'ok' : 'warn'}>
                {p.healthy ? '正常' : '有告警'}
              </StatusBadge>
              <span aria-hidden="true" style={{ color: 'var(--color-text-3)', display: 'inline-flex' }}>
                <IconArrowRight size={16} />
              </span>
            </div>
          </Card>
        </li>
      ))}
    </ul>
  );
}

/* ==========================================================================
 * 7 · 组装示例
 * ========================================================================*/

export function UserInterfacePage() {
  const [tab, setTab] = useState('overview');
  const [listState, setListState] = useState<'loading' | 'empty' | 'error' | 'ready'>('ready');

  return (
    <ToastProvider>
      <div data-density="standard" style={{ minHeight: '100dvh', background: 'var(--color-surface-layout)' }}>
        <AppHeader
          items={[
            { id: 'overview', label: '概览' },
            { id: 'projects', label: '项目' },
            { id: 'alerts', label: '告警' },
            { id: 'settings', label: '设置' },
          ]}
          current={tab}
          onNavigate={setTab}
          user={{ name: 'Chen Yu', initials: 'CY' }}
        />

        <main style={{
          maxWidth: 1120, marginInline: 'auto',
          padding: 'var(--space-block) var(--space-gap)',
          display: 'flex', flexDirection: 'column', gap: 'var(--space-block)',
        }}>
          {/* 首屏：一个主任务 + 一行可验证证据 */}
          <PrimaryTaskCard
            title="有 3 个项目本周没跑过检查"
            why="它们最近一次部署在 9 天前，中间的上游依赖变了 2 个版本。"
            estimate="4 分钟"
            actionLabel="现在跑这 3 个"
            onAction={() => setListState('loading')}
            onDismiss={() => setTab('settings')}
          />

          <ProofRow
            stats={[
              { value: '1,240', label: '已接入的生产环境', source: '后台接入表' },
              { value: '3.2', unit: '%', label: '误报率（30 日均值）', source: '告警回执统计' },
              { value: '11', unit: 'min', label: '从部署到出结果的中位数', source: '流水线埋点' },
            ]}
          />

          <SectionHead
            title="你的项目"
            desc="点任意一行进入详情；批量操作用左侧勾选"
            action={<Button variant="secondary" icon={<IconPlusInline size={16} />}>接入项目</Button>}
          />

          <ProjectList
            state={listState}
            onRetry={() => setListState('ready')}
            onCreate={() => setListState('empty')}
            projects={[
              { id: 'p1', name: 'checkout-api', env: '生产', lastRun: '2 小时前', healthy: true },
              { id: 'p2', name: 'ledger-worker', env: '生产', lastRun: '9 天前', healthy: false },
              { id: 'p3', name: 'web-frontend', env: '预发', lastRun: '12 分钟前', healthy: true },
            ]}
          />

          <Panel
            title="高级选项"
            meta="改完立即生效，不需要重启"
            actions={<Button variant="ghost" size="sm">导出配置</Button>}
            bodyClassName=""
          >
            <ProgressiveDisclosure title="采样与保留策略" count={4}>
              <p style={{ margin: 0, color: 'var(--color-text-2)', fontSize: 'var(--fs-4)' }}>
                默认保留 30 天明细与 13 个月聚合。降低采样率可以省存储费，但会漏掉长尾异常。
              </p>
            </ProgressiveDisclosure>
          </Panel>

          <FeedbackForm onSubmit={async () => { await new Promise((r) => setTimeout(r, 600)); }} />
        </main>
      </div>
    </ToastProvider>
  );
}

/* 本文件专用小图标（与 primitives 同族同线宽 1.5）—— 避免为一个图标扩大公共依赖 */
function IconPlusInline({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={1.5} strokeLinecap="round" aria-hidden="true" focusable="false">
      <path d="M12 5v14" /><path d="M5 12h14" />
    </svg>
  );
}
