/* ============================================================================
 * 场景模板 6 / 6 · C 端移动端（ext-mobile）
 * ----------------------------------------------------------------------------
 * 定位：拇指可达、单手可完成、弱网可降级、平台原生感。
 * 判据：首屏任务完成率 与 误触率 —— 两者由触控目标尺寸与拇指热区直接决定。
 *
 * 三条物理约束（不可协商）：
 *   ① 触控目标 ≥44×44pt（iOS）/ ≥48×48dp（Android）
 *   ② 目标间距 ≥8px
 *   ③ 拇指热区决定主要操作位置
 *
 * 演示规则：
 *   · ext-mobile.md §5.1  主操作在屏幕下 1/3；危险操作避开易误触位置
 *   · ext-mobile.md §5.2  ⭐ 正文 ≥16px（低于 16px 触发 iOS 自动缩放，页面会跳）
 *   · ext-mobile.md §5.3  dvh 而非 vh；safe-area；固定栏不遮挡内容
 *   · ext-mobile.md §5.4  底部导航 ≤5 项且「图标 + 文字」；不拦截系统返回手势
 *   · ext-mobile.md §5.5  按压反馈 ≤100ms；>1s 用骨架屏；弱网降级
 *   · ext-mobile.md §5.6  语义化 input type 触发正确键盘；自动保存草稿
 *   · touch.md            触控目标 ≥44/48；间距 ≥8px；不依赖 hover
 *   · forms.md            onBlur 校验；聚焦时字段不被键盘遮挡
 *
 * ⚠️ 误杀防护：16px 正文、单列纵向流、大内边距、底部 Tab Bar、
 *   「无 hover 态」都是本场景的刻意选择，不得削减。
 *
 * 场景默认旋钮：--variance 5 / --motion 5 / --density 4
 * 推荐风格：22 Material 3 Expressive · 02 Flat Design · 03 Bento Box Grid
 * ==========================================================================*/

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Button, IconAlert, IconArrowRight, IconCheck, IconChevronRight, IconClose,
  IconSearch, IconUndo, StatusBadge, ToastProvider, VisuallyHidden, cn,
} from './primitives';

/* ========================================================================== */
/* 常量                                                                        */
/* ========================================================================== */

/** 触控目标下限：iOS 44pt / Android 48dp —— 取 44 作为 CSS px 基线 */
const TOUCH_MIN = 44;
/** 触控目标最小间距 */
const TOUCH_GAP = 8;

/* ========================================================================== */
/* 1 · 触控目标包装 —— 视觉可小，热区必须够大                                     */
/* ========================================================================== */

export function TouchTarget({
  label, onActivate, children, as = 'button', className,
}: {
  label: string;
  onActivate?: () => void;
  children: React.ReactNode;
  as?: 'button' | 'div';
  className?: string;
}) {
  const style: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: TOUCH_MIN,
    minHeight: TOUCH_MIN,
    // 视觉图标可小于 44，但热区靠 padding / min-size 撑到 44
    padding: 0,
    background: 'none',
    border: 0,
    color: 'inherit',
    cursor: 'pointer',
    // 消除 Web 端 300ms 点击延迟，且不禁用缩放
    touchAction: 'manipulation',
    WebkitTapHighlightColor: 'transparent',
  };

  if (as === 'div') {
    return <div role="button" tabIndex={0} aria-label={label} style={style} className={className} onClick={onActivate}>{children}</div>;
  }
  return <button type="button" aria-label={label} title={label} style={style} className={className} onClick={onActivate}>{children}</button>;
}

/* ========================================================================== */
/* 2 · 按压反馈 —— 触屏无 hover，反馈必须来自按压；≤100ms 且不改变布局边界            */
/* ========================================================================== */

export function Pressable({
  onPress, children, className, disabled, ariaLabel,
}: {
  onPress?: () => void; children: React.ReactNode;
  className?: string; disabled?: boolean; ariaLabel?: string;
}) {
  const [pressed, setPressed] = useState(false);
  return (
    <button
      type="button"
      disabled={disabled}
      aria-label={ariaLabel}
      className={className}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      onPointerCancel={() => setPressed(false)}
      onClick={onPress}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        width: '100%', minHeight: 56,          // ≥44，留出舒适余量
        padding: '0 16px',
        textAlign: 'start',
        background: pressed ? 'var(--color-surface-layout)' : 'transparent',
        border: 0, borderRadius: 'var(--r-control)',
        color: 'inherit', font: 'inherit',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent',
        // 100ms 状态反馈；只改背景色，不改布局边界 → 不抖动
        transition: 'background-color var(--dur-fast) var(--ease-move)',
      }}
    >
      {children}
    </button>
  );
}

/* ========================================================================== */
/* 3 · 应用外壳 —— dvh + 安全区 + 吸底栏为内容预留内边距                            */
/* ========================================================================== */

export function MobileShell({
  header, children, tabBar, actionBar,
}: {
  header?: React.ReactNode;
  children: React.ReactNode;
  tabBar?: React.ReactNode;
  actionBar?: React.ReactNode;
}) {
  const tabH = tabBar ? 56 : 0;
  const actionH = actionBar ? 72 : 0;
  return (
    <div
      data-density="standard"
      style={{
        // dvh 而非 vh：避免移动端地址栏伸缩导致的视口跳变
        minHeight: '100dvh',
        display: 'flex', flexDirection: 'column',
        background: 'var(--color-bg)', color: 'var(--color-text-1)',
        // 触屏无 hover：不定义 :hover 样式
      }}
    >
      {header}

      <main
        className="grow"
        style={{
          minWidth: 0,
          overflowY: 'auto',
          // 为上下固定栏预留内边距 —— 内容不被遮挡
          paddingTop: 8,
          paddingBottom: `calc(${tabH + actionH}px + var(--safe-bottom) + 16px)`,
          paddingInline: 16,     // 固定外边距，避免内容贴边
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {children}
      </main>

      {/* 吸底区：拇指热区（屏幕下 1/3） */}
      {(actionBar || tabBar) && (
        <div style={{
          position: 'fixed', insetInline: 0, bottom: 0,
          zIndex: 'var(--z-sticky)',
          background: 'var(--color-surface)',
          borderTop: '1px solid var(--color-border)',
          paddingBottom: 'var(--safe-bottom)',      // 避让手势条
        }}>
          {actionBar}
          {tabBar}
        </div>
      )}
    </div>
  );
}

/* ========================================================================== */
/* 4 · 顶部导航栏 —— 返回行为可预期；不拦截系统返回手势                             */
/* ========================================================================== */

export function MobileAppBar({
  title, onBack, trailing,
}: { title: string; onBack?: () => void; trailing?: React.ReactNode }) {
  return (
    <header
      data-sticky
      style={{
        position: 'sticky', top: 0, zIndex: 'var(--z-sticky)',
        display: 'flex', alignItems: 'center', gap: TOUCH_GAP,
        minHeight: TOUCH_MIN,
        paddingTop: 'var(--safe-top)',            // 避让刘海 / 状态栏
        paddingInline: 8,
        background: 'var(--color-surface)',
        borderBottom: '1px solid var(--color-border)',
      }}
    >
      {onBack && (
        <TouchTarget label="返回" onActivate={onBack}>
          <span aria-hidden="true" style={{ display: 'inline-flex', transform: 'rotate(180deg)' }}>
            <IconChevronRight size={22} />
          </span>
        </TouchTarget>
      )}
      <h1 className="grow" style={{
        margin: 0, fontSize: 18, fontWeight: 600,
        // 标题过长时截断，但保留完整文本供读屏
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        textAlign: onBack ? 'start' : 'center',
      }}>
        {title}
      </h1>
      {trailing ?? <span style={{ width: TOUCH_MIN }} aria-hidden="true" />}
    </header>
  );
}

/* ========================================================================== */
/* 5 · 底部导航 —— ≤5 项；必须「图标 + 文字」（纯图标伤害可发现性）                  */
/* ========================================================================== */

export function BottomTabBar({
  items, current, onSelect,
}: {
  items: Array<{ id: string; label: string; icon: (p: { size?: number }) => JSX.Element; badge?: number }>;
  current: string;
  onSelect: (id: string) => void;
}) {
  // 顶层导航硬上限：超过 5 项应改为「更多」溢出菜单
  const visible = items.slice(0, 5);
  return (
    <nav aria-label="主导航" style={{
      display: 'flex',
      paddingTop: TOUCH_GAP,
      paddingBottom: TOUCH_GAP,
      // 目标间距 ≥8px：由均分 + padding 保证
    }}>
      {visible.map((it) => {
        const active = it.id === current;
        const Icon = it.icon;
        return (
          <button
            key={it.id}
            type="button"
            aria-current={active ? 'page' : undefined}
            onClick={() => onSelect(it.id)}
            style={{
              flex: '1 1 0', minWidth: 0,
              minHeight: TOUCH_MIN,            // 触控目标达标
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              gap: 2,
              background: 'none', border: 0, padding: 0,
              color: active ? 'var(--color-primary)' : 'var(--color-text-3)',
              font: 'inherit', fontSize: 11,      // 标签 11px，但图标 + 文字双编码
              cursor: 'pointer',
              position: 'relative',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            <span style={{ display: 'inline-flex', position: 'relative' }}>
              <Icon size={22} />
              {/* 徽标：访问后应清除；关键状态不用徽标承担 */}
              {!!it.badge && (
                <span aria-hidden="true" style={{
                  position: 'absolute', top: -4, insetInlineEnd: -6,
                  minWidth: 16, height: 16, padding: '0 4px',
                  borderRadius: 'var(--r-pill)',
                  background: 'var(--color-err)', color: 'var(--color-err-fg)',
                  fontSize: 10, lineHeight: '16px', textAlign: 'center',
                  fontVariantNumeric: 'tabular-nums',
                }}>
                  {it.badge > 9 ? '9+' : it.badge}
                </span>
              )}
            </span>
            <span>{it.label}</span>
            {!!it.badge && <VisuallyHidden>{`，${it.badge} 条未读`}</VisuallyHidden>}
          </button>
        );
      })}
    </nav>
  );
}

/* ========================================================================== */
/* 6 · 拇指区操作栏 —— 主操作固定在屏幕下缘，单手可达                              */
/* 危险操作「不」放在这里（易误触）；它应放在内容区并二次确认                        */
/* ========================================================================== */

export function ThumbActionBar({
  primary, secondary, hint,
}: {
  primary: { label: string; onClick: () => void; loading?: boolean };
  secondary?: { label: string; onClick: () => void };
  hint?: string;
}) {
  return (
    <div style={{ padding: TOUCH_GAP, display: 'flex', flexDirection: 'column', gap: TOUCH_GAP }}>
      {hint && (
        <p style={{ margin: 0, fontSize: 13, color: 'var(--color-text-3)', textAlign: 'center' }}>
          {hint}
        </p>
      )}
      <div style={{ display: 'flex', gap: TOUCH_GAP }}>
        {secondary && (
          <Button variant="secondary" block onClick={secondary.onClick}>
            {secondary.label}
          </Button>
        )}
        <Button block onClick={primary.onClick} loading={primary.loading}>
          {primary.label}
        </Button>
      </div>
    </div>
  );
}

/* ========================================================================== */
/* 7 · 移动端表单 —— input 高度 ≥44px；语义 type 触发正确键盘；草稿自动保存           */
/* ========================================================================== */

export function MobileField({
  label, value, onChange, type = 'text', autoComplete, inputMode,
  hint, error, onBlur, placeholder, multiline, required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: 'text' | 'email' | 'tel' | 'number' | 'password' | 'search';
  autoComplete?: string;
  inputMode?: 'text' | 'numeric' | 'tel' | 'email' | 'decimal';
  hint?: string;
  error?: string;
  onBlur?: () => void;
  placeholder?: string;
  multiline?: boolean;
  required?: boolean;
}) {
  const id = React.useId();
  const helpId = `${id}-help`;
  const errId = `${id}-err`;
  const describedBy = [hint ? helpId : null, error ? errId : null].filter(Boolean).join(' ') || undefined;
  const focusRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  // 聚焦时把字段滚入可视区 —— 不被软键盘遮挡
  const handleFocus = useCallback(() => {
    window.setTimeout(() => {
      focusRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }, 300);   // 等软键盘完成弹出
  }, []);

  const common = {
    id,
    value,
    onFocus: handleFocus,
    onBlur,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange(e.target.value),
    'aria-invalid': error ? true : undefined,
    'aria-describedby': describedBy,
    'aria-required': required || undefined,
    placeholder,
    className: 'field__control',
    style: {
      minHeight: TOUCH_MIN,        // 输入框高度 ≥44px（触控目标要求）
      fontSize: 16,                // ⭐ 必须 ≥16px，低于此值 iOS 会缩放整个页面
      padding: '10px 12px',
      width: '100%',
      boxSizing: 'border-box' as const,
    },
  };

  return (
    <div className="field" data-invalid={error ? 'true' : undefined} style={{ gap: 6 }}>
      <label className="field__label" htmlFor={id} style={{ fontSize: 14 }}>
        {label}
        {required && <span className="field__required" aria-hidden="true"> *</span>}
      </label>

      {multiline ? (
        <textarea
          {...common}
          ref={focusRef as React.RefObject<HTMLTextAreaElement>}
          rows={4}
          style={{ ...common.style, resize: 'vertical' }}
        />
      ) : (
        <input
          {...common}
          ref={focusRef as React.RefObject<HTMLInputElement>}
          type={type}
          inputMode={inputMode}
          autoComplete={autoComplete}
          // 语义化 type 让系统弹出正确的键盘；autocomplete 让系统能填充
          enterKeyHint="next"
          style={common.style}
        />
      )}

      {hint && !error && <p className="field__help" id={helpId} style={{ fontSize: 13 }}>{hint}</p>}
      {error && (
        <p className="field__error" id={errId} role="alert" style={{ fontSize: 13 }}>
          <IconAlert size={14} />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}

/* 草稿自动保存 —— 返回不丢输入 */
export function useDraft<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = sessionStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : initial;
    } catch { return initial; }
  });

  useEffect(() => {
    try { sessionStorage.setItem(key, JSON.stringify(value)); } catch { /* 隐私模式忽略 */ }
  }, [key, value]);

  const clear = useCallback(() => {
    try { sessionStorage.removeItem(key); } catch { /* noop */ }
  }, [key]);

  return [value, setValue, clear] as const;
}

/* ========================================================================== */
/* 8 · 底部抽屉 —— 下滑关闭 + 焦点管理 + 未保存改动确认                             */
/* ========================================================================== */

export function Sheet({
  open, onClose, title, children, confirmDiscard, footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  /** 有未保存改动时应提供确认文案；不传则直接关闭 */
  confirmDiscard?: string;
  footer?: React.ReactNode;
}) {
  const [dy, setDy] = useState(0);
  const startY = useRef<number | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);

  const requestClose = useCallback(() => {
    if (confirmDiscard && !window.confirm(confirmDiscard)) return;
    onClose();
  }, [confirmDiscard, onClose]);

  useEffect(() => {
    if (!open) return;
    returnFocus.current = document.activeElement as HTMLElement;
    panelRef.current?.querySelector<HTMLElement>('[data-autofocus]')?.focus();
    panelRef.current?.focus();

    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') requestClose(); };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      returnFocus.current?.focus();
    };
  }, [open, requestClose]);

  if (!open) return null;

  // 下滑关闭：移动阈值避免误触（drag threshold）
  const onPointerDown = (e: React.PointerEvent) => { startY.current = e.clientY; };
  const onPointerMove = (e: React.PointerEvent) => {
    if (startY.current === null) return;
    const delta = e.clientY - startY.current;
    if (delta > 4) setDy(delta);     // 4px 阈值
  };
  const onPointerUp = () => {
    if (dy > 96) requestClose();
    setDy(0);
    startY.current = null;
  };

  return (
    <>
      <div
        className="scrim"
        onClick={requestClose}
        aria-hidden="true"
        style={{ zIndex: 'var(--z-overlay)' }}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="sheet-title"
        tabIndex={-1}
        style={{
          position: 'fixed', insetInline: 0, bottom: 0,
          zIndex: 'var(--z-modal)',
          background: 'var(--color-surface-raised)',
          borderTopLeftRadius: 'var(--r-sheet)', borderTopRightRadius: 'var(--r-sheet)',
          paddingBottom: 'var(--safe-bottom)',
          transform: `translateY(${dy}px)`,
          // 只跟随手势实时位移，松手时 150ms 归位；可被下一次手势中断
          transition: dy === 0 ? 'transform var(--dur-normal) var(--ease-enter)' : 'none',
          maxHeight: '88dvh', display: 'flex', flexDirection: 'column',
        }}
      >
        {/* 抓握提示：让用户知道可以下滑关闭 */}
        <div
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          style={{ padding: '10px 0 4px', display: 'flex', justifyContent: 'center', touchAction: 'none', cursor: 'grab' }}
        >
          <span aria-hidden="true" style={{ width: 36, height: 4, borderRadius: 'var(--r-pill)', background: 'var(--color-border-strong)' }} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 16px 8px' }}>
          <h2 id="sheet-title" style={{ margin: 0, fontSize: 18, fontWeight: 600 }} className="grow">
            {title}
          </h2>
          <TouchTarget label="关闭" onActivate={requestClose}>
            <IconClose size={22} />
          </TouchTarget>
        </div>

        <div style={{ overflowY: 'auto', padding: '0 16px 16px' }}>{children}</div>
        {footer && <div style={{ padding: 8, borderTop: '1px solid var(--color-border)' }}>{footer}</div>}
      </div>
    </>
  );
}

/* ========================================================================== */
/* 9 · 骨架列表 —— >1s 用骨架屏；尺寸与真实行一致，避免加载完成时跳动                 */
/* ========================================================================== */

export function SkeletonList({ rows = 5 }: { rows?: number }) {
  return (
    <div aria-busy="true" style={{ display: 'flex', flexDirection: 'column', gap: TOUCH_GAP }}>
      <VisuallyHidden>正在加载</VisuallyHidden>
      {Array.from({ length: rows }, (_, i) => (
        <div
          key={i}
          aria-hidden="true"
          style={{ display: 'flex', alignItems: 'center', gap: 12, minHeight: 56, padding: '0 4px' }}
        >
          <span className="skeleton" style={{ width: 40, height: 40, borderRadius: 'var(--r-pill)', flex: '0 0 auto' }} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span className="skeleton" style={{ height: 14, width: '62%' }} />
            <span className="skeleton" style={{ height: 12, width: '40%' }} />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ========================================================================== */
/* 10 · 弱网降级提示                                                            */
/* ========================================================================== */

export function OfflineNotice({ onRetry }: { onRetry: () => void }) {
  return (
    <div
      role="status"
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '10px 16px', marginBottom: 12,
        background: 'var(--color-warn-bg)',
        border: '1px solid var(--color-warn)',
        borderRadius: 'var(--r-control)',
        fontSize: 14,
      }}
    >
      <span style={{ color: 'var(--color-warn)', flex: '0 0 auto' }}><IconAlert size={16} /></span>
      <span className="grow">当前离线，显示的是 3 分钟前的缓存。新数据会在联网后自动补上。</span>
      <Button variant="ghost" size="sm" onClick={onRetry}>重试</Button>
    </div>
  );
}

/* ========================================================================== */
/* 11 · 列表行（不用横向滑动 —— 主内容区避免横向手势冲突）                          */
/* ========================================================================== */

export function ListRow({
  title, subtitle, trailing, onPress,
}: { title: string; subtitle?: string; trailing?: React.ReactNode; onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} ariaLabel={subtitle ? `${title}，${subtitle}` : title}>
      <div className="grow" style={{ minWidth: 0 }}>
        <div style={{ fontSize: 16, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {title}
        </div>
        {subtitle && (
          <div style={{ marginTop: 2, fontSize: 13, color: 'var(--color-text-3)' }}>{subtitle}</div>
        )}
      </div>
      {trailing}
      {/* 可点击暗示：右侧 chevron（不是只靠颜色暗示） */}
      {onPress && !trailing && (
        <span aria-hidden="true" style={{ color: 'var(--color-text-4)', display: 'inline-flex' }}>
          <IconChevronRight size={18} />
        </span>
      )}
    </Pressable>
  );
}

/* ========================================================================== */
/* 12 · 组装示例                                                                */
/* ========================================================================== */

type IconFn = (p: { size?: number }) => JSX.Element;

const IconHome: IconFn = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m3 10 9-7 9 7v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" /><path d="M9 22V12h6v10" /></svg>
);
const IconList: IconFn = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M8 6h13" /><path d="M8 12h13" /><path d="M8 18h13" /><path d="M3 6h.01" /><path d="M3 12h.01" /><path d="M3 18h.01" /></svg>
);
const IconBell: IconFn = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 8 3 8H3s3-1 3-8" /><path d="M10.3 21a2 2 0 0 0 3.4 0" /></svg>
);
const IconUser: IconFn = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
);

export function MobileAppPage() {
  const [tab, setTab] = useState('home');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [offline, setOffline] = useState(false);
  const [note, setNote, clearDraft] = useDraft('draft:note', '');
  const [noteErr, setNoteErr] = useState<string>();

  return (
    <ToastProvider>
      <MobileShell
        header={
          <MobileAppBar
            title="今日巡检"
            trailing={
              <TouchTarget label="搜索" onActivate={() => {}}>
                <IconSearch size={22} />
              </TouchTarget>
            }
          />
        }
        actionBar={
          /* 主操作固定在拇指热区；「全部确认」是高频动作，不放危险操作 */
          <ThumbActionBar
            primary={{ label: '开始下一次巡检', onClick: () => setLoading(true), loading }}
            hint="上次巡检：今天 09:12，用时 4 分 20 秒"
          />
        }
        tabBar={
          <BottomTabBar
            items={[
              { id: 'home', label: '首页', icon: IconHome },
              { id: 'list', label: '任务', icon: IconList, badge: 3 },
              { id: 'alerts', label: '告警', icon: IconBell, badge: 12 },
              { id: 'me', label: '我的', icon: IconUser },
            ]}
            current={tab}
            onSelect={setTab}
          />
        }
      >
        {offline && <OfflineNotice onRetry={() => setOffline(false)} />}

        {/* 区块间距 ≥ 内部间距 ×3；单列纵向流 */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ margin: '0 0 12px', fontSize: 18, fontWeight: 600 }}>待处理</h2>
          {loading ? (
            <SkeletonList rows={3} />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: TOUCH_GAP }}>
              <ListRow
                title="深圳枢纽 GW-SZ-01"
                subtitle="异常占比 4.3%，高于阈值 2%"
                trailing={<StatusBadge severity="err">严重</StatusBadge>}
                onPress={() => setSheetOpen(true)}
              />
              <ListRow
                title="北京分拣线 #3"
                subtitle="吞吐较昨日同期下降 18%"
                trailing={<StatusBadge severity="warn">警告</StatusBadge>}
                onPress={() => setSheetOpen(true)}
              />
              <ListRow
                title="采集器 c-17"
                subtitle="心跳延迟 41 秒，已自动重启"
                trailing={<StatusBadge severity="unknown">待确认</StatusBadge>}
                onPress={() => setSheetOpen(true)}
              />
            </div>
          )}
        </section>

        {/* 现场记录 —— 单列表单 + 草稿自动保存 */}
        <section style={{ marginBottom: 24 }}>
          <h2 style={{ margin: '0 0 12px', fontSize: 18, fontWeight: 600 }}>现场记录</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <MobileField
              label="设备编号"
              value=""
              onChange={() => {}}
              autoComplete="off"
              inputMode="text"
              placeholder="扫描或输入，例如 GW-SZ-01"
              hint="扫码会自动填入；手输时不用区分大小写"
            />
            <MobileField
              label="现场情况"
              value={note}
              onChange={setNote}
              multiline
              hint="写你看到的就行，不用工整。离开页面会自动存草稿。"
              error={noteErr}
              onBlur={() => setNoteErr(note.trim().length < 4 ? '至少写 4 个字，方便交接的人看懂' : undefined)}
            />
          </div>
        </section>

        {/* 次级入口 */}
        <section>
          <h2 style={{ margin: '0 0 12px', fontSize: 18, fontWeight: 600 }}>快捷入口</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: TOUCH_GAP }}>
            <ListRow title="历史巡检" subtitle="最近 90 天" onPress={() => {}} />
            <ListRow title="交接说明" subtitle="写给下一位值班" onPress={() => {}} />
            <ListRow title="导出今天记录" subtitle="CSV，含时间与设备号" onPress={() => {}} />
          </div>
        </section>
      </MobileShell>

      <Sheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title="GW-SZ-01 详情"
        confirmDiscard="有未保存的现场记录，确定要关闭吗？"
        footer={
          <div style={{ display: 'flex', gap: TOUCH_GAP }}>
            <Button variant="secondary" block onClick={() => setSheetOpen(false)}>稍后处理</Button>
            <Button block onClick={() => { clearDraft(); setSheetOpen(false); }}>
              标记已处理
            </Button>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
            <span className="kpi__value kpi__value--sm">4.3<span className="kpi__unit">%</span></span>
            <StatusBadge severity="err">超阈值</StatusBadge>
          </div>
          <p style={{ margin: 0, fontSize: 15, color: 'var(--color-text-2)', lineHeight: 1.65 }}>
            异常占比从 09:48 开始上升，10:42 达到 4.3%，超过阈值 2%。同期该枢纽订单量没有明显变化，所以大概率不是流量问题。
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Button variant="secondary" block icon={<IconArrowRight size={16} />}>查看最近 1 小时日志</Button>
            <Button variant="secondary" block icon={<IconCheck size={16} />}>创建工单并指派</Button>
            <Button variant="ghost" block icon={<IconUndo size={16} />}>撤销自动重启（c-17）</Button>
          </div>
          {/* 危险操作不放吸底栏，放内容区并二次确认 */}
          <p style={{ margin: 0, fontSize: 13, color: 'var(--color-text-3)' }}>
            注：停用该设备需要二次确认，入口在「设备设置」内。
          </p>
        </div>
      </Sheet>
    </ToastProvider>
  );
}
