# SAVE THE FUTURE — AI DIGITAL POSTER CHALLENGE

VK Mini App frontend for the Moscow Financial College digital poster competition.

## Implemented
- approved competition concept and navigation structure
- mobile-first VKUI/React interface
- Home / Exhibition / Participant / Jury / Results / About
- anonymous poster numbers in the jury flow
- five jury criteria, 0–20 each, total 100
- AI Creative Passport fields
- audience reaction separated from jury score
- VKWebAppInit
- local demo persistence for the current prototype

## Important
The repository now contains the application source, but the current data layer is still localStorage. It must be replaced by a shared backend before public competition use.

## Production architecture
Frontend: Vercel or VK-hosted HTTPS endpoint.
API: Cloudflare Worker.
Database: Cloudflare D1.
Poster files: Cloudflare R2.
Identity/roles: server-side VK Mini App authentication and role table.

Never put VK application secrets, R2 credentials, or administrator credentials in the frontend.

## Run locally
npm install
npm run dev

## Build
npm run build

## Deployment sequence
1. Deploy the frontend to an HTTPS host.
2. Create D1 database and apply schema.
3. Create R2 bucket.
4. Deploy Worker and configure bindings/secrets.
5. Set VITE_API_BASE_URL.
6. Configure the VK Mini App to use the HTTPS frontend URL.
7. Seed organizer and jury roles server-side.
8. Run a complete submission → moderation → judging → results test before opening the competition.

## Design master
The approved cover composition is the visual master. Future changes should extend the system without replacing that composition or altering the competition mechanics.
