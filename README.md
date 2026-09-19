# Backend for Aphelion Expeditions

This backend receives data from three forms on the website:
1. Partner application
2. Tour booking request
3. Custom product order (configurator)

For each one, it sends you an email notification and saves a backup copy to a local file called `submissions.log`.

---

## Step 1. Install Node.js

Download and install from: https://nodejs.org (choose the LTS version).
Check that it installed correctly by opening a terminal and running:

```
node -v
npm -v
```

## Step 2. Install dependencies

Open a terminal inside the `aphelion-backend` folder and run:

```
npm install
```

## Step 3. Set up email

1. Rename the file `env-example.txt` to `.env` (just `.env`, no other text before the dot).
   - On Windows: right-click the file → Rename → type `.env` and press Enter. If Windows won't let you remove the `.txt` part, try renaming to `.env.` (with a trailing dot) — Windows will drop the trailing dot automatically.
   - On Mac: right-click → Rename → type `.env`.
2. Open `.env` in a text editor and fill in:
   - `EMAIL_USER` — your email address
   - `EMAIL_PASS` — an app password (see below)
   - `EMAIL_TO` — where you want form submissions delivered

### If you're using Gmail

Your regular Gmail password won't work here — you need an "app password":
1. Turn on 2-Step Verification in your Google Account settings
2. Go to https://myaccount.google.com/apppasswords
3. Create an app password for "Mail"
4. Paste that password into `EMAIL_PASS`

If you use a different email provider (Yandex, Outlook, a company email, etc.),
ask your provider for the SMTP host and port, and put those into `EMAIL_HOST` / `EMAIL_PORT`.

## Step 4. Run the server

```
npm start
```

If everything is set up correctly, you'll see:

```
Mail server ready to send messages
Server running: http://localhost:3000
```

The server is now running and waiting for requests from the website.

---

## How this connects to the website (frontend)

The file `aphelion-expeditions-connected.html` is your website with the forms
updated: instead of just showing "Thank you" on screen, they now send data to
this server via `fetch(...)` requests, to these addresses:

- `http://localhost:3000/api/partner-application`
- `http://localhost:3000/api/booking-request`
- `http://localhost:3000/api/custom-order`

**While the server (`npm start`) is not running, the forms will not work** —
so start the server every time you want the website to actually receive submissions.

## Why it doesn't work on your phone

This backend (`server.js`) is a program that runs on a computer — it is not a
website you visit, and a phone cannot run it. Two different things:

- **The website (HTML file)** — can be opened in a phone browser, no problem.
- **The backend (server.js)** — must run on a computer (yours, or eventually
  a hosting service). It listens at `localhost:3000`, which only means
  "this same computer" — a phone on a different network cannot reach it there.

If you want to test the site from your phone while the backend runs on your
computer, both devices need to be on the same Wi-Fi, and you'd replace
`localhost` in the HTML file with your computer's local network IP address
(e.g. `http://192.168.1.23:3000`) — happy to walk through that if you want.
The permanent fix is putting the backend on a hosting service (next section) —
then it works from any device, anywhere.

## How to test that everything works

1. Start the server (`npm start`), leave the terminal window open
2. Open `aphelion-expeditions-connected.html` in a browser (on the same computer)
3. Fill out any form and submit it
4. Check your email (`EMAIL_TO`) — you should receive a message
5. Check the `submissions.log` file in the backend folder — a new entry should appear there too

---

## When you're ready to put the website online (not just on your computer)

Right now everything only works on your own computer (`localhost`). To make
the website and backend available to everyone on the internet, you need to
host them somewhere. Options:

- **Backend:** Render.com or Railway.app — both have free tiers and simple deployment
- **Frontend (the HTML file):** Netlify, Vercel, or GitHub Pages

Once the backend is hosted, you'll get a real web address instead of
`localhost:3000` (for example `https://aphelion-backend.onrender.com`) — at
that point, replace `localhost:3000` with that address everywhere it appears
in `aphelion-expeditions-connected.html` (search for `API_BASE`).

If you'd like help setting up hosting, just ask.
