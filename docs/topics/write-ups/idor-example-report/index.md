---
title: "How I Found an IDOR in a Bug Bounty Program"
date: "2026-09-25"
excerpt: "مثال كامل لتقرير bug bounty — من اكتشاف الـ IDOR لحد التوثيق الكامل."
cover_image: "diagram-1.png"
cover_icon: "🔓"
labels: IDOR, BAC
---

# How I Found an IDOR in a Bug Bounty Program

مقال مثال — امسح المحتوى ده واكتب تقريرك الحقيقي مكانه.

الصورة اللي بتستخدمها كـ cover لازم تكون **جوه نفس فولدر المقال ده بالظبط** (`docs/topics/write-ups/idor-example-report/`), واكتب اسم الملف بس في `cover_image` زي ما هو فوق — الموقع بيحسب المسار الصحيح تلقائي أيًا كانت الصفحة اللي عارضة الكارت.

## Summary

لخّص هنا إيه الثغرة، وإزاي لقيتها، وإيه الـ impact.

## Steps to Reproduce

1. اعمل حساب على `/account/1234`
2. غيّر الـ ID في الطلب لحساب حد تاني
3. لاحظ إن السيرفر رجّع بيانات الحساب التاني من غير أي تحقق صلاحيات

## Severity

Critical — Broken Access Control بيسمح بقراءة بيانات أي مستخدم من غير أي تحقق.

## Recommendation

اقترح هنا الإصلاح (object-level authorization check قبل ما ترجّع أي بيانات).
