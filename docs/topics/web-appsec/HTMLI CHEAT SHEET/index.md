---
title: "HTML Injection Cheat Sheet"
tag: WEB
labels: HTMLI, PHISHING
date: "2026-09-22"
tags:
  - web
  - html-injection
  - phishing
---

# HTML Injection — Bug Bounty Cheat Sheet

> Fast reference for authorized web application security testing.

---

## 1. Core Concept

```text
HTML Injection =
Untrusted input
+
Unsafe HTML rendering
```

Ask:

```text
Can I control the input?
Where does it land?
Is it encoded?
Does the browser parse it as HTML?
What impact can I demonstrate?
```

---

## 2. First Payloads

```html
<b>TEST</b>
```

```html
<i>TEST</i>
```

```html
<h1>TEST</h1>
```

```html
<div>TEST</div>
```

```html
<span>TEST</span>
```

```html
<a href="/test">TEST</a>
```

```html
<img src="/test.png" alt="TEST">
```

---

## 3. Marker

Start with:

```text
HTMLTEST-12345
```

Search for it in:

```text
Response
Page Source
DOM
Rendered Page
```

---

## 4. Context Identification

### HTML

```html
<div>INPUT</div>
```

### Attribute

```html
<input value="INPUT">
```

### href

```html
<a href="INPUT">
```

### src

```html
<img src="INPUT">
```

### JavaScript

```html
<script>
let x = "INPUT";
</script>
```

### DOM

```javascript
element.innerHTML = INPUT;
```

---

## 5. Attribute Boundary Test

If input is inside:

```html
<input value="INPUT">
```

test:

```text
TEST"TEST
```

Inspect whether the quote is safely encoded:

```html
TEST&quot;TEST
```

---

## 6. Common Dangerous DOM Sinks

```javascript
innerHTML
outerHTML
insertAdjacentHTML()
document.write()
document.writeln()
```

---

## 7. Common DOM Sources

```javascript
location.search
location.hash
location.pathname
document.referrer
postMessage
localStorage
sessionStorage
```

---

## 8. Stored vs Reflected

```text
REFLECTED

Request
  ↓
Response
  ↓
Browser
```

```text
STORED

Request
  ↓
Database
  ↓
Later response
  ↓
Browser
```

```text
DOM

Source
  ↓
JavaScript
  ↓
HTML sink
  ↓
DOM
```

---

## 9. HTML Encoding

| Character | Entity |
|---|---|
| `&` | `&amp;` |
| `<` | `&lt;` |
| `>` | `&gt;` |
| `"` | `&quot;` |
| `'` | `&#x27;` |

---

## 10. Base Tag

```html
<base href="https://controlled.example/">
```

Purpose:

```text
Changes resolution of relative URLs.
```

Check:

```text
Relative scripts
Relative stylesheets
Relative images
Relative links
```

Defense:

```http
Content-Security-Policy: base-uri 'self'
```

---

## 11. Burp Workflow

```text
Proxy
  ↓
Capture request
  ↓
Send to Repeater
  ↓
Insert unique marker
  ↓
Find reflection
  ↓
Identify context
  ↓
Test harmless HTML
  ↓
Inspect DOM
  ↓
Determine impact
  ↓
Document evidence
```

---

## 12. Burp Search Terms

Search responses for:

```text
HTMLTEST
<b>
<i>
<div>
<input
href=
src=
innerHTML
```

---

## 13. DevTools

### Elements

Check parsed DOM.

### Network

Check resource requests.

### Sources

Search JavaScript for:

```text
innerHTML
outerHTML
insertAdjacentHTML
document.write
```

---

## 14. False Positive Checks

```text
Is the payload HTML-encoded?
Is it inside a textarea?
Is it inside an HTML comment?
Is it only present in source but not parsed?
Is it displayed as literal text?
```

Reflection alone ≠ HTML Injection.

---

## 15. Impact

Possible impact categories:

```text
Visual modification
Stored page manipulation
Cross-user rendering
Form manipulation
Resource manipulation
Base URL manipulation
Phishing
Potential XSS escalation
```

Only claim demonstrated impact.

---

## 16. Quick Report

```markdown
# HTML Injection in `[PARAMETER]`

## Summary

The `[PARAMETER]` parameter allows attacker-controlled HTML to be
rendered as markup.

## Payload

```html
<b>HTMLTEST</b>
```

## Steps

1. Open `[URL]`.
2. Submit the affected parameter.
3. Insert the payload.
4. Submit the request.
5. Observe that the payload is rendered as HTML.

## Expected

Input should be treated as text or safely sanitized.

## Actual

Attacker-controlled HTML is interpreted by the browser.

## Impact

The attacker can manipulate HTML content in the affected context.

## Remediation

Use context-appropriate output encoding. If HTML is intentionally
supported, sanitize it with a mature HTML sanitizer.
```

---

## 17. Final 30-Second Checklist

```text
[ ] Find input
[ ] Add unique marker
[ ] Find reflection
[ ] Identify context
[ ] Test <b>TEST</b>
[ ] Check encoding
[ ] Check stored behavior
[ ] Check DOM sinks
[ ] Check impact
[ ] Capture evidence
[ ] Write reproducible report
```

---

## Golden Rule

> **Do not hunt by payload alone. Hunt by context.**

```text
INPUT
  ↓
CONTEXT
  ↓
PARSING
  ↓
HTML INTERPRETATION
  ↓
IMPACT
```

The ability to understand this chain is more valuable than memorizing a
large payload list.

---

### References

- OWASP WSTG — https://wstg.owasp.org/v4.2/4-Web_Application_Security_Testing/11-Client-side_Testing/03-Testing_for_HTML_Injection/
- OWASP XSS Prevention — https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html
- PortSwigger XSS Contexts — https://portswigger.net/web-security/cross-site-scripting/contexts
- MITRE CWE-79 — https://cwe.mitre.org/data/definitions/79.html
- Invicti — https://www.invicti.com/learn/html-injection
- Qualys — https://blog.qualys.com/product-tech/2013/05/30/finding-html-injection-vulns-part-i
- Punk Security — https://punksecurity.co.uk/blog/base_tag_injections/
