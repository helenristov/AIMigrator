# AI Data Migrator

A browser-based demo platform that uses the **Anthropic Claude API** to accelerate legacy data estate modernization. Paste legacy SQL and get production-ready PySpark in seconds. Map source schemas to target schemas with AI-generated column mappings, confidence scores, and transform expressions.

![AI Data Migrator screenshot](https://raw.githubusercontent.com/YOUR_USERNAME/ai-data-migrator/main/screenshot.png)

---

## Features

### SQL Converter
- Translates legacy SQL (Oracle, SQL Server, MySQL, etc.) into production-grade **PySpark** code
- Handles window functions, CTEs, PIVOT patterns, incremental loads, nested subqueries, and SCD2 merge logic
- Returns detected SQL patterns, optimizations applied, and migration notes
- Complexity score (1–5) on each conversion

### Schema Mapper
- Paste source and target DDL side by side
- Claude matches columns by name similarity and semantic meaning
- Outputs a full mapping table with **confidence levels** (high / medium / low) and **transform expressions**
- Flags unmatched target columns for manual review
- Export mappings as:
  - PySpark `.withColumnRenamed` / `.withColumn` script
  - YAML mapping specification
  - SQL `SELECT` statement with aliases

### Session Dashboard
- Live metrics: queries converted, schemas mapped, average AI response time, estimated effort saved
- Session history log across both tools

---

## Getting started

### 1. Clone and open

```bash
git clone https://github.com/YOUR_USERNAME/ai-data-migrator.git
cd ai-data-migrator
```

Open `index.html` directly in your browser — no build step, no dependencies.

```bash
# Or serve locally with any static file server:
npx serve .
python3 -m http.server 8080
```

### 2. Get an Anthropic API key

Sign up at [console.anthropic.com](https://console.anthropic.com) and create an API key under **API Keys**.

### 3. Enter your key in the app

Paste your `sk-ant-api03-...` key into the **API key** field at the top of the page. The key is never stored — it lives only in your browser tab's memory for the session.

---

## Deploy to GitHub Pages

1. Push the repo to GitHub
2. Go to **Settings → Pages**
3. Set source to **Deploy from a branch → main → / (root)**
4. Your demo will be live at `https://YOUR_USERNAME.github.io/ai-data-migrator`

> **Note:** GitHub Pages serves over HTTPS, which is required for the Anthropic API's `anthropic-dangerous-direct-browser-calls` header to work from the browser.

---

## Project structure

```
ai-data-migrator/
├── index.html      # Main application — all UI, tabs, and logic
├── examples.js     # SQL and schema example library
└── README.md       # This file
```

### Adding your own examples

Open `examples.js` and add entries to `SQL_EXAMPLES` or `SCHEMA_EXAMPLES`:

```js
// SQL example
SQL_EXAMPLES.my_query = `
SELECT account_id, SUM(balance)
FROM accounts
GROUP BY account_id;
`;

// Schema example
SCHEMA_EXAMPLES.my_schema = {
  src: `OLD_COL   VARCHAR2(50)\nBAL       NUMBER(12,2)`,
  tgt: `new_col   STRING\nbalance   DOUBLE`
};
```

Then add a chip button in `index.html`:

```html
<!-- In the SQL chip row: -->
<button class="chip" onclick="loadSqlEx('my_query')">My query</button>

<!-- In the schema chip row: -->
<button class="chip" onclick="loadSchEx('my_schema')">My schema</button>
```

---

## How it works

All AI calls go directly from the browser to `https://api.anthropic.com/v1/messages` using the `claude-sonnet-4-20250514` model. Each tool uses a tightly scoped system prompt and asks the model to respond in **structured JSON** — the app then parses and renders the result.

```
User SQL input
    │
    ▼
System prompt (few-shot instructions + JSON schema)
    │
    ▼
Claude Sonnet (via Anthropic API)
    │
    ▼
Structured JSON response
    │
    ▼
Rendered PySpark output + analysis cards
```

The schema mapper works the same way — source + target DDL go in, a JSON mapping array comes back.

---

## Security note

Your API key is passed in the `x-api-key` request header from the browser. This is acceptable for **personal demos and local development** but is **not recommended for production** — anyone who can inspect network traffic can read the key. For a production deployment, proxy API calls through a backend server that holds the key server-side.

---

## Customisation ideas

- Add a **third tool** for data quality rule generation (null checks, range assertions, referential integrity)
- Persist session history to `localStorage`
- Add a **diff view** to compare source SQL line-by-line with generated PySpark
- Support uploading `.sql` or `.ddl` files directly
- Wire up a backend proxy so users don't need to manage their own API key

---

## License

MIT — free to use, fork, and adapt.

---

## Built with

- [Anthropic Claude API](https://docs.anthropic.com/en/api/getting-started) — `claude-sonnet-4-20250514`
- Vanilla HTML / CSS / JavaScript — zero dependencies, zero build step
