import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// 🧠 ZAAWANSOWANY KLASYFIKATOR
function classifyProduct(productName) {
  const name = productName.toLowerCase().trim();
  
  // SHOES - najwyższy priorytet dla butów
  if (name.match(/jordan|nike.*(af1|air force|dunk|air max|tn)|yeezy|new balance|nb |salomon|xt-6|shoe|sneaker|slide|foam runner|crocs|converse|vans|balenciaga.*track|samba|gazelle|campus|ramones|geobasket/)) {
    return 'shoes';
  }
  
  // HOODIES - musi mieć "hoodie"
  if (name.includes('hoodie')) {
    return 'hoodies';
  }
  
  // LONGSLEEVE
  if (name.match(/longsleeve|long sleeve|ls |crewneck|sweatshirt/) && !name.includes('hoodie')) {
    return 'longsleeve';
  }
  
  // T-SHIRTS
  if (name.match(/t-shirt|tee\b|polo\b/) && !name.match(/hoodie|sweat|long/)) {
    return 't-shirts';
  }
  
  // JACKETS
  if (name.match(/jacket|kurtka|bomber|puffer|down jacket|windbreaker|coach jacket|moncler|maya|north face|nuptse|arcteryx|canada goose|varsity|leather jacket|denim jacket|trucker/)) {
    return 'jackets';
  }
  
  // PANTS
  if (name.match(/\bpants\b|\bjeans\b|cargo.*pant|spodnie|joggers|sweatpants|tech fleece.*pant|trousers|corduroy.*pant/) && !name.includes('short')) {
    return 'pants';
  }
  
  // SHORTS
  if (name.match(/\bshorts\b|\bshort\b|spodenki/) && !name.includes('shirt')) {
    return 'shorts';
  }
  
  // SETS
  if (name.match(/tracksuit|tech fleece.*set|\bset\b.*tech|dres|two piece|2piece|matching set/)) {
    return 'sets';
  }
  
  // HEADWEAR
  if (name.match(/\bcap\b|\bhat\b|beanie|czapka|kapelusz|balaclava|bucket hat|dad hat|snapback|trucker hat|baseball cap/)) {
    return 'headwear';
  }
  
  // BAGS & BACKPACKS
  if (name.match(/\bbag\b|backpack|plecak|torba|duffle|tote|shoulder bag|crossbody|messenger|sling bag|waist bag|fanny pack|gym bag|holdall/) && !name.includes('belt bag')) {
    return 'bags-backpacks';
  }
  
  // BELTS
  if (name.match(/\bbelt\b|pasek/) && !name.includes('bag')) {
    return 'belts';
  }
  
  // ELECTRONICS
  if (name.match(/phone|iphone|samsung|airpod|earbud|headphone|speaker|charger|cable|power bank|smartwatch|apple watch|bluetooth|wireless|earphone/)) {
    return 'electronics';
  }
  
  // Tech Fleece special handling
  if (name.includes('tech fleece')) {
    if (name.includes('hoodie')) return 'hoodies';
    if (name.match(/pant|jogger/)) return 'pants';
    if (name.includes('short')) return 'shorts';
    if (name.includes('set')) return 'sets';
  }
  
  // Essentials special handling
  if (name.includes('essentials')) {
    if (name.includes('hoodie')) return 'hoodies';
    if (name.match(/tee|t-shirt/)) return 't-shirts';
    if (name.match(/pant|jogger/)) return 'pants';
    if (name.includes('short')) return 'shorts';
  }
  
  // Brand-specific: Nike/Jordan/Yeezy bez innych słów = shoes
  if ((name.match(/^(nike|jordan|yeezy)/) || name.match(/(nike|jordan|yeezy)\s/)) &&
      !name.match(/hoodie|shirt|pant|short|jacket|bag|cap|hat/)) {
    return 'shoes';
  }
  
  // DEFAULT
  return 'accessories';
}

export async function GET(request) {
  try {
    console.log('📥 Fetching all products...');
    
    // Pobierz wszystkie produkty
    const { data: products, error } = await supabase
      .from('products')
      .select('id, name, category')
      .limit(10000);
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    console.log(`✅ Fetched ${products.length} products`);
    
    // Klasyfikuj i znajdź zmiany
    const updates = [];
    const stats = {
      total: products.length,
      correct: 0,
      needsUpdate: 0,
      byCategory: {}
    };
    
    products.forEach(product => {
      const suggested = classifyProduct(product.name);
      const current = product.category || 'brak';
      
      // Count distribution
      stats.byCategory[suggested] = (stats.byCategory[suggested] || 0) + 1;
      
      if (current !== suggested) {
        updates.push({
          id: product.id,
          name: product.name,
          currentCategory: current,
          suggestedCategory: suggested
        });
        stats.needsUpdate++;
      } else {
        stats.correct++;
      }
    });
    
    // Group changes
    const changeGroups = {};
    updates.forEach(u => {
      const key = `${u.currentCategory} → ${u.suggestedCategory}`;
      changeGroups[key] = (changeGroups[key] || 0) + 1;
    });
    
    return NextResponse.json({
      success: true,
      stats,
      updates,
      changeGroups,
      examples: updates.slice(0, 20)
    });
    
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    console.log('🚀 Starting category fix...');
    
    // Pobierz wszystkie produkty
    const { data: products, error: fetchError } = await supabase
      .from('products')
      .select('id, name, category')
      .limit(10000);
    
    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }
    
    console.log(`✅ Fetched ${products.length} products`);
    
    // Klasyfikuj i wykonaj zmiany
    const updates = [];
    let updated = 0;
    let failed = 0;
    
    for (const product of products) {
      const suggested = classifyProduct(product.name);
      const current = product.category || 'brak';
      
      if (current !== suggested) {
        updates.push({ name: product.name, from: current, to: suggested });
        
        // Wykonaj update
        const { error: updateError } = await supabase
          .from('products')
          .update({ category: suggested })
          .eq('id', product.id);
        
        if (updateError) {
          console.error(`Failed to update "${product.name}":`, updateError);
          failed++;
        } else {
          updated++;
        }
      }
    }
    
    console.log(`✅ Updated ${updated} products, ${failed} failed`);
    
    return NextResponse.json({
      success: true,
      message: `Updated ${updated} products`,
      updated,
      failed,
      examples: updates.slice(0, 20)
    });
    
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
