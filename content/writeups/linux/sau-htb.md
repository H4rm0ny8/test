---
title: Sau.htb
type: writeup
category: linux
platform: HTB
difficulty: easy
os: Linux
date: 2026-05-27
tags:
  - SSRF
  - CVE-2023-27163
  - Sudo
summary: SSRF in Request-Baskets leading to foothold, then sudo abuse for root.
initialAccess: SSRF exploitation in Request-Baskets (CVE-2023-27163).
privesc: Sudo privileges on /usr/bin/systemctl status.
---

## 01. Enumeration

```bash
sudo nmap -sC -sV -oN nmap.txt 10.10.11.xxx
```

Document open ports, web stack, and any interesting endpoints.

## 02. Initial Access

Explain the SSRF chain and how you got a shell.

## 03. Privilege Escalation

Show the sudo misconfiguration and how you escalated.

## 04. Flags

- `user.txt`
- `root.txt`
