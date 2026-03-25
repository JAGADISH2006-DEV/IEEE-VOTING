# IEEE VIT Election Web App

A browser-based election app for IEEE student chapter elections at Velammal Institute of Technology.

## What this improved version includes

- Voter verification with:
  - Full name
  - Register number validation
  - IEEE member ID validation (6–12 digits)
- Ballot for 5 roles:
  - Chairman
  - Vice Chairman
  - Secretary
  - Treasurer
  - Technical Lead
- Duplicate vote prevention by **both** IEEE Member ID and Register Number
- Election state management (Open / Closed)
- Live statistics dashboard (unique members, ballots, status)
- Result board with current leaders highlighted
- Export results + ballot log as JSON
- Admin reset option for demo/testing

## Run locally

This is a static app, so either:

1. Open `index.html` directly in your browser, or
2. Serve with a local server:

```bash
python3 -m http.server 8080
```

Open: <http://localhost:8080>

## Data storage

All data is saved in browser `localStorage` for this prototype.

### Production recommendation

Use a secure backend + database + authentication before real elections.
