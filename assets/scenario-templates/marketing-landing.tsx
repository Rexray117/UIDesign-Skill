/* ============================================================================
 * 场景模板 4 / 6 · 营销落地页（ext-landing）
 * ----------------------------------------------------------------------------
 * 定位：在 5 秒内让人明白「这是什么、给谁的、为什么现在要行动」。
 * 判据：转化率，不是美观度。所有视觉决策都要能回答「这如何提升转化」。
 *
 * 演示规则：
 *   · ext-landing.md §三      首屏自证；一个 CTA；具体优于漂亮；为移动端先设计
 *   · ext-landing.md §5.2     首屏 = 标题 + 副标题 + 唯一主 CTA；偏置布局
 *   · ext-landing.md §5.5     社会证明真实可验证，置于主 CTA 之前
 *   · ext-landing.md §5.6     价格明确；风险降低表述；CTA 措辞一致
 *   · anti-ai/D1              ⭐ 偏置 Hero（左文右证），不用居中对称 + 双按钮
 *   · anti-ai/D5              ⭐ 用对照表替代「三等分特性卡 ×6」
 *   · anti-ai/D6              ⭐ 每个标题含具体数字；敢写边界与代价
 *   · anti-ai/D2              渐变仅用于 Hero 且色对来自品牌；强调色只给 CTA
 *   · motion.md               滚动显现可中断；出场快于入场；reduced-motion 降级
 *
 * ⚠️ 误杀防护：大面积留白、单一 CTA、居中 Hero（若内容对称）、强对比色
 *   都是本场景的刻意选择，不得削减。
 *
 * 场景默认旋钮：--variance 7 / --motion 6 / --density 3
 * 推荐风格：03 Bento Box Grid · 04 Editorial Grid · 17 Brutalism & Neubrutalism
 * ==========================================================================*/

import React, { useEffect, useRef, useState } from 'react';
import {
  Button, Card, IconArrowRight, IconCheck, IconChevronDown, IconClose,
  Panel, Tag, VisuallyHidden, cn,
} from './primitives';

/* ========================================================================== */
/* 1 · 滚动显现 —— 每个动效表达因果；出场快于入场；reduced-motion 直接落终态       */
/* ==========================================================================*/

export function SectionReveal({
  children, delayMs = 0, as: Tag = 'section',
}: { children: React.ReactNode; delayMs?: number; as?: keyof JSX.IntrinsicElements }) {
  const ref = useRef<HTMLElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    // 尊重 prefers-reduced-motion：不做动画，直接呈现最终状态
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) { setShown(true); return; }

    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setShown(true); io.disconnect(); } },
      { rootMargin: '0px 0px -12% 0px', threshold: 0.08 },
    );
    io.observe(el);
    return () => io.disconnect();   // 清理观察器，避免泄漏
  }, []);

  return React.createElement(
    Tag,
    {
      ref,
      style: {
        opacity: shown ? 1 : 0,
        transform: shown ? 'none' : 'translateY(12px)',
        // 入场 300ms 减速；不阻塞任何输入
        transition: `opacity var(--dur-slow) var(--ease-enter) ${delayMs}ms,
                     transform var(--dur-slow) var(--ease-enter) ${delayMs}ms`,
      },
    },
    children,
  );
}

/** 数字滚动：仅在有意义时使用；reduced-motion 下直接显示终值 */
export function CountUp({ to, suffix = '', duration = 600 }: { to: number; suffix?: string; duration?: number }) {
  const [v, setV] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) { setV(to); return; }
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      const start = performance.now();
      const step = (t: number) => {
        const p = Math.min(1, (t - start) / duration);
        setV(Math.round(to * (1 - Math.pow(1 - p, 3))));   // ease-out
        if (p < 1) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    });
    io.observe(el);
    return () => { io.disconnect(); cancelAnimationFrame(raf); };
  }, [to, duration]);

  return <span ref={ref} className="num">{v.toLocaleString('zh-CN')}{suffix}</span>;
}

/* ========================================================================== */
/* 2 · Hero —— ⭐ 偏置布局（正文左 7 栏 + 证据右 5 栏），刻意不做居中对称           */
/* 一个主 CTA；次行动降级为文字链                                                 */
/* ==========================================================================*/

export function Hero({
  eyebrow, headline, sub, primary, secondary, evidence,
}: {
  eyebrow: string;
  headline: React.ReactNode;
  sub: string;
  primary: { label: string; onClick: () => void };
  secondary: { label: string; href: string };
  evidence: { value: string; caption: string }[];
}) {
  return (
    <header style={{
      padding: 'clamp(48px, 9vw, 112px) var(--space-block) var(--space-page)',
      borderBottom: '1px solid var(--color-border)',
      // 品牌专属色对（非紫粉），定义在 token 层：--gradient-hero
      background: 'var(--gradient-hero)',
    }}>
      <div style={{
        maxWidth: 1180, marginInline: 'auto',
        // 非对称：7 : 5 切分，而非 1 : 1
        display: 'grid', gridTemplateColumns: 'minmax(0, 7fr) minmax(0, 5fr)',
        gap: 'var(--space-page)', alignItems: 'end',
      }}>
        <div>
          <p style={{
            margin: '0 0 var(--sp-4)', fontSize: 'var(--fs-2)', letterSpacing: '0.08em',
            textTransform: 'uppercase', color: 'var(--color-primary)', fontWeight: 'var(--fw-medium)',
          }}>
            {eyebrow}
          </p>

          {/* 主标题 40px / 正文 16px = 2.5×；含具体数字与代价，非泛词 */}
          <h1 style={{
            margin: 0, fontSize: 'clamp(32px, 4.4vw, 56px)', lineHeight: 1.12,
            letterSpacing: '-0.025em', fontWeight: 'var(--fw-semibold)', maxWidth: '18ch',
          }}>
            {headline}
          </h1>

          <p style={{
            margin: 'var(--sp-4) 0 0', fontSize: 'var(--fs-5)', lineHeight: 1.6,
            color: 'var(--color-text-2)', maxWidth: '46ch',
          }}>
            {sub}
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-gap)', marginTop: 'var(--space-block)', flexWrap: 'wrap' }}>
            <Button size="lg" onClick={primary.onClick} icon={<IconArrowRight size={16} />}>
              {primary.label}
            </Button>
            {/* 次行动视觉降级为文字链，不与主 CTA 争夺注意力 */}
            <a href={secondary.href} style={{
              color: 'var(--color-text-2)', fontSize: 'var(--fs-4)',
              textDecoration: 'underline', textUnderlineOffset: 4,
            }}>
              {secondary.label}
            </a>
          </div>

          <p style={{ margin: 'var(--sp-3) 0 0', fontSize: 'var(--fs-3)', color: 'var(--color-text-3)' }}>
            不用绑卡 · 前 14 天全额可退 · 数据随时导出为 CSV
          </p>
        </div>

        {/* 右侧证据栏：具体数字 + 出处，建立信任而非喊口号 */}
        <div aria-label="实测数据" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-gap)' }}>
          {evidence.map((e) => (
            <div key={e.caption} style={{
              paddingBlockStart: 'var(--sp-3)',
              borderTop: '2px solid var(--color-text-1)',   // 一条实线做视觉锚点
            }}>
              <div style={{ fontSize: 'clamp(28px, 3vw, 40px)', fontWeight: 'var(--fw-semibold)', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                {e.value}
              </div>
              <div style={{ marginTop: 'var(--sp-1)', fontSize: 'var(--fs-3)', color: 'var(--color-text-2)' }}>
                {e.caption}
              </div>
            </div>
          ))}
        </div>
      </div>
    </header>
  );
}

/* ========================================================================== */
/* 3 · 特性对照 —— ⭐ 用对照表替代「三等分卡片 ×6」                                */
/* 结构由内容决定：这里内容间是「有 / 没有」的对比关系，不是并列关系                  */
/* ==========================================================================*/

export function FeatureComparison({
  rows, caption,
}: {
  caption: string;
  rows: Array<{ need: string; ours: string; theirs: string }>;
}) {
  return (
    <SectionReveal>
      <div style={{ maxWidth: 1180, marginInline: 'auto', padding: 'var(--space-page) var(--space-block)' }}>
        <h2 style={{ margin: 0, fontSize: 'clamp(24px, 2.4vw, 32px)', letterSpacing: '-0.02em' }}>
          和另外 3 个工具比，差在哪
        </h2>
        <p style={{ margin: 'var(--sp-2) 0 var(--space-block)', color: 'var(--color-text-2)', maxWidth: '62ch' }}>
          {caption}
        </p>

        <div className="table-wrap" style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--r-surface)', background: 'var(--color-surface)' }}>
          <table className="table">
            <caption className="sr-only">能力对照：本产品与同类工具在六项需求上的支持情况</caption>
            <thead>
              <tr>
                <th scope="col" style={{ width: '34%' }}>你需要什么</th>
                <th scope="col" style={{ background: 'var(--color-info-bg)' }}>Leakwatch</th>
                <th scope="col">常见替代方案</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.need}>
                  <th scope="row" style={{ fontWeight: 'var(--fw-medium)', textAlign: 'start', fontSize: 'var(--fs-3)' }}>
                    {r.need}
                  </th>
                  <td style={{ background: 'var(--color-info-bg)' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ color: 'var(--color-ok)', display: 'inline-flex' }}><IconCheck size={14} /></span>
                      {r.ours}
                    </span>
                  </td>
                  <td className="dim">{r.theirs}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p style={{ margin: 'var(--sp-3) 0 0', fontSize: 'var(--fs-2)', color: 'var(--color-text-3)' }}>
          对照基于 2026 年 9 月各产品公开文档；我们不比的项：SOC 2 认证仍在进行中，预计 2027 Q1 完成。
        </p>
      </div>
    </SectionReveal>
  );
}

/* ========================================================================== */
/* 4 · 定价 —— 标价明确；主动写清边界与代价；不藏总价                              */
/* ==========================================================================*/

export function Pricing({
  plans, footnote,
}: {
  footnote: string;
  plans: Array<{
    id: string; name: string; price: number | null; priceNote: string;
    boundary: string; includes: string[]; excluded?: string[];
    recommended?: boolean;
  }>;
}) {
  return (
    <SectionReveal>
      <div style={{ maxWidth: 1180, marginInline: 'auto', padding: 'var(--space-page) var(--space-block)' }}>
        <h2 style={{ margin: 0, fontSize: 'clamp(24px, 2.4vw, 32px)', letterSpacing: '-0.02em' }}>价格</h2>
        <p style={{ margin: 'var(--sp-2) 0 var(--space-block)', color: 'var(--color-text-2)' }}>
          按接入的生产环境数量计费，不按告警条数——这样你不会因为不敢报警而省钱。
        </p>

        <div style={{
          display: 'grid',
          // 三档但不等宽：推荐方案占 1.4 份，用尺寸而非阴影制造主次
          gridTemplateColumns: 'minmax(0,1fr) minmax(0,1.4fr) minmax(0,1fr)',
          gap: 'var(--space-gap)', alignItems: 'start',
        }}>
          {plans.map((p) => (
            <Card key={p.id} primary={p.recommended} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-component)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
                <h3 style={{ margin: 0, fontSize: 'var(--fs-5)', fontWeight: 'var(--fw-semibold)' }}>{p.name}</h3>
                {p.recommended && <Tag>最多人选</Tag>}
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--sp-1)' }}>
                  <span className="num" style={{ fontSize: 'var(--fs-7)', fontWeight: 'var(--fw-semibold)', letterSpacing: '-0.02em' }}>
                    {p.price === null ? '按需询价' : `¥${p.price}`}
                  </span>
                  {p.price !== null && <span style={{ fontSize: 'var(--fs-3)', color: 'var(--color-text-3)' }}>/ 月</span>}
                </div>
                <p style={{ margin: 'var(--sp-1) 0 0', fontSize: 'var(--fs-3)', color: 'var(--color-text-2)' }}>
                  {p.priceNote}
                </p>
              </div>

              {/* 主动写清边界：这是最强的可信信号 */}
              <p style={{ margin: 0, fontSize: 'var(--fs-3)', color: 'var(--color-text-3)', paddingBlockStart: 'var(--sp-3)', borderTop: '1px solid var(--color-border)' }}>
                {p.boundary}
              </p>

              <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)' }}>
                {p.includes.map((i) => (
                  <li key={i} style={{ display: 'flex', gap: 'var(--sp-2)', fontSize: 'var(--fs-4)' }}>
                    <span style={{ color: 'var(--color-ok)', flex: '0 0 auto', marginTop: 3 }}><IconCheck size={14} /></span>
                    <span>{i}</span>
                  </li>
                ))}
                {p.excluded?.map((i) => (
                  <li key={i} style={{ display: 'flex', gap: 'var(--sp-2)', fontSize: 'var(--fs-4)', color: 'var(--color-text-3)' }}>
                    <span aria-hidden="true" style={{ flex: '0 0 auto', marginTop: 3 }}><IconClose size={14} /></span>
                    <span>{i}<VisuallyHidden>（不含）</VisuallyHidden></span>
                  </li>
                ))}
              </ul>

              <Button
                variant={p.recommended ? 'primary' : 'secondary'}
                block
                style={{ marginTop: 'auto' }}
              >
                {p.price === null ? '约 30 分钟通话' : '开始 14 天试用'}
              </Button>
            </Card>
          ))}
        </div>

        <p style={{ margin: 'var(--space-component) 0 0', fontSize: 'var(--fs-2)', color: 'var(--color-text-3)' }}>
          {footnote}
        </p>
      </div>
    </SectionReveal>
  );
}

/* ========================================================================== */
/* 5 · FAQ —— 手风琴（只允许单项展开）；回答含具体事实                            */
/* ========================================================================== */

export function Faq({ items }: { items: Array<{ q: string; a: React.ReactNode }> }) {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <SectionReveal>
      <div style={{ maxWidth: 820, marginInline: 'auto', padding: 'var(--space-page) var(--space-block)' }}>
        <h2 style={{ margin: '0 0 var(--space-block)', fontSize: 'clamp(24px, 2.4vw, 32px)', letterSpacing: '-0.02em' }}>
          常见问题
        </h2>
        <div style={{ borderTop: '1px solid var(--color-border)' }}>
          {items.map((it, i) => {
            const isOpen = open === i;
            const id = `faq-panel-${i}`;
            return (
              <div key={it.q} style={{ borderBottom: '1px solid var(--color-border)' }}>
                <h3 style={{ margin: 0 }}>
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={id}
                    onClick={() => setOpen(isOpen ? null : i)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 'var(--space-gap)',
                      width: '100%', minHeight: 56, padding: 'var(--sp-3) 0',
                      background: 'none', border: 0, cursor: 'pointer',
                      color: 'var(--color-text-1)', font: 'inherit',
                      fontSize: 'var(--fs-5)', fontWeight: 'var(--fw-medium)', textAlign: 'start',
                    }}
                  >
                    <span className="grow">{it.q}</span>
                    <span aria-hidden="true" style={{
                      display: 'inline-flex', color: 'var(--color-text-3)',
                      transform: isOpen ? 'rotate(180deg)' : 'none',
                      transition: 'transform var(--dur-normal) var(--ease-move)',
                    }}>
                      <IconChevronDown size={18} />
                    </span>
                  </button>
                </h3>
                {isOpen && (
                  <div id={id} style={{ paddingBlockEnd: 'var(--space-component)', color: 'var(--color-text-2)', fontSize: 'var(--fs-4)', lineHeight: 1.7 }}>
                    {it.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </SectionReveal>
  );
}

/* ========================================================================== */
/* 6 · 尾段 CTA —— 全页只有一种 CTA 措辞；风险降低表述重复出现                      */
/* ==========================================================================*/

export function ClosingCta({
  headline, sub, action, reassurance,
}: { headline: string; sub: string; action: { label: string; onClick: () => void }; reassurance: string }) {
  return (
    <SectionReveal>
      <div style={{
        padding: 'var(--space-page) var(--space-block)',
        borderTop: '1px solid var(--color-border)',
      }}>
        <div style={{
          maxWidth: 1180, marginInline: 'auto',
          display: 'grid', gridTemplateColumns: 'minmax(0,7fr) minmax(0,5fr)',
          gap: 'var(--space-page)', alignItems: 'center',
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 'clamp(26px, 3vw, 40px)', letterSpacing: '-0.025em', lineHeight: 1.15, maxWidth: '20ch' }}>
              {headline}
            </h2>
            <p style={{ margin: 'var(--sp-3) 0 0', color: 'var(--color-text-2)', fontSize: 'var(--fs-5)', maxWidth: '44ch' }}>
              {sub}
            </p>
          </div>
          <div>
            <Button size="lg" block onClick={action.onClick} icon={<IconArrowRight size={16} />}>
              {action.label}
            </Button>
            <p style={{ margin: 'var(--sp-3) 0 0', fontSize: 'var(--fs-3)', color: 'var(--color-text-3)' }}>
              {reassurance}
            </p>
          </div>
        </div>
      </div>
    </SectionReveal>
  );
}

/* ========================================================================== */
/* 7 · 组装示例                                                                */
/* ==========================================================================*/

export function MarketingLandingPage() {
  return (
    <div data-density="comfortable" style={{ background: 'var(--color-surface-layout)' }}>
      <Hero
        eyebrow="部署后自动体检"
        headline={<>部署完 11 分钟内，<br />告诉你这次改动漏了什么</>}
        sub="接入 Git 仓库和网关即可。它读你的日志、链路和依赖清单，把「这次上线的实际风险」写成一段人话，而不是再给你一堆要看的面板。"
        primary={{ label: '接入仓库，跑一次看看', onClick: () => {} }}
        secondary={{ label: '先看一份真实的检查报告', href: '#sample' }}
        evidence={[
          { value: '11 min', caption: '从 push 到出报告的中位数（1,240 个环境实测）' },
          { value: '3.2%', caption: '告警误报率，30 日均值' },
          { value: '38 / 41', caption: '上一次真实事故，在 38 分钟内被它先说出来' },
        ]}
      />

      <FeatureComparison
        caption="如果你在选工具，这六项大概是你要逐条确认的。我们把自己的短板也写出来了。"
        rows={[
          { need: '不看代码就能接', ours: '读现有日志，零改代码', theirs: '要求接入 SDK 或改造埋点' },
          { need: '告警能被人看懂', ours: '一段人话 + 3 条排查建议', theirs: '堆叠面板与原始指标' },
          { need: '不因为报警而多花钱', ours: '按环境数计费，与告警量无关', theirs: '按告警条数或数据量计费' },
          { need: '误报能压下去', ours: '阈值 + 同比双条件，可白名单', theirs: '单条件阈值为主' },
          { need: '自托管', ours: '企业版支持私有化部署', theirs: '多数仅 SaaS' },
          { need: 'SOC 2 Type II', ours: '进行中，预计 2027 Q1', theirs: '部分已具备' },
        ]}
      />

      <Pricing
        footnote="所有价格含税。第二年续费不涨价，这是写在合同里的。"
        plans={[
          {
            id: 's', name: '试用版', price: 0, priceNote: '14 天，含全部功能',
            boundary: '最多 3 个生产环境；不支持私有化部署',
            includes: ['全部检查规则', '邮件与企业微信通知', 'CSV 导出'],
            excluded: ['私有化部署', 'SLA'],
          },
          {
            id: 'm', name: '团队版', price: 999, priceNote: '每月，含 25 个环境',
            boundary: '不含私有化部署；超出 25 个环境按 ¥29/个计',
            includes: ['全部检查规则', '三通道通知（邮件/短信/企业微信）', '90 天明细保留', '工单与复盘看板'],
            excluded: ['私有化部署'],
            recommended: true,
          },
          {
            id: 'e', name: '企业版', price: null, priceNote: '按环境数与 SLA 定',
            boundary: '私有化部署需提供 K8s 集群；SLA 最低 99.9%',
            includes: ['私有化部署', 'SSO / SCIM', '专属支持群，15 分钟响应', '13 个月聚合保留'],
          },
        ]}
      />

      <Faq
        items={[
          {
            q: '接入会改我们的代码吗？',
            a: <>不需要。我们只读你已存在的访问日志、链路追踪和依赖清单。接入方式是把网关日志的读取权限给一个只读账号，整个过程约 20 分钟，回滚只需删掉那个账号。</>,
          },
          {
            q: '它会不会又一次把我们淹没在告警里？',
            a: <>默认策略是「宁少勿多」：只有同时满足阈值和同比异常才推一条，每天单环境上限 5 条。过去 30 天的误报率是 3.2%。如果你觉得还是多，可以把上限调到 1。</>,
          },
          {
            q: '数据存在哪？能删干净吗？',
            a: <>默认存于华东节点。随时可以在设置里点「彻底删除」——包括备份，24 小时内完成，会给你一份删除回执。私有化部署版本数据不出你的机房。</>,
          },
          {
            q: '你们还没过 SOC 2，我怎么评估风险？',
            a: <>我们的现状是：已完成差距评估，审计在做，预计 2027 Q1 出报告。在那之前你可以选择私有化部署，或者只接入非核心环境试三个月。</>,
          },
        ]}
      />

      <ClosingCta
        headline={<>先跑一次，<br />看看它能不能说出你已知的那个问题</>}
        sub="大部分团队用第一个环境验证：如果它能指出上周那次故障的根因，剩下的环境再批量接。"
        action={{ label: '接入仓库，跑一次看看', onClick: () => {} }}
        reassurance="不用绑卡 · 前 14 天全额可退 · 随时导出 CSV"
      />
    </div>
  );
}
