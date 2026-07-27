#!/usr/bin/env python3
"""Synchronize alliance prices, details and official product images from Emporium24k.

The generated files are served by GitHub Pages, so mobile browsers do not need to
contact third-party screenshot or metadata services.
"""

from __future__ import annotations

import html
import json
import mimetypes
import re
import sys
import urllib.request
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
IMAGE_DIR = ROOT / "assistente" / "catalogo-imagens"
MANIFEST = ROOT / "assistente" / "catalogo-dados-oficiais.js"

PRODUCTS = {
    "gold-atlas": "https://www.emporium24k.com.br/produtos/alianca-de-ouro-vow-copia-1erog/",
    "gold-curve": "https://www.emporium24k.com.br/produtos/alianca-de-ouro-vow-copia-4ysq6/",
    "gold-prime": "https://www.emporium24k.com.br/produtos/alianca-de-ouro-celeste-copia-1s7g4/",
    "gold-vow": "https://www.emporium24k.com.br/produtos/alianca-de-ouro-vow/",
    "gold-spark": "https://www.emporium24k.com.br/produtos/alianca-de-ouro-vow-copia-1fx7u/",
    "gold-bond": "https://www.emporium24k.com.br/produtos/alianca-de-ouro-bond/",
    "gold-eternal": "https://www.emporium24k.com.br/produtos/alianca-de-ouro-eternal/",
    "gold-luna": "https://www.emporium24k.com.br/produtos/alianca-de-ouro-luna/",
    "gold-horizon": "https://www.emporium24k.com.br/produtos/alianca-de-ouro-vow-copia-1kf87/",
    "gold-lustre": "https://www.emporium24k.com.br/produtos/alianca-de-ouro-lustre/",
    "gold-legacy": "https://www.emporium24k.com.br/produtos/alianca-de-namoro-pulse-copia-18j8m/",
    "gold-flare": "https://www.emporium24k.com.br/produtos/alianca-de-ouro-flare/",
    "gold-aura": "https://www.emporium24k.com.br/produtos/alianca-de-ouro-aura/",
    "gold-roots": "https://www.emporium24k.com.br/produtos/alianca-de-ouro-vow-copia-22jf3/",
    "gold-celeste": "https://www.emporium24k.com.br/produtos/alianca-de-ouro-celeste/",
    "silver-lux": "https://www.emporium24k.com.br/produtos/alianca-de-namoro-lux/",
    "silver-gleam": "https://www.emporium24k.com.br/produtos/alianca-de-namoro-gleam/",
    "silver-pulse": "https://www.emporium24k.com.br/produtos/alianca-de-namoro-pulse/",
    "silver-vow": "https://www.emporium24k.com.br/produtos/alianca-de-namoro-vow/",
    "silver-celeste": "https://www.emporium24k.com.br/produtos/alianca-de-namoro-celeste/",
    "silver-halo": "https://www.emporium24k.com.br/produtos/alianca-de-namoro-pulse-copia-1h1k0/",
    "silver-flare": "https://www.emporium24k.com.br/produtos/alianca-de-namoro-flare/",
    "silver-lustre": "https://www.emporium24k.com.br/produtos/alianca-de-namoro-lustre/",
    "silver-eternal": "https://www.emporium24k.com.br/produtos/alianca-de-namoro-eternal/",
}

HEADERS = {
    "User-Agent": "Mozilla/5.0 (compatible; Emporium24kCatalogSync/1.0; +https://github.com/emporium24k-ui/Landing)",
    "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.6",
}


def fetch(url: str) -> tuple[bytes, str]:
    request = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(request, timeout=35) as response:
        return response.read(), response.headers.get_content_type()


def meta_content(source: str, *, prop: str | None = None, name: str | None = None, itemprop: str | None = None) -> str:
    key, value = ("property", prop) if prop else ("name", name) if name else ("itemprop", itemprop)
    if not value:
        return ""
    patterns = [
        rf'<meta[^>]+{key}=["\']{re.escape(value)}["\'][^>]+content=["\']([^"\']+)',
        rf'<meta[^>]+content=["\']([^"\']+)["\'][^>]+{key}=["\']{re.escape(value)}["\']',
    ]
    for pattern in patterns:
        match = re.search(pattern, source, re.I)
        if match:
            return html.unescape(match.group(1)).strip()
    return ""


def walk_json(value: Any):
    if isinstance(value, dict):
        yield value
        for child in value.values():
            yield from walk_json(child)
    elif isinstance(value, list):
        for child in value:
            yield from walk_json(child)


def product_json_ld(source: str) -> dict[str, Any]:
    blocks = re.findall(r'<script[^>]+type=["\']application/ld\+json["\'][^>]*>(.*?)</script>', source, re.I | re.S)
    for block in blocks:
        try:
            payload = json.loads(html.unescape(block).strip())
        except Exception:
            continue
        for item in walk_json(payload):
            kind = item.get("@type")
            kinds = kind if isinstance(kind, list) else [kind]
            if "Product" in kinds:
                return item
    return {}


def first_value(value: Any) -> str:
    if isinstance(value, list):
        return first_value(value[0]) if value else ""
    if isinstance(value, dict):
        return str(value.get("url") or value.get("contentUrl") or "")
    return str(value or "")


def parse_price(product: dict[str, Any], source: str) -> float | None:
    offers = product.get("offers", {})
    if isinstance(offers, list):
        offers = offers[0] if offers else {}
    candidates = [
        offers.get("price") if isinstance(offers, dict) else None,
        offers.get("lowPrice") if isinstance(offers, dict) else None,
        meta_content(source, prop="product:price:amount"),
        meta_content(source, itemprop="price"),
    ]
    for candidate in candidates:
        if candidate in (None, ""):
            continue
        raw = str(candidate).strip().replace("R$", "").replace(" ", "")
        if "," in raw:
            raw = raw.replace(".", "").replace(",", ".")
        else:
            raw = re.sub(r"[^0-9.]", "", raw)
        try:
            value = float(raw)
            if value > 0:
                return value
        except ValueError:
            pass
    return None


def strip_tags(value: str) -> str:
    clean = re.sub(r"<script\b[^>]*>.*?</script>", " ", value, flags=re.I | re.S)
    clean = re.sub(r"<style\b[^>]*>.*?</style>", " ", clean, flags=re.I | re.S)
    clean = re.sub(r"<[^>]+>", " ", clean)
    return re.sub(r"\s+", " ", html.unescape(clean)).strip()


def parse_width(text: str) -> str:
    match = re.search(r"\b(\d+(?:[.,]\d+)?)\s*mm\s+de\s+largura\b", text, re.I)
    if not match:
        match = re.search(r"\blargura\s*[:\-]?\s*(\d+(?:[.,]\d+)?)\s*mm\b", text, re.I)
    return f"{match.group(1).replace('.', ',')} mm" if match else ""


def extension(content_type: str, image_url: str) -> str:
    known = {"image/webp": ".webp", "image/jpeg": ".jpg", "image/png": ".png", "image/avif": ".avif"}
    if content_type in known:
        return known[content_type]
    guessed = Path(image_url.split("?", 1)[0]).suffix.lower()
    if guessed in {".webp", ".jpg", ".jpeg", ".png", ".avif"}:
        return ".jpg" if guessed == ".jpeg" else guessed
    return mimetypes.guess_extension(content_type) or ".jpg"


def sync_product(product_id: str, page_url: str) -> dict[str, Any]:
    raw, _ = fetch(page_url)
    source = raw.decode("utf-8", errors="replace")
    structured = product_json_ld(source)
    visible = strip_tags(source)

    title = first_value(structured.get("name")) or meta_content(source, prop="og:title")
    description = first_value(structured.get("description")) or meta_content(source, prop="og:description")
    image_url = first_value(structured.get("image")) or meta_content(source, prop="og:image") or meta_content(source, name="twitter:image")
    price = parse_price(structured, source)
    width = parse_width(f"{description} {visible[:12000]}")

    result: dict[str, Any] = {
        "page": page_url,
        "title": title,
        "description": strip_tags(description)[:500],
    }
    if price is not None:
        result["price"] = price
    if width:
        result["width"] = width

    if image_url:
        image_url = urllib.parse.urljoin(page_url, image_url)
        image_bytes, content_type = fetch(image_url)
        if content_type.startswith("image/") and len(image_bytes) > 500:
            for old in IMAGE_DIR.glob(f"{product_id}.*"):
                old.unlink()
            suffix = extension(content_type, image_url)
            target = IMAGE_DIR / f"{product_id}{suffix}"
            target.write_bytes(image_bytes)
            result["image"] = f"./catalogo-imagens/{target.name}"
            result["image_source"] = image_url

    if price is None:
        raise RuntimeError(f"Preço não encontrado para {product_id}: {page_url}")
    if "image" not in result:
        raise RuntimeError(f"Imagem não encontrada para {product_id}: {page_url}")
    return result


def main() -> int:
    IMAGE_DIR.mkdir(parents=True, exist_ok=True)
    generated: dict[str, Any] = {}
    errors: list[str] = []

    for product_id, url in PRODUCTS.items():
        try:
            generated[product_id] = sync_product(product_id, url)
            print(f"OK {product_id}: {generated[product_id].get('price')} | {generated[product_id].get('image')}")
        except Exception as exc:
            errors.append(f"{product_id}: {exc}")
            print(f"ERRO {product_id}: {exc}", file=sys.stderr)

    if errors:
        print("\nA sincronização foi interrompida para não publicar dados incompletos:", file=sys.stderr)
        print("\n".join(errors), file=sys.stderr)
        return 1

    payload = json.dumps(generated, ensure_ascii=False, separators=(",", ":"))
    MANIFEST.write_text(
        "// Arquivo gerado automaticamente por scripts/sync_official_catalog.py\n"
        f"window.__CATALOGO_OFICIAL_EMP24K__=Object.freeze({payload});\n",
        encoding="utf-8",
    )
    print(f"Manifesto gerado: {MANIFEST}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
