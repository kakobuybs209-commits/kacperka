import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { ProductDB } from "@/lib/supabase";
import axios from "axios";
import * as cheerio from "cheerio";
import { detectCategory } from "@/utils/categoryHelper";

const AFFILIATE_CODE = 'xfrostyy';

// Map of Chinese/English variant labels to English clothing type words
const VARIANT_TYPE_MAP = [
    { keywords: ['卫衣', '连帽卫衣', 'hoodie', 'hoody', 'sweatshirt', '上衣外套'], type: 'hoodies', label: 'Hoodie' },
    { keywords: ['卫裤', '运动裤', '长裤', 'pants', 'trousers', 'joggers', 'sweatpants'], type: 'pants', label: 'Pants' },
    { keywords: ['短裤', 'shorts'], type: 'shorts', label: 'Shorts' },
    { keywords: ['t恤', 't-shirt', 'tshirt', 'shirt', '上衣'], type: 't-shirts', label: 'T-shirt' },
    { keywords: ['外套', '夹克', 'jacket', 'coat'], type: 'jackets', label: 'Jacket' },
];

function adjustProductName(baseName, variantLabel) {
    if (!variantLabel) return baseName;
    const low = variantLabel.toLowerCase();

    const variantType = VARIANT_TYPE_MAP.find(entry =>
        entry.keywords.some(kw => low.includes(kw.toLowerCase()))
    );
    if (!variantType) return baseName;

    const baseType = VARIANT_TYPE_MAP.find(entry =>
        entry.keywords.some(kw => baseName.toLowerCase().includes(kw.toLowerCase()))
    );

    if (baseType && baseType.type === variantType.type) return baseName;

    let newName = baseName;
    if (baseType) {
        const regex = new RegExp(`\\b${baseType.label}\\b`, 'gi');
        newName = newName.replace(regex, variantType.label).trim();
    } else {
        newName = `${baseName} ${variantType.label}`;
    }
    return newName;
}

export async function POST(req) {
  const session = await auth();
  
  if (!session || session.user.email !== "kakobuybs209@gmail.com") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { name, url } = await req.json();

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    // Extract itemID
    let itemId = "";
    const itemIdMatch = url.match(/itemID=(\d+)/) || url.match(/item\/(\d+)/);
    if (itemIdMatch) {
      itemId = itemIdMatch[1];
    } else {
      return NextResponse.json({ error: "Invalid Weidian URL" }, { status: 400 });
    }

    const weidianUrl = `https://weidian.com/item.html?itemID=${itemId}`;
    
    const res = await axios.get(weidianUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
      },
      timeout: 10000
    });

    const $ = cheerio.load(res.data);
    const scriptTag = $('#__rocker-render-inject__');
    
    if (scriptTag.length === 0) {
      return NextResponse.json({ error: "Could not find product data. Bot protection?" }, { status: 404 });
    }

    const data = JSON.parse(scriptTag.attr('data-obj'));
    const itemInfo = data.result.default_model.item_info;
    
    const finalName = name || itemInfo.item_name;
    const basePriceCNY = parseFloat(itemInfo.origin_price);
    const priceUSD = (basePriceCNY * 0.14).toFixed(2);

    const skuProperties = data.result.default_model.sku_properties;
    const variants = [];

    if (skuProperties && skuProperties.attr_list) {
      const imageAttr = skuProperties.attr_list.find(attr => 
        attr.attr_values && attr.attr_values.some(v => v.img)
      );
      
      if (imageAttr && imageAttr.attr_values) {
        for (const val of imageAttr.attr_values) {
          if (val.img) {
            const variantLabel = (val.attr_name || val.name || '').toLowerCase();
            const adjustedName = adjustProductName(finalName, variantLabel);
            const adjustedCategory = detectCategory(adjustedName);

            variants.push({
              name: adjustedName,
              price: parseFloat(priceUSD),
              image: val.img.startsWith('http') ? `${val.img}?w=400&h=400` : `https:${val.img}?w=400&h=400`,
              category: adjustedCategory,
              batch: 'best',
              link: `https://www.kakobuy.com/item/details?url=${encodeURIComponent(weidianUrl)}&affcode=${AFFILIATE_CODE}`
            });
          }
        }
      }
    }
    
    if (variants.length === 0) {
      variants.push({
        name: finalName,
        price: parseFloat(priceUSD),
        image: itemInfo.item_head.startsWith('http') ? `${itemInfo.item_head}?w=400&h=400` : `https:${itemInfo.item_head}?w=400&h=400`,
        category: detectCategory(finalName),
        batch: 'best',
        link: `https://www.kakobuy.com/item/details?url=${encodeURIComponent(weidianUrl)}&affcode=${AFFILIATE_CODE}`
      });
    }

    // Save all variants/product to DB
    const savedProducts = [];
    for (const v of variants) {
      const newProduct = await ProductDB.create(v);
      savedProducts.push(newProduct);
    }

    return NextResponse.json({ 
      success: true, 
      message: `Successfully added ${savedProducts.length} product(s)`,
      products: savedProducts
    });

  } catch (error) {
    console.error("Scraper API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
