// src/utils/categoryHelper.js

const CATEGORY_MAP = {
  // NEW CATEGORIES
  longsleeve: [
    'longsleeve', 'long sleeve', 'long-sleeve', 'ls tee', 'ls shirt'
  ],
  electronics: [
    'airpods', 'jbl', 'speaker', 'headphones', 'earbuds', 'charging', 'charger',
    'batterypack', 'power bank', 'iphone', 'samsung', 'phone', 'ipad', 'tablet',
    'apple pencil', 'pencil', 'electronics', 'gadget', 'tech'
  ],
  headwear: [
    'hat', 'cap', 'balaclava', 'beanie', 'headband', 'bandana', 'bucket hat',
    'snapback', 'trucker hat', 'dad hat', 'fitted cap', 'baseball cap'
  ],
  'bags-backpacks': [
    'bag', 'backpack', 'tote', 'messenger bag', 'duffel', 'shoulder bag',
    'crossbody', 'sling bag', 'handbag', 'clutch', 'travel bag', 'gym bag',
    'laptop bag', 'school bag', 'rucksack'
  ],
  belts: [
    'belt', 'waist belt', 'leather belt', 'buckle belt'
  ],
  
  // EXISTING CATEGORIES
  accessories: [
    // Small Personal Items
    'wallet', 'purse', 'pouch', 'card holder', 'keychain',
    // Jewelry & Personal Items
    'bracelet', 'necklace', 'earring', 'ring', 'jewelry', 'chain', 'pendant', 'brooch', 'pin',
    // Eyewear
    'glasses', 'sunglasses', 'eyewear',
    // Neck Accessories
    'scarf', 'scarves', 'shawl', 'tie', 'bowtie', 'bow tie',
    // Phone Cases (keep separate from electronics)
    'case', 'phone case', 'iphone case', 'samsung case',
    // Watches
    'watch', 'rolex', 'submariner', 'omega', 'patek', 'hublot', 'cartier', 'casio', 'seiko', 'citizen', 'audemars', 'ap', 'g-shock', 'zegarek',
    // Fragrances & Personal Care
    'perfume', 'cologne', 'fragrance', 'scent', 'eau de toilette', 'eau de parfum', 'edt', 'edp',
    // Small Accessories
    'socks', 'redbull', 'boxer', 'underwear', 'briefs', 'gloves', 'mittens'
  ],
  shorts: [
    'shorts', 'swim shorts', 'mesh shorts', 'ee shorts', 'basketball shorts', 'athletic shorts'
  ],
  pants: [
    'pants', 'jeans', 'joggers', 'trousers', 'denim', 'cargo', 'sweatpants', 'tracksuit bottoms', 'chinos', 'slacks', 'leggings'
  ],
  hoodies: [
    'hoodie', 'sweater', 'zip', 'cardigan', 'fleece', 'crewneck', 'jumper',
    'tech fleece', 'nocta tech', 'pullover'
  ],
  't-shirts': [
    't-shirt', 'shirt', 'polo', 'top', 'jersey', 'v-neck', 'short sleeve', 'oversized tee', 'tank top', 'vest'
  ],
  jackets: [
    'jacket', 'coat', 'windbreaker', 'vest', 'parka', 'puffer', 'down jacket',
    'nuptse', 'bomber', 'harrington', 'varsity', 'blazer', 'overcoat', 'trench', 'raincoat'
  ],
  sets: [
    'tracksuit', 'track suit', 'two piece', '2 piece', 'co-ord', 'coord', 'outfit set', 'matching set'
  ],
  shoes: [
    'shoes', 'sneakers', 'skate', 'shoe', 'dunk', 'force', 'jordan', 'yeezy', 'gazelle',
    'track', 'trainer', 'b30', 'b22', 'b33', 'nb', 'balance', 'campus', 'samba',
    'spezial', 'crocs', 'slide', 'hotstep', 'shox', 'aj1', 'aj3', 'aj4', 'aj11',
    'air max', 'vapormax', 'tn', '9060', '2002r', '1906r', 'bapesta', 'lanvin',
    'miu miu', 'asics', 'acics', 'foam', 'slides', 'clog', 'mule', 'birk', 'boston', 'rick owens',
    'b27', 'superstar', 'mind 001', 'be right back', 'nocta hotstep', 'boots', 'sandals', 'loafers'
  ]
};

// High-priority accessories that should be checked early to avoid misclassification
const ACCESSORY_PRIORITY = [
  // Fragrances (often misclassified as clothing)
  'perfume', 'cologne', 'fragrance', 'scent', 'eau de toilette', 'eau de parfum',
  // Scarves and neck accessories
  'scarf', 'scarves', 'shawl', 
  // Headwear
  'hat', 'cap', 'balaclava', 'beanie', 'headband',
  // Bags
  'bag', 'backpack', 'wallet', 'purse', 'tote',
  // Jewelry
  'necklace', 'bracelet', 'ring', 'chain', 'pendant',
  // Eyewear
  'belt', 'glasses', 'sunglasses',
  // Watches
  'watch', 'rolex', 'omega', 'patek', 'cartier'
];

export const PRODUCT_CATEGORIES = [
  'shoes',
  'hoodies',
  't-shirts',
  'pants',
  'shorts',
  'jackets',
  'longsleeve',
  'sets',
  'electronics',
  'headwear',
  'bags-backpacks',
  'belts',
  'accessories'
];

const CLOTHING_CATEGORY_ORDER = ['sets', 'shoes', 'jackets', 'hoodies', 'longsleeve', 'shorts', 'pants', 't-shirts'];

const matchesKeyword = (name, keyword, category) => {
  if (keyword === 'track') {
    if (name.includes('tracksuit') || name.includes('track suit')) return false;
    if (/\btrack\s+(pant|jacket|top|suit|set|zip)/.test(name)) return false;
  }

  if (keyword === 'suit' && category === 'pants') {
    if (name.includes('tracksuit') || name.includes('swimsuit')) return false;
  }

  if (keyword === 'denim' && category === 'pants') {
    if (name.includes('shorts')) return false;
  }

  if (keyword === 'shirt' && category === 't-shirts') {
    if (name.includes('shorts') || name.includes('t-shirt')) return name.includes('shirt');
    if (name.includes('sweatshirt')) return false;
  }

  if (keyword === 'top' && category === 't-shirts') {
    if (name.includes('laptop') || name.includes('desktop')) return false;
  }

  if (keyword === 'zip' && category === 'hoodies') {
    if (name.includes('zip wallet') || name.includes('zip bag')) return false;
  }

  if (keyword === 'knitted' && category === 'hoodies') {
    if (name.includes('hat') || name.includes('beanie') || name.includes('cap')) return false;
  }

  if (keyword === 'gel' && category === 'shoes') {
    return /\bgel\b|gel-|gel son|gel lyte|asics gel/.test(name);
  }

  if (keyword === 'jordan' && category === 'shoes') {
    if (name.includes('bag')) return false;
  }

  return name.includes(keyword);
};

const matchesCategory = (name, category) => {
  const keywords = CATEGORY_MAP[category] || [];
  return keywords.some(keyword => matchesKeyword(name, keyword, category));
};

/**
 * Detects the category of a product based on its name.
 * Uses intelligent pattern matching with priority-based classification.
 * @param {string} name - The product name.
 * @returns {string} - The detected category.
 */
export function detectCategory(name) {
  if (!name) return 't-shirts';
  const low = name.toLowerCase().trim();

  // ===== PHASE 1: Explicit multi-word patterns (highest priority) =====
  
  // Sets - must be checked first to avoid splitting into components
  if ((low.includes('hoodie') && low.includes('pants')) || 
      low.includes('tracksuit') || 
      low.includes('track suit') ||
      low.includes('two piece') ||
      low.includes('2 piece') ||
      /\b(co-ord|coord)\b/.test(low) ||
      low.includes('matching set') ||
      low.includes('outfit set')) {
    return 'sets';
  }

  // ===== PHASE 2: NEW SPECIFIC CATEGORIES (check before accessories) =====
  
  // Belts - HIGHEST PRIORITY (very specific)
  if (/\bbelt\b/.test(low)) {
    return 'belts';
  }
  
  // Electronics - check before accessories
  if (low.includes('airpods') || 
      low.includes('jbl') || 
      low.includes('speaker') ||
      low.includes('headphones') ||
      low.includes('earbuds') ||
      (low.includes('charger') || low.includes('charging')) ||
      low.includes('power bank') ||
      low.includes('batterypack') ||
      low.includes('ipad') ||
      low.includes('tablet') ||
      (low.includes('apple') && low.includes('pencil'))) {
    return 'electronics';
  }
  
  // Headwear - check before accessories
  if (/\b(hat|cap|beanie)\b/.test(low) || 
      low.includes('balaclava') ||
      low.includes('headband') ||
      low.includes('bandana') ||
      low.includes('bucket hat') ||
      low.includes('snapback') ||
      low.includes('trucker hat') ||
      low.includes('dad hat')) {
    return 'headwear';
  }
  
  // Bags & Backpacks - check before accessories
  if (low.includes('bag') || 
      low.includes('backpack') || 
      low.includes('tote') ||
      low.includes('messenger') ||
      low.includes('duffel') ||
      low.includes('shoulder bag') ||
      low.includes('crossbody') ||
      low.includes('sling bag') ||
      low.includes('handbag') ||
      low.includes('clutch') ||
      low.includes('rucksack') ||
      (low.includes('travel') && low.includes('bag')) ||
      (low.includes('gym') && low.includes('bag')) ||
      (low.includes('laptop') && low.includes('bag'))) {
    return 'bags-backpacks';
  }

  // ===== PHASE 3: General accessories (lower priority) =====
  
  // Fragrances - check before any clothing categories
  if (low.includes('perfume') || 
      low.includes('cologne') || 
      low.includes('fragrance') ||
      /\bscent\b/.test(low) ||
      low.includes('eau de') ||
      /\b(edt|edp)\b/.test(low)) {
    return 'accessories';
  }

  // Scarves and neck accessories
  if (low.includes('scarf') || 
      low.includes('scarves') || 
      low.includes('shawl') ||
      (low.includes('neck') && (low.includes('tie') || low.includes('warmer')))) {
    return 'accessories';
  }

  // Wallets and small items
  if (low.includes('wallet') || 
      low.includes('purse') || 
      low.includes('pouch') ||
      low.includes('card holder') ||
      low.includes('keychain')) {
    return 'accessories';
  }

  // Jewelry and watches
  if (low.includes('necklace') || 
      low.includes('bracelet') || 
      low.includes('earring') ||
      /\bring\b/.test(low) ||
      low.includes('jewelry') ||
      low.includes('chain') ||
      low.includes('pendant') ||
      low.includes('watch') ||
      low.includes('rolex') ||
      low.includes('omega') ||
      low.includes('cartier') ||
      low.includes('patek')) {
    return 'accessories';
  }

  // Eyewear
  if (low.includes('glasses') || 
      low.includes('sunglasses') ||
      low.includes('eyewear')) {
    return 'accessories';
  }

  // Phone cases (keep as accessories, not electronics)
  if ((low.includes('case') || low.includes('phone case')) && 
      !low.includes('suitcase') && 
      !low.includes('briefcase')) {
    return 'accessories';
  }

  // ===== PHASE 4: Specific brand/product patterns =====
  
  // Moncler jackets
  if (low.includes('moncler') && (low.includes('jacket') || low.includes('maya'))) {
    return 'jackets';
  }

  // Nocta Tech Fleece (hoodies, not shoes)
  if (low.includes('nocta') && low.includes('tech') && !low.includes('hotstep')) {
    return 'hoodies';
  }

  // ===== PHASE 5: Clothing categories with exclusions =====
  
  // Longsleeve - CHECK BEFORE T-SHIRTS!
  if (low.includes('longsleeve') || 
      low.includes('long sleeve') ||
      low.includes('long-sleeve') ||
      low.includes('ls tee') ||
      low.includes('ls shirt') ||
      (low.includes('long') && low.includes('sleeve') && !low.includes('short'))) {
    return 'longsleeve';
  }
  
  // Hoodies - CHECK FIRST before other clothing!
  if (/\bhoodie\b/i.test(low) || 
      /\bhoody\b/i.test(low) ||
      low.includes('sweatshirt') ||
      low.includes('pullover') ||
      (low.includes('fleece') && !low.includes('jacket') && !low.includes('pants'))) {
    return 'hoodies';
  }
  
  // Shorts - use word boundary to avoid partial matches
  if (/\bshorts\b/.test(low) || 
      low.includes('swim shorts') ||
      low.includes('mesh shorts') ||
      low.includes('basketball shorts')) {
    return 'shorts';
  }

  // Suits - be very careful with this pattern
  // Only match "suit" when it's clearly a formal suit (not tracksuit/swimsuit)
  if (/\bsuit\b/.test(low) && 
      !low.includes('tracksuit') && 
      !low.includes('swimsuit') &&
      !low.includes('jump suit') &&
      !low.includes('jumpsuit') &&
      (low.includes('dress suit') || 
       low.includes('formal suit') ||
       low.includes('business suit') ||
       (low.includes('suit') && (low.includes('pant') || low.includes('trouser'))))) {
    return 'pants';
  }

  // ===== PHASE 6: Ordered category matching =====
  
  // Check categories in priority order
  for (const category of CLOTHING_CATEGORY_ORDER) {
    if (matchesCategory(low, category)) {
      return category;
    }
  }

  // Final check for accessories (low priority items like socks, underwear)
  if (matchesCategory(low, 'accessories')) {
    return 'accessories';
  }

  // ===== FALLBACK =====
  // Default to t-shirts for unrecognized items
  return 't-shirts';
}

// For use in CommonJS environments (scrapers)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { detectCategory, CATEGORY_MAP, PRODUCT_CATEGORIES };
}
