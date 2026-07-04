from pptx import Presentation
from pptx.util import Inches, Pt, Emu
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE

prs = Presentation()
prs.slide_width = Inches(13.333)
prs.slide_height = Inches(7.5)

BG = RGBColor(0x08, 0x0d, 0x16)
CARD = RGBColor(0x13, 0x19, 0x22)
BLUE = RGBColor(0x4a, 0xa3, 0xff)
GREEN = RGBColor(0x19, 0xd3, 0xc5)
WHITE = RGBColor(0xff, 0xff, 0xff)
GRAY = RGBColor(0x8b, 0x94, 0x9e)
YELLOW = RGBColor(0xf7, 0xd7, 0x4d)

def set_bg(slide):
    bg = slide.background
    fill = bg.fill
    fill.solid()
    fill.fore_color.rgb = BG

def add_text(slide, left, top, width, height, text, size=18, color=WHITE, bold=False, align=PP_ALIGN.LEFT):
    txBox = slide.shapes.add_textbox(Inches(left), Inches(top), Inches(width), Inches(height))
    tf = txBox.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = text
    p.font.size = Pt(size)
    p.font.color.rgb = color
    p.font.bold = bold
    p.alignment = align
    return txBox

def add_card(slide, left, top, width, height):
    shape = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(left), Inches(top), Inches(width), Inches(height))
    shape.fill.solid()
    shape.fill.fore_color.rgb = CARD
    shape.line.fill.background()
    return shape

# Slide 1: Title
slide = prs.slides.add_slide(prs.slide_layouts[6])
set_bg(slide)
add_text(slide, 1, 1.5, 11, 1.5, "QueryForge", 54, BLUE, True, PP_ALIGN.CENTER)
add_text(slide, 1, 3.2, 11, 1, "AI 商业数据分析智能体", 28, WHITE, False, PP_ALIGN.CENTER)
add_text(slide, 1, 4.5, 11, 0.8, "自然语言提问 → AI 生成 SQL → 实时可视化", 18, GRAY, False, PP_ALIGN.CENTER)
add_text(slide, 1, 5.8, 11, 0.6, "ClawHunt Builder Camp 2026 · Track A: Agents at Work", 14, GRAY, False, PP_ALIGN.CENTER)

# Slide 2: Problem
slide = prs.slides.add_slide(prs.slide_layouts[6])
set_bg(slide)
add_text(slide, 0.8, 0.5, 11, 0.8, "痛点：数据分析的鸿沟", 36, WHITE, True)
add_card(slide, 0.8, 1.8, 5.5, 2)
add_text(slide, 1.2, 2.0, 4.8, 1.5, "业务人员的困境\n\n• 不会 SQL，依赖数据团队排队\n• Excel 手动分析耗时数小时\n• 临时汇报需求无法快速响应\n• 数据散落，缺乏统一视图", 16, WHITE)
add_card(slide, 7, 1.8, 5.5, 2)
add_text(slide, 7.4, 2.0, 4.8, 1.5, "现有工具的不足\n\n• BI 工具太重，学习成本高\n• 传统报表不支持自然语言\n• 关键词匹配 ≠ 真正的 AI\n• 单点故障，无容错机制", 16, WHITE)
add_text(slide, 0.8, 4.5, 11.5, 1, "QueryForge 的回答：让 AI 理解你的问题，自动生成查询，实时返回可视化结果。", 20, GREEN, True, PP_ALIGN.CENTER)

# Slide 3: How it works
slide = prs.slides.add_slide(prs.slide_layouts[6])
set_bg(slide)
add_text(slide, 0.8, 0.5, 11, 0.8, "工作原理", 36, WHITE, True)

steps = [
    ("1. 自然语言提问", "用户用中文描述需求\n\"最近三个月哪个品类增长最快？\""),
    ("2. AI 理解意图", "MiMo v2.5 Pro 分析问题\n识别维度、指标、时间范围"),
    ("3. 生成 SQL", "AI 自动生成 SQLite 查询\nAST 解析器校验安全性"),
    ("4. 执行 + 可视化", "查询数据库，生成图表\n支持柱状/折线/饼图/面积图"),
    ("5. 自纠正", "SQL 报错时自动修正\n向用户展示修正过程"),
]
for i, (title, desc) in enumerate(steps):
    x = 0.5 + i * 2.5
    add_card(slide, x, 1.8, 2.2, 3)
    add_text(slide, x + 0.2, 2.0, 1.8, 0.5, title, 14, BLUE, True, PP_ALIGN.CENTER)
    add_text(slide, x + 0.2, 2.7, 1.8, 1.8, desc, 12, GRAY, False, PP_ALIGN.CENTER)

add_text(slide, 0.8, 5.5, 11.5, 1, "关键技术：Vercel AI SDK + better-sqlite3 + node-sql-parser + Recharts", 14, GRAY, False, PP_ALIGN.CENTER)

# Slide 4: Demo
slide = prs.slides.add_slide(prs.slide_layouts[6])
set_bg(slide)
add_text(slide, 0.8, 0.5, 11, 0.8, "现场演示", 36, WHITE, True)
add_card(slide, 0.8, 1.8, 11.5, 4.5)
add_text(slide, 1.2, 2.0, 10.5, 4, "演示流程（3 分钟）\n\n① 点击预设查询 → 展示 AI 生成 SQL + 图表（30秒）\n② 自由提问 → \"最近三个月哪个品类增长最快\"（45秒）\n③ 保存指标 → 侧边栏复用 → 仪表盘多图联动（30秒）\n④ 商业数据透视 → 8 个 KPI 指标卡 + 6 个图表面板（30秒）\n⑤ 自纠正演示 → 故意触发 SQL 错误，展示自动修正（30秒）\n\n核心亮点：每一个查询都是 AI 实时推理，不是预设模板", 16, WHITE)

add_text(slide, 0.8, 6.5, 11.5, 0.6, "产品地址：queryforge-production-8d6f.up.railway.app", 14, BLUE, False, PP_ALIGN.CENTER)

# Slide 5: Business Dashboard
slide = prs.slides.add_slide(prs.slide_layouts[6])
set_bg(slide)
add_text(slide, 0.8, 0.5, 11, 0.8, "商业数据透视面板", 36, WHITE, True)

metrics = [
    ("总营收", "¥23,256万", "30个月累计"),
    ("客单价", "¥23,256", "平均每单"),
    ("毛利率", "46.7%", "全品类均值"),
    ("复购率", "100%", "人均10单"),
    ("完成率", "66.5%", "6,650单完成"),
    ("退款率", "16.6%", "1,664单退款"),
    ("连带率", "2.5件", "每单平均"),
    ("活跃买家", "1,000", "覆盖20品类"),
]
for i, (label, value, sub) in enumerate(metrics):
    row = i // 4
    col = i % 4
    x = 0.8 + col * 3.1
    y = 1.8 + row * 1.8
    add_card(slide, x, y, 2.8, 1.5)
    add_text(slide, x + 0.2, y + 0.15, 2.4, 0.4, label, 12, GRAY, False, PP_ALIGN.LEFT)
    add_text(slide, x + 0.2, y + 0.55, 2.4, 0.5, value, 24, BLUE, True, PP_ALIGN.LEFT)
    add_text(slide, x + 0.2, y + 1.1, 2.4, 0.3, sub, 10, GRAY, False, PP_ALIGN.LEFT)

add_text(slide, 0.8, 5.8, 11.5, 1, "全部数据来自真实 SQLite 数据库（10,000 订单 · 500 商品 · 1,000 用户 · 8 地区 · 20 品类）", 14, GRAY, False, PP_ALIGN.CENTER)

# Slide 6: Multi-Agent Audit
slide = prs.slides.add_slide(prs.slide_layouts[6])
set_bg(slide)
add_text(slide, 0.8, 0.5, 11, 0.8, "五方对抗审查体系（QUINTE）", 36, WHITE, True)
add_card(slide, 0.8, 1.8, 5.5, 4.5)
add_text(slide, 1.2, 2.0, 4.8, 4, "审查流程\n\nR1 独立分析\n5 个 AI 智能体各自独立审查\n互不通信，避免群体思维\n\nR2 交叉审查\n5 个智能体匿名审查其他 4 个\n标记共识、分歧和盲区\n\nR3 双路裁决\n人类 + 独立审计方共同裁决\n产出残差闭环账本", 14, WHITE)
add_card(slide, 7, 1.8, 5.5, 4.5)
add_text(slide, 7.4, 2.0, 4.8, 4, "实际成果\n\n3 轮审查 × 5 方 = 39 份独立报告\n\n发现 5 个 P0 级缺陷并修复\n• MetricSidebar 保存流程断裂\n• LLM 无超时机制\n• 无离线 fallback\n• 图表标题共享 bug\n• DB 连接不一致\n\n成本：约 ¥5（小米 MiMo token plan）\n对比人工 Code Review：¥5,000", 14, WHITE)

# Slide 7: Tech Stack
slide = prs.slides.add_slide(prs.slide_layouts[6])
set_bg(slide)
add_text(slide, 0.8, 0.5, 11, 0.8, "技术架构", 36, WHITE, True)

tech_items = [
    ("前端", "Next.js 14 · Tailwind CSS · Recharts\n响应式设计 · 深色/浅色主题变量"),
    ("后端", "Next.js API Routes · better-sqlite3\nSQL AST 解析安全校验 · 自动 LIMIT"),
    ("AI 引擎", "MiMo v2.5 Pro（小米自研）\nVercel AI SDK · 自纠正循环"),
    ("部署", "Railway（云端 24/7 在线）\n不依赖本机 · 自定义域名"),
    ("审查", "QUINTE 五方对抗协议\n5 CLI 智能体 × 3 轮 = 39 份报告"),
    ("数据", "10K 订单 · 500 商品 · 1K 用户\n8 地区 · 20 品类 · 6 渠道"),
]
for i, (title, desc) in enumerate(tech_items):
    row = i // 3
    col = i % 3
    x = 0.8 + col * 4.1
    y = 1.8 + row * 2.5
    add_card(slide, x, y, 3.8, 2)
    add_text(slide, x + 0.3, y + 0.2, 3.2, 0.4, title, 16, BLUE, True)
    add_text(slide, x + 0.3, y + 0.7, 3.2, 1.2, desc, 13, GRAY)

# Slide 8: Score Projection
slide = prs.slides.add_slide(prs.slide_layouts[6])
set_bg(slide)
add_text(slide, 0.8, 0.5, 11, 0.8, "评分预估", 36, WHITE, True)

scores = [
    ("Demo 现场可用", "25", "20-22", "公网部署 + 缓存 fallback + 自纠正"),
    ("用户价值/PMF", "20", "16-18", "真实痛点 + 自然语言接口"),
    ("技术实现", "20", "16-18", "AI SDK + AST 校验 + 对抗审查"),
    ("创新性", "15", "11-13", "自纠正循环 + QUINTE 方法论"),
    ("商业潜力", "10", "7-8", "SaaS 模式 + 真实数据 demo"),
    ("路演表达", "10", "8-9", "故事线 + 排练"),
    ("加分", "+5", "+3", "ClawHunt 上架"),
]

add_card(slide, 0.8, 1.6, 11.5, 0.6)
add_text(slide, 1.0, 1.65, 3.5, 0.5, "维度", 14, GRAY, True)
add_text(slide, 4.5, 1.65, 1.5, 0.5, "满分", 14, GRAY, True, PP_ALIGN.CENTER)
add_text(slide, 6.5, 1.65, 2, 0.5, "预估", 14, GRAY, True, PP_ALIGN.CENTER)
add_text(slide, 8.5, 1.65, 4, 0.5, "依据", 14, GRAY, True)

for i, (dim, max_score, est, reason) in enumerate(scores):
    y = 2.4 + i * 0.6
    if i % 2 == 0:
        add_card(slide, 0.8, y - 0.05, 11.5, 0.55)
    add_text(slide, 1.0, y, 3.5, 0.4, dim, 13, WHITE)
    add_text(slide, 4.5, y, 1.5, 0.4, max_score, 13, GRAY, False, PP_ALIGN.CENTER)
    add_text(slide, 6.5, y, 2, 0.4, est, 13, GREEN, True, PP_ALIGN.CENTER)
    add_text(slide, 8.5, y, 4, 0.4, reason, 12, GRAY)

add_text(slide, 0.8, 6.5, 11.5, 0.6, "总预估：87-96/105 + 3 加分 = 90-99/105", 22, YELLOW, True, PP_ALIGN.CENTER)

# Slide 9: Business
slide = prs.slides.add_slide(prs.slide_layouts[6])
set_bg(slide)
add_text(slide, 0.8, 0.5, 11, 0.8, "商业潜力", 36, WHITE, True)
add_card(slide, 0.8, 1.8, 5.5, 4.5)
add_text(slide, 1.2, 2.0, 4.8, 4, "市场规模\n\n• 中国 BI 市场规模：¥200亿+（2025）\n• 中小企业数据分析渗透率 < 15%\n• 自然语言 BI 是下一代趋势\n\n目标用户\n• 运营/销售管理者（不会 SQL）\n• 数据分析师（加速探索）\n• 中小企业老板（快速决策）", 15, WHITE)
add_card(slide, 7, 1.8, 5.5, 4.5)
add_text(slide, 7.4, 2.0, 4.8, 4, "商业模式\n\n• SaaS 订阅制\n  - 免费版：5 次/天查询\n  - Pro 版：¥99/月，无限查询\n  - 企业版：¥999/月，私有部署\n\n竞争优势\n• 真正的 AI（非关键词匹配）\n• 自纠正保证查询成功率\n• 五方审查保证代码质量\n• 成本极低（MiMo token plan）", 15, WHITE)

# Slide 10: End
slide = prs.slides.add_slide(prs.slide_layouts[6])
set_bg(slide)
add_text(slide, 1, 2, 11, 1.5, "QueryForge", 54, BLUE, True, PP_ALIGN.CENTER)
add_text(slide, 1, 3.5, 11, 1, "让每个人都能用数据说话", 28, WHITE, False, PP_ALIGN.CENTER)
add_text(slide, 1, 5, 11, 0.6, "queryforge-production-8d6f.up.railway.app", 18, BLUE, False, PP_ALIGN.CENTER)
add_text(slide, 1, 5.8, 11, 0.6, "github.com/eric-stone-plus/queryforge", 14, GRAY, False, PP_ALIGN.CENTER)

out = "/Users/ericstone/Downloads/data-agent/QueryForge-Pitch.pptx"
prs.save(out)
print(f"PPT saved: {out}")
