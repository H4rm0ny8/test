---
title: Active.htb
type: writeup
category: active-directory
platform: HTB
difficulty: hard
os: Windows
date: 2026-05-26
tags:
  - GPP
  - Kerberoasting
  - Active Directory
summary: GPP password leak to Kerberoasting and offline hash cracking.
initialAccess: GPP decryption via Groups.xml to recover cleartext credentials.
privesc: Kerberoasting Administrator SPN and cracking the hash offline.
---

## 01. Enumeration

```powershell
nmap -sC -sV -oN nmap.txt 10.10.11.xxx
```

Map AD services: Kerberos, LDAP, SMB, DNS, and any web apps.

## 02. Initial Access

Document GPP / Groups.xml discovery and credential recovery.

## 03. Privilege Escalation

Walk through Kerberoasting and cracking to domain admin.

## 04. Post Exploitation

Capture flags and any persistence or cleanup notes.
