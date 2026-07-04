# python-pptx 路演 PPT 设计改进方案

## 1. 配色方案（替换 #0a0e17 深色背景）

### 推荐方案 A：经典深蓝商务（最安全）

| 用途 | 颜色 | RGB | 说明 |
|------|------|-----|------|
| 背景 | 深藏青 | `#1B2A4A` | 比纯黑柔和，有质感 |
| 主文字 | 白色 | `#FFFFFF` | 标题/正文 |
| 副文字 | 浅灰 | `#B0BEC5` | 注释/说明 |
| 强调色 | 电光蓝 | `#2196F3` | 按钮、链接、高亮 |
| 辅助强调 | 琥珀金 | `#FFB300` | 关键数字、CTA |
| 卡片背景 | 半透明白 | `rgba(255,255,255,0.08)` | 用 `#1F3056` 近似 |

### 推荐方案 B：浅色专业（更像 Sequoia/a16z 投的 deck）

| 用途 | 颜色 | RGB | 说明 |
|------|------|-----|------|
| 背景 | 象牙白 | `#FAFAFA` | 干净 |
| 主文字 | 炭黑 | `#212121` | 正文 |
| 副文字 | 中灰 | `#757575` | 辅助信息 |
| 强调色 | 深蓝 | `#1565C0` | 标题装饰线、图标 |
| 辅助强调 | 翠绿 | `#2E7D32` | 增长指标、正向数据 |
| 分割线 | 浅灰 | `#E0E0E0` | 区域分隔 |

### 推荐方案 C：渐变暗色（保留深色但去 AI 味）

| 用途 | 颜色 | RGB | 说明 |
|------|------|-----|------|
| 背景渐变起点 | 深海军蓝 | `#0D1B2A` | slide 顶部 |
| 背景渐变终点 | 暗蓝灰 | `#1B2838` | slide 底部 |
| 主文字 | 亮白 | `#F0F4F8` | 略带蓝调的白 |
| 强调色 | 青蓝 | `#00B4D8` | 仅用于极少量高亮 |
| 数据色 | 浅金 | `#F4D35E` | 数字、图表 |

### python-pptx 配色示例

```python
from pptx.util import Inches, Pt, Emu
from pptx.dml.color import RGBColor
from pptx.enum.dml import MSO_THEME_COLOR

# 方案 A 用法
BG = RGBColor(0x1B, 0x2A, 0x4A)
TEXT = RGBColor(0xFF, 0xFF, 0xFF)
ACCENT = RGBColor(0x21, 0x96, 0xF3)
GOLD = RGBColor(0xFF, 0xB3, 0x00)
SUBTLE = RGBColor(0xB0, 0xBE, 0xC5)

# 设置 slide 背景色
from pptx.oxml.ns import qn
background = slide.background
fill = background.fill
fill.solid()
fill.fore_color.rgb = BG
```

## 2. 布局建议

### 核心原则：减少元素，增加留白

```
错误的 AI 风格：
┌──────────────────────────────┐
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │  ← 满屏都是东西
│ ┌────┐ ┌────┐ ┌────┐ ┌────┐ │
│ │card│ │card│ │card│ │card│ │  ← 4 张卡片挤一排
│ └────┘ └────┘ └────┘ └────┘ │
│ ┌──────────────────────────┐ │
│ │      进度条/图表/标签      │ │
│ └──────────────────────────┘ │
│  ● ● ● ● ● ● ● ● ● ● ● ●  │  ← 胶囊标签密密麻麻
└──────────────────────────────┘

正确的商业风格：
┌──────────────────────────────┐
│                              │
│   $10M                       │  ← 一个大数字
│   Total Addressable Market   │  ← 一行解释
│                              │
│   ───────────────            │  ← 细分割线
│                              │
│   Growing 40% YoY            │  ← 一个支撑点
│                              │
│                              │
│                              │  ← 大量留白
└──────────────────────────────┘
```

### 具体布局参数

```python
from pptx.util import Inches, Pt

# 幻灯片尺寸：16:9
SLIDE_W = Inches(13.333)
SLIDE_H = Inches(7.5)

# 安全边距（四周至少 0.8 英寸）
MARGIN = Inches(0.8)

# 内容区宽度
CONTENT_W = SLIDE_W - 2 * MARGIN  # 约 11.7 英寸

# 标题区域
TITLE_LEFT = MARGIN
TITLE_TOP = Inches(0.6)
TITLE_WIDTH = CONTENT_W

# 正文起始位置（标题下方留 0.4 英寸）
BODY_TOP = Inches(1.6)

# 多列布局（2 列）
COL_GAP = Inches(0.6)
COL_W = (CONTENT_W - COL_GAP) / 2
COL1_LEFT = MARGIN
COL2_LEFT = MARGIN + COL_W + COL_GAP
```

### 留白规则

| 元素 | 上方留白 | 下方留白 |
|------|----------|----------|
| Slide 标题 | 0.6" | 0.4" |
| 小节标题 | 0.3" | 0.2" |
| 段落之间 | 0.15" | 0.15" |
| 卡片之间 | 0.3" | 0.3" |
| Slide 底部安全区 | — | 0.6" |

### 对齐

```python
from pptx.enum.text import PP_ALIGN

# 所有文本左对齐（不要居中，居中显得业余）
para.alignment = PP_ALIGN.LEFT

# 数字/金额可以居中或右对齐
# 标题左对齐，带装饰线
```

## 3. 字体搭配

### 推荐组合

| 层级 | 英文字体 | 中文字体 | 字号 | 字重 |
|------|----------|----------|------|------|
| Slide 标题 | Inter / Helvetica Neue | 思源黑体 (Source Han Sans) | 28-36pt | Bold |
| 小节标题 | Inter / Helvetica Neue | 思源黑体 | 20-24pt | Semibold |
| 正文 | Inter / Helvetica Neue | 思源黑体 | 14-16pt | Regular |
| 数据/大数字 | Inter / DIN Pro | — | 48-72pt | Bold |
| 标签/注释 | Inter / Helvetica Neue | 思源黑体 | 10-12pt | Regular |

### python-pptx 字体设置

```python
from pptx.util import Pt
from pptx.enum.text import PP_ALIGN

def set_text(text_frame, text, font_name="Arial", size=Pt(14),
             bold=False, color=RGBColor(0xFF, 0xFF, 0xFF)):
    text_frame.clear()
    p = text_frame.paragraphs[0]
    p.alignment = PP_ALIGN.LEFT
    run = p.add_run()
    run.text = text
    run.font.name = font_name
    run.font.size = size
    run.font.bold = bold
    run.font.color.rgb = color

    # 中文字体需要设置 east 字体
    from pptx.oxml.ns import qn
    rPr = run._r.get_or_add_rPr()
    ea = rPr.makeelement(qn('a:ea'), {})
    ea.set('typeface', 'Microsoft YaHei')  # 或 'Source Han Sans SC'
    rPr.append(ea)
```

### 避免的字体

- ❌ Comic Sans、Papyrus、Impact（不专业）
- ❌ 默认的 Calibri（太普通，一眼 PPT 模板）
- ❌ 过多字体变化（整个 deck 最多 2 种字体族）

## 4. 去 AI 味的具体技巧

### 4.1 删除所有"装饰性"元素

```python
# 删除的东西：
# - 胶囊标签（capsule/tag badges）
# - 渐变背景上的彩色光晕
# - 半透明毛玻璃卡片
# - 多色渐变条
# - 带阴影的圆角矩形堆叠
# - 图标 + 标签的网格布局

# 替换为：
# - 纯色背景
# - 细线分隔（1pt 灰色线）
# - 左侧 4px 色条装饰（仅标题）
# - 干净的表格或列表
```

### 4.2 标题装饰线（替代彩色卡片标题）

```python
from pptx.util import Inches, Pt, Emu
from pptx.enum.shapes import MSO_SHAPE

def add_title_with_bar(slide, left, top, width, text, bar_color=ACCENT):
    """标题左侧加一条细色条，替代花哨的卡片"""
    # 色条
    bar = slide.shapes.add_shape(
        MSO_SHAPE.RECTANGLE,
        left, top + Inches(0.05),
        Inches(0.05), Inches(0.35)
    )
    bar.fill.solid()
    bar.fill.fore_color.rgb = bar_color
    bar.line.fill.background()  # 无边框

    # 标题文本
    txBox = slide.shapes.add_textbox(
        left + Inches(0.2), top,
        width - Inches(0.2), Inches(0.5)
    )
    set_text(txBox.text_frame, text,
             font_name="Arial", size=Pt(24),
             bold=True, color=TEXT)
```

### 4.3 数据展示：大数字 > 图表 > 列表

```python
def add_big_metric(slide, left, top, number, label, color=GOLD):
    """一个大数字 + 一行说明，替代复杂的图表卡片"""
    # 数字
    txBox = slide.shapes.add_textbox(left, top, Inches(3), Inches(1))
    tf = txBox.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    run = p.add_run()
    run.text = number
    run.font.size = Pt(54)
    run.font.bold = True
    run.font.color.rgb = color
    run.font.name = "Arial"

    # 标签
    p2 = tf.add_paragraph()
    run2 = p2.add_run()
    run2.text = label
    run2.font.size = Pt(14)
    run2.font.color.rgb = SUBTLE
    run2.font.name = "Arial"
```

### 4.4 列表样式：简洁 > 花哨

```python
def add_bullet_list(slide, left, top, width, items, color=TEXT):
    """简洁的项目列表，用 — 替代圆点"""
    txBox = slide.shapes.add_textbox(left, top, width, Inches(len(items) * 0.4))
    tf = txBox.text_frame
    tf.word_wrap = True

    for i, item in enumerate(items):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.space_after = Pt(8)
        run = p.add_run()
        run.text = f"  —  {item}"
        run.font.size = Pt(14)
        run.font.color.rgb = color
        run.font.name = "Arial"
```

### 4.5 整体风格检查清单

| 检查项 | AI 味 | 商业味 |
|--------|-------|--------|
| 背景 | 多色渐变、光晕 | 纯色或极简渐变 |
| 卡片 | 圆角+阴影+毛玻璃 | 无卡片，或 1pt 细边框 |
| 标签 | 胶囊形、多色 | 无标签，或纯文字标签 |
| 图标 | 填充式彩色图标 | 线条式单色图标或无图标 |
| 排版 | 居中、网格、对称 | 左对齐、非对称、有呼吸感 |
| 颜色数量 | 5+ 种 | 2-3 种（背景+文字+1强调） |
| 动画 | 淡入、缩放、飞入 | 无动画或仅简单淡出 |
| 每页信息量 | 塞满 | 一页一个核心信息 |
| 字号层次 | 层次模糊 | 明显的大小对比（72pt vs 14pt） |

### 4.6 Slide 类型模板

**封面 slide**：公司名 + 一句话 + 团队/日期（居中，大字）

**问题 slide**：一个大数字或一句话 + 1-2 行背景（左对齐）

**方案 slide**：3 个要点，每个一行（左对齐，带色条）

**市场 slide**：TAM/SAM/SOM 三个大数字横排

**商业模式 slide**：简洁的流程或表格，不要流程图

**牵引力 slide**：2-3 个关键指标（大数字 + 标签）

**团队 slide**：姓名 + 一句话背景（不要照片网格）

**融资 slide**：金额 + 用途（饼图或简单列表）

## 5. 快速修复代码

```python
def apply_business_theme(presentation):
    """一键应用商业主题配色（方案 A）"""
    for slide in presentation.slides:
        # 设置背景
        bg = slide.background
        fill = bg.fill
        fill.solid()
        fill.fore_color.rgb = RGBColor(0x1B, 0x2A, 0x4A)

        # 遍历所有 shape，统一字体
        for shape in slide.shapes:
            if shape.has_text_frame:
                for para in shape.text_frame.paragraphs:
                    para.alignment = PP_ALIGN.LEFT
                    for run in para.runs:
                        run.font.name = "Arial"
                        if run.font.size and run.font.size > Pt(20):
                            run.font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)
                            run.font.bold = True
                        else:
                            run.font.color.rgb = RGBColor(0xB0, 0xBE, 0xC5)
```

## 总结：三步去 AI 味

1. **砍元素**：删掉胶囊标签、毛玻璃卡片、装饰图标，每页只留 1 个核心信息
2. **降饱和**：把强调色从 3-4 种减到 1 种，背景从渐变改纯色
3. **加呼吸**：边距至少 0.8 英寸，元素间距至少 0.3 英寸，字号层次拉大
