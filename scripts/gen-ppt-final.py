import os

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
txt(s, M, Inches(3.3), Inches(10), Inches(0.6), "受治理的自助式商业分析层", Pt(20), SUBTEXT)
txt(s, M, Inches(4.2), Inches(10), Inches(0.5), "ClawHunt Builder Camp 2026 · Track C: Business on AI", Pt(14), SUBTEXT)
txt(s, M, Inches(4.8), Inches(10), Inches(0.4), "通用商业分析工具 · Olist 作为本次 demo case", Pt(13), ACCENT)
footer(s, "queryforge-production-8d6f.up.railway.app")

# 2 痛点
s = prs.slides.add_slide(prs.slide_layouts[6]); bg(s)
title(s, "业务问题越来越快，报表流程仍然很慢")
bullets(s, [
    '运营问"Sudeste 的 Black Friday 峰值能否复用" → 等排期',
    '市场问"哪类商品拉动新客" → 临时取数',
    '老板问"本月下滑是区域、品类还是支付问题" → 加急',
    '同一指标在不同团队反复解释，口径容易漂移',
], Inches(2.0))
txt(s, M, Inches(4.8), Inches(10), Inches(0.5), "现代 BI 的核心不是更多图表，而是让决策问题及时进入可信数据流程", Pt(14), ACCENT)
footer(s, "痛点：业务侧需要速度，数据侧必须保留口径、权限和审计边界")

# 3 方案
s = prs.slides.add_slide(prs.slide_layouts[6]); bg(s)
title(s, "把分析师经验做成可复用语义层")
txt(s, M, Inches(1.8), Inches(10), Inches(0.5), "Managed self-service BI：核心口径受控，业务侧灵活追问", Pt(15), ACCENT)
bullets(s, [
    "分析师维护指标口径、Join 关系和查询边界",
    "业务人员用自然语言发起问题，不需要写 SQL",
    "系统匹配语义层、执行查询、返回图表和解释",
    "同一指标被复用，减少口径漂移和重复沟通",
], Inches(2.5))
footer(s, "从临时报表交付，变成受治理的自助式分析")

# 4 产品能力
s = prs.slides.add_slide(prs.slide_layouts[6]); bg(s)
title(s, "从静态报表到追问式分析")
card(s, M, Inches(1.8), Inches(5.5), Inches(2.2), "描述发生了什么",
     '"各地区本月营收是多少"\n生成图表和明细\n按区域、品类、支付方式切换')
card(s, Inches(6.8), Inches(1.8), Inches(5.5), Inches(2.2), "解释为什么变化",
     '"为什么 Sudeste 冲高后回落"\n比较时间、地区、品类、支付\n输出可验证的业务假设')
card(s, M, Inches(4.3), Inches(5.5), Inches(2.2), "验证查询可靠性",
     "SQL 先过 AST 安全校验\n只读执行，失败自动修正\n让错误暴露在流程里")
card(s, Inches(6.8), Inches(4.3), Inches(5.5), Inches(2.2), "沉淀指标资产",
     "常用问题变成指标库\n业务复用同一语义层\n形成 single version of truth")

# 5 真实数据验证
s = prs.slides.add_slide(prs.slide_layouts[6]); bg(s)
title(s, "Demo case：Olist 巴西电商真实数据")
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
title(s, "Agent 的位置：把业务问题变成可治理查询")
card(s, M, Inches(1.8), Inches(3.7), Inches(4.5), "统一语义层",
     "业务语言 → 指标定义 → SQL\n不靠 LLM 临时猜表名\n分析师定义一次，全公司复用\n避免每次重新解释口径")
card(s, Inches(4.9), Inches(1.8), Inches(3.7), Inches(4.5), "验证式 Agent 循环",
     "理解问题 → 生成 SQL → AST 验证\n只读执行 → 读结果 → 可视化\n自纠正：出错自动修正重试\n把取数变成可交互分析")
card(s, Inches(8.9), Inches(1.8), Inches(3.7), Inches(4.5), "执行与治理边界",
     "Schema-only 模型暴露\n只读数据库连接\nAST 级 SQL 安全校验\n审计日志 + RBAC 路线图")
footer(s, "必要性：业务问题需要解释、验证和追问；单纯 SQL 生成无法承担治理责任")

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
title(s, "商业化路径：受治理的自助分析")
card(s, M, Inches(1.8), Inches(5.5), Inches(2), "Phase 1: 可售 MVP（1-2周）",
     "SQLite → PostgreSQL 迁移\nNextAuth.js 用户认证\n语义层：指标定义 + Join 图\n审计日志 + 基础 RBAC")
card(s, Inches(6.8), Inches(1.8), Inches(5.5), Inches(2), "Phase 2: 企业试用（1-2月）",
     "SSO/SAML 集成\n行级安全 + PII 脱敏\n多数据源：PostgreSQL/BigQuery\n查询成本控制 + 取消机制")
card(s, M, Inches(4.1), Inches(5.5), Inches(2), "Phase 3: 规模化（3-6月）",
     "Snowflake/Redshift/ClickHouse\ndbt 语义层集成\n指标认证 + 谱系追踪\nVPC 部署 + BYOM")
card(s, Inches(6.8), Inches(4.1), Inches(5.5), Inches(2), "商业模型",
     "目标客户：数据团队、运营、市场\n付费点：席位、查询量、私有部署\n价值指标：请求周转时间、口径复用率\n从 MVP 到企业版：3 个月")

# 9 双重价值
s = prs.slides.add_slide(prs.slide_layouts[6]); bg(s)
title(s, "商业价值：自助速度 + 治理可信")
card(s, M, Inches(1.8), Inches(5.5), Inches(4), "数据团队",
     "减少重复取数和口径解释\n把精力放在语义层与治理\n统一指标资产，降低审计成本\n保留权限、血缘和执行边界")
card(s, Inches(6.8), Inches(1.8), Inches(5.5), Inches(4), "业务团队",
     "不用排队等临时报表\n围绕同一数据连续追问\n在销售、投放、品类上更快试错\n从看结果转向做决策")
footer(s, "不是替代分析师，而是把分析师定义的标准放进业务日常决策")

# 10 结束
s = prs.slides.add_slide(prs.slide_layouts[6]); bg(s)
txt(s, M, Inches(2.2), Inches(10), Inches(1), "QueryForge", Pt(52), WHITE, True)
txt(s, M, Inches(3.3), Inches(8.4), Inches(0.8), "受治理的自助式商业分析层\n核心口径由分析师定义，业务问题由 Agent 转成可信查询", Pt(18), SUBTEXT)
txt(s, M, Inches(4.8), Inches(8.2), Inches(0.4), "queryforge-production-8d6f.up.railway.app", Pt(14), ACCENT)
txt(s, M, Inches(5.3), Inches(8.2), Inches(0.4), "github.com/eric-stone-plus/QueryForge", Pt(12), SUBTEXT)
qr_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "assets", "qr-railway.png")
s.shapes.add_picture(qr_path, Inches(10.25), Inches(3.35), width=Inches(1.65), height=Inches(1.65))
txt(s, Inches(10.1), Inches(5.12), Inches(1.95), Inches(0.35), "手机扫码体验", Pt(11), SUBTEXT, a=PP_ALIGN.CENTER)
footer(s, "ClawHunt Builder Camp 2026 · Track C: Business on AI")

prs.save(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "assets", "QueryForge-Pitch.pptx"))
print(f"Done: {len(prs.slides)} slides")
