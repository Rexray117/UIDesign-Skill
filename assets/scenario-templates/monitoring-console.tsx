/* ============================================================================
 * 场景模板 2 / 6 · 企业监控界面（core-monitoring）
 * ----------------------------------------------------------------------------
 * 定位：让值班人员在最短时间内发现「哪一台出了问题」。
 * 判据：若某个设计决策让人多花 1 秒才发现异常，这个决策就是错的 —— 不管多好看。
 *
 * 演示规则：
 *   · core-monitoring.md §三    异常必须最先被看到；UI 中性、色彩留给数据
 *   · core-monitoring.md §5.1   状态色必须配图标/形状（色盲安全）
 *   · core-monitoring.md §5.2   关键指标 36–72px 等宽；标签放开字距
 *   · core-monitoring.md §5.4   无数据 ≠ 正常；数据陈旧必须变色
 *   · core-monitoring.md §5.5   数值刷新不得引起布局位移；提供冻结开关
 *   · anti-ai/D2                界面零强调色，色彩预算全部给状态编码
 *   · anti-ai/D3                零装饰动画；每屏动画元素 ≤2 个
 *   · motion.md                 仅数据更新与告警脉冲；reduced-motion 降级为静态
 *
 * ⚠️ 误杀防护（本场景最高风险，改动前必读 false-positives.md）：
 *   以下特征「是设计纪律，不是 AI 味」，不得削减：
 *     ① 高信息密度   ② 12–13px 小字号   ③ 深色主题   ④ 居中指标卡
 *     ⑤ UI 单调低饱和   ⑥ 对称稳定网格   ⑦ 一致重复结构   ⑧ 无 hover 抬升
 *   判定口令：「改了之后，值班员会不会更容易漏掉告警？」
 *
 * 场景默认旋钮：--variance 3 / --motion 2 / --density 9
 * 推荐风格：05 Data-Dense Dashboard · 06 Dark Mode (OLED) · 08 HUD Sci-Fi FUI
 * ==========================================================================*/

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Button, Card, IconAlert, IconButton, IconCritical, IconPause, IconRefresh,
  IconCheck, Panel, StatusBadge, Switch, TableSkeleton, VisuallyHidden, cn,
} from './primitives';

/* ========================================================================== */
/* 类型                                                                        */
/* ========================================================================== */

export type Severity = 'ok' | 'warn' | 'err' | 'unknown';

export type DeviceRow = {
  id: string;
  name: string;
  site: string;
  severity: Severity;
  metric: number;
  unit: string;
  updatedAt: number;   // epoch ms
};

/* ========================================================================== */
/* 1 · 全局状态条 —— 首屏第一行，一眼给出「整体是否正常」                        */
/* ========================================================================== */

export function StatusBar({
  counts, frozen, onToggleFreeze, now,
}: {
  counts: Record<Severity, number>;
  frozen: boolean;
  onToggleFreeze: () => void;
  now: number;
}) {
  const total = counts.ok + counts.warn + counts.err + counts.unknown;
  const worst: Severity = counts.err > 0 ? 'err' : counts.warn > 0 ? 'warn' : counts.unknown > 0 ? 'unknown' : 'ok';

  return (
    <div
      style={{
        display: 'flex', alignItems: 'center', gap: 'var(--space-gap)',
        padding: 'var(--space-component)', borderBottom: '1px solid var(--color-border)',
        background: 'var(--color-surface)',
      }}
    >
      {/* 整体结论用超大字号 —— 这是全屏唯一的主指标 */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--sp-2)' }}>
        <span className="kpi__value kpi__value--sm" style={{
          color: worst === 'err' ? 'var(--color-err)'
            : worst === 'warn' ? 'var(--color-warn)'
            : worst === 'unknown' ? 'var(--color-text-3)' : 'var(--color-ok)',
        }}>
          {counts.err}
        </span>
        <span style={{ fontSize: 'var(--fs-4)', color: 'var(--color-text-2)' }}>台严重</span>
      </div>

      <div style={{ display: 'flex', gap: 'var(--sp-4)' }}>
        <CountChip severity="warn" n={counts.warn} label="警告" />
        <CountChip severity="unknown" n={counts.unknown} label="失联" />
        <CountChip severity="ok" n={counts.ok} label="正常" />
        <span className="dim" style={{ fontSize: 'var(--fs-3)', alignSelf: 'center' }}>
          / 共 {total} 台
        </span>
      </div>

      <div style={{ marginInlineStart: 'auto', display: 'flex', alignItems: 'center', gap: 'var(--sp-3)' }}>
        <Freshness at={now} />
        {/* 值班员需要定格分析 —— 冻结是必需功能，不是可选装饰 */}
        <Switch checked={frozen} onChange={onToggleFreeze}>
          {frozen ? '已冻结' : '实时刷新'}
        </Switch>
      </div>
    </div>
  );
}

function CountChip({ severity, n, label }: { severity: Severity; n: number; label: string }) {
  if (n === 0) {
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 'var(--fs-3)', color: 'var(--color-text-3)' }}>
        <StatusBadge severity={severity}>{`${label} 0`}</StatusBadge>
      </span>
    );
  }
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <StatusBadge severity={severity}>
        {/* 数字等宽：变化时不抖动列宽 */}
        <span className="num">{n}</span> {label}
      </StatusBadge>
    </span>
  );
}

/* ========================================================================== */
/* 2 · 数据时效 —— 陈旧必须能被看见                                             */
/* ========================================================================== */

export function Freshness({ at, staleAfterMs = 30_000 }: { at: number; staleAfterMs?: number }) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const t = window.setInterval(() => setTick((v) => v + 1), 1000);
    return () => window.clearInterval(t);
  }, []);

  const age = Math.max(0, Date.now() - at);
  const stale = age > staleAfterMs;
  const text = age < 1000 ? '刚刚' : age < 60_000 ? `${Math.floor(age / 1000)} 秒前` : `${Math.floor(age / 60_000)} 分钟前`;

  return (
    <span
      // 陈旧时变色 + 文案，双重编码
      className={cn('num')}
      style={{
        fontSize: 'var(--fs-2)',
        color: stale ? 'var(--color-warn)' : 'var(--color-text-3)',
        fontVariantNumeric: 'tabular-nums',
      }}
    >
      {stale ? '数据陈旧 · ' : '更新于 '}{text}
      <span data-tick={tick} hidden />
    </span>
  );
}

/* ========================================================================== */
/* 3 · KPI 卡 —— 超大等宽数字 + 迷你趋势线 + 变化量                             */
/* 差异化抓手：只有告警数字用 56px 等宽，与周围 12px 形成 4.6× 反差              */
/* ========================================================================== */

export function KpiCard({
  label, value, unit, delta, series, severity = 'ok', thresholdLabel,
}: {
  label: string;
  value: number;
  unit: string;
  delta: number;             // 相对上一周期，带符号
  series: number[];
  severity?: Severity;
  thresholdLabel?: string;
}) {
  const danger = severity === 'err' || severity === 'warn';
  return (
    <Card style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)' }}>
      {/* 标签 11px + 放开字距；不靠颜色传达状态 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--sp-2)' }}>
        <span className="kpi__label">{label}</span>
        {danger && <StatusBadge severity={severity}>{severity === 'err' ? '超阈值' : '接近阈值'}</StatusBadge>}
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--sp-2)' }}>
        {/* 数字等宽 —— 刷新时列宽稳定，不引起布局位移 */}
        <span className="kpi__value" style={{ color: danger ? 'var(--color-err)' : 'var(--color-text-1)' }}>
          {formatNum(value)}
          <span className="kpi__unit">{unit}</span>
        </span>
        <DeltaTag delta={delta} />
      </div>

      {thresholdLabel && (
        <div style={{ fontSize: 'var(--fs-1)', color: 'var(--color-text-3)' }}>{thresholdLabel}</div>
      )}

      <Sparkline points={series} danger={danger} />
    </Card>
  );
}

function DeltaTag({ delta }: { delta: number }) {
  const up = delta > 0;
  const flat = Math.abs(delta) < 0.05;
  return (
    <span className="num" style={{
      fontSize: 'var(--fs-2)',
      color: flat ? 'var(--color-text-3)' : up ? 'var(--color-err)' : 'var(--color-ok)',
    }}>
      {flat ? '持平' : `${up ? '▲' : '▼'} ${Math.abs(delta).toFixed(1)}%`}
    </span>
  );
}

/* 迷你趋势线：纯 SVG，无动画，尊重 reduced-motion（本来就无动画） */
export function Sparkline({
  points, danger, width = 120, height = 28,
}: { points: number[]; danger?: boolean; width?: number; height?: number }) {
  const d = useMemo(() => {
    if (points.length < 2) return '';
    const min = Math.min(...points);
    const max = Math.max(...points);
    const span = max - min || 1;
    return points
      .map((p, i) => {
        const x = (i / (points.length - 1)) * width;
        const y = height - ((p - min) / span) * (height - 4) - 2;
        return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(' ');
  }, [points, width, height]);

  return (
    <svg
      width="100%" height={height} viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none" role="img"
      aria-label={`趋势：最近 ${points.length} 个采样点，最低 ${Math.min(...points)}，最高 ${Math.max(...points)}`}
      style={{ display: 'block', marginTop: 'auto' }}
    >
      <path
        d={d} fill="none"
        stroke={danger ? 'var(--color-err)' : 'var(--color-text-4)'}
        strokeWidth={1.5}
      />
    </svg>
  );
}

/* ========================================================================== */
/* 4 · 告警列表 —— 全屏唯一主卡（跨列 + 字号跳档）                              */
/* 正常态安静、异常态打断；这是本场景唯一的硬约束                                */
/* ========================================================================== */

export function AlertList({
  rows, onAck, onOpen,
}: {
  rows: DeviceRow[];
  onAck: (id: string) => void;
  onOpen: (id: string) => void;
}) {
  const sorted = useMemo(
    () => [...rows].sort((a, b) => rank(a.severity) - rank(b.severity) || b.metric - a.metric),
    [rows],
  );

  if (!rows.length) {
    return (
      <Panel title="当前告警" meta="最近 15 分钟">
        <p style={{ margin: 0, fontSize: 'var(--fs-4)', color: 'var(--color-text-3)' }}>
          这 15 分钟内没有新告警。历史告警保留 90 天。
        </p>
      </Panel>
    );
  }

  return (
    <section
      aria-label="当前告警"
      className="panel card--primary"
      style={{ borderColor: 'var(--color-err)' }}
    >
      <header className="panel__head">
        <h2 className="panel__title" style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
          <span style={{ color: 'var(--color-err)', display: 'inline-flex' }} data-pulse>
            <IconCritical size={16} />
          </span>
          当前告警
          <span className="num" style={{ color: 'var(--color-err)' }}>{rows.length}</span>
        </h2>
        <span className="panel__meta">按严重度排序 · 点击行查看详情</span>
      </header>

      <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        {sorted.map((r) => (
          <li key={r.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
            <button
              type="button"
              onClick={() => onOpen(r.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 'var(--space-component)',
                width: '100%', minHeight: 44, padding: 'var(--sp-2) var(--space-component)',
                background: 'none', border: 0, cursor: 'pointer', textAlign: 'start',
                color: 'inherit', font: 'inherit',
              }}
            >
              <StatusBadge severity={r.severity} />
              <span style={{ fontWeight: 'var(--fw-medium)', fontSize: 'var(--fs-4)', minWidth: 160 }}>
                {r.name}
              </span>
              <span style={{ fontSize: 'var(--fs-3)', color: 'var(--color-text-3)', minWidth: 88 }}>
                {r.site}
              </span>
              {/* 数值等宽右对齐 —— 便于纵向比对 */}
              <span className="num" style={{
                marginInlineStart: 'auto', fontSize: 'var(--fs-5)', fontWeight: 'var(--fw-semibold)',
                color: r.severity === 'err' ? 'var(--color-err)' : 'inherit',
              }}>
                {formatNum(r.metric)}<span style={{ fontSize: 'var(--fs-2)', color: 'var(--color-text-3)', marginInlineStart: 2 }}>{r.unit}</span>
              </span>
              <span onClick={(e) => { e.stopPropagation(); onAck(r.id); }}>
                <Button variant="secondary" size="sm">确认</Button>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

const rank = (s: Severity) => (s === 'err' ? 0 : s === 'warn' ? 1 : s === 'unknown' ? 2 : 3);

/* ========================================================================== */
/* 5 · 紧凑明细表 —— 表头粘性 · 数字右对齐 · 空值显示 -                            */
/* ========================================================================== */

export function DeviceTable({
  rows, loading, onSort, sortKey, sortDir,
}: {
  rows: DeviceRow[];
  loading?: boolean;
  onSort: (key: 'name' | 'metric') => void;
  sortKey: 'name' | 'metric';
  sortDir: 'asc' | 'desc';
}) {
  if (loading) {
    return <div style={{ padding: 'var(--space-component)' }}><TableSkeleton rows={8} /></div>;
  }

  const ariaSort = (key: string) => (sortKey === key ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none');

  return (
    <div className="table-wrap">
      <table className="table">
        <caption className="sr-only">设备状态明细，可按设备名或指标值排序</caption>
        <thead>
          <tr>
            <th scope="col" aria-sort={ariaSort('name')}>
              <button type="button" onClick={() => onSort('name')}>
                设备 {sortKey === 'name' && <span aria-hidden="true">{sortDir === 'asc' ? '▲' : '▼'}</span>}
              </button>
            </th>
            <th scope="col">站点</th>
            <th scope="col">状态</th>
            <th scope="col" aria-sort={ariaSort('metric')} style={{ textAlign: 'end' }}>
              <button type="button" onClick={() => onSort('metric')}>
                指标 {sortKey === 'metric' && <span aria-hidden="true">{sortDir === 'asc' ? '▲' : '▼'}</span>}
              </button>
            </th>
            <th scope="col" style={{ textAlign: 'end' }}>更新</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td style={{ fontWeight: 'var(--fw-medium)' }}>{r.name}</td>
              <td className="dim">{r.site}</td>
              <td><StatusBadge severity={r.severity} /></td>
              {/* 空值一律显示 - ，不留白（空白与 0 无法区分） */}
              <td className="table__num">{Number.isFinite(r.metric) ? formatNum(r.metric) : '-'}</td>
              <td className="table__num dim">{formatClock(r.updatedAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ========================================================================== */
/* 6 · 无数据面板 —— 必须显式区分「未知」与「正常」                                */
/* ========================================================================== */

export function UnknownDataPanel({ device }: { device: string }) {
  return (
    <Panel title="最新读数" meta={device}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)' }}>
        <StatusBadge severity="unknown">未知</StatusBadge>
        <p style={{ margin: 0, fontSize: 'var(--fs-4)', color: 'var(--color-text-2)' }}>
          过去 4 分钟没有收到该设备的心跳。最后一次成功上报在 12:41:07（延迟 3.2s）。
        </p>
        <p style={{ margin: 0, fontSize: 'var(--fs-3)', color: 'var(--color-text-3)' }}>
          常见原因：网关重启、现场断电、采集器版本回滚。建议先看网关日志。
        </p>
        <div style={{ display: 'flex', gap: 'var(--sp-2)', marginTop: 'var(--sp-2)' }}>
          <Button variant="secondary" size="sm" icon={<IconRefresh size={14} />}>重新拉取</Button>
        </div>
      </div>
    </Panel>
  );
}

/* ========================================================================== */
/* 7 · 组装示例                                                                */
/* ========================================================================== */

export function MonitoringConsole() {
  const [frozen, setFrozen] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [sortKey, setSortKey] = useState<'name' | 'metric'>('metric');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const rows: DeviceRow[] = useMemo(() => ([
    { id: 'd1', name: 'GW-SH-07', site: '上海张江', severity: 'err', metric: 91.4, unit: '%', updatedAt: Date.now() - 8_000 },
    { id: 'd2', name: 'GW-SH-11', site: '上海张江', severity: 'warn', metric: 78.2, unit: '%', updatedAt: Date.now() - 20_000 },
    { id: 'd3', name: 'GW-HZ-02', site: '杭州滨江', severity: 'unknown', metric: NaN, unit: '%', updatedAt: Date.now() - 240_000 },
    { id: 'd4', name: 'GW-HZ-05', site: '杭州滨江', severity: 'ok', metric: 41.7, unit: '%', updatedAt: Date.now() - 3_000 },
    { id: 'd5', name: 'GW-SZ-01', site: '深圳南山', severity: 'ok', metric: 33.1, unit: '%', updatedAt: Date.now() - 5_000 },
  ]), []);

  useEffect(() => {
    if (frozen) return;
    const t = window.setInterval(() => setNow(Date.now()), 5000);
    return () => window.clearInterval(t);
  }, [frozen]);

  const counts = useMemo(() => ({
    ok: rows.filter((r) => r.severity === 'ok').length,
    warn: rows.filter((r) => r.severity === 'warn').length,
    err: rows.filter((r) => r.severity === 'err').length,
    unknown: rows.filter((r) => r.severity === 'unknown').length,
  }), [rows]);

  const sorted = useMemo(() => {
    const m = sortDir === 'asc' ? 1 : -1;
    return [...rows].sort((a, b) => (sortKey === 'name'
      ? a.name.localeCompare(b.name) * m
      : ((Number.isFinite(a.metric) ? a.metric : -1) - (Number.isFinite(b.metric) ? b.metric : -1)) * m));
  }, [rows, sortKey, sortDir]);

  return (
    /* data-density=compact 一次性把间距/字号/控件高切到密集尺度 —— 不改零散数值 */
    <div data-density="compact" data-theme="dark" style={{
      minHeight: '100dvh', background: 'var(--color-surface-layout)', color: 'var(--color-text-1)',
    }}>
      <StatusBar
        counts={counts} frozen={frozen} now={now}
        onToggleFreeze={() => setFrozen((v) => !v)}
      />

      <main style={{
        padding: 'var(--space-component)',
        display: 'grid', gap: 'var(--space-component)',
        // 非对称：告警区占 2 列（唯一主卡），下面是等宽指标与明细
        gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
      }}>
        {/* 告警区跨 2 列 —— 用跨列制造主次，不靠加粗阴影 */}
        <div style={{ gridColumn: 'span 2', gridRow: 'span 2' }}>
          <AlertList
            rows={rows.filter((r) => r.severity !== 'ok')}
            onAck={() => {}}
            onOpen={() => {}}
          />
        </div>

        <KpiCard label="网关负载" value={91.4} unit="%" delta={+6.2} severity="err"
          series={[52, 58, 61, 70, 74, 79, 85, 88, 91]} thresholdLabel="阈值 85% · 持续 4 分钟" />
        <KpiCard label="丢包率" value={2.7} unit="%" delta={+0.4} severity="warn"
          series={[0.4, 0.6, 0.9, 1.2, 1.6, 2.0, 2.3, 2.5, 2.7]} thresholdLabel="阈值 3%" />
        <KpiCard label="上行吞吐" value={412} unit="Mbps" delta={-3.1} severity="ok"
          series={[460, 452, 448, 440, 436, 430, 424, 418, 412]} />
        <KpiCard label="采样延迟" value={38} unit="ms" delta={+1.2} severity="ok"
          series={[30, 31, 33, 34, 35, 36, 37, 37, 38]} />

        <div style={{ gridColumn: 'span 4' }}>
          <Panel title="设备明细" meta="5 台 · 60 秒窗口">
            <DeviceTable
              rows={sorted}
              sortKey={sortKey}
              sortDir={sortDir}
              onSort={(k) => {
                if (k === sortKey) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
                else { setSortKey(k); setSortDir('desc'); }
              }}
            />
          </Panel>
        </div>

        <div style={{ gridColumn: 'span 2' }}>
          <UnknownDataPanel device="GW-HZ-02" />
        </div>
      </main>
    </div>
  );
}

/* ========================================================================== */
/* 工具                                                                        */
/* ========================================================================== */

function formatNum(n: number): string {
  if (!Number.isFinite(n)) return '-';
  return n >= 1000 ? n.toLocaleString('zh-CN') : String(n);
}

function formatClock(ts: number): string {
  const d = new Date(ts);
  const p = (v: number) => String(v).padStart(2, '0');
  return `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}
