---
title: "Swapping MicroPython for full CPython in a WASI sandbox"
description: "The user tests whether a WASI Python sandbox can swap MicroPython for full CPython, verifying startup cost, fuel limits, and a tricky zip-stdlib bug fix."
source_url: "https://claude.ai/share/a73b8b8b-8ebc-4fef-9e5c-7438e5e7ae35"
provider: "claude"
tags: ["coding", "webassembly", "python", "sandboxing", "wasi", "packaging"]
date_discovered: 2026-07-26
kind: "chat"
featured: false
curator_note: "A rare case where every claim gets measured instead of guessed: exact fuel costs, compile-vs-deserialize timings, and a real root-cause chase into why zipimport failed inside a WASI sandbox."
content_warning: ""
language: "en"
status: "live"
reddit_url: ""
---
