#!/usr/bin/env python3
"""Synchronize ready jewelry and semijewelry products from the official store."""

from __future__ import annotations

import concurrent.futures
import html
import json
import re
import sys
import urllib.parse
import urllib.request
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "assistente" / "catalogo-loja-dados.js"
BASE = "https://www.emporium24k.com.br"
START_PAGES = [
    f"{BASE}/produtos/",
    f"{BASE}/semijoias/",
    f"{BASE}/joias/",
]
HEADERS = {
    "User-Agent": "Mozilla/5.0 (compatible; Emporium24kCatalogSync/1.0; +https://github.com/emporium24k-ui/Landing)",
    "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.6",
}


def fetch_text(url: str) -> str:
    request = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(request, timeout=35) as response:
        return response.read().decode("utf-8", errors="replace")


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


def meta_content(source: str, name: str) -> str:
    for key in ("property", "name", "itemprop"):
        patterns = [
            rf'<meta[^>]+{key}=["\']{re.escape(name)}["\'][^>]+content=["\']([^"\']+)',
            rf'<meta[^>]+content=["\']([^"\']+)["\'][^>]+{key}=["\']{re.escape(name)}["\']',
        ]
        for pattern in patterns:
            match = re.search(pattern, source, re.I)
            if match:
                return html.unescape(match.group(1)).strip()
    return ""


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
        meta_content(source, "product:price:amount"),
        meta_content(source, "price"),
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


def normalize(value: str) -> str:
    replacements = str.maketrans("áàâãéêíóôõúüç", "aaaaeeiooouuc")
    return re.sub(r"[^a-z0-9 ]", " ", value.lower().translate(replacements)).strip()


def is_product_url(url: str) -> bool:
    parsed = urllib.parse.urlparse(url)
    if parsed.netloc and parsed.netloc != "www.emporium24k.com.br":
        return False
    path = parsed.path.rstrip("/") + "/"
    return bool(re.fullmatch(r"/produtos/[^/]+/", path))


def is_listing_url(url: str) -> bool:
    parsed = urllib.parse.urlparse(url)
    if parsed.netloc and parsed.netloc != "www.emporium24k.com.br":
        return False
    path = parsed.path.lower()
    if not any(path.startswith(prefix) for prefix in ("/produtos", "/semijoias", "/joias")):
        return False
    query = urllib.parse.parse_qs(parsed.query)
    return "page" in query or "/page/" in path or path.rstrip("/") in ("/produtos", "/semijoias", "/joias")


def discover_urls() -> list[str]:
    queue = list(START_PAGES)
    visited: set[str] = set()
    products: set[str] = set()
    while queue and len(visited) < 80:
        url = queue.pop(0)
        canonical = url.split("#", 1)[0]
        if canonical in visited:
            continue
        visited.add(canonical)
        try:
            source = fetch_text(canonical)
        except Exception as exc:
            print(f"AVISO listagem {canonical}: {exc}", file=sys.stderr)
            continue
        for href in re.findall(r'href=["\']([^"\']+)', source, re.I):
            absolute = urllib.parse.urljoin(canonical, html.unescape(href)).split("#", 1)[0]
            if is_product_url(absolute):
                products.add(absolute)
            elif is_listing_url(absolute) and absolute not in visited and absolute not in queue:
                queue.append(absolute)
    return sorted(products)


def category_from(title: str, description: str, page: str) -> str:
    text = normalize(f"{title} {description} {page}")
    if "alianca" in text:
        return "alianca"
    if any(word in text for word in ("banhado", "banhada", "folheado", "folheada", "semijoia")):
        return "semijoia"
    if any(word in text for word in ("ouro 18k", "prata 925", "joia")):
        return "joia"
    return "produto"


def parse_product(page_url: str) -> dict[str, Any] | None:
    source = fetch_text(page_url)
    structured = product_json_ld(source)
    title = first_value(structured.get("name")) or meta_content(source, "og:title")
    description = first_value(structured.get("description")) or meta_content(source, "og:description")
    image_url = first_value(structured.get("image")) or meta_content(source, "og:image") or meta_content(source, "twitter:image")
    price = parse_price(structured, source)
    if not title or not image_url or price is None:
        return None
    description = strip_tags(description)[:600]
    image_url = urllib.parse.urljoin(page_url, image_url)
    return {
        "title": strip_tags(title),
        "description": description,
        "price": price,
        "image": image_url,
        "page": page_url,
        "category": category_from(title, description, page_url),
        "search": normalize(f"{title} {description}"),
    }


def main() -> int:
    urls = discover_urls()
    print(f"Produtos descobertos: {len(urls)}")
    if len(urls) < 20:
        print("Catálogo incompleto: menos de 20 produtos encontrados.", file=sys.stderr)
        return 1

    products: list[dict[str, Any]] = []
    errors = 0
    with concurrent.futures.ThreadPoolExecutor(max_workers=8) as executor:
        futures = {executor.submit(parse_product, url): url for url in urls}
        for future in concurrent.futures.as_completed(futures):
            url = futures[future]
            try:
                item = future.result()
                if item:
                    products.append(item)
                    print(f"OK {item['title']} | {item['price']}")
                else:
                    errors += 1
                    print(f"AVISO dados incompletos: {url}", file=sys.stderr)
            except Exception as exc:
                errors += 1
                print(f"ERRO {url}: {exc}", file=sys.stderr)

    products.sort(key=lambda item: normalize(item["title"]))
    if len(products) < 20:
        print(f"Somente {len(products)} produtos válidos; atualização cancelada.", file=sys.stderr)
        return 1

    payload = json.dumps(products, ensure_ascii=False, separators=(",", ":"))
    OUTPUT.write_text(
        "// Arquivo atualizado automaticamente por scripts/sync_store_catalog.py\n"
        f"window.__CATALOGO_LOJA_EMP24K__=Object.freeze({payload});\n",
        encoding="utf-8",
    )
    print(f"Manifesto gerado com {len(products)} produtos ({errors} avisos): {OUTPUT}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
