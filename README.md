# IEEE VIT Voting Web App

A lightweight web application for IEEE Velammal Institute of Technology student elections.

## Features

- Voter verification form (name, register number, IEEE member ID)
- Ballot for multiple roles:
  - Chairman
  - Vice Chairman
  - Secretary
  - Treasurer
  - Technical Lead
- One vote per IEEE Member ID (stored in browser localStorage)
- Live result dashboard
- Reset election data option for admins/demo

## Run

Since this is a static web app, just open `index.html` in a browser.

You can also run a quick local server:

```bash
python3 -m http.server 8080
```

Then visit: <http://localhost:8080>

## Notes

- This prototype uses browser localStorage, so data is per browser/device.
- For production, replace localStorage with a secure backend + authentication.
