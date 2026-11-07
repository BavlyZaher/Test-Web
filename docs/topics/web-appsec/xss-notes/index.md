---
title: XSS Notes
tag: WEB
labels: XSS
date: "2026-09-15"
tags:
  - web
  - xss
---

# XSS Notes

> مقال تجريبي — امسح المحتوى ده واكتب مكانه.

## Reflected XSS

النوع ده بيحصل لما الإدخال بيترجع في الـ response على طول من غير encoding.

```http
GET /search?q=<payload> HTTP/1.1
Host: target.tld
```

Sec-Notes. "HTML Injection — Escalation Tricks." Sec-Notes, September 22, 2026. http://127.0.0.1:8000/topics/web-appsec/html-injection-tricks/

!!! warning "ملاحظة"
    اختبر دايمًا على أنظمة عندك إذن مكتوب بالاختبار عليها.

## Context matters

| Context | Encoding المطلوب |
| --- | --- |
| HTML body | HTML entity encoding |
| Attribute | Attribute encoding + quotes |
| JavaScript | JS string escaping |
| URL | URL encoding |

## Checklist

- [x] حدد الـ injection context
- [ ] جرب تكسر الـ context
- [ ] اتأكد من الـ CSP
