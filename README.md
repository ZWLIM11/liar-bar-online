# The Liar's Table

An original browser prototype inspired by bluffing games at a saloon table. It uses the user's layout reference for visual direction and original generated saloon artwork. It does not reuse Liar's Bar game assets or characters.

## Play

Open `index.html` in a browser. Select one of four modes, choose a character and ruleset, then **Take a seat**. This build plays locally against computer opponents. There is no real online lobby or private room yet.

## Modes

| Mode | What is playable | Source and limits |
| --- | --- | --- |
| Liar's Dice | Secret five-die rolls, rising bids, challenges, two poison lives | Standard and Traditional (wild ones, Spot On). [Official store](https://store.steampowered.com/app/3097560/Liar_s_Bar/), [Traditional announcement](https://steamcommunity.com/games/3097560/announcements/detail/4532401922180522149) |
| Liar's Deck | Table rank, 1–3 card claims, challenges, six-chamber penalty | Standard and Devil rules. Chaos is explicitly a prototype adaptation, because [the July 2026 update](https://steamcommunity.com/app/3097560/announcements/) changed activation and redealing. |
| Liar's Poker | Private cards, community cards, call/fold/switch/all in, hand showdown | The [official store](https://store.steampowered.com/app/3097560/Liar_s_Bar/) describes the actions, but not all betting and penalty details. The implemented six-chamber risk is a house rule. |
| Liar's Slots | Four reels, one public symbol, claims, challenge, Death Spin, points, Execute, Double Spin | The [official store](https://store.steampowered.com/app/3097560/Liar_s_Bar/) outlines the mode; [official announcement](https://steamcommunity.com/app/3097560/announcements/) uses the current name *Liar's Slots*. Scoring details are a house rule. |

This is a prototype, not a full rules-identical port of the commercial game. The rules panel inside the game lists the sources and adaptations. The new online room flow suggested by the attached design is not implemented in this static build.

## Files

- `index.html` — game screen and rules dialog
- `styles.css` — responsive saloon layout and table UI
- `game.js` — local game flow and computer players
- `assets/saloon.png` — original image generated for this project

No build step or dependencies are required.
