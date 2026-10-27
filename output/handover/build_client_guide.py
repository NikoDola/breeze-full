"""Create the client guide with ReportLab, then render and inspect with PyMuPDF."""

from pathlib import Path
import json

import fitz
from PIL import Image as PILImage, ImageDraw
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas
from reportlab.platypus import Paragraph, Table, TableStyle

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "output" / "pdf" / "breeze-client-cms-guide.pdf"
TMP = ROOT / "tmp" / "pdfs" / "breeze-client-guide"
OUT.parent.mkdir(parents=True, exist_ok=True)
TMP.mkdir(parents=True, exist_ok=True)

FONT_DIR = Path("C:/Windows/Fonts")
for name, file in [("Breeze", "segoeui.ttf"), ("BreezeBold", "segoeuib.ttf"), ("BreezeItalic", "segoeuii.ttf")]:
    pdfmetrics.registerFont(TTFont(name, str(FONT_DIR / file)))
pdfmetrics.registerFontFamily("Breeze", normal="Breeze", bold="BreezeBold", italic="BreezeItalic", boldItalic="BreezeBold")

NAVY = colors.HexColor("#071d30")
ORANGE = colors.HexColor("#E66B27")
INK = colors.HexColor("#263B4B")
MUTED = colors.HexColor("#536B79")
PALE = colors.HexColor("#EFF5F7")
LINE = colors.HexColor("#D9E4E8")
W, H = 612, 792  # US Letter, ready for the Nashville client's printer.
LEFT, RIGHT = 48, 564
WIDTH = RIGHT - LEFT

STYLES = {
    "body": ParagraphStyle("body", fontName="Breeze", fontSize=11, leading=16, textColor=INK, spaceAfter=9),
    "small": ParagraphStyle("small", fontName="Breeze", fontSize=9.5, leading=13.5, textColor=MUTED, spaceAfter=7),
    "h2": ParagraphStyle("h2", fontName="BreezeBold", fontSize=14, leading=19, textColor=NAVY, spaceBefore=8, spaceAfter=8),
    "table": ParagraphStyle("table", fontName="Breeze", fontSize=10.2, leading=14.5, textColor=INK),
    "white": ParagraphStyle("white", fontName="BreezeBold", fontSize=10.5, leading=15, textColor=colors.white),
}

def p(text, style="body"):
    return Paragraph(text, STYLES[style])

def section(title, text):
    return [p(title, "h2"), p(text)]

def steps(items):
    rows = [[p(f"<b>{i:02d}</b>", "table"), p(item, "table")] for i, item in enumerate(items, 1)]
    t = Table(rows, colWidths=[31, WIDTH - 31], hAlign="LEFT")
    t.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 9),
    ]))
    t.spaceAfter = 10
    return t

def callout(title, text):
    t = Table([[p(title, "h2")], [p(text, "table")]], colWidths=[WIDTH], hAlign="LEFT")
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), PALE),
        ("LINEBEFORE", (0, 0), (0, -1), 3, ORANGE),
        ("LEFTPADDING", (0, 0), (-1, -1), 14),
        ("RIGHTPADDING", (0, 0), (-1, -1), 14),
        ("TOPPADDING", (0, 0), (-1, 0), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
    ]))
    t.spaceAfter = 10
    return t

def grid(rows, widths=(155, 361), headers=None):
    all_rows = ([[p(x, "white") for x in headers]] if headers else []) + [[p(x, "table") for x in row] for row in rows]
    t = Table(all_rows, colWidths=list(widths), hAlign="LEFT")
    spec = [
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("RIGHTPADDING", (0, 0), (-1, -1), 10),
        ("TOPPADDING", (0, 0), (-1, -1), 9),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 9),
        ("LINEBELOW", (0, 0), (-1, -1), 0.5, LINE),
    ]
    if headers:
        spec.append(("BACKGROUND", (0, 0), (-1, 0), NAVY))
    for i in range(1 if headers else 0, len(all_rows)):
        if i % 2 == (1 if headers else 0):
            spec.append(("BACKGROUND", (0, i), (-1, i), PALE))
    t.setStyle(TableStyle(spec))
    t.spaceAfter = 10
    return t

PAGE_BOTTOMS = []
c = canvas.Canvas(str(OUT), pagesize=(W, H), pageCompression=1)
c.setTitle("Your Breeze website guide")
c.setAuthor("Breeze Heating & Cooling")
c.setSubject("Friendly client instructions for managing and publishing Breeze website content")
c.setCreator("Breeze client handover")

def base(number, title, subtitle, key):
    c.bookmarkPage(key, fit="XYZ", left=0, top=H, zoom=0)
    c.addOutlineEntry(title, key, 0)
    c.setFillColor(NAVY)
    c.rect(0, H - 8, W, 8, fill=1, stroke=0)
    c.setFont("BreezeBold", 10)
    c.drawString(LEFT, 754, "BREEZE  /  HEATING & COOLING")
    c.setFont("Breeze", 9)
    c.setFillColor(MUTED)
    c.drawRightString(RIGHT, 754, "Your website guide")
    c.setFillColor(NAVY)
    c.setFont("BreezeBold", 25)
    c.drawString(LEFT, 705, title)
    sub = p(subtitle, "small")
    _, hh = sub.wrap(WIDTH, 60)
    sub.drawOn(c, LEFT, 684 - hh)
    c.setStrokeColor(LINE)
    c.line(LEFT, 53, RIGHT, 53)
    c.setFillColor(MUTED)
    c.setFont("Breeze", 8)
    c.drawString(LEFT, 35, "Breeze Heating & Cooling  |  Client handover  |  October 2026")
    c.drawRightString(RIGHT, 35, f"{number} / 8")
    if number > 1:
        c.linkRect("", "welcome", (LEFT, 24, RIGHT, 49), relative=0, thickness=0)
    return 655 - max(0, hh - 13)

def content(number, title, subtitle, key, blocks):
    y = base(number, title, subtitle, key)
    for block in blocks:
        if isinstance(block, (int, float)):
            y -= block
            continue
        y -= block.getSpaceBefore() if hasattr(block, "getSpaceBefore") else 0
        ww, hh = block.wrap(WIDTH, y - 66)
        if y - hh < 68:
            raise ValueError(f"Page {number} overflows: {title}; bottom={y-hh:.1f}")
        block.drawOn(c, LEFT, y - hh)
        y -= hh + (block.getSpaceAfter() if hasattr(block, "getSpaceAfter") else 9)
    PAGE_BOTTOMS.append(round(y, 1))
    c.showPage()

content(1, "Your Breeze website guide", "A practical guide to keeping your website clear, current and ready for customers.", "welcome", [
    p("Welcome! Your website editor gives you a simple way to update text, photos and business details. You can review your changes privately before showing them to customers."),
    callout("The everyday routine", "Choose a page. Make your changes. Check the preview. Click <b>Save draft</b>, then <b>Publish changes</b> when you are ready."),
    p("A draft is a private working copy. Publishing makes it available to website visitors. Typing in a field does not automatically save your work."),
    p("Find what you need", "h2"),
    grid([
        ('<link href="#publish" color="#071d30"><b>Sign in and publish</b></link>', "The steps you will use most often. <b>Page 2</b>"),
        ('<link href="#pages" color="#071d30"><b>Update a page</b></link>', "Find your page and change the wording. <b>Page 3</b>"),
        ('<link href="#business" color="#071d30"><b>Business details</b></link>', "Phone, email, address and social profiles. <b>Page 4</b>"),
        ('<link href="#photos" color="#071d30"><b>Photos and banners</b></link>', "Upload, choose and arrange your images. <b>Page 5</b>"),
        ('<link href="#reviews" color="#071d30"><b>Reviews and promotions</b></link>', "Customer feedback and seasonal offers. <b>Page 6</b>"),
        ('<link href="#search" color="#071d30"><b>Search and sharing</b></link>', "Page descriptions and shared-link images. <b>Page 7</b>"),
        ('<link href="#help" color="#071d30"><b>Help when you need it</b></link>', "Simple fixes, recovery and support. <b>Page 8</b>"),
    ]),
    p("Keep this guide handy. The contents above are clickable, and the footer on later pages takes you back here.", "small"),
])

content(2, "Sign in, save and publish", "Start with the confirmed admin link your developer sends at handover.", "publish", [
    steps([
        "<b>Sign in.</b> Open your admin link and enter the username and password supplied privately. Bookmark that link so it is easy to find next time.",
        "<b>Choose a page.</b> Use the left menu or <b>Find a page</b>. On a phone, open the menu button first. If you see <b>Copy existing content</b>, click it once to prepare that page for editing; this does not publish anything.",
        "<b>Make a small change.</b> Update the field you need. Use <b>Your draft</b> in Preview to see your working copy. Try <b>Desktop</b>, <b>Tablet</b> and <b>Mobile</b> to check how it fits.",
        "<b>Save your work.</b> Click <b>Save draft</b> and wait for confirmation. You can stop here and return later. Visitors still see the previously published version.",
        "<b>Make it live.</b> When the draft looks right, click <b>Publish changes</b>. Wait until the editor confirms <b>Live on website</b> or says your changes are visible. Publishing can also save your current edits first; saving a draft separately gives you a useful review point.",
        "<b>Check the real page.</b> Use <b>View website</b>, or <b>Publishing details > Open published page</b>. Refresh the page and read the updated section. Then return to the editor and <b>Sign out</b> when finished.",
    ]),
    callout("Good to know", "Each page is saved and published separately. If you update three pages, publish each one. Business details can affect several pages at once."),
    p("Your sign-in session lasts up to eight hours. If you need to sign in again, copy any unsaved wording somewhere safe first. For a forgotten password, contact your developer.", "small"),
])

content(3, "Find and update a page", "Use the editor's page names to go straight to the content you want to change.", "pages", [
    grid([
        ("<b>Homepage</b>", "Heating & cooling, contact introduction, review headings and service-area wording."),
        ("<b>HVAC</b>", "Services overview and the individual heating, cooling and other service pages."),
        ("<b>Promotions / Emergency</b>", "Seasonal offers, promotion page text and emergency service information."),
        ("<b>Client</b>", "Reviews and Gallery."),
        ("<b>About us</b>", "Company pages, Contact us, Careers and related articles."),
        ("<b>Business details / Legal</b>", "Shared contact information, social profiles, privacy policy and terms."),
    ], headers=("Menu area", "What you will find")),
    *section("For a normal page update", "Choose the page, open <b>Page content</b> where available, and change the relevant heading or paragraph. Expand a card or section to see its fields. Where an item list offers <b>Earlier</b> and <b>Later</b>, use them to adjust the order. Review the preview, save, then publish."),
    *section("For the homepage", "Choose the section you need. The main hero artwork, booking form and section order are maintained by your developer. Change the review section's heading here; use <b>Client > Reviews</b> for the actual testimonials and homepage favorites."),
    p("Some headings have a small formatting toolbar. Select the words first, then choose the available formatting. Keep headings brief so they work on mobile.", "small"),
    callout("If you cannot find a control", "Ask your developer for help with a new page, layout, navigation, branding or a feature that is not offered in the editor. You can keep making the content changes that are available."),
])

content(4, "Keep your details current", "Choose Business details in the menu to update information used across the website.", "business", [
    grid([
        ("<b>Contact</b>", "Change the <b>Phone number</b> and <b>Public email</b> shown in the website's contact links. <b>Job application email</b> is a separate destination for Careers applications."),
        ("<b>Location</b>", "Update your address and check the map. Add your Google Maps directions link, or choose <b>Use address for directions</b>."),
        ("<b>Social profiles</b>", "Choose <b>+ Add social link</b>, select the platform and paste the full https:// link to the business profile. Each platform can appear once."),
        ("<b>Shared website text</b>", "Update the shared contact banner or service callouts. Preview the different placements before publishing."),
    ]),
    p("Check the available preview areas, such as Header, Footer and Contact location. Save and publish Business details, then check the phone, email and directions links on the public website."),
    *section("Where do service enquiries go?", "Service requests go directly to <b>Housecall Pro</b>. Manage booking form fields and lead notifications in your Housecall Pro account using <b>Open Housecall Pro</b>. Changing the public email here does not reroute those leads. The form is a placeholder inside the editor preview."),
    *section("What about job applications?", "The Careers form prepares an email in the visitor's email app. The visitor must send that email to complete the application. The destination is the <b>Job application email</b> field."),
    *section("Where can I see website visits?", "Use <b>Open Clarity</b> under Business details. Microsoft Clarity shows activity from the live public website after visitors allow analytics. Your website editor and preview are excluded."),
    p("After changing shared details, check the Contact us page and footer. If the business directions link changes, also review any separate homepage service-area wording.", "small"),
])

content(5, "Add photos and banners", "Upload once, then choose the image wherever an image picker is available.", "photos", [
    steps([
        "<b>Open the image picker.</b> On a page, choose <b>Replace hero image</b> for the top banner. For a gallery photo, use <b>Choose photo</b> or <b>Replace photo</b>.",
        "<b>Upload or reuse.</b> Use <b>Upload images</b>, or choose a photo already in <b>Uploaded images</b>. Wait for uploading and checking to finish, then click the image to select it. Uploading alone does not place it on the page.",
        "<b>Review the description.</b> Where offered, describe what the photo shows, for example 'Breeze technician servicing an outdoor air conditioner.' The library's <b>Default description</b> is used for future selections; changing it does not change existing page descriptions.",
        "<b>Check and publish.</b> Review the crop on desktop and mobile, then save the draft and publish the page. Until publication, a new upload stays private.",
    ]),
    callout("Choose a file the editor can use", "Accepted formats: <b>JPEG, PNG, WebP or AVIF</b>, up to <b>10 MB each</b>. Use still images up to 24 megapixels and 8192 pixels on either side. Convert phone HEIC photos to JPEG first. Use clear original photos you have permission to display."),
    *section("Add a photo to the Gallery", "Open <b>Client > Gallery > Page content</b>. In <b>Gallery photos</b>, use the add-item control, choose the photo and enter its <b>Photo description</b>. Use <b>Earlier</b> or <b>Later</b> to change the order. Save and publish Gallery. It supports up to 40 photos."),
    *section("Change a page banner", "Choose a wide photo and check that the important part remains visible after cropping. <b>Restore default hero</b> brings back the original banner after saving and publishing. Homepage hero artwork is managed by your developer."),
    p("Removing or replacing a photo changes the draft; it does not permanently delete the original file. Publish the page for visitors to see the new selection.", "small"),
])

content(6, "Reviews and promotions", "Keep customer feedback and seasonal offers accurate and easy to read.", "reviews", [
    p("Add or update a review", "h2"),
    steps([
        "Open <b>Client > Reviews</b>. Choose <b>+ Add review</b>, or expand an existing reviewer.",
        "Enter <b>Reviewer name</b> and <b>Full review</b>. Use genuine feedback with permission to display it. An optional <b>Homepage excerpt</b> should keep the customer's original wording.",
        "Keep <b>Show this review</b> checked to display it on the Client page. Use the star to feature it on the homepage. You can star up to three; unstar one before choosing a replacement. Use the arrows to reorder favorites.",
        "Save and publish Reviews, then check both the homepage and the Client reviews page.",
    ]),
    p("Hiding or removing a review also removes its homepage star. With no starred reviews, the homepage review section is hidden. The library supports up to 50 reviews. The Google rating in the hero is managed separately.", "small"),
    p("Update a promotion", "h2"),
    steps([
        "Open <b>Promotions</b> and expand the seasonal offer you want to update. Check its heading, offer wording and any terms or eligibility details shown in the fields.",
        "Check every amount, date and promise before publishing. Under <b>Seasonal page hero images</b>, you can choose separate summer and winter banners where needed.",
        "Save and publish Promotions, then check the promotions listing and the relevant summer or winter page. These pages share one Promotions document.",
    ]),
    callout("A helpful monthly habit", "Review seasonal offers, contact information and recent photos together. If you need a completely new offer type or destination page, ask your developer to add it."),
])

content(7, "Search results and sharing", "These settings help describe your page when people find or share it.", "search", [
    *section("Search title and description", "On pages that offer it, open <b>Search settings</b>. Use <b>Search title</b> for a clear page name and <b>Search description</b> for a short, useful summary. On Reviews, expand <b>Reviews page hero, headings and search settings</b>."),
    callout("A simple example", "<b>Search title:</b> AC Repair in Nashville | Breeze Heating & Cooling<br/><br/><b>Search description:</b> Need help with your air conditioner? Breeze provides cooling repairs in Nashville and nearby areas. Call to arrange a service visit."),
    p("Use wording that accurately describes your services. The preview is a guide; search engines may choose different text, and search results can take time to update after publication."),
    *section("The picture shown with a shared link", "<b>OG image (optional)</b> is the image a page can use when its link is shared in messages or on social media. Choose <b>Upload or choose OG image</b>, select a wide image, and save and publish the page. An image around <b>1200 x 630 pixels</b> is a good fit."),
    p("The OG image is separate from the banner at the top of the page. Social and messaging apps may keep an older preview for a while. Promotions uses its shared-link image for both seasonal pages too."),
    p("Before every publication", "h2"),
    grid([
        ("<b>Read it</b>", "Check spelling, phone numbers, prices and dates."),
        ("<b>Preview it</b>", "Check desktop and mobile, especially image crops and long headings."),
        ("<b>Publish it</b>", "Save, publish and wait for the live confirmation."),
        ("<b>Open it</b>", "Refresh the public page and test the links you changed."),
    ]),
])

content(8, "Help when you need it", "Keep any unsaved wording safe before reloading, signing out or changing pages.", "help", [
    grid([
        ("<b>I cannot sign in</b>", "Use the confirmed admin link and check the username and password. If access still fails, contact your developer. There is no self-service password reset."),
        ("<b>A button is unavailable</b>", "Wait for any upload, save or publish action to finish. Save draft is unavailable when nothing has changed. Publish may also be unavailable when the saved version is already live."),
        ("<b>My change is not visible</b>", "Check that you published the right page, then refresh the public page. Open <b>Publishing details</b>. If offered, use <b>Retry website update</b> once it becomes available. This retries the saved publication."),
        ("<b>An action shows an error</b>", "Read the message and use <b>Check status</b> before trying again. This keeps local edits. If it continues, send your developer the page name, message and time."),
        ("<b>A newer draft exists</b>", "Copy any wording you want to keep, then choose <b>Load latest draft</b>. Coordinate with the other editor before continuing so you do not overwrite each other's work."),
        ("<b>A photo will not upload</b>", "Check the format and file size on page 5. Use <b>Refresh library</b>; if offered, try <b>Retry validation</b>. If the upload was interrupted before completion, select the file again."),
        ("<b>I made a mistake</b>", "For unsaved edits, <b>Discard changes</b> returns to the saved draft. If already saved or published, correct the wording and publish again. Ask your developer if an older revision needs recovery."),
    ], widths=(155, 361)),
    callout("Your developer is here to help", 'Email: <link href="mailto:nikodola@gmail.com" color="#071d30"><b>nikodola@gmail.com</b></link><br/>Phone: <link href="tel:+38974222858" color="#071d30"><b>+389 74 222 858</b></link><br/><br/>Include the page name and a screenshot of the message if useful. Keep passwords out of screenshots and support messages.'),
])

c.save()

doc = fitz.open(OUT)
assert len(doc) == 8, f"Expected 8 pages, got {len(doc)}"
all_text = "\n".join(page.get_text() for page in doc)
for phrase in ["Save draft", "Publish changes", "Retry website update", "Business details", "Housecall Pro", "Job application email", "nikodola@gmail.com"]:
    assert phrase in all_text, phrase
assert "\ufffd" not in all_text

details = []
internal_links = 0
for i, page in enumerate(doc, 1):
    pix = page.get_pixmap(matrix=fitz.Matrix(1.5, 1.5), alpha=False)
    path = TMP / f"page-{i:02d}.png"
    pix.save(path)
    for link in page.get_links():
        if link.get("kind") == fitz.LINK_GOTO:
            assert 0 <= link["page"] < 8
            internal_links += 1
    blocks = page.get_text("dict")["blocks"]
    for block in blocks:
        if "lines" not in block:
            continue
        for line in block["lines"]:
            x0, y0, x1, y1 = line["bbox"]
            assert x0 >= 44 and x1 <= 568 and y0 >= 18 and y1 <= 771, (i, line["bbox"])
    details.append({"page": i, "words": len(page.get_text().split()), "links": len(page.get_links()), "content_bottom_y": PAGE_BOTTOMS[i-1]})
assert internal_links == 14, internal_links

thumbs = []
for path in sorted(TMP.glob("page-*.png")):
    im = PILImage.open(path).convert("RGB")
    im.thumbnail((367, 475))
    thumbs.append(im)
sheet = PILImage.new("RGB", (4*387+20, 2*505+20), "#dce5e9")
for i, im in enumerate(thumbs):
    x = 20 + (i % 4)*387
    y = 20 + (i // 4)*505
    sheet.paste(im, (x, y))
    ImageDraw.Draw(sheet).text((x+5, y+479), f"Page {i+1}", fill="#071d30")
sheet.save(TMP / "contact-sheet.png")
(TMP / "validation.json").write_text(json.dumps({"pages": details, "bytes": OUT.stat().st_size}, indent=2), encoding="utf-8")
print(json.dumps({"pdf": str(OUT), "pages": details, "bytes": OUT.stat().st_size}, indent=2))
