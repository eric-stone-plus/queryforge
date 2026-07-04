from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN
from pptx.enum.shapes import MSO_SHAPE
from pptx.oxml.ns import qn

BG = RGBColor(0x1a, 0x1f, 0x2e)
TEXT = RGBColor(0xf0, 0xee, 0xe8)
SUBTEXT = RGBColor(0x9a, 0x9a, 0x9a)
ACCENT = RGBColor(0xd4, 0xa8, 0x53)
CARD = RGBColor(0x2a, 0x2f, 0x3e)
WHITE = RGBColor(0xff, 0xff, 0xff)

W = Inches(13.333)
H = Inches(7.5)
M = Inches(1.0)

def bg(slide):
    slide.background.fill.solid()
    slide.background.fill.fore_color.rgb = BG

def txt(s, l, t, w, h, text, sz=Pt(15), c=TEXT, b=False, a=PP_ALIGN.LEFT):
    box = s.shapes.add_textbox(l, t, w, h)
    box.text_frame.word_wrap = True
    p = box.text_frame.paragraphs[0]
    p.alignment = a
    r = p.add_run()
    r.text = text
    r.font.size = sz
    r.font.bold = b
    r.font.color.rgb = c
    r.font.name = "Arial"
    rp = r._r.get_or_add_rPr()
    ea = rp.makeelement(qn('a:ea'), {'typeface': 'Microsoft YaHei'})
    rp.append(ea)
    return box

def title(s, text, t=M):
    return txt(s, M, t, Inches(10), Inches(0.6), text, Pt(30), TEXT, True)

def bullets(s, items, t=Inches(2.0)):
    box = s.shapes.add_textbox(M, t, Inches(10), Inches(len(items)*0.55))
    tf = box.text_frame
    tf.word_wrap = True
    for i, item in enumerate(items):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.space_after = Pt(14)
        p.alignment = PP_ALIGN.LEFT
        r = p.add_run()
        r.text = f"  —  {item}"
        r.font.size = Pt(15)
        r.font.color.rgb = TEXT
        r.font.name = "Arial"
        rp = r._r.get_or_add_rPr()
        ea = rp.makeelement(qn('a:ea'), {'typeface': 'Microsoft YaHei'})
        rp.append(ea)

def big(s, l, t, num, label):
    txt(s, l, t, Inches(3), Inches(0.8), str(num), Pt(48), ACCENT, True)
    txt(s, l, t+Inches(0.9), Inches(3), Inches(0.4), label, Pt(15), SUBTEXT)

def card(s, l, t, w, h, title, body):
    sh = s.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, l, t, w, h)
    sh.fill.solid()
    sh.fill.fore_color.rgb = CARD
    sh.line.fill.background()
    txt(s, l+Inches(0.3), t+Inches(0.2), w-Inches(0.6), Inches(0.4), title, Pt(16), ACCENT, True)
    txt(s, l+Inches(0.3), t+Inches(0.7), w-Inches(0.6), h-Inches(1), body, Pt(14), TEXT)

def footer(s, text):
    txt(s, M, Inches(6.5), Inches(10), Inches(0.4), text, Pt(11), SUBTEXT)

prs = Presentation()
prs.slide_width = W
prs.slide_height = H

# 1 封面
s = prs.slides.add_slide(prs.slide_layouts[6]); bg(s)
txt(s, M, Inches(2.2), Inches(10), Inches(1), "QueryForge", Pt(52), WHITE, True)
txt(s, M, Inches(3.3), Inches(10), Inches(0.6), "让业务团队自助取数，解放数据分析师的重复需求", Pt(20), SUBTEXT)
txt(s, M, Inches(4.2), Inches(10), Inches(0.5), "ClawHunt Builder Camp 2026 · 72 小时构建", Pt(14), SUBTEXT)
footer(s, "queryforge-production-8d6f.up.railway.app")

# 2 痛点
s = prs.slides.add_slide(prs.slide_layouts[6]); bg(s)
title(s, "业务要数据，总要等")
bullets(s, [
    '运营问"华东上个月卖了多少" → 找分析师排队',
    '市场问"哪个品类增长最快" → 排期等报表',
    '老板问"为什么这个月下滑" → 加急再加急',
    '同一个指标，不同部门问 10 遍，改 10 遍',
], Inches(2.0))
txt(s, M, Inches(4.8), Inches(10), Inches(0.5), "数据分析师每周 60% 时间在重复拉数，真正有价值的深度分析被挤占", Pt(14), ACCENT)
footer(s, "痛点：不是没有数据，是数据到不了需要的人手里")

# 3 方案
s = prs.slides.add_slide(prs.slide_layouts[6]); bg(s)
title(s, "分析师定义一次，业务自助使用")
txt(s, M, Inches(1.8), Inches(10), Inches(0.5), "核心机制：分析师把领域知识沉淀为可复用的指标资产", Pt(15), ACCENT)
bullets(s, [
    "分析师定义数据口径和指标（一次性工作）",
    "业务人员用自然语言提问，像和同事说话一样",
    "系统理解意图、匹配指标、查询数据、生成图表",
    "指标可保存、可复用，口径全公司统一",
], Inches(2.5))
footer(s, '从"提需求等三天"到"自己问自己看" · 不是每次重新理解，而是一次定义永久可用')

# 4 产品能力
s = prs.slides.add_slide(prs.slide_layouts[6]); bg(s)
title(s, "从提问到决策，一个流程走完")
card(s, M, Inches(1.8), Inches(5.5), Inches(2.2), "取数 + 可视化",
     '"各地区本月销售额是多少"\n自动生成图表，一键切换维度\n支持柱状图、折线图、饼图、面积图')
card(s, Inches(6.8), Inches(1.8), Inches(5.5), Inches(2.2), "归因 + 建议",
     '"为什么东区下降了" → 自动找原因\n基于数据趋势给出下一步行动\n库存调整、营销策略、成本控制')
card(s, M, Inches(4.3), Inches(5.5), Inches(2.2), "智能纠错",
     "查询出错时自动诊断原因\n修正查询并重试，用户看到完整过程\n不会被错误卡住，不需要手动调试")
card(s, Inches(6.8), Inches(4.3), Inches(5.5), Inches(2.2), "分析师预设指标库",
     "分析师预先定义常用指标\n业务人员一键选择即可查询\n确保全公司使用统一的指标定义")

# 5 真实验证
s = prs.slides.add_slide(prs.slide_layouts[6]); bg(s)
title(s, "在真实数据上验证")
big(s, M, Inches(1.8), "10,000", "订单")
big(s, Inches(4.5), Inches(1.8), "8", "地区")
big(s, Inches(8), Inches(1.8), "20", "品类")
txt(s, M, Inches(3.5), Inches(10), Inches(0.4), "8 个核心经营指标：", Pt(16), ACCENT, True)
bullets(s, [
    "总营收 ¥23,256万 · 客单价 ¥23,256 · 毛利率 46.7% · 复购率 100%",
    "完成率 66.5% · 退款率 16.6% · 连带率 2.5件 · 活跃买家 1,000",
    "支持跨地区、跨品类、跨渠道对比分析",
], Inches(4.0))
footer(s, "真实电商数据验证 · 覆盖订单、商品、用户、地区、品类、渠道全链路")

# 6 双重价值
s = prs.slides.add_slide(prs.slide_layouts[6]); bg(s)
title(s, "一个产品，两方受益")
card(s, M, Inches(1.8), Inches(5.5), Inches(4), "数据分析师",
     "减少 80% 重复取数工作\n专注于指标定义和数据治理\n从"拉数的"变成"定标准的"\n有时间做真正有价值的深度分析")
card(s, Inches(6.8), Inches(1.8), Inches(5.5), Inches(4), "业务团队",
     "随时提问，不用排队等排期\n自己看数据，自己做决策\n从"等报表"到"看数据"\n一个需求从 3 天缩短到 10 秒")
footer(s, "分析师被解放，业务被赋能")

# 7 应用场景
s = prs.slides.add_slide(prs.slide_layouts[6]); bg(s)
title(s, "谁需要这个工具")
card(s, M, Inches(1.8), Inches(5.5), Inches(2), "电商运营",
     "每天看销售、库存、转化，快速调整营销策略和库存计划")
card(s, Inches(6.8), Inches(1.8), Inches(5.5), Inches(2), "市场团队",
     "活动效果、渠道对比、用户画像，实时掌握市场动态")
card(s, M, Inches(4.1), Inches(5.5), Inches(2), "管理层",
     "经营日报、异常预警、决策支持，随时掌握经营全貌")
card(s, Inches(6.8), Inches(4.1), Inches(5.5), Inches(2), "财务分析",
     "收入趋势、成本结构、利润分布，快速生成财务报表")
footer(s, "目标用户：有数据团队但业务侧频繁提需求的中型企业")

# 8 结束
s = prs.slides.add_slide(prs.slide_layouts[6]); bg(s)
txt(s, M, Inches(2.2), Inches(10), Inches(1), "QueryForge", Pt(52), WHITE, True)
txt(s, M, Inches(3.3), Inches(10), Inches(0.8), "让数据分析师做更有价值的事\n让业务团队自己找到答案", Pt(18), SUBTEXT)
txt(s, M, Inches(4.8), Inches(10), Inches(0.4), "queryforge-production-8d6f.up.railway.app", Pt(14), ACCENT)
txt(s, M, Inches(5.3), Inches(10), Inches(0.4), "github.com/eric-stone-plus/queryforge", Pt(12), SUBTEXT)
footer(s, "ClawHunt Builder Camp 2026 · Track A")

prs.save("/Users/ericstone/Downloads/data-agent/assets/QueryForge-Pitch.pptx")
print(f"Done: {len(prs.slides)} slides")
