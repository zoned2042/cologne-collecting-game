/* Sillage — fragrance catalog.
 * Every entry is a real, released fragrance. Prices are approximate full-bottle
 * retail in USD and are used as the game's base market value.
 * Line format:  Name | base price | scent family | flags
 *   flags: D = discontinued (vintage market only, value appreciates)
 *          L = limited / legendary (vault only)
 * Houses carry the 3D bottle archetype, cap finish and label colours.
 */
const FAMILIES = {
  fresh:    { label: 'Fresh',    color: '#a9dcea', ask: 'clean and fresh, like a crisp white shirt' },
  citrus:   { label: 'Citrus',   color: '#f1d34f', ask: 'bright and zesty for summer mornings' },
  aquatic:  { label: 'Aquatic',  color: '#3f9fd3', ask: 'something that smells like a sea breeze' },
  aromatic: { label: 'Aromatic', color: '#93c47d', ask: 'herbal, lavender, that barbershop feel' },
  woody:    { label: 'Woody',    color: '#b97c42', ask: 'warm woods, cedar or sandalwood' },
  spicy:    { label: 'Spicy',    color: '#cf5530', ask: 'spicy, pepper and cardamom with some heat' },
  sweet:    { label: 'Sweet',    color: '#e98fb6', ask: 'sweet and fruity, a crowd-pleaser' },
  gourmand: { label: 'Gourmand', color: '#94532d', ask: 'edible, vanilla or coffee or chocolate' },
  amber:    { label: 'Amber',    color: '#e3962f', ask: 'warm amber and resins for cold nights' },
  oud:      { label: 'Oud',      color: '#5a3020', ask: 'deep, smoky oud' },
  leather:  { label: 'Leather',  color: '#7a4127', ask: 'rich leather, like a new car interior' },
  tobacco:  { label: 'Tobacco',  color: '#a86c2c', ask: 'pipe tobacco and honey' },
  floral:   { label: 'Floral',   color: '#f2a9cb', ask: 'a beautiful floral bouquet' },
  musk:     { label: 'Musk',     color: '#efe5d6', ask: 'a soft, skin-like musk' },
};

const HOUSES = [
  { id: 'afnan', name: 'Afnan', origin: 'Dubai', shape: 'arab', cap: 'gold', lbg: '#1b1410', lfg: '#d9b56a', items: `
9pm|40|sweet
9pm Rebel|45|fresh
9pm Elixir|50|amber
9pm Night Out|50|sweet
9am Dive|40|aquatic
Supremacy Silver|45|fresh
Supremacy Not Only Intense|50|fresh
Supremacy Collector's Edition|55|woody
Supremacy in Oud|50|oud
Supremacy Incense|50|spicy
Supremacy Noir|50|amber
Supremacy Gold|50|amber
Supremacy in Heaven|50|sweet
Turathi Blue|45|citrus
Turathi Brown|45|amber
Turathi Electric|45|fresh
Rare Carbon|45|leather
Rare Reef|45|aquatic
Modest Une pour Homme|35|aromatic
Mystique Bouquet|40|floral` },

  { id: 'rayhaan', name: 'Rayhaan', origin: 'Dubai', shape: 'arab', cap: 'black', lbg: '#0f1a22', lfg: '#c9d6df', items: `
Rayhaan Elixir|40|sweet
Pacific Aura|40|aquatic
Pacific|38|aquatic
Pacific Aloha|40|citrus
Lion|40|spicy
Obsidian|40|amber
Aquatica|38|aquatic
Terra|38|woody
Italia|38|citrus
Valhalla|40|aromatic
Crimson|40|sweet
Corium|40|leather
Imperia|40|woody
Imperia Intense|42|woody
Nocturno Elixir|42|amber
Azul|38|fresh
Pharaoh|42|oud
Tonquin Giza|40|gourmand
Wood Noir|40|woody
Royal Wood|40|woody
Ocean Rush|38|aquatic
Dark Leather|40|leather
Cordova|40|spicy
Tiger Cal Cologne Edition|38|citrus
Wolf|40|spicy
Tropical Vibe|38|sweet
Jungle Vibe|38|fresh` },

  { id: 'lattafa', name: 'Lattafa', origin: 'Dubai', shape: 'arab', cap: 'gold', lbg: '#2a1a0d', lfg: '#f0cf8a', items: `
Khamrah|35|gourmand
Khamrah Qahwa|35|gourmand
Asad|25|spicy
Bade'e Al Oud Oud for Glory|30|oud
Bade'e Al Oud Amethyst|30|floral
Fakhar Black|30|aromatic
Ana Abiyedh|25|musk
Yara|25|sweet
Raghba|20|gourmand
Hayaati|25|fresh
Oud Mood|30|oud
Qaed Al Fursan|20|sweet` },

  { id: 'armaf', name: 'Armaf', origin: 'Dubai', shape: 'tall', cap: 'black', lbg: '#101010', lfg: '#e8e8e8', items: `
Club de Nuit Intense Man|35|woody
Club de Nuit Sillage|40|fresh
Club de Nuit Untold|45|amber
Club de Nuit Milestone|40|aquatic
Club de Nuit Iconic|45|aromatic
Club de Nuit Urban Man Elixir|45|fresh
Tres Nuit|30|fresh
Odyssey Homme|30|sweet` },

  { id: 'rasasi', name: 'Rasasi', origin: 'Dubai', shape: 'orb', cap: 'silver', lbg: '#0c2233', lfg: '#bfe3f5', items: `
Hawas for Him|45|aquatic
Hawas Ice|50|fresh
Shuhrah pour Homme|40|spicy
Daarej pour Homme|40|spicy
La Yuqawam pour Homme|80|leather` },

  { id: 'byredo', name: 'Byredo', origin: 'Stockholm', shape: 'cyl', cap: 'black', lbg: '#f4f2ee', lfg: '#111111', items: `
Bal d'Afrique|285|citrus
Gypsy Water|285|woody
Mojave Ghost|285|floral
Blanche|285|musk
Super Cedar|285|woody
Bibliothèque|285|sweet
Rose of No Man's Land|285|floral
Oud Immortel|330|oud
Tobacco Mandarin|330|tobacco
Eleventh Hour|285|spicy
Mixed Emotions|285|woody
Black Saffron|285|spicy
Pulp|285|sweet
Sundazed|285|citrus
Slow Dance|285|amber
Lil Fleur|285|floral
Velvet Haze|285|musk
Mumbai Noise|285|amber
1996|285|leather` },

  { id: 'pdm', name: 'Parfums de Marly', origin: 'Paris', shape: 'pdm', cap: 'gold', lbg: '#151515', lfg: '#d8b46a', items: `
Layton|335|spicy
Layton Exclusif|400|oud
Pegasus|335|gourmand
Pegasus Exclusif|400|gourmand
Herod|335|tobacco
Sedley|335|fresh
Percival|335|fresh
Greenley|335|fresh
Carlisle|370|sweet
Kalan|335|spicy
Haltane|400|oud
Althaïr|335|gourmand
Godolphin|335|leather
Galloway|335|citrus
Oajan|335|amber
Darley|335|spicy
Delina|335|floral
Valaya|335|musk` },

  { id: 'tomford', name: 'Tom Ford', origin: 'New York', shape: 'square', cap: 'black', lbg: '#0b0b0b', lfg: '#efe7d6', items: `
Oud Wood|295|oud
Tobacco Vanille|295|tobacco
Tuscan Leather|295|leather
Lost Cherry|395|sweet
Fucking Fabulous|395|leather
Ombré Leather|180|leather
Noir Extreme|185|amber
Noir|150|spicy
Costa Azzurra|295|aquatic
Neroli Portofino|295|citrus
Soleil Blanc|295|floral
Grey Vetiver|160|woody
Tom Ford for Men|130|aromatic
Beau de Jour|170|aromatic
Bitter Peach|395|sweet
Black Orchid|180|floral
Tobacco Oud|395|tobacco
Rose Prick|395|floral
Ébène Fumé|395|woody
Oud Minérale|395|aquatic
Electric Cherry|395|sweet
Vanilla Sex|395|gourmand
Café Rose|295|floral
Noir de Noir|295|floral
Tom Ford for Men Extreme|300|amber|D` },

  { id: 'lv', name: 'Louis Vuitton', origin: 'Paris', shape: 'lv', cap: 'silver', lbg: '#efe9df', lfg: '#3b2a1a', items: `
Ombre Nomade|425|oud
L'Immensité|395|fresh
Imagination|395|citrus
Météore|395|citrus
Nouveau Monde|425|leather
Sur la Route|395|citrus
Orage|395|woody
Afternoon Swim|395|citrus
Pacific Chill|395|fresh
Symphony|395|citrus
California Dream|395|citrus
Cosmic Cloud|395|musk
Stellar Times|425|amber
Les Sables Roses|425|floral
Attrape-Rêves|395|floral
Spell on You|395|floral
Dancing Blossom|395|floral
Rhapsody|395|floral` },

  { id: 'polo', name: 'Ralph Lauren', origin: 'New York', shape: 'flask', cap: 'silver', lbg: '#0f2a1e', lfg: '#e8dcc0', items: `
Polo|95|aromatic
Polo Blue|95|aquatic
Polo Blue Parfum|130|aquatic
Polo Red|95|spicy
Polo Red Extreme|100|spicy
Polo Black|90|sweet
Polo 67|105|woody
Polo Sport|70|fresh
Ralph's Club|110|woody
Ralph's Club Parfum|130|woody
Safari for Men|90|aromatic|D
Polo Double Black|95|sweet|D
Polo Supreme Oud|120|oud|D
Polo Ultra Blue|95|aquatic|D` },

  { id: 'valentino', name: 'Valentino', origin: 'Rome', shape: 'studs', cap: 'black', lbg: '#1a1a1a', lfg: '#e9d3a6', items: `
Uomo|110|gourmand
Uomo Intense|130|amber
Uomo Born in Roma|120|aromatic
Uomo Born in Roma Intense|140|sweet
Uomo Born in Roma Coral Fantasy|120|sweet
Uomo Born in Roma Yellow Dream|120|citrus
Donna Born in Roma|140|floral
Uomo Acqua|100|fresh|D` },

  { id: 'clive', name: 'Clive Christian', origin: 'London', shape: 'crown', cap: 'gold', lbg: '#f2ead6', lfg: '#3a2a0e', items: `
No.1 Masculine|895|woody
X Masculine|895|spicy
1872 Masculine|575|citrus
C Masculine|650|spicy
V Masculine|650|amber
Jump Up and Kiss Me Hedonistic|725|floral
Matsukita|725|woody
Town & Country|725|aromatic
No.1 Imperial Majesty|215000|woody|L` },

  { id: 'creed', name: 'Creed', origin: 'Paris', shape: 'tall', cap: 'silver', lbg: '#f5f3ee', lfg: '#1a1a1a', items: `
Aventus|495|sweet
Green Irish Tweed|445|fresh
Silver Mountain Water|445|fresh
Viking|445|spicy
Viking Cologne|445|fresh
Royal Oud|495|oud
Millésime Impérial|445|aquatic
Original Vetiver|445|citrus
Himalaya|445|woody
Virgin Island Water|445|citrus
Bois du Portugal|445|woody
Aventus Cologne|445|citrus
Original Santal|445|woody
Erolfa|445|aquatic
Royal Water|445|citrus
Carmina|495|floral
Queen of Silk|495|floral
Tabarome|445|tobacco|D
Aventus 10th Anniversary|1100|sweet|L
Absolu Aventus|900|sweet|L` },

  { id: 'dior', name: 'Dior', origin: 'Paris', shape: 'flask', cap: 'black', lbg: '#202a33', lfg: '#e4e9ee', items: `
Sauvage Eau de Toilette|120|fresh
Sauvage Eau de Parfum|130|amber
Sauvage Parfum|140|woody
Sauvage Elixir|185|spicy
Sauvage Eau Forte|135|fresh
Dior Homme Intense|140|floral
Dior Homme|115|woody
Dior Homme Sport|110|citrus
Dior Homme Parfum|160|leather
Fahrenheit|110|leather
Eau Sauvage|105|citrus
Oud Ispahan|295|oud
Ambre Nuit|295|amber
Gris Dior|295|woody
Bois d'Argent|295|musk
Tobacolor|295|tobacco
Fève Délicieuse|295|gourmand
Vanilla Diorama|295|gourmand
Spice Blend|295|spicy
Dior Homme 2005|220|floral|D` },

  { id: 'chanel', name: 'Chanel', origin: 'Paris', shape: 'flask', cap: 'black', lbg: '#ffffff', lfg: '#000000', items: `
Bleu de Chanel Eau de Toilette|120|woody
Bleu de Chanel Eau de Parfum|140|woody
Bleu de Chanel Parfum|160|woody
Allure Homme Sport|115|fresh
Allure Homme Sport Eau Extrême|130|fresh
Allure Homme Édition Blanche|130|citrus
Égoïste|120|spicy
Égoïste Platinum|115|aromatic
Antaeus|120|leather
Pour Monsieur|120|citrus
Sycomore|375|woody
Coromandel|375|amber
Boy Chanel|375|aromatic
Le Lion|375|amber
Coco Mademoiselle|150|floral
N°5|150|floral` },

  { id: 'ysl', name: 'Yves Saint Laurent', origin: 'Paris', shape: 'flask', cap: 'black', lbg: '#0b0b0b', lfg: '#d6b46a', items: `
Y Eau de Parfum|125|aromatic
Y Eau de Toilette|110|fresh
Y Le Parfum|140|aromatic
La Nuit de L'Homme|115|spicy
L'Homme|105|woody
MYSLF|125|floral
Kouros|95|aromatic
Tuxedo|260|spicy
Libre|140|floral
M7 Oud Absolu|240|oud|D` },

  { id: 'armani', name: 'Giorgio Armani', origin: 'Milan', shape: 'flask', cap: 'silver', lbg: '#e9eef2', lfg: '#1d2a36', items: `
Acqua di Giò Eau de Toilette|110|aquatic
Acqua di Giò Profumo|130|aquatic
Acqua di Giò Profondo|125|aquatic
Acqua di Giò Parfum|140|aquatic
Armani Code|110|amber
Armani Code Profumo|130|amber
Armani Code Parfum|140|woody
Stronger With You Intensely|115|sweet
Stronger With You Absolutely|125|sweet
Privé Oud Royal|330|oud
Privé Bois d'Encens|300|spicy
Privé Rouge Malachite|330|floral` },

  { id: 'versace', name: 'Versace', origin: 'Milan', shape: 'flask', cap: 'gold', lbg: '#0f3b5c', lfg: '#e9c46a', items: `
Eros|100|sweet
Eros Flame|110|spicy
Eros Parfum|120|sweet
Eros Energy|115|citrus
Dylan Blue|90|aquatic
Pour Homme|80|fresh
Pour Homme Oud Noir|110|oud
The Dreamer|70|aromatic|D` },

  { id: 'prada', name: 'Prada', origin: 'Milan', shape: 'flask', cap: 'black', lbg: '#16181c', lfg: '#e43b3b', items: `
L'Homme Prada|120|musk
Luna Rossa Carbon|110|aromatic
Luna Rossa Black|110|amber
Luna Rossa Ocean|120|aquatic
Paradigme|130|amber
Amber pour Homme|110|amber` },

  { id: 'rabanne', name: 'Rabanne', origin: 'Paris', shape: 'ingot', cap: 'gold', lbg: '#c9a14a', lfg: '#2b1d05', items: `
1 Million|100|sweet
1 Million Parfum|120|sweet
1 Million Royal|125|amber
Invictus|95|fresh
Invictus Victory|110|amber
Invictus Victory Elixir|125|amber
Invictus Platinum|110|aromatic
Phantom|100|aromatic
Pure XS|95|spicy
Black XS|90|sweet|D` },

  { id: 'jpg', name: 'Jean Paul Gaultier', origin: 'Paris', shape: 'torso', cap: 'silver', lbg: '#1d3a6b', lfg: '#ffffff', items: `
Le Male|100|aromatic
Le Male Elixir|125|amber
Le Male Le Parfum|120|amber
Ultra Male|110|sweet
Le Beau|105|woody
Le Beau Le Parfum|120|woody
Scandal pour Homme|105|gourmand
Kokorico|90|gourmand|D` },

  { id: 'mfk', name: 'Maison Francis Kurkdjian', origin: 'Paris', shape: 'square', cap: 'gold', lbg: '#fbfaf7', lfg: '#7a5a1e', items: `
Baccarat Rouge 540|325|amber
Baccarat Rouge 540 Extrait|435|amber
Grand Soir|275|amber
Oud Satin Mood|375|oud
Oud Silk Mood|375|oud
Aqua Universalis|235|fresh
Gentle Fluidity Gold|255|musk
Gentle Fluidity Silver|255|aromatic
Petit Matin|255|citrus
Amyris Homme|245|woody` },

  { id: 'xerjoff', name: 'Xerjoff', origin: 'Turin', shape: 'faceted', cap: 'gold', lbg: '#151515', lfg: '#e6c77a', items: `
Naxos|335|tobacco
Alexandria II|495|oud
Erba Pura|300|sweet
Torino21|310|aromatic
Mefisto|300|citrus
40 Knots|300|aquatic
More Than Words|375|amber
Accento|300|floral` },

  { id: 'amouage', name: 'Amouage', origin: 'Muscat', shape: 'orb', cap: 'gold', lbg: '#2a1e3a', lfg: '#e6cf98', items: `
Interlude Man|365|amber
Reflection Man|365|floral
Jubilation XXV|405|amber
Epic Man|365|spicy
Guidance|400|amber
Search|365|citrus
Enclave|365|woody
Purpose|365|woody
Beach Hut Man|365|aromatic
Memoir Man|360|leather|D` },

  { id: 'initio', name: 'Initio', origin: 'Paris', shape: 'orb', cap: 'black', lbg: '#0d0d0d', lfg: '#d9d9d9', items: `
Oud for Greatness|345|oud
Side Effect|345|tobacco
Rehab|345|musk
Absolute Aphrodisiac|345|musk
Atomic Rose|345|floral
Musk Therapy|345|musk
Paragon|345|woody
Psychedelic Love|345|musk
High Frequency|345|fresh
Narcotic Delight|345|gourmand` },

  { id: 'lelabo', name: 'Le Labo', origin: 'New York', shape: 'apoth', cap: 'black', lbg: '#f7f3ea', lfg: '#111111', items: `
Santal 33|330|woody
Another 13|330|musk
Bergamote 22|330|citrus
Thé Noir 29|330|woody
Rose 31|330|floral
Oud 27|330|oud
Patchouli 24|330|leather
Vetiver 46|330|woody
Lys 41|330|floral
Matcha 26|330|aromatic
Tabac 28|330|tobacco` },

  { id: 'margiela', name: 'Maison Margiela', origin: 'Paris', shape: 'apoth', cap: 'white', lbg: '#ffffff', lfg: '#222222', items: `
Replica Jazz Club|160|tobacco
Replica By the Fireplace|160|woody
Replica Lazy Sunday Morning|160|musk
Replica Beach Walk|160|citrus
Replica Coffee Break|160|gourmand
Replica Bubble Bath|160|musk
Replica Sailing Day|160|aquatic
Replica Whispers in the Library|160|amber
Replica Autumn Vibes|160|woody
Replica Under the Lemon Trees|160|citrus
Replica Matcha Meditation|160|aromatic
Replica On a Date|160|floral` },

  { id: 'kilian', name: 'Kilian Paris', origin: 'Paris', shape: 'square', cap: 'black', lbg: '#0a0a0a', lfg: '#c9a35a', items: `
Angels' Share|295|gourmand
Love, Don't Be Shy|295|sweet
Black Phantom|295|gourmand
Good Girl Gone Bad|295|floral
Straight to Heaven|295|amber
Intoxicated|295|gourmand
Back to Black|295|tobacco
Moonlight in Heaven|295|citrus
Roses on Ice|295|floral
Smoking Hot|295|tobacco
Apple Brandy on the Rocks|295|sweet
Old Fashioned|295|amber
Vodka on the Rocks|295|fresh` },

  { id: 'roja', name: 'Roja Parfums', origin: 'London', shape: 'faceted', cap: 'crystal', lbg: '#101010', lfg: '#e8d29a', items: `
Elysium Pour Homme|445|citrus
Enigma Pour Homme|445|gourmand
Burlington 1819|445|citrus
Isola Blu|445|aquatic
Danger Pour Homme|495|amber
Apex|445|sweet
Diaghilev|1200|leather
Haute Luxe|2400|amber|L` },

  { id: 'nishane', name: 'Nishane', origin: 'Istanbul', shape: 'hex', cap: 'gold', lbg: '#121a24', lfg: '#e1c27c', items: `
Hacivat|250|sweet
Ani|265|gourmand
Wulong Cha|230|aromatic
Fan Your Flames|265|tobacco
Hundred Silent Ways|265|gourmand
Ege|230|aquatic
Tempfluo|265|amber
Karagöz|265|spicy` },

  { id: 'guerlain', name: 'Guerlain', origin: 'Paris', shape: 'orb', cap: 'gold', lbg: '#efe3c9', lfg: '#3a2a12', items: `
L'Homme Idéal|110|gourmand
Habit Rouge|110|amber
Vétiver|100|woody
Spiritueuse Double Vanille|300|gourmand
Cuir Béluga|300|leather
Bois d'Arménie|300|woody
Santal Royal|300|oud
Tobacco Honey|300|tobacco
Shalimar|140|amber
Héritage|120|aromatic|D` },

  { id: 'hermes', name: 'Hermès', origin: 'Paris', shape: 'square', cap: 'silver', lbg: '#e8752b', lfg: '#ffffff', items: `
Terre d'Hermès|130|woody
Terre d'Hermès Eau Givrée|140|citrus
H24|125|aromatic
Un Jardin sur le Nil|125|fresh
Voyage d'Hermès|125|fresh
Bel Ami Vétiver|140|leather
Équipage|150|aromatic|D
Rocabar|160|woody|D` },

  { id: 'givenchy', name: 'Givenchy', origin: 'Paris', shape: 'flask', cap: 'black', lbg: '#151515', lfg: '#f2f2f2', items: `
Gentleman Réserve Privée|130|amber
Gentleman Eau de Parfum|120|floral
Gentleman Society|125|floral
Gentleman Boisée|125|woody
Pi|80|sweet|D
Insensé|260|floral|D` },

  { id: 'dg', name: 'Dolce & Gabbana', origin: 'Milan', shape: 'flask', cap: 'gold', lbg: '#d9c39a', lfg: '#2a2010', items: `
The One for Men|110|amber
The One for Men Eau de Parfum|120|tobacco
Light Blue pour Homme|100|citrus
Light Blue Eau Intense pour Homme|115|aquatic
K by Dolce & Gabbana|110|citrus
Pour Homme (1994)|90|aromatic|D` },

  { id: 'boss', name: 'Hugo Boss', origin: 'Metzingen', shape: 'tall', cap: 'silver', lbg: '#2a2a2a', lfg: '#ffffff', items: `
Boss Bottled|95|woody
Boss Bottled Elixir|120|amber
Boss The Scent|105|spicy
Hugo Man|75|aromatic` },

  { id: 'burberry', name: 'Burberry', origin: 'London', shape: 'flask', cap: 'black', lbg: '#c8a77a', lfg: '#1a120a', items: `
Hero|110|woody
London for Men|90|spicy
Brit for Him|80|spicy
Mr. Burberry|95|aromatic` },

  { id: 'montblanc', name: 'Montblanc', origin: 'Hamburg', shape: 'flask', cap: 'black', lbg: '#101418', lfg: '#ffffff', items: `
Explorer|90|woody
Explorer Platinum|95|aromatic
Explorer Ultra Blue|90|aquatic
Legend|80|aromatic
Legend Spirit|80|fresh` },

  { id: 'azzaro', name: 'Azzaro', origin: 'Paris', shape: 'ingot', cap: 'silver', lbg: '#8a1b1b', lfg: '#ffffff', items: `
The Most Wanted|110|spicy
Wanted|80|spicy
Wanted by Night|95|spicy
Chrome|70|fresh
Azzaro pour Homme|70|aromatic` },

  { id: 'ck', name: 'Calvin Klein', origin: 'New York', shape: 'flask', cap: 'black', lbg: '#ffffff', lfg: '#111111', items: `
CK One|60|citrus
Eternity for Men|75|aromatic
Eternity Aqua for Men|70|aquatic
Obsession for Men|70|spicy
Defy|80|woody
Escape for Men|60|aquatic|D` },

  { id: 'davidoff', name: 'Davidoff', origin: 'Basel', shape: 'cyl', cap: 'blue', lbg: '#1d4f8a', lfg: '#ffffff', items: `
Cool Water|55|aquatic
Hot Water|60|spicy
Zino|90|aromatic|D` },

  { id: 'vr', name: 'Viktor & Rolf', origin: 'Amsterdam', shape: 'grenade', cap: 'black', lbg: '#2a1010', lfg: '#ff6a3a', items: `
Spicebomb|110|spicy
Spicebomb Extreme|125|tobacco
Spicebomb Night Vision|120|citrus` },

  { id: 'diptyque', name: 'Diptyque', origin: 'Paris', shape: 'oval', cap: 'black', lbg: '#f6f1e6', lfg: '#111111', items: `
Tam Dao|200|woody
Philosykos|200|aromatic
Do Son|200|floral
Orphéon|200|floral
Fleur de Peau|200|musk
Oud Palao|240|oud
Eau Duelle|200|amber` },

  { id: 'malle', name: 'Frédéric Malle', origin: 'Paris', shape: 'apoth', cap: 'black', lbg: '#d33b2c', lfg: '#ffffff', items: `
Portrait of a Lady|375|floral
Musc Ravageur|330|amber
Géranium pour Monsieur|285|aromatic
French Lover|285|woody
Vétiver Extraordinaire|285|woody
Carnal Flower|395|floral
Monsieur.|330|woody` },

  { id: 'lutens', name: 'Serge Lutens', origin: 'Paris', shape: 'cyl', cap: 'black', lbg: '#1a0f2a', lfg: '#d8c6ff', items: `
Ambre Sultan|210|amber
Chergui|210|tobacco
Daim Blond|210|leather
La Fille de Berlin|210|floral
Féminité du Bois|210|woody` },

  { id: 'memo', name: 'Memo Paris', origin: 'Paris', shape: 'oval', cap: 'gold', lbg: '#0f0f0f', lfg: '#e3c88a', items: `
African Leather|295|leather
Irish Leather|295|leather
Italian Leather|295|leather
French Leather|295|leather
Marfa|295|floral
Lalibela|295|amber
Inlé|295|floral` },

  { id: 'mancera', name: 'Mancera', origin: 'Paris', shape: 'cyl', cap: 'black', lbg: '#101010', lfg: '#e6e6e6', items: `
Cedrat Boisé|150|citrus
Red Tobacco|150|tobacco
Instant Crush|150|amber
Roses Vanille|150|gourmand
Aoud Lemon Mint|150|oud
Hindu Kush|150|spicy` },

  { id: 'montale', name: 'Montale', origin: 'Paris', shape: 'cyl', cap: 'silver', lbg: '#2a2a2a', lfg: '#e0e0e0', items: `
Intense Café|140|gourmand
Arabians Tonka|140|oud
Black Aoud|140|oud
Starry Nights|140|sweet
Chocolate Greedy|140|gourmand
Aoud Forest|140|oud` },

  { id: 'bvlgari', name: 'Bvlgari', origin: 'Rome', shape: 'disc', cap: 'silver', lbg: '#151515', lfg: '#d9d9d9', items: `
Man in Black|110|spicy
Aqva pour Homme|90|aquatic
Bvlgari pour Homme|90|musk
Man Wood Essence|105|woody
Le Gemme Tygar|340|citrus` },

  { id: 'cartier', name: 'Cartier', origin: 'Paris', shape: 'flask', cap: 'gold', lbg: '#7a0f16', lfg: '#f2d38a', items: `
Déclaration|130|spicy
L'Envol de Cartier|140|gourmand
Pasha de Cartier|120|aromatic` },

  { id: 'adp', name: 'Acqua di Parma', origin: 'Parma', shape: 'apoth', cap: 'wood', lbg: '#f2d14a', lfg: '#1d1d1d', items: `
Colonia|150|citrus
Colonia Intensa|165|aromatic
Fico di Amalfi|135|citrus
Arancia di Capri|135|citrus
Mirto di Panarea|135|aquatic` },

  { id: 'penhaligons', name: "Penhaligon's", origin: 'London', shape: 'oval', cap: 'animal', lbg: '#efe6d2', lfg: '#2a3a2a', items: `
Halfeti|295|spicy
The Tragedy of Lord George|295|woody
Endymion|200|aromatic
Babylon|295|amber
Juniper Sling|200|aromatic
Sartorial|200|aromatic` },

  { id: 'exnihilo', name: 'Ex Nihilo', origin: 'Paris', shape: 'square', cap: 'gold', lbg: '#0e0e0e', lfg: '#e8e8e8', items: `
Fleur Narcotique|350|floral
Blue Talisman|350|citrus
Lust in Paradise|350|sweet` },

  { id: 'tt', name: 'Tiziana Terenzi', origin: 'Cesena', shape: 'faceted', cap: 'gold', lbg: '#1a1426', lfg: '#e6d1a0', items: `
Kirke|250|sweet
Orion|250|amber
Andromeda|250|sweet
Cassiopea|250|sweet` },

  { id: 'bdk', name: 'BDK Parfums', origin: 'Paris', shape: 'square', cap: 'gold', lbg: '#f4ede4', lfg: '#7a3a2a', items: `
Gris Charnel|210|woody
Rouge Smoking|210|sweet
Pas Ce Soir|210|amber` },

  { id: 'bond', name: 'Bond No. 9', origin: 'New York', shape: 'star', cap: 'silver', lbg: '#ffffff', lfg: '#111111', items: `
Bleecker Street|340|aromatic
Greenwich Village|340|sweet
New York Nights|340|amber
Wall Street|340|aquatic` },

  { id: 'mugler', name: 'Mugler', origin: 'Paris', shape: 'star', cap: 'black', lbg: '#1a1d26', lfg: '#9ad0ff', items: `
A*Men|95|gourmand
Alien Man|110|amber
A*Men Pure Havane|180|tobacco|D` },

  { id: 'ch', name: 'Carolina Herrera', origin: 'New York', shape: 'bolt', cap: 'black', lbg: '#1a1a1a', lfg: '#d8d8d8', items: `
Bad Boy|105|spicy
CH Men Privé|95|leather
212 VIP Men|100|sweet
212 VIP Black|105|aromatic` },

  { id: 'jomalone', name: 'Jo Malone London', origin: 'London', shape: 'apoth', cap: 'black', lbg: '#f6f2ea', lfg: '#1a1a1a', items: `
Wood Sage & Sea Salt|165|aquatic
English Pear & Freesia|165|sweet
Oud & Bergamot|230|oud
Myrrh & Tonka|230|amber
Velvet Rose & Oud|230|floral
Lime Basil & Mandarin|165|citrus` },

  { id: 'gucci', name: 'Gucci', origin: 'Florence', shape: 'tall', cap: 'gold', lbg: '#1e2a1e', lfg: '#e0c27a', items: `
Guilty pour Homme|110|aromatic
Guilty Absolu pour Homme|125|leather
Guilty Elixir pour Homme|135|aromatic
Gucci pour Homme (2003)|300|spicy|D
Rush for Men|140|fresh|D` },

  { id: 'lalique', name: 'Lalique', origin: 'Paris', shape: 'faceted', cap: 'black', lbg: '#0c0c0c', lfg: '#dcdcdc', items: `
Encre Noire|60|woody
Encre Noire à l'Extrême|70|woody` },

  { id: 'issey', name: 'Issey Miyake', origin: 'Tokyo', shape: 'tall', cap: 'silver', lbg: '#dfe6ea', lfg: '#2a3540', items: `
L'Eau d'Issey pour Homme|85|citrus
Nuit d'Issey|85|leather` },

  { id: 'dunhill', name: 'Dunhill', origin: 'London', shape: 'flask', cap: 'black', lbg: '#1a1612', lfg: '#d6c39a', items: `
Icon|90|aromatic
Icon Elite|110|woody
Desire Blue|60|aquatic` },

  { id: 'crivelli', name: 'Maison Crivelli', origin: 'Paris', shape: 'square', cap: 'white', lbg: '#f5f2ee', lfg: '#2a2a2a', items: `
Hibiscus Mahajád|260|floral
Oud Maracujá|295|oud` },

  { id: 'baccarat', name: 'Baccarat', origin: 'Baccarat', shape: 'faceted', cap: 'crystal', lbg: '#7a0d1c', lfg: '#ffffff', items: `
Les Larmes Sacrées de Thèbes|6800|amber|L` },

  { id: 'dkny', name: 'DKNY', origin: 'New York', shape: 'apple', cap: 'gold', lbg: '#1a1a1a', lfg: '#e8d29a', items: `
Be Delicious Men|65|fresh
Golden Delicious Million Dollar Fragrance Bottle|1000000|sweet|L` },

  { id: 'spiritdubai', name: 'The Spirit of Dubai', origin: 'Dubai', shape: 'arab', cap: 'gold', lbg: '#140f08', lfg: '#f2d38a', items: `
Shumukh|1295000|oud|L` },
];

/* Well-known inspired-by pairs. Owning both halves unlocks Clone Wars bonuses. */
const CLONE_PAIRS = [
  ['armaf|Club de Nuit Intense Man', 'creed|Aventus'],
  ['afnan|9pm', 'jpg|Ultra Male'],
  ['lattafa|Khamrah', "kilian|Angels' Share"],
  ['lattafa|Asad', 'dior|Sauvage Elixir'],
  ['armaf|Club de Nuit Sillage', 'creed|Silver Mountain Water'],
  ["lattafa|Bade'e Al Oud Oud for Glory", 'initio|Oud for Greatness'],
  ['lattafa|Fakhar Black', 'ysl|Y Eau de Parfum'],
  ['armaf|Club de Nuit Untold', 'mfk|Baccarat Rouge 540'],
];

/* Build the flat catalog once. */
const CATALOG = (() => {
  const out = [];
  const slug = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  for (const h of HOUSES) {
    for (const line of h.items.trim().split('\n')) {
      const [name, price, family, flags = ''] = line.split('|').map((s) => s.trim());
      const base = Number(price);
      let tier;
      if (flags.includes('L')) tier = 'legendary';
      else if (base >= 1000) tier = 'haute';
      else if (base >= 450) tier = 'luxury';
      else if (base >= 200) tier = 'niche';
      else if (base >= 80) tier = 'designer';
      else tier = 'value';
      out.push({
        id: h.id + '-' + slug(name),
        key: h.id + '|' + name,
        name, house: h.id, base, family,
        disc: flags.includes('D'), limited: flags.includes('L'),
        tier,
      });
    }
  }
  return out;
})();

const HOUSE_BY_ID = Object.fromEntries(HOUSES.map((h) => [h.id, h]));
const ITEM_BY_ID = Object.fromEntries(CATALOG.map((c) => [c.id, c]));
const ITEM_BY_KEY = Object.fromEntries(CATALOG.map((c) => [c.key, c]));

const TIERS = {
  value:     { label: 'Value',     pts: 1 },
  designer:  { label: 'Designer',  pts: 2 },
  niche:     { label: 'Niche',     pts: 4 },
  luxury:    { label: 'Luxury',    pts: 8 },
  haute:     { label: 'Haute',     pts: 20 },
  legendary: { label: 'Legendary', pts: 60 },
};
