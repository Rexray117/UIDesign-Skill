/* ============================================================================
 * UIdesign-v0.1 · 共用组件原语（React + TypeScript）
 * ----------------------------------------------------------------------------
 * 演示规则：
 *   · components-states.md 六态；变体正交；loading 不改变宽度
 *   · accessibility.md     焦点环 · aria 关联 · 焦点管理 · 状态非颜色唯一表达
 *   · motion.md            出场快于入场；动画不阻塞输入；可中断
 *   · anti-ai/D6           图标一律 SVG，禁止 emoji
 *   · anti-ai/D3           阴影只用 3 档 token；不做装饰性光晕
 *
 * 依赖：tokens.css（token 定义）+ primitives.css（组件类）
 * ==========================================================================*/

import React, {
  createContext, useCallback, useContext, useEffect, useId, useRef, useState,
} from 'react';

/* ---------------------------------------------------------------- 工具 */

/** 组合类名。仅做拼接，不做条件逻辑 —— 保持可读 */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

/** 屏幕阅读器专用文本 */
export function VisuallyHidden({ children }: { children: React.ReactNode }) {
  return <span className="sr-only">{children}</span>;
}

/* ---------------------------------------------------------------- 图标 */
/* 全站同一图标族（Lucide 风格，线宽 1.5）。禁止 emoji 承担图标职责。 */

type IconProps = { size?: number; className?: string; 'aria-hidden'?: boolean };

const svg = (path: React.ReactNode, viewBox = '0 0 24 24') =>
  function Icon({ size = 16, className, ...rest }: IconProps) {
    return (
      <svg
        width={size} height={size} viewBox={viewBox} fill="none"
        stroke="currentColor" strokeWidth={1.5}
        strokeLinecap="round" strokeLinejoin="round"
        aria-hidden="true" focusable="false"
        className={className} {...rest}
      >
        {path}
      </svg>
    );
  };

export const IconCheck = svg(<path d="M20 6L9 17l-5-5" />);
export const IconAlert = svg(<><path d="M12 9v4" /><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" /><path d="M12 17h.01" /></>);
export const IconCritical = svg(<><path d="m21.7 7.3-5-5H7.3l-5 5v9.4l5 5h9.4l5-5Z" /><path d="M12 8v5" /><path d="M12 16h.01" /></>);
export const IconInfo = svg(<><circle cx="12" cy="12" r="9" /><path d="M12 16v-4" /><path d="M12 8h.01" /></>);
export const IconClose = svg(<><path d="M18 6 6 18" /><path d="m6 6 12 12" /></>);
export const IconChevronDown = svg(<path d="m6 9 6 6 6-6" />);
export const IconChevronRight = svg(<path d="m9 18 6-6-6-6" />);
export const IconSearch = svg(<><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></>);
export const IconPlus = svg(<><path d="M12 5v14" /><path d="M5 12h14" /></>);
export const IconTrash = svg(<><path d="M4 7h16" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M6 7l1 13h10l1-13" /><path d="M9 7V4h6v3" /></>);
export const IconRefresh = svg(<><path d="M21 12a9 9 0 1 1-3-6.7" /><path d="M21 3v6h-6" /></>);
export const IconPause = svg(<><path d="M9 5v14" /><path d="M15 5v14" /></>);
export const IconArrowRight = svg(<><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></>);
export const IconDownload = svg(<><path d="M12 3v12" /><path d="m7 10 5 5 5-5" /><path d="M4 20h16" /></>);
export const IconUndo = svg(<><path d="M3 8h11a5 5 0 0 1 0 10H8" /><path d="m3 8 4-4" /><path d="m3 8 4 4" /></>);
export const IconFilter = svg(<path d="M3 5h18l-7 8v6l-4-2v-4Z" />);

/* ---------------------------------------------------------------- Spinner */

export function Spinner({ label }: { label?: string }) {
  return (
    <span className="btn__spinner" role="presentation">
      {label ? <VisuallyHidden>{label}</VisuallyHidden> : null}
    </span>
  );
}

/* ---------------------------------------------------------------- Button */

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  block?: boolean;
  /** 异步进行中：保持宽度不变，禁用重复提交，但保留标签供读屏播报 */
  loading?: boolean;
  icon?: React.ReactNode;
};

export function Button({
  variant = 'primary', size = 'md', block, loading = false,
  icon, children, className, disabled, ...rest
}: ButtonProps) {
  const busyId = useId();
  return (
    <button
      type="button"
      className={cn(
        'btn',
        variant !== 'primary' && `btn--${variant}`,
        size !== 'md' && `btn--${size}`,
        block && 'btn--block',
        className,
      )}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      aria-describedby={loading ? busyId : undefined}
      {...rest}
    >
      {loading && <Spinner />}
      {!loading && icon}
      <span className="btn__label">{children}</span>
      {loading && <VisuallyHidden>正在处理，请稍候</VisuallyHidden>}
    </button>
  );
}

/** 图标按钮 —— label 为必填，强制提供可访问名称 */
export function IconButton({
  label, icon, className, ...rest
}: Omit<ButtonProps, 'children' | 'icon'> & { label: string; icon: React.ReactNode }) {
  return (
    <button
      type="button"
      className={cn('icon-btn', className)}
      aria-label={label}
      title={label}
      {...rest}
    >
      {icon}
    </button>
  );
}

/* ---------------------------------------------------------------- Field */
/* 标签可见、帮助文本持久、错误就地显示并 aria 关联 */

type FieldProps = {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  /** 由调用方渲染具体控件；Field 负责 id / aria 关联 */
  children: (props: {
    id: string;
    'aria-invalid'?: true;
    'aria-describedby'?: string;
    'aria-required'?: true;
  }) => React.ReactNode;
};

export function Field({ label, required, hint, error, children }: FieldProps) {
  const id = useId();
  const helpId = `${id}-help`;
  const errId = `${id}-err`;
  const describedBy = [hint ? helpId : null, error ? errId : null]
    .filter(Boolean).join(' ') || undefined;

  return (
    <div className="field" data-invalid={error ? 'true' : undefined}>
      <label className="field__label" htmlFor={id}>
        {label}
        {required && <span className="field__required" aria-hidden="true">*</span>}
        {required && <VisuallyHidden>必填</VisuallyHidden>}
      </label>

      {children({
        id,
        'aria-invalid': error ? true : undefined,
        'aria-describedby': describedBy,
        'aria-required': required || undefined,
      })}

      {hint && !error && <p className="field__help" id={helpId}>{hint}</p>}
      {error && (
        <p className="field__error" id={errId} role="alert">
          <IconAlert size={14} />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(function Input({ className, ...rest }, ref) {
  return <input ref={ref} className={cn('field__control', className)} {...rest} />;
});

export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(function Select({ className, children, ...rest }, ref) {
  return (
    <select ref={ref} className={cn('field__control', className)} {...rest}>
      {children}
    </select>
  );
});

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ className, rows = 4, ...rest }, ref) {
  return (
    <textarea
      ref={ref}
      rows={rows}
      className={cn('field__control', className)}
      style={{ padding: 'var(--sp-2) var(--sp-3)', resize: 'vertical' }}
      {...rest}
    />
  );
});

/* ---------------------------------------------------------------- Card / Panel */

export function Card({
  interactive, primary, className, children, ...rest
}: React.HTMLAttributes<HTMLDivElement> & { interactive?: boolean; primary?: boolean }) {
  // 可点击卡片用 role=button + 键盘支持；静态卡片保持普通容器
  const isClickable = Boolean(interactive);
  return (
    <div
      className={cn('card', isClickable && 'card--interactive', primary && 'card--primary', className)}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      {...rest}
    >
      {children}
    </div>
  );
}

export function Panel({
  title, meta, actions, className, bodyClassName, children,
}: {
  title: React.ReactNode;
  meta?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={cn('panel', className)}>
      <header className="panel__head">
        <h3 className="panel__title">{title}</h3>
        <div className="row-2">
          {meta && <span className="panel__meta">{meta}</span>}
          {actions}
        </div>
      </header>
      <div className={cn('panel__body', bodyClassName)}>{children}</div>
    </section>
  );
}

/* ---------------------------------------------------------------- StatusBadge */
/* 状态 = 颜色 + 形状 + 文字 三重编码。色盲用户仅凭形状与文字即可判读 */

type Severity = 'ok' | 'warn' | 'err' | 'info' | 'unknown';

const SEVERITY_TEXT: Record<Severity, string> = {
  ok: '正常', warn: '警告', err: '严重', info: '信息', unknown: '未知',
};

export function StatusBadge({
  severity, children,
}: { severity: Severity; children?: React.ReactNode }) {
  return (
    <span className={cn('badge', `badge--${severity}`)}>
      {children ?? SEVERITY_TEXT[severity]}
    </span>
  );
}

export function Tag({ children }: { children: React.ReactNode }) {
  return <span className="tag">{children}</span>;
}

/* ---------------------------------------------------------------- Alert */

export function Alert({
  severity, title, children, action,
}: {
  severity: Exclude<Severity, 'unknown'>;
  title: React.ReactNode;
  children?: React.ReactNode;
  action?: React.ReactNode;
}) {
  const Icon = severity === 'ok' ? IconCheck
    : severity === 'warn' ? IconAlert
    : severity === 'err' ? IconCritical : IconInfo;
  return (
    <div className={cn('alert', `alert--${severity}`)} role={severity === 'err' ? 'alert' : 'status'}>
      <span className="alert__icon"><Icon size={16} /></span>
      <div className="alert__body grow">
        <div className="alert__title">{title}</div>
        {children && <div className="alert__desc">{children}</div>}
      </div>
      {action}
    </div>
  );
}

/* ---------------------------------------------------------------- Toast */
/* 纪律：不抢焦点；用 aria-live=polite；重要失败不得只靠 toast */

export type ToastItem = {
  id: string;
  severity: 'ok' | 'err' | 'info';
  message: string;
  action?: { label: string; onClick: () => void };
};

const ToastCtx = createContext<{
  push: (t: Omit<ToastItem, 'id'>) => void;
}>({ push: () => {} });

export function useToast() { return useContext(ToastCtx); }

export function ToastProvider({
  children, autoDismissMs = 4000,
}: { children: React.ReactNode; autoDismissMs?: number }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setItems((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback((t: Omit<ToastItem, 'id'>) => {
    const id = Math.random().toString(36).slice(2);
    setItems((prev) => [...prev, { ...t, id }]);
  }, []);

  return (
    <ToastCtx.Provider value={{ push }}>
      {children}
      {/* polite：不打断读屏当前朗读，也不移动焦点 */}
      <div className="toast-region" role="status" aria-live="polite" aria-atomic="false">
        {items.map((t) => (
          <Toast
            key={t.id}
            item={t}
            onDismiss={() => dismiss(t.id)}
            autoDismissMs={autoDismissMs}
          />
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

function Toast({
  item, onDismiss, autoDismissMs,
}: { item: ToastItem; onDismiss: () => void; autoDismissMs: number }) {
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const timer = window.setTimeout(onDismiss, autoDismissMs);
    return () => window.clearTimeout(timer);
  }, [paused, autoDismissMs, onDismiss]);

  const Icon = item.severity === 'ok' ? IconCheck : item.severity === 'err' ? IconCritical : IconInfo;

  return (
    <div
      className="toast"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <span style={{ color: item.severity === 'err' ? 'var(--color-err)' : 'var(--color-ok)', flex: '0 0 auto' }}>
        <Icon size={16} />
      </span>
      <span className="grow">{item.message}</span>
      {item.action && (
        <button type="button" className="toast__action" onClick={item.action.onClick}>
          {item.action.label}
        </button>
      )}
      <IconButton
        label="关闭通知"
        icon={<IconClose size={14} />}
        className="toast__close"
        onClick={onDismiss}
        style={{ minWidth: 24, minHeight: 24, width: 24, height: 24 }}
      />
    </div>
  );
}

/* ---------------------------------------------------------------- Skeleton */

export function Skeleton({ w, h, rows = 1 }: { w?: string; h?: string; rows?: number }) {
  if (rows > 1) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)' }} aria-hidden="true">
        {Array.from({ length: rows }, (_, i) => (
          <span key={i} className="skeleton skeleton--text" style={{ width: i === rows - 1 ? '60%' : w }} />
        ))}
      </div>
    );
  }
  return <span className="skeleton" style={{ display: 'block', width: w, height: h }} aria-hidden="true" />;
}

/** 表格骨架 —— 尺寸与真实行高一致，避免加载完成时布局跳动 */
export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)' }} aria-busy="true">
      <VisuallyHidden>正在加载数据</VisuallyHidden>
      {Array.from({ length: rows }, (_, i) => (
        <span key={i} className="skeleton skeleton--row" aria-hidden="true" />
      ))}
    </div>
  );
}

/* ---------------------------------------------------------------- EmptyState */
/* 必须说清「为什么空」+「下一步做什么」，不留白 */

export function EmptyState({
  title, hint, action,
}: { title: React.ReactNode; hint?: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="empty">
      <span className="empty__title">{title}</span>
      {hint && <span className="empty__hint">{hint}</span>}
      {action && <div style={{ marginTop: 'var(--sp-2)' }}>{action}</div>}
    </div>
  );
}

/* ---------------------------------------------------------------- Switch */

export function Switch({
  checked, onChange, children, disabled,
}: {
  checked: boolean; onChange: (next: boolean) => void;
  children: React.ReactNode; disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      className="switch"
      onClick={() => onChange(!checked)}
    >
      <span className="switch__track"><span className="switch__thumb" /></span>
      <span>{children}</span>
    </button>
  );
}

/* ---------------------------------------------------------------- Modal */
/* 焦点管理：打开时移入，关闭后归还触发元素；Esc 可关；点击遮罩可关 */

export function Modal({
  open, onClose, title, children, footer,
}: {
  open: boolean; onClose: () => void;
  title: React.ReactNode; children: React.ReactNode; footer?: React.ReactNode;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    returnFocusRef.current = document.activeElement as HTMLElement;
    const box = boxRef.current;
    box?.querySelector<HTMLElement>('[data-autofocus]')?.focus() ?? box?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.stopPropagation(); onClose(); return; }
      if (e.key !== 'Tab' || !box) return;
      const focusables = box.querySelectorAll<HTMLElement>(
        'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])',
      );
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      // 焦点陷阱：首尾回环，不允许 Tab 逃出对话框
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };

    document.addEventListener('keydown', onKey, true);
    return () => {
      document.removeEventListener('keydown', onKey, true);
      returnFocusRef.current?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      <div className="scrim" onClick={onClose} aria-hidden="true" />
      <div
        ref={boxRef}
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        tabIndex={-1}
      >
        <div className="modal__body">
          <h2 id="modal-title" style={{ margin: '0 0 var(--sp-3)', fontSize: 'var(--fs-6)', fontWeight: 600 }}>
            {title}
          </h2>
          <div style={{ color: 'var(--color-text-2)', fontSize: 'var(--fs-4)' }}>{children}</div>
        </div>
        <div className="modal__foot">
          {footer ?? (
            <>
              <Button variant="secondary" onClick={onClose}>取消</Button>
              <Button data-autofocus onClick={onClose}>确认</Button>
            </>
          )}
        </div>
      </div>
    </>
  );
}

/* ---------------------------------------------------------------- 布局工具 */

/** 页面外壳 —— 三层表面模型：页面底 + 容器 + 抬升 */
export function Shell({
  header, children, footer,
}: { header?: React.ReactNode; children: React.ReactNode; footer?: React.ReactNode }) {
  return (
    <div style={{
      minHeight: '100dvh', display: 'flex', flexDirection: 'column',
      background: 'var(--color-surface-layout)', color: 'var(--color-text-1)',
    }}>
      {header}
      <main className="grow" style={{ minWidth: 0 }}>{children}</main>
      {footer}
    </div>
  );
}

/** 区块标题 —— 建立层级靠字号与间距，不靠颜色 */
export function SectionHead({
  title, desc, action,
}: { title: React.ReactNode; desc?: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
      gap: 'var(--space-gap)', marginBottom: 'var(--space-component)',
    }}>
      <div>
        <h2 style={{ margin: 0, fontSize: 'var(--fs-6)', fontWeight: 600, letterSpacing: '-0.01em' }}>
          {title}
        </h2>
        {desc && <p style={{ margin: 'var(--sp-1) 0 0', color: 'var(--color-text-2)', fontSize: 'var(--fs-4)' }}>{desc}</p>}
      </div>
      {action}
    </div>
  );
}
