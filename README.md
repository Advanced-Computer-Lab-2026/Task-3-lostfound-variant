# Task 3 (Variant): Campus Lost & Found — with Authentication

Task 1's Campus Lost & Found API with JWT login/register on the server and a
React client with a login flow.

## Running it

```
npm run install:all   # installs server/ and client/ (npm workspaces)
npm run dev           # API on :4000, client on :5175
```

Create `server/.env` yourself with:

```
PORT=4000
MONGO_URI=mongodb://tasks:pass1234@ac-j3acrgb-shard-00-00.lueesfz.mongodb.net:27017,ac-j3acrgb-shard-00-01.lueesfz.mongodb.net:27017,ac-j3acrgb-shard-00-02.lueesfz.mongodb.net:27017/?ssl=true&replicaSet=atlas-6to6iy-shard-0&authSource=admin&appName=Cluster0
JWT_SECRET=change-me
JWT_EXPIRES_IN=7d
```

`JWT_SECRET` is the key the server signs and verifies login tokens with —
anyone who knows it can forge a token for any user, so replace `change-me`
with a long random value. Generate one with:

```
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Paste the output after `JWT_SECRET=` and restart the server. Changing the
secret logs everyone out, because tokens signed with the old one stop being
valid.

## What was added on top of Task 1

### Server
- `POST /api/auth/register`, `POST /api/auth/login` → `{ token, user }`;
  `GET /api/auth/me` (requires token).
- `middleware/auth.js` — `requireAuth` reads `Authorization: Bearer <token>`,
  verifies it with `JWT_SECRET` and sets `req.user = { id, name }`.
- `User.comparePassword()`; the `password` field stores the bcrypt hash.
- Items: reading (`GET /` with its `status`/`category` filters, `GET /:id`)
  stays public. Creating, editing and deleting require a token. `reportedBy`
  is set from `req.user.id` (sending it in the body is rejected), and only
  the person who reported an item can edit or delete it (`403` otherwise).
  Items are populated with the reporter's `name`/`email`.
- Users: `POST /api/users` was removed (use `/api/auth/register`);
  `PATCH`/`DELETE /api/users/:id` require a token and only work on your own
  account.

### Client (`client/`, Vite + React + Tailwind)
- `AuthContext` stores the token in `localStorage`, restores the session via
  `/auth/me`, and `api.js` attaches the token to every request.
- Pages: Login, Register, Items (list with status/category filters,
  edit/delete on items you reported). ItemForm is left for you — see below.

## Your task — the Report Item page

Everything above is already working. Your job is the frontend of reporting
an item: `client/src/pages/ItemForm.jsx`. It is already routed at
`/items/new` and `/items/:id`, both behind `ProtectedRoute`, and the
"Report Item" nav link and the "Edit" buttons already point to it.

This is roughly what the finished page should look like (filled in with example values):

![Finished page](docs/report-item.png)

### TODO 1 — the form
Render inputs bound to the `form` state:
- `title` — text input (e.g. `Black backpack`)
- `status` — select: `lost`, `found`, `claimed`
- `category` — select: `electronics`, `clothing`, `documents`,
  `accessories`, `other`
- `location` — text input (optional, e.g. `Library 2nd floor`)
- `description` — textarea (optional)

The select values must match these strings exactly — anything else is
rejected by the server. Implement `onChange` so every input updates `form`.

### TODO 2 — reporting an item
In `onSubmit`, send `POST /api/items` with
`{ title, status, category, location, description }` using the `api`
instance from `client/src/api.js` (it already attaches your token). On
success, navigate back to `/items`. On failure, show the server's `message`
in the `error` box — try it: a one-letter title returns `400`, and reporting
the same title at the same location twice returns `409`.

Do **not** send `reportedBy` — the server takes the reporter from your token
and rejects the request if you send it.

### TODO 3 — editing an item
When the URL has an `id`, load the item with `GET /api/items/:id` and fill
the form with its `title`, `status`, `category`, `location` and
`description`. On submit, send `PATCH /api/items/:id` instead of `POST` —
this is how an item gets marked as `claimed`. Editing an item someone else
reported returns `403` — show that message too.

You're expected to use AI tools while building this. But you should be able
to explain, for any line in your component, *why* it's there and what
happens if you delete it. We will ask.

## Checking the Report Item page

```
npm test --workspace client
npm run build --workspace client
```

The component tests cover creating and editing items, marking an item as
claimed, displaying validation/duplicate/ownership errors, missing optional
fields, failed loading, and preventing repeated submissions while saving.
They mock the API and do not require MongoDB. For a live check, run the app,
log in, report an item, then edit it from the Items page. A one-letter title
should display the server's validation error; repeating a title and location
should display the duplicate error.
