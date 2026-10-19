# Citizenship Tracker

Counts physical presence days toward Canadian citizenship, keeps a log of trips outside Canada, and exports that log as a CSV for the citizenship application.

## Files

- `citizenship-tracker.html` — the tracker page. It runs as a Claude artifact and saves trips through Claude's artifact database (`claude.use("db")`). Run outside Claude, it shows the layout but cannot load or save trips.
- `calc.js` — the eligibility calculation on its own, with no page or storage. This is the part to port to Swift for the iPhone app.

## Counting rules

Based on the Citizenship Act as amended on October 11, 2017:

- 1,095 days of physical presence are needed in the 5 years before the day the application is signed. The signing day itself does not count.
- Each day in Canada as a permanent resident counts as 1 day.
- Each day in Canada with temporary status (study permit, work permit) before becoming a permanent resident counts as half a day, up to 365 days of credit, and only within the same 5-year window.
- The days you leave Canada and return to Canada count as days in Canada. Only the days in between are absences.
- The countdown assumes no travel beyond the trips logged.

Always confirm with IRCC's official physical presence calculator before applying.

## Data model

`settings/profile`

| Field | Example | Meaning |
|---|---|---|
| `trStart` | `2021-06-24` | First entry to Canada with temporary status |
| `prDate` | `2026-08-15` | Date of becoming a permanent resident |

`trips/<id>`

| Field | Meaning |
|---|---|
| `depart` | Date left Canada (YYYY-MM-DD) |
| `ret` | Date returned to Canada; empty while still away |
| `destination` | City, country |
| `flightOut`, `flightBack` | Flight numbers |
| `reason` | Vacation, Visiting family, Business, Studies, Medical, Other |
| `notes` | Free text |

## Checking the calculation

```sh
node -e '
const { compute } = require("./calc.js");
const r = compute({ trStart: "2021-06-24", prDate: "2026-08-15" },
                  [{ depart: "2026-09-18", ret: "2026-10-18" }], "2026-10-19");
console.log(r.eligibleStr, r.daysLeft); // 2028-09-12 694
'
```

## Next step: iPhone app

Port `calc.js` to Swift, store trips on the device (SwiftData), and use the tracker's CSV export to move existing trips into the app.
