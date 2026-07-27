#!/usr/bin/env python3
import urllib.parse  # Ensures urllib.parse is available to the synchronized script.

namespace = {"__name__": "__main__", "__file__": "scripts/sync_official_catalog.py"}
with open("scripts/sync_official_catalog.py", encoding="utf-8") as source:
    exec(compile(source.read(), "scripts/sync_official_catalog.py", "exec"), namespace)
