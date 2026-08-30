/**
 * Template Import Modal Component
 * 
 * Standalone component for bulk product import with 3 methods:
 * - Paste Text (copy/paste from spreadsheets)
 * - Upload File (CSV/TXT)
 * - Google Sheets URL (direct import)
 * 
 * Features:
 * - 3 import modes: Add/Refresh, Replace Pinned, Replace All Catalog
 * - Batch selection (Best, Budget, Random, Popular)
 * - Real-time progress tracking
 * - Error handling with detailed logs
 */

'use client'; // For Next.js App Router

import { useState, useMemo, useCallback } from 'react';
import { parseTemplateData, parseCSVFile, fetchGoogleSheetsData } from '@/utils/template-helpers';

const REPLACE_CONFIRM_TEXT = 'REPLACE';

/**
 * Translation hook - Replace with your own i18n solution
 * @returns {{t: function}} Translation function
 */
function useAdminTranslation() {
  const t = (key) => {
    // Simple English fallback - replace with your translation system
    return key;
  };
  return { t };
}

/**
 * Template Import Modal Component
 * @param {Object} props - Component props
 * @param {boolean} props.isOpen - Modal visibility
 * @param {function} props.onClose - Close callback
 * @param {function} props.onImportComplete - Callback when import finishes
 * @param {string} props.apiEndpoint - Optional custom API endpoint (default: '/api/admin/scrape/template')
 * @param {function} props.showToast - Optional toast notification function
 * @returns {JSX.Element|null} Modal component or null
 */
export default function TemplateImportModal({
  isOpen,
  onClose,
  onImportComplete,
  apiEndpoint = '/api/admin/scrape/template',
  showToast
}) {
  const { t } = useAdminTranslation();

  // State management
  const [templateText, setTemplateText] = useState('');
  const [templateInputMode, setTemplateInputMode] = useState('text'); // 'text', 'file', 'url'
  const [templateFile, setTemplateFile] = useState(null);
  const [templateUrl, setTemplateUrl] = useState('');
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ total: 0, current: 0, successes: 0, failures: 0, logs: [] });
  const [bulkReplaceMode, setBulkReplaceMode] = useState('none'); // 'none', 'pinned', 'all'
  const [bulkBatch, setBulkBatch] = useState('best');
  const [bulkCategory, setBulkCategory] = useState('auto'); // 'auto', 'shoes', 'hoodies', 't-shirts', 'pants', 'shorts', 'jackets', 'sets', 'accessories'
  const [replacePinnedConfirm, setReplacePinnedConfirm] = useState('');
  const [parsedFileData, setParsedFileData] = useState([]);
  const [parsedUrlData, setParsedUrlData] = useState([]);
  const [loadingSheets, setLoadingSheets] = useState(false);

  // Computed values
  const templateData = useMemo(() => {
    if (templateInputMode === 'text') {
      return parseTemplateData(templateText);
    }
    return [];
  }, [templateText, templateInputMode]);

  const currentTemplateData = templateInputMode === 'text' ? templateData : 
                             templateInputMode === 'file' ? parsedFileData : 
                             parsedUrlData;
  
  const requiresBulkConfirm = bulkReplaceMode !== 'none';

  // File upload handler
  const handleFileUpload = useCallback(async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    setTemplateFile(file);
    
    try {
      const text = await file.text();
      const parsed = file.name.toLowerCase().includes('.csv') ? parseCSVFile(text) : parseTemplateData(text);
      setParsedFileData(parsed);
    } catch (error) {
      if (showToast) showToast(t('Error reading file'), 'error');
      setParsedFileData([]);
    }
  }, [showToast, t]);

  // Google Sheets URL fetch handler
  const handleUrlFetch = useCallback(async () => {
    if (!templateUrl.trim()) return;
    
    setLoadingSheets(true);
    try {
      const parsed = await fetchGoogleSheetsData(templateUrl);
      setParsedUrlData(parsed);
      if (showToast) showToast(`✅ Załadowano ${parsed.length} produktów z Google Sheets!`, 'success');
    } catch (error) {
      console.error('Google Sheets error:', error);
      const errorMessage = error.message || 'Failed to load Google Sheets data';
      if (showToast) {
        if (errorMessage.includes('access denied') || errorMessage.includes('403')) {
          showToast('❌ Brak dostępu do arkusza. Ustaw udostępnianie na "Każdy, kto ma link, może przeglądać".', 'error');
        } else if (errorMessage.includes('empty')) {
          showToast('❌ Arkusz Google Sheets jest pusty lub nie ma danych.', 'error');
        } else {
          showToast(`❌ Błąd: ${errorMessage}`, 'error');
        }
      }
      setParsedUrlData([]);
    } finally {
      setLoadingSheets(false);
    }
  }, [templateUrl, showToast]);

  // Template import submit handler
  const handleTemplateImport = async (e) => {
    e.preventDefault();
    
    const dataToImport = currentTemplateData;
    if (dataToImport.length === 0) {
      if (showToast) showToast(t('No valid template data found.'), 'error');
      return;
    }

    if (requiresBulkConfirm && replacePinnedConfirm !== REPLACE_CONFIRM_TEXT) {
      if (showToast) showToast(t('Type REPLACE to confirm product replacement.'), 'error');
      return;
    }

    setBulkLoading(true);
    setBulkProgress({ total: dataToImport.length, current: 0, successes: 0, failures: 0, logs: [] });

    // Simulate progress updates with fake logs (estimated 500ms per product)
    const estimatedTimePerProduct = 500;
    
    const progressInterval = setInterval(() => {
      setBulkProgress(prev => {
        if (prev.current >= prev.total) {
          clearInterval(progressInterval);
          return prev;
        }
        
        const nextIndex = prev.current;
        const product = dataToImport[nextIndex];
        
        return {
          ...prev,
          current: Math.min(prev.current + 1, prev.total),
          logs: [...prev.logs, {
            status: 'processing',
            name: product?.name || `Product ${nextIndex + 1}`,
            message: '正在添加...' // "Adding..." in Chinese
          }]
        };
      });
    }, estimatedTimePerProduct);

    try {
      const res = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          products: dataToImport,
          replaceMode: bulkReplaceMode,
          confirm: requiresBulkConfirm ? REPLACE_CONFIRM_TEXT : undefined,
          batch: bulkBatch,
          category: bulkCategory !== 'auto' ? bulkCategory : undefined, // Only send category if not auto
          pin: false,
          startOrder: 1,
          concurrency: 4
        })
      });
      const data = await res.json();
      
      // Clear progress interval once we get response
      clearInterval(progressInterval);
      
      const logs = Array.isArray(data.results) ? data.results : [];

      setBulkProgress({
        total: data.total || dataToImport.length,
        current: logs.length || dataToImport.length,
        successes: data.successes || 0,
        failures: data.failures || 0,
        logs
      });

      if (!res.ok) {
        if (showToast) showToast(data.error || t('Failed to execute import.'), 'error');
        return;
      }

      const deletedMessage = data.deletedCount ? ` ${t('Deleted:')} ${data.deletedCount}.` : '';
      if (showToast) {
        showToast(
          `${t('Import completed. Added:')} ${data.created || 0}${t(', refreshed:')} ${data.updated || 0}${t(', errors:')} ${data.failures || 0}.${deletedMessage}`,
          data.failures > 0 ? 'error' : 'success'
        );
      }

      // Call completion callback
      if (onImportComplete) {
        onImportComplete(data);
      }
    } catch (err) {
      setBulkProgress((prev) => ({
        ...prev,
        current: prev.total,
        failures: prev.total,
        logs: [{ status: 'error', message: t('Server connection error') }]
      }));
      if (showToast) showToast(t('Server connection error during import.'), 'error');
    } finally {
      setBulkLoading(false);
    }
  };

  // Reset modal state
  const resetTemplateModal = useCallback(() => {
    setTemplateText('');
    setTemplateFile(null);
    setTemplateUrl('');
    setParsedFileData([]);
    setParsedUrlData([]);
    setTemplateInputMode('text');
    setLoadingSheets(false);
    setBulkProgress({ total: 0, current: 0, successes: 0, failures: 0, logs: [] });
    setReplacePinnedConfirm('');
  }, []);

  // Close handler with reset
  const handleClose = useCallback(() => {
    if (!bulkLoading) {
      resetTemplateModal();
      onClose();
    }
  }, [bulkLoading, resetTemplateModal, onClose]);

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.75)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      backdropFilter: 'blur(4px)'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
        padding: '24px',
        borderRadius: '12px',
        width: '90%',
        maxWidth: '680px',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5)',
        border: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0 }}>{t('Template Import')}</h2>
          <span 
            style={{ fontSize: '24px', cursor: 'pointer', opacity: bulkLoading ? 0.5 : 1, pointerEvents: bulkLoading ? 'none' : 'auto', color: 'rgba(255, 255, 255, 0.7)' }} 
            onClick={handleClose}
          >
            &times;
          </span>
        </div>
        
        <form onSubmit={handleTemplateImport}>
          {/* Input Mode Selection */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(255, 255, 255, 0.8)' }}>
              {t('Import Method')}
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <label style={{
                flex: 1,
                padding: '10px 16px',
                background: templateInputMode === 'text' ? 'rgba(167, 139, 250, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                border: templateInputMode === 'text' ? '1px solid #a78bfa' : '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                color: 'white',
                textAlign: 'center'
              }}>
                <input 
                  type="radio" 
                  name="templateInputMode" 
                  value="text" 
                  checked={templateInputMode === 'text'} 
                  onChange={(e) => setTemplateInputMode(e.target.value)} 
                  disabled={bulkLoading}
                  style={{ display: 'none' }}
                />
                <span>📝 {t('Paste Text')}</span>
              </label>
              <label style={{
                flex: 1,
                padding: '10px 16px',
                background: templateInputMode === 'file' ? 'rgba(167, 139, 250, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                border: templateInputMode === 'file' ? '1px solid #a78bfa' : '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                color: 'white',
                textAlign: 'center'
              }}>
                <input 
                  type="radio" 
                  name="templateInputMode" 
                  value="file" 
                  checked={templateInputMode === 'file'} 
                  onChange={(e) => setTemplateInputMode(e.target.value)} 
                  disabled={bulkLoading}
                  style={{ display: 'none' }}
                />
                <span>📁 {t('Upload File')}</span>
              </label>
              <label style={{
                flex: 1,
                padding: '10px 16px',
                background: templateInputMode === 'url' ? 'rgba(167, 139, 250, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                border: templateInputMode === 'url' ? '1px solid #a78bfa' : '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                color: 'white',
                textAlign: 'center'
              }}>
                <input 
                  type="radio" 
                  name="templateInputMode" 
                  value="url" 
                  checked={templateInputMode === 'url'} 
                  onChange={(e) => setTemplateInputMode(e.target.value)} 
                  disabled={bulkLoading}
                  style={{ display: 'none' }}
                />
                <span>🔗 {t('Google Sheets URL')}</span>
              </label>
            </div>
          </div>

          {/* Text Input Mode */}
          {templateInputMode === 'text' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '12px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(255, 255, 255, 0.8)' }}>
                {t('Product Data (Name + Link)')}
              </label>
              <textarea 
                placeholder={`${t('Paste copied data from spreadsheet:')}\nAJ1 High-1\thttps://weidian.com/item.html?itemID=123\nOG Batch Air Jordan\thttps://weidian.com/item.html?itemID=456`}
                value={templateText} 
                onChange={(e) => setTemplateText(e.target.value)} 
                required 
                disabled={bulkLoading}
                style={{ height: '120px', padding: '12px', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '6px', resize: 'vertical' }}
              />
              <span style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.6)', fontStyle: 'italic' }}>
                {templateData.length > 0 ? `${t('Detected')} ${templateData.length} ${t('products with names and links.')}` : t('Copy and paste data from Google Sheets (Ctrl+C, Ctrl+V). Each line should have: Name [TAB] Link')}
              </span>
            </div>
          )}

          {/* File Upload Mode */}
          {templateInputMode === 'file' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '12px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(255, 255, 255, 0.8)' }}>
                {t('Upload CSV/TXT File')}
              </label>
              <input 
                type="file" 
                accept=".csv,.txt,.tsv" 
                onChange={handleFileUpload}
                disabled={bulkLoading}
                style={{ padding: '8px', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '4px', width: '100%' }}
              />
              <span style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.6)', fontStyle: 'italic' }}>
                {parsedFileData.length > 0 ? `${t('Detected')} ${parsedFileData.length} ${t('products with names and links.')}` : t('Upload a CSV or TXT file with Name and Weidian Link columns')}
              </span>
            </div>
          )}

          {/* URL Input Mode */}
          {templateInputMode === 'url' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '12px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(255, 255, 255, 0.8)' }}>
                {t('Google Sheets URL')}
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input 
                  type="url"
                  placeholder="https://docs.google.com/spreadsheets/d/.../edit..."
                  value={templateUrl} 
                  onChange={(e) => setTemplateUrl(e.target.value)} 
                  disabled={bulkLoading || loadingSheets}
                  style={{ flex: 1, padding: '8px', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '4px' }}
                />
                <button 
                  type="button"
                  onClick={handleUrlFetch}
                  disabled={bulkLoading || loadingSheets || !templateUrl.trim()}
                  style={{ padding: '8px 16px', background: '#a78bfa', color: 'white', border: 'none', borderRadius: '4px', cursor: loadingSheets ? 'not-allowed' : 'pointer', opacity: (loadingSheets || !templateUrl.trim()) ? 0.5 : 1 }}
                >
                  {loadingSheets ? '⏳' : '🔄'}
                </button>
              </div>
              <span style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.6)', fontStyle: 'italic' }}>
                {parsedUrlData.length > 0 ? `${t('Detected')} ${parsedUrlData.length} ${t('products with names and links.')}` : t('Paste Google Sheets share URL (make sure it\'s public or viewable by anyone)')}
              </span>
            </div>
          )}

          <span style={{ fontSize: '11px', opacity: 0.7, fontStyle: 'italic', marginBottom: '12px', display: 'block', color: 'rgba(255, 255, 255, 0.6)' }}>
            {t('Names will be used as-is from your data. Links will be scraped for images and other details.')}
          </span>

          {/* Mode Selection */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(255, 255, 255, 0.8)' }}>{t('Mode')}</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <label style={{
                flex: 1,
                padding: '10px 16px',
                background: bulkReplaceMode === 'none' ? 'rgba(167, 139, 250, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                border: bulkReplaceMode === 'none' ? '1px solid #a78bfa' : '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                color: 'white',
                textAlign: 'center'
              }}>
                <input type="radio" name="templateReplaceMode" value="none" checked={bulkReplaceMode === 'none'} onChange={(e) => setBulkReplaceMode(e.target.value)} disabled={bulkLoading} style={{ display: 'none' }} />
                <span>{t('Add / Refresh')}</span>
              </label>
              <label style={{
                flex: 1,
                padding: '10px 16px',
                background: bulkReplaceMode === 'pinned' ? 'rgba(167, 139, 250, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                border: bulkReplaceMode === 'pinned' ? '1px solid #a78bfa' : '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                color: 'white',
                textAlign: 'center'
              }}>
                <input type="radio" name="templateReplaceMode" value="pinned" checked={bulkReplaceMode === 'pinned'} onChange={(e) => setBulkReplaceMode(e.target.value)} disabled={bulkLoading} style={{ display: 'none' }} />
                <span>{t('Replace Pinned')}</span>
              </label>
              <label style={{
                flex: 1,
                padding: '10px 16px',
                background: bulkReplaceMode === 'all' ? 'rgba(167, 139, 250, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                border: bulkReplaceMode === 'all' ? '1px solid #a78bfa' : '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                color: 'white',
                textAlign: 'center'
              }}>
                <input type="radio" name="templateReplaceMode" value="all" checked={bulkReplaceMode === 'all'} onChange={(e) => setBulkReplaceMode(e.target.value)} disabled={bulkLoading} style={{ display: 'none' }} />
                <span>{t('Replace All Catalog')}</span>
              </label>
            </div>
            {bulkReplaceMode === 'pinned' && (
              <div style={{ fontSize: '11px', color: '#fbbf24', fontStyle: 'italic' }}>
                {t('This will delete current pinned products after successfully fetching the entire new list.')}
              </div>
            )}
            {bulkReplaceMode === 'all' && (
              <div style={{ fontSize: '11px', color: '#ef4444', fontStyle: 'italic' }}>
                {t('This will delete all current products after successfully fetching the entire new list.')}
              </div>
            )}
          </div>

          {/* Batch Selection */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(255, 255, 255, 0.8)' }}>{t('Batch')}</label>
            <select 
              value={bulkBatch} 
              onChange={(e) => setBulkBatch(e.target.value)} 
              disabled={bulkLoading} 
              style={{ 
                padding: '8px', 
                background: 'rgba(255,255,255,0.05)', 
                color: 'white', 
                border: '1px solid rgba(255,255,255,0.2)', 
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              <option value="best" style={{ background: '#1a1a2e', color: 'white' }}>{t('Best')}</option>
              <option value="budget" style={{ background: '#1a1a2e', color: 'white' }}>{t('Budget')}</option>
              <option value="random" style={{ background: '#1a1a2e', color: 'white' }}>{t('Random')}</option>
              <option value="popular" style={{ background: '#1a1a2e', color: 'white' }}>{t('Popular')} 🔥</option>
            </select>
          </div>

          {/* Category Selection */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(255, 255, 255, 0.8)' }}>
              {t('Category')} <span style={{ fontSize: '11px', fontWeight: 400, color: 'rgba(255, 255, 255, 0.5)' }}>({t('for all products')})</span>
            </label>
            <select 
              value={bulkCategory} 
              onChange={(e) => setBulkCategory(e.target.value)} 
              disabled={bulkLoading} 
              style={{ 
                padding: '8px', 
                background: 'rgba(255,255,255,0.05)', 
                color: 'white', 
                border: '1px solid rgba(255,255,255,0.2)', 
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              <option value="auto" style={{ background: '#1a1a2e', color: 'white' }}>🤖 {t('Auto-detect (AI)')}</option>
              <option value="shoes" style={{ background: '#1a1a2e', color: 'white' }}>👟 {t('Shoes')}</option>
              <option value="hoodies" style={{ background: '#1a1a2e', color: 'white' }}>🧥 {t('Hoodies')}</option>
              <option value="t-shirts" style={{ background: '#1a1a2e', color: 'white' }}>👕 {t('T-Shirts')}</option>
              <option value="pants" style={{ background: '#1a1a2e', color: 'white' }}>👖 {t('Pants')}</option>
              <option value="shorts" style={{ background: '#1a1a2e', color: 'white' }}>🩳 {t('Shorts')}</option>
              <option value="jackets" style={{ background: '#1a1a2e', color: 'white' }}>🧥 {t('Jackets')}</option>
              <option value="sets" style={{ background: '#1a1a2e', color: 'white' }}>👔 {t('Sets')}</option>
              <option value="accessories" style={{ background: '#1a1a2e', color: 'white' }}>⌚ {t('Accessories')}</option>
            </select>
            {bulkCategory !== 'auto' && (
              <div style={{ fontSize: '11px', color: '#60a5fa', fontStyle: 'italic' }}>
                {t('All imported products will be categorized as')} <strong>{bulkCategory}</strong>
              </div>
            )}
          </div>

          {/* Confirmation Input for Replace Modes */}
          {requiresBulkConfirm && (
            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#ef4444', display: 'block', marginBottom: '5px' }}>
                {t('Type REPLACE')}
              </label>
              <input type="text" placeholder="REPLACE" value={replacePinnedConfirm} onChange={(e) => setReplacePinnedConfirm(e.target.value)} disabled={bulkLoading} style={{ width: '100%', padding: '8px', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid #ef4444', borderRadius: '4px' }} />
            </div>
          )}

          {/* Progress Display */}
          {bulkProgress.total > 0 && (
            <div style={{ marginBottom: '20px', padding: '20px', background: 'linear-gradient(135deg, rgba(100, 100, 100, 0.4) 0%, rgba(60, 60, 60, 0.5) 100%)', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.15)', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '15px', fontWeight: 'bold' }}>
                <span style={{ color: '#ffffff', fontSize: '16px' }}>
                  📦 {t('Processing:')} {bulkProgress.current} / {bulkProgress.total}
                </span>
                <div style={{ display: 'flex', gap: '16px' }}>
                  <span style={{ color: '#34d399', fontSize: '15px' }}>✓ {bulkProgress.successes}</span>
                  <span style={{ color: '#ef4444', fontSize: '15px' }}>✗ {bulkProgress.failures}</span>
                </div>
              </div>
              <div style={{ width: '100%', height: '12px', background: 'rgba(0,0,0,0.4)', borderRadius: '6px', overflow: 'hidden', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                <div style={{ width: `${(bulkProgress.current / bulkProgress.total) * 100}%`, height: '100%', background: 'linear-gradient(90deg, #a78bfa, #7c3aed, #6d28d9)', transition: 'width 0.3s ease', boxShadow: '0 0 10px rgba(167, 139, 250, 0.5)' }} />
              </div>
              {bulkProgress.logs.length > 0 && (
                <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '150px', overflow: 'auto' }}>
                  {bulkProgress.logs.slice(0, 8).map((log, index) => (
                    <div key={`${log.itemId || index}-${index}`} style={{ display: 'grid', gridTemplateColumns: '82px minmax(0, 1fr)', gap: '8px', fontSize: '13px', color: '#ffffff', padding: '4px 0' }}>
                      <span style={{ color: log.status === 'success' ? '#34d399' : log.status === 'error' ? '#ef4444' : log.status === 'processing' ? '#60a5fa' : '#fbbf24', fontWeight: 700 }}>
                        {log.status === 'success' ? (log.action || 'ok') : log.status === 'processing' ? '⏳' : log.status}
                      </span>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'rgba(255, 255, 255, 0.9)' }}>
                        {log.name || log.message || log.url}
                      </span>
                    </div>
                  ))}
                  {bulkProgress.logs.length > 8 && (
                    <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>
                      +{bulkProgress.logs.length - 8} {t('more results')}
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Submit Button */}
          <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
            <button 
              type="submit" 
              disabled={bulkLoading || currentTemplateData.length === 0} 
              style={{ 
                width: '100%',
                padding: '12px 24px',
                background: (bulkLoading || currentTemplateData.length === 0) ? 'rgba(167, 139, 250, 0.5)' : 'linear-gradient(135deg, #a78bfa, #7c3aed)',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: (bulkLoading || currentTemplateData.length === 0) ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: 600,
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                opacity: (bulkLoading || currentTemplateData.length === 0) ? 0.5 : 1
              }}
            >
              {bulkLoading ? <>{t('Adding...')}</> : t('Start Template Import')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
