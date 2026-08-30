/**
 * Template Import Helper Functions
 * 
 * Utilities for parsing product data from various sources:
 * - Text (copied from spreadsheets)
 * - CSV files
 * - Google Sheets URLs
 */

/**
 * Decodes repeated URI encoding (up to 3 levels)
 * @param {string} value - The string to decode
 * @returns {string} - Decoded string
 */
function decodeRepeated(value) {
  let output = String(value || '');

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

/**
 * Extracts unique Weidian itemIDs from text
 * @param {string} text - Text containing Weidian URLs
 * @returns {string[]} - Array of unique Weidian URLs
 */
export function extractWeidianUrls(text) {
  const uniqueItemIds = new Set();
  const variants = [String(text || ''), decodeRepeated(text)];

  for (const value of variants) {
    const regex = /(?:itemID=|itemID%3D|\/item\/)(\d+)/gi;
    let match = regex.exec(value);

    while (match) {
      uniqueItemIds.add(match[1]);
      match = regex.exec(value);
    }
  }

  return Array.from(uniqueItemIds).map((itemId) => `https://weidian.com/item.html?itemID=${itemId}`);
}

/**
 * Parses template data from pasted text (tab-separated)
 * Expected format: Name [TAB] URL
 * @param {string} text - Pasted text from spreadsheet
 * @returns {Array<{name: string, url: string}>} - Array of products
 */
export function parseTemplateData(text) {
  if (!text.trim()) return [];
  
  const lines = text.split('\n');
  const products = [];
  
  for (const line of lines) {
    const parts = line.split('\t'); // Tab-separated values from copy-paste
    if (parts.length >= 2) {
      const name = parts[0]?.trim();
      const url = parts[1]?.trim();
      
      if (name && url && url.includes('weidian.com')) {
        products.push({ name, url });
      }
    }
  }
  
  return products;
}

/**
 * Parses CSV file content
 * Supports both comma and tab separation
 * ONLY reads first 2 columns: Name (A) and Link (B), ignores rest (like ID in column C)
 * @param {string} csvText - CSV file content
 * @returns {Array<{name: string, url: string}>} - Array of products
 */
export function parseCSVFile(csvText) {
  if (!csvText.trim()) return [];
  
  const lines = csvText.split('\n');
  console.log('📄 Total lines in CSV:', lines.length);
  
  const products = [];
  
  // Skip header row if it contains Chinese characters (产品, 名称, 链接, etc) or English headers (name, link, product, etc)
  const firstLine = lines[0] || '';
  const hasChineseHeader = /[\u4e00-\u9fa5]/.test(firstLine);
  const hasEnglishHeader = /name|link|product|url/i.test(firstLine);
  const startLine = (hasChineseHeader || hasEnglishHeader) ? 1 : 0;
  
  console.log('🔍 Header detected:', hasChineseHeader ? 'Chinese' : hasEnglishHeader ? 'English' : 'None');
  console.log('📊 Starting from line:', startLine);
  
  for (let i = startLine; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // Handle both comma and tab separation
    const parts = line.includes('\t') ? line.split('\t') : line.split(',');
    
    // ONLY take first 2 columns: A (name) and B (link)
    // Ignore column C (ID), D, E, etc.
    if (parts.length >= 2) {
      const name = parts[0]?.replace(/['"]/g, '').trim();
      const url = parts[1]?.replace(/['"]/g, '').trim();
      
      // Validate we have both name and Weidian link
      if (name && url && url.includes('weidian.c')) { // Accept weidian.com or partial
        console.log(`✅ [${i}] Found: "${name}" -> ${url.substring(0, 50)}...`);
        products.push({ name, url });
      } else {
        if (name && !url) {
          console.log(`⚠️  [${i}] Skipped: "${name}" - missing link`);
        } else if (!name && url) {
          console.log(`⚠️  [${i}] Skipped: link without name`);
        } else if (url && !url.includes('weidian.c')) {
          console.log(`⚠️  [${i}] Skipped: "${name}" - not a Weidian link (${url})`);
        }
      }
    } else {
      console.log(`⚠️  [${i}] Skipped: insufficient columns (${parts.length})`);
    }
  }
  
  console.log(`✨ Final parsed products: ${products.length} out of ${lines.length - startLine} data rows`);
  return products;
}

/**
 * Fetches and parses data from Google Sheets URL
 * @param {string} url - Google Sheets URL
 * @returns {Promise<Array<{name: string, url: string}>>} - Array of products
 */
export async function fetchGoogleSheetsData(url) {
  try {
    console.log('🔗 Fetching Google Sheets data from:', url);
    
    // Convert Google Sheets URL to CSV export URL
    let csvUrl = url;
    
    if (url.includes('docs.google.com/spreadsheets')) {
      const sheetId = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/)?.[1];
      const gidMatch = url.match(/[#&]gid=([0-9]+)/);
      const gid = gidMatch ? gidMatch[1] : '0';
      
      if (sheetId) {
        csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
        console.log('🔄 Converted URL:', csvUrl);
      }
    }
    
    const response = await fetch(`/api/admin/scrape/sheets?url=${encodeURIComponent(csvUrl)}`);
    
    console.log('📊 API Response status:', response.status);
    
    if (!response.ok) {
      let errorMessage = 'Failed to fetch Google Sheets data';
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch (e) {
        errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      }
      console.error('❌ API Error:', errorMessage);
      throw new Error(errorMessage);
    }
    
    const csvText = await response.text();
    console.log('✅ Got CSV data, length:', csvText.length);
    
    if (!csvText || csvText.trim().length === 0) {
      throw new Error('Google Sheets returned empty data');
    }
    
    const parsed = parseCSVFile(csvText);
    console.log('✅ Parsed products:', parsed.length);
    
    return parsed;
  } catch (error) {
    console.error('❌ Error fetching Google Sheets:', error);
    throw new Error(`Google Sheets error: ${error.message}`);
  }
}
