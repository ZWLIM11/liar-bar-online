# Rules research and implementation notes

Checked 12 October 2026 against the [publisher's Steam store description](https://store.steampowered.com/app/3097560/Liar_s_Bar/) and [official announcements](https://steamcommunity.com/app/3097560/announcements/). The attached guide was used as a starting point. The game changes during Early Access, so this file distinguishes published behavior from the local prototype's decisions.

## Current mode list

1. **Liar's Dice** — secret rolls, rising quantity/face bids, challenge, two poison drinks to elimination.
2. **Liar's Deck** — face-down cards claimed as the table's rank, challenges, six-chamber Russian roulette after a lost challenge.
3. **Liar's Poker** — Texas Hold'em style shared cards, bullets as bets, Call/Fold/Switch/All-In and a once-per-game Coward's Fold.
4. **Liar's Slots** — the mode called “Liar's Roulette” in the attached guide and older store text. Four reels, Heart claims or Jackpot, one public reel, LIAR challenge, Death Spin, five-point Execute and once-per-game Double Spin. The [December 2025 announcement](https://steamcommunity.com/app/3097560/announcements/) confirms its released name.

The official store describes all four. Its introductory Early Access paragraph still describes only Dice and Deck; later announcements confirm Poker and Slots were released.

## Published variants and changes

- **Traditional Dice**: ones are wild; an exact **Spot On** call makes opponents drink. [Official ruleset announcement](https://steamcommunity.com/games/3097560/announcements/detail/4532401922180522149).
- **Devil Deck**: a Devil card forces opponents into roulette when revealed. The July 2026 update added **Devil's Deal**: if the last four cards are lies, everyone except its revealer pulls the trigger. [Official update](https://steamcommunity.com/app/3097560/announcements/).
- **Chaos Deck**: the July 2026 update says Chaos cards activate when played, cards are no longer redistributed after a successful Liar call or special hand, and a successful Liar call shoots only the challenged player. The earlier community guide and attached specification describe older behavior. [Official update](https://steamcommunity.com/app/3097560/announcements/).
- **Poker**: the July 2026 update disallows All-In on the same turn as Switch and changes Switch options through the round. [Official update](https://steamcommunity.com/app/3097560/announcements/).

## What this prototype implements

| Mode | Implemented | Deliberate adaptation / missing detail |
| --- | --- | --- |
| Dice | Standard bidding, challenge, two drinks, Traditional wild ones and Spot On | Computer opponents, no live players |
| Deck | 20-card standard deck from the attached guide, five-card hands, 1–3 card plays, challenges, persistent chamber position; Devil card | Devil's Deal is not implemented. “Chaos adaptation” uses the guide's earlier small-deck idea and is explicitly not the current official ruleset. |
| Poker | Private and community cards, standard five-card hand comparison, bullet risk, Call, Fold, Coward's Fold, Switch, All-In | The store omits exact betting limits and penalty formulas. One decision per street and bullet/6 elimination odds are house rules. Switch replaces one card rather than offering the current game's staged choice count. |
| Slots | Four reels, public first reel, claims, challenge, Death Spin, points, Execute, Double Spin | Accepted claims award their declared point amount; Death Spin uses a one-in-four Heart reel. These details are house rules because exact values are not fully specified in the cited store text. |

## Online scope

This is a local solo prototype. A real Cloudflare multiplayer release needs server-authoritative room state, private hands and rolls sent only to their owners, player reconnects, turn deadlines, and validation of every action. The source intentionally does not display working online-room controls until that backend exists.
