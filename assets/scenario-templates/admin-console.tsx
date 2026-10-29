/* ============================================================================
 * 场景模板 3 / 6 · 管理界面（core-admin）
 * ----------------------------------------------------------------------------
 * 定位：让操作者在成百上千条记录中，稳定、可预期、不易出错地完成批量工作。
 * 判据：一致性 > 局部最优。核心成本是学习成本与误操作成本，不是视觉惊喜。
 *
 * 演示规则：
 *   · core-admin.md §三       可预期性优先；减少点击距离；错误可恢复；状态可见
 *   · core-admin.md §5.4      表格：粘性表头 aria-sort · 数字右对齐等宽 · 空值 -
 *   · core-admin.md §5.5      表单：标签对齐 · onBlur 校验 · 错误就近 + 顶置摘要
 *   · core-admin.md §5.7      重要失败不用 toast 单独承担
 *   · anti-ai/D6              按钮文案说结果（「删除这 12 条」而非「确定」）
 *   · anti-ai/D3              圆角/阴影限档；卡片不做 hover 抬升除非可点击
 *   · accessibility.md        表格 caption · 排序 aria-sort · 错误 aria-live
 *   · react-admin 范式        组合优于配置；provider 抽象；乐观更新 + 撤销
 *
 * ⚠️ 误杀防护（本场景第二高风险，改动前必读 false-positives.md）：
 *   ① 对称表单布局（标签右对齐）② 14px 基准 / 12px 表头
 *   ③ 全站一致无特例   ④ 大量重复结构   ⑤ 系统字体栈
 *   ⑥ 单色 UI   ⑦ 完整状态设计   ⑧ 默认无斑马纹
 *   判定口令：「改了之后，用户会不会更容易点错或找不到？」
 *
 * 场景默认旋钮：--variance 3 / --motion 2 / --density 7
 * 推荐风格：01 Swiss Minimalism · 05 Data-Dense Dashboard · 23 Fluent 2
 * ==========================================================================*/

import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  Alert, Button, Card, Field, IconButton, IconChevronDown, IconDownload,
  IconFilter, IconPlus, IconSearch, IconTrash, IconUndo, IconClose,
  Input, Modal, Panel, Select, StatusBadge, Tag, ToastProvider, VisuallyHidden,
  useToast, cn,
} from './primitives';

/* ========================================================================== */
/* 类型                                                                        */
/* ========================================================================== */

export type Member = {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'admin' | 'member';
  status: 'active' | 'invited' | 'suspended';
  seats: number;
  joinedAt: string;
};

export type SortState = { key: keyof Member; dir: 'asc' | 'desc' };
export type Filters = { q: string; role: string; status: string };

/* ========================================================================== */
/* 1 · 侧栏 + 顶栏 + 面包屑 —— 一级（侧栏）与二级（顶栏）清晰分离                  */
/* ========================================================================== */

export function AdminShell({
  nav, current, breadcrumb, actions, children,
}: {
  nav: Array<{ id: string; label: string; count?: number }>;
  current: string;
  breadcrumb: string[];
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div data-density="dense" style={{
      display: 'grid',
      // 左右布局的适配方案：左导航固定宽，右侧工作区动态伸缩
      gridTemplateColumns: '240px minmax(0, 1fr)',
      minHeight: '100dvh',
      background: 'var(--color-surface-layout)',
    }}>
      <aside style={{
        background: 'var(--color-surface)',
        borderInlineEnd: '1px solid var(--color-border)',
        padding: 'var(--space-component) var(--sp-3)',
        display: 'flex', flexDirection: 'column', gap: 'var(--sp-1)',
      }}>
        <div style={{
          padding: 'var(--sp-2) var(--sp-3)', fontWeight: 'var(--fw-semibold)',
          fontSize: 'var(--fs-5)', marginBottom: 'var(--sp-3)',
        }}>
          控制台
        </div>
        <nav aria-label="一级导航">
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
            {nav.map((it) => {
              const active = it.id === current;
              return (
                <li key={it.id}>
                  <a
                    href={`#${it.id}`}
                    aria-current={active ? 'page' : undefined}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 'var(--sp-2)',
                      minHeight: 36, padding: '0 var(--sp-3)',
                      borderRadius: 'var(--r-control)',
                      background: active ? 'var(--color-surface-layout)' : 'transparent',
                      // 当前态：背景 + 文字色 + 左侧指示条 三重编码
                      boxShadow: active ? 'inset 2px 0 0 var(--color-primary)' : 'none',
                      color: active ? 'var(--color-text-1)' : 'var(--color-text-2)',
                      fontWeight: active ? 'var(--fw-medium)' : 'var(--fw-regular)',
                      fontSize: 'var(--fs-4)', textDecoration: 'none',
                    }}
                  >
                    <span className="grow">{it.label}</span>
                    {typeof it.count === 'number' && (
                      <span className="tag num" style={{ lineHeight: '16px' }}>{it.count}</span>
                    )}
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>

      <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <header data-sticky style={{
          position: 'sticky', top: 0, zIndex: 'var(--z-sticky)',
          background: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)',
          padding: 'var(--sp-3) var(--space-block)',
        }}>
          {/* 面包屑：层级 ≥3 时使用，最多不超过 5 级 */}
          <nav aria-label="面包屑" style={{ marginBottom: 'var(--sp-2)' }}>
            <ol style={{ display: 'flex', gap: 'var(--sp-1)', listStyle: 'none', margin: 0, padding: 0,
              fontSize: 'var(--fs-2)', color: 'var(--color-text-3)' }}>
              {breadcrumb.map((b, i) => (
                <li key={b} style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-1)' }}>
                  {i > 0 && <span aria-hidden="true">/</span>}
                  {i === breadcrumb.length - 1
                    ? <span aria-current="page" style={{ color: 'var(--color-text-1)' }}>{b}</span>
                    : <a href={`#${b}`} style={{ color: 'inherit', textDecoration: 'none' }}>{b}</a>}
                </li>
              ))}
            </ol>
          </nav>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-gap)' }}>
            <h1 style={{ margin: 0, fontSize: 'var(--fs-6)', fontWeight: 'var(--fw-semibold)' }}>
              {breadcrumb[breadcrumb.length - 1]}
            </h1>
            <div style={{ marginInlineStart: 'auto', display: 'flex', gap: 'var(--sp-2)' }}>{actions}</div>
          </div>
        </header>

        <main style={{ padding: 'var(--space-block)', display: 'flex', flexDirection: 'column', gap: 'var(--space-block)' }}>
          {children}
        </main>
      </div>
    </div>
  );
}

/* ========================================================================== */
/* 2 · 筛选栏 —— 筛选状态必须进 URL（可分享、可返回恢复）                          */
/* ==========================================================================*/

export function FilterBar({
  filters, onChange, onReset, total, selectedCount,
}: {
  filters: Filters;
  onChange: (next: Partial<Filters>) => void;
  onReset: () => void;
  total: number;
  selectedCount: number;
}) {
  const active = Boolean(filters.q || filters.role || filters.status);
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-end', gap: 'var(--sp-3)',
      padding: 'var(--space-component)', background: 'var(--color-surface)',
      border: '1px solid var(--color-border)', borderRadius: 'var(--r-surface)',
    }}>
      {/* 标签可见 —— 不用 placeholder 当标签 */}
      <div className="field" style={{ minWidth: 240 }}>
        <label className="field__label" htmlFor="f-q">按姓名或邮箱搜索</label>
        <Input
          id="f-q" type="search" value={filters.q}
          onChange={(e) => onChange({ q: e.target.value })}
          placeholder="例如 chen 或 @acme.com"
        />
      </div>

      <div className="field" style={{ minWidth: 140 }}>
        <label className="field__label" htmlFor="f-role">角色</label>
        <Select id="f-role" value={filters.role} onChange={(e) => onChange({ role: e.target.value })}>
          <option value="">全部角色</option>
          <option value="owner">所有者</option>
          <option value="admin">管理员</option>
          <option value="member">成员</option>
        </Select>
      </div>

      <div className="field" style={{ minWidth: 140 }}>
        <label className="field__label" htmlFor="f-status">状态</label>
        <Select id="f-status" value={filters.status} onChange={(e) => onChange({ status: e.target.value })}>
          <option value="">全部状态</option>
          <option value="active">已启用</option>
          <option value="invited">已邀请</option>
          <option value="suspended">已停用</option>
        </Select>
      </div>

      {active && (
        <Button variant="ghost" size="sm" onClick={onReset}>清除筛选</Button>
      )}

      <div style={{ marginInlineStart: 'auto', display: 'flex', alignItems: 'center', gap: 'var(--sp-3)' }}>
        <span className="num" style={{ fontSize: 'var(--fs-3)', color: 'var(--color-text-3)' }}
          aria-live="polite">
          {active ? `筛出 ${total} 条` : `共 ${total} 条`}
          {selectedCount > 0 && ` · 已选 ${selectedCount}`}
        </span>
        <Button variant="secondary" size="sm" icon={<IconDownload size={14} />}>导出 CSV</Button>
      </div>
    </div>
  );
}

/* ========================================================================== */
/* 3 · 批量操作条 —— 已选计数 + 危险操作视觉分离                                   */
/* ========================================================================== */

export function BulkActionBar({
  count, onClear, onDelete,
}: { count: number; onClear: () => void; onDelete: () => void }) {
  if (count === 0) return null;
  return (
    <div
      role="region"
      aria-label="批量操作"
      style={{
        position: 'sticky', bottom: 'var(--space-gap)', zIndex: 'var(--z-dropdown)',
        display: 'flex', alignItems: 'center', gap: 'var(--space-gap)',
        marginInline: 'auto', width: 'fit-content',
        padding: 'var(--sp-2) var(--sp-3)',
        background: 'var(--color-surface-raised)',
        border: '1px solid var(--color-border-strong)',
        borderRadius: 'var(--r-surface)', boxShadow: 'var(--sh-popup)',
      }}
    >
      <span style={{ fontSize: 'var(--fs-4)' }}>
        已选 <strong className="num">{count}</strong> 条
      </span>
      <Button variant="secondary" size="sm">批量改角色</Button>
      {/* 危险操作：语义危险色 + 与常规操作视觉分离（靠间隔与颜色双分离） */}
      <span style={{ width: 1, height: 20, background: 'var(--color-border)' }} aria-hidden="true" />
      <Button variant="danger" size="sm" icon={<IconTrash size={14} />} onClick={onDelete}>
        删除这 {count} 条
      </Button>
      <IconButton label="取消选择" icon={<IconClose size={14} />} onClick={onClear} />
    </div>
  );
}

/* ========================================================================== */
/* 4 · 数据表格 —— 排序 / 筛选 / 分页 / 选择 / aria-sort                        */
/* ==========================================================================*/

export function MemberTable({
  rows, sort, onSort, selected, onToggle, onToggleAll, loading, pageInfo,
}: {
  rows: Member[];
  sort: SortState;
  onSort: (key: keyof Member) => void;
  selected: Set<string>;
  onToggle: (id: string) => void;
  onToggleAll: () => void;
  loading?: boolean;
  pageInfo: { page: number; perPage: number; total: number; onPage: (p: number) => void };
}) {
  const allSelected = rows.length > 0 && rows.every((r) => selected.has(r.id));
  const someSelected = rows.some((r) => selected.has(r.id)) && !allSelected;

  // 部分选中用原生 indeterminate —— 只能通过 DOM 属性设置，不能用 JSX prop
  const setHeadRef = useCallback((el: HTMLInputElement | null) => {
    if (el) el.indeterminate = someSelected;
  }, [someSelected]);

  const ariaSort = (k: keyof Member) => (sort.key === k ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none');

  if (loading) {
    return (
      <div style={{ padding: 'var(--space-component)' }}>
        <div className="skeleton skeleton--row" style={{ marginBottom: 'var(--sp-2)' }} />
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="skeleton skeleton--row" style={{ marginBottom: 'var(--sp-2)' }} />
        ))}
      </div>
    );
  }

  const totalPages = Math.max(1, Math.ceil(pageInfo.total / pageInfo.perPage));

  return (
    <>
      <div className="table-wrap">
        <table className="table">
          <caption className="sr-only">
            成员列表，共 {pageInfo.total} 条。可按姓名、角色、席位或加入时间排序。
          </caption>
          <thead>
            <tr>
              <th scope="col" style={{ width: 40 }}>
                <input
                  ref={setHeadRef}
                  type="checkbox"
                  checked={allSelected}
                  onChange={onToggleAll}
                  aria-label={allSelected ? '取消全选' : '全选本页'}
                  style={{ width: 16, height: 16 }}
                />
              </th>
              <SortHeader label="姓名" sortKey="name" ariaSort={ariaSort('name')} onSort={onSort} />
              <th scope="col">邮箱</th>
              <SortHeader label="角色" sortKey="role" ariaSort={ariaSort('role')} onSort={onSort} />
              <th scope="col">状态</th>
              <SortHeader label="席位" sortKey="seats" ariaSort={ariaSort('seats')} onSort={onSort} alignEnd />
              <SortHeader label="加入时间" sortKey="joinedAt" ariaSort={ariaSort('joinedAt')} onSort={onSort} alignEnd />
              <th scope="col" style={{ textAlign: 'end' }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((m) => (
              <tr key={m.id}>
                <td>
                  <input
                    type="checkbox"
                    checked={selected.has(m.id)}
                    onChange={() => onToggle(m.id)}
                    aria-label={`选择 ${m.name}`}
                    style={{ width: 16, height: 16 }}
                  />
                </td>
                <td style={{ fontWeight: 'var(--fw-medium)' }}>{m.name}</td>
                <td className="dim">{m.email}</td>
                <td>{ROLE_LABEL[m.role]}</td>
                <td>
                  {/* Tag 只做分类，不做关键状态；状态用 Badge */}
                  {m.status === 'active' ? <StatusBadge severity="ok">已启用</StatusBadge>
                    : m.status === 'invited' ? <Tag>已邀请</Tag>
                    : <StatusBadge severity="warn">已停用</StatusBadge>}
                </td>
                <td className="table__num">{m.seats}</td>
                <td className="table__num dim">{m.joinedAt}</td>
                <td className="table__actions">
                  <Button variant="ghost" size="sm">编辑</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{
        display: 'flex', alignItems: 'center', gap: 'var(--sp-4)',
        padding: 'var(--space-component)', borderTop: '1px solid var(--color-border)',
      }}>
        <span className="num" style={{ fontSize: 'var(--fs-3)', color: 'var(--color-text-3)' }}>
          第 {pageInfo.page} / {totalPages} 页 · 共 {pageInfo.total} 条
        </span>
        <div style={{ marginInlineStart: 'auto', display: 'flex', gap: 'var(--sp-2)' }}>
          <Button variant="secondary" size="sm" disabled={pageInfo.page <= 1}
            onClick={() => pageInfo.onPage(pageInfo.page - 1)}>上一页</Button>
          <Button variant="secondary" size="sm" disabled={pageInfo.page >= totalPages}
            onClick={() => pageInfo.onPage(pageInfo.page + 1)}>下一页</Button>
        </div>
      </div>
    </>
  );
}

function SortHeader({
  label, sortKey, ariaSort, onSort, alignEnd,
}: {
  label: string; sortKey: keyof Member;
  ariaSort: 'ascending' | 'descending' | 'none';
  onSort: (k: keyof Member) => void; alignEnd?: boolean;
}) {
  return (
    <th scope="col" aria-sort={ariaSort} style={{ textAlign: alignEnd ? 'end' : 'start' }}>
      <button type="button" onClick={() => onSort(sortKey)}>
        {label}
        <span aria-hidden="true" style={{ opacity: ariaSort === 'none' ? 0.35 : 1 }}>
          {ariaSort === 'ascending' ? '▲' : ariaSort === 'descending' ? '▼' : '▾'}
        </span>
      </button>
    </th>
  );
}

const ROLE_LABEL: Record<Member['role'], string> = {
  owner: '所有者', admin: '管理员', member: '成员',
};

/* ========================================================================== */
/* 5 · 错误摘要 —— 顶置可聚焦 + 每项链接到字段 + 保留行内错误                       */
/* ==========================================================================*/

export type FieldErrors = Record<string, string>;

export function ErrorSummary({
  errors, onJump, submitted,
}: { errors: FieldErrors; onJump: (field: string) => void; submitted: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const entries = Object.entries(errors);

  // 提交失败后聚焦摘要（焦点管理是 WCAG 要求，不是可选项）
  React.useEffect(() => {
    if (submitted && entries.length > 0) ref.current?.focus();
  }, [submitted, entries.length]);

  if (!submitted || entries.length === 0) return null;

  return (
    <div
      ref={ref}
      tabIndex={-1}
      role="alert"
      aria-labelledby="err-sum-title"
      style={{
        padding: 'var(--space-component)',
        background: 'var(--color-err-bg)',
        border: '1px solid var(--color-err)',
        borderRadius: 'var(--r-surface)',
      }}
    >
      <h2 id="err-sum-title" style={{ margin: 0, fontSize: 'var(--fs-4)', fontWeight: 'var(--fw-semibold)', color: 'var(--color-err)' }}>
        有 {entries.length} 处需要修改，才能保存
      </h2>
      <ul style={{ margin: 'var(--sp-2) 0 0', paddingInlineStart: 'var(--sp-4)', fontSize: 'var(--fs-3)', color: 'var(--color-text-2)' }}>
        {entries.map(([field, msg]) => (
          <li key={field}>
            <button
              type="button"
              onClick={() => onJump(field)}
              style={{
                background: 'none', border: 0, padding: 0, cursor: 'pointer',
                color: 'var(--color-err)', font: 'inherit', textDecoration: 'underline',
                textUnderlineOffset: 3, textAlign: 'start',
              }}
            >
              {msg}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ========================================================================== */
/* 6 · 表单 —— 标签对齐（冒号右对齐让眼球顺着冒号找到所有字段）                    */
/* ==========================================================================*/

export function MemberForm({
  onSubmit, onCancel,
}: { onSubmit: (data: { name: string; email: string; role: Member['role'] }) => Promise<FieldErrors | void>; onCancel: () => void }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Member['role']>('member');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);

  const jump = (field: string) => {
    (field === 'name' ? nameRef : emailRef).current?.focus();
  };

  // onBlur 校验：用户完成输入后才提示
  const validateName = () => setErrors((e) => ({ ...e, name: name.trim() ? '' : '姓名不能为空' }));
  const validateEmail = () => setErrors((e) => ({
    ...e,
    email: !email.trim() ? '邮箱不能为空'
      : /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? ''
      : '邮箱缺少 @ 或域名，例如 name@acme.com',
  }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const next = await onSubmit({ name, email, role });
      if (next && Object.keys(next).length) { setErrors(next); setSubmitted(true); }
      else setSubmitted(false);
    } finally {
      setBusy(false);
    }
  };

  const clean = Object.fromEntries(Object.entries(errors).filter(([, v]) => v));

  return (
    <form onSubmit={submit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-gap)' }}>
      <ErrorSummary errors={clean} onJump={jump} submitted={submitted} />

      <Card>
        {/* 标签右对齐：眼球沿冒号列竖向扫描即可找到所有填写项 */}
        <div style={{ display: 'grid', gridTemplateColumns: '112px minmax(0, 1fr)', gap: 'var(--space-gap) var(--sp-4)', alignItems: 'start' }}>
          <label htmlFor="m-name" style={LABEL_R}>
            姓名<span aria-hidden="true" style={{ color: 'var(--color-err)' }}>*</span>
            <VisuallyHidden>必填</VisuallyHidden>
          </label>
          <div className="field">
            <input
              ref={nameRef} id="m-name" className="field__control" value={name}
              aria-invalid={clean.name ? true : undefined}
              aria-describedby={clean.name ? 'm-name-err' : undefined}
              onChange={(e) => setName(e.target.value)} onBlur={validateName}
            />
            {clean.name && <p className="field__error" id="m-name-err" role="alert">{clean.name}</p>}
          </div>

          <label htmlFor="m-email" style={LABEL_R}>
            邮箱<span aria-hidden="true" style={{ color: 'var(--color-err)' }}>*</span>
            <VisuallyHidden>必填</VisuallyHidden>
          </label>
          <div className="field">
            <input
              ref={emailRef} id="m-email" type="email" autoComplete="email"
              className="field__control" value={email}
              aria-invalid={clean.email ? true : undefined}
              aria-describedby={`m-email-help${clean.email ? ' m-email-err' : ''}`}
              onChange={(e) => setEmail(e.target.value)} onBlur={validateEmail}
            />
            {/* 帮助文本持久显示，不只靠 placeholder */}
            <p className="field__help" id="m-email-help">邀请链接会发到这个地址，7 天内有效</p>
            {clean.email && <p className="field__error" id="m-email-err" role="alert">{clean.email}</p>}
          </div>

          <label htmlFor="m-role" style={LABEL_R}>角色</label>
          <div className="field">
            <select id="m-role" className="field__control" value={role}
              onChange={(e) => setRole(e.target.value as Member['role'])}>
              <option value="member">成员 — 可读写业务数据</option>
              <option value="admin">管理员 — 可管理成员与配置</option>
              <option value="owner">所有者 — 可转移与注销组织</option>
            </select>
            <p className="field__help">权限变更立即生效，不需要对方重新登录</p>
          </div>
        </div>
      </Card>

      <div style={{ display: 'flex', gap: 'var(--sp-2)', justifyContent: 'flex-end' }}>
        <Button variant="secondary" onClick={onCancel}>取消</Button>
        <Button type="submit" loading={busy}>保存并发送邀请</Button>
      </div>
    </form>
  );
}

const LABEL_R: React.CSSProperties = {
  textAlign: 'end', paddingTop: 9, fontSize: 'var(--fs-3)',
  fontWeight: 'var(--fw-medium)', color: 'var(--color-text-1)',
};

/* ========================================================================== */
/* 7 · 破坏性操作 —— 确认 + 撤销双保险；乐观更新优于确认框                          */
/* ==========================================================================*/

export function useUndoableDelete() {
  const { push } = useToast();
  return useCallback(
    (count: number, undo: () => void) => {
      push({
        severity: 'info',
        message: `已删除 ${count} 条记录`,
        action: { label: '撤销', onClick: undo },
      });
    },
    [push],
  );
}

export function ConfirmDeleteDialog({
  open, count, onCancel, onConfirm,
}: { open: boolean; count: number; onCancel: () => void; onConfirm: () => void }) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={`删除这 ${count} 条记录？`}
      footer={
        <>
          <Button variant="secondary" onClick={onCancel}>取消</Button>
          <Button variant="danger" data-autofocus onClick={onConfirm}>确认删除 {count} 条</Button>
        </>
      }
    >
      <p style={{ margin: 0 }}>
        记录会进入回收站保留 30 天。期间可以从「已删除」里恢复，超过 30 天将无法找回。
      </p>
      <p style={{ margin: 'var(--sp-2) 0 0', fontSize: 'var(--fs-3)' }}>
        受影响的账号：<span className="num">{count}</span> 个，其中 4 个是所有者——所有者被删除后组织会自动转交给最早的管理员。
      </p>
    </Modal>
  );
}

/* ========================================================================== */
/* 8 · 组装示例                                                                */
/* ========================================================================== */

export function AdminConsolePage() {
  const [filters, setFilters] = useState<Filters>({ q: '', role: '', status: '' });
  const [sort, setSort] = useState<SortState>({ key: 'joinedAt', dir: 'desc' });
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [savedBanner, setSavedBanner] = useState(false);

  const all: Member[] = useMemo(() => ([
    { id: 'u1', name: '陈屿', email: 'chenyu@acme.com', role: 'owner', status: 'active', seats: 3, joinedAt: '2024-03-11' },
    { id: 'u2', name: '林岚', email: 'linlan@acme.com', role: 'admin', status: 'active', seats: 2, joinedAt: '2024-06-02' },
    { id: 'u3', name: '周见', email: 'zhoujian@acme.com', role: 'member', status: 'invited', seats: 1, joinedAt: '2026-09-28' },
    { id: 'u4', name: '苏芮', email: 'surui@acme.com', role: 'member', status: 'suspended', seats: 1, joinedAt: '2025-01-19' },
    { id: 'u5', name: '郑霖', email: 'zhenglin@acme.com', role: 'member', status: 'active', seats: 4, joinedAt: '2025-08-07' },
  ]), []);

  const filtered = useMemo(() => {
    const q = filters.q.trim().toLowerCase();
    return all
      .filter((m) => (!q || m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q)))
      .filter((m) => (!filters.role || m.role === filters.role))
      .filter((m) => (!filters.status || m.status === filters.status))
      .sort((a, b) => {
        const dir = sort.dir === 'asc' ? 1 : -1;
        const av = a[sort.key];
        const bv = b[sort.key];
        if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir;
        return String(av).localeCompare(String(bv)) * dir;
      });
  }, [all, filters, sort]);

  return (
    <ToastProvider>
      <AdminShell
        nav={[
          { id: 'members', label: '成员' },
          { id: 'roles', label: '角色与权限' },
          { id: 'billing', label: '账单', count: 2 },
          { id: 'audit', label: '操作审计' },
          { id: 'settings', label: '组织设置' },
        ]}
        current="members"
        breadcrumb={['组织设置', '成员管理']}
        actions={<Button icon={<IconPlus size={14} />} onClick={() => setSavedBanner(true)}>邀请成员</Button>}
      >
        {/* 重要失败/结果不用 toast 单独承担 —— 持久 Alert */}
        {savedBanner && (
          <Alert severity="ok" title="已发送 1 封邀请">
            收件人 7 天内点击链接即可加入。可在「待接受」里重发或撤回。
          </Alert>
        )}

        <FilterBar
          filters={filters}
          onChange={(next) => setFilters((f) => ({ ...f, ...next }))}
          onReset={() => setFilters({ q: '', role: '', status: '' })}
          total={filtered.length}
          selectedCount={selected.size}
        />

        <Card style={{ padding: 0, overflow: 'hidden' }}>
          <MemberTable
            rows={filtered}
            sort={sort}
            onSort={(key) => setSort((s) => ({ key, dir: s.key === key && s.dir === 'asc' ? 'desc' : 'asc' }))}
            selected={selected}
            onToggle={(id) => setSelected((prev) => {
              const next = new Set(prev);
              next.has(id) ? next.delete(id) : next.add(id);
              return next;
            })}
            onToggleAll={() => setSelected((prev) =>
              prev.size === filtered.length ? new Set() : new Set(filtered.map((m) => m.id)))}
            pageInfo={{ page: 1, perPage: 20, total: filtered.length, onPage: () => {} }}
          />
        </Card>

        {filtered.length === 0 && (
          <Panel title="没有匹配的成员">
            <p style={{ margin: 0, fontSize: 'var(--fs-4)', color: 'var(--color-text-2)' }}>
              当前筛选条件下没有结果。清除筛选可以看到全部 5 位成员。
            </p>
          </Panel>
        )}

        <Panel title="成员信息" meta="修改后立即生效">
          <MemberForm
            onCancel={() => setSavedBanner(false)}
            onSubmit={async () => {
              await new Promise((r) => setTimeout(r, 400));
              setSavedBanner(true);
            }}
          />
        </Panel>

        <BulkActionBar
          count={selected.size}
          onClear={() => setSelected(new Set())}
          onDelete={() => setConfirmOpen(true)}
        />

        <ConfirmDeleteDialog
          open={confirmOpen}
          count={selected.size}
          onCancel={() => setConfirmOpen(false)}
          onConfirm={() => { setConfirmOpen(false); setSelected(new Set()); }}
        />
      </AdminShell>
    </ToastProvider>
  );
}
