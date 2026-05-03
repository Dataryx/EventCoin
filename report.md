# EventCoin — Project Report

This report lists **every attendee-facing and admin-facing capability** in the EventCoin app in plain language (no implementation detail).

---

## User (attendee / client) features

| Feature | What it does |
|--------|----------------|
| **Marketing home page** | Welcomes visitors, explains EventCoin in headline form, and highlights discovery, checkout, barcode entry, and admin control. |
| **Choose your path** | From the home page, jump straight into the ticket-buyer experience or the staff control area. |
| **Client portal pitch card** | Summarizes signing in, discovering events, paying for seats, and keeping barcode tickets ready in one place. |
| **Registration** | Collects name, username, email, and password so a new attendee can open an account before buying. |
| **Sign in** | Lets returning attendees unlock their profile, saved tickets, and checkout using their identity. |
| **Sign out** | Ends the client session and returns the person to the sign-in experience. |
| **Account menu** | From the dashboard, open profile details, open purchase history, or sign out from one menu. |
| **Client dashboard header** | Shows who is signed in and whether a payment account is linked for purchases. |
| **Live spending balance** | Displays how much spendable digital currency is available on the connected payment account before buying. |
| **Personal summary tiles** | Shows how many events are listed overall, how many tickets you hold, and how many seats are still on sale across those listings. |
| **“My Tickets” shortcut** | One-tap jump from the dashboard to the full ticket wallet page. |
| **Event search** | Filter the catalog by event title or by the event’s public listing reference. |
| **Category browsing** | Narrow the catalog with chips for all events, concerts, sports, experiences, or the single featured best-seller. |
| **Event discovery cards** | Each card shows schedule, title, short description, presale/live/sold-out status, how many seats remain, sell-through progress, price in digital currency plus an estimated dollar value, and links to view or buy. |
| **Fan-facing event page** | A buyer-oriented screen with the story, date, how many seats are left, price in two friendly formats, whether you are signed in, and whether a payment account is connected. |
| **Seat quantity & cart** | Pick how many seats you want, add them to a simple cart, review cart size, and proceed to payment. |
| **Purchase snapshot panel** | On the fan event page, shows available seats, sold seats, total capacity, and the listing reference for the show. |
| **Barcodes on the event page** | After buying, see each seat for that show with a scannable barcode, the text code, and copy-to-clipboard for the code. |
| **Checkout & payment** | Confirms you are signed in, connects the payment account when needed, buys one or many seats in a single visit, shows step-by-step status messages, confirms success with seat numbers, and explains common problems in plain language (for example payment cancelled or not enough funds). |
| **Full ticket wallet** | Lists every pass you own across events, pulls in each show’s name/date when possible, and marks whether a pass is still valid or already used at entry. |
| **Wallet-wide ticket stats** | Shows total passes, how many different events they cover, and the combined sticker price of those passes where pricing is known. |
| **Barcode copy (wallet)** | Copy a ticket’s scan code text for email, chat, or another device. |
| **Barcode download (wallet)** | Save the barcode artwork as an image file for offline use or printing. |
| **Single-ticket detail page** | Deep link for one seat: verifies it belongs to you, prints event/story/date, seat number, barcode text, issued time, active vs used, and warns if entry already happened or the seat disappeared (for example after a refund). |
| **Profile** | View full name, username, email, internal client reference, linked payment account, and the live balance panel for that account. |
| **Transaction history** | Read-only diary of purchases: which show, rough date/time line, quantities, amounts in digital currency, and links or references when shown. |

---

## Admin (staff / organizer) features

| Feature | What it does |
|--------|----------------|
| **Admin sign-in landing** | Branded gate with short bullets about live operations, barcode checks, and tracking, plus a safe return link to the public home page. |
| **Admin authentication** | Staff enter administrator credentials before any control-room page loads. |
| **Persistent admin navigation** | Sidebar sections for dashboard, events, purchased tickets, validation, transfers, clients, then system areas for integrations, audit trail, and settings. |
| **Admin session strip** | Always shows which admin identity is active and offers logout (logout is recorded in the activity diary). |
| **Global “Create Event” action** | Available from the admin shell header so new shows can be launched without hunting through menus. |
| **Operations dashboard — headline stats** | Four tiles: how many live listings exist, how many seats sold in total, gross sales in estimated dollars (with the matching digital-currency note), and how many seats were already marked used at the gate. |
| **Operations dashboard — event board** | Splits listings into “still selling” versus “sold out,” shows presale/live/sold-out badges, per-show schedule blurb, sales counts, revenue snapshot, used-at-gate counts, links into the command center, and a quick “validate” shortcut. |
| **Operations dashboard — search & sort** | Find a show by name or listing reference; order results newest-first or oldest-first. |
| **Operations dashboard — export snapshot** | Download a consolidated operations report file (PDF-style export) capturing the current dashboard picture; shows success or error feedback. |
| **Operations dashboard — validation shortcut** | Hero button jumps straight to the validation queue picker. |
| **Events management page** | Same style of active vs sold-out boards with richer footers—open the command center, jump to barcode validation for that show, or open the listing editor. Includes “create event” prompts when empty. |
| **Event command center (organizer view)** | All-in-one show page with marketing description, organizer identifiers, inventory snapshot (availability, sold count, seat price with dollar estimate, gross sales), ledger split between unused passes and passes already redeemed, and labeled buttons for every downstream workflow below. |
| **Validate ticket (from command center)** | Opens the barcode validation flow for that specific show (see dedicated validation feature). |
| **View ticket holders list** | Simple roster of accounts that currently own seats for the show—useful when reconciling attendees. |
| **Mark a ticket used** | Form to punch in a seat number and finalize entry so it cannot scan again. |
| **Request refund** | Form to pick a seat number and process a cancellation when policies allow—success returns you to the show page with a confirmation message. |
| **Transfer ticket** | Form to move a numbered seat from the current holder to another account reference the organizer controls—shows confirmation or denial reasons people can understand. |
| **Open client purchase preview** | Launches exactly the shopper-facing storefront for this show so staff can rehearse what fans experience. |
| **Create event workflow** | Form for show name, long description, date/time text, ticket price (with approximate dollar hints), quantity of seats, and submission—with friendly errors if prerequisites fail. |
| **Edit event listing details** | Update the wording and schedule that appear across admin and client catalogs for a show once it already exists—requires a real name, validates email-style fields where applicable, and routes back with a success banner. |
| **Purchased tickets ledger** | One searchable table of every sold seat across all shows with event name, seat number, holder display name when known, holder account reference, and used vs unused filters. |
| **Ticket validation center** | Menu of all shows; each row links to that show’s validation screen for door staff. |
| **Ticket transfer center** | Menu of all shows; each row links to that show’s transfer form; offers to create a show if none exist. |
| **Clients management board** | Search clients, filter all vs active vs registered-only, view last sign-in time, update name/username/email inline with duplicate checks, delete an account with confirmation (and clear that user’s local session if they match), and refresh the list from storage. |
| **Revenue overview page** | KPI-style snapshot: total gross sales, average revenue per show, and total seats sold across the catalog. |
| **Payouts workspace** | Table-style view of sample payout batches and statuses, framed as a future-ready finance monitor. |
| **Invoices workspace** | Card/list view of sample invoices and whether they are paid, open, or overdue. |
| **Integrations directory** | Cards for wallets, notifications, analytics-style hooks, each with a connection status label and a configure button placeholder. |
| **Audit log** | Chronological feed of meaningful actions (client or admin) with timestamp, action label, success vs failure, actor name/role, optional wallet line, targeted record, route, expandable detail pills, manual refresh. |
| **Platform settings form** | Editable placeholders for brand name displayed to the world, default support inbox, headline default fee percentage, and save button intent. |

---

*End of report.*
