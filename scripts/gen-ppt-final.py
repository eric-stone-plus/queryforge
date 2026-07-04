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
txt(s, M, Inches(3.3), Inches(10), Inches(0.6), "AI 数据分析智能体 · 让业务团队自助取数", Pt(20), SUBTEXT)
txt(s, M, Inches(4.2), Inches(10), Inches(0.5), "ClawHunt Builder Camp 2026 · 72 小时构建", Pt(14), SUBTEXT)
txt(s, M, Inches(4.8), Inches(10), Inches(0.4), "基于 Olist 真实电商数据（99,441 笔订单）验证", Pt(13), ACCENT)
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

# 5 真实数据验证
s = prs.slides.add_slide(prs.slide_layouts[6]); bg(s)
title(s, "在真实数据上验证 — Olist 巴西电商平台")
big(s, M, Inches(1.8), "99,441", "真实订单")
big(s, Inches(4.5), Inches(1.8), "96,096", "真实用户")
big(s, Inches(8), Inches(1.8), "74", "商品品类")
txt(s, M, Inches(3.5), Inches(10), Inches(0.4), "来自 Kaggle 公开数据集，巴西最大电商平台真实交易数据：", Pt(16), ACCENT, True)
bullets(s, [
    "总营收 R$1,601万 · 客单价 R$161 · 完成率 97% · 复购率 3.1%",
    "覆盖巴西5大地区，2016-2018年完整时间序列",
    "数据包含订单、支付、商品、评价、物流全链路",
], Inches(4.0))
footer(s, "Olist Brazilian E-Commerce Public Dataset · Kaggle 最受欢迎电商数据集之一")

# 6 技术架构 — 三层设计
s = prs.slides.add_slide(prs.slide_layouts[6]); bg(s)
title(s, "三层架构：从 Demo 到企业级产品")
card(s, M, Inches(1.8), Inches(3.7), Inches(4.5), "受控语义层",
     "业务语言 → 指标定义 → SQL\n不靠 LLM 猜表名\n分析师定义一次，全公司复用\n防止口径不一致")
card(s, Inches(4.9), Inches(1.8), Inches(3.7), Inches(4.5), "验证式 Agent 循环",
     "生成 SQL → AST 验证 → 只读执行\n→ 结果分析 → 可视化\n自纠正：出错自动修正重试\nKimi 是推理层，不是权威")
card(s, Inches(8.9), Inches(1.8), Inches(3.7), Inches(4.5), "企业数据平面",
     "Schema-only 模型暴露\n只读数据库连接\nAST 级 SQL 安全校验\n审计日志 + RBAC 路线图")
footer(s, "LLM 不是安全边界 · 策略引擎和执行层才是")

# 7 数据合规
s = prs.slides.add_slide(prs.slide_layouts[6]); bg(s)
title(s, "数据合规设计 — 企业买家最关心的问题")
bullets(s, [
    "Schema-only 模型暴露：LLM 只看到表名和列名，永远不接触原始数据",
    "AST 级 SQL 验证：用 node-sql-parser 解析 SQL 语法树，只允许 SELECT 查询",
    "只读数据库连接：数据库层面配置 readonly 模式，即使代码有漏洞也无法写入",
    "自动 LIMIT 注入：LLM 忘记加 LIMIT 时自动补全，防止全表扫描",
    "生产路线图：行级安全（RLS）、PII 脱敏、审计日志、SSO/SAML",
], Inches(2.0))
txt(s, M, Inches(5.2), Inches(10), Inches(0.5), "同样的架构模式：Snowflake Cortex、Databricks AI/BI 都采用'Schema-only + 只读执行'方案", Pt(13), ACCENT)
footer(s, "QueryForge 不给 LLM 数据库权限 · AI 生成 SQL，数据库执行查询，策略引擎控制访问")

# 8 生产路径
s = prs.slides.add_slide(prs.slide_layouts[6]); bg(s)
title(s, "从 Hackathon 到产品的路径")
card(s, M, Inches(1.8), Inches(5.5), Inches(2), "Phase 1: 可售 MVP（1-2周）",
     "SQLite → PostgreSQL 迁移\nNextAuth.js 用户认证\n语义层：指标定义 + Join 图\n审计日志 + 基础 RBAC")
card(s, Inches(6.8), Inches(1.8), Inches(5.5), Inches(2), "Phase 2: 企业试用（1-2月）",
     "SSO/SAML 集成\n行级安全 + PII 脱敏\n多数据源：PostgreSQL/BigQuery\n查询成本控制 + 取消机制")
card(s, M, Inches(4.1), Inches(5.5), Inches(2), "Phase 3: 规模化（3-6月）",
     "Snowflake/Redshift/ClickHouse\ndbt 语义层集成\n指标认证 + 谱系追踪\nVPC 部署 + BYOM")
card(s, Inches(6.8), Inches(4.1), Inches(5.5), Inches(2), "核心指标",
     "每查询成本 ~$0.003（Kimi K2.7）\n单次查询延迟 2-5 秒\n从 Demo 到 MVP：1 周\n从 MVP 到企业版：3 个月")

# 9 双重价值
s = prs.slides.add_slide(prs.slide_layouts[6]); bg(s)
title(s, "一个产品，两方受益")
card(s, M, Inches(1.8), Inches(5.5), Inches(4), "数据分析师",
     "减少 80% 重复取数工作\n专注于指标定义和数据治理\n从\"拉数的\"变成\"定标准的\"\n有时间做真正有价值的深度分析")
card(s, Inches(6.8), Inches(1.8), Inches(5.5), Inches(4), "业务团队",
     "随时提问，不用排队等排期\n自己看数据，自己做决策\n从\"等报表\"到\"看数据\"\n一个需求从 3 天缩短到 10 秒")
footer(s, "分析师被解放，业务被赋能")

# 10 结束
s = prs.slides.add_slide(prs.slide_layouts[6]); bg(s)
txt(s, M, Inches(2.2), Inches(10), Inches(1), "QueryForge", Pt(52), WHITE, True)
txt(s, M, Inches(3.3), Inches(10), Inches(0.8), "受控的对话式分析层\n不是让 AI 替代分析师，而是让分析师的能力通过 AI 放大 10 倍", Pt(18), SUBTEXT)
txt(s, M, Inches(4.8), Inches(10), Inches(0.4), "queryforge-production-8d6f.up.railway.app", Pt(14), ACCENT)
txt(s, M, Inches(5.3), Inches(10), Inches(0.4), "github.com/eric-stone-plus/queryforge", Pt(12), SUBTEXT)
footer(s, "ClawHunt Builder Camp 2026 · Track A")

prs.save("/Users/ericstone/Downloads/data-agent/assets/QueryForge-Pitch.pptx")
print(f"Done: {len(prs.slides)} slides")
