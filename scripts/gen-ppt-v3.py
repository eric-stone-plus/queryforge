#!/usr/bin/env python3
"""Generate QueryForge pitch deck PPT v3 — addressing review findings."""

from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN
from pptx.enum.shapes import MSO_SHAPE
from pptx.oxml.ns import qn

# ── Design Tokens ──
BG = RGBColor(0x1a, 0x1f, 0x2e)
TEXT = RGBColor(0xf0, 0xee, 0xe8)
SUBTEXT = RGBColor(0x9a, 0x9a, 0x9a)
ACCENT = RGBColor(0xd4, 0xa8, 0x53)
CARD_BG = RGBColor(0x2a, 0x2f, 0x3e)
BLUE = RGBColor(0x4e, 0xa8, 0xde)
GREEN = RGBColor(0x4c, 0xaf, 0x50)
RED = RGBColor(0xcf, 0x22, 0x2e)
PURPLE = RGBColor(0x82, 0x50, 0xdf)

TITLE_SIZE = Pt(30)
BODY_SIZE = Pt(15)
BIG_NUM_SIZE = Pt(48)
SLIDE_W = Inches(13.333)
SLIDE_H = Inches(7.5)
MARGIN = Inches(1.0)


def set_slide_bg(slide, color=BG):
    bg = slide.background
    fill = bg.fill
    fill.solid()
    fill.fore_color.rgb = color


def _add_ea_font(run, font_name="Microsoft YaHei"):
    rPr = run._r.get_or_add_rPr()
    ea = rPr.makeelement(qn("a:ea"), {"typeface": font_name})
    rPr.append(ea)


def add_text(slide, left, top, width, height, text, size=BODY_SIZE, color=TEXT, bold=False, align=PP_ALIGN.LEFT):
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
    _add_ea_font(run)
    return txBox


def add_multiline(slide, left, top, width, height, lines, size=BODY_SIZE, color=TEXT, bold=False, align=PP_ALIGN.LEFT):
    txBox = slide.shapes.add_textbox(left, top, width, height)
    tf = txBox.text_frame
    tf.word_wrap = True
    for i, item in enumerate(lines):
        if isinstance(item, str):
            txt, clr, bld = item, color, bold
        else:
            txt = item[0]
            clr = item[1] if len(item) > 1 else color
            bld = item[2] if len(item) > 2 else bold
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.alignment = align
        p.space_after = Pt(8)
        run = p.add_run()
        run.text = txt
        run.font.size = size
        run.font.bold = bld
        run.font.color.rgb = clr
        run.font.name = "Arial"
        _add_ea_font(run)
    return txBox


def add_title(slide, text, top=MARGIN):
    return add_text(slide, MARGIN, top, Inches(10), Inches(0.6), text, size=TITLE_SIZE, bold=True)


def add_bottom_text(slide, text):
    add_text(slide, MARGIN, Inches(6.5), Inches(10), Inches(0.4), text, size=Pt(12), color=SUBTEXT)


def add_big_number(slide, left, top, number, label):
    add_text(slide, left, top, Inches(3), Inches(0.8), str(number), size=BIG_NUM_SIZE, color=ACCENT, bold=True)
    add_text(slide, left, top + Inches(0.9), Inches(3), Inches(0.4), label, size=BODY_SIZE, color=SUBTEXT)


def add_card(slide, left, top, width, height, title, lines, accent_color=ACCENT):
    shape = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, width, height)
    shape.fill.solid()
    shape.fill.fore_color.rgb = CARD_BG
    shape.line.fill.background()
    # Accent bar
    bar = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, left, top + Inches(0.05), Pt(4), height - Inches(0.1))
    bar.fill.solid()
    bar.fill.fore_color.rgb = accent_color
    bar.line.fill.background()
    # Title
    add_text(slide, left + Inches(0.3), top + Inches(0.15), width - Inches(0.6), Inches(0.35), title, size=Pt(16), bold=True, color=accent_color)
    # Content
    add_multiline(slide, left + Inches(0.3), top + Inches(0.55), width - Inches(0.6), height - Inches(0.7), lines, size=Pt(13), color=TEXT)


def add_flow_arrow(slide, left, top):
    add_text(slide, left, top, Inches(0.4), Inches(0.3), "→", size=Pt(20), color=SUBTEXT, align=PP_ALIGN.CENTER)


# ── Create Presentation ──
prs = Presentation()
prs.slide_width = SLIDE_W
prs.slide_height = SLIDE_H


# ══════════════════════════════════════════════════════════════
# Slide 1: Cover — with hook and team
# ══════════════════════════════════════════════════════════════
s = prs.slides.add_slide(prs.slide_layouts[6])
set_slide_bg(s)
add_text(s, MARGIN, Inches(1.8), Inches(10), Inches(0.5),
         "数据分析师每周 60% 的时间在做同一件事：拉报表",
         size=Pt(18), color=SUBTEXT)
add_text(s, MARGIN, Inches(2.5), Inches(10), Inches(1), "QueryForge", size=Pt(48), bold=True, color=TEXT)
add_text(s, MARGIN, Inches(3.5), Inches(10), Inches(0.5),
         "让业务团队自助取数，解放数据分析师",
         size=Pt(20), color=ACCENT)
add_text(s, MARGIN, Inches(4.3), Inches(10), Inches(0.5),
         "自然语言提问 → 自动生成 SQL → 实时可视化 → 异常归因 → 决策建议",
         size=Pt(14), color=SUBTEXT)
add_bottom_text(s, "ClawHunt Builder Camp 2026 · Track A: Agents at Work")


# ══════════════════════════════════════════════════════════════
# Slide 2: Pain Point — quantified + existing solutions fail
# ══════════════════════════════════════════════════════════════
s = prs.slides.add_slide(prs.slide_layouts[6])
set_slide_bg(s)
add_title(s, "业务要数据，总要等")

add_big_number(s, MARGIN, Inches(1.8), "60%", "数据分析师的时间花在重复取数上")

add_card(s, MARGIN, Inches(3.5), Inches(5.2), Inches(2.8),
         "分析师的一天",
         [
             (f'"帮我拉一下上个月各地区的 GMV"', SUBTEXT, False),
             (f'"口径改一下，要按下单时间不是支付时间"', SUBTEXT, False),
             (f'"再加一个退货率的列"', SUBTEXT, False),
             ("每天 2-3 小时在重复拉报表", RED, True),
         ],
         accent_color=RED)

add_card(s, Inches(6.8), Inches(3.5), Inches(5.2), Inches(2.8),
         "业务团队的一天",
         [
             ("周一提需求，周三还没拿到数据", SUBTEXT, False),
             ("拿到数据发现字段不对，又要重来", SUBTEXT, False),
             ("一个简单报表，改了 5 版", SUBTEXT, False),
             ("排期等待 1-3 天是常态", RED, True),
         ],
         accent_color=RED)

add_text(s, MARGIN, Inches(6.6), Inches(10), Inches(0.3),
         "现有方案为什么不行：BI 工具需要学习成本，ChatGPT 不懂你的数据口径，每次都要重新解释表结构",
         size=Pt(12), color=SUBTEXT)


# ══════════════════════════════════════════════════════════════
# Slide 3: Solution — flow diagram + differentiation
# ══════════════════════════════════════════════════════════════
s = prs.slides.add_slide(prs.slide_layouts[6])
set_slide_bg(s)
add_title(s, "分析师定义一次，业务自助使用")

add_text(s, MARGIN, Inches(1.8), Inches(10), Inches(0.4),
         "从「取数工具人」到「数据架构师」", size=Pt(18), color=ACCENT, bold=True)

# 4-step flow
step_data = [
    ("01", "分析师定义指标", "调整底层数据\n定义指标口径\n配置看板", ACCENT),
    ("02", "业务自然语言提问", "用中文描述需求\n像和同事说话一样", BLUE),
    ("03", "AI 自动生成查询", "理解意图\n匹配语义层\n生成 SQL + 验证", GREEN),
    ("04", "返回可视化 + 建议", "图表、异常提示\n决策建议\n一次定义，无限查询", PURPLE),
]

card_w = Inches(2.7)
gap = Inches(0.2)
start_x = MARGIN

for i, (num, title, desc, color) in enumerate(step_data):
    x = start_x + i * (card_w + gap)
    y = Inches(2.6)
    add_card(s, x, y, card_w, Inches(3.2), f"{num}  {title}", desc.split("\n"), accent_color=color)
    if i < 3:
        add_flow_arrow(s, x + card_w + Pt(2), Inches(3.8))

add_text(s, MARGIN, Inches(6.2), Inches(11), Inches(0.4),
         "与 ChatGPT 的区别：分析师的知识沉淀为语义资产，不是每次重新理解表结构",
         size=Pt(13), color=SUBTEXT)


# ══════════════════════════════════════════════════════════════
# Slide 4: Technical Innovation — self-correction + adversarial review
# ══════════════════════════════════════════════════════════════
s = prs.slides.add_slide(prs.slide_layouts[6])
set_slide_bg(s)
add_title(s, "AI 不只是生成，还会自我纠错")

# Self-correction loop
add_card(s, MARGIN, Inches(1.8), Inches(5.8), Inches(4.5),
         "自纠正循环",
         [
            ("生成 SQL", TEXT, False),
            ("  ↓", SUBTEXT, False),
            ("执行查询", TEXT, False),
            ("  ↓", SUBTEXT, False),
            ("结果异常？→ 自动诊断错误原因", ACCENT, True),
            ("  ↓", SUBTEXT, False),
            ("修正 SQL → 重新执行 → 验证", GREEN, True),
            ("  ↓", SUBTEXT, False),
            ("返回可靠结果（标记修正记录）", TEXT, False),
         ],
         accent_color=ACCENT)

# Adversarial review
add_card(s, Inches(7.2), Inches(1.8), Inches(5.0), Inches(2.0),
         "对抗审查机制",
         [
            ("生成结果由独立模块交叉验证", TEXT, False),
            ("降低幻觉风险，确保数据可靠", GREEN, True),
         ],
         accent_color=GREEN)

# Security layers
add_card(s, Inches(7.2), Inches(4.2), Inches(5.0), Inches(2.1),
         "多层安全防护",
         [
            ("AST 解析：只允许 SELECT 查询", TEXT, False),
            ("自动 LIMIT：防止大查询拖垮数据库", TEXT, False),
            ("只读连接：数据库层面无法写入", TEXT, False),
         ],
         accent_color=BLUE)


# ══════════════════════════════════════════════════════════════
# Slide 5: Validation — real data + performance metrics
# ══════════════════════════════════════════════════════════════
s = prs.slides.add_slide(prs.slide_layouts[6])
set_slide_bg(s)
add_title(s, "在真实数据上验证")

# Big numbers row
add_big_number(s, MARGIN, Inches(1.8), "10,000", "真实订单")
add_big_number(s, Inches(4.2), Inches(1.8), "8", "地区覆盖")
add_big_number(s, Inches(7.0), Inches(1.8), "20", "商品品类")
add_big_number(s, Inches(9.8), Inches(1.8), "8", "核心 KPI")

# Performance metrics
add_card(s, MARGIN, Inches(3.5), Inches(5.5), Inches(2.8),
         "查询能力",
         [
            ("覆盖 8 个核心经营指标", TEXT, False),
            ("支持跨地区、跨品类、跨时间段对比", TEXT, False),
            ("异常检测与趋势分析", TEXT, False),
            ("自动选择最佳图表类型", ACCENT, True),
         ],
         accent_color=BLUE)

add_card(s, Inches(7.0), Inches(3.5), Inches(5.2), Inches(2.8),
         "4 个预设 Demo 查询",
         [
            ("「各地区月度销售额趋势」→ 折线图", SUBTEXT, False),
            ("「哪个品类利润率最高？」→ 柱状图", SUBTEXT, False),
            ("「Top 10 畅销商品」→ 排名表", SUBTEXT, False),
            ("「复购率最高的用户」→ 用户画像", SUBTEXT, False),
         ],
         accent_color=GREEN)


# ══════════════════════════════════════════════════════════════
# Slide 6: Commercial Value — market + business model + scenario
# ══════════════════════════════════════════════════════════════
s = prs.slides.add_slide(prs.slide_layouts[6])
set_slide_bg(s)
add_title(s, "商业价值")

# Market size
add_card(s, MARGIN, Inches(1.8), Inches(3.6), Inches(2.5),
         "市场规模",
         [
            ("中国 50 万+ 数据分析师", TEXT, False),
            ("每人每周 20+ 小时重复取数", TEXT, False),
            ("自助式 BI 市场 CAGR 25%+", ACCENT, True),
         ],
         accent_color=ACCENT)

# Business model
add_card(s, Inches(5.0), Inches(1.8), Inches(3.6), Inches(2.5),
         "商业模式",
         [
            ("分析师注册 → 团队采用 → 企业采购", TEXT, False),
            ("指标一旦定义，迁移成本高", TEXT, False),
            ("自然锁定，留存率高", GREEN, True),
         ],
         accent_color=GREEN)

# Competitive moat
add_card(s, Inches(9.0), Inches(1.8), Inches(3.6), Inches(2.5),
         "竞争壁垒",
         [
            ("指标口径是分析师定义的", TEXT, False),
            ("不是通用 LLM 能替代的", TEXT, False),
            ("越用越准，数据飞轮", ACCENT, True),
         ],
         accent_color=PURPLE)

# Scenario-based value
add_card(s, MARGIN, Inches(4.7), Inches(11.5), Inches(1.8),
         "场景价值示例：电商运营",
         [
            ("一个 50 人运营团队，每天 20 个数据需求找分析师排队 → QueryForge 上线后，80% 需求业务自己解决", TEXT, False),
            ("分析师从每周处理 40 个需求降到 8 个，专注深度分析和策略支持", ACCENT, True),
         ],
         accent_color=ACCENT)


# ══════════════════════════════════════════════════════════════
# Slide 7: Use Cases — focused on one scenario + broad overview
# ══════════════════════════════════════════════════════════════
s = prs.slides.add_slide(prs.slide_layouts[6])
set_slide_bg(s)
add_title(s, "谁需要这个工具")

# Primary scenario (detailed)
add_card(s, MARGIN, Inches(1.8), Inches(5.5), Inches(4.2),
         "核心场景：电商运营",
         [
            ("运营人员随时查询商品销量、转化率", TEXT, False),
            ("活动效果实时对比，不用等分析师排期", TEXT, False),
            ("库存周转异常自动预警", TEXT, False),
            ("从「等报表」到「自己看数据」", ACCENT, True),
            ("", TEXT, False),
            ("典型提问：", SUBTEXT, False),
            ("「上个月华东销售额最高的 Top 10 商品」", SUBTEXT, False),
            ("「对比上个月，本月客单价变化了多少？」", SUBTEXT, False),
         ],
         accent_color=ACCENT)

# Other scenarios (overview)
add_card(s, Inches(7.0), Inches(1.8), Inches(5.2), Inches(4.2),
         "更多场景",
         [
            ("市场团队 — 活动效果、渠道对比、用户画像", TEXT, False),
            ("管理层 — 经营日报、异常预警、决策支持", TEXT, False),
            ("财务 — 收入分析、成本归因、预算执行", TEXT, False),
            ("产品 — 用户行为、功能使用率、留存率", TEXT, False),
            ("", TEXT, False),
            ("共同点：", SUBTEXT, False),
            ("有数据团队，但业务侧频繁提需求", ACCENT, True),
         ],
         accent_color=BLUE)


# ══════════════════════════════════════════════════════════════
# Slide 8: Team + Execution
# ══════════════════════════════════════════════════════════════
s = prs.slides.add_slide(prs.slide_layouts[6])
set_slide_bg(s)
add_title(s, "团队与执行力")

add_card(s, MARGIN, Inches(1.8), Inches(5.5), Inches(2.5),
         "执行力亮点",
         [
            ("3 天", ACCENT, True),
            ("从痛点发现到产品上线", TEXT, False),
            ("独创 QUINTE 五方对抗审查方法论", TEXT, False),
            ("5 个 AI 互相挑刺，消除盲区", GREEN, True),
         ],
         accent_color=ACCENT)

add_card(s, Inches(7.0), Inches(1.8), Inches(5.2), Inches(2.5),
         "技术能力",
         [
            ("全栈开发：前端 + AI + 数据库", TEXT, False),
            ("AI 应用落地经验", TEXT, False),
            ("产品化思维：不只是 demo，是可部署的 SaaS", ACCENT, True),
         ],
         accent_color=BLUE)

add_card(s, MARGIN, Inches(4.7), Inches(11.5), Inches(1.5),
         "质量保障：QUINTE 对抗审查",
         [
            ("3 轮审查 × 5 个 AI = 15 份独立审计报告，发现并修复了 SQL 注入防护、错误处理、边界条件等问题", TEXT, False),
         ],
         accent_color=GREEN)


# ══════════════════════════════════════════════════════════════
# Slide 9: CTA — contact + links + call to action
# ══════════════════════════════════════════════════════════════
s = prs.slides.add_slide(prs.slide_layouts[6])
set_slide_bg(s)

add_text(s, MARGIN, Inches(1.5), Inches(10), Inches(1),
         "QueryForge", size=Pt(48), bold=True, color=TEXT)
add_text(s, MARGIN, Inches(2.5), Inches(10), Inches(0.5),
         "让数据分析师做更有价值的事，让业务团队自己找到答案",
         size=Pt(18), color=ACCENT)

add_card(s, MARGIN, Inches(3.5), Inches(11.5), Inches(2.5),
         "现场体验",
         [
            ("在线演示：queryforge-production-8d6f.up.railway.app", BLUE, False),
            ("GitHub：github.com/eric-stone-plus/queryforge", BLUE, False),
            ("", TEXT, False),
            ("欢迎现场提问测试，真实数据实时响应", GREEN, True),
         ],
         accent_color=GREEN)

add_bottom_text(s, "ClawHunt Builder Camp 2026 · Track A: Agents at Work · 感谢聆听")


# ── Save ──
out = "/Users/ericstone/Downloads/data-agent/assets/QueryForge-Pitch.pptx"
prs.save(out)
print(f"PPT saved: {out} ({len(prs.slides)} slides)")
