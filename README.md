# CSV Account Splitter

A small internal tool that takes a CSV, lets you group its rows by an "account" column, mark each row's reconciliation status (Not checked / Found / Not found / Discrepancy), and export a multi-sheet XLSX where each account becomes its own sheet with the original columns plus the chosen status.

All processing happens in your browser — the CSV never leaves the page.

## Run locally

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

## Build

```bash
npm run build
npm start
```
