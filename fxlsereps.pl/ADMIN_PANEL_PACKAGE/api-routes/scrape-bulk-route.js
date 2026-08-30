import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { ProductDB, supabaseAdmin } from "@/lib/supabase";
import axios from "axios";
import * as cheerio from "cheerio";
import { detectCategory } from "@/utils/categoryHelper";

const AFFILIATE_CODE = process.env.KAKOBUY_AFFILIATE_CODE || "xfrostyy";
const DEFAULT_CONCURRENCY = 4;
const MAX_CONCURRENCY = 6;
const VALID_BATCHES = new Set(["best", "budget", "random", "popular"]);
const VALID_REPLACE_MODES = new Set(["none", "pinned", "all"]);
const USER_AGENT =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1";

const VARIANT_TYPE_MAP = [
  { keywords: ["ĺŤ«čˇŁ", "čżžĺ¸˝ĺŤ«čˇŁ", "hoodie", "hoody", "sweatshirt", "ä¸ŠčˇŁĺ¤–ĺĄ—"], type: "hoodies", label: "Hoodie" },
  { keywords: ["ĺŤ«čŁ¤", "čżĺŠ¨čŁ¤", "é•żčŁ¤", "pants", "trousers", "joggers", "sweatpants"], type: "pants", label: "Pants" },
  { keywords: ["çź­čŁ¤", "shorts"], type: "shorts", label: "Shorts" },
  { keywords: ["tć¤", "t-shirt", "tshirt", "shirt", "ä¸ŠčˇŁ"], type: "t-shirts", label: "T-shirt" },
  { keywords: ["ĺ¤–ĺĄ—", "ĺ¤ąĺ…‹", "jacket", "coat"], type: "jackets", label: "Jacket" }
];

function adjustProductName(baseName, variantLabel) {
  if (!variantLabel) return baseName;
  const low = variantLabel.toLowerCase();

  const variantType = VARIANT_TYPE_MAP.find((entry) =>
    entry.keywords.some((keyword) => low.includes(keyword.toLowerCase()))
  );
  if (!variantType) return baseName;

  const baseType = VARIANT_TYPE_MAP.find((entry) =>
    entry.keywords.some((keyword) => baseName.toLowerCase().includes(keyword.toLowerCase()))
  );

  if (baseType && baseType.type === variantType.type) return baseName;

  if (baseType) {
    const regex = new RegExp(`\\b${baseType.label}\\b`, "gi");
    return baseName.replace(regex, variantType.label).trim();
  }

  return `${baseName} ${variantType.label}`;
}

function decodeRepeated(value) {
  let output = String(value || "");

  for (let i = 0; i < 3; i++) {
    try {
      const decoded = decodeURIComponent(output);
      if (decoded === output) break;
      output = decoded;
    } catch {
      break;
    }
  }

  return output;
}

function extractItemId(input) {
  const raw = String(input || "");
  const variants = [raw, decodeRepeated(raw)];

  for (const value of variants) {
    const match =
      value.match(/itemID=(\d+)/i) ||
      value.match(/itemID%3D(\d+)/i) ||
      value.match(/\/item\/(\d+)/i);

    if (match) return match[1];
  }

  return null;
}

function getWeidianUrl(itemId) {
  return `https://weidian.com/item.html?itemID=${itemId}`;
}

function getAffiliateLink(weidianUrl) {
  return `https://www.kakobuy.com/item/details?url=${encodeURIComponent(weidianUrl)}&affcode=${AFFILIATE_CODE}`;
}

function normalizeBulkInput(input) {
  const rawItems = Array.isArray(input) ? input : String(input || "").split(/\s+/);
  const uniqueItems = new Map();

  for (const rawItem of rawItems) {
    const source = String(rawItem || "").trim();
    if (!source) continue;

    const chunks = source.split(/\s+/);
    for (const chunk of chunks) {
      const itemId = extractItemId(chunk);
      if (!itemId || uniqueItems.has(itemId)) continue;

      uniqueItems.set(itemId, {
        itemId,
        sourceUrl: chunk,
        weidianUrl: getWeidianUrl(itemId)
      });
    }
  }

  return Array.from(uniqueItems.values());
}

function cleanName(name) {
  const fallback = "Weidian Product";
  const normalized = String(name || fallback).replace(/\s+/g, " ").trim() || fallback;

  if (normalized.length <= 60) return normalized;
  return `${normalized.slice(0, 57).trimEnd()}...`;
}

function formatImageUrl(imageUrl) {
  if (!imageUrl) return "";

  const absoluteUrl = imageUrl.startsWith("http") ? imageUrl : `https:${imageUrl}`;
  const separator = absoluteUrl.includes("?") ? "&" : "?";
  return `${absoluteUrl}${separator}w=400&h=400`;
}

function parsePositiveInt(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function parseConcurrency(value) {
  return Math.min(MAX_CONCURRENCY, parsePositiveInt(value, DEFAULT_CONCURRENCY));
}

function getReplaceMode(value) {
  return VALID_REPLACE_MODES.has(value) ? value : "none";
}

function getItemLinkRegex(itemId) {
  return new RegExp(`itemID(?:%3D|=)${itemId}`, "i");
}

async function scrapeProductsForItem(item, options) {
  const response = await axios.get(item.weidianUrl, {
    headers: {
      "User-Agent": USER_AGENT,
      Referer: "https://weidian.com/"
    },
    timeout: 12000
  });

  const $ = cheerio.load(response.data);
  const scriptTag = $("#__rocker-render-inject__");

  if (scriptTag.length === 0) {
    throw new Error("Could not find product data. Weidian may be blocking this item.");
  }

  let data;
  try {
    data = JSON.parse(scriptTag.attr("data-obj"));
  } catch {
    throw new Error("Could not parse product data.");
  }

  const itemInfo = data?.result?.default_model?.item_info;
  if (!itemInfo) {
    throw new Error("Product payload is missing item information.");
  }

  const baseName = cleanName(itemInfo.item_name);
  const priceCny = Number.parseFloat(itemInfo.origin_price);
  const priceUsd = Number.isFinite(priceCny) ? Number((priceCny * 0.14).toFixed(2)) : 0;
  const affiliateLink = getAffiliateLink(item.weidianUrl);
  
  // Get only ONE image - prefer variant image, fallback to main image
  let image = formatImageUrl(itemInfo.item_head);
  const skuProperties = data?.result?.default_model?.sku_properties;

  if (skuProperties?.attr_list) {
    const imageAttr = skuProperties.attr_list.find((attr) =>
      attr.attr_values?.some((value) => value.img)
    );

    if (imageAttr?.attr_values && imageAttr.attr_values[0]?.img) {
      image = formatImageUrl(imageAttr.attr_values[0].img);
    }
  }

  if (!image) {
    throw new Error("Product is missing a main image.");
  }

  // Create only ONE product
  const productDataList = [{
    name: baseName,
    price: priceUsd,
    image,
    category: detectCategory(baseName),
    batch: options.batch,
    link: affiliateLink,
    is_pinned: options.pin,
    pinned_order: null
  }];

  return {
    ...item,
    name: baseName,
    productDataList
  };
}

async function saveProductsForItem(scrapedProduct, options) {
  const shouldRefreshExisting = options.replaceMode !== "all";
  let deletedExistingCount = 0;

  if (shouldRefreshExisting) {
    // Delete existing products with the same itemID in the link
    const { data: existingProducts } = await supabaseAdmin
      .from('products')
      .select('id')
      .ilike('link', `%itemID=${scrapedProduct.itemId}%`);
    
    if (existingProducts && existingProducts.length > 0) {
      const ids = existingProducts.map(p => p.id);
      await ProductDB.deleteMany(ids);
      deletedExistingCount = existingProducts.length;
    }
  }

  // Insert new products
  const { data: products, error } = await supabaseAdmin
    .from('products')
    .insert(scrapedProduct.productDataList)
    .select();

  if (error) throw error;

  return {
    action: deletedExistingCount > 0 ? "updated" : "created",
    deletedExistingCount,
    products
  };
}

async function runWithConcurrency(items, limit, worker) {
  const results = new Array(items.length);
  let nextIndex = 0;

  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (nextIndex < items.length) {
      const currentIndex = nextIndex;
      nextIndex += 1;
      results[currentIndex] = await worker(items[currentIndex], currentIndex);
    }
  });

  await Promise.all(workers);
  return results;
}

function serializeResult(result) {
  return {
    itemId: result.itemId,
    url: result.weidianUrl || result.sourceUrl,
    status: result.status,
    action: result.action,
    name: result.name,
    productId: result.productId,
    productCount: result.productCount,
    message: result.message
  };
}

function assignPinnedOrders(results, options) {
  let nextOrder = options.startOrder;

  return results.map((result) => {
    if (result.status === "error" || !Array.isArray(result.productDataList)) {
      return result;
    }

    const productDataList = result.productDataList.map((productData) => {
      const pinnedOrder = options.pin ? nextOrder : null;
      if (options.pin) nextOrder += 1;

      return {
        ...productData,
        is_pinned: options.pin,
        pinned_order: pinnedOrder
      };
    });

    return {
      ...result,
      productDataList,
      productCount: productDataList.length
    };
  });
}

export async function POST(req) {
  const session = await auth();

  if (!session || session.user.email !== "kakobuybs209@gmail.com") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const isSingleImport = !Array.isArray(body.urls) && Boolean(body.url);
    const items = normalizeBulkInput(Array.isArray(body.urls) ? body.urls : body.url);

    if (items.length === 0) {
      return NextResponse.json({ error: "No valid Weidian item links found" }, { status: 400 });
    }

    const replaceMode = getReplaceMode(body.replaceMode);
    if (replaceMode !== "none" && body.confirm !== "PODMIEN") {
      return NextResponse.json({ error: "Missing replacement confirmation" }, { status: 400 });
    }

    const batch = VALID_BATCHES.has(body.batch) ? body.batch : "best";
    const pin = body.pin !== false;
    const startOrder = parsePositiveInt(body.startOrder ?? body.pinnedOrder, 1);
    const concurrency = parseConcurrency(body.concurrency);

    const rawScrapedResults = await runWithConcurrency(items, concurrency, async (item) => {
      try {
        const scrapedProduct = await scrapeProductsForItem(item, { batch, pin });

        return {
          ...scrapedProduct,
          status: "scraped"
        };
      } catch (error) {
        return {
          ...item,
          status: "error",
          message: error.message || "Failed to scrape product"
        };
      }
    });
    const scrapedResults = assignPinnedOrders(rawScrapedResults, { pin, startOrder });

    const scrapeFailures = scrapedResults.filter((result) => result.status === "error");

    if (replaceMode !== "none" && scrapeFailures.length > 0) {
      const blockedResults = scrapedResults.map((result) => {
        if (result.status === "error") return result;

        return {
          ...result,
          status: "skipped",
          message: "Not saved because replacement import had errors."
        };
      });

      return NextResponse.json(
        {
          success: false,
          error: "Import stopped before deleting anything because one or more links failed.",
          total: items.length,
          successes: 0,
          failures: scrapeFailures.length,
          created: 0,
          updated: 0,
          deletedCount: 0,
          results: blockedResults.map(serializeResult)
        },
        { status: 422 }
      );
    }

    // Handle replace mode deletions
    let deletedCount = 0;
    if (replaceMode === "all") {
      const { data: allProducts } = await supabaseAdmin.from('products').select('id');
      if (allProducts && allProducts.length > 0) {
        const ids = allProducts.map(p => p.id);
        await ProductDB.deleteMany(ids);
        deletedCount = allProducts.length;
      }
    } else if (replaceMode === "pinned") {
      const { data: pinnedProducts } = await supabaseAdmin
        .from('products')
        .select('id')
        .eq('is_pinned', true);
      if (pinnedProducts && pinnedProducts.length > 0) {
        const ids = pinnedProducts.map(p => p.id);
        await ProductDB.deleteMany(ids);
        deletedCount = pinnedProducts.length;
      }
    }

    let created = 0;
    let updated = 0;
    const finalResults = [];

    for (const result of scrapedResults) {
      if (result.status === "error") {
        finalResults.push(result);
        continue;
      }

      try {
        const saved = await saveProductsForItem(result, { replaceMode });
        if (saved.action === "created") created += saved.products.length;
        if (saved.action === "updated") updated += saved.products.length;

        for (const product of saved.products) {
          finalResults.push({
            ...result,
            status: "success",
            action: saved.action,
            name: product.name,
            productId: product.id.toString(),
            productCount: 1,
            message: saved.action === "created" ? "Created" : "Updated"
          });
        }
      } catch (error) {
        finalResults.push({
          ...result,
          status: "error",
          message: error.message || "Failed to save product"
        });
      }
    }

    const failures = finalResults.filter((result) => result.status === "error").length;
    const successes = created + updated;
    const responseStatus = failures > 0 ? (successes > 0 ? 207 : 500) : 200;
    const responseBody = {
      success: failures === 0,
      message: `Bulk import finished. Created: ${created}, updated: ${updated}, failed: ${failures}.`,
      total: finalResults.length,
      linkTotal: items.length,
      successes,
      failures,
      created,
      updated,
      deletedCount,
      results: finalResults.map(serializeResult)
    };

    if (isSingleImport && failures === 0) {
      responseBody.message = `${updated > 0 ? "Updated" : "Added"} ${successes} product(s)`;
    }

    return NextResponse.json(responseBody, { status: responseStatus });
  } catch (error) {
    console.error("Bulk Scraper API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
