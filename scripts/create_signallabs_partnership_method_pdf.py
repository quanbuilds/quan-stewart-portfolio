from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.pagesizes import landscape, letter
from reportlab.lib.utils import ImageReader
from reportlab.pdfbase.pdfmetrics import stringWidth
from reportlab.pdfgen import canvas


ROOT = Path(__file__).resolve().parents[1]
OUT = Path.home() / "Documents" / "SignalLabs" / "Internal" / "signallabs-partnership-method.pdf"
LOGO = ROOT / "signallabs" / "assets" / "brand" / "signallabs-logo-a.png"

BLACK = colors.HexColor("#0B0B0A")
PAPER = colors.HexColor("#F0ECE3")
STONE = colors.HexColor("#D8D1C4")
MUTED = colors.HexColor("#AAA397")
GOLD = colors.HexColor("#C79B49")
GOLD_LIGHT = colors.HexColor("#E1C278")
PANEL = colors.HexColor("#191815")
LINE = colors.HexColor("#59544B")

STAGES = [
    ("01", "Discover the opportunity", [
        "Surface the recurring work, customer friction, and operational drag.",
        "Frame the first business outcome worth improving.",
        "Plan the right people and information for a useful working session.",
    ]),
    ("02", "Align the people and priorities", [
        "Bring the owner and key operators into the same conversation.",
        "Connect the work to timing, initiatives, and practical constraints.",
        "Agree on the access, context, and decision rights needed to proceed.",
    ]),
    ("03", "Map the operating reality", [
        "Trace the actual tools, handoffs, records, and repeat decisions.",
        "Establish a baseline for time, lead response, quality, or risk.",
        "Listen to the people closest to the workflow before prescribing change.",
    ]),
    ("04", "Validate the first move", [
        "Review what the map shows with the people who own the outcome.",
        "Define the measures that will tell us the work is improving.",
        "Pressure-test the recommended direction with a focused proof point.",
    ]),
    ("05", "Shape the partnership", [
        "Turn the validated direction into a practical, staged plan.",
        "Set responsibilities, operating cadence, and decision checkpoints.",
        "Create a tailored proposal built around the business, not a preset package.",
    ]),
    ("06", "Build, launch, and enable", [
        "Configure the workflow, documentation, and approval safeguards.",
        "Train the team and launch in a sequence the business can absorb.",
        "Keep ownership and handoff expectations clear from the start.",
    ]),
    ("07", "Operate, learn, and optimize", [
        "Review the live system against the agreed measures and feedback.",
        "Support the team, maintain the work, and resolve new friction.",
        "Identify the next high-value improvement as the business evolves.",
    ]),
]


def wrap(c, text, font, size, width):
    words = text.split()
    lines, line = [], ""
    for word in words:
        candidate = word if not line else f"{line} {word}"
        if stringWidth(candidate, font, size) <= width:
            line = candidate
        else:
            lines.append(line)
            line = word
    if line:
        lines.append(line)
    return lines


def text_block(c, text, x, y, width, font="Helvetica", size=8.3, leading=10.2, color=STONE):
    c.setFont(font, size)
    c.setFillColor(color)
    cursor = y
    for line in wrap(c, text, font, size, width):
        c.drawString(x, cursor, line)
        cursor -= leading
    return cursor


def stage_card(c, x, y, w, h, number, title, bullets):
    c.setFillColor(PANEL)
    c.setStrokeColor(LINE)
    c.roundRect(x, y, w, h, 7, fill=1, stroke=1)
    c.setFillColor(GOLD)
    c.roundRect(x, y + h - 48, w, 48, 7, fill=1, stroke=0)
    c.rect(x, y + h - 48, w, 8, fill=1, stroke=0)
    c.setFillColor(BLACK)
    c.setFont("Helvetica-Bold", 25)
    c.drawString(x + 13, y + h - 33, number)
    c.setFillColor(BLACK)
    title_lines = wrap(c, title, "Helvetica-Bold", 10.4, w - 64)
    ty = y + h - 24
    c.setFont("Helvetica-Bold", 10.4)
    for line in title_lines:
        c.drawString(x + 58, ty, line)
        ty -= 12
    cursor = y + h - 63
    for bullet in bullets:
        c.setFillColor(GOLD_LIGHT)
        c.circle(x + 16, cursor + 2, 1.5, fill=1, stroke=0)
        cursor = text_block(c, bullet, x + 23, cursor + 5, w - 35)
        cursor -= 5


def connector(c, x1, y1, x2, y2):
    c.setStrokeColor(LINE)
    c.setLineWidth(2)
    c.line(x1, y1, x2, y2)
    c.setFillColor(GOLD)
    c.circle(x2, y2, 3.2, fill=1, stroke=0)


def build():
    OUT.parent.mkdir(parents=True, exist_ok=True)
    width, height = landscape(letter)
    c = canvas.Canvas(str(OUT), pagesize=(width, height), pageCompression=1)
    c.setTitle("SignalLabs Partnership Method")
    c.setAuthor("SignalLabs")
    c.setSubject("Internal client meeting handout")
    c.setFillColor(BLACK)
    c.rect(0, 0, width, height, fill=1, stroke=0)

    c.setFillColor(colors.HexColor("#11110F"))
    c.rect(0, height - 86, width, 86, fill=1, stroke=0)
    if LOGO.exists():
        img = ImageReader(str(LOGO))
        c.drawImage(img, 36, height - 68, width=42, height=42, preserveAspectRatio=True, mask="auto")
    c.setFillColor(PAPER)
    c.setFont("Helvetica-Bold", 15)
    c.drawString(88, height - 47, "SIGNALLABS")
    c.setFillColor(MUTED)
    c.setFont("Helvetica", 8)
    c.drawString(89, height - 62, "AI systems for owner-led service businesses")
    c.setFillColor(PAPER)
    c.setFont("Helvetica", 17)
    c.drawRightString(width - 36, height - 48, "A partnership method for durable operational change")

    c.setFillColor(GOLD)
    c.setFont("Helvetica-Bold", 23)
    c.drawString(36, height - 120, "How we turn recurring friction into a stronger operating system")
    c.setFillColor(STONE)
    c.setFont("Helvetica", 10.2)
    intro = "SignalLabs works alongside owners and operators to understand the work as it is actually done, build the right first solution, and keep improving it over time. This is the shared path we use to make the work visible, measurable, and sustainable."
    text_block(c, intro, 36, height - 140, 710, font="Helvetica", size=10.2, leading=12.7, color=STONE)

    margin, gap = 36, 16
    card_w = (width - (margin * 2) - (gap * 3)) / 4
    card_h = 164
    top_y = 272
    bottom_y = 57
    for index, stage in enumerate(STAGES[:4]):
        x = margin + index * (card_w + gap)
        stage_card(c, x, top_y, card_w, card_h, *stage)
        if index < 3:
            connector(c, x + card_w, top_y + card_h / 2, x + card_w + gap, top_y + card_h / 2)
    for index, stage in enumerate(STAGES[4:]):
        x = margin + 70 + index * (card_w + gap)
        stage_card(c, x, bottom_y, card_w, card_h, *stage)
        if index < 2:
            connector(c, x + card_w, bottom_y + card_h / 2, x + card_w + gap, bottom_y + card_h / 2)

    c.setStrokeColor(LINE)
    c.setLineWidth(2)
    c.line(width - margin - 6, top_y + 25, width - margin - 6, bottom_y + card_h + 17)
    c.line(width - margin - 6, bottom_y + card_h + 17, margin + 70, bottom_y + card_h + 17)
    c.setFillColor(GOLD)
    c.circle(margin + 70, bottom_y + card_h + 17, 3.2, fill=1, stroke=0)

    c.setFillColor(MUTED)
    c.setFont("Helvetica", 7.7)
    c.drawString(36, 39, "Internal meeting handout - share in person to align on how a SignalLabs engagement is designed.")
    c.drawRightString(width - 36, 39, "SignalLabs / A QuanBuilds company")
    c.showPage()
    c.save()


if __name__ == "__main__":
    build()
