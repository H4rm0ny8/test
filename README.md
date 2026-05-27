# H4rm0ny Content Hub (`test`)

Static site for **HTB/THM writeups** and **cyber blogs**, built from Markdown files. Same green terminal theme as the profile site.

## Workflow (Obsidian → GitHub → Site)

1. Open this repo folder as an **Obsidian vault** (or only the `content/` folder).
2. Create or edit `.md` files under `content/`.
3. Commit and **push** to `main`.
4. GitHub Actions runs `npm run build` and deploys `_site/` to Pages.

## Where to put Markdown

### Writeups

```
content/writeups/<category>/<slug>.md
```

Categories used on the hub:

| Folder | Hub section |
|--------|-------------|
| `active-directory` | Directory Exploitation (AD) |
| `linux` | Linux Targets |
| `windows` | Windows Targets |
| `misc` | Misc Targets |

### Blogs

```
content/blogs/<category>/<slug>.md
```

Examples: `red-team`, `blue-team`, `tools`, `notes`, `general`.

### Images (optional)

Put assets next to the note:

```
content/writeups/linux/sau-htb.md
content/writeups/linux/images/nmap.png
```

Or use a subfolder:

```
content/writeups/linux/sau-htb/index.md
content/writeups/linux/sau-htb/images/screenshot.png
```

Reference in Markdown:

```md
![Nmap](images/nmap.png)
```

## Frontmatter (copy from templates)

Templates live in `content/_templates/`.

- Set `draft: true` to hide a note from the site.
- `title`, `tags`, `summary` control the hub card.
- Writeups: `platform`, `difficulty`, `os`, `initialAccess`, `privesc`.

## Local preview

```bash
node scripts/build.mjs
```

Then open `_site/index.html` in the browser, or serve the folder:

```bash
npx --yes serve _site
```

## GitHub Pages

1. Repo **Settings → Pages → Build and deployment**: **GitHub Actions**.
2. Push to `main` — workflow `.github/workflows/pages.yml` publishes `_site/`.
3. Site URL: `https://h4rm0ny8.github.io/test/` (if repo name is `test`).

## Profile repo

The `profile/` repo stays unchanged. Link to this hub from your profile when ready.
