#!/usr/bin/env python3
"""
Export all Next.js pages to PDF via full-page screenshots + reportlab.
Chromium's Page.printToPDF fails in this env, so we screenshot → PDF.
"""
import asyncio
import os
from playwright.async_api import async_playwright
from reportlab.lib.pagesizes import A4
from reportlab.lib.utils import ImageReader
from reportlab.pdfgen import canvas
from PIL import Image

BASE = "http://localhost:3999"
OUTPUT_DIR = "/home/user/re/test"
CHROMIUM_PATH = "/root/.cache/ms-playwright/chromium-1194/chrome-linux/chrome"
ARGS = ["--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage",
        "--disable-software-rasterizer", "--single-process"]

PAGES = [
    ("/", "01-accueil"),
    ("/funds", "02-catalogue-fonds"),
    ("/comparateur", "03-comparateur"),
    ("/simulateur", "04-simulateur"),
    ("/portefeuille", "05-portefeuille"),
    ("/market", "06-marche"),
    ("/alternatives", "07-alternatives"),
    ("/recommandation", "08-recommandation"),
    ("/alertes", "09-alertes"),
    ("/communaute", "10-communaute"),
]

A4_W, A4_H = A4  # 595.27, 841.89 points


def screenshot_to_pdf(png_path, pdf_path):
    """Convert a full-page screenshot PNG to a multi-page A4 PDF."""
    img = Image.open(png_path)
    img_w, img_h = img.size

    # Scale: fit width to A4, then paginate vertically
    scale = A4_W / img_w
    scaled_h = img_h * scale
    num_pages = max(1, int(scaled_h / A4_H) + (1 if scaled_h % A4_H > 10 else 0))

    c = canvas.Canvas(pdf_path, pagesize=A4)

    # Crop the image into page-sized slices
    page_h_px = int(A4_H / scale)  # height in pixels per page

    for i in range(num_pages):
        top = i * page_h_px
        bottom = min((i + 1) * page_h_px, img_h)
        crop = img.crop((0, top, img_w, bottom))

        # Save temp crop
        tmp = png_path.replace(".png", f"_p{i}.png")
        crop.save(tmp)

        crop_scaled_h = (bottom - top) * scale
        # Draw at top of page
        c.drawImage(
            tmp, 0, A4_H - crop_scaled_h, width=A4_W, height=crop_scaled_h,
            preserveAspectRatio=True, anchor='nw'
        )
        c.showPage()
        os.remove(tmp)

    c.save()
    img.close()


async def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    async with async_playwright() as p:
        ok = 0
        for route, name in PAGES:
            url = f"{BASE}{route}"
            print(f"  [{name}] {url} ...", end=" ", flush=True)
            browser = None
            try:
                browser = await p.chromium.launch(
                    executable_path=CHROMIUM_PATH, args=ARGS
                )
                page = await browser.new_page(viewport={"width": 1280, "height": 900})
                await page.goto(url, wait_until="load", timeout=25000)
                await page.wait_for_timeout(3000)

                png_path = f"{OUTPUT_DIR}/{name}.png"
                await page.screenshot(path=png_path, full_page=True)

                pdf_path = f"{OUTPUT_DIR}/{name}.pdf"
                screenshot_to_pdf(png_path, pdf_path)
                os.remove(png_path)

                size_kb = os.path.getsize(pdf_path) / 1024
                print(f"OK ({size_kb:.0f} KB)")
                ok += 1
            except Exception as e:
                print(f"ERROR: {e}")
            finally:
                if browser:
                    try:
                        await browser.close()
                    except:
                        pass

    print(f"\n{ok}/{len(PAGES)} pages exported to {OUTPUT_DIR}/")


asyncio.run(main())
