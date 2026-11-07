# Sec-Notes

موقع مقالات شخصي مبني بـ [MkDocs Material](https://squidfunk.github.io/mkdocs-material/).

## تشغيل محلي

```bash
python -m venv .venv
source .venv/bin/activate        # على ويندوز: .venv\Scripts\activate
pip install -r requirements.txt
mkdocs serve
```

افتح http://127.0.0.1:8000

## النشر على GitHub Pages

1. اعمل ريبو جديد على GitHub وارفع الملفات دي:

```bash
git init
git add .
git commit -m "init"
git branch -M main
git remote add origin https://github.com/USERNAME/REPO.git
git push -u origin main
```

2. الـ workflow هيشتغل لوحده وينشئ فرع `gh-pages`.
3. روح **Settings → Pages** واختار Branch = `gh-pages` / `root`.
4. الموقع: `https://USERNAME.github.io/REPO/`

## النشر على GitLab Pages

امسح مجلد `.github/` وسيب `.gitlab-ci.yml`، وارفع على GitLab. الموقع هيطلع على
`https://USERNAME.gitlab.io/REPO/`.

## دومين خاص

1. أنشئ ملف `docs/CNAME` جواه سطر واحد: `blog.yourdomain.com`
2. عند مزوّد الدومين اعمل CNAME record يشاور على `USERNAME.github.io`
3. Settings → Pages → اكتب الدومين وفعّل Enforce HTTPS

## إضافة مقال جديد

المقالات دلوقتي متنظمة في فولدرات: `docs/topics/<اسم-التوبيك>/<اسم-المقال>/index.md` — **مكان الملف نفسه هو اللي بيحدد التوبيك**، مفيش حاجة تكتبها في الـ front matter غير العنوان والتاريخ.

1. اعمل الفولدر والملف، مثلاً لمقال جديد في Web AppSec:

```
docs/topics/web-appsec/idor-notes/index.md
```

```markdown
---
title: "IDOR Notes"
date: "2026-09-25"
---

# IDOR Notes

المحتوى هنا...
```

2. `git push` — وخلاص. التوبيك بيتحدد من اسم الفولدر (`web-appsec`)، والتاج (WEB/NET/AI/API/DEV) بيتحدد تلقائي حسب التوبيك (تقدر تحدده يدوي بإضافة `tag: WEB` لو عايز تاج مختلف). وقت القراءة بيتحسب من عدد الكلمات الحقيقي وقت الـ build.

> التوبيكات المتاحة حاليًا: `web-appsec`, `network-security`, `ai-security`, `api-sec`, `programming`, `htb`. لو عايز توبيك جديد، ضيفه في `SN_TOPICS` جوه `site.js` وفي `TOPIC_TAG_MAP` جوه `hooks.py`.

> لو الملف مالوش `date` في الـ front matter، مش هيظهر في أي قائمة أوتوماتيكية (بيتعامل معاه كمسودة).

### مستوى إضافي: شهادات/كورسات جوه توبيك

لو عايز تجمع مجموعة مقالات جوه شهادة أو كورس معين (زي مسار CPTS جوه HTB)، ضيف مستوى فولدر واحد إضافي:

```
docs/topics/htb/cpts/module-1/index.md
docs/topics/htb/cpts/module-2/index.md
```

صفحة التوبيك (HTB) هتعرض المقالات دي مجمّعة تلقائي تحت عنوان "📂 CPTS" بدل ما تتلخبط مع باقي مقالات التوبيك. اسم المجموعة الافتراضي مأخوذ من اسم الفولدر (بالحروف الكبيرة)؛ لو عايز اسم مختلف، ضيف `collection_title: "اسم مخصص"` في الـ front matter.

## كتل التنبيه الملوّنة (Admonitions)

جاهزة افتراضيًا في الثيم، استخدمها في أي مقال:

```markdown
!!! danger "عنوان"
    نص التحذير.

!!! tip "عنوان"
    نصيحة أو أداة موصى بيها.

!!! note "عنوان"
    توضيح نظري.
```

## فلترة داخل التوبيك (labels)

كل توبيك دلوقتي عنده فلترة خاصة بيه بحاجات أدق من التاج العام (WEB/NET...) — زي أنواع الثغرات جوه Web AppSec مثلاً. ضيف السطر ده في الـ front matter:

```yaml
labels: XSS, SQLi
```

لو التوبيك فيه أكتر من قيمة label مختلفة بين مقالاته، فلتر بأزرار بيظهر تلقائي فوق القائمة. مفيش حد أقصى لعدد الـ labels ولا قايمة مسبقة — أي كلمة تكتبها هتظهر كفلتر.

## All Content vs Write-ups

- **All Content** (`docs/articles/index.md`): بتجمع كل مقال في الموقع من كل التوبيكات، وبتتفلتر بس بتاج التوبيك (WEB/NET/AI...) — مش بالـ labels.
- **Write-ups** (`docs/topics/write-ups/`): توبيك مستقل زي أي توبيك تاني، ليه فولدره الخاص. حط فيه الـ box walkthroughs وbug bounty reports الكاملة.

## مميزات القراءة

- اختصارات: `[` القايمة الشمال · `]` الـ TOC اليمين · `/` بحث.
- الـ TOC (`toc.css` + `toc.js`) على شكل خريطة مترو: العناوين محطات والخط بيتلوّن كل ما تعدّي محطة، وخط التقدّم تحت العنوان بيبيّن نسبة قراءتك. بيشتغل مع العناوين العربي والإيموجي.
- الضغط على اسم الموقع (الهيدر أو الكارت في القايمة الشمال) بيرجّعك للداشبورد.
- الكاتب: في الـ front matter اكتب `author: your-name` أو `co-founder`.

الموقع مش بيخزّن حاجة في المتصفح (مفيش localStorage من عندنا) — القوايم بترجع مفتوحة مع كل زيارة. الوحيد اللي بيخزّن هو اختيار الدارك/لايت اللي بيجي من Material نفسه. الخطوط بتتحمّل من Google Fonts (من غير نت هيستخدم خطوط النظام). البحث مفعّل بالإنجليزي والعربي (`lang: [en, ar]`).

- على الموبايل بيظهر زرار عايم للأقسام بيفتح قايمة من تحت، وعلى التابلت والديسكتوب الـ TOC على اليمين.
- "Finished reading" والتايمر وشريط التقدّم بيظهروا في المقالات بس.
- مكتبة Mermaid متضمّنة محلياً في `docs/javascripts/vendor/` (3.5MB) فالدياجرام والبحث شغالين من غير نت. لو عايز تحدّثها بدّل الملف ده.
- زرار الريبو اتشال؛ ضيف `repo_url` و`repo_name` في `mkdocs.yml` لو عايزه يرجع.

## المشاركة (Social card)
كل مقال بيطلع له وصف وصورة معاينة 1200×630 أوتوماتيك من العنوان (محتاج Pillow وخط في السيستم، وإلا بتتستخدم `docs/assets/social-default.png`). الوصف من `description:` أو `excerpt:` في الـ front matter، وإلا أول فقرة. صورة مخصصة: `cover_image:`. **مهم:** فعّل `site_url` في `mkdocs.yml` عشان واتساب وX ولينكدإن بيتجاهلوا الروابط النسبية.

## صفحة About Us

الكروت بتتعدّل من `SN_ABOUT` في أول `docs/javascripts/site.js`. كل شخص ليه: `name` و`role` و`bio` و`skills` و`certificates` و`hallOfFame` و`socials`. أيقونات التواصل المدعومة: `github` `linkedin` `twitter` `facebook` `youtube` `telegram` `discord` `instagram` `website` `email` — اللي تسيبه فاضي مش بيظهر. الكروت دايماً بنفس الحجم والصفوف متحاذية مهما كان طول النص. البيانات الحالية أمثلة، بدّلها ببياناتك. عدد المقالات بيتحسب لوحده من `author:` في الـ front matter.

## قبل ما ترفع

بدّل `username` و `Your Name` و `you@example.com` في `mkdocs.yml` و `docs/javascripts/sidebar-profile.js` (كائن `SN_PROFILE`).
