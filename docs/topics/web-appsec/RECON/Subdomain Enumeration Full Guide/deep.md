
# Part XVI — Cheat Sheet

## Passive

```bash
subfinder -d example.com -all -silent -recursive -o subfinder-all.txt
subfinder -dL domains.txt -all -silent -recursive -o subfinder-all.txt
amass enum -passive -d example.com -o amass.txt
amass enum -active -d example.com -brute -w wordlist.txt -o amass-active.txt
assetfinder --subs-only example.com
findomain -t example.com -q
chaos -d example.com -silent
sublist3r -d example.com -o sublist3r.txt
github-subdomains -d example.com -t <TOKEN> -o github_subs.txt
```

## CT

```bash
curl -s 'https://crt.sh/?q=%25.example.com&output=json' \
  | jq -r '.[].name_value' | tr '\r' '\n' | sed 's/^\*\.//' | sort -u
```

## DNS Records

```bash
dig +short A api.example.com
dig +short AAAA api.example.com
dig +short CNAME api.example.com
dig +short NS example.com
dig +short MX example.com
dig +short TXT example.com
dig +short SRV _sip._tcp.example.com
dig +short SOA example.com
```

## Resolve + Wildcard

```bash
dnsx -l candidates.txt -silent -auto-wildcard -o resolved.txt
dnsx -l resolved.txt -silent -a -aaaa -cname -resp
puredns resolve candidates.txt -r resolvers.txt
```

## Brute Force

```bash
puredns bruteforce wordlist.txt example.com -r resolvers.txt
dnsx -silent -d example.com -w wordlist.txt
gobuster dns -d example.com -w wordlist.txt
```

## Permutations

```bash
cat resolved.txt | alterx -silent
gotator -sub subs.txt -perm words.txt -depth 1 -numbers 10 -mindup -adv -md
altdns -i subs.txt -o data_output -w words.txt -r -s altdns_output.txt
```

## PTR / ASN

```bash
dig -x 203.0.113.10 +short
echo "203.0.113.10" | dnsx -silent -ptr
cat ip_ranges.txt | mapcidr -silent | dnsx -ptr -resp-only
echo "AS12345" | asnmap -silent
```

## VHost

```bash
ffuf -w wordlist.txt -u http://TARGET_IP -H "Host: FUZZ.target.com" -fc 403,404 -ac
gobuster vhost -u http://TARGET_IP -w wordlist.txt
```

## HTTP Probe

```bash
httpx -l resolved.txt -silent -status-code -title -tech-detect -follow-redirects
```

## Archive

```bash
gau example.com
waybackurls target.com
curl "https://web.archive.org/cdx/search/cdx?url=*.target.com/*&output=text&fl=original&collapse=urlkey"
```

## AXFR

```bash
dig +short NS example.com
dig AXFR example.com @ns1.example.com
```

## Normalize + Scope

```bash
cat *.txt | tr '[:upper:]' '[:lower:]' | sed 's/^\*\.//' | sed 's/\.$//' | sort -u
grep -E '(^|\.)example\.com
```