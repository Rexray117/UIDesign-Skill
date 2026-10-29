/* ============================================================================
 * 场景模板 5 / 6 · 数据可视化大屏（ext-dataviz）
 * ----------------------------------------------------------------------------
 * 定位：在 3–8 米外，让一屋子人在 10 秒内看懂此刻的状态。
 * 判据：远距离可读性 + 叙事顺序，而不是信息总量。
 *
 * 与管理/监控界面的关键区别：
 *   监控界面 —— 近距、长时间、个体操作 → 高密度
 *   数据大屏 —— 远距、短时间、群体观看 → 低密度、大字号、强层次
 *   ⚠️ 把监控界面的密度直接搬到大屏上，是本场景最常见的错误。
 *
 * 演示规则：
 *   · ext-dataviz.md §5.1  字号按观看距离反推（3–4m→18px / 4–6m→24px / 6–8m→32px）
 *   · ext-dataviz.md §5.2  深色底减少溢光；发光 ≤2 处且都有语义
 *   · ext-dataviz.md §5.3  锚定基准分辨率等比缩放；安全边距避让屏体边框
 *   · ext-dataviz.md §5.4  图表 ≤6 个 · 单图 ≤50 点 · 关键值直接标在图上
 *   · ext-dataviz.md §5.5  必须显示「最后更新时间」；无数据必须显式
 *   · quality/charts.md    色盲安全（颜色 + 图案 + 形状三重编码）
 *   · anti-ai/D3           ⭐ 零装饰动画；发光只给活跃态；无循环动画
 *   · motion.md            自动轮播/滚动必须可暂停；reduced-motion 时停止
 *
 * ⚠️ 误杀防护：超大字号、低信息量、深色底、大内边距、无交互控件
 *   都是本场景的刻意选择，不得削减。
 *
 * 场景默认旋钮：--variance 4 / --motion 4 / --density 8
 * 推荐风格：05 Data-Dense Dashboard · 06 Dark Mode (OLED) · 08 HUD Sci-Fi FUI
 * ==========================================================================*/

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Button, IconButton, IconPause, IconRefresh, StatusBadge, VisuallyHidden, cn } from './primitives';

/* ========================================================================== */
/* 观看距离 → 字号档                                                            */
/* ========================================================================== */

export type ViewDistance = '3-4m' | '4-6m' | '6-8m';

const SCALE: Record<ViewDistance, { min: number; kpi: number; title: number }> = {
  '3-4m': { min: 18, kpi: 64, title: 32 },
  '4-6m': { min: 24, kpi: 104, title: 40 },
  '6-8m': { min: 32, kpi: 168, title: 52 },
};

/* ========================================================================== */
/* 1 · 屏幕框 —— 锚定基准分辨率等比缩放 + 安全边距                                */
/* ========================================================================== */

export function ScreenFrame({
  baseWidth = 1920, baseHeight = 1080, safeInset = 40, distance, children,
}: {
  baseWidth?: number; baseHeight?: number;
  /** 安全边距：避让屏体边框与拼接接缝 */
  safeInset?: number;
  distance: ViewDistance;
  children: React.ReactNode;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const fit = () => {
      const el = hostRef.current;
      if (!el) return;
      // 等比缩放：取宽高比中较小者，保证内容完整可见且不变形
      setScale(Math.min(el.clientWidth / baseWidth, el.clientHeight / baseHeight));
    };
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, [baseWidth, baseHeight]);

  const { min, kpi, title } = SCALE[distance];

  return (
    <div
      ref={hostRef}
      data-density="compact"
      data-theme="dark"
      style={{
        width: '100%', height: '100dvh', overflow: 'hidden',
        background: 'var(--screen-bg)',   // token 层定义，非组件内裸值
        color: 'var(--screen-fg)',
        // 把字号档暴露成变量，子孙直接消费 —— 一次改动全局生效
        ['--fs-min' as string]: `${min}px`,
        ['--fs-kpi' as string]: `${kpi}px`,
        ['--fs-title' as string]: `${title}px`,
      }}
    >
      <div style={{
        width: baseWidth, height: baseHeight,
        transform: `scale(${scale})`, transformOrigin: 'top left',
        padding: safeInset,                       // 安全边距
        boxSizing: 'border-box',
        display: 'grid', gap: 20,
        // 叙事顺序：顶部总览 → 中部主图 → 底部支撑；视线路径被设计过，非均匀平铺
        gridTemplateRows: 'auto auto 1fr auto',
      }}>
        {children}
      </div>
    </div>
  );
}

/* ========================================================================== */
/* 2 · 大屏标题条 —— 主题 + 时钟 + 时效                                          */
/* ========================================================================== */

export function ScreenHeader({
  title, subtitle, updatedAt, staleAfterMs = 60_000,
}: { title: string; subtitle?: string; updatedAt: number; staleAfterMs?: number }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, []);

  const age = Math.max(0, now - updatedAt);
  const stale = age > staleAfterMs;

  return (
    <header style={{
      display: 'flex', alignItems: 'baseline', gap: 24,
      paddingBottom: 12, borderBottom: '1px solid var(--screen-rule)',
    }}>
      <h1 style={{ margin: 0, fontSize: 'var(--fs-title)', fontWeight: 600, letterSpacing: '-0.02em' }}>
        {title}
      </h1>
      {subtitle && <span style={{ fontSize: 'var(--fs-min)', color: 'var(--color-text-2)' }}>{subtitle}</span>}

      <div style={{ marginInlineStart: 'auto', display: 'flex', alignItems: 'baseline', gap: 20, fontSize: 'var(--fs-min)' }}>
        {/* 时效是硬要求：陈旧必须变色，不能悄悄过期 */}
        <span className="num" style={{ color: stale ? 'var(--color-warn)' : 'var(--color-text-3)', fontVariantNumeric: 'tabular-nums' }}>
          {stale ? '数据陈旧 · ' : ''}{formatClock(now)}
        </span>
        <span style={{ color: 'var(--color-text-3)' }}>更新于 {Math.floor(age / 1000)} 秒前</span>
      </div>
    </header>
  );
}

/* ========================================================================== */
/* 3 · 大屏 KPI —— 主指标与其它元素对比 ≥5×                                      */
/* ========================================================================== */

export function BigKpi({
  label, value, unit, delta, target, primary,
}: {
  label: string; value: number; unit: string;
  delta?: number; target?: string; primary?: boolean;
}) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: 8,
      // 唯一主指标用更大字号 + 一条语义色顶线建立主次，不靠阴影堆叠
      borderTop: primary ? '3px solid var(--color-primary)' : '1px solid var(--screen-rule-strong)',
      paddingTop: 12,
    }}>
      <span style={{
        fontSize: 'var(--fs-min)', letterSpacing: '0.08em', textTransform: 'uppercase',
        color: 'var(--color-text-3)', fontWeight: 500,
      }}>
        {label}
      </span>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
        <span className="num" style={{
          fontSize: primary ? 'calc(var(--fs-kpi) * 1.35)' : 'var(--fs-kpi)',
          fontWeight: 600, lineHeight: 1, letterSpacing: '-0.03em',
          fontVariantNumeric: 'tabular-nums',
          color: 'var(--color-text-1)',
        }}>
          {formatNum(value)}
        </span>
        <span style={{ fontSize: 'calc(var(--fs-min) * 1.2)', color: 'var(--color-text-2)' }}>{unit}</span>
      </div>

      <div style={{ display: 'flex', gap: 16, fontSize: 'var(--fs-min)', color: 'var(--color-text-3)' }}>
        {typeof delta === 'number' && (
          <span className="num" style={{ color: delta > 0 ? 'var(--color-err)' : 'var(--color-ok)' }}>
            {delta > 0 ? '▲' : '▼'} {Math.abs(delta).toFixed(1)}% 同比
          </span>
        )}
        {target && <span className="num">目标 {target}</span>}
      </div>
    </div>
  );
}

/* ========================================================================== */
/* 4 · 图表面板 —— 标题 + 时效 + 图表位；无数据/加载/错误三态齐全                    */
/* ========================================================================== */

export function ChartPanel({
  title, unit, state, children, footnote,
}: {
  title: string; unit?: string;
  state: 'loading' | 'ready' | 'empty' | 'error';
  children: React.ReactNode;
  footnote?: string;
}) {
  return (
    <section
      aria-label={title}
      style={{
        display: 'flex', flexDirection: 'column', minWidth: 0,
        padding: 20, borderRadius: 'var(--r-surface)',
        background: 'var(--screen-panel-bg)',
        border: '1px solid var(--screen-panel-border)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 12 }}>
        <h2 style={{ margin: 0, fontSize: 'var(--fs-min)', fontWeight: 600, letterSpacing: '0.04em' }}>
          {title}
        </h2>
        {unit && <span style={{ fontSize: 14, color: 'var(--color-text-3)' }}>{unit}</span>}
      </div>

      <div style={{ flex: '1 1 auto', minHeight: 0 }}>
        {state === 'loading' && (
          <div aria-busy="true" style={{ height: '100%', borderRadius: 'var(--r-control)', background: 'var(--screen-panel-bg)' }}>
            <VisuallyHidden>图表加载中</VisuallyHidden>
          </div>
        )}

        {/* 无数据必须显式说明 —— 空白无法与「值为 0」区分 */}
        {state === 'empty' && (
          <p style={{ margin: 0, fontSize: 'var(--fs-min)', color: 'var(--color-text-3)' }}>
            该时段没有数据。上游采集器在 09:12–09:40 之间离线，恢复后已补采。
          </p>
        )}

        {/* 错误态给重试，不留空坐标轴 */}
        {state === 'error' && (
          <p style={{ margin: 0, fontSize: 'var(--fs-min)', color: 'var(--color-warn)' }}>
            图表数据拉取失败（网关 503）。本地缓存的数据仍显示在上方指标区。
          </p>
        )}

        {state === 'ready' && children}
      </div>

      {footnote && (
        <p style={{ margin: '12px 0 0', fontSize: 14, color: 'var(--color-text-3)' }}>{footnote}</p>
      )}
    </section>
  );
}

/* ========================================================================== */
/* 5 · 大屏折线图 —— 色盲安全：颜色 + 线型 + 直接标注 三重编码                      */
/* 关键值直接标在图上，减少远距离下的视线来回                                       */
/* ========================================================================== */

export function BigLineChart({
  series, width = 560, height = 200, showDirectLabels = true,
}: {
  series: Array<{
    name: string;
    color: string;
    dash?: string;          // 线型编码，供色盲用户区分
    points: number[];
  }>;
  width?: number; height?: number; showDirectLabels?: boolean;
}) {
  const bounds = useMemo(() => {
    const all = series.flatMap((s) => s.points);
    const min = Math.min(...all, 0);
    const max = Math.max(...all, 1);
    return { min, max, span: max - min || 1 };
  }, [series]);

  const toPath = (pts: number[]) => pts
    .map((p, i) => {
      const x = (i / Math.max(1, pts.length - 1)) * width;
      const y = height - ((p - bounds.min) / bounds.span) * (height - 20) - 10;
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(' ');

  const yOf = (p: number) => height - ((p - bounds.min) / bounds.span) * (height - 20) - 10;

  return (
    <svg
      width="100%" height="100%" viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none" role="img"
      aria-label={`趋势图，${series.length} 条系列：${series.map((s) => `${s.name} 最新 ${s.points.at(-1)}`).join('，')}`}
    >
      {/* 网格线低对比，不与数据竞争 */}
      {[0, 0.25, 0.5, 0.75, 1].map((r) => (
        <line key={r} x1={0} x2={width} y1={r * height} y2={r * height}
          stroke="var(--chart-grid)" strokeWidth={1} />
      ))}

      {series.map((s) => {
        const last = s.points.at(-1) ?? 0;
        return (
          <g key={s.name}>
            <path
              d={toPath(s.points)}
              fill="none" stroke={s.color} strokeWidth={2.5}
              strokeDasharray={s.dash} strokeLinecap="round" strokeLinejoin="round"
            />
            {/* 直接标注：远距离下省去「看图例 → 找线 → 回来看值」的来回 */}
            {showDirectLabels && (
              <>
                <circle cx={width} cy={yOf(last)} r={4} fill={s.color} />
                <text
                  x={width - 6} y={yOf(last) - 10}
                  textAnchor="end" fill={s.color}
                  fontSize={16} fontWeight={600}
                  style={{ fontVariantNumeric: 'tabular-nums' }}
                >
                  {s.name} {formatNum(last)}
                </text>
              </>
            )}
          </g>
        );
      })}
    </svg>
  );
}

/* ========================================================================== */
/* 6 · 告警跑马灯 —— 必须可暂停；焦点或 reduced-motion 时停止                       */
/* ========================================================================== */

export function AlertMarquee({
  items, intervalMs = 6000,
}: { items: Array<{ id: string; severity: 'warn' | 'err'; text: string; at: string }>; intervalMs?: number }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (paused || items.length <= 1) return;
    // reduced-motion：不自动轮播，直接停在第一条
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (reduced.matches) return;

    const t = window.setInterval(() => setIndex((i) => (i + 1) % items.length), intervalMs);
    return () => window.clearInterval(t);
  }, [paused, items.length, intervalMs]);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    // 聚焦时停止（无障碍要求）
    const stop = () => setPaused(true);
    const resume = () => setPaused(false);
    el.addEventListener('focusin', stop);
    el.addEventListener('focusout', resume);
    el.addEventListener('pointerenter', stop);
    el.addEventListener('pointerleave', resume);
    return () => {
      el.removeEventListener('focusin', stop);
      el.removeEventListener('focusout', resume);
      el.removeEventListener('pointerenter', stop);
      el.removeEventListener('pointerleave', resume);
    };
  }, []);

  const current = items[index];
  if (!current) return null;

  return (
    <div
      ref={rootRef}
      role="marquee"
      aria-live="off"          /* 自动更新不打断读屏；由控件控制翻阅 */
      aria-label="滚动告警"
      style={{
        display: 'flex', alignItems: 'center', gap: 16,
        padding: '12px 20px', borderRadius: 'var(--r-surface)',
        background: current.severity === 'err' ? 'rgba(185,28,28,0.16)' : 'rgba(180,83,9,0.16)',
        border: `1px solid ${current.severity === 'err' ? 'var(--color-err)' : 'var(--color-warn)'}`,
      }}
    >
      <StatusBadge severity={current.severity}>{current.severity === 'err' ? '严重' : '警告'}</StatusBadge>

      <span style={{ fontSize: 'var(--fs-min)', fontWeight: 500 }} className="grow">
        {current.text}
      </span>

      <span className="num" style={{ fontSize: 16, color: 'var(--color-text-3)', fontVariantNumeric: 'tabular-nums' }}>
        {current.at} · {index + 1}/{items.length}
      </span>

      <Button variant="ghost" size="sm" onClick={() => setIndex((i) => (i + 1) % items.length)}>
        下一条
      </Button>

      {/* 暂停/继续 —— 自动播放内容的强制控件 */}
      <IconButton
        label={paused ? '继续轮播告警' : '暂停轮播告警'}
        icon={paused ? <IconRefresh size={16} /> : <IconPause size={16} />}
        onClick={() => setPaused((v) => !v)}
      />

      <VisuallyHidden>
        {paused ? '轮播已暂停' : '轮播进行中'}
      </VisuallyHidden>
    </div>
  );
}

/* ========================================================================== */
/* 7 · 组装示例（典型指挥中心布局：1 行总览 + 1 行主图 + 1 行支撑 + 1 行告警）         */
/* ========================================================================== */

export function DatavizScreen() {
  const [updatedAt] = useState(Date.now());
  const [chartState, setChartState] = useState<'loading' | 'ready' | 'empty' | 'error'>('ready');

  return (
    <ScreenFrame distance="6-8m" safeInset={48}>
      <ScreenHeader
        title="全网运力总览"
        subtitle="华东 · 华南 · 华北"
        updatedAt={updatedAt}
      />

      {/* 顶部总览：3 个指标，只有一个主指标 —— 分区数 3，远低于 6 的上限 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr', gap: 40 }}>
        <BigKpi primary label="在途订单" value={18426} unit="单" delta={+4.2} target="18,000" />
        <BigKpi label="平均时延" value={38} unit="分钟" delta={-2.1} target="≤45" />
        <BigKpi label="异常占比" value={1.7} unit="%" delta={+0.3} target="≤2%" />
      </div>

      {/* 中部主图：跨满宽，唯一视觉重心 */}
      <ChartPanel
        title="订单量与异常量（近 24 小时 · 每小时）"
        state={chartState}
        footnote="实线=订单量；虚线=异常量。两条线用线型区分，不依赖颜色辨认。"
      >
        <BigLineChart
          series={[
            {
              name: '订单', color: 'var(--chart-1)',
              points: [420, 380, 340, 300, 290, 330, 520, 780, 1020, 1180, 1240, 1190,
                       1150, 1210, 1280, 1310, 1260, 1180, 1040, 880, 720, 600, 520, 460],
            },
            {
              name: '异常', color: 'var(--chart-2)', dash: 'var(--series-dash-2)',
              points: [8, 6, 5, 4, 3, 4, 9, 14, 22, 31, 38, 34,
                       30, 33, 41, 46, 39, 35, 27, 20, 15, 12, 10, 9],
            },
          ]}
        />
      </ChartPanel>

      {/* 底部支撑：3 个次级区，字号与权重明显低于上方 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: 20 }}>
        <ChartPanel title="区域分布" state="ready" footnote="按订单量占比">
          <DistributionBars
            rows={[
              { label: '华东', pct: 46 }, { label: '华南', pct: 31 }, { label: '华北', pct: 23 },
            ]}
          />
        </ChartPanel>

        <ChartPanel title="枢纽吞吐对比" state="empty" />

        <ChartPanel title="服务可用性" state="ready" footnote="近 30 日">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <span className="num" style={{ fontSize: 'calc(var(--fs-kpi) * 0.6)', fontWeight: 600, lineHeight: 1 }}>
              99.94<span style={{ fontSize: '0.34em', marginInlineStart: 6 }}>%</span>
            </span>
            <span style={{ fontSize: 16, color: 'var(--color-text-3)' }}>
              低于目标的时长累计 7 分 12 秒，全部发生在 9 月 14 日凌晨的网关升级窗口
            </span>
          </div>
        </ChartPanel>
      </div>

      <AlertMarquee
        items={[
          { id: 'a1', severity: 'err', text: '华南深圳枢纽 GW-SZ-01 异常占比 4.3%，连续 12 分钟高于阈值 2%', at: '10:42' },
          { id: 'a2', severity: 'warn', text: '华北北京枢纽分拣线 #3 吞吐较昨日同期下降 18%', at: '10:38' },
          { id: 'a3', severity: 'warn', text: '采集器 c-17 心跳延迟 41 秒，已自动重启一次', at: '10:31' },
        ]}
      />
    </ScreenFrame>
  );
}

/** 分布条：百分比直接标在条上，远距离无需图例 */
function DistributionBars({ rows }: { rows: Array<{ label: string; pct: number }> }) {
  return (
    <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
      {rows.map((r) => (
        <li key={r.label} style={{ display: 'grid', gridTemplateColumns: '4.5em 1fr auto', gap: 12, alignItems: 'center' }}>
          <span style={{ fontSize: 18, color: 'var(--color-text-2)' }}>{r.label}</span>
          <span
            role="img"
            aria-label={`${r.label} 占比 ${r.pct}%`}
            style={{ height: 14, borderRadius: 'var(--r-micro)', background: 'var(--chart-track)', overflow: 'hidden' }}
          >
            <span style={{ display: 'block', width: `${r.pct}%`, height: '100%', background: 'var(--chart-1)' }} />
          </span>
          <span className="num" style={{ fontSize: 22, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
            {r.pct}%
          </span>
        </li>
      ))}
    </ul>
  );
}

/* ========================================================================== */
/* 工具                                                                        */
/* ========================================================================== */

function formatNum(n: number): string {
  return n >= 1000 ? n.toLocaleString('zh-CN') : String(n);
}

function formatClock(ts: number): string {
  const d = new Date(ts);
  const p = (v: number) => String(v).padStart(2, '0');
  return `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}
