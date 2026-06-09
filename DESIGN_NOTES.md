# Dragonslayer — Design Notes

## Revisit

### Stamina Attack Buff Rate
Currently `attackBuff = floor(stamina / 6)` — flat bonus added to dice sum before enemy defense.
At max stamina (24) this gives +4; at full with Vitality perk (36) gives +6.

**Concern:** No penalty for low stamina — draining it just loses the bonus rather than hurting you.
This may reduce incentive to defend or use light attacks to restore stamina.

**Alternative to test:** `attackBuff = max(0, floor(stamina / 6) − 2)`
- Full stamina (24): +2 bonus
- Half stamina (12): +0
- Empty: 0 (no negative)
- Shifts the buff to feel like a reward for staying topped up rather than a baseline expectation.

---

## Planned Enhancements

---

### Rest System Rework

**Current behavior:** Rest costs 18g, heals 18 HP, no day cost.

**Planned behavior:**

#### 1. Resting ends the day
- Any rest action advances the day counter by 1.
- Creates direct tension between HP recovery and the 30-day clock.

#### 2. Two rest options: Inn vs. Countryside

**Inn (costs gold)**
- Requires a kingdom with an inn (all current kingdoms qualify).
- Costs gold (scaling by kingdom tier — better inns in higher-tier kingdoms).
- Restores more HP than countryside (e.g. 36 HP — a full 6-die heal).
- Safe, guaranteed recovery.
- Could vary by kingdom: Ironforge has a spartan but reliable dwarven lodge; Saltmere has a noisy tavern; Frostpeak has a heated keep.

**Countryside (free)**
- Available anywhere, including while traveling.
- Restores less HP (e.g. 18 HP — 3-die heal).
- Two random events possible (roll on encounter table):
  - Monster encounter → forced combat (scales with current kingdom tier).
  - Bandit ambush → lose gold or fight.
  - Peaceful night → full rest, no event.

#### 3. Inn gambling
- After checking in, player is offered an optional gambling mini-game.
- Keep the d6 theme: bet a multiple of 6 gold coins, roll dice against the house.
- Possible mechanic: player and house each roll 1d6; highest wins the pot.
  - Tie → push (no gold changes hands).
  - Could escalate: double-or-nothing re-roll option.
- Stakes scale with kingdom wealth (Saltmere pirates gamble big; Ashenvale is modest).

#### 4. Bandit ambush — fight or submit
When a bandit ambush triggers during travel, give the player a choice:
- **Fight** → enter combat against a bandit enemy (scaled to current kingdom tier). Win = keep your gold + earn the bandit's loot. Lose = lose gold as normal plus a HP penalty.
- **Submit** → lose gold immediately with no combat, as the current behavior.

This makes the ambush a meaningful decision rather than a passive tax. A strong, well-healed player will want to fight; a low-HP player may prefer to cut their losses.

Implementation note: show an event modal with two buttons ("⚔️ Fight" / "💰 Hand it over") before resolving the ambush. If the player chooses to fight, call `beginCombat()` with a bandit monster drawn from the current kingdom's monster pool (or a dedicated `bandit` monster entry).

#### 5. Countryside encounter scaling
- Encounter probability and difficulty scale with kingdom tier.
  - Tier 1 (Ashenvale): 20% chance, weak monsters (goblin, wolf).
  - Tier 2 (Thornwood, Ironforge, Saltmere): 35% chance, mid monsters.
  - Tier 3 (Crimson Keep, Frostpeak): 50% chance, dangerous monsters.
- Bandit encounters: steal 1d6 × 6 gold, or player can fight them off.
- A failed countryside rest (combat or bandit loss) still advances the day.

---

### Implementation Notes
- The `rest()` function will split into `restInn()` and `restCountryside()`.
- A new "Rest" screen replaces the current single button, letting the player choose.
- Day increment moves into the rest functions (currently only travel increments days).
- Gambling can live in a modal similar to the existing event modal.
- Countryside encounters reuse the existing combat system.

---

### Dungeons

Selected kingdoms have a dungeon accessible from the kingdom screen alongside Explore, Market, Rest, and Travel.

#### Which kingdoms have dungeons
Not every kingdom — makes them feel special. Suggested candidates:
- **Ironforge** — abandoned mine shafts full of rock creatures and trapped dwarven treasure.
- **Crimson Keep** — crypt beneath the fortress; undead, cursed knights, dark loot.
- **Frostpeak** — frozen caverns; ice monsters, frost giant lieutenants, rare northern gear.

#### Structure
- A dungeon run is a fixed sequence of encounters (e.g. 5–7 rooms), not open-ended grinding.
- Each room has a random encounter drawn from a slightly elevated monster pool (one tier above the kingdom's normal monsters).
- After clearing all rooms the dungeon is exhausted — it resets the next day, so the player can only run it once per visit unless they travel away and return.
- Player can retreat after any room, keeping loot earned so far. Retreating still costs time (half a day).
- Completing all rooms awards a bonus chest (guaranteed loot roll).

#### Loot
Dungeons have a higher loot roll chance per encounter than normal Explore:
- **Gold:** 2–3× the kingdom's normal gold drop range (all multiples of 6).
- **Weapon drop:** ~30% chance of finding a weapon one tier above what's sold locally.
- **Armor drop:** ~20% chance of finding an armor piece one tier above local stock.
- **Potion:** ~25% chance per room of finding a health potion.
- Bonus chest (final room): guaranteed weapon or armor drop + elevated gold.

#### Implementation Notes
- Dungeons need a state flag per kingdom: `dungeon_cleared_day` so they reset correctly.
- Monster pool for dungeons: take the kingdom's normal monster list and add the next tier up (e.g. Ironforge normally has Orc/Troll — dungeon adds Dark Knight).
- Loot rolls happen post-combat in the dungeon context, using a separate `rollDungeonLoot()` function.
- A room counter UI ("Room 3 of 6") replaces the normal battle header during a dungeon run.
- Found weapons/armor go directly into inventory (auto-equip if better, otherwise offer sell prompt).

---

### Training & Stat Progression

Replace the level-up / perk system with per-stat upgrade ladders accessible via a "Train" button on the kingdom screen.

#### How it works
- XP is earned from combat as normal (no change to earning).
- Instead of auto-leveling into a perk modal, XP is a spendable currency.
- Each stat (ATK, DEF, HP, Stamina) has its own upgrade counter and doubling cost ladder.
- Cost of next upgrade for a given stat: `60 × 2^upgradeCount` for that stat.
  - 1st upgrade: 60 XP · 2nd: 120 · 3rd: 240 · 4th: 480 · 5th: 960 · 6th: 1920
- Each upgrade always gives +6 to the stat, consistent with the d6 system.
- Stats are upgraded independently — heavy ATK investment doesn't raise DEF costs.

#### Kingdom Experts (future)
Certain kingdoms have a master trainer for a specific stat who discounts upgrades for that stat:
- **Ironforge** — Dwarven weapon-smith: ATK upgrades −20%.
- **Crimson Keep** — Battle-hardened knight: DEF upgrades −20%.
- **Frostpeak** — Northern survivalist: HP upgrades −20%.
- **Saltmere** — Pirate endurance coach: Stamina upgrades −20%.
Discounts apply to the XP cost only (not gold). Could be expanded: higher-tier experts give bigger discounts, or unlock a stat cap raise.

---

### Magic Items Shop

A dedicated Magic Items tab in the Market (or a separate Mage's Shop building) selling consumable and permanent enchantments. Keeps the d6 theme — all bonuses and costs are multiples of 6.

#### Categories

**Attack Enchantments**
- *Sharpening Stone* — temporary: next attack roll adds +6 to the dice sum (one combat).
- *Rune of Striking* — permanent: +6 base ATK (stacks with weapon; raises dice count threshold earlier).
- *Berserker Draught* — temporary: stamina multiplier floored at 1.0 for the next combat (no penalty for low stamina).

**Defense Enchantments**
- *Ward Scroll* — temporary: absorb the next 12 damage in combat (like a one-time shield).
- *Rune of Fortitude* — permanent: +6 base DEF (stacks with armor).
- *Stoneskin Potion* — temporary: defFrac halved for one combat (dramatically reduces damage taken).

**Health Regeneration**
- *Healing Salve* — combat use: restores 18 HP instantly (cheaper than a potion, less heal).
- *Rune of Vitality* — permanent: +12 max HP.
- *Bloodmoss Tonic* — passive: regenerate 6 HP at the start of each new combat (one fight).

**Stamina**
- *Energy Crystal* — combat use: restore 12 stamina instantly (usable instead of Defend).
- *Rune of Endurance* — permanent: +12 max stamina (same as the Vitality level-up perk but purchasable).
- *Stamina Draught* — temporary: stamina restores an extra +6 on every light attack and defend for one combat.

#### Economy
- Temporary items: 60–120g each (single-use, available in most kingdoms).
- Permanent runes: 180–360g each (limited stock per kingdom; sold out until player travels away and returns).
- Magic items available only in kingdoms tier 2+; Frostpeak and Crimson Keep carry the rarest permanent runes.

#### Implementation Notes
- Temporary items go into a new `G.magicItems[]` array consumed on use.
- Permanent runes apply immediately and modify `G.baseAtk`, `G.baseDef`, `G.maxHp`, or `G.maxStam`.
- A `magicItems` tab added to the Market screen alongside Weapons, Armor, Potions, Sell.
- Combat UI gets a new "Use Item" button that opens a mini-menu of equipped consumables.
