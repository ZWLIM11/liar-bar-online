# The Liar's Table

An original browser prototype inspired by bluffing games at a saloon table. It uses the user's layout reference for visual direction and original generated saloon artwork. It does not reuse Liar's Bar game assets or characters.

## Play

Requires Node.js 22 or later. From this repository:

```sh
npm ci
npm run dev
```

Open the local URL printed by Wrangler. The front page asks for your name and offers **Play with AI** or **Play online**. Choose your mode and table settings, then enter the table. Gameplay fills the viewport with a first-person 3D saloon and an overlaid hand/action dock. For private multiplayer, enter your name, create a room, and share **Copy invite**. Friends join, everyone marks Ready, and the host starts. Rooms support 2–4 human players; solo supports 1–3 AI opponents.

## Camera and effects

Drag the 3D canvas to turn, scroll to zoom, or focus it and use arrow keys. R and Reset view recenter. Toggle first-person/table overview or fullscreen. The revolver has a chamber cylinder, hammer, trigger guard and articulated grip hand. Its three-second sequence raises the gun, cocks the hammer, fires with synchronized sound/flash/recoil, then lowers it. Smoke drifts from the muzzle. Preview gunshot demonstrates the effect without changing the match. Solo AI pauses for penalty animations. Sound and gentle effects can be toggled; reduced-motion preferences are respected. The room and human characters are procedural, stylized Three.js models, not photorealistic scanned assets.

## Modes

| Mode | What is playable | Source and limits |
| --- | --- | --- |
| Liar's Dice | Secret five-die rolls, rising bids, challenges, two poison lives | Standard and Traditional (wild ones, Spot On). [Official store](https://store.steampowered.com/app/3097560/Liar_s_Bar/), [Traditional announcement](https://steamcommunity.com/games/3097560/announcements/detail/4532401922180522149) |
| Liar's Deck | Table rank, 1–3 card claims, challenges, six-chamber penalty | Standard and Devil rules. Chaos is explicitly a prototype adaptation, because [the July 2026 update](https://steamcommunity.com/app/3097560/announcements/) changed activation and redealing. |
| Liar's Poker | Private cards, community cards, call/fold/switch/all in, hand showdown | The [official store](https://store.steampowered.com/app/3097560/Liar_s_Bar/) describes the actions, but not all betting and penalty details. The implemented six-chamber risk is a house rule. |
| Liar's Slots | Four reels, one public symbol, claims, challenge, Death Spin, points, Execute, Double Spin | The [official store](https://store.steampowered.com/app/3097560/Liar_s_Bar/) outlines the mode; [official announcement](https://steamcommunity.com/app/3097560/announcements/) uses the current name *Liar's Slots*. Scoring details are a house rule. |

This is a prototype, not a full rules-identical port of the commercial game. The rules panel inside the game lists the sources and adaptations.

## Online architecture

Cloudflare Worker + SQLite Durable Objects own room state and validate every move. Seat tokens are private and saved in sessionStorage for refresh/reconnect in the same tab. Opponents never receive your private dice/cards, remaining deck or loaded chamber. Optimistic revisions prevent duplicate moves; polling refreshes every 1.5 seconds. Turns expire after 45 seconds, inactive rooms after 24 hours. Leaving an active match forfeits your seat.

This release has private invite rooms, not public matchmaking, accounts, voice chat or bot fill in online rooms. Browser tab closure retains a seat until timeout/room expiry; use Leave room to release it.

## Cloudflare release (when ready)

The full game must be deployed as a **Worker with Durable Objects**, using the included `wrangler.jsonc`. A static Pages upload alone cannot run online rooms. Configure the Cloudflare project to build with `npm run build` and deploy with `npx wrangler deploy` (or run `npm run deploy` after authenticating locally). The SQLite migration and assets binding are included. No Cloudflare deployment has been performed.

## Verification

`npm test` covers room lifecycle across all modes, private data projections, invalid actions, concurrency, timeouts, forfeits and AI legality/privacy. `npm run build` prepares public assets. Two-browser local checks cover room creation, joining, ready/start, moves, challenges and reconnects.

## Files

- `game.js` / `ai.js` — solo gameplay and difficulty-based AI
- `online.js` — room UI and server synchronization
- `scene.js` — 3D room, first-person camera and effects
- `server/` — authoritative engine and Worker
- `tests/` — multiplayer and AI checks
- `vendor/` — Three.js (MIT, license included)
- `assets/saloon.png` — original generated fallback artwork
- `RULES.md` — official sources and explicit house-rule differences

## Build identification

The landing page displays **FIRST-PERSON EDITION · BUILD 7**. If you see the old oval table dashboard or “Take a seat”, your host is serving an earlier build: rebuild the latest main branch. Asset revalidation headers and versioned entry scripts are included.

## Private hand interactions

Dice roll inside a leather cup at the start of each round. Click the cup or **Lift cup · peek** to see your private roll; click again to cover it. Cards deal face down and **Flip cards · peek** reveals the faces. Each new round covers the hand automatically. Peek is purely visual and never rerolls or changes the authoritative hand. The smaller glass holds poison and drains as your two Dice lives are spent. Keyboard users can use the Peek button.

## Cartoon art update

Build 5 uses smooth cartoon heads, rounded clothing, expressive eyes with idle blinks, soft hats, and rounded hands without protruding fingernails. A beveled silver revolver with wooden grip, brass trigger guard and visible cylinder rests to the right of your cup throughout play. It is lifted into first-person view for the existing shot sequence.

## Build 6

Shooting now smoothly interpolates from the resting table pose, with cocking sound, steady hold, recoil, settling and return. Deck has a new **Devils Deal adaptation** ruleset; E is played alone and checks the previous four played cards. See RULES.md for the official success condition and explicitly documented house-rule details.

## Build 7

- Character glances, tense pre-shot poses, relief nods and smooth elimination slumps.
- Last challenge panel: resolved dice/cards/reels and explicit outcome, while fresh private hands remain hidden.
- Reader, Gambler and Trickster AI personalities adjust challenge, bluff and fold decisions without accessing opponents’ private information.
- Four-step interactive practice tutorial on the front page.
- Slow/Normal/Fast animation settings saved locally; online turn deadlines stay at 45 seconds. Speed changes apply to the next shooting sequence.

### Build 8 — table feedback
Played Deck cards now fly into a persistent face-down 3D pile. Challenges flip the resolved cards face-up briefly. Numbered public action notices identify callers and outcomes without repeating on room polling. Chamber tracks show spent pulls, loaded bullet count and the conditional next-pull risk; chamber positions remain private. Steam presentation reference: https://steamcommunity.com/app/3097560/announcements/ (Deck Remastered UI and animation updates).

### Build 9 — clearer table and compact controls
Compact bottom actions with the current claim over the felt; covered hands no longer reserve an empty panel. Dice bids use quantity steppers and selectable faces with legal-raise guidance. All seats share the same smaller leather cup. Removed intersecting tabletop bottles, separated the local drink from the revolver, and laid opponents guns on their sides.
