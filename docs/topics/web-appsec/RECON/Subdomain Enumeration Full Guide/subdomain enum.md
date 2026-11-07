# 120. Complete Passive Pipeline

```bash
DOMAIN=example.com

mkdir -p recon

subfinder \
  -d "$DOMAIN" \
  -all \
  -silent \
  -o recon/subfinder.txt

amass enum \
  -passive \
  -d "$DOMAIN" \
  -o recon/amass.txt

assetfinder \
  --subs-only "$DOMAIN" \
  > recon/assetfinder.txt

findomain \
  -t "$DOMAIN" \
  -q \
  > recon/findomain.txt

cat \
  recon/subfinder.txt \
  recon/amass.txt \
  recon/assetfinder.txt \
  recon/findomain.txt \
  | tr '[:upper:]' '[:lower:]' \
  | sed 's/^\*\.//' \
  | sed 's/\.$//' \
  | sort -u \
  | grep -E "(^|\.)${DOMAIN//./\\.}$" \
  > recon/all-passive.txt
```

---

# 121. Resolve the Passive Dataset

```bash
dnsx \
  -l recon/all-passive.txt \
  -silent \
  -auto-wildcard \
  -o recon/resolved.txt
```

Then collect records:

```bash
dnsx \
  -l recon/resolved.txt \
  -silent \
  -a \
  -aaaa \
  -cname \
  -resp \
  > recon/dns-records.txt
```

---

# 122. HTTP Validation

```bash
httpx \
  -l recon/resolved.txt \
  -silent \
  -status-code \
  -title \
  -tech-detect \
  -follow-redirects \
  -o recon/http.txt
```

Again:

```text
HTTP validation
```

is not a replacement for DNS enumeration.

It is the next validation layer.

---

# 123. Brute Force

```bash
puredns bruteforce \
  wordlist.txt \
  "$DOMAIN" \
  -r valid_resolvers.txt \
  -o recon/bruteforce.txt
```

Or:

```bash
dnsx \
  -silent \
  -d "$DOMAIN" \
  -w wordlist.txt \
  -o recon/bruteforce.txt
```

---

# 124. Permutations

```bash
cat recon/resolved.txt \
  | alterx \
  -silent \
  > recon/permutations.txt
```

Resolve:

```bash
puredns resolve \
  recon/permutations.txt \
  -r valid_resolvers.txt \
  -o recon/permutations-resolved.txt
```

---

# 125. Final Merge

```bash
cat \
  recon/all-passive.txt \
  recon/resolved.txt \
  recon/bruteforce.txt \
  recon/permutations-resolved.txt \
  recon/recursive.txt \
  recon/vhosts.txt \
  | tr '[:upper:]' '[:lower:]' \
  | sed 's/\.$//' \
  | sort -u \
  > recon/final-candidates.txt
```

Then resolve everything again:

```bash
dnsx \
  -l recon/final-candidates.txt \
  -silent \
  -auto-wildcard \
  -o recon/final-resolved.txt
```

This final re-resolution step is important because many candidates were generated from:

```text
historical data
permutations
brute force
VHosts
code
archives
```

and not all candidates will still exist.