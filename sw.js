// Bump CACHE_VERSION whenever game files change so installed copies pick up the update.
const CACHE_VERSION = 'dragonslayer-v1';

const ASSETS = [
  'dragonslayer.html',
  'manifest.webmanifest',
  'logo.png',
  'icons/apple-touch-icon.png',
  'icons/favicon-32.png',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/maskable-192.png',
  'icons/maskable-512.png',
  'fonts/UnifrakturMaguntia/UnifrakturMaguntia-Regular.ttf',
  'armor/chain_mail.png',
  'armor/dragon_armor.png',
  'armor/leather_armor.png',
  'armor/peasant_clothes.png',
  'armor/plate_armor.png',
  'kingdom_banners/ashenvale.png',
  'kingdom_banners/crimson_keep.png',
  'kingdom_banners/frostpeak.png',
  'kingdom_banners/ironforge.png',
  'kingdom_banners/saltmere.png',
  'kingdom_banners/thornwood.png',
  'potions/healing.png',
  'potions/invisibility.png',
  'potions/regeneration.png',
  'potions/speed.png',
  'potions/stamina.png',
  'potions/strength.png',
  'sprites/bandit.png',
  'sprites/banshee.png',
  'sprites/barbarian.png',
  'sprites/basilisk.png',
  'sprites/bat.png',
  'sprites/cyclops.png',
  'sprites/dark_knight.png',
  'sprites/dragon.png',
  'sprites/frost_giant.png',
  'sprites/gargoyle.png',
  'sprites/ghoul.png',
  'sprites/giant_bat.png',
  'sprites/giant_crab.png',
  'sprites/giant_rat.png',
  'sprites/giant_scorpion.png',
  'sprites/giant_spider.png',
  'sprites/goblin.png',
  'sprites/griffin.png',
  'sprites/harpy.png',
  'sprites/hydra.png',
  'sprites/ice_wolf.png',
  'sprites/imp.png',
  'sprites/kobold.png',
  'sprites/kraken.png',
  'sprites/lich.png',
  'sprites/manticore.png',
  'sprites/merchant.png',
  'sprites/minotaur.png',
  'sprites/orc.png',
  'sprites/pirate.png',
  'sprites/polar_bear.png',
  'sprites/priest.png',
  'sprites/rat.png',
  'sprites/sea_troll.png',
  'sprites/siren.png',
  'sprites/skeleton.png',
  'sprites/thief.png',
  'sprites/treasure.png',
  'sprites/troglodyte.png',
  'sprites/troll.png',
  'sprites/werewolf.png',
  'sprites/wight.png',
  'sprites/wild_boar.png',
  'sprites/wizard.png',
  'sprites/wolf.png',
  'sprites/wyvern.png',
  'sprites/zombie.png',
  'weapons/battle_axe.png',
  'weapons/enchanted_blade.png',
  'weapons/longsword.png',
  'weapons/mace.png',
  'weapons/rusty_dagger.png',
  'weapons/short_sword.png',
  'weapons/spear.png',
  'weapons/war_hammer.png',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE_VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;

  // Pages: network first so updates show up, cached copy when offline.
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then(res => {
          const copy = res.clone();
          caches.open(CACHE_VERSION).then(cache => cache.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req).then(hit => hit || caches.match('dragonslayer.html')))
    );
    return;
  }

  // Art, fonts, etc.: cache first.
  event.respondWith(
    caches.match(req).then(hit => hit || fetch(req).then(res => {
      if (res.ok) {
        const copy = res.clone();
        caches.open(CACHE_VERSION).then(cache => cache.put(req, copy));
      }
      return res;
    }))
  );
});
