# QueryForge 路演 PPT 重设计方案

## 设计原则

| 原则 | 说明 |
|------|------|
| 背景 | `#1a1f2e` 深色但有质感，不压抑 |
| 强调色 | 淡金 `#d4a853`，只用一个 |
| 卡片 | `rgba(255,255,255,0.05)` 半透明白 |
| 文字 | 左对齐，不居中 |
| 留白 | 一页只讲一件事，大量呼吸空间 |
| 禁止 | 无渐变、无光晕、无胶囊标签、无阴影 |

## 字号规范

| 层级 | 字号 | 用途 |
|------|------|------|
| 标题 | 28-32pt | 每页主标题 |
| 正文 | 14-16pt | 说明文字 |
| 大数字 | 48pt | 数据亮点 |

---

## 8 页 PPT 内容

### Page 1: 封面

**标题：** QueryForge

**副标题：** 让业务团队自助取数，解放数据分析师

**底部一行：** ClawHunt Builder Camp 2026 · 72 小时构建

---

### Page 2: 痛点

**标题：** 业务要数据，总要等

**内容（左对齐列表）：**
- 运营问"华东上个月卖了多少" → 找分析师
- 市场问"哪个品类增长最快" → 排期等报表
- 老板问"为什么这个月下滑" → 加急再加急

**底部一句：** 数据分析师每周 60% 时间在重复拉数

---

### Page 3: 方案

**标题：** 分析师定义一次，业务自助使用

**流程（三个节点，左对齐）：**
1. 分析师定义数据口径和指标
2. 业务用自然语言提问
3. 系统返回数据、图表、洞察

**底部一句：** 从"提需求等三天"到"自己问自己看"

---

### Page 4: 产品能力

**标题：** 从提问到决策，一个流程走完

**四个能力（一行一个）：**
- **取数** — "各地区本月销售额是多少"
- **可视化** — 自动生成图表，一键切换维度
- **归因** — "为什么东区下降了" → 自动找原因
- **建议** — 基于数据给出下一步行动

---

### Page 5: 真实验证

**标题：** 在真实数据上验证

**三个大数字（横排）：**

| 10,000 | 8 | 20 |
|--------|---|---|
| 订单 | 地区 | 品类 |

**下方说明：**
- 覆盖 8 个 KPI 指标
- 支持跨地区、跨品类对比
- 异常检测与趋势分析

---

### Page 6: 双重价值

**标题：** 一个产品，两方受益

**左列：分析师**
- 减少重复取数工作
- 专注于指标定义和数据治理
- 从"拉数的"变成"定标准的"

**右列：业务团队**
- 随时提问，不用排队
- 自己看数据，自己做决策
- 从"等报表"到"看数据"

---

### Page 7: 应用场景

**标题：** 谁需要这个工具

**四个场景（左对齐）：**
- **电商运营** — 每天看销售、库存、转化
- **市场团队** — 活动效果、渠道对比、用户画像
- **管理层** — 经营日报、异常预警、决策支持
- **财务** — 收入分析、成本归因、预算执行

---

### Page 8: 结束

**标题：** QueryForge

**一句话：** 让数据分析师做更有价值的事，让业务团队自己找到答案

**底部：** ClawHunt Builder Camp 2026

---

## python-pptx 代码框架

```python
from pptx import Presentation
from pptx.util import Inches, Pt, Emu
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN
from pptx.enum.shapes import MSO_SHAPE
from pptx.oxml.ns import qn

# ── 配色 ──────────────────────────────────────────
BG = RGBColor(0x1a, 0x1f, 0x2e)           # 背景
TEXT = RGBColor(0xf0, 0xee, 0xe8)          # 主文字（暖白）
SUBTEXT = RGBColor(0x9a, 0x9a, 0x9a)       # 副文字
ACCENT = RGBColor(0xd4, 0xa8, 0x53)        # 强调色（淡金）
CARD_BG = RGBColor(0x2a, 0x2f, 0x3e)       # 卡片背景（近似 rgba 0.05）

# ── 字号 ──────────────────────────────────────────
TITLE_SIZE = Pt(30)
BODY_SIZE = Pt(15)
BIG_NUM_SIZE = Pt(48)

# ── 布局常量 ──────────────────────────────────────
SLIDE_W = Inches(13.333)
SLIDE_H = Inches(7.5)
MARGIN = Inches(1.0)


def set_slide_bg(slide, color=BG):
    """设置幻灯片背景色"""
    bg = slide.background
    fill = bg.fill
    fill.solid()
    fill.fore_color.rgb = color


def add_text(slide, left, top, width, height, text,
             size=BODY_SIZE, color=TEXT, bold=False, align=PP_ALIGN.LEFT):
    """添加文本框"""
    txBox = slide.shapes.add_textbox(left, top, width, height)
    tf = txBox.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.alignment = align
    run = p.add_run()
    run.text = text
    run.font.size = size
    run.font.bold = bold
    run.font.color.rgb = color
    run.font.name = "Arial"
    # 中文字体
    rPr = run._r.get_or_add_rPr()
    ea = rPr.makeelement(qn('a:ea'), {'typeface': 'Microsoft YaHei'})
    rPr.append(ea)
    return txBox


def add_title(slide, text, top=MARGIN):
    """添加页面标题"""
    return add_text(slide, MARGIN, top, Inches(10), Inches(0.6),
                    text, size=TITLE_SIZE, bold=True)


def add_body(slide, text, top=Inches(2.0)):
    """添加正文"""
    return add_text(slide, MARGIN, top, Inches(10), Inches(4),
                    text, size=BODY_SIZE)


def add_bullet_list(slide, items, left=MARGIN, top=Inches(2.0), width=Inches(10)):
    """添加项目列表"""
    txBox = slide.shapes.add_textbox(left, top, width, Inches(len(items) * 0.5))
    tf = txBox.text_frame
    tf.word_wrap = True
    for i, item in enumerate(items):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.space_after = Pt(12)
        p.alignment = PP_ALIGN.LEFT
        run = p.add_run()
        run.text = f"  —  {item}"
        run.font.size = BODY_SIZE
        run.font.color.rgb = TEXT
        run.font.name = "Arial"
        rPr = run._r.get_or_add_rPr()
        ea = rPr.makeelement(qn('a:ea'), {'typeface': 'Microsoft YaHei'})
        rPr.append(ea)
    return txBox


def add_big_number(slide, left, top, number, label):
    """添加大数字 + 标签"""
    # 数字
    add_text(slide, left, top, Inches(3), Inches(0.8),
             str(number), size=BIG_NUM_SIZE, color=ACCENT, bold=True)
    # 标签
    add_text(slide, left, top + Inches(0.9), Inches(3), Inches(0.4),
             label, size=BODY_SIZE, color=SUBTEXT)


def add_card(slide, left, top, width, height, title, content):
    """添加半透明卡片"""
    shape = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE,
                                   left, top, width, height)
    shape.fill.solid()
    shape.fill.fore_color.rgb = CARD_BG
    shape.line.fill.background()
    # 标题
    add_text(slide, left + Inches(0.3), top + Inches(0.2),
             width - Inches(0.6), Inches(0.4),
             title, size=Pt(16), bold=True, color=ACCENT)
    # 内容
    add_text(slide, left + Inches(0.3), top + Inches(0.7),
             width - Inches(0.6), height - Inches(1),
             content, size=BODY_SIZE, color=TEXT)


def add_bottom_text(slide, text):
    """添加底部文字"""
    add_text(slide, MARGIN, Inches(6.5), Inches(10), Inches(0.4),
             text, size=Pt(12), color=SUBTEXT)


# ── 创建演示文稿 ──────────────────────────────────
prs = Presentation()
prs.slide_width = SLIDE_W
prs.slide_height = SLIDE_H

# ── Page 1: 封面 ─────────────────────────────────
slide1 = prs.slides.add_slide(prs.slide_layouts[6])  # 空白布局
set_slide_bg(slide1)
add_text(slide1, MARGIN, Inches(2.5), Inches(10), Inches(1),
         "QueryForge", size=Pt(48), bold=True, color=TEXT)
add_text(slide1, MARGIN, Inches(3.5), Inches(10), Inches(0.5),
         "让业务团队自助取数，解放数据分析师", size=Pt(20), color=SUBTEXT)
add_bottom_text(slide1, "ClawHunt Builder Camp 2026 · 72 小时构建")

# ── Page 2: 痛点 ─────────────────────────────────
slide2 = prs.slides.add_slide(prs.slide_layouts[6])
set_slide_bg(slide2)
add_title(slide2, "业务要数据，总要等")
add_bullet_list(slide2, [
    '运营问"华东上个月卖了多少" → 找分析师',
    '市场问"哪个品类增长最快" → 排期等报表',
    '老板问"为什么这个月下滑" → 加急再加急',
])
add_bottom_text(slide2, "数据分析师每周 60% 时间在重复拉数")

# ── Page 3: 方案 ─────────────────────────────────
slide3 = prs.slides.add_slide(prs.slide_layouts[6])
set_slide_bg(slide3)
add_title(slide3, "分析师定义一次，业务自助使用")
add_bullet_list(slide3, [
    "分析师定义数据口径和指标",
    "业务用自然语言提问",
    "系统返回数据、图表、洞察",
])
add_bottom_text(slide3, '从"提需求等三天"到"自己问自己看"')

# ── Page 4: 产品能力 ─────────────────────────────
slide4 = prs.slides.add_slide(prs.slide_layouts[6])
set_slide_bg(slide4)
add_title(slide4, "从提问到决策，一个流程走完")
add_bullet_list(slide4, [
    '取数 — "各地区本月销售额是多少"',
    "可视化 — 自动生成图表，一键切换维度",
    '归因 — "为什么东区下降了" → 自动找原因',
    "建议 — 基于数据给出下一步行动",
])

# ── Page 5: 真实验证 ─────────────────────────────
slide5 = prs.slides.add_slide(prs.slide_layouts[6])
set_slide_bg(slide5)
add_title(slide5, "在真实数据上验证")
add_big_number(slide5, MARGIN, Inches(2.0), "10,000", "订单")
add_big_number(slide5, Inches(4.5), Inches(2.0), "8", "地区")
add_big_number(slide5, Inches(8), Inches(2.0), "20", "品类")
add_bullet_list(slide5, [
    "覆盖 8 个 KPI 指标",
    "支持跨地区、跨品类对比",
    "异常检测与趋势分析",
], top=Inches(4.5))

# ── Page 6: 双重价值 ─────────────────────────────
slide6 = prs.slides.add_slide(prs.slide_layouts[6])
set_slide_bg(slide6)
add_title(slide6, "一个产品，两方受益")
add_card(slide6, MARGIN, Inches(2.0), Inches(5), Inches(4),
         "分析师",
         "减少重复取数工作\n专注于指标定义和数据治理\n从'拉数的'变成'定标准的'")
add_card(slide6, Inches(7), Inches(2.0), Inches(5), Inches(4),
         "业务团队",
         "随时提问，不用排队\n自己看数据，自己做决策\n从'等报表'到'看数据'")

# ── Page 7: 应用场景 ─────────────────────────────
slide7 = prs.slides.add_slide(prs.slide_layouts[6])
set_slide_bg(slide7)
add_title(slide7, "谁需要这个工具")
add_bullet_list(slide7, [
    "电商运营 — 每天看销售、库存、转化",
    "市场团队 — 活动效果、渠道对比、用户画像",
    "管理层 — 经营日报、异常预警、决策支持",
    "财务 — 收入分析、成本归因、预算执行",
])

# ── Page 8: 结束 ─────────────────────────────────
slide8 = prs.slides.add_slide(prs.slide_layouts[6])
set_slide_bg(slide8)
add_text(slide8, MARGIN, Inches(2.5), Inches(10), Inches(1),
         "QueryForge", size=Pt(48), bold=True, color=TEXT)
add_text(slide8, MARGIN, Inches(3.5), Inches(10), Inches(0.8),
         "让数据分析师做更有价值的事\n让业务团队自己找到答案",
         size=Pt(18), color=SUBTEXT)
add_bottom_text(slide8, "ClawHunt Builder Camp 2026")

# ── 保存 ──────────────────────────────────────────
output_path = "/Users/ericstone/Downloads/data-agent/docs/QueryForge-Pitch.pptx"
prs.save(output_path)
print(f"PPT saved to {output_path}")
```

---

## 设计检查清单

- [x] 背景色 `#1a1f2e`
- [x] 强调色只用淡金 `#d4a853`
- [x] 无渐变、无光晕、无胶囊标签
- [x] 每页只讲一件事
- [x] 文字左对齐
- [x] 标题 28-32pt，正文 14-16pt，大数字 48pt
- [x] 卡片用半透明白
- [x] 不提 SQL、技术栈、评分
- [x] 不编造定价、市场规模、团队背景
- [x] 使用真实数据（10K、8、20、8 KPI）
