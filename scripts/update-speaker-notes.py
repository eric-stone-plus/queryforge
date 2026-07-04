from zipfile import ZipFile, ZIP_DEFLATED
from xml.etree import ElementTree as ET
import shutil
import tempfile
from pathlib import Path

DOCX = Path("assets/speaker-notes.docx")
NS = {"w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main"}

NEW_PARAS = [
    "QueryForge 路演讲稿（双人版）",
    "分工：Mavis 负责商业叙事，Eric 负责开发与技术可信度。5 分钟演示 + 3 分钟 Q&A，可按现场时间删减。",
    "Mavis｜商业叙述（约 2 分钟）",
    "大家好，我们做的是 QueryForge，一个让电商经营者获得专业数据分析能力的本地分析工具。它不是企业 BI，也不是再做一张漂亮看板，而是给跨境电商小团队、平台卖家、外贸 SOHO 和广交会参展商一个能直接追问经营数据的工作台。",
    "这个场景很具体：很多小团队有订单导出、商品表、渠道数据和地区数据，但没有专职分析师。老板想知道哪个地区值得投放、哪些品类适合组合推荐、复购用户下一步可能买什么，通常只能靠表格、经验和临时报表。QueryForge 把这些问题变成可以执行、可以复盘的查询和建议。",
    "今天使用的是公开真实数据。我们接入 Kaggle 上的 Olist Brazilian E-Commerce Public Dataset，约 10 万笔巴西电商订单，包含订单状态、价格、支付、客户位置、商品属性和评价。巴西案例和跨境电商场景是匹配的：区域、品类、支付方式、复购和客单价都能形成真实经营问题。",
    "商业上，我们不把它讲成按年或按席位采购的软件。更现实的路径是个人开发者推出一款实用小工具：macOS 本地应用一次买断，用户自带模型供应商的 API key/token。建议首发价格带是 128 到 168 元，用广交会地推、卖家微信群、培训社群和服务商渠道验证冲动购买和真实转化。",
    "Eric｜开发阐述（约 2 分钟）",
    "我讲技术实现。QueryForge 的关键不是把 SQL 生成外包给模型，而是做一层本地 harness：模型在受控边界内工作，数据库和凭据留在本机。",
    "第一层是本地数据平面。桌面版自带 SQLite demo 数据，也可以扩展到用户自己的结构化经营数据。Settings 下拉菜单可以自助填写 OpenAI-compatible endpoint、model、API key/token 和月度 token 预算；这些配置保存在本机应用支持目录，不进入 GitHub，也不放到 Railway。",
    "第二层是 Agent 循环。用户用中文提问，系统把问题、schema 和上下文交给外部模型生成候选 SQL；再用 AST 做只读校验，只允许单条 SELECT，限制敏感字段和通配查询，并自动补 LIMIT；执行结果回填给模型生成图表配置和经营解释。",
    "第三层是演示边界。Railway 线上页面保留为手机扫码 demo，使用 Olist 和稳定预设答案，方便评委手机查看。真实产品路径是 macOS 桌面端：本机凭据、本地 token plan、真实 provider API 调用、SQL 执行和结果 grounding 都在本机完成。",
    "为什么这里必须引入 Agent？因为经营分析不是一次 SQL 翻译。用户会追问原因、比较地区、拆品类、问下一步动作。QueryForge 把模型能力放进一个可检查流程：理解问题、生成 SQL、验证、执行、解释、保存指标，并把每次调用计入 token 预算。",
    "Mavis｜收束（约 40 秒）",
    "所以 QueryForge 的定位是：让没有专职分析师的小微电商团队，也能围绕自己的订单和商品数据做专业经营分析。它不卖模型能力，而是卖一个把模型、数据库和经营问题连接起来的本地工作台。",
    "从 hackathon 到可售产品，第一步是把 macOS 桌面端打磨到稳定可用：Settings 配置、数据导入、只读查询、图表和问答体验；第二步做 App Store 或网站买断分发；第三步再根据真实用户反馈补 CSV/Excel 导入、更多平台模板和轻量报表导出。",
    "演示流程",
    "打开页面，先让评委看到 KPI：99,441 订单、R$1,601 万营收、96,096 用户、74 品类。",
    "点击「哪个地区最值得优先投放？」或「哪些品类适合做组合推荐？」，展示图表、SQL 和分析报告。",
    "再点「复购用户的品类跨越路径」，强调它不是静态看板，而是经营问题驱动的查询。",
    "如果演示桌面端，打开 Settings 下拉菜单，说明 endpoint、model、API key/token 和 token budget 都由用户本机填写。",
    "如果现场网络或 provider 不稳定，Railway 扫码页只作为公开 demo，直接使用预设问题保持演示流畅。",
    "Q&A 预案",
    "Q: 和普通 BI 看板有什么区别？ A: 看板回答固定问题；QueryForge 支持围绕经营问题连续追问，并把问题落到 SQL、图表和结果解释上。",
    "Q: 和直接问大模型有什么区别？ A: 大模型默认没有数据库执行权、指标口径和查询记录。QueryForge 把模型放进本地 harness，让它看 schema、生成只读 SQL、执行查询，并基于真实结果回答。",
    "Q: 数据真实吗？ A: 是 Kaggle Olist 公开电商数据集，约 10 万笔真实匿名商业订单。它是 demo case，不限制产品只能做巴西或电商数据。",
    "Q: 大模型幻觉怎么办？ A: 不让模型成为权威。它生成候选 SQL，系统用 schema、AST 只读校验、数据库执行结果和二次解释约束它。",
    "Q: 怎么商业化？ A: 更现实的是一次性买断小工具，首发价格带 128 到 168 元。目标用户是跨境电商小团队、平台卖家、外贸 SOHO 和广交会参展商，模型 token 由用户自己的 provider key 承担。",
    "措辞参考：Kaggle/Olist 数据集说明；Gartner Data & Analytics；Tableau modern BI；IBM self-service analytics；Dun & Bradstreet trusted business data；公开报道中的广交会跨境电商展区和中小微卖家生态。",
]


def set_para_text(paragraph, text):
    runs = paragraph.findall("w:r", NS)
    if runs:
        first = runs[0]
        for child in list(first):
            if child.tag.endswith("}t"):
                first.remove(child)
        t = ET.SubElement(first, f"{{{NS['w']}}}t")
        t.text = text
        for extra in runs[1:]:
            paragraph.remove(extra)
    else:
        run = ET.SubElement(paragraph, f"{{{NS['w']}}}r")
        t = ET.SubElement(run, f"{{{NS['w']}}}t")
        t.text = text


def main():
    with ZipFile(DOCX, "r") as zin:
        xml = zin.read("word/document.xml")
        root = ET.fromstring(xml)
        body = root.find("w:body", NS)
        paras = [p for p in body.findall("w:p", NS)]

        section = None
        if paras and paras[-1].find("w:sectPr", NS) is not None:
            section = paras[-1].find("w:sectPr", NS)

        # Reuse paragraph styling from the original where possible.
        while len(paras) < len(NEW_PARAS):
            clone = ET.fromstring(ET.tostring(paras[-2 if section is not None and len(paras) > 1 else -1]))
            body.insert(len(body) - (1 if section is not None else 0), clone)
            paras.append(clone)

        for idx, text in enumerate(NEW_PARAS):
            set_para_text(paras[idx], text)

        for extra in paras[len(NEW_PARAS):]:
            body.remove(extra)

        data = ET.tostring(root, encoding="utf-8", xml_declaration=True)

        tmp = Path(tempfile.mkstemp(suffix=".docx")[1])
        with ZipFile(tmp, "w", ZIP_DEFLATED) as zout:
            for item in zin.infolist():
                content = zin.read(item.filename)
                if item.filename == "word/document.xml":
                    content = data
                zout.writestr(item, content)

    shutil.move(tmp, DOCX)


if __name__ == "__main__":
    main()
