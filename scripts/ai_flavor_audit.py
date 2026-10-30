#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
AI 味六维自检脚本（零依赖，Python 3.7+）

用法:
    python ai_flavor_audit.py <目录或文件> [--json] [--scenario admin] [--top 15]

场景参数（影响评分权重，不影响原始指标）:
    ui | monitoring | admin | landing | dataviz | mobile | auto(默认)

评分含义:
    0-20 A 有立场  | 21-40 B 局部惰性 | 41-60 C 明显模板感
    61-80 D 通用模板 | 81-100 E 默认主题直出

设计原则:
    1. 本脚本只做「定位」，不做出判决。逐项清单比总分重要。
    2. 每个维度都可能被误杀 —— 修改前必读 references/anti-ai/false-positives.md
    3. 场景会改变结论 —— 用 --scenario 告知场景，不要用默认值判监控界面
"""

import argparse
import json
import math
import os
import re
import sys
from collections import Counter

# ---------------------------------------------------------------- 常量表

SCAN_EXT = {
    ".html", ".htm", ".css", ".scss", ".sass", ".less",
    ".jsx", ".tsx", ".vue", ".svelte", ".astro",
    ".js", ".ts", ".mjs", ".cjs",
}

SKIP_DIRS = {
    # 构建产物与依赖 —— 不应被审计
    "node_modules", ".git", "dist", "build", ".next", ".nuxt",
    "coverage", ".cache", "vendor", "__pycache__", ".venv", "venv",
    "out", ".output", ".svelte-kit", "target",
    # 注意：不跳过 assets / public / static。
    # 它们常被用来放图片，但同样可能放源码模板（本技能包的模板就在 assets/ 下）。
    # 扩展名白名单已把二进制文件排除，扫描这几个目录是安全的。
}

# Tailwind 类名 → 字号 px（否则工具类项目字号档数会被低估）
TW_TEXT_SIZE = {
    "text-xs": 12, "text-sm": 14, "text-base": 16, "text-lg": 18, "text-xl": 20,
    "text-2xl": 24, "text-3xl": 30, "text-4xl": 36, "text-5xl": 48,
    "text-6xl": 60, "text-7xl": 72, "text-8xl": 96, "text-9xl": 128,
}

# 命名色 → 色相角度（中性色映射为 None，不计入色相）
NAMED_HUES = {
    "purple": 270, "violet": 258, "indigo": 239, "fuchsia": 292,
    "magenta": 300, "pink": 330, "rose": 350, "red": 0,
    "orange": 30, "amber": 45, "yellow": 50, "lime": 80,
    "green": 140, "emerald": 155, "teal": 175, "cyan": 188,
    "sky": 200, "blue": 220,
    "slate": None, "gray": None, "grey": None,
    "zinc": None, "neutral": None, "stone": None,
}

# Tailwind 阴影 / 圆角档（用于装饰过载统计）
TW_SHADOW_RE = re.compile(r"\bshadow(?:-(?:sm|md|lg|xl|2xl|inner|none))?\b")
TW_RADIUS_RE = re.compile(
    r"\brounded(?:-(?:none|sm|md|lg|xl|2xl|3xl|full))?\b|\brounded-[trbl]{1,2}(?:-(?:sm|md|lg|xl|2xl|3xl|full))?\b")

# 居中 / 对称类声明
CENTER_PATTERNS = [
    r"text-align\s*:\s*center",
    r"justify-content\s*:\s*center",
    r"align-items\s*:\s*center",
    r"place-items\s*:\s*center",
    r"place-content\s*:\s*center",
    r"\bmx-auto\b",
    r"\btext-center\b",
    r"\bjustify-center\b",
    r"\bitems-center\b",
    r"\bplace-items-center\b",
    r"\bself-center\b",
]

# 布局类声明（作分母）
LAYOUT_PATTERNS = [
    r"display\s*:\s*(?:flex|grid|inline-flex|inline-grid)",
    r"\bflex\b", r"\bgrid\b",
    r"justify-content\s*:", r"align-items\s*:", r"place-items\s*:",
    r"text-align\s*:", r"float\s*:", r"position\s*:",
    r"\b(?:flex|grid|block|inline|hidden)\b",
    r"\bmx-auto\b", r"\btext-(?:left|center|right)\b",
    r"\bjustify-(?:start|end|center|between|around|evenly)\b",
    r"\bitems-(?:start|end|center|baseline|stretch)\b",
    r"\bcols?-\d+\b",
]

# 等分栅格
EQUAL_GRID_PATTERNS = [
    r"grid-template-columns\s*:\s*repeat\(\s*(\d+)\s*,\s*(?:minmax\([^)]*\)|\d*\.?\d*fr|1fr)\s*\)",
    r"grid-cols-(\d+)",
    r"repeat\(\s*(\d+)\s*,\s*1fr\s*\)",
]

# 暗色 / 高密度豁免关键词（用于场景判断）
DARK_HINT = re.compile(r"(#0[0-9a-fA-F]{2}|rgb\(\s*[0-9]{1,2}\s*[, ])|\.dark|dark:|prefers-color-scheme", re.I)

EMOJI_RE = re.compile(
    "[\U0001F300-\U0001F5FF"
    "\U0001F600-\U0001F64F"
    "\U0001F680-\U0001F6FF"
    "\U0001F700-\U0001F77F"
    "\U0001F780-\U0001F7FF"
    "\U0001F800-\U0001F8FF"
    "\U0001F900-\U0001F9FF"
    "\U0001FA00-\U0001FAFF"
    "\U00002600-\U000027BF"
    "\U0001F1E6-\U0001F1FF]"
)

HOLLOW_WORDS = [
    "一站式", "赋能", "打造", "重塑", "解锁", "开启", "闭环", "抓手", "生态",
    "极致的", "智能的", "强大的", "卓越的", "领先的", "高效的", "全方位的",
    "无缝", "全面提升", "显著提升", "大幅降低", "助力",
    "seamlessly", "empower", "all-in-one", "cutting-edge", "best-in-class",
    "game-changer", "leverage", "robust", "streamline", "elevate",
    "unleash", "unlock", "revolutionize", "effortless",
    # 英文 UI 微文案套路：整句喊话、零信息（对应 copy-tells.md 的「通用积极收尾」）
    "customize your workspace", "fit your needs", "meet your needs",
    "tailored to your needs", "everything you need", "quick overview",
    "get started today", "let's make today", "your all-in-one",
    "designed for you", "welcome back",
]

GENERIC_ENDING = [
    "开启你的旅程", "开启旅程", "解锁更多可能", "让一切变得简单", "未来已来",
    "共创美好", "携手前行", "start your journey", "take it to the next level",
    "unlock the power", "let's get started",
]

TRIAD_RE = re.compile(r"[\u4e00-\u9fa5]{2,6}[、,，][\u4e00-\u9fa5]{2,6}[、,，][\u4e00-\u9fa5]{2,6}")

STATE_KEYWORDS = {
    "hover": [r":hover", r"hover:"],
    "focus": [r":focus", r"focus:", r"focus-visible"],
    "active": [r":active", r"active:"],
    "disabled": [r":disabled", r"disabled=", r"disabled:"],
    "loading": [r"aria-busy", r"loading", r"skeleton", r"spinner", r"isLoading"],
    "empty": [r"empty", r"暂无", r"No data", r"no-data"],
    "error": [r"error", r"失败", r"invalid", r"alert"],
}

PURPLE_PINK_RE = re.compile(
    r"(?:purple|violet|indigo|fuchsia|#(?:8B5CF6|A855F7|7C3AED|6366F1|818CF8|C084FC))"
    r"[\s\S]{0,120}?"
    r"(?:pink|rose|fuchsia|magenta|#(?:EC4899|F472B6|F9A8D4|D946EF|E879F9))",
    re.I,
)

SCENARIOS = {
    "ui":         {"w": (1.0, 1.0, 1.0, 1.0, 1.0, 1.0), "label": "用户界面"},
    "monitoring": {"w": (0.6, 1.0, 0.7, 0.4, 0.9, 1.0), "label": "企业监控界面"},
    "admin":      {"w": (0.5, 1.0, 0.8, 0.6, 0.9, 1.1), "label": "管理界面"},
    "landing":    {"w": (0.7, 1.4, 1.1, 1.2, 1.1, 1.4), "label": "营销落地页"},
    "dataviz":    {"w": (0.6, 1.1, 0.7, 0.5, 0.9, 1.0), "label": "数据可视化大屏"},
    "mobile":     {"w": (1.0, 1.0, 1.0, 1.0, 1.0, 1.1), "label": "C 端移动端"},
    "auto":       {"w": (1.0, 1.0, 1.0, 1.0, 1.0, 1.0), "label": "未指定"},
}


# ---------------------------------------------------------------- 工具函数

def clamp(v, lo=0.0, hi=100.0):
    return max(lo, min(hi, v))


def hex_to_hsl(h):
    h = h.lstrip("#")
    if len(h) == 3:
        h = "".join(c * 2 for c in h)
    if len(h) != 6:
        return None
    try:
        r, g, b = (int(h[i:i + 2], 16) / 255.0 for i in (0, 2, 4))
    except ValueError:
        return None
    mx, mn = max(r, g, b), min(r, g, b)
    d = mx - mn
    l = (mx + mn) / 2.0
    if d == 0:
        return (0.0, 0.0, l)
    s = d / (2.0 - mx - mn) if l > 0.5 else d / (mx + mn)
    if mx == r:
        hue = ((g - b) / d) % 6
    elif mx == g:
        hue = (b - r) / d + 2
    else:
        hue = (r - g) / d + 4
    return (hue * 60.0, s, l)


def strip_comments(text):
    text = re.sub(r"/\*[\s\S]*?\*/", " ", text)
    text = re.sub(r"(?<!:)//[^\n]*", " ", text)
    text = re.sub(r"<!--[\s\S]*?-->", " ", text)
    return text


def walk_files(root):
    out = []
    if os.path.isfile(root):
        return [root]
    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = [d for d in dirnames
                       if d not in SKIP_DIRS and not d.startswith(".")]
        for fn in filenames:
            if os.path.splitext(fn)[1].lower() in SCAN_EXT:
                out.append(os.path.join(dirpath, fn))
    return out


# ---------------------------------------------------------------- 采集

def collect(root):
    files = walk_files(root)
    corpus = []
    per_file = []
    for fp in files:
        try:
            with open(fp, "r", encoding="utf-8", errors="ignore") as f:
                raw = f.read()
        except OSError:
            continue
        if not raw.strip():
            continue
        body = strip_comments(raw)
        corpus.append(body)
        per_file.append((fp, body))
    text = "\n".join(corpus)
    return text, per_file


def count_pats(text, pats):
    n = 0
    for p in pats:
        n += len(re.findall(p, text, re.I))
    return n


def analyze(text, per_file, scenario):
    res = {}
    findings = []      # (dim, severity, message)

    # ---------- D1 对称惯性 ----------
    center = count_pats(text, CENTER_PATTERNS)
    layout = max(count_pats(text, LAYOUT_PATTERNS), 1)
    center_ratio = center / layout

    equal_grids = 0
    for p in EQUAL_GRID_PATTERNS:
        for m in re.finditer(p, text, re.I):
            try:
                n = int(m.group(1))
            except (IndexError, ValueError):
                n = 0
            if n >= 3:
                equal_grids += 1

    # 非对称结构：CSS 写法 + React camelCase 写法 + Tailwind 工具类
    asym = count_pats(text, [
        r"grid-column\s*:\s*span\s*[2-9]",
        r"gridColumn\s*:\s*['\"]?span\s*[2-9]",
        r"\bcol-span-[2-9]\b",
        r"\blg:col-span-[2-9]\b",
        r"grid-row\s*:\s*span\s*[2-9]",
        r"gridRow\s*:\s*['\"]?span\s*[2-9]",
    ])

    # 不等宽 fr 比例（如 7fr 5fr / 1.4fr 1fr 1fr / 2fr 2fr 1fr）也是非对称结构
    for m in re.finditer(
        r"(?:minmax\([^)]*\)|[0-9.]+fr)(?:\s+(?:minmax\([^)]*\)|[0-9.]+fr))+", text
    ):
        frs = re.findall(r"([0-9.]+)fr", m.group(0))
        if len(set(frs)) > 1:
            asym += 1

    d1 = 0.0
    d1 += clamp(center_ratio / 0.60 * 100.0) * 0.55
    d1 += clamp(equal_grids / 5.0 * 100.0) * 0.30
    d1 += clamp((3 - asym) / 3.0 * 100.0) * 0.15 if asym < 3 else 0.0
    d1 = clamp(d1)

    if center_ratio > 0.45:
        findings.append(("D1", "高", "居中类声明占比 %.0f%%（阈值 45%%）——布局可预测性过高"
                         % (center_ratio * 100)))
    if equal_grids > 2:
        findings.append(("D1", "高", "等分栅格（≥3 等分）出现 %d 次——缺乏主次结构" % equal_grids))
    if asym == 0:
        findings.append(("D1", "中", "未发现跨列/偏移等非对称结构——建议至少 3 处"))

    # ---------- D2 色彩惰性 ----------
    hexes = re.findall(r"#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})\b", text)
    hex_uniq = set(h.lower() for h in hexes)

    # 功能色（状态 / 图表系列）不计入「色彩预算」—— 这是技能包自己的规则：
    # 「色彩预算 ≤3 色相」指的是界面自身的色相；成功/警告/错误/信息与图表系列
    # 属于语义编码，天然需要额外色相。按声明所在行是否含功能语义关键字来识别。
    func_hint = re.compile(r"ok|warn|err|error|danger|success|info|status|chart|series", re.I)
    functional_hex = set()
    for line in text.splitlines():
        if func_hint.search(line):
            functional_hex |= set(
                h.lower() for h in re.findall(r"#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})\b", line))

    hue_bins = set()
    hue_bins_ui = set()
    for h in hex_uniq:
        hsl = hex_to_hsl(h)
        if not hsl:
            continue
        hue, sat, lig = hsl
        if sat > 0.18 and 0.06 < lig < 0.94:
            bin_ = int(hue // 30) % 12
            hue_bins.add(bin_)
            if h not in functional_hex:
                hue_bins_ui.add(bin_)

    # 命名色（Tailwind 工具类 + 原生 CSS 色名），否则工具类项目色相会被严重低估
    named = []
    tw_cls = (r"\b(?:from|to|via|bg|text|border|ring|fill|stroke|outline"
              r"|divide|decoration|accent|caret|shadow)-([a-z]+)(?:-\d{2,3})?\b")
    named += [m.lower() for m in re.findall(tw_cls, text, re.I)]
    named += [m.lower() for m in re.findall(
        r"(?:color|background|background-color|border-color|fill|stroke)\s*:\s*([a-zA-Z]+)", text, re.I)]
    for nm in named:
        hue = NAMED_HUES.get(nm, "missing")
        if hue is None:
            continue
        if hue != "missing":
            hue_bins.add(int(hue // 30) % 12)
            # 注：工具类色名无法可靠区分功能/界面，故同时计入 ui 桶（保守）
            hue_bins_ui.add(int(hue // 30) % 12)
    hue_count = len(hue_bins)
    ui_hue_count = len(hue_bins_ui)

    gradients = len(re.findall(r"(?:linear|radial|conic)-gradient", text, re.I))
    gradients += len(re.findall(r"\bbg-gradient-to-[a-z]{2}\b|\bfrom-[a-z]+-\d{2,3}\b", text, re.I))
    purple_pink = len(PURPLE_PINK_RE.findall(text))
    if not purple_pink:
        # 工具类写法：from-purple-* / to-pink-* 等，需按出现顺序判断
        seq = re.findall(
            r"(?:from|via|to|bg|text|border)-([a-z]+)-\d{2,3}", text, re.I)
        seq = [s.lower() for s in seq]
        for i in range(len(seq) - 1):
            a, b = NAMED_HUES.get(seq[i]), NAMED_HUES.get(seq[i + 1])
            if a is None or b is None:
                continue
            if (225 <= a <= 340) and (300 <= b <= 355):
                purple_pink += 1
                break

    # 紫族同相渐变：同一个 gradient 里出现 >=2 个紫族色标（靛蓝/紫罗兰/紫/品红），
    # 即 AI 生成页最典型的 #6366f1 -> #8b5cf6 / from-indigo-500 to-purple-600。
    # 只认同一个渐变内的配对，避免把「主色 + 其深色变体」误判。
    def _purple_family(hx):
        hsl = hex_to_hsl(hx)
        if not hsl:
            return False
        hue, sat, _lig = hsl
        return sat > 0.25 and 225 <= hue <= 340

    purple_grad = 0
    for gdecl in re.findall(r"(?:linear|radial|conic)-gradient\(([^)]{0,400})\)", text, re.I):
        cols = {c.lower() for c in re.findall(r"#(?:[0-9a-fA-F]{6})\b", gdecl)
                if _purple_family(c)}
        if len(cols) >= 2:
            purple_grad += 1
    if not purple_grad:
        gseq = re.findall(r"(?:from|via|to)-([a-z]+)-\d{2,3}", text, re.I)
        gseq = [s.lower() for s in gseq]
        for i in range(len(gseq) - 1):
            ga, gb = NAMED_HUES.get(gseq[i]), NAMED_HUES.get(gseq[i + 1])
            if ga is None or gb is None:
                continue
            if 225 <= ga <= 340 and 225 <= gb <= 340:
                purple_grad += 1
                break
    hardcoded_in_comp = 0
    for fp, body in per_file:
        if fp.lower().endswith((".jsx", ".tsx", ".vue", ".svelte", ".js", ".ts")):
            hardcoded_in_comp += len(re.findall(r"#(?:[0-9a-fA-F]{6})\b", body))
    token_usage = len(re.findall(r"var\(--", text))

    d2 = 0.0
    # 只用「界面色相」计分：功能色（状态/图表）不计入色彩预算
    d2 += clamp((ui_hue_count - 3) / 7.0 * 100.0) * 0.30
    # 紫族渐变 / 紫→粉是 AI 配色最强的单一信号：出现 1 次即计满该子项
    d2 += clamp((purple_pink + purple_grad) / 1.0 * 100.0) * 0.30
    d2 += clamp(hardcoded_in_comp / 20.0 * 100.0) * 0.20
    d2 += clamp(gradients / 10.0 * 100.0) * 0.20
    d2 = clamp(d2)

    if purple_grad and not purple_pink:
        findings.append(("D2", "高", "紫族同相渐变 %d 处（靛蓝→紫罗兰一类）——"
                         "AI 生成页的默认配色指纹" % purple_grad))
    if ui_hue_count > 4:
        findings.append(("D2", "高", "界面色相 %d 个（上限 4 = 1 主 + 1 强调 + 余量；"
                         "功能色与图表系列已排除）——配色缺乏取舍" % ui_hue_count))
    elif ui_hue_count > 3:
        findings.append(("D2", "中", "界面色相 %d 个（建议 ≤3）——检查是否有可合并的色相"
                         % ui_hue_count))
    if purple_pink:
        findings.append(("D2", "高", "检测到紫→粉（或紫→品红）渐变 %d 处——AI 默认配色套餐" % purple_pink))
    if hardcoded_in_comp > 0:
        findings.append(("D2", "高", "组件文件内检测到 %d 处裸 hex 色值——应改为引用 token"
                         % hardcoded_in_comp))
    if gradients > 4 and token_usage == 0:
        findings.append(("D2", "中", "渐变 %d 处但无 token 使用——渐变可能为装饰性" % gradients))

    # ---------- D3 装饰过载 ----------
    shadows = re.findall(r"box-shadow\s*:\s*([^;}\n]+)", text, re.I)
    shadow_vals = set(re.sub(r"\s+", " ", s).strip().lower() for s in shadows)
    # Tailwind 阴影工具类（否则工具类项目的阴影档数会被严重低估）
    shadow_vals |= set(m.lower() for m in TW_SHADOW_RE.findall(text))
    shadow_vals.discard("shadow-none")
    # token 引用不算裸值
    shadow_vals = {v for v in shadow_vals if not v.startswith("var(")}
    shadow_n = len(shadow_vals)

    radii = re.findall(r"border-radius\s*:\s*([^;}\n]+)", text, re.I)
    radii += re.findall(r"border(?:TopLeft|TopRight|BottomLeft|BottomRight)?Radius\s*:\s*['\"]?([^,;}\n'\"]+)", text)
    radii += TW_RADIUS_RE.findall(text)
    radius_vals = set(re.sub(r"\s+", "", r).lower() for r in radii)
    radius_vals.discard("rounded-none")
    # token 引用与关键字不算「裸值」—— 引用 token 恰恰是纪律，不是过载
    radius_vals = {v for v in radius_vals
                   if not v.startswith("var(") and v not in ("inherit", "unset", "initial", "0")}
    radius_n = len(radius_vals)

    big_blur = 0
    for s in shadows:
        for m in re.finditer(r"(\d{2,3})px", s):
            if int(m.group(1)) > 40:
                big_blur += 1

    glow = len(re.findall(r"text-shadow\s*:", text, re.I))
    glow += len(re.findall(r"drop-shadow\s*\(", text, re.I))
    hover_lift = len(re.findall(r"hover:shadow-|hover:translate-y-|-translate-y-1|box-shadow[^;]*hover", text, re.I))
    # 手写 CSS 的悬停抬升/抬影（Tailwind 写法之外的另一半工程现实）
    hover_lift += len(re.findall(
        r":hover[^{}\n]{0,80}\{[^{}]{0,600}?translate[XY]?d?\s*\(\s*[-\d.]", text, re.I))
    hover_lift += len(re.findall(
        r":hover[^{}\n]{0,80}\{[^{}]{0,600}?box-shadow\s*:", text, re.I))

    # 极值重复：单一但极端的值反复出现，比「多种温和的值」更糟。
    # 只统计去重后数量会漏掉这一类，因此单独计数。
    heavy_shadow = len(re.findall(r"\bshadow-(?:xl|2xl)\b", text, re.I))
    for sdecl in shadows:
        # 去掉颜色函数与 token 引用后再取「长度序列」= x y blur spread，
        # 无单位的 0 也是长度（`0 20px 25px -5px` 的 blur 是第 3 位）
        clean = re.sub(r"(?:rgba?|hsla?|color)\([^)]*\)", " ", sdecl)
        clean = re.sub(r"var\([^)]*\)", " ", clean)
        lens = []
        for tk in re.findall(r"(?<![\w.])-?\d*\.?\d+(?:px)?", clean):
            tk = tk.strip()
            if tk.endswith("px"):
                lens.append(abs(float(tk[:-2])))
            elif float(tk) == 0:
                lens.append(0.0)
        if not lens:
            continue
        blur = lens[2] if len(lens) >= 3 else max(lens)   # x-offset y-offset blur spread
        if blur >= 16:                                    # Tailwind shadow-lg=15px，xl=20px
            heavy_shadow += 1
    large_radius = len(re.findall(r"\brounded-(?:2xl|3xl)\b", text, re.I))
    for rdecl in radii:
        pxs = [float(x) for x in re.findall(r"(\d+(?:\.\d+)?)px", rdecl)]
        pcts = [float(x) for x in re.findall(r"(\d+(?:\.\d+)?)%", rdecl)]
        if (pxs and max(pxs) >= 20) or (pcts and max(pcts) >= 18):
            large_radius += 1

    d3 = 0.0
    d3 += clamp((shadow_n - 3) / 5.0 * 100.0) * 0.22
    d3 += clamp((radius_n - 3) / 6.0 * 100.0) * 0.18
    d3 += clamp(big_blur / 4.0 * 100.0) * 0.12
    d3 += clamp(glow / 6.0 * 100.0) * 0.12
    d3 += clamp(hover_lift / 8.0 * 100.0) * 0.12
    d3 += clamp(heavy_shadow / 3.0 * 100.0) * 0.14
    d3 += clamp(large_radius / 3.0 * 100.0) * 0.10
    d3 = clamp(d3)

    if heavy_shadow > 1:
        findings.append(("D3", "高", "重阴影（shadow-xl/2xl 或模糊 >40px）出现 %d 次"
                         "——阴影档位应 ≤3 且每档语义唯一" % heavy_shadow))
    if large_radius > 1:
        findings.append(("D3", "中", "大圆角（rounded-2xl/3xl 或 >20px）出现 %d 次"
                         "——大圆角应只用于表面或胶囊，不用于控件" % large_radius))

    if shadow_n > 4:
        findings.append(("D3", "高", "唯一 box-shadow 值 %d 种（上限 3）——阴影秤级失控" % shadow_n))
    if radius_n > 4:
        findings.append(("D3", "中", "唯一 border-radius 值 %d 种（上限 3）——圆角秤级失控" % radius_n))
    if big_blur > 2:
        findings.append(("D3", "中", "检测到 %d 处大模糊（>40px）阴影——非浮层元素应 ≤24px" % big_blur))
    if glow > 3:
        findings.append(("D3", "中", "发光效果 %d 处——装饰性光晕建议只保留有语义的" % glow))
    if hover_lift > 5:
        findings.append(("D3", "中", "hover 抬升 %d 处——建议只给可点击卡片" % hover_lift))

    # ---------- D4 排版扁平 ----------
    sizes = re.findall(r"font-size\s*:\s*([\d.]+)(px|rem|em)", text, re.I)
    sizes += [(m, "px") for m in re.findall(r"text-\[?(\d{1,2})px\]?", text)]
    # React 内联样式（camelCase）：fontSize: 16 / fontSize: '16px' / fontSize: '1rem'
    sizes += [(m.group(1), m.group(2) or "px") for m in re.finditer(
        r"fontSize\s*:\s*['\"]?([\d.]+)(px|rem|em)?['\"]?", text)]
    # CSS 自定义属性里的字号尺度（--fs-1: 11px / --fs-body: 13px）——
    # 漏掉这条会让「token 化项目」的字号档数被严重低估
    sizes += [(m.group(1), m.group(2)) for m in re.finditer(
        r"--(?:fs|font-size)[\w-]*\s*:\s*([\d.]+)(px|rem|em)", text, re.I)]
    vals = []
    for v, u in sizes:
        try:
            f = float(v)
        except ValueError:
            continue
        if u == "rem":
            f *= 16
        elif u == "em":
            f *= 16
        if 6 <= f <= 200:
            vals.append(round(f, 1))
    # Tailwind 字号工具类
    for cls, px in TW_TEXT_SIZE.items():
        if re.search(r"(?<![\w-])" + re.escape(cls) + r"(?![\w-])", text):
            vals.append(float(px))
    size_uniq = sorted(set(vals))
    size_n = len(size_uniq)
    ratio = (max(size_uniq) / min(size_uniq)) if len(size_uniq) >= 2 and min(size_uniq) > 0 else 0.0

    weights = re.findall(r"font-weight\s*:\s*(\d{3})", text)
    weights += re.findall(r"font-(?:thin|light|normal|medium|semibold|bold|extrabold|black)\b", text)
    # React camelCase 写法
    weights += re.findall(r"fontWeight\s*:\s*['\"]?(\d{3})", text)
    weights += re.findall(r"fontWeight\s*:\s*['\"]?(normal|medium|semibold|bold)", text)
    # CSS 自定义属性里的字重尺度（--fw-regular: 400）
    weights += re.findall(r"--fw[\w-]*\s*:\s*(\d{3})", text)
    weight_n = len(set(weights))

    tabular = len(re.findall(r"tabular-nums|font-variant-numeric", text, re.I))

    d4 = 0.0
    if size_n and size_n < 5:
        d4 += clamp((5 - size_n) / 4.0 * 100.0) * 0.35
    if ratio and ratio < 3.5:
        d4 += clamp((3.5 - ratio) / 3.5 * 100.0) * 0.35
    if weight_n < 3:
        d4 += clamp((3 - weight_n) / 3.0 * 100.0) * 0.20
    if tabular == 0:
        d4 += 10.0
    d4 = clamp(d4)

    if size_n and size_n < 4:
        findings.append(("D4", "高", "唯一字号只有 %d 档（建议 ≥5）——层次单薄" % size_n))
    if ratio and ratio < 2.0:
        findings.append(("D4", "高", "最大/最小字号比 %.1f×（建议 ≥3.5×）——对比不够狠" % ratio))
    elif ratio and ratio < 3.5:
        findings.append(("D4", "中", "最大/最小字号比 %.1f×（建议 ≥3.5×）" % ratio))
    if weight_n < 3:
        findings.append(("D4", "中", "唯一字重只有 %d 档（建议 ≥3）" % weight_n))
    if tabular == 0:
        findings.append(("D4", "中", "未使用 tabular-nums——数据列/价格会跳动"))

    # ---------- D5 结构同构 ----------
    grid_usage = len(re.findall(
        r"repeat\(\s*3\s*,|grid-cols-3|grid-template-columns[^;]*\b3\b", text, re.I))

    # 连续出现的三等分区块（骨架重复）
    triad_card = len(re.findall(
        r"(?:grid-cols-3|repeat\(\s*3\s*,)[\s\S]{0,900}?(?:grid-cols-3|repeat\(\s*3\s*,)",
        text, re.I))
    if triad_card == 0 and grid_usage >= 3:
        triad_card = grid_usage - 1

    state_cov = {}
    for k, pats in STATE_KEYWORDS.items():
        state_cov[k] = sum(len(re.findall(p, text, re.I)) for p in pats)
    missing_states = [k for k, v in state_cov.items() if v == 0]

    d5 = 0.0
    d5 += clamp(grid_usage / 6.0 * 100.0) * 0.35
    d5 += clamp(triad_card / 2.0 * 100.0) * 0.25
    d5 += clamp(len(missing_states) / 4.0 * 100.0) * 0.40
    d5 = clamp(d5)

    if triad_card >= 2:
        findings.append(("D5", "高", "连续三等分网格结构 %d 处——骨架重复" % triad_card))
    if grid_usage > 3:
        findings.append(("D5", "中", "等分三栏结构 %d 处——结构由内容决定，非由模板" % grid_usage))
    if missing_states:
        findings.append(("D5", "高", "缺少状态实现：%s" % "、".join(missing_states)))

    # ---------- D6 语义空洞 ----------
    emoji = EMOJI_RE.findall(text)
    hollow = [w for w in HOLLOW_WORDS if w.lower() in text.lower()]
    endings = [w for w in GENERIC_ENDING if w.lower() in text.lower()]
    triads = TRIAD_RE.findall(text)

    d6 = 0.0
    d6 += clamp(len(emoji) / 5.0 * 100.0) * 0.30
    d6 += clamp(len(hollow) / 6.0 * 100.0) * 0.35
    d6 += clamp(len(endings) / 2.0 * 100.0) * 0.20
    d6 += clamp(len(triads) / 6.0 * 100.0) * 0.15
    d6 = clamp(d6)

    if emoji:
        findings.append(("D6", "高", "检测到 %d 个 emoji——禁止用 emoji 承担图标职责" % len(emoji)))
    if hollow:
        findings.append(("D6", "高", "命中空洞词：%s" % "、".join(hollow[:8])))
    if endings:
        findings.append(("D6", "高", "命中通用积极收尾：%s" % "、".join(endings)))

    res.update(
        d1=d1, d2=d2, d3=d3, d4=d4, d5=d5, d6=d6,
        metrics={
            "center_ratio": round(center_ratio, 3),
            "equal_grids": equal_grids,
            "asymmetric": asym,
            "unique_hues": hue_count,
            "ui_hues": ui_hue_count,
            "purple_pink": purple_pink,
            "purple_family_gradients": purple_grad,
            "hardcoded_hex_in_components": hardcoded_in_comp,
            "gradients": gradients,
            "unique_shadows": shadow_n,
            "unique_radii": radius_n,
            "big_blur_shadows": big_blur,
            "glows": glow,
            "hover_lifts": hover_lift,
            "heavy_shadows": heavy_shadow,
            "large_radii": large_radius,
            "unique_font_sizes": size_n,
            "size_ratio": round(ratio, 2),
            "unique_font_weights": weight_n,
            "tabular_nums": tabular,
            "equal_grid_usage": grid_usage,
            "triad_blocks": triad_card,
            "missing_states": missing_states,
            "emoji": len(emoji),
            "hollow_words": hollow,
            "generic_endings": endings,
        },
        findings=findings,
        files_scanned=len(per_file),
    )
    return res


def score(res, scenario):
    w = SCENARIOS.get(scenario, SCENARIOS["auto"])["w"]
    dims = [res["d1"], res["d2"], res["d3"], res["d4"], res["d5"], res["d6"]]
    num = sum(d * wi for d, wi in zip(dims, w))
    den = sum(w)
    return clamp(num / den)


_BANDS = [(20, "A", "有立场（结构有取舍）"), (40, "B", "基本成型，局部惰性"),
          (60, "C", "明显模板感"), (80, "D", "通用模板"),
          (10 ** 9, "E", "默认主题直出")]


def grade(total):
    """分档只看分数（分数只用于定位，不用于交付）。"""
    for limit, code, desc in _BANDS:
        if total <= limit:
            return code, desc
    return "E", "默认主题直出"


def verdict(high_risk):
    """可交付性结论：只由「未解决的高危项」决定，见 references/anti-ai/diagnosis.md。"""
    if high_risk == 0:
        return "可交付（仍按 false-positives.md 逐条核对误杀）"
    if high_risk <= 2:
        return "待修：%d 条高危未解决，修完才可交付" % high_risk
    return "不可交付：%d 条高危未解决" % high_risk


# ---------------------------------------------------------------- 输出

BAR = "━━━━━━━━━━━━━━━━━━━━━━"


def render(result, scenario, top):
    sc = SCENARIOS.get(scenario, SCENARIOS["auto"])
    g, gd = grade(result["total"])
    lines = []
    lines.append(BAR)
    lines.append("  AI 味六维自检")
    lines.append(BAR)
    lines.append("  扫描文件：%d   场景：%s" % (result["files_scanned"], sc["label"]))
    lines.append("")
    lines.append("  AI 味总分：%.1f / 100   分档 %s（%s）" % (result["total"], g, gd))
    lines.append("  可交付性：%s" % result.get("verdict", verdict(
        sum(1 for f in result["findings"] if f[1] == "高"))))
    lines.append("")
    # 小样本提示：六维是「问题密度」加权，小页面天然够不到高档位
    if result["files_scanned"] <= 2:
        lines.append("  提示：样本仅 %d 个文件，分数按问题密度计必然偏低——"
                     "请看问题清单与可交付性结论，不要只看总分。" % result["files_scanned"])
        lines.append("")
    labels = [
        ("D1", "对称惯性", result["d1"]),
        ("D2", "色彩惰性", result["d2"]),
        ("D3", "装饰过载", result["d3"]),
        ("D4", "排版扁平", result["d4"]),
        ("D5", "结构同构", result["d5"]),
        ("D6", "语义空洞", result["d6"]),
    ]
    for code, name, val in labels:
        bar = "█" * int(val / 5) + "░" * (20 - int(val / 5))
        lines.append("  %s %-6s %s %5.1f" % (code, name, bar, val))
    lines.append("")

    if result["findings"]:
        order = {"高": 0, "中": 1, "低": 2}
        fs = sorted(result["findings"], key=lambda x: order.get(x[1], 3))
        lines.append("  问题清单（按严重度，最多 %d 条）" % top)
        lines.append("  " + "-" * 58)
        for dim, sev, msg in fs[:top]:
            mark = {"高": "!!", "中": "! ", "低": ". "}.get(sev, "  ")
            lines.append("  %s [%s/%s] %s" % (mark, dim, sev, msg))
        lines.append("")

    lines.append("  原始指标")
    lines.append("  " + "-" * 58)
    for k, v in result["metrics"].items():
        if isinstance(v, list) and len(v) > 4:
            v = v[:4] + ["…"]
        lines.append("    %-32s %s" % (k, v))
    lines.append("")
    lines.append(BAR)
    lines.append("  提醒：本脚本只做定位，不做出判决。")
    lines.append("  修改前必读 references/anti-ai/false-positives.md（误杀防护）。")
    if scenario in ("monitoring", "dataviz", "admin"):
        lines.append("  当前场景为 %s：密度、小字号、深色背景是正确解，不要改。" % sc["label"])
    lines.append(BAR)
    return "\n".join(lines)


def main():
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    ap = argparse.ArgumentParser(description="AI 味六维自检")
    ap.add_argument("path", help="要扫描的目录或文件")
    ap.add_argument("--json", action="store_true", help="以 JSON 输出")
    ap.add_argument("--scenario", default="auto",
                    choices=list(SCENARIOS.keys()), help="场景（影响权重）")
    ap.add_argument("--top", type=int, default=15, help="清单最多展示条数")
    args = ap.parse_args()

    if not os.path.exists(args.path):
        print("路径不存在：%s" % args.path, file=sys.stderr)
        return 2

    text, per_file = collect(args.path)
    if not per_file:
        print("未找到可扫描文件（%s）" % ", ".join(sorted(SCAN_EXT)), file=sys.stderr)
        return 2

    res = analyze(text, per_file, args.scenario)
    total = score(res, args.scenario)
    res["total"] = round(total, 1)
    high_risk = sum(1 for f in res["findings"] if f[1] == "高")
    g, gd = grade(total)
    res["high_risk"] = high_risk
    res["verdict"] = verdict(high_risk)
    res["grade"] = g
    res["grade_desc"] = gd
    res["scenario"] = args.scenario

    if args.json:
        out = {k: v for k, v in res.items()
               if k not in ("d1", "d2", "d3", "d4", "d5", "d6")}
        out["dimensions"] = {
            "D1_对称惯性": round(res["d1"], 1),
            "D2_色彩惰性": round(res["d2"], 1),
            "D3_装饰过载": round(res["d3"], 1),
            "D4_排版扁平": round(res["d4"], 1),
            "D5_结构同构": round(res["d5"], 1),
            "D6_语义空洞": round(res["d6"], 1),
        }
        out["findings"] = [
            {"dimension": d, "severity": s, "message": m}
            for d, s, m in res["findings"]
        ]
        print(json.dumps(out, ensure_ascii=False, indent=2))
    else:
        print(render(res, args.scenario, args.top))
    return 0


if __name__ == "__main__":
    sys.exit(main())
