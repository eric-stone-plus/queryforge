from zipfile import ZipFile, ZIP_DEFLATED
from xml.etree import ElementTree as ET
import shutil
import tempfile
from pathlib import Path

DOCX = Path("assets/speaker-notes.docx")
NS = {"w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main"}
W = NS["w"]

NEW_PARAS = [
    "QueryForge 路演讲稿（双人版）",
    "分工：Mavis 负责商业叙事，Eric 负责开发与技术可信度。主讲稿控制在 3 分钟内，Q&A 只使用备用短答。",
    "Mavis｜0:00-1:05 商业场景",
    "大家好，我们做的是 QueryForge，一个面向小微电商经营者的本地优先分析工具包。今天展示的是第一个工具：订单与经营分析 workbench。目标用户不是大企业 BI 团队，而是跨境卖家、外贸 SOHO、广交会参展商，以及几个人规模的 Amazon、独立站和平台卖家。他们有订单、商品、渠道、地区数据，却没有专职分析师；想问哪个市场值得投放、哪些品类能组合销售、复购用户下一步可能买什么，通常只能靠 Excel 和经验。QueryForge 把这些经营问题直接变成 SQL、图表和建议。今天用 Kaggle/Olist 巴西真实电商数据做 demo，因为它有 99,441 笔订单、5 个地区和 74 个品类，足够模拟真实跨境电商分析场景。",
    "Eric｜1:05-2:15 技术实现",
    "技术上，QueryForge 不是把问题丢给模型聊天，而是在本地做一层 harness。数据、API key 和 token 预算留在用户机器；模型服务由用户自己配置，可以接 DeepSeek、Kimi、OpenAI、Anthropic 或其他常见 provider。系统把问题、schema 和上下文交给模型生成候选 SQL，再用 AST 做只读校验，只允许 SELECT；执行后把真实结果回填给模型生成解释。这样回答有数据库依据，也能连续追问。Railway 扫码页只是手机公开 demo；真正产品路径是本地桌面应用。当前因为开发设备是 Mac，所以用 macOS 包展示，但产品不绑定 Mac，后续可以提供 Windows 和 macOS 预编译二进制包。",
    "Mavis｜2:15-3:00 商业收束",
    "商业路径也按小微企业购买习惯设计。QueryForge 不卖模型 token，也不走重型按席位 SaaS；它更像一个闭源软件服务包，可以在官网、渠道、卖家社群、培训课或广交会地推里销售预编译软件，由用户自带模型 key，成本边界清楚。第一个工具先解决经营分析，后续扩展数据导入、平台模板和报表导出。它和直接问大模型的差异在于：能连接本机数据、执行查询、复盘指标口径，并控制调用成本。接下来演示三件事：看 KPI，点预设经营问题，再在本地 Settings 配置 provider key 后自然追问。",
    "演示流程",
    "1. 先展示 KPI：99,441 订单、R$1,601 万营收、96,096 用户、74 品类、5 地区。",
    "2. 点击「哪个地区最值得优先投放？」或「哪些品类适合做组合推荐？」展示 SQL、图表和建议。",
    "3. 展示 Settings：用户本机选择 provider、填写 API key/token；URL、model 和预算在高级设置。",
    "4. 如果现场网络不稳，Railway 扫码页使用预设问题保证路演不断。",
    "备用短答",
    "和直接问大模型的区别：QueryForge 有本机数据执行链路、只读 SQL 校验、结果 grounding 和 token 预算。",
    "数据合规：典型用户分析自己的订单和商品数据；如果包含个人信息或平台限制字段，仍由使用者确认授权。",
    "商业化：闭源预编译软件包 + 官网/渠道/社群销售，模型 token 由用户自己的 provider key 承担。",
    "平台范围：当前是 macOS demo，不写死平台；产品可以扩展到 Windows/macOS 桌面包。",
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


def child(parent, tag):
    found = parent.find(f"w:{tag}", NS)
    if found is None:
        found = ET.SubElement(parent, f"{{{W}}}{tag}")
    return found


def set_attr(el, name, value):
    el.set(f"{{{W}}}{name}", value)


def clear_direct_format(paragraph):
    p_pr = paragraph.find("w:pPr", NS)
    if p_pr is not None:
        p_style = p_pr.find("w:pStyle", NS)
        if p_style is not None:
            p_pr.remove(p_style)
    for run in paragraph.findall("w:r", NS):
        r_pr = run.find("w:rPr", NS)
        if r_pr is not None:
            run.remove(r_pr)


def apply_para_style(paragraph, idx):
    clear_direct_format(paragraph)
    p_pr = child(paragraph, "pPr")
    spacing = child(p_pr, "spacing")
    set_attr(spacing, "before", "80")
    set_attr(spacing, "after", "100")
    set_attr(spacing, "line", "312")
    set_attr(spacing, "lineRule", "auto")

    run = paragraph.find("w:r", NS)
    if run is None:
        run = ET.SubElement(paragraph, f"{{{W}}}r")
    r_pr = ET.Element(f"{{{W}}}rPr")
    run.insert(0, r_pr)
    font = ET.SubElement(r_pr, f"{{{W}}}rFonts")
    set_attr(font, "ascii", "Arial")
    set_attr(font, "hAnsi", "Arial")
    set_attr(font, "eastAsia", "Microsoft YaHei")
    size = ET.SubElement(r_pr, f"{{{W}}}sz")
    color = ET.SubElement(r_pr, f"{{{W}}}color")

    if idx == 0:
        set_attr(size, "val", "36")
        set_attr(color, "val", "000000")
        ET.SubElement(r_pr, f"{{{W}}}b")
        jc = child(p_pr, "jc")
        set_attr(jc, "val", "center")
        set_attr(spacing, "before", "0")
        set_attr(spacing, "after", "240")
    elif idx in {2, 4, 6, 8, 13}:
        set_attr(size, "val", "26")
        set_attr(color, "val", "2F5F9A")
        ET.SubElement(r_pr, f"{{{W}}}b")
        set_attr(spacing, "before", "220")
        set_attr(spacing, "after", "80")
    else:
        set_attr(size, "val", "22")
        set_attr(color, "val", "111111")
        if idx == 1:
            set_attr(spacing, "after", "180")


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
            apply_para_style(paras[idx], idx)

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
