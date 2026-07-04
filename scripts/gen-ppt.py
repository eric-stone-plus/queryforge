#!/usr/bin/env python3
"""Generate QueryForge pitch deck PPT."""

from pptx import Presentation
from pptx.util import Inches, Pt, Emu
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE

SLIDE_W = Inches(13.333)
SLIDE_H = Inches(7.5)

BG = RGBColor(0x1B, 0x2A, 0x4A)
CARD_BG = RGBColor(0x1F, 0x30, 0x56)
WHITE = RGBColor(0xFF, 0xFF, 0xFF)
SUBTLE = RGBColor(0xB0, 0xBE, 0xC5)
GOLD = RGBColor(0xFF, 0xB3, 0x00)
BLUE = RGBColor(0x21, 0x96, 0xF3)
GREEN = RGBColor(0x4C, 0xAF, 0x50)
RED = RGBColor(0xFF, 0x6B, 0x6B)

ICON_PATH = "/Users/ericstone/Downloads/data-agent/desktop/icon_1024.png"
OUT_PATH = "/Users/ericstone/Downloads/data-agent/QueryForge-Pitch.pptx"

prs = Presentation()
prs.slide_width = SLIDE_W
prs.slide_height = SLIDE_H
blank_layout = prs.slide_layouts[6]  # blank


def set_bg(slide):
    bg = slide.background
    fill = bg.fill
    fill.solid()
    fill.fore_color.rgb = BG


def add_text(slide, left, top, width, height, text, font_size=14,
             color=WHITE, bold=False, alignment=PP_ALIGN.LEFT,
             font_name="Microsoft YaHei"):
    txbox = slide.shapes.add_textbox(left, top, width, height)
    tf = txbox.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = text
    p.font.size = Pt(font_size)
    p.font.color.rgb = color
    p.font.bold = bold
    p.font.name = font_name
    p.alignment = alignment
    return txbox


def add_multiline(slide, left, top, width, height, lines,
                  font_size=14, color=WHITE, bold=False,
                  alignment=PP_ALIGN.LEFT, line_spacing=1.5,
                  font_name="Microsoft YaHei"):
    """lines: list of (text, color, bold, font_size) or str"""
    txbox = slide.shapes.add_textbox(left, top, width, height)
    tf = txbox.text_frame
    tf.word_wrap = True
    for i, line in enumerate(lines):
        if isinstance(line, str):
            txt, clr, bld, fs = line, color, bold, font_size
        else:
            txt = line[0]
            clr = line[1] if len(line) > 1 else color
            bld = line[2] if len(line) > 2 else bold
            fs = line[3] if len(line) > 3 else font_size
        if i == 0:
            p = tf.paragraphs[0]
        else:
            p = tf.add_paragraph()
        p.text = txt
        p.font.size = Pt(fs)
        p.font.color.rgb = clr
        p.font.bold = bld
        p.font.name = font_name
        p.alignment = alignment
        p.space_after = Pt(font_size * (line_spacing - 1))
    return txbox


def add_card(slide, left, top, width, height, lines,
             font_size=14, color=WHITE, accent_color=None, bold=False):
    """Add a card with #1F3056 background, optional left accent bar."""
    shape = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, left, top, width, height)
    shape.fill.solid()
    shape.fill.fore_color.rgb = CARD_BG
    shape.line.fill.background()

    if accent_color:
        bar = slide.shapes.add_shape(
            MSO_SHAPE.RECTANGLE, left, top, Pt(4), height)
        bar.fill.solid()
        bar.fill.fore_color.rgb = accent_color
        bar.line.fill.background()

    padding = Inches(0.3)
    add_multiline(slide, left + padding, top + Pt(12),
                  width - padding * 2, height - Pt(24),
                  lines, font_size=font_size, color=color, bold=bold,
                  line_spacing=1.6)


def add_gold_line(slide, left, top, width):
    shape = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, left, top, width, Pt(3))
    shape.fill.solid()
    shape.fill.fore_color.rgb = GOLD
    shape.line.fill.background()


def add_title(slide, text, color=WHITE):
    add_text(slide, Inches(0.8), Inches(0.5), Inches(10), Inches(0.8),
             text, font_size=32, color=color, bold=True)
    add_gold_line(slide, Inches(0.8), Inches(1.2), Inches(3))


# ── Slide 1: Cover ──
slide = prs.slides.add_slide(blank_layout)
set_bg(slide)

add_text(slide, Inches(0.8), Inches(1.8), Inches(8), Inches(1.2),
         "QueryForge", font_size=54, color=GOLD, bold=True)
add_gold_line(slide, Inches(0.8), Inches(3.1), Inches(3))
add_text(slide, Inches(0.8), Inches(3.4), Inches(8), Inches(0.6),
         "让业务部门自己拿数据", font_size=24, color=WHITE, bold=True)
add_text(slide, Inches(0.8), Inches(4.2), Inches(8), Inches(0.8),
         "解放数据分析师的重复需求，业务团队用自然语言自助取数",
         font_size=14, color=SUBTLE)
add_text(slide, Inches(0.8), Inches(6.5), Inches(6), Inches(0.4),
         "ClawHunt Builder Camp 2026 · Track A",
         font_size=12, color=SUBTLE)

# product icon on right
slide.shapes.add_picture(ICON_PATH,
                         Inches(9.5), Inches(2.5), Inches(2.8), Inches(2.8))


# ── Slide 2: Pain Point ──
slide = prs.slides.add_slide(blank_layout)
set_bg(slide)
add_title(slide, "数据分析师的困境")

# Big number
add_text(slide, Inches(0.8), Inches(1.6), Inches(5), Inches(1),
         "80%", font_size=48, color=GOLD, bold=True)
add_text(slide, Inches(2.6), Inches(1.85), Inches(5), Inches(0.5),
         "数据分析师的时间花在重复取数上", font_size=16, color=SUBTLE)

# Left card - analyst
add_card(slide, Inches(0.8), Inches(3.0), Inches(5.5), Inches(3.6),
         [
             ("分析师的一天", WHITE, True, 16),
             ("", WHITE, False, 6),
             ("「帮我拉一下上个月各地区的 GMV」", SUBTLE, False, 14),
             ("「口径改一下，要按下单时间不是支付时间」", SUBTLE, False, 14),
             ("「再加一个退货率的列」", SUBTLE, False, 14),
             ("", WHITE, False, 6),
             ("每天 2-3 小时在重复拉报表", RED, True, 14),
         ],
         accent_color=RED)

# Right card - business
add_card(slide, Inches(7.0), Inches(3.0), Inches(5.5), Inches(3.6),
         [
             ("业务团队的一天", WHITE, True, 16),
             ("", WHITE, False, 6),
             ("周一提需求，周三还没拿到数据", SUBTLE, False, 14),
             ("拿到数据发现字段不对，又要重来", SUBTLE, False, 14),
             ("一个简单报表，改了 5 版", SUBTLE, False, 14),
             ("", WHITE, False, 6),
             ("排期等待 1-3 天是常态", BLUE, True, 14),
         ],
         accent_color=BLUE)


# ── Slide 3: Solution ──
slide = prs.slides.add_slide(blank_layout)
set_bg(slide)
add_title(slide, "分析师建指标，业务自助取数")

add_text(slide, Inches(0.8), Inches(1.6), Inches(10), Inches(0.5),
         "从「取数工具人」到「数据架构师」", font_size=20, color=GOLD, bold=True)

# 4 step cards
steps = [
    (GOLD, "分析师定义指标", "调整底层数据、定义指标口径、配置看板\n——一次性工作"),
    (BLUE, "业务用自然语言提问", "用中文描述需求\n像和同事说话一样"),
    (BLUE, "系统自动生成图表", "理解意图，自动匹配数据源\n生成可视化"),
    (GREEN, "异常自动预警", "图表、异常提示、决策建议\n一次定义，无限次查询"),
]

card_w = Inches(2.8)
card_h = Inches(3.2)
start_x = Inches(0.8)
gap = Inches(0.27)

for i, (accent, title, desc) in enumerate(steps):
    x = start_x + i * (card_w + gap)
    y = Inches(2.6)
    add_card(slide, x, y, card_w, card_h,
             [
                 (f"0{i+1}", accent, True, 28),
                 ("", WHITE, False, 4),
                 (title, WHITE, True, 16),
                 ("", WHITE, False, 4),
                 (desc, SUBTLE, False, 13),
             ],
             accent_color=accent)

    if i < 3:
        arrow_x = x + card_w + Pt(4)
        add_text(slide, arrow_x, Inches(3.8), Inches(0.2), Inches(0.4),
                 "→", font_size=20, color=SUBTLE)

add_text(slide, Inches(0.8), Inches(6.3), Inches(10), Inches(0.4),
         "分析师从此不再反复拉报表", font_size=14, color=SUBTLE)


# ── Slide 4: Product Demo ──
slide = prs.slides.add_slide(blank_layout)
set_bg(slide)
add_title(slide, "从提问到看板，10 秒")

# Left scenario card
add_card(slide, Inches(0.8), Inches(1.8), Inches(3.8), Inches(4.5),
         [
             ("基础查询", GOLD, True, 16),
             ("", WHITE, False, 6),
             ("「各地区月度销售额趋势」", WHITE, False, 14),
             ("", WHITE, False, 6),
             ("8 地区 × 12 个月折线图", SUBTLE, False, 13),
             ("", WHITE, False, 12),
             ("复杂分析", GOLD, True, 16),
             ("", WHITE, False, 6),
             ("「哪个品类利润率最高？」", WHITE, False, 14),
             ("", WHITE, False, 6),
             ("品类利润率排名柱状图", SUBTLE, False, 13),
             ("", WHITE, False, 12),
             ("自由提问", GOLD, True, 16),
             ("", WHITE, False, 6),
             ("「复购率最高的用户是谁？」", WHITE, False, 14),
             ("", WHITE, False, 6),
             ("用户复购排名表", SUBTLE, False, 13),
         ])

# Center product icon
icon_w = Inches(4.5)
icon_h = Inches(4.5)
icon_x = Inches(5.0)
icon_y = Inches(1.8)

frame = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE,
                                icon_x - Pt(4), icon_y - Pt(4),
                                icon_w + Pt(8), icon_h + Pt(8))
frame.fill.solid()
frame.fill.fore_color.rgb = RGBColor(0x2A, 0x3F, 0x5F)
frame.line.fill.background()

slide.shapes.add_picture(ICON_PATH, icon_x, icon_y, icon_w, icon_h)

# Right: key selling points
add_card(slide, Inches(10.0), Inches(1.8), Inches(2.8), Inches(4.5),
         [
             ("核心卖点", BLUE, True, 16),
             ("", WHITE, False, 6),
             ("— 不需要懂任何技术", WHITE, False, 14),
             ("— 自然语言提问", WHITE, False, 14),
             ("— 自动选择图表类型", WHITE, False, 14),
             ("— 指标可保存复用", WHITE, False, 14),
             ("— 一键刷新", WHITE, False, 14),
         ],
         accent_color=BLUE)

add_text(slide, Inches(0.8), Inches(6.7), Inches(10), Inches(0.3),
         "真实数据：10,000 笔订单 · 500 商品 · 8 地区",
         font_size=11, color=SUBTLE)


# ── Slide 5: Core Data ──
slide = prs.slides.add_slide(blank_layout)
set_bg(slide)
add_title(slide, "用数据说话")

metrics = [
    ("从 3 天到 10 秒", "取数时间", "业务不再排期等待"),
    ("释放 80%", "重复工作时间", "转向深度分析和策略支持"),
    ("10,000 笔订单", "8 地区覆盖", "真实企业级数据量验证"),
    ("一次定义", "无限次查询", "口径统一，不再反复对齐"),
]

card_w = Inches(5.6)
card_h = Inches(2.3)
gap_x = Inches(0.4)
gap_y = Inches(0.4)
start_x = Inches(0.8)
start_y = Inches(1.8)

for i, (big_num, label, desc) in enumerate(metrics):
    col = i % 2
    row = i // 2
    x = start_x + col * (card_w + gap_x)
    y = start_y + row * (card_h + gap_y)
    add_card(slide, x, y, card_w, card_h,
             [
                 (big_num, GOLD, True, 48),
                 ("", WHITE, False, 4),
                 (label, WHITE, True, 16),
                 (desc, SUBTLE, False, 13),
             ])


# ── Slide 6: Business Model ──
slide = prs.slides.add_slide(blank_layout)
set_bg(slide)
add_title(slide, "怎么赚钱")

# Pricing table card
add_card(slide, Inches(0.8), Inches(1.8), Inches(5.5), Inches(4.5),
         [
             ("SaaS 订阅制定价", GOLD, True, 18),
             ("", WHITE, False, 8),
             ("团队版  ¥299/月/团队", WHITE, True, 16),
             ("最多 10 人，50 个指标", SUBTLE, False, 13),
             ("", WHITE, False, 8),
             ("企业版  ¥999/月/团队", WHITE, True, 16),
             ("无限人数，无限指标，私有部署", SUBTLE, False, 13),
             ("", WHITE, False, 12),
             ("目标客户", WHITE, True, 14),
             ("有数据团队但业务侧频繁提需求的中型企业（100-1000 人）", SUBTLE, False, 13),
         ])

# Right: funnel
add_card(slide, Inches(7.0), Inches(1.8), Inches(5.5), Inches(4.5),
         [
             ("获客漏斗", BLUE, True, 18),
             ("", WHITE, False, 10),
             ("分析师注册试用", WHITE, True, 16),
             ("   ↓", SUBTLE, False, 16),
             ("团队日常使用", WHITE, True, 16),
             ("   ↓", SUBTLE, False, 16),
             ("企业级采购", WHITE, True, 16),
             ("", WHITE, False, 12),
             ("留存逻辑", WHITE, True, 14),
             ("指标一旦定义，迁移成本高，自然锁定", SUBTLE, False, 13),
         ],
         accent_color=BLUE)

add_text(slide, Inches(0.8), Inches(6.7), Inches(10), Inches(0.3),
         "核心壁垒：指标资产沉淀 + 口径标准化",
         font_size=12, color=SUBTLE)


# ── Slide 7: Market Size ──
slide = prs.slides.add_slide(blank_layout)
set_bg(slide)
add_title(slide, "市场机会")

tam_data = [
    ("¥500 亿", "TAM", "中国商业智能与数据分析市场（2025）"),
    ("¥80 亿", "SAM", "中小企业自助分析工具市场"),
    ("¥2 亿", "SOM", "首年目标：500 个付费团队"),
]

card_w = Inches(3.6)
card_h = Inches(3.0)
gap = Inches(0.4)
start_x = Inches(0.8)

for i, (num, label, desc) in enumerate(tam_data):
    x = start_x + i * (card_w + gap)
    y = Inches(1.8)
    add_card(slide, x, y, card_w, card_h,
             [
                 (label, BLUE, True, 16),
                 ("", WHITE, False, 6),
                 (num, GOLD, True, 48),
                 ("", WHITE, False, 6),
                 (desc, SUBTLE, False, 13),
             ])

# Growth trends
add_card(slide, Inches(0.8), Inches(5.2), Inches(11.6), Inches(1.5),
         [
             ("增长趋势", GREEN, True, 16),
             ("— 企业数据量每年增长 40%+          — 数据分析人才缺口持续扩大          — 自助式 BI 市场 CAGR 25%+", SUBTLE, False, 14),
         ],
         accent_color=GREEN)


# ── Slide 8: Team ──
slide = prs.slides.add_slide(blank_layout)
set_bg(slide)
add_title(slide, "团队")

add_card(slide, Inches(0.8), Inches(1.8), Inches(5.5), Inches(4.0),
         [
             ("产品 & 技术", WHITE, True, 18),
             ("", WHITE, False, 6),
             ("全栈开发能力", SUBTLE, False, 14),
             ("AI 应用落地经验", SUBTLE, False, 14),
             ("", WHITE, False, 12),
             ("质量保障", WHITE, True, 18),
             ("", WHITE, False, 6),
             ("QUINTE 五方对抗审查方法论", SUBTLE, False, 14),
             ("5 个 AI 互相挑刺，消除盲区", SUBTLE, False, 14),
         ])

add_card(slide, Inches(7.0), Inches(1.8), Inches(5.5), Inches(4.0),
         [
             ("执行力亮点", GOLD, True, 18),
             ("", WHITE, False, 10),
             ("3 天", GOLD, True, 48),
             ("从痛点发现到产品上线", WHITE, False, 14),
             ("", WHITE, False, 10),
             ("— 独创 QUINTE 对抗审查体系", SUBTLE, False, 14),
             ("— 用最小成本验证了产品可行性", SUBTLE, False, 14),
         ],
         accent_color=GOLD)

add_text(slide, Inches(0.8), Inches(6.5), Inches(10), Inches(0.4),
         "ClawHunt Builder Camp 2026 · 3 天从 0 到 1",
         font_size=12, color=SUBTLE)


# ── Slide 9: CTA ──
slide = prs.slides.add_slide(blank_layout)
set_bg(slide)

add_text(slide, Inches(0.8), Inches(2.0), Inches(11), Inches(1.2),
         "QueryForge", font_size=54, color=GOLD, bold=True,
         alignment=PP_ALIGN.LEFT)
add_gold_line(slide, Inches(0.8), Inches(3.3), Inches(3))
add_text(slide, Inches(0.8), Inches(3.7), Inches(11), Inches(0.6),
         "让数据分析师做分析师该做的事，让业务自己拿到数据。",
         font_size=20, color=WHITE, bold=True)
add_text(slide, Inches(0.8), Inches(4.6), Inches(11), Inches(0.4),
         "queryforge-production-8d6f.up.railway.app",
         font_size=16, color=BLUE)
add_text(slide, Inches(0.8), Inches(5.1), Inches(11), Inches(0.4),
         "github.com/eric-stone-plus/queryforge",
         font_size=16, color=BLUE)
add_text(slide, Inches(0.8), Inches(6.5), Inches(10), Inches(0.4),
         "ClawHunt Builder Camp 2026 · Track A",
         font_size=12, color=SUBTLE)

# ── Save ──
prs.save(OUT_PATH)
print(f"Saved to {OUT_PATH}")
