---
title: Recon Workflow
tag: NET
labels: RECON
date: "2026-09-18"
author: your-name
tags:
  - recon
---

# Recon Workflow

> مقال تجريبي — امسح المحتوى ده واكتب مكانه.

## 1. Subdomain enumeration

```bash
subfinder -d target.tld -all -silent | anew subs.txt
```

## 2. Probing

```bash
httpx -l subs.txt -sc -title -tech-detect -o live.txt
```

## 3. Content discovery

=== "ffuf"

    ```bash
    ffuf -u https://target.tld/FUZZ -w wordlist.txt -mc all -fc 404
    ```

=== "feroxbuster"

    ```bash
    feroxbuster -u https://target.tld -w wordlist.txt
    ```

??? note "ليه الترتيب ده؟"
    كل خطوة بتغذي اللي بعدها، فالنتايج بتفضل متراكمة في ملفات منفصلة.
