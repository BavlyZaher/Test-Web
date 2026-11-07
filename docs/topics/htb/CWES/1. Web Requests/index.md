---
title: "1. Web Requests"
date: "2026-09-26"
---

# Web Requests

## Section 1

### HyperText Transfer Protocol (HTTP)
- The **HyperText Transfer Protocol (HTTP)** is (**application-level protocol**) the core protocol **used for communication on the web requests**.
- `hypertext` stands for text containing links to other resources and text that the readers can easily interpret
- The default port for HTTP communication is port **`80`**
- Works on a **Client → Server** model:
    - **Client (browser / tool)** sends a request
    - **Server** processes it and returns a response
- We enter a `Fully Qualified Domain Name` (`FQDN`) as a `Uniform Resource Locator` (`URL`) to reach the desired website.
    
    `FQDN` : This is the **complete website name (part of the URL)**
    
    ```
    URL: https://www.hackthebox.com/login
    ```
    
    - `https://` → protocol
    - `www.hackthebox.com` → `FQDN`
    - `/login` → path

### URL Structure
![URL Structure](<image 1 (URL Structure).png>)


| **Component** | Example | Description |
| --- | :---: | --- |
| **Scheme** | `http://` `https://` | Defines the protocol used to access the resource. Ends with a colon and a double slash (`://`). |
| **User Info** | `admin:password@` | Optional credentials for authentication |
| **Host (FQDN)** | `inlanefreight.com` | The domain name or IP address of the server |
| **Port** | `:80` / `:443` | Specifies the port |
| **Path** | `/dashboard.php` | The specific resource or file on the server |
| **Query String** | `?id=1&user=admin` | Parameters sent to the server |
| **Fragment** | `#section1` | Used by the browser to navigate (**client-side only**) |


> **Minimum required = Scheme + Host**

### HTTP Flow (How a Request Works)

![HTTP Flow](<image 2 (HTTP Flow).png>)

#### Steps:

1. User enters a domain
2. **DNS** resolves it to an IP address
3. Browser sends an HTTP request
4. Server responds with:
    - The resource (HTML, etc.)
    - Status code (e.g., `200 OK`)

#### Important Note:

- System first checks records in the local **`/etc/hosts`**
- If not found → **queries DNS servers**

### cURL (Essential Tool)

- A command-line tool to send HTTP requests
- Very important for **web pentesting & automation**
- Basic usage: Shows raw HTML (not rendered like a browser)

    ```bash
    curl inlanefreight.com
    ```

- **Downloading Pages or Files with cURL** using the `-O`  or `-o` flag
    - Save with **original** name**:** `curl -O inlanefreight.com/index.html`
    - Save with **custom** name: `curl -o file.html inlanefreight.com/index.html`
- Important cURL Flags
    - **`-d, --data`** → Send data in a POST request
    - **`-h, --help`** → Display help information
    - **`-i, --include`** → Show response headers in output
    - **`-o, --output`** → Save output to a specific file
    - **`-O, --remote-name`** → Save file using its original name
    - **`-s, --silent`** → Suppress output (silent mode)
    - **`-u, --user`** → Provide authentication (username:password)
    - **`-A, --user-agent`** → Set a custom User-Agent
    - **`-v, --verbose`** → Show detailed request/response info
    - `-vvv` → Extra verbose More low-level details (connection, TLS, etc.)

### 📌 Question

```bash
curl <SERVER_IP>:<PORT>/download.php
```

![Answer Sec1](<image 3 (Answer Sec1).png>)

## Section 2

### Hypertext Transfer Protocol Secure (HTTPS)

One of the significant drawbacks of **HTTP** is that **all data is transferred in clear-text**

**HyperText Transfer Protocol Secure** is the secure version of **HTTP**.

- It **encrypts all communication** between client and server
- Prevents attackers from reading intercepted data (**protects against MITM attacks**)

### HTTPS Overview

❌ **HTTP (Not secure)**

- Data is sent in **clear text**
- Attackers can read credentials easily on the **same network** (public wireless network)
- Vulnerable to Man-in-the-Middle (**MITM**)


![HTTP (Not secure)](<image 4 (HTTP (Not secure)).png>)

**✅ HTTPS (Secure)**

- Data is **encrypted (single encrypted stream)**
- Even if intercepted, it **cannot be read**
- Uses **SSL/TLS encryption**

![HTTPS (Secure)](<image 5 (HTTPS (Secure)).png>)

**How HTTPS is identified**

- URL starts with: **`https://`**
- Browser shows a **lock icon 🔒**

![HTTPS is identified](<image 6 (HTTPS is identified).png>)

**Important Security Note**

- DNS may still leak visited domains if not encrypted
- Use:
    - Encrypted DNS (**`8.8.8.8 / 1.1.1.1`**)
    - **VPN** for full protection

### HTTPS Flow
![HTTPS Flow](<image 7 (HTTPS Flow).png>)


1. User tries **`http://`**
2. Server redirects to **`https://`** (port **`443`**)
3. **TLS** handshake starts:
    - Client Hello
    - Server Hello
    - Certificate exchange
4. **Secure encrypted connection** is established
5. **Normal HTTP** requests continue but **encrypted**

> **Important Security Note:**
An HTTP downgrade attack can force HTTPS to HTTP, exposing data in clear-text via a MITM proxy. Modern browsers and servers usually prevent this attack.

### cURL and HTTPS

**Normal HTTPS request:**

```bash
curl https://example.com
```

**If SSL certificate is invalid:**

- cURL blocks the request for safety

**Skip certificate check (NOT safe in real world):**

```bash
curl -k https://example.com
```

## Section 3

### HTTP Request

![HTTP Request](<image 8 (HTTP Request).png>)

#### Structure
**Purpose:** Ask the server for a resource

1. **Request Line**
    - **Method (verb)** → action (`GET`, `POST`, etc.)
    - **Path** → resource location (`/users/login.html`)
    - **Version** → HTTP version (`HTTP/1.1`)
2. **Headers**
    - Provide extra info about the request (specify various attributes of a request)
    - Examples:
        - `Host`
        - `User-Agent`
        - `Cookie`
        - `Accept`
3. **Empty Line** (important separator)
4. **Body (optional)**
    - Used mainly in `POST/PUT` requests

#### HTTP Versions

- **`HTTP/1.x`**
    - Text-based (clear text)
    - Uses newline separators
- **`HTTP/2`**
    - Binary format
    - Faster and more structured

### HTTP Response
![HTTP Response](<image 9 (HTTP Response).png>)


#### Structure
**Purpose:** Server reply to the request

1. **Status Line**
    - HTTP version (`HTTP/1.1`)
    - Status code (`200 OK`, `401 Unauthorized`)
2. **Headers**
    - Examples:
        - `Server`
        - `Content-Type`
        - `Set-Cookie`
        - `Content-Length`
3. **Empty Line**
4. **Body**
    - Can be:
        - HTML
        - JSON
        - Images / CSS / JS


### 📌 Question 1

![Question 1 Sec 3](<image 10 (Question 1 Sec 3).png>)

### 📌 Question 2

```bash
curl -I <SERVER_IP>:<PORT>
```

![Question 2 Sec 3](<image 11 (Question 2 Sec 3).png>)

## Section 4

### HTTP Headers (Overview)

- Headers = **key:value pairs** exchanged between client ↔ server
- Used to pass **metadata (not actual content)**
- Can be:
    - Request-only
    - Response-only
    - Shared

**Main Categories:**

- General Headers
- Entity Headers
- Request Headers
- Response Headers
- Security Headers

### General Headers

**Used in both requests & responses** → Describe the message itself

**Key Examples:**

- `Date` → when the message was created (UTC)
- `Connection`
    - `close` → terminate connection
    - `keep-alive` → keep connection open

### Entity Headers

**Describe the content (body/data)** → Common in responses and `POST/PUT` requests

**Key Examples:**

- `Content-Type`
    - Type of data (HTML, JSON, etc.)
    - Example: `text/html; charset=UTF-8`
- `Content-Length`
    - Size of the data
- `Content-Encoding`
    - Compression (e.g., `gzip`)
- `Transfer-Encoding: chunked`
    - The `chunked` value lets a server stream a response without knowing its total length upfront
- `Boundary`
    - A parameter of the `Content-Type` header, rather than a standalone header, used as a marker to separate content when a message contains more than one part 

??? warning 
    **Inconsistent handling** of **`Transfer-Encoding`** and **`Content-Length`** between a front-end proxy and back-end server is the root cause of **HTTP request smuggling attacks**.

### Request Headers

**Sent by the client (browser, curl)** → Describe the request, not the content

**Key Examples:**

- `Host: www.inlanefreight.com`
    - Target domain/IP
    - Important for **virtual host enumeration**
    - a common target for **Host header injection attacks**
- `User-Agent: curl/7.77.0`
    - Info about client (browser, OS)
- `Referer: http://www.inlanefreight.com/`
    - Source of the request
    - Easily spoofed (**not trustworthy**)
- `Accept: */*`
    - Supported response formats
- `Cookie: PHPSESSID=b4e4fbd93540`
    - Session / tracking data
    - Critical for **authentication**
- `Authorization: Basic cGFzc3dvcmQK`
    - Credentials or tokens (JWTs)
    - Unlike a `cookie`, the value is generated and attached by the client on every request rather than being stored and sent automatically by the browser
- `X-Forwarded-For: 203.0.113.5`  
    - Added by proxies and load balancers to record the **originating IP address** of a client whose connection is being relayed
    - it is **client-controllable**, it can often **be spoofed** to **bypass IP-based access controls, rate limiting, or blocklists**

### Response Headers

**Sent by the server**

**Key Examples:**

- `Server: Apache/2.4.41 (Ubuntu)`
    - Server type/version
    - Useful for **fingerprinting**
- `Location: https://www.inlanefreight.com/login`
    - Used with redirect status codes (`3xx`) to tell the client where the requested resource can be found
- `Set-Cookie: PHPSESSID=b4e4fbd93540; Secure; HttpOnly; SameSite=Strict`
    - Sends cookies to client
    - **`Secure`** (only send over **HTTPS**)
    - **`HttpOnly`** (inaccessible to client-side JavaScript, mitigating cookie theft via **XSS**)
    - **`SameSite`** (**`Strict`**, **`Lax`**, or **`None`**, restricting when the cookie is sent on cross-site requests as a **CSRF defense**).
- `WWW-Authenticate: Basic realm="localhost"`
    - Specifies required authentication type is sent alongside a **`401 Unauthorized`** status code

### Security Headers

**Protect against web attacks**

**Key Examples:**

- `Content-Security-Policy (CSP)`
    - **Purpose:** Prevent loading malicious scripts/resources
    - Defines **allowed sources** for content (JS, CSS, images…)
    - Example: Only allow scripts from the same domain `Content-Security-Policy: script-src 'self'`
    - Preventing attacks such as **Cross-Site Scripting (XSS)**

- `Strict-Transport-Security (HSTS)`
    - Forces **HTTPS**
    - Prevents **MITM/sniffing**

- `X-Content-Type-Options: nosniff`
    - Tells the browser to **strictly follow declared `Content-Type`** and never try to guess (`sniff`) a resource's actual MIME

- `X-Frame-Options: DENY`
    - Controls whether the page can be rendered inside a `<frame>`, `<iframe>`, or `<object`>, protecting against **clickjacking attacks**

- `Access-Control-Allow-Origin: https://www.inlanefreight.com`
    - it tells the browser which origins are allowed to read the response to a cross-origin request
    - **Misconfigurations**, such as **reflecting the requester's Origin header** or **using a wildcard (`*`)** alongside credentials, are a common source of **CORS-based vulnerabilities**.
  
- `Referrer-Policy`
    - Controls **Referer** behavior
    - Protects **sensitive data**

### cURL with Headers

**Show only headers:**

```bash
curl -I https://example.com
```

**Show headers + body:**

```bash
curl -i https://example.com
```

**Add custom header:**

```bash
curl -H "Header: value" https://example.com
```

**Change User-Agent:**

```bash
curl -A "Mozilla/5.0" https://example.com
```

### 📌 Question

![Question step 1 Sec 4](<image 12 (Question step 1 Sec 4).png>)

![Question step 2 Sec 4](<image 13 (Question step 2 Sec 4).png>)

## Section 5

### HTTP Methods

| Method | Purpose | Where Data Goes | Common Use | Security Risk |
| --- | --- | --- | --- | --- |
| `GET` | Retrieve data | URL (query string) `?param=value` | Fetch pages/data | Sensitive data in URL |
| `POST` | Send data | Request body | Forms, login, uploads | Data tampering |
| `HEAD` | Get headers only | No body | Check resource info | Recon (headers, size) |
| `PUT` | Create/replace resource | Request body | Upload/update files | Upload malicious files |
| `DELETE` | Remove resource | URL | Delete data | DoS / delete critical data |
| `OPTIONS` | Show allowed methods | N/A | Enumeration | Discover attack surface |
| `PATCH` | Partial update | Request body | API updates | Improper validation |

### HTTP Status Code Classes

| Class | Meaning | Description |
| :---: | --- | --- |
| `1xx` | Informational | Request received, continue |
| `2xx` | Success | Request processed successfully |
| `3xx` | Redirection | Client redirected |
| `4xx` | Client Error | requesting a resource that doesn't exist or requesting a bad format |
| `5xx` | Server Error | Problem on server side |

### Common HTTP Status Codes

| Code | Meaning |
| --- | --- |
| `200 OK` | Request succeeded |
| `302 Found` | Redirect |
| `400 Bad Request` | Invalid request |
| `403 Forbidden` | the client doesn't have appropriate access to the resource (Access denied) |
| `404 Not Found` | Resource not found |
| `500 Internal Server Error` | Server failure |

## Section 6

### HTTP Basic Authentication

| Item | Description |
| --- | --- |
| Type | Built-in web server authentication |
| Flow | Browser prompts for username/password |
| Format | `username:password` |
| Example creds | `admin:admin` |
| Security | ⚠️ Sent **Base64 encoded (NOT encrypted)** |

### Basic Auth Response (Unauthenticated)

`curl -i http://<SERVER_IP>:<PORT>/`

| Header / Status | Meaning |
| --- | --- |
| `401 Unauthorized` | Access denied |
| `WWW-Authenticate: Basic realm="Access denied”` | Server requires Basic Auth |
| Response body | "Access denied" |

### Authentication Methods (cURL)

| Method | Example | Notes |
| --- | --- | --- |
| Using `-u` | `curl -u admin:admin http://<SERVER_IP>:<PORT>` | Standard way |
| Using URL format | `curl http://admin:admin@<SERVER_IP>:<PORT>/` | Works in browser/curl |
| Manual header | `-H "Authorization: Basic ..."` | Direct control |

### cURL Example (GET with Auth)

```bash
curl 'http://<SERVER_IP>:<PORT>/search.php?search=le' -H 'Authorization: Basic YWRtaW46YWRtaW4='
```

### 📌 Question

![Question step 1 Sec 6](<image 14 (Question step 1 Sec 6).png>)
![Question step 2 Sec 6](<image 15 (Question step 2 Sec 6).png>)

## Section 7

### Main Benefits of POST (as stated)

1. **`Lack of Logging`**
    - Data is not part of the URL
    - Prevents large data (like files) from being logged
2. **`Less Encoding Required`**
    - URL has restrictions on characters
    - POST body can handle raw/binary data
    - Only separators need encoding
3. **`More Data Can Be Sent`**
    - URLs have length limits (~2000 chars)
    - POST does not have this limitation

### Login Forms with POST using cURL

- Login forms send credentials like:
    
    ```
    username=admin&password=admin
    ```
    
- Sending POST with cURL
    
    `curl -X POST -d 'username=admin&password=admin' http://<SERVER_IP>:<PORT>/`
    
- Redirects with cURL
    - Some apps redirect after login (e.g., `/dashboard`)
    - Use `-L` in cURL to follow redirects
- **Authenticated Cookies** with cURL
    
    `curl -b 'PHPSESSID=c1nsa6op7vtk7kdis7bcnbadf1' http://<SERVER_IP>:<PORT>/`
    
    OR
    
    `curl -H 'Cookie: PHPSESSID=c1nsa6op7vtk7kdis7bcnbadf1' http://<SERVER_IP>:<PORT>/`
    

### JSON Data with POST

- Some POST requests send data in JSON format:
    
    ```json
    {"search":"london"}
    ```
    
- Requires header `Content-Type: application/json`:
    
    ```bash
    Content-Type: application/json
    curl -X POST -d '{"search":"london"}' -b 'PHPSESSID=c1nsa6op7vtk7kdis7bcnbadf1' -H 'Content-Type: application/json' http://<SERVER_IP>:<PORT>/search.php
    ```
    

### 📌 Question

![Question step 1 Sec 7](<image 16 (Question step 1 Sec 7).png>)
![Question step 2 Sec 7](<image 17 (Question step 2 Sec 7).png>)

## Section 8

### APIs (Core Idea)

- APIs are used to **interact with a database**
- You can:
    - Specify the **table** (e.g. `/city`)
    - Specify the **row/entity** (e.g. `/london`)
- Then use an **HTTP method** to perform an operation

Example:

```bash
/api.php/city/london
```

### CRUD Operations

APIs typically support 4 main operations:

- **Create (`POST`)** → add new data
- **Read (`GET`)** → retrieve data
- **Update (`PUT`)** → modify data
- **Delete (`DELETE`)** → remove data
- These operations are used in:
    - CRUD APIs
    - REST APIs

### Read (`GET`)

- Used to **retrieve data from the API**
- Examples:
    - `/city/london` → get specific city
    - `/city/le` → search results
    - `/city/` → get all entries
- Response is returned as **JSON**
- Can be formatted using tools like `jq`
  ```bash
  curl -s 154.57.164.79:32471/api.php/city/london | jq
  ```  

### Create (`POST`)

- Used to **add new data**
- Send data as **JSON in request body**
- Must include: `Content-Type: application/json`
    
```bash
curl -X POST http://<SERVER_IP>:<PORT>/api.php/city/ -d '{"city_name":"HTB_City", "country_name":"HTB"}' -H 'Content-Type: application/json'
```
    
![Create API](<image 18 (Create API).png>)

### Update (`PUT`)

- Used to **modify existing data**
- Must:
    - Specify the target entity in URL (`/city/london`)
    - Send updated data in JSON
- Result:
    - Old data is replaced with new data
- Note:
    - Some APIs may create data if it doesn’t exist (not always)

```bash
curl -X PUT http://<SERVER_IP>:<PORT>/api.php/city/london -d '{"city_name":"New_HTB_City", "country_name":"HTB"}' -H 'Content-Type: application/json'
```

![Update API](<image 19 (Update API).png>)

### DELETE

- Used to **remove data**
- Simply:
    - Specify entity in URL
    - Use DELETE method

```bash
curl -X DELETE http://<SERVER_IP>:<PORT>/api.php/city/New_HTB_City
```

### 📌 Question

![Question Sec 8](<image 20 (Question Sec 8).png>)