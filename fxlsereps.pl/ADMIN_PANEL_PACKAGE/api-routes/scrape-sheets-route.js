/**
 * Google Sheets Proxy API Route
 * 
 * GET /api/admin/scrape/sheets?url={googleSheetsUrl}
 * 
 * Fetches CSV data from Google Sheets URL (acts as a proxy to avoid CORS issues)
 * 
 * NOTE: This file is for Next.js App Router
 * Place at: /src/app/api/admin/scrape/sheets/route.js
 */

import { NextResponse } from 'next/server';

/**
 * GET handler for fetching Google Sheets CSV data
 * @param {Request} request - Next.js request object
 * @returns {Response} CSV data or error response
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    let url = searchParams.get('url');

    console.log('📥 Google Sheets request received:', url);

    if (!url) {
      return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 });
    }

    // Validate URL is from Google Sheets
    if (!url.includes('docs.google.com') && !url.includes('googleapis.com')) {
      return NextResponse.json({ error: 'Invalid Google Sheets URL - must be from docs.google.com' }, { status: 400 });
    }

    // Convert regular Google Sheets URL to CSV export URL if needed
    if (url.includes('/edit') && !url.includes('/export')) {
      const sheetIdMatch = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
      const gidMatch = url.match(/[#&]gid=([0-9]+)/);
      
      if (sheetIdMatch) {
        const sheetId = sheetIdMatch[1];
        const gid = gidMatch ? gidMatch[1] : '0';
        url = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
        console.log('🔄 Converted to CSV export URL:', url);
      }
    }

    // Fetch the CSV data from Google Sheets
    console.log('🌐 Fetching from Google Sheets...');
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/csv,text/plain,*/*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://docs.google.com/',
      }
    });

    console.log('📊 Google Sheets response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Google Sheets error:', errorText);
      
      if (response.status === 403 || response.status === 401) {
        return NextResponse.json({ 
          error: 'Google Sheets access denied. Make sure the spreadsheet is set to "Anyone with the link can view".' 
        }, { status: 403 });
      }
      
      return NextResponse.json({ 
        error: `Failed to fetch Google Sheets data (HTTP ${response.status}). Make sure the sheet is publicly accessible.` 
      }, { status: response.status });
    }

    const csvData = await response.text();
    console.log('✅ Successfully fetched CSV data, length:', csvData.length);

    // Check if we got actual CSV data
    if (!csvData || csvData.trim().length === 0) {
      return NextResponse.json({ 
        error: 'Google Sheets returned empty data. Check if the sheet has content.' 
      }, { status: 400 });
    }

    // Return CSV data with appropriate headers
    return new Response(csvData, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-cache',
      },
    });

  } catch (error) {
    console.error('❌ Google Sheets fetch error:', error);
    return NextResponse.json(
      { error: `Failed to fetch Google Sheets: ${error.message}` },
      { status: 500 }
    );
  }
}
