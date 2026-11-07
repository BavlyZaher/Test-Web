---
title: "Subdomain Enumeration Full Guide"
tag: WEB
labels: Subdomain Enumeration, RECON
date: "2026-10-05"
tags:
  - web
  - Subdomain Enumeration
  - RECON
---

# Subdomain Enumeration Full Guide

## 1. Fundamentals of Subdomain Enumeration
> Subdomain enumeration is the **foundational starting point** of modern web reconnaissance and bug bounty hunting. Finding hidden, forgotten, or unindexed subdomains expands your target's attack surface and unlocks unique vulnerabilities before other security researchers discover them.


### What is a Subdomain?
A domain name follows a hierarchical structure:

* **Top-Level Domain (TLD):** `.com`, `.org`, `.net`, `.io`.
* **Root Domain (Apex/Second-Level Domain):** The primary organizational domain (`example.com`, `paypal.com`).
* **Subdomain:** A child domain created under the root domain (`blog.example.com`, `api.paypal.com`, `drive.google.com`).

Organizations use subdomains to **separate distinct** environments, web applications, microservices, and internal administrative portals.

### Passive vs. Active Enumeration
* **Passive Enumeration:** Gathers subdomains from third-party databases, search archives, and public logs **without sending direct network packets to the target's servers**. It is 100% stealthy and leaves no traces in server logs.
* **Active Enumeration:** **Directly interacts with target name servers**, web application firewalls (WAFs), and DNS infrastructure via direct queries, brute-forcing, HTTP requests, or web crawling.

## 2. Passive Subdomain Enumeration

### Certificate Transparency
> **Certificate Transparency (CT) logs** are public, append-only records of every SSL/TLS certificate issued by Certificate Authorities (CAs), making them a powerful, passive source for subdomain enumeration.

**Manual Search:** [crt.sh](https://crt.sh/) — search `%.example.com`

**Command line:**

```bash
curl -s 'https://crt.sh/?q=%25.example.com&output=json' \
  | jq -r '.[].name_value' \
  | tr '\r' '\n' \
  | sed 's/^\*\.//' \
  | sort -u
```

### Subfinder
> **Reference:** *[Recon with Me !!! — Dhiyanesh Geek](https://dhiyaneshgeek.github.io/bug/bounty/2020/02/06/recon-with-me/)* This section summarizes and expands on the practical lessons described by **Dhiyanesh Geek** regarding the importance of configuring API keys in Subfinder before relying on its output.
>
> Subfinder's true power comes from its passive API sources. Without API keys, you're only scratching the surface. With free API keys configured (`~/.config/subfinder/provider-config.yaml`), Subfinder queries dozens of additional databases — in Dhiyanesh Geek's documented case, this produced **114,817 extra subdomains** compared to running without keys.
>
> The only downside is slightly slower scans. Store keys in the config file — never hardcode them. Recommended free sources: `binaryedge`, `censys`, `certspotter`, `chaos`, `github`, `intelx`, `passivetotal`, `robtex`, `securitytrails`, `shodan`, `urlscan`, `virustotal`, `zoomeye`.

**verify that your API keys are actually working, use -v (verbose):**
```bash
subfinder -d example.com -v
```
> The verbose output **shows which sources succeeded**, which failed, and how many results each returned. A source returning 0 results or showing an error is the real sign of a broken key.

**Single Domain**
```bash
subfinder -d example.com -all -silent -recursive -o subs0.txt
```

**File of Domains**
```bash
subfinder -dL domains.txt -all -silent -recursive -o subs0.txt
```

### Amass
Amass supports both **passive** and **active** enumeration, making it more versatile than purely passive tools.

**Passive** (stealthy — no target traffic):

```bash
amass enum -passive -d example.com -o subs1.txt
```

**Active + Brute Force**:

```bash
amass enum -active -brute -w /path/to/wordlist.txt -d example.com -o amass-brute.txt
```

### Other Passive Tools

```bash
assetfinder --subs-only example.com > subs2.txt
github-subdomains -d example.com -t <GITHUB_TOKEN> -o subs3.txt
subdominator -d example.com -o subs4.txt
sublist3r -d example.com -o subs5.txt
findomain -t example.com -u subs6.txt
chaos -d example.com -silent -o subs7.txt
```

### Web-Based Passive Enumeration Sites
```text
https://www.subdomain.center/
https://subdomainfinder.c99.nl/
https://securitytrails.com/
https://dnsrobot.net/subdomain-finder
https://dnsdumpster.com/
https://rapiddns.io/
https://hackertarget.com/find-dns-host-records/
https://viewdns.info/subdomains/?domain=example.com
https://www.virustotal.com/vtapi/v2/domain/report?apikey=<add Your apikey>&domain=example.com
```
> **Cleaning tip**: After using each site, select all results (Ctrl + A), copy them, and paste them into [**domain-extractor**](https://rakko.tools/en/tools/domain-extractor) to strip everything except the subdomains. Repeat per site, then merge them in one file `subs8.txt`.

### Merge All Results

```text
subs0.txt    →  Subfinder
subs1.txt    →  Amass
subs2.txt    →  Assetfinder
subs3.txt    →  github-subdomains
subs4.txt    →  Subdominator
subs5.txt    →  Sublist3r
subs6.txt    →  Findomain
subs7.txt    →  Chaos
subs8.txt    →  All Sites
```
**Merge Everything Into One File and remove duplicate**

```bash
cat subs*.txt | sort -u > all_passive.txt
```

### Google Dorking

```text
site:example.com
site:*.example.com
site:*.example.com -site:www.example.com
```
**Environment terms:**

```text
site:example.com dev
site:example.com staging
site:example.com api
site:example.com admin
site:example.com portal
site:example.com login
```

**Iterative dorking** — exclude known hosts to reveal new ones:
```text
site:*.example.com -site:www.example.com -site:mail.example.com -site:blog.example.com
```

### Archives

```bash
# gau
gau --subs example.com > gau.txt
cat live_hosts.txt | gau --subs | anew archived_urls.txt

# waybackurls
echo "example.com" | waybackurls | anew wayback.txt

# Wayback CDX API
curl -s "https://web.archive.org/cdx/search/cdx?url=*.example.com/*&output=text&fl=original&collapse=urlkey" | anew cdx_urls.txt
```

**Extract hostnames from archived URLs:**

```bash
cat cdx_urls.txt | awk -F/ '{print $3}' | sort -u
```

## 3. Active Subdomain Enumeration

### DNS Brute-Forcing

> **Passive** asks: What has already been **exposed**?
>
> **Brute force** asks: What might exist but was **never indexed**?

**Wordlist sources:**
> The largest wordlist is not automatically the best wordlist.

- SecLists DNS lists (`subdomains-top1million-110000.txt`)
- Assetnote (`best-dns-wordlist.txt`)
- Commonspeak2
- Jhaddix `all.txt`

**Build a target-specific wordlist:**

**Suppose passive enumeration discovers:**

```text
api.example.com
billing.example.com
customer.example.com
portal.example.com
```

**Extract vocabulary:**

```text
api
billing
customer
portal
```

**Add environment terminology (`env_words.txt`):**

```text
dev
test
qa
uat
stage
staging
prod
production
beta
alpha
sandbox
old
legacy
backup
internal
private
admin
```

**Then generate combinations:**
```text
billing-dev
billing-stage
billing-api
api-v2
portal-dev
customer-api
```

This is often **more efficient** than blindly brute-forcing millions of unrelated words.

**Extract words from discovered subdomains:**
```bash
cat subs.txt | sed 's/\..*//' | sort -u > custom_words.txt
cat custom_words.txt env_words.txt | sort -u > targeted_wordlist.txt
```

### Brute-Force Tools
> **Download:** *[Trickest Resolvers](https://raw.githubusercontent.com/trickest/resolvers/main/resolvers.txt)* DNS server that translates domain names into IP addresses

```bash
# dnsx — lightweight DNS brute-forcer
dnsx -silent -d target.com -w wordlist.txt -r resolvers.txt -o dnsx_brute.txt

# PureDNS
puredns bruteforce wordlist.txt target.com -r resolvers.txt -o puredns.txt

# ShuffleDNS
shuffledns -d target.com -w wordlist.txt -r resolvers.txt -o shuffledns.txt
```

### DNS Resolution Tools

The difference between brute-forcing and resolution:

- **Brute force:** test new words against a domain
- **Resolution:** take an existing candidate list (from CT, passive sources, etc.) and check which names currently resolve

```bash
# candidates.txt --> All subdomain files from all sources merged into one
puredns resolve candidates.txt -r resolvers.txt -w resolved.txt
dnsx -silent -l candidates.txt -a -aaaa -cname -resp
```

## 4. Permutations and Mutations

### Why Wordlists Are Not Enough

If you find `api.example.com`, a normal wordlist won't find:

```
api-dev.example.com
api-v2.example.com
dev-api.example.com
api.dev.example.com
```

> The problem isn't missing words — it's missing **patterns**.

### Permutations

Organizations reuse naming conventions. If one name exists, related names likely exist too.

**Common patterns to combine with discovered names:**

| Type | Examples |
|---|---|
| **Environment** | `dev, test, qa, uat, stage, staging, prod, beta, alpha, sandbox, legacy, old, backup, internal, private` |
| **Numeric** | `api1, api2, api01, web01, app01, v1, v2, v3` |
| **Region** | `us, eu, uk, apac, us-east, eu-west` |

**Structural combinations** (from `api` + environment words):

```
{{sub}}-{{word}}.{{suffix}}      →  api-dev.example.com
{{word}}-{{sub}}.{{suffix}}      →  dev-api.example.com
{{word}}.{{sub}}.{{suffix}}      →  dev.api.example.com
{{sub}}.{{word}}.{{suffix}}      →  api.dev.example.com
```

**Tooling:**

```bash
# alterx — pattern-based permutations
cat resolved.txt | alterx -silent > permutations.txt

# Gotator — advanced permutations with depth control
gotator -sub live_subs.txt -perm words.txt -depth 1 -numbers 10 -mindup -adv -md | sort -u > permutations.txt
```

**Resolve the candidates:**

```bash
puredns resolve permutations.txt -r resolvers.txt
```

> Generated names are **only candidates** until DNS confirms them.

### Recursive Enumeration

Use discovered subdomains as **new roots**.

```
api.example.com
  ↓
dev.api.example.com
internal.api.example.com
admin.api.example.com
```

**When useful:** Deep naming patterns like `prod.api.example.com`, `us-east.api.example.com`.

**When not:** Flat naming like `www`, `api`, `mail`.

**How:**

1. Count the most frequent 2nd/3rd-level zones in your results
2. Re-run passive tools against those intermediate roots
3. Merge and resolve



### Flow of All Passive and Active Enumeration

```
Phase 1: Passive
Subfinder, Amass, crt.sh, gau, ...
        ↓
Phase 2: Active
Brute-Force, Permutations, Recursive
        ↓
Phase 3: Merge
cat *.txt | sort -u > candidates.txt
        ↓
Phase 4: DNS Resolution
dnsx -l candidates.txt -o resolved.txt
        ↓
Phase 5: HTTP Probing
httpx -l resolved.txt -o live.txt
```

## 5. Virtual Host Enumeration

### DNS vs VHost

> **DNS brute force:** *Does `foo.example.com` exist in DNS?*
>
> **VHost fuzzing:** *Does the web server behave differently when `Host: foo.example.com`?*

**A single IP may host multiple applications:**

```
www.example.com
admin.example.com
internal.example.com
dev.example.com
```

The server decides which app to serve based on the HTTP `Host` header — even when DNS doesn't expose every hostname.

### Step 1: Add the Target to `/etc/hosts`

Before running any VHost fuzzing tool, map the target IP to its domain locally:

```bash
sudo nano /etc/hosts
203.0.113.10    target.com
```

This ensures the hostname resolves to the correct IP — essential for HTTPS/SNI, browser testing, and tools that don't support custom IP resolution.

### Step 2: VHost Fuzzing

```bash
# ffuf
ffuf -w wordlist.txt -u https://target.com -H "Host: FUZZ.target.com" -fc 403,404 -ac

# Gobuster
gobuster vhost -u https://target.com --useragent "Pentest-Recon" -w wordlist.txt
```

### False Positive Filtering

Servers often return a **default fallback page** for any unknown `Host` header — producing thousands of false positives if you only filter by status code.

**Filter by response metrics:**

| Flag | Filters by |
|---|---|
| `-fs` | Response size |
| `-fw` | Word count |
| `-fl` | Line count |
| `-ac` | Auto-calibration (baseline detection) |

**Behavioral differences matter:** if every candidate returns the same `200`, same size, same title — they're likely the default vhost, not real hosts.

## 6. Infrastructure-Based Enumeration

### Horizontal vs Vertical

**Vertical:** `example.com` → `*.example.com` → `*.api.example.com`

**Horizontal:** `example.com` → IP → ASN → CIDR → PTR → hostnames

### ASN & IP Ranges
> **ASN (Autonomous System Number)** is a unique number that identifies a large network managed by a single organization.

**Find ASN via [bgp.he.net](https://bgp.he.net) or [HackerTarget](https://hackertarget.com/as-ip-lookup/) or using `whois`

```bash
dig +short tesla.com
whois <Target_ip>
amass intel -org "Tesla"
```

**Find the IP Ranges Inside an ASN:**

```bash
whois -h whois.radb.net -- '-i origin AS394161' | grep -oE '([0-9]{1,3}\.){3}[0-9]{1,3}/[0-9]+' | sort -u >> ip_ranges.txt
echo "AS394161" | asnmap -silent >> ip_ranges.txt
```

> ASN ownership ≠ every IP in scope. Verify authorization.

### Reverse DNS (PTR)
> Once you have the IP ranges (ip_ranges.txt), the next step is reverse DNS — **turning IPs back into hostnames**.

#### 1. Expand CIDRs into Individual IPs

```bash
cat ip_ranges.txt | mapcidr -silent > ips.txt
```

#### 2. Reverse DNS (PTR Lookups)

```bash
cat ips.txt | dnsx -ptr -resp-only -o ptr_records.txt
```

**Or in one pipeline:**

```bash
cat ip_ranges.txt | mapcidr -silent | dnsx -ptr -resp-only -o ptr_records.txt
```

#### 3. Filter Results to Your Target

```bash
grep -E '\.tesla\.com$' ptr_records.txt | sort -u > tesla_hostnames.txt
```

## 7. Data Processing & Validation

### Merging

Combine all source files into one deduplicated list:

```bash
cat recon/*.txt \
  | tr 'A-Z' 'a-z' \
  | sed 's/^\*\.//' \
  | sed 's/\.$//' \
  | sort -u \
  > recon/all-passive.txt
```

- `tr 'A-Z' 'a-z'` → lowercase everything
- `sed 's/^\*\.//'` → strip wildcard prefix (`*.example.com` → `example.com`)
- `sed 's/\.$//'` → strip trailing dot
- `sort -u` → deduplicate


### Resolve Everything

```bash
# DNS resolution with wildcard filtering
puredns resolve all-passive.txt -r resolvers.txt -w resolved.txt

# Extract specific records
dnsx -silent -l resolved.txt -a -aaaa -cname -resp
```


### HTTP Probing

```bash
httpx -l resolved.txt -silent -status-code -title -tech-detect -follow-redirects -o httpx.txt
```

### Status Codes

Do not filter on `200` only. Useful responses include `200, 301, 302, 307, 401, 403, 404, 500`.

| Status | Triage |
|---|---|
| **200** | Primary attack surface |
| **3xx** | Follow redirect — may reveal another hostname |
| **401** | Test default creds, inspect headers |
| **403** | Bypass techniques (headers, path tricks, VHost) |
| **404** | Check Wayback/CDX for deprecated endpoints |
| **500** | High-value for injection testing |