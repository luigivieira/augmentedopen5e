const LOCALE_NAMES: Record<string, string> = {
  'en-us': 'English (en-us)',
  'pt-br': 'Português Brasileiro (pt-br)',
  'es-es': 'Español (es-es)',
};

const LOCALES: { code: string; label: string }[] = [
  { code: 'af-za', label: 'Afrikaans (South Africa)' },
  { code: 'ar-ae', label: 'Arabic (UAE)' },
  { code: 'ar-eg', label: 'Arabic (Egypt)' },
  { code: 'ar-sa', label: 'Arabic (Saudi Arabia)' },
  { code: 'bg-bg', label: 'Bulgarian (Bulgaria)' },
  { code: 'bn-bd', label: 'Bengali (Bangladesh)' },
  { code: 'bn-in', label: 'Bengali (India)' },
  { code: 'ca-es', label: 'Catalan (Spain)' },
  { code: 'cs-cz', label: 'Czech (Czechia)' },
  { code: 'cy-gb', label: 'Welsh (UK)' },
  { code: 'da-dk', label: 'Danish (Denmark)' },
  { code: 'de-at', label: 'German (Austria)' },
  { code: 'de-ch', label: 'German (Switzerland)' },
  { code: 'de-de', label: 'German (Germany)' },
  { code: 'el-gr', label: 'Greek (Greece)' },
  { code: 'en-au', label: 'English (Australia)' },
  { code: 'en-ca', label: 'English (Canada)' },
  { code: 'en-gb', label: 'English (UK)' },
  { code: 'en-in', label: 'English (India)' },
  { code: 'en-nz', label: 'English (New Zealand)' },
  { code: 'en-us', label: 'English (United States)' },
  { code: 'es-ar', label: 'Spanish (Argentina)' },
  { code: 'es-cl', label: 'Spanish (Chile)' },
  { code: 'es-co', label: 'Spanish (Colombia)' },
  { code: 'es-es', label: 'Spanish (Spain)' },
  { code: 'es-mx', label: 'Spanish (Mexico)' },
  { code: 'es-us', label: 'Spanish (United States)' },
  { code: 'et-ee', label: 'Estonian (Estonia)' },
  { code: 'eu-es', label: 'Basque (Spain)' },
  { code: 'fa-ir', label: 'Persian (Iran)' },
  { code: 'fi-fi', label: 'Finnish (Finland)' },
  { code: 'fr-be', label: 'French (Belgium)' },
  { code: 'fr-ca', label: 'French (Canada)' },
  { code: 'fr-ch', label: 'French (Switzerland)' },
  { code: 'fr-fr', label: 'French (France)' },
  { code: 'ga-ie', label: 'Irish (Ireland)' },
  { code: 'gl-es', label: 'Galician (Spain)' },
  { code: 'gu-in', label: 'Gujarati (India)' },
  { code: 'he-il', label: 'Hebrew (Israel)' },
  { code: 'hi-in', label: 'Hindi (India)' },
  { code: 'hr-hr', label: 'Croatian (Croatia)' },
  { code: 'hu-hu', label: 'Hungarian (Hungary)' },
  { code: 'hy-am', label: 'Armenian (Armenia)' },
  { code: 'id-id', label: 'Indonesian (Indonesia)' },
  { code: 'is-is', label: 'Icelandic (Iceland)' },
  { code: 'it-it', label: 'Italian (Italy)' },
  { code: 'ja-jp', label: 'Japanese (Japan)' },
  { code: 'ka-ge', label: 'Georgian (Georgia)' },
  { code: 'kk-kz', label: 'Kazakh (Kazakhstan)' },
  { code: 'km-kh', label: 'Khmer (Cambodia)' },
  { code: 'kn-in', label: 'Kannada (India)' },
  { code: 'ko-kr', label: 'Korean (South Korea)' },
  { code: 'lt-lt', label: 'Lithuanian (Lithuania)' },
  { code: 'lv-lv', label: 'Latvian (Latvia)' },
  { code: 'mk-mk', label: 'Macedonian (North Macedonia)' },
  { code: 'ml-in', label: 'Malayalam (India)' },
  { code: 'mn-mn', label: 'Mongolian (Mongolia)' },
  { code: 'mr-in', label: 'Marathi (India)' },
  { code: 'ms-my', label: 'Malay (Malaysia)' },
  { code: 'mt-mt', label: 'Maltese (Malta)' },
  { code: 'nb-no', label: 'Norwegian Bokmål (Norway)' },
  { code: 'ne-np', label: 'Nepali (Nepal)' },
  { code: 'nl-be', label: 'Dutch (Belgium)' },
  { code: 'nl-nl', label: 'Dutch (Netherlands)' },
  { code: 'pa-in', label: 'Punjabi (India)' },
  { code: 'pl-pl', label: 'Polish (Poland)' },
  { code: 'pt-br', label: 'Portuguese (Brazil)' },
  { code: 'pt-pt', label: 'Portuguese (Portugal)' },
  { code: 'ro-ro', label: 'Romanian (Romania)' },
  { code: 'ru-ru', label: 'Russian (Russia)' },
  { code: 'si-lk', label: 'Sinhala (Sri Lanka)' },
  { code: 'sk-sk', label: 'Slovak (Slovakia)' },
  { code: 'sl-si', label: 'Slovenian (Slovenia)' },
  { code: 'sq-al', label: 'Albanian (Albania)' },
  { code: 'sr-rs', label: 'Serbian (Serbia)' },
  { code: 'sv-se', label: 'Swedish (Sweden)' },
  { code: 'sw-ke', label: 'Swahili (Kenya)' },
  { code: 'ta-in', label: 'Tamil (India)' },
  { code: 'te-in', label: 'Telugu (India)' },
  { code: 'th-th', label: 'Thai (Thailand)' },
  { code: 'tr-tr', label: 'Turkish (Turkey)' },
  { code: 'uk-ua', label: 'Ukrainian (Ukraine)' },
  { code: 'ur-pk', label: 'Urdu (Pakistan)' },
  { code: 'vi-vn', label: 'Vietnamese (Vietnam)' },
  { code: 'zh-cn', label: 'Chinese – Simplified (China)' },
  { code: 'zh-hk', label: 'Chinese – Traditional (Hong Kong)' },
  { code: 'zh-tw', label: 'Chinese – Traditional (Taiwan)' },
  { code: 'zu-za', label: 'Zulu (South Africa)' },
];

const SPELLS: { slug: string; name: string }[] = [
  { slug: 'acid-arrow', name: 'Acid Arrow' },
  { slug: 'acid-splash', name: 'Acid Splash' },
  { slug: 'aid', name: 'Aid' },
  { slug: 'alarm', name: 'Alarm' },
  { slug: 'alter-self', name: 'Alter Self' },
  { slug: 'animal-friendship', name: 'Animal Friendship' },
  { slug: 'animal-messenger', name: 'Animal Messenger' },
  { slug: 'animal-shapes', name: 'Animal Shapes' },
  { slug: 'animate-dead', name: 'Animate Dead' },
  { slug: 'animate-objects', name: 'Animate Objects' },
  { slug: 'antilife-shell', name: 'Antilife Shell' },
  { slug: 'antimagic-field', name: 'Antimagic Field' },
  { slug: 'antipathysympathy', name: 'Antipathy/Sympathy' },
  { slug: 'arcane-eye', name: 'Arcane Eye' },
  { slug: 'arcane-hand', name: 'Arcane Hand' },
  { slug: 'arcane-lock', name: 'Arcane Lock' },
  { slug: 'arcane-sword', name: 'Arcane Sword' },
  { slug: 'arcanists-magic-aura', name: "Arcanist's Magic Aura" },
  { slug: 'astral-projection', name: 'Astral Projection' },
  { slug: 'augury', name: 'Augury' },
  { slug: 'awaken', name: 'Awaken' },
  { slug: 'bane', name: 'Bane' },
  { slug: 'banishment', name: 'Banishment' },
  { slug: 'barkskin', name: 'Barkskin' },
  { slug: 'beacon-of-hope', name: 'Beacon of Hope' },
  { slug: 'bestow-curse', name: 'Bestow Curse' },
  { slug: 'black-tentacles', name: 'Black Tentacles' },
  { slug: 'blade-barrier', name: 'Blade Barrier' },
  { slug: 'bless', name: 'Bless' },
  { slug: 'blight', name: 'Blight' },
  { slug: 'blindnessdeafness', name: 'Blindness/Deafness' },
  { slug: 'blink', name: 'Blink' },
  { slug: 'blur', name: 'Blur' },
  { slug: 'branding-smite', name: 'Branding Smite' },
  { slug: 'burning-hands', name: 'Burning Hands' },
  { slug: 'call-lightning', name: 'Call Lightning' },
  { slug: 'calm-emotions', name: 'Calm Emotions' },
  { slug: 'chain-lightning', name: 'Chain Lightning' },
  { slug: 'charm-person', name: 'Charm Person' },
  { slug: 'chill-touch', name: 'Chill Touch' },
  { slug: 'circle-of-death', name: 'Circle of Death' },
  { slug: 'clairvoyance', name: 'Clairvoyance' },
  { slug: 'clone', name: 'Clone' },
  { slug: 'cloudkill', name: 'Cloudkill' },
  { slug: 'color-spray', name: 'Color Spray' },
  { slug: 'command', name: 'Command' },
  { slug: 'commune', name: 'Commune' },
  { slug: 'commune-with-nature', name: 'Commune with Nature' },
  { slug: 'comprehend-languages', name: 'Comprehend Languages' },
  { slug: 'compulsion', name: 'Compulsion' },
  { slug: 'cone-of-cold', name: 'Cone of Cold' },
  { slug: 'confusion', name: 'Confusion' },
  { slug: 'conjure-animals', name: 'Conjure Animals' },
  { slug: 'conjure-celestial', name: 'Conjure Celestial' },
  { slug: 'conjure-elemental', name: 'Conjure Elemental' },
  { slug: 'conjure-fey', name: 'Conjure Fey' },
  { slug: 'conjure-minor-elementals', name: 'Conjure Minor Elementals' },
  { slug: 'conjure-woodland-beings', name: 'Conjure Woodland Beings' },
  { slug: 'contact-other-plane', name: 'Contact Other Plane' },
  { slug: 'contagion', name: 'Contagion' },
  { slug: 'contingency', name: 'Contingency' },
  { slug: 'continual-flame', name: 'Continual Flame' },
  { slug: 'control-water', name: 'Control Water' },
  { slug: 'control-weather', name: 'Control Weather' },
  { slug: 'counterspell', name: 'Counterspell' },
  { slug: 'create-food-and-water', name: 'Create Food and Water' },
  { slug: 'create-undead', name: 'Create Undead' },
  { slug: 'create-or-destroy-water', name: 'Create or Destroy Water' },
  { slug: 'creation', name: 'Creation' },
  { slug: 'cure-wounds', name: 'Cure Wounds' },
  { slug: 'dancing-lights', name: 'Dancing Lights' },
  { slug: 'darkness', name: 'Darkness' },
  { slug: 'darkvision', name: 'Darkvision' },
  { slug: 'daylight', name: 'Daylight' },
  { slug: 'death-ward', name: 'Death Ward' },
  { slug: 'delayed-blast-fireball', name: 'Delayed Blast Fireball' },
  { slug: 'demiplane', name: 'Demiplane' },
  { slug: 'detect-evil-and-good', name: 'Detect Evil and Good' },
  { slug: 'detect-magic', name: 'Detect Magic' },
  { slug: 'detect-poison-and-disease', name: 'Detect Poison and Disease' },
  { slug: 'detect-thoughts', name: 'Detect Thoughts' },
  { slug: 'dimension-door', name: 'Dimension Door' },
  { slug: 'disguise-self', name: 'Disguise Self' },
  { slug: 'disintegrate', name: 'Disintegrate' },
  { slug: 'dispel-evil-and-good', name: 'Dispel Evil and Good' },
  { slug: 'dispel-magic', name: 'Dispel Magic' },
  { slug: 'divination', name: 'Divination' },
  { slug: 'divine-favor', name: 'Divine Favor' },
  { slug: 'divine-word', name: 'Divine Word' },
  { slug: 'dominate-beast', name: 'Dominate Beast' },
  { slug: 'dominate-monster', name: 'Dominate Monster' },
  { slug: 'dominate-person', name: 'Dominate Person' },
  { slug: 'dream', name: 'Dream' },
  { slug: 'druidcraft', name: 'Druidcraft' },
  { slug: 'earthquake', name: 'Earthquake' },
  { slug: 'eldritch-blast', name: 'Eldritch Blast' },
  { slug: 'enhance-ability', name: 'Enhance Ability' },
  { slug: 'enlargereduce', name: 'Enlarge/Reduce' },
  { slug: 'entangle', name: 'Entangle' },
  { slug: 'enthrall', name: 'Enthrall' },
  { slug: 'etherealness', name: 'Etherealness' },
  { slug: 'expeditious-retreat', name: 'Expeditious Retreat' },
  { slug: 'eyebite', name: 'Eyebite' },
  { slug: 'fabricate', name: 'Fabricate' },
  { slug: 'faerie-fire', name: 'Faerie Fire' },
  { slug: 'faithful-hound', name: 'Faithful Hound' },
  { slug: 'false-life', name: 'False Life' },
  { slug: 'fear', name: 'Fear' },
  { slug: 'feather-fall', name: 'Feather Fall' },
  { slug: 'feeblemind', name: 'Feeblemind' },
  { slug: 'find-familiar', name: 'Find Familiar' },
  { slug: 'find-steed', name: 'Find Steed' },
  { slug: 'find-traps', name: 'Find Traps' },
  { slug: 'find-the-path', name: 'Find the Path' },
  { slug: 'finger-of-death', name: 'Finger of Death' },
  { slug: 'fire-bolt', name: 'Fire Bolt' },
  { slug: 'fire-shield', name: 'Fire Shield' },
  { slug: 'fire-storm', name: 'Fire Storm' },
  { slug: 'fireball', name: 'Fireball' },
  { slug: 'flame-blade', name: 'Flame Blade' },
  { slug: 'flame-strike', name: 'Flame Strike' },
  { slug: 'flaming-sphere', name: 'Flaming Sphere' },
  { slug: 'flesh-to-stone', name: 'Flesh to Stone' },
  { slug: 'floating-disk', name: 'Floating Disk' },
  { slug: 'fly', name: 'Fly' },
  { slug: 'fog-cloud', name: 'Fog Cloud' },
  { slug: 'forbiddance', name: 'Forbiddance' },
  { slug: 'forcecage', name: 'Forcecage' },
  { slug: 'foresight', name: 'Foresight' },
  { slug: 'freedom-of-movement', name: 'Freedom of Movement' },
  { slug: 'freezing-sphere', name: 'Freezing Sphere' },
  { slug: 'gaseous-form', name: 'Gaseous Form' },
  { slug: 'gate', name: 'Gate' },
  { slug: 'geas', name: 'Geas' },
  { slug: 'gentle-repose', name: 'Gentle Repose' },
  { slug: 'giant-insect', name: 'Giant Insect' },
  { slug: 'glibness', name: 'Glibness' },
  { slug: 'globe-of-invulnerability', name: 'Globe of Invulnerability' },
  { slug: 'glyph-of-warding', name: 'Glyph of Warding' },
  { slug: 'goodberry', name: 'Goodberry' },
  { slug: 'grease', name: 'Grease' },
  { slug: 'greater-invisibility', name: 'Greater Invisibility' },
  { slug: 'greater-restoration', name: 'Greater Restoration' },
  { slug: 'guardian-of-faith', name: 'Guardian of Faith' },
  { slug: 'guards-and-wards', name: 'Guards and Wards' },
  { slug: 'guidance', name: 'Guidance' },
  { slug: 'guiding-bolt', name: 'Guiding Bolt' },
  { slug: 'gust-of-wind', name: 'Gust of Wind' },
  { slug: 'hallow', name: 'Hallow' },
  { slug: 'hallucinatory-terrain', name: 'Hallucinatory Terrain' },
  { slug: 'harm', name: 'Harm' },
  { slug: 'haste', name: 'Haste' },
  { slug: 'heal', name: 'Heal' },
  { slug: 'healing-word', name: 'Healing Word' },
  { slug: 'heat-metal', name: 'Heat Metal' },
  { slug: 'hellish-rebuke', name: 'Hellish Rebuke' },
  { slug: 'heroes-feast', name: "Heroes' Feast" },
  { slug: 'heroism', name: 'Heroism' },
  { slug: 'hideous-laughter', name: 'Hideous Laughter' },
  { slug: 'hold-monster', name: 'Hold Monster' },
  { slug: 'hold-person', name: 'Hold Person' },
  { slug: 'holy-aura', name: 'Holy Aura' },
  { slug: 'hunters-mark', name: "Hunter's Mark" },
  { slug: 'hypnotic-pattern', name: 'Hypnotic Pattern' },
  { slug: 'ice-storm', name: 'Ice Storm' },
  { slug: 'identify', name: 'Identify' },
  { slug: 'illusory-script', name: 'Illusory Script' },
  { slug: 'imprisonment', name: 'Imprisonment' },
  { slug: 'incendiary-cloud', name: 'Incendiary Cloud' },
  { slug: 'inflict-wounds', name: 'Inflict Wounds' },
  { slug: 'insect-plague', name: 'Insect Plague' },
  { slug: 'instant-summons', name: 'Instant Summons' },
  { slug: 'invisibility', name: 'Invisibility' },
  { slug: 'irresistible-dance', name: 'Irresistible Dance' },
  { slug: 'jump', name: 'Jump' },
  { slug: 'knock', name: 'Knock' },
  { slug: 'legend-lore', name: 'Legend Lore' },
  { slug: 'lesser-restoration', name: 'Lesser Restoration' },
  { slug: 'levitate', name: 'Levitate' },
  { slug: 'light', name: 'Light' },
  { slug: 'lightning-bolt', name: 'Lightning Bolt' },
  { slug: 'locate-animals-or-plants', name: 'Locate Animals or Plants' },
  { slug: 'locate-creature', name: 'Locate Creature' },
  { slug: 'locate-object', name: 'Locate Object' },
  { slug: 'longstrider', name: 'Longstrider' },
  { slug: 'mage-armor', name: 'Mage Armor' },
  { slug: 'mage-hand', name: 'Mage Hand' },
  { slug: 'magic-circle', name: 'Magic Circle' },
  { slug: 'magic-jar', name: 'Magic Jar' },
  { slug: 'magic-missile', name: 'Magic Missile' },
  { slug: 'magic-mouth', name: 'Magic Mouth' },
  { slug: 'magic-weapon', name: 'Magic Weapon' },
  { slug: 'magnificent-mansion', name: 'Magnificent Mansion' },
  { slug: 'major-image', name: 'Major Image' },
  { slug: 'mass-cure-wounds', name: 'Mass Cure Wounds' },
  { slug: 'mass-heal', name: 'Mass Heal' },
  { slug: 'mass-healing-word', name: 'Mass Healing Word' },
  { slug: 'mass-suggestion', name: 'Mass Suggestion' },
  { slug: 'maze', name: 'Maze' },
  { slug: 'meld-into-stone', name: 'Meld into Stone' },
  { slug: 'mending', name: 'Mending' },
  { slug: 'message', name: 'Message' },
  { slug: 'meteor-swarm', name: 'Meteor Swarm' },
  { slug: 'mind-blank', name: 'Mind Blank' },
  { slug: 'minor-illusion', name: 'Minor Illusion' },
  { slug: 'mirage-arcane', name: 'Mirage Arcane' },
  { slug: 'mirror-image', name: 'Mirror Image' },
  { slug: 'mislead', name: 'Mislead' },
  { slug: 'misty-step', name: 'Misty Step' },
  { slug: 'modify-memory', name: 'Modify Memory' },
  { slug: 'moonbeam', name: 'Moonbeam' },
  { slug: 'move-earth', name: 'Move Earth' },
  { slug: 'nondetection', name: 'Nondetection' },
  { slug: 'pass-without-trace', name: 'Pass without Trace' },
  { slug: 'passwall', name: 'Passwall' },
  { slug: 'phantasmal-killer', name: 'Phantasmal Killer' },
  { slug: 'phantom-steed', name: 'Phantom Steed' },
  { slug: 'planar-ally', name: 'Planar Ally' },
  { slug: 'planar-binding', name: 'Planar Binding' },
  { slug: 'plane-shift', name: 'Plane Shift' },
  { slug: 'plant-growth', name: 'Plant Growth' },
  { slug: 'poison-spray', name: 'Poison Spray' },
  { slug: 'polymorph', name: 'Polymorph' },
  { slug: 'power-word-kill', name: 'Power Word Kill' },
  { slug: 'power-word-stun', name: 'Power Word Stun' },
  { slug: 'prayer-of-healing', name: 'Prayer of Healing' },
  { slug: 'prestidigitation', name: 'Prestidigitation' },
  { slug: 'prismatic-spray', name: 'Prismatic Spray' },
  { slug: 'prismatic-wall', name: 'Prismatic Wall' },
  { slug: 'private-sanctum', name: 'Private Sanctum' },
  { slug: 'produce-flame', name: 'Produce Flame' },
  { slug: 'programmed-illusion', name: 'Programmed Illusion' },
  { slug: 'project-image', name: 'Project Image' },
  { slug: 'protection-from-energy', name: 'Protection from Energy' },
  { slug: 'protection-from-evil-and-good', name: 'Protection from Evil and Good' },
  { slug: 'protection-from-poison', name: 'Protection from Poison' },
  { slug: 'purify-food-and-drink', name: 'Purify Food and Drink' },
  { slug: 'raise-dead', name: 'Raise Dead' },
  { slug: 'ray-of-enfeeblement', name: 'Ray of Enfeeblement' },
  { slug: 'ray-of-frost', name: 'Ray of Frost' },
  { slug: 'regenerate', name: 'Regenerate' },
  { slug: 'reincarnate', name: 'Reincarnate' },
  { slug: 'remove-curse', name: 'Remove Curse' },
  { slug: 'resilient-sphere', name: 'Resilient Sphere' },
  { slug: 'resistance', name: 'Resistance' },
  { slug: 'resurrection', name: 'Resurrection' },
  { slug: 'reverse-gravity', name: 'Reverse Gravity' },
  { slug: 'revivify', name: 'Revivify' },
  { slug: 'rope-trick', name: 'Rope Trick' },
  { slug: 'sacred-flame', name: 'Sacred Flame' },
  { slug: 'sanctuary', name: 'Sanctuary' },
  { slug: 'scorching-ray', name: 'Scorching Ray' },
  { slug: 'scrying', name: 'Scrying' },
  { slug: 'secret-chest', name: 'Secret Chest' },
  { slug: 'see-invisibility', name: 'See Invisibility' },
  { slug: 'seeming', name: 'Seeming' },
  { slug: 'sending', name: 'Sending' },
  { slug: 'sequester', name: 'Sequester' },
  { slug: 'shapechange', name: 'Shapechange' },
  { slug: 'shatter', name: 'Shatter' },
  { slug: 'shield', name: 'Shield' },
  { slug: 'shield-of-faith', name: 'Shield of Faith' },
  { slug: 'shillelagh', name: 'Shillelagh' },
  { slug: 'shocking-grasp', name: 'Shocking Grasp' },
  { slug: 'silence', name: 'Silence' },
  { slug: 'silent-image', name: 'Silent Image' },
  { slug: 'simulacrum', name: 'Simulacrum' },
  { slug: 'sleep', name: 'Sleep' },
  { slug: 'sleet-storm', name: 'Sleet Storm' },
  { slug: 'slow', name: 'Slow' },
  { slug: 'spare-the-dying', name: 'Spare the Dying' },
  { slug: 'speak-with-animals', name: 'Speak with Animals' },
  { slug: 'speak-with-dead', name: 'Speak with Dead' },
  { slug: 'speak-with-plants', name: 'Speak with Plants' },
  { slug: 'spider-climb', name: 'Spider Climb' },
  { slug: 'spike-growth', name: 'Spike Growth' },
  { slug: 'spirit-guardians', name: 'Spirit Guardians' },
  { slug: 'spiritual-weapon', name: 'Spiritual Weapon' },
  { slug: 'stinking-cloud', name: 'Stinking Cloud' },
  { slug: 'stone-shape', name: 'Stone Shape' },
  { slug: 'stoneskin', name: 'Stoneskin' },
  { slug: 'storm-of-vengeance', name: 'Storm of Vengeance' },
  { slug: 'suggestion', name: 'Suggestion' },
  { slug: 'sunbeam', name: 'Sunbeam' },
  { slug: 'sunburst', name: 'Sunburst' },
  { slug: 'symbol', name: 'Symbol' },
  { slug: 'telekinesis', name: 'Telekinesis' },
  { slug: 'telepathic-bond', name: 'Telepathic Bond' },
  { slug: 'teleport', name: 'Teleport' },
  { slug: 'teleportation-circle', name: 'Teleportation Circle' },
  { slug: 'thaumaturgy', name: 'Thaumaturgy' },
  { slug: 'thunderwave', name: 'Thunderwave' },
  { slug: 'time-stop', name: 'Time Stop' },
  { slug: 'tiny-hut', name: 'Tiny Hut' },
  { slug: 'tongues', name: 'Tongues' },
  { slug: 'transport-via-plants', name: 'Transport via Plants' },
  { slug: 'tree-stride', name: 'Tree Stride' },
  { slug: 'true-polymorph', name: 'True Polymorph' },
  { slug: 'true-resurrection', name: 'True Resurrection' },
  { slug: 'true-seeing', name: 'True Seeing' },
  { slug: 'true-strike', name: 'True Strike' },
  { slug: 'unseen-servant', name: 'Unseen Servant' },
  { slug: 'vampiric-touch', name: 'Vampiric Touch' },
  { slug: 'vicious-mockery', name: 'Vicious Mockery' },
  { slug: 'wall-of-fire', name: 'Wall of Fire' },
  { slug: 'wall-of-force', name: 'Wall of Force' },
  { slug: 'wall-of-ice', name: 'Wall of Ice' },
  { slug: 'wall-of-stone', name: 'Wall of Stone' },
  { slug: 'wall-of-thorns', name: 'Wall of Thorns' },
  { slug: 'warding-bond', name: 'Warding Bond' },
  { slug: 'water-breathing', name: 'Water Breathing' },
  { slug: 'water-walk', name: 'Water Walk' },
  { slug: 'web', name: 'Web' },
  { slug: 'weird', name: 'Weird' },
  { slug: 'wind-walk', name: 'Wind Walk' },
  { slug: 'wind-wall', name: 'Wind Wall' },
  { slug: 'wish', name: 'Wish' },
  { slug: 'word-of-recall', name: 'Word of Recall' },
  { slug: 'zone-of-truth', name: 'Zone of Truth' },
];

const I18N = {
  'en-us': {
    aboutTitle: 'About',
    aboutBody: `
      <p>
        <strong>AugmentedOpen5e</strong> is an open-source API that augments
        <a href="https://open5e.com" target="_blank" rel="noopener">Open5e</a>'s
        5th Edition SRD spell data (originally released by Wizards of the Coast under
        <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener">CC BY 4.0</a>)
        with on-demand AI-powered translations into multiple languages.
        It is built as an edge-native application running on
        <a href="https://www.azion.com" target="_blank" rel="noopener">Azion</a>'s
        global edge network, and serves as a reference example of how to build
        AI-augmented APIs on the Azion platform.
      </p>
      <p>
        Translations are generated by a large language model (Llama 3.3 70B via Groq) and cached
        at the edge using Azion's distributed key-value store. Subsequent requests are served in
        milliseconds directly from the nearest edge node — no origin round-trip needed.
      </p>
    `,
    linksBody: `
      <p>
        The source code is freely available on
        <a href="https://github.com/luigivieira/augmentedopen5e" target="_blank" rel="noopener">GitHub</a>
        under an open-source license. You can also browse and test all endpoints directly through the
        <a href="/docs">Scalar API documentation</a>.
      </p>
    `,
    demoTitle: 'Try it',
    spellLabel: 'Spell',
    localeLabel: 'Locale',
    submitBtn: 'Look up spell',
    clearBtn: 'Clear',
    resultsTitle: 'Results',
    loadingText: 'Fetching...',
    pendingNew: 'Translation has been requested and is running in the background. Check back in a moment.',
    pendingInProgress: 'Translation is still in progress in the background. Check back shortly.',
    retryBtn: 'Check progress',
    errorText: 'Error',
    latencyLabel: 'Latency',
    timestampLabel: 'Requested at',
    edgeLabel: 'Edge node',
    footerLicense: 'Distributed under the MIT License.',
    footerAuthor: 'Created by Luiz Carlos Vieira.',
    fieldsLabels: {
      name: 'Name',
      level: 'Level',
      school: 'School',
      casting_time: 'Casting Time',
      range: 'Range',
      duration: 'Duration',
      dnd_class: 'Classes',
      archetype: 'Archetype',
      material: 'Material',
      desc: 'Description',
      higher_level: 'At Higher Levels',
    },
  },
  'pt-br': {
    aboutTitle: 'Sobre',
    aboutBody: `
      <p>
        <strong>AugmentedOpen5e</strong> é uma API de código aberto que expande os dados de magias
        do SRD (System Reference Document) do jogo de RPG Dungeons &amp; Dragons na 5ª edição,
        disponibilizados pelo <a href="https://open5e.com" target="_blank" rel="noopener">Open5e</a>
        (originalmente publicados pela Wizards of the Coast sob
        <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener">CC BY 4.0</a>),
        com traduções automáticas geradas por IA sob demanda, para múltiplos idiomas.
        É construída como uma aplicação nativa de edge, executando na rede global de edge da
        <a href="https://www.azion.com" target="_blank" rel="noopener">Azion</a>,
        e serve como exemplo de referência de como construir APIs com IA na plataforma Azion.
      </p>
      <p>
        As traduções são geradas por um modelo de linguagem (Llama 3.3 70B via Groq) e armazenadas
        em cache no edge usando o armazenamento chave-valor distribuído da Azion. As requisições
        subsequentes são servidas em milissegundos diretamente do nó de edge mais próximo — sem
        necessidade de ir à origem.
      </p>
    `,
    linksBody: `
      <p>
        O código-fonte está disponível gratuitamente no
        <a href="https://github.com/luigivieira/augmentedopen5e" target="_blank" rel="noopener">GitHub</a>
        sob uma licença open source. Você também pode explorar e testar todos os endpoints diretamente
        pela <a href="/docs">documentação da API no Scalar</a>.
      </p>
    `,
    demoTitle: 'Experimente',
    spellLabel: 'Magia',
    localeLabel: 'Idioma',
    submitBtn: 'Buscar magia',
    clearBtn: 'Limpar',
    resultsTitle: 'Resultados',
    loadingText: 'Buscando...',
    pendingNew: 'A tradução foi requisitada e está sendo processada em background. Verifique o progresso em instantes.',
    pendingInProgress: 'A tradução ainda está em progresso em background. Verifique novamente em breve.',
    retryBtn: 'Verificar progresso',
    errorText: 'Erro',
    latencyLabel: 'Latência',
    timestampLabel: 'Solicitado em',
    edgeLabel: 'Nó de edge',
    footerLicense: 'Distribuído sob a licença MIT.',
    footerAuthor: 'Criado por Luiz Carlos Vieira.',
    fieldsLabels: {
      name: 'Nome',
      level: 'Nível',
      school: 'Escola',
      casting_time: 'Tempo de Conjuração',
      range: 'Alcance',
      duration: 'Duração',
      dnd_class: 'Classes',
      archetype: 'Arquétipo',
      material: 'Material',
      desc: 'Descrição',
      higher_level: 'Em Níveis Superiores',
    },
  },
  'es-es': {
    aboutTitle: 'Acerca de',
    aboutBody: `
      <p>
        <strong>AugmentedOpen5e</strong> es una API de código abierto que amplía los datos de
        hechizos del SRD de 5ª Edición disponibles en
        <a href="https://open5e.com" target="_blank" rel="noopener">Open5e</a>
        (publicados originalmente por Wizards of the Coast bajo
        <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener">CC BY 4.0</a>)
        con traducciones automáticas generadas por IA bajo demanda, en múltiples idiomas.
        Está construida como una aplicación nativa de edge que se ejecuta en la red global de edge
        de <a href="https://www.azion.com" target="_blank" rel="noopener">Azion</a>,
        y sirve como ejemplo de referencia de cómo construir APIs con IA en la plataforma Azion.
      </p>
      <p>
        Las traducciones son generadas por un modelo de lenguaje (Llama 3.3 70B via Groq) y
        almacenadas en caché en el edge usando el almacén de clave-valor distribuido de Azion.
        Las solicitudes posteriores se sirven en milisegundos directamente desde el nodo de edge
        más cercano — sin necesidad de ir al origen.
      </p>
    `,
    linksBody: `
      <p>
        El código fuente está disponible gratuitamente en
        <a href="https://github.com/luigivieira/augmentedopen5e" target="_blank" rel="noopener">GitHub</a>
        bajo una licencia de código abierto. También puedes explorar y probar todos los endpoints
        directamente en la <a href="/docs">documentación de la API en Scalar</a>.
      </p>
    `,
    demoTitle: 'Pruébalo',
    spellLabel: 'Hechizo',
    localeLabel: 'Idioma',
    submitBtn: 'Buscar hechizo',
    clearBtn: 'Limpiar',
    resultsTitle: 'Resultados',
    loadingText: 'Buscando...',
    pendingNew: 'La traducción ha sido solicitada y se está procesando en segundo plano. Verifica el progreso en un momento.',
    pendingInProgress: 'La traducción todavía está en progreso en segundo plano. Vuelve a verificar en breve.',
    retryBtn: 'Verificar progreso',
    errorText: 'Error',
    latencyLabel: 'Latencia',
    timestampLabel: 'Solicitado a las',
    edgeLabel: 'Nodo edge',
    footerLicense: 'Distribuido bajo la licencia MIT.',
    footerAuthor: 'Creado por Luiz Carlos Vieira.',
    fieldsLabels: {
      name: 'Nombre',
      level: 'Nivel',
      school: 'Escuela',
      casting_time: 'Tiempo de Lanzamiento',
      range: 'Alcance',
      duration: 'Duración',
      dnd_class: 'Clases',
      archetype: 'Arquetipo',
      material: 'Material',
      desc: 'Descripción',
      higher_level: 'En Niveles Superiores',
    },
  },
};

export const HOME_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>AugmentedOpen5e</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --bg: #0f1117;
      --surface: #1a1d27;
      --surface2: #22263a;
      --border: #2e3352;
      --accent: #7c6af7;
      --accent2: #5b9bd5;
      --text: #e2e4f0;
      --text-muted: #8891b0;
      --warning: #e8a44a;
      --error: #e05f5f;
      --radius: 10px;
      --font: 'Segoe UI', system-ui, -apple-system, sans-serif;
    }

    body {
      font-family: var(--font);
      background: var(--bg);
      color: var(--text);
      min-height: 100vh;
      line-height: 1.6;
      display: flex;
      flex-direction: column;
    }

    a { color: var(--accent2); text-decoration: none; }
    a:hover { text-decoration: underline; }

    /* ── Header ── */
    header {
      background: var(--surface);
      border-bottom: 1px solid var(--border);
      padding: 0 2rem;
      display: flex;
      align-items: center;
      gap: 1.5rem;
      height: 56px;
      position: sticky;
      top: 0;
      z-index: 100;
    }

    header .logo {
      font-weight: 700;
      font-size: 1.05rem;
      color: var(--text);
      white-space: nowrap;
      flex-shrink: 0;
    }

    header .logo span { color: var(--accent); }

    header nav {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-left: auto;
    }

    .lang-btn {
      background: none;
      border: 1px solid transparent;
      border-radius: 6px;
      padding: 4px 8px;
      cursor: pointer;
      font-size: 1.1rem;
      line-height: 1;
      transition: border-color 0.15s, background 0.15s;
      color: var(--text);
    }
    .lang-btn:hover { background: var(--surface2); border-color: var(--border); }
    .lang-btn.active { border-color: var(--accent); background: var(--surface2); }

    .nav-divider {
      width: 1px;
      height: 20px;
      background: var(--border);
      margin: 0 0.25rem;
    }

    .nav-link {
      font-size: 0.85rem;
      color: var(--text-muted);
      padding: 4px 8px;
      border-radius: 6px;
      transition: color 0.15s, background 0.15s;
      white-space: nowrap;
    }
    .nav-link:hover { color: var(--text); background: var(--surface2); text-decoration: none; }

    /* ── Main layout ── */
    main {
      max-width: 800px;
      width: 100%;
      margin: 0 auto;
      padding: 2.5rem 1.5rem 3rem;
      flex: 1;
    }

    /* ── Section ── */
    section { margin-bottom: 2.5rem; }

    .section-title {
      font-size: 0.7rem;
      font-weight: 700;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: var(--accent);
      margin-bottom: 1rem;
    }

    /* ── About ── */
    .about-body { color: var(--text-muted); font-size: 0.93rem; }
    .about-body p + p { margin-top: 0.75rem; }
    .about-body strong { color: var(--text); }
    .about-body a { color: var(--accent2); }

    /* ── Links paragraph ── */
    .links-body {
      color: var(--text-muted);
      font-size: 0.93rem;
      margin-top: 0.75rem;
      padding-top: 0.75rem;
      border-top: 1px solid var(--border);
    }
    .links-body a { color: var(--accent2); }

    /* ── Form ── */
    .form-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 1.5rem;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
      margin-bottom: 1.25rem;
    }

    @media (max-width: 500px) { .form-row { grid-template-columns: 1fr; } }

    .form-group { display: flex; flex-direction: column; gap: 0.4rem; }

    label {
      font-size: 0.78rem;
      font-weight: 600;
      letter-spacing: 0.05em;
      color: var(--text-muted);
      text-transform: uppercase;
    }

    select {
      background: var(--surface2);
      border: 1px solid var(--border);
      border-radius: 6px;
      color: var(--text);
      padding: 0.5rem 0.75rem;
      font-size: 0.9rem;
      font-family: var(--font);
      appearance: none;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%238891b0' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right 0.75rem center;
      padding-right: 2rem;
      cursor: pointer;
      transition: border-color 0.15s;
    }
    select:focus { outline: none; border-color: var(--accent); }

    input[list] {
      background: var(--surface2);
      border: 1px solid var(--border);
      border-radius: 6px;
      color: var(--text);
      padding: 0.5rem 0.75rem;
      font-size: 0.9rem;
      font-family: var(--font);
      width: 100%;
      transition: border-color 0.15s;
    }
    input[list]:focus { outline: none; border-color: var(--accent); }
    input[list]::placeholder { color: var(--text-muted); }

    .submit-btn {
      background: var(--accent);
      color: #fff;
      border: none;
      border-radius: 6px;
      padding: 0.55rem 1.5rem;
      font-size: 0.9rem;
      font-weight: 600;
      font-family: var(--font);
      cursor: pointer;
      transition: opacity 0.15s;
      width: 100%;
    }
    .submit-btn:hover { opacity: 0.85; }
    .submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }

    .form-actions { display: flex; gap: 0.75rem; }
    .form-actions .submit-btn { flex: 1; }

    .clear-btn {
      background: none;
      color: var(--text-muted);
      border: 1px solid var(--border);
      border-radius: 6px;
      padding: 0.55rem 1rem;
      font-size: 0.9rem;
      font-family: var(--font);
      cursor: pointer;
      transition: color 0.15s, border-color 0.15s;
      white-space: nowrap;
    }
    .clear-btn:hover { color: var(--text); border-color: var(--text-muted); }

    /* ── Results ── */
    #results-section { display: none; }

    .results-list { display: flex; flex-direction: column; gap: 1rem; }

    /* ── Spell card ── */
    .spell-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      overflow: hidden;
    }

    .spell-card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 0.5rem;
      padding: 0.75rem 1.25rem;
      background: var(--surface2);
      border-bottom: 1px solid var(--border);
    }

    .spell-locale-badge {
      font-size: 0.72rem;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--accent);
    }

    .spell-meta {
      display: flex;
      align-items: center;
      gap: 1rem;
      font-size: 0.75rem;
      color: var(--text-muted);
      flex-wrap: wrap;
    }

    .spell-meta span { display: flex; align-items: center; gap: 0.3rem; }

    .spell-card-body { padding: 1.25rem; }

    .spell-name {
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--text);
      margin-bottom: 1rem;
    }

    .spell-attrs {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
      gap: 0.6rem;
      margin-bottom: 1rem;
    }

    .spell-attr {
      background: var(--surface2);
      border: 1px solid var(--border);
      border-radius: 6px;
      padding: 0.4rem 0.65rem;
    }

    .spell-attr-label {
      font-size: 0.65rem;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--text-muted);
      margin-bottom: 0.15rem;
    }

    .spell-attr-value {
      font-size: 0.85rem;
      color: var(--text);
    }

    .spell-field { margin-bottom: 0.85rem; }
    .spell-field:last-child { margin-bottom: 0; }

    .spell-field-label {
      font-size: 0.7rem;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--text-muted);
      margin-bottom: 0.3rem;
    }

    .spell-field-value {
      font-size: 0.88rem;
      color: var(--text);
      line-height: 1.6;
      white-space: pre-wrap;
    }

    /* ── Pending card ── */
    .pending-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 1rem 1.25rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .pending-msg { font-size: 0.88rem; color: var(--text-muted); }

    .retry-btn {
      background: var(--surface2);
      color: var(--accent);
      border: 1px solid var(--accent);
      border-radius: 6px;
      padding: 0.35rem 0.9rem;
      font-size: 0.82rem;
      font-family: var(--font);
      cursor: pointer;
      transition: background 0.15s;
      white-space: nowrap;
    }
    .retry-btn:hover { background: var(--surface); }

    /* ── Error card ── */
    .error-card {
      background: var(--surface);
      border: 1px solid var(--error);
      border-radius: var(--radius);
      padding: 1rem 1.25rem;
      font-size: 0.88rem;
      color: var(--error);
    }

    /* ── Footer ── */
    footer {
      border-top: 1px solid var(--border);
      padding: 1.25rem 2rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 0.5rem;
      font-size: 0.78rem;
      color: var(--text-muted);
    }
  </style>
</head>
<body>

<header>
  <div class="logo">Augmented<span>Open5e</span></div>
  <nav>
    <button class="lang-btn active" data-lang="en-us" title="English" onclick="setLang('en-us')">🇺🇸</button>
    <button class="lang-btn" data-lang="pt-br" title="Português Brasileiro" onclick="setLang('pt-br')">🇧🇷</button>
    <button class="lang-btn" data-lang="es-es" title="Español" onclick="setLang('es-es')">🇪🇸</button>
    <div class="nav-divider"></div>
    <a class="nav-link" href="/docs">API Docs</a>
    <a class="nav-link" href="https://github.com/luigivieira/augmentedopen5e" target="_blank" rel="noopener">GitHub</a>
  </nav>
</header>

<main>
  <!-- About -->
  <section id="about-section">
    <div class="section-title" id="about-title">About</div>
    <div class="about-body" id="about-body"></div>
    <div class="links-body" id="links-body"></div>
  </section>

  <!-- Demo form -->
  <section id="demo-section">
    <div class="section-title" id="demo-title">Try it</div>
    <div class="form-card">
      <form id="spell-form" onsubmit="handleSubmit(event)">
        <div class="form-row">
          <div class="form-group">
            <label for="slug-input" id="spell-label">Spell</label>
            <input type="text" id="slug-input" list="spell-datalist"
              placeholder="e.g. fireball" autocomplete="off" />
            <datalist id="spell-datalist">
              ${SPELLS.map((s) => `<option value="${s.slug}" label="${s.name}">`).join('\n              ')}
            </datalist>
          </div>
          <div class="form-group">
            <label for="locale-input" id="locale-label">Locale</label>
            <input type="text" id="locale-input" list="locale-datalist"
              placeholder="e.g. en-us" autocomplete="off" />
            <datalist id="locale-datalist">
              ${LOCALES.map((l) => `<option value="${l.code}" label="${l.label}">`).join('\n              ')}
            </datalist>
          </div>
        </div>
        <div class="form-actions">
          <button class="submit-btn" type="submit" id="submit-btn">Look up spell</button>
          <button class="clear-btn" type="button" id="clear-btn" onclick="clearForm()">Clear</button>
        </div>
      </form>
    </div>
  </section>

  <!-- Results -->
  <section id="results-section">
    <div class="section-title" id="results-title">Results</div>
    <div class="results-list" id="results-list"></div>
  </section>
</main>

<footer>
  <span id="footer-license"></span>
  <span id="footer-author"></span>
</footer>

<script>
  // ── i18n data ──
  const I18N = ${JSON.stringify(I18N)};

  const LOCALE_NAMES = ${JSON.stringify(LOCALE_NAMES)};

  let currentLang = 'en-us';

  function setLang(lang) {
    if (!I18N[lang]) return;
    currentLang = lang;

    document.querySelectorAll('.lang-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.lang === lang);
    });

    const t = I18N[lang];

    document.getElementById('about-title').textContent = t.aboutTitle;
    document.getElementById('about-body').innerHTML = t.aboutBody;
    document.getElementById('links-body').innerHTML = t.linksBody;
    document.getElementById('demo-title').textContent = t.demoTitle;
    document.getElementById('spell-label').textContent = t.spellLabel;
    document.getElementById('locale-label').textContent = t.localeLabel;
    document.getElementById('submit-btn').textContent = t.submitBtn;
    document.getElementById('clear-btn').textContent = t.clearBtn;
    document.getElementById('results-title').textContent = t.resultsTitle;
    document.getElementById('footer-license').textContent = t.footerLicense;
    document.getElementById('footer-author').textContent = t.footerAuthor;

    // Re-translate labels on existing spell cards
    document.querySelectorAll('[data-i18n-field]').forEach(el => {
      const field = el.dataset.i18nField;
      el.textContent = t.fieldsLabels[field] || field;
    });

    // Re-translate latency/timestamp labels on existing cards
    document.querySelectorAll('[data-i18n-key]').forEach(el => {
      const key = el.dataset.i18nKey;
      el.textContent = t[key] + ':';
    });
  }

  function clearForm() {
    document.getElementById('slug-input').value = '';
    document.getElementById('locale-input').value = '';
    document.getElementById('slug-input').focus();
  }

  // Init with English
  setLang('en-us');

  // ── Form submit ──
  async function handleSubmit(e) {
    e.preventDefault();
    const slug = document.getElementById('slug-input').value.trim().toLowerCase();
    const locale = document.getElementById('locale-input').value.trim().toLowerCase();
    if (!slug || !locale) return;
    const btn = document.getElementById('submit-btn');

    btn.disabled = true;
    btn.textContent = I18N[currentLang].loadingText;

    const t0 = performance.now();
    try {
      const res = await fetch('/api/spell?slug=' + encodeURIComponent(slug) + '&locale=' + encodeURIComponent(locale));
      const latencyMs = Math.round(performance.now() - t0);
      const edgeNode = res.headers.get('X-Edge-Location') || null;
      const data = await res.json();
      const t = I18N[currentLang];

      if (res.status === 202) {
        prependCard(buildPendingCard(slug, locale, t, false));
      } else if (!res.ok) {
        prependCard(buildErrorCard(data.error || JSON.stringify(data), t));
      } else {
        prependCard(buildSpellCard(data, latencyMs, edgeNode, t));
      }

      showResultsSection();
    } catch (err) {
      prependCard(buildErrorCard(err.message, I18N[currentLang]));
      showResultsSection();
    } finally {
      btn.disabled = false;
      btn.textContent = I18N[currentLang].submitBtn;
    }
  }

  function showResultsSection() {
    document.getElementById('results-section').style.display = 'block';
  }

  function prependCard(html) {
    const list = document.getElementById('results-list');
    const wrapper = document.createElement('div');
    wrapper.innerHTML = html;
    list.prepend(wrapper.firstElementChild);
  }

  // ── Card builders ──
  function buildSpellCard(spell, latencyMs, edgeNode, t) {
    const localeName = LOCALE_NAMES[spell.locale] || spell.locale;
    const now = new Date();
    const timestamp = now.toLocaleTimeString() + ', ' + now.toLocaleDateString();

    const attrFields = ['level', 'school', 'casting_time', 'range', 'duration', 'dnd_class', 'archetype', 'material'];
    const longFields = ['desc', 'higher_level'];

    const attrs = attrFields
      .filter(f => spell[f])
      .map(f => \`
        <div class="spell-attr">
          <div class="spell-attr-label" data-i18n-field="\${f}">\${t.fieldsLabels[f] || f}</div>
          <div class="spell-attr-value">\${escHtml(String(spell[f]))}</div>
        </div>\`)
      .join('');

    const longs = longFields
      .filter(f => spell[f])
      .map(f => \`
        <div class="spell-field">
          <div class="spell-field-label" data-i18n-field="\${f}">\${t.fieldsLabels[f] || f}</div>
          <div class="spell-field-value">\${escHtml(String(spell[f]))}</div>
        </div>\`)
      .join('');

    const edgeHtml = edgeNode
      ? \`<span>&#x1F4CD; \${escHtml(edgeNode)}</span>\`
      : '';

    return \`
      <div class="spell-card">
        <div class="spell-card-header">
          <div class="spell-locale-badge">\${escHtml(localeName)}</div>
          <div class="spell-meta">
            <span>&#x23F1; <span data-i18n-key="latencyLabel">\${t.latencyLabel}:</span> \${latencyMs}ms</span>
            <span>&#x1F552; <span data-i18n-key="timestampLabel">\${t.timestampLabel}:</span> \${escHtml(timestamp)}</span>
            \${edgeHtml}
          </div>
        </div>
        <div class="spell-card-body">
          <div class="spell-name">\${escHtml(spell.name || '')}</div>
          <div class="spell-attrs">\${attrs}</div>
          \${longs}
        </div>
      </div>\`;
  }

  function buildPendingCard(slug, locale, t, isRetry) {
    const safeSlug = encodeURIComponent(slug);
    const safeLocale = encodeURIComponent(locale);
    const msg = isRetry ? t.pendingInProgress : t.pendingNew;
    return \`
      <div class="pending-card">
        <div class="pending-msg">\${escHtml(msg)}</div>
        <button class="retry-btn" onclick="retryFetch('\${safeSlug}', '\${safeLocale}', this)">\${t.retryBtn}</button>
      </div>\`;
  }

  function buildErrorCard(msg, t) {
    return \`<div class="error-card">\${escHtml(t.errorText)}: \${escHtml(msg)}</div>\`;
  }

  async function retryFetch(slug, locale, btn) {
    const card = btn.closest('.pending-card');
    const t = I18N[currentLang];
    btn.disabled = true;
    btn.textContent = t.loadingText;

    const t0 = performance.now();
    try {
      const res = await fetch('/api/spell?slug=' + slug + '&locale=' + locale);
      const latencyMs = Math.round(performance.now() - t0);
      const edgeNode = res.headers.get('X-Edge-Location') || null;
      const data = await res.json();

      let newHtml;
      if (res.status === 202) {
        newHtml = buildPendingCard(decodeURIComponent(slug), decodeURIComponent(locale), t, true);
      } else if (!res.ok) {
        newHtml = buildErrorCard(data.error || JSON.stringify(data), t);
      } else {
        newHtml = buildSpellCard(data, latencyMs, edgeNode, t);
      }

      const wrapper = document.createElement('div');
      wrapper.innerHTML = newHtml;
      card.replaceWith(wrapper.firstElementChild);
    } catch (err) {
      const d = document.createElement('div');
      d.innerHTML = buildErrorCard(err.message, t);
      card.replaceWith(d.firstElementChild);
    }
  }

  function escHtml(str) {
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

</script>

</body>
</html>`;

export function handleHomeRequest(_request: Request): Response {
  return new Response(HOME_HTML, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}
