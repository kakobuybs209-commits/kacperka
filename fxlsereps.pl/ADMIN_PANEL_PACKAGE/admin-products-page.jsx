'use client';

import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import styles from '@/styles/Admin.module.css';
import { detectCategory, PRODUCT_CATEGORIES } from '@/utils/categoryHelper';
import TemplateImportModal from '@/components/admin/TemplateImportModal';

const REPLACE_CONFIRM_TEXT = 'PODMIEN';

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

function extractWeidianUrls(text) {
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

const ProductTable = memo(function ProductTable({ 
  products, 
  onEdit, 
  onDelete, 
  selectedIds, 
  onSelectSingle, 
  onSelectAll, 
  isAllSelected,
  onUpdatePinnedOrder,
  onReorderPinned,
  isReordering,
  onImageClick,
  onNameDoubleClick,
  onNameSave
}) {
  const [draggingId, setDraggingId] = useState(null);
  const [dragOverId, setDragOverId] = useState(null);
  const [editingNameId, setEditingNameId] = useState(null);
  const [editingNameValue, setEditingNameValue] = useState('');

  const handleDragStart = useCallback((event, product) => {
    if (!product.isPinned || isReordering) {
      event.preventDefault();
      return;
    }

    setDraggingId(product._id);
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', product._id);
  }, [isReordering]);

  const handleDragOver = useCallback((event, product) => {
    if (!draggingId || !product.isPinned || draggingId === product._id) return;

    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    setDragOverId(product._id);
  }, [draggingId]);

  const handleDrop = useCallback((event, targetProduct) => {
    event.preventDefault();

    const draggedId = event.dataTransfer.getData('text/plain') || draggingId;
    setDraggingId(null);
    setDragOverId(null);

    if (!draggedId || !targetProduct.isPinned || draggedId === targetProduct._id) return;

    const fromIndex = products.findIndex(product => product._id === draggedId);
    const toIndex = products.findIndex(product => product._id === targetProduct._id);
    if (fromIndex < 0 || toIndex < 0) return;

    const reorderedProducts = [...products];
    const [draggedProduct] = reorderedProducts.splice(fromIndex, 1);
    reorderedProducts.splice(toIndex, 0, draggedProduct);
    onReorderPinned(reorderedProducts);
  }, [draggingId, onReorderPinned, products]);

  const handleDragEnd = useCallback(() => {
    setDraggingId(null);
    setDragOverId(null);
  }, []);

  if (products.length === 0) {
    return (
      <div className={styles.noProductsPlaceholder}>
        📭 Brak produktów spełniających podane kryteria.
      </div>
    );
  }

  return (
    <table className={styles.adminTable}>
      <thead>
        <tr>
          <th style={{ width: '36px', textAlign: 'center' }}></th>
          <th style={{ width: '40px', textAlign: 'center' }}>
            <label className={styles.checkboxContainer}>
              <input 
                type="checkbox" 
                checked={isAllSelected} 
                onChange={onSelectAll} 
              />
              <span className={styles.checkboxCustom}></span>
            </label>
          </th>
          <th>Zdjęcie</th>
          <th>Nazwa</th>
          <th>Cena</th>
          <th>Kategoria</th>
          <th>Batch</th>
          <th>Kliknięcia</th>
          <th>Przypięty</th>
          <th>Akcje</th>
        </tr>
      </thead>
      <tbody>
        {products.map(product => {
          const isSelected = selectedIds.includes(product._id);
          const canDrag = product.isPinned && !isReordering;
          const rowClasses = [
            isSelected ? styles.selectedRow : '',
            canDrag ? styles.draggableRow : '',
            draggingId === product._id ? styles.draggingRow : '',
            dragOverId === product._id ? styles.dragOverRow : ''
          ].filter(Boolean).join(' ');

          return (
            <tr
              key={product._id}
              className={rowClasses}
              onDragOver={(event) => handleDragOver(event, product)}
              onDrop={(event) => handleDrop(event, product)}
              onDragLeave={() => setDragOverId(current => current === product._id ? null : current)}
            >
              <td style={{ textAlign: 'center' }}>
                <button
                  type="button"
                  className={styles.dragHandle}
                  draggable={canDrag}
                  disabled={!canDrag}
                  onDragStart={(event) => handleDragStart(event, product)}
                  onDragEnd={handleDragEnd}
                  title={product.isPinned ? "Drag to reorder" : "Pin the product first"}
                >
                  ::
                </button>
              </td>
              <td style={{ textAlign: 'center' }}>
                <label className={styles.checkboxContainer}>
                  <input 
                    type="checkbox" 
                    checked={isSelected} 
                    onChange={() => onSelectSingle(product._id)} 
                  />
                  <span className={styles.checkboxCustom}></span>
                </label>
              </td>
              <td>
                <div className={styles.tableImgContainer} onClick={() => onImageClick(product.image)} style={{ cursor: 'pointer' }}>
                  <img src={product.image} alt="" className={styles.tableImg} />
                </div>
              </td>
              <td 
                className={styles.productNameCell} 
                title={product.name}
                onDoubleClick={() => {
                  setEditingNameId(product._id);
                  setEditingNameValue(product.name);
                }}
                style={{ cursor: editingNameId === product._id ? 'text' : 'default' }}
              >
                {editingNameId === product._id ? (
                  <input
                    type="text"
                    value={editingNameValue}
                    onChange={(e) => setEditingNameValue(e.target.value)}
                    onBlur={() => {
                      if (editingNameValue.trim() !== product.name) {
                        onNameSave(product._id, editingNameValue.trim());
                      }
                      setEditingNameId(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        if (editingNameValue.trim() !== product.name) {
                          onNameSave(product._id, editingNameValue.trim());
                        }
                        setEditingNameId(null);
                      } else if (e.key === 'Escape') {
                        setEditingNameId(null);
                      }
                    }}
                    autoFocus
                    style={{
                      width: '100%',
                      padding: '4px 8px',
                      background: 'rgba(255,255,255,0.1)',
                      border: '1px solid #a78bfa',
                      borderRadius: '4px',
                      color: 'white',
                      fontSize: '13px'
                    }}
                  />
                ) : (
                  product.name
                )}
              </td>
              <td className={styles.priceCell}>${product.price}</td>
              <td>
                <span className={`${styles.badge} ${styles.categoryBadge}`}>{product.category}</span>
              </td>
              <td>
                <span className={`${styles.badge} ${styles.batchBadge} ${styles[`batchBadge_${product.batch}`]}`}>
                  {product.batch}
                </span>
              </td>
              <td className={styles.clicksCell}>📊 {product.clicks || 0}</td>
              <td>
                {product.isPinned ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span className={styles.pinnedBadge} style={{ padding: '4px 8px' }}>📌</span>
                    <input 
                      type="number" 
                      defaultValue={product.pinnedOrder !== 999999 ? product.pinnedOrder : ''}
                      onBlur={(e) => onUpdatePinnedOrder(product._id, e.target.value)}
                      style={{ width: '50px', padding: '2px 4px', fontSize: '12px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', borderRadius: '4px' }}
                      title="Kolejność (niższy = wyżej)"
                      placeholder="Auto"
                    />
                  </div>
                ) : (
                  <span className={styles.unpinnedBadge}>Nie</span>
                )}
              </td>
              <td className={styles.actions}>
                <button className={styles.editBtn} onClick={() => onEdit(product)}>Edit</button>
                <button className={styles.deleteBtn} onClick={() => onDelete(product._id)}>Delete</button>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
});

export default function ManageProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showScraperModal, setShowScraperModal] = useState(false);
  const [scraperLoading, setScraperLoading] = useState(false);
  const [scraperStatus, setScraperStatus] = useState({ type: '', message: '' });
  const [scraperData, setScraperData] = useState({ name: '', url: '' });
  const [showBulkScraperModal, setShowBulkScraperModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [bulkText, setBulkText] = useState('');
  
  // Backup/Restore state
  const [backupData, setBackupData] = useState(null);
  const [backupLoading, setBackupLoading] = useState(false);
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ total: 0, current: 0, successes: 0, failures: 0, logs: [] });
  const [bulkReplaceMode, setBulkReplaceMode] = useState('none');
  const [bulkBatch, setBulkBatch] = useState('best');
  const [replacePinnedConfirm, setReplacePinnedConfirm] = useState('');
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    image: '',
    category: 'shoes',
    batch: 'best',
    link: '',
    isPinned: false,
    pinnedOrder: '',
    qcImages: []
  });
  const [qcUploadLoading, setQcUploadLoading] = useState(false);
  const [qcScrapeUrl, setQcScrapeUrl] = useState('');
  const [qcScrapeLoading, setQcScrapeLoading] = useState(false);
  const [selectedQcIndices, setSelectedQcIndices] = useState([]);
  const [bulkColorwayText, setBulkColorwayText] = useState('');
  
  // Lightbox state
  const [lightboxImage, setLightboxImage] = useState(null);
  
  // Custom alerts and confirmations
  const [toasts, setToasts] = useState([]);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: null });

  // Pagination, search & advanced filters
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [totalProducts, setTotalProducts] = useState(0);
  
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterBatch, setFilterBatch] = useState('all');
  const [filterPinned, setFilterPinned] = useState('all');
  const [sortBy, setSortBy] = useState('pinned_order');
  const [isReordering, setIsReordering] = useState(false);

  // Bulk actions selection
  const [selectedIds, setSelectedIds] = useState([]);
  const bulkUrls = useMemo(() => extractWeidianUrls(bulkText), [bulkText]);
  const requiresBulkConfirm = bulkReplaceMode !== 'none';

  // Toast Helper
  const showToast = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  // Confirmation dialog helper
  const askConfirmation = useCallback((title, message, onConfirm) => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      onConfirm: () => {
        onConfirm();
        setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: null });
      }
    });
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm.trim());
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const fetchProducts = useCallback(async (page = 1, search = debouncedSearchTerm, signal) => {
    try {
      setLoading(true);
      const searchParam = search.trim();
      let url = `/api/products?page=${page}&limit=50&admin=true`;
      
      if (searchParam) url += `&search=${encodeURIComponent(searchParam)}`;
      if (filterCategory !== 'all') url += `&category=${encodeURIComponent(filterCategory)}`;
      if (filterBatch !== 'all') url += `&batch=${encodeURIComponent(filterBatch)}`;
      if (filterPinned !== 'all') url += `&pinned=${encodeURIComponent(filterPinned)}`;
      if (sortBy) url += `&sort=${encodeURIComponent(sortBy)}`;

      const res = await fetch(url, { signal });
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();

      if (signal?.aborted) return;
      
      if (data.products) {
        setProducts(data.products);
        setTotalPages(data.pages);
        setCurrentPage(data.page);
        setTotalProducts(data.total);
      } else {
        setProducts(data);
      }
    } catch (err) {
      if (err.name === 'AbortError') return;
      console.error(err);
      showToast("Błąd pobierania produktów. Sprawdź połączenie z bazą.", "error");
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [debouncedSearchTerm, filterCategory, filterBatch, filterPinned, sortBy, showToast]);

  useEffect(() => {
    const controller = new AbortController();
    fetchProducts(1, debouncedSearchTerm, controller.signal);
    return () => controller.abort();
  }, [debouncedSearchTerm, filterCategory, filterBatch, filterPinned, sortBy, fetchProducts]);

  // Handle inline pin order update
  const handleUpdatePinnedOrder = useCallback(async (id, newValue) => {
    const val = newValue.trim() === '' ? 999999 : parseInt(newValue, 10);
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pinnedOrder: val })
      });
      if (res.ok) {
        showToast('Zaktualizowano kolejność!', 'success');
        fetchProducts(currentPage);
      } else {
        showToast('Błąd aktualizacji kolejności.', 'error');
      }
    } catch (err) {
      showToast('Błąd połączenia.', 'error');
    }
  }, [currentPage, fetchProducts, showToast]);

  const handleReorderPinned = useCallback(async (reorderedProducts) => {
    const pinnedProducts = reorderedProducts.filter(product => product.isPinned);
    if (pinnedProducts.length < 2) return;

    setProducts(reorderedProducts);
    setIsReordering(true);

    try {
      const res = await fetch('/api/products', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reorder: pinnedProducts.map((product, index) => ({
            id: product._id,
            pinnedOrder: index + 1
          }))
        })
      });

      if (res.ok) {
        showToast('Zaktualizowano kolejnoĹ›Ä‡ przypiÄ™tych produktĂłw!', 'success');
        fetchProducts(currentPage);
      } else {
        showToast('BĹ‚Ä…d zapisu kolejnoĹ›ci.', 'error');
        fetchProducts(currentPage);
      }
    } catch (err) {
      showToast('BĹ‚Ä…d poĹ‚Ä…czenia przy zapisie kolejnoĹ›ci.', 'error');
      fetchProducts(currentPage);
    } finally {
      setIsReordering(false);
    }
  }, [currentPage, fetchProducts, showToast]);

  // Handle single selection toggling
  const handleSelectSingle = useCallback((id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  }, []);

  // Handle select all toggling on current page
  const isAllSelected = products.length > 0 && products.every(p => selectedIds.includes(p._id));
  
  const handleSelectAll = useCallback(() => {
    const pageIds = products.map(p => p._id);
    if (isAllSelected) {
      setSelectedIds(prev => prev.filter(id => !pageIds.includes(id)));
    } else {
      setSelectedIds(prev => {
        const union = [...prev];
        pageIds.forEach(id => {
          if (!union.includes(id)) union.push(id);
        });
        return union;
      });
    }
  }, [products, isAllSelected]);

  // Bulk actions API calls
  const handleBulkDelete = useCallback(() => {
    askConfirmation(
      'Potwierdź masowe usunięcie',
      `Czy na pewno chcesz trwale usunąć ${selectedIds.length} zaznaczonych produktów? Tej operacji nie można cofnąć!`,
      async () => {
        try {
          const res = await fetch('/api/products', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ids: selectedIds })
          });
          const data = await res.json();
          if (res.ok) {
            showToast(`Pomyślnie usunięto ${data.deletedCount} produktów!`, 'success');
            setSelectedIds([]);
            fetchProducts(currentPage);
          } else {
            showToast(data.error || 'Wystąpił błąd podczas usuwania.', 'error');
          }
        } catch (err) {
          showToast('Błąd połączenia z serwerem.', 'error');
        }
      }
    );
  }, [selectedIds, currentPage, fetchProducts, showToast, askConfirmation]);

  const handleBulkCategoryChange = useCallback((category) => {
    askConfirmation(
      'Zmień kategorię dla wielu produktów',
      `Czy na pewno chcesz zmienić kategorię dla ${selectedIds.length} produktów na "${category}"?`,
      async () => {
        try {
          const res = await fetch('/api/products', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ids: selectedIds, update: { category } })
          });
          const data = await res.json();
          if (res.ok) {
            showToast(`Pomyślnie zmieniono kategorię dla ${data.modifiedCount} produktów!`, 'success');
            setSelectedIds([]);
            fetchProducts(currentPage);
          } else {
            showToast(data.error || 'Wystąpił błąd podczas aktualizacji.', 'error');
          }
        } catch (err) {
          showToast('Błąd połączenia z serwerem.', 'error');
        }
      }
    );
  }, [selectedIds, currentPage, fetchProducts, showToast, askConfirmation]);

  const handleBulkBatchChange = useCallback((batch) => {
    askConfirmation(
      'Zmień batch dla wielu produktów',
      `Czy na pewno chcesz zmienić batch dla ${selectedIds.length} produktów na "${batch}"?`,
      async () => {
        try {
          const res = await fetch('/api/products', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ids: selectedIds, update: { batch } })
          });
          const data = await res.json();
          if (res.ok) {
            showToast(`Pomyślnie zmieniono tag batch dla ${data.modifiedCount} produktów!`, 'success');
            setSelectedIds([]);
            fetchProducts(currentPage);
          } else {
            showToast(data.error || 'Wystąpił błąd podczas aktualizacji.', 'error');
          }
        } catch (err) {
          showToast('Błąd połączenia z serwerem.', 'error');
        }
      }
    );
  }, [selectedIds, currentPage, fetchProducts, showToast, askConfirmation]);

  const handleBulkPinChange = useCallback((isPinned) => {
    askConfirmation(
      isPinned ? 'Masowe przypinanie' : 'Masowe odpinanie',
      `Czy chcesz ${isPinned ? 'przypiąć' : 'odpiąć'} ${selectedIds.length} zaznaczonych produktów?`,
      async () => {
        try {
          const res = await fetch('/api/products', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ids: selectedIds, update: { isPinned } })
          });
          const data = await res.json();
          if (res.ok) {
            showToast(`Pomyślnie ${isPinned ? 'przypięto' : 'odpięto'} ${data.modifiedCount} produktów!`, 'success');
            setSelectedIds([]);
            fetchProducts(currentPage);
          } else {
            showToast(data.error || 'Wystąpił błąd podczas aktualizacji.', 'error');
          }
        } catch (err) {
          showToast('Błąd połączenia z serwerem.', 'error');
        }
      }
    );
  }, [selectedIds, currentPage, fetchProducts, showToast, askConfirmation]);

  const handleScrape = async (e) => {
    e.preventDefault();
    setScraperLoading(true);
    setScraperStatus({ type: '', message: '' });

    try {
      const res = await fetch('/api/admin/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scraperData)
      });

      const data = await res.json();

      if (res.ok) {
        setScraperStatus({ type: 'success', message: data.message });
        setScraperData({ name: '', url: '' });
        showToast('Dodano produkt ze scrapowania!', 'success');
        fetchProducts(currentPage);
        setTimeout(() => setShowScraperModal(false), 2000);
      } else {
        setScraperStatus({ type: 'error', message: data.error || 'Wystąpił błąd podczas scrapowania.' });
      }
    } catch (err) {
      setScraperStatus({ type: 'error', message: 'Błąd połączenia z serwerem.' });
    } finally {
      setScraperLoading(false);
    }
  };

  const handleBulkScrape = async (e) => {
    e.preventDefault();
    if (!bulkText.trim()) return;

    if (bulkUrls.length === 0) {
      showToast('Nie znaleziono prawidłowych linków do Weidian w tekście.', 'error');
      return;
    }

    if (requiresBulkConfirm && replacePinnedConfirm !== REPLACE_CONFIRM_TEXT) {
      showToast('Wpisz PODMIEN, zeby potwierdzic podmiane produktow.', 'error');
      return;
    }

    setBulkLoading(true);
    setBulkProgress({ total: bulkUrls.length, current: 0, successes: 0, failures: 0, logs: [] });

    try {
      const res = await fetch('/api/admin/scrape/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          urls: bulkUrls,
          replaceMode: bulkReplaceMode,
          confirm: requiresBulkConfirm ? REPLACE_CONFIRM_TEXT : undefined,
          batch: bulkBatch,
          pin: true,
          startOrder: 1,
          concurrency: 4
        })
      });
      const data = await res.json();
      const logs = Array.isArray(data.results) ? data.results : [];

      setBulkProgress({
        total: data.total || bulkUrls.length,
        current: logs.length || bulkUrls.length,
        successes: data.successes || 0,
        failures: data.failures || 0,
        logs
      });

      if (!res.ok) {
        showToast(data.error || 'Nie udalo sie wykonac importu.', 'error');
        return;
      }

      const deletedMessage = data.deletedCount ? ` Usunieto: ${data.deletedCount}.` : '';
      showToast(
        `Import zakonczony. Dodano: ${data.created || 0}, odswiezono: ${data.updated || 0}, bledy: ${data.failures || 0}.${deletedMessage}`,
        data.failures > 0 ? 'error' : 'success'
      );

      if ((data.successes || 0) > 0 || data.deletedCount > 0) {
        setSelectedIds([]);
        setSortBy('pinned_order');
        fetchProducts(1);
      }
    } catch (err) {
      setBulkProgress((prev) => ({
        ...prev,
        current: prev.total,
        failures: prev.total,
        logs: [{ status: 'error', message: 'Blad polaczenia z serwerem' }]
      }));
      showToast('Blad polaczenia z serwerem podczas importu.', 'error');
    } finally {
      setBulkLoading(false);
    }
  };

  const handleQcUpload = async (file) => {
    if (!file) return;
    setQcUploadLoading(true);
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: fd
      });
      const data = await res.json();
      if (res.ok && data.url) {
        setFormData(prev => ({
          ...prev,
          qcImages: [...prev.qcImages, { url: data.url, colorway: 'Default' }]
        }));
        showToast('Dodano zdjęcie QC!', 'success');
      } else {
        showToast(data.error || 'Błąd wgrywania zdjęcia', 'error');
      }
    } catch (err) {
      showToast('Błąd połączenia z serwerem', 'error');
    } finally {
      setQcUploadLoading(false);
    }
  };

  const removeQcImage = (index) => {
    setFormData(prev => {
      const newQc = [...prev.qcImages];
      newQc.splice(index, 1);
      return { ...prev, qcImages: newQc };
    });
  };

  const handleQcScrape = async () => {
    const urlToScrape = qcScrapeUrl.trim() || formData.link?.trim();
    if (!urlToScrape) {
      showToast('Wklej link lub wypełnij główny link produktu', 'error');
      return;
    }
    setQcScrapeLoading(true);
    try {
      const res = await fetch(`/api/qc?url=${encodeURIComponent(urlToScrape)}`);
      const data = await res.json();
      if (res.ok && data.albums?.length > 0) {
        const newImages = [];
        data.albums.forEach(album => {
          let colorwayName = album.colorway || album.color || album.name || album.title || album.variant || 'Default';
          if (colorwayName && typeof colorwayName === 'object') {
            colorwayName = colorwayName.name || colorwayName.title || colorwayName.value || 'Default';
          }
          const albumImgs = album.images || [];
          albumImgs.forEach(url => {
            newImages.push({
              url,
              colorway: colorwayName,
              addedAt: new Date()
            });
          });
        });
        
        if (newImages.length > 0) {
          setFormData(prev => ({
            ...prev,
            qcImages: [...(prev.qcImages || []), ...newImages]
          }));
          setQcScrapeUrl('');
          showToast(`Pobrano ${newImages.length} zdjęć QC!`, 'success');
        } else {
          showToast('Brak zdjęć w pobranym QC', 'error');
        }
      } else {
        showToast(data.error || 'Nie znaleziono zdjęć QC pod tym linkiem', 'error');
      }
    } catch (err) {
      showToast('Błąd pobierania QC', 'error');
    } finally {
      setQcScrapeLoading(false);
    }
  };

  const handleBulkAssignColorway = () => {
    if (selectedQcIndices.length === 0) {
      showToast('Zaznacz przynajmniej jedno zdjęcie (klikając na nie)', 'error');
      return;
    }
    const text = bulkColorwayText.trim();
    if (!text) {
      showToast('Wpisz nazwę kolorystyki', 'error');
      return;
    }
    setFormData(prev => {
      const newQc = [...prev.qcImages];
      selectedQcIndices.forEach(idx => {
        if (newQc[idx]) {
          newQc[idx] = { ...newQc[idx], colorway: text };
        }
      });
      return { ...prev, qcImages: newQc };
    });
    setSelectedQcIndices([]);
    setBulkColorwayText('');
    showToast(`Przypisano kolorystykę "${text}" do ${selectedQcIndices.length} zdjęć!`, 'success');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const method = editingProduct ? 'PUT' : 'POST';
    const url = editingProduct ? `/api/products/${editingProduct._id}` : '/api/products';

    const payload = {
      ...formData,
      isPinned: formData.isPinned,
      pinnedOrder: formData.isPinned && formData.pinnedOrder !== '' ? parseInt(formData.pinnedOrder, 10) : 999999
    };

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      showToast(editingProduct ? 'Produkt został pomyślnie zaktualizowany!' : 'Nowy produkt został dodany!', 'success');
      fetchProducts(currentPage);
      setShowModal(false);
      setEditingProduct(null);
      setFormData({ name: '', price: '', image: '', category: 'shoes', batch: 'best', link: '', isPinned: false, pinnedOrder: '', qcImages: [] });
      setQcScrapeUrl('');
      setSelectedQcIndices([]);
      setBulkColorwayText('');
    } else {
      showToast('Coś poszło nie tak podczas zapisywania produktu.', 'error');
    }
  };

  const handleDelete = useCallback((id) => {
    askConfirmation(
      'Usuwanie produktu',
      'Czy na pewno chcesz usunąć ten produkt? Tej akcji nie można cofnąć.',
      async () => {
        const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
        if (res.ok) {
          showToast('Produkt został pomyślnie usunięty.', 'success');
          setSelectedIds(prev => prev.filter(x => x !== id));
          fetchProducts(currentPage);
        } else {
          showToast('Wystąpił błąd przy usuwaniu produktu.', 'error');
        }
      }
    );
  }, [currentPage, fetchProducts, showToast, askConfirmation]);

  const openEdit = useCallback((product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      price: product.price,
      image: product.image,
      category: product.category,
      batch: product.batch,
      link: product.link,
      isPinned: product.isPinned || false,
      pinnedOrder: product.pinnedOrder !== null && product.pinnedOrder !== undefined ? String(product.pinnedOrder) : '',
      qcImages: product.qcImages || []
    });
    setSelectedQcIndices([]);
    setBulkColorwayText('');
    setShowModal(true);
  }, []);

  const handleImageClick = useCallback((imageUrl) => {
    setLightboxImage(imageUrl);
  }, []);

  const handleNameSave = useCallback(async (productId, newName) => {
    if (!newName.trim()) {
      showToast('Nazwa nie może być pusta', 'error');
      return;
    }
    
    try {
      const newCategory = detectCategory(newName);
      const res = await fetch(`/api/products/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName, category: newCategory })
      });
      
      if (res.ok) {
        showToast('Nazwa i kategoria zaktualizowane!', 'success');
        fetchProducts(currentPage);
      } else {
        showToast('Błąd aktualizacji nazwy.', 'error');
      }
    } catch (err) {
      showToast('Błąd połączenia.', 'error');
    }
  }, [currentPage, fetchProducts, showToast]);

  // Backup & Delete All Products
  const handleBackupAndDeleteAll = useCallback(() => {
    askConfirmation(
      '⚠️ Backup i Usuń Wszystkie Produkty',
      'Ta operacja utworzy backup przypiętych produktów, a następnie USUNIE WSZYSTKIE produkty z bazy danych. Czy jesteś pewien?',
      async () => {
        setBackupLoading(true);
        try {
          const res = await fetch('/api/admin/backup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
          });
          const data = await res.json();

          if (res.ok) {
            // Store backup in localStorage
            localStorage.setItem('productsBackup', JSON.stringify(data.backup));
            localStorage.setItem('productsBackupDate', new Date().toISOString());
            setBackupData(data.backup);
            
            showToast(
              `✅ Backup utworzony! Przypięte produkty: ${data.backup.length}. Usunięte: ${data.deletedCount}.`,
              'success'
            );
            fetchProducts(1);
          } else {
            showToast(data.error || 'Błąd podczas tworzenia backupu.', 'error');
          }
        } catch (err) {
          showToast('Błąd połączenia z serwerem.', 'error');
        } finally {
          setBackupLoading(false);
        }
      }
    );
  }, [askConfirmation, showToast, fetchProducts]);

  // Restore Pinned Products from Backup
  const handleRestorePinned = useCallback(() => {
    const storedBackup = localStorage.getItem('productsBackup');
    const backupDate = localStorage.getItem('productsBackupDate');
    
    if (!storedBackup) {
      showToast('Brak dostępnego backupu. Najpierw wykonaj backup.', 'error');
      return;
    }

    const backup = JSON.parse(storedBackup);
    const formattedDate = backupDate ? new Date(backupDate).toLocaleString('pl-PL') : 'nieznana data';
    
    askConfirmation(
      '🔄 Przywróć Przypięte Produkty',
      `Czy chcesz przywrócić ${backup.length} przypiętych produktów z backupu (utworzony: ${formattedDate})?`,
      async () => {
        setRestoreLoading(true);
        try {
          const res = await fetch('/api/admin/restore', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ backup })
          });
          const data = await res.json();

          if (res.ok) {
            showToast(`✅ Przywrócono ${data.restoredCount} przypiętych produktów!`, 'success');
            fetchProducts(1);
          } else {
            showToast(data.error || 'Błąd podczas przywracania produktów.', 'error');
          }
        } catch (err) {
          showToast('Błąd połączenia z serwerem.', 'error');
        } finally {
          setRestoreLoading(false);
        }
      }
    );
  }, [askConfirmation, showToast, fetchProducts]);

  // Check for existing backup on mount
  useEffect(() => {
    const storedBackup = localStorage.getItem('productsBackup');
    if (storedBackup) {
      try {
        setBackupData(JSON.parse(storedBackup));
      } catch (err) {
        console.error('Invalid backup data in localStorage');
      }
    }
  }, []);

  return (
    <div className={styles.adminContainer}>
      <header className={styles.adminHeader}>
        <h1>Manage Products</h1>
        <div className={styles.adminNav}>
          <input 
            type="text" 
            placeholder="Szukaj produktów..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.adminSearch}
          />
          <button className={styles.scraperBtn} onClick={() => setShowScraperModal(true)}>
            🚀 Add via Scraper
          </button>
          <button className={styles.scraperBtn} onClick={() => {
            setBulkProgress({ total: 0, current: 0, successes: 0, failures: 0, logs: [] });
            setShowBulkScraperModal(true);
          }}>
            Bulk Import
          </button>
          <button className={styles.scraperBtn} onClick={() => setShowTemplateModal(true)} style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
            📋 Template Import
          </button>
          <button 
            className={styles.scraperBtn} 
            onClick={handleBackupAndDeleteAll}
            disabled={backupLoading}
            style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)', opacity: backupLoading ? 0.5 : 1 }}
            title="Tworzy backup przypiętych produktów i usuwa wszystkie produkty"
          >
            {backupLoading ? '⏳ Przetwarzanie...' : '💾 Backup & Delete All'}
          </button>
          {backupData && (
            <button 
              className={styles.scraperBtn} 
              onClick={handleRestorePinned}
              disabled={restoreLoading}
              style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', opacity: restoreLoading ? 0.5 : 1 }}
              title={`Przywraca ${backupData.length} przypiętych produktów z backupu`}
            >
              {restoreLoading ? '⏳ Przywracanie...' : `🔄 Restore ${backupData.length} Pinned`}
            </button>
          )}
          <button className={styles.navLink} onClick={() => {
            setEditingProduct(null);
            setFormData({ name: '', price: '', image: '', category: 'shoes', batch: 'best', link: '', isPinned: false, pinnedOrder: '', qcImages: [] });
            setSelectedQcIndices([]);
            setQcScrapeUrl('');
            setBulkColorwayText('');
            setShowModal(true);
          }}>
            + Add Manually
          </button>
        </div>
      </header>

      {/* Advanced Filters Section */}
      <div className={styles.advancedFiltersCard}>
        <div className={styles.filterSection}>
          <span className={styles.filterLabel}>Kategoria:</span>
          <div className={styles.filterPills}>
            <button 
              className={`${styles.filterPill} ${filterCategory === 'all' ? styles.filterPillActive : ''}`} 
              onClick={() => setFilterCategory('all')}
            >
              Wszystkie
            </button>
            {PRODUCT_CATEGORIES.map(cat => (
              <button 
                key={cat} 
                className={`${styles.filterPill} ${filterCategory === cat ? styles.filterPillActive : ''}`} 
                onClick={() => setFilterCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.filterSection}>
          <span className={styles.filterLabel}>Batch tag:</span>
          <div className={styles.filterPills}>
            {['all', 'best', 'budget', 'random'].map(batch => (
              <button 
                key={batch} 
                className={`${styles.filterPill} ${filterBatch === batch ? styles.filterPillActive : ''}`} 
                onClick={() => setFilterBatch(batch)}
              >
                {batch === 'all' ? 'Wszystkie' : batch}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.filtersBottomRow}>
          <div className={styles.filterSectionInline}>
            <span className={styles.filterLabel}>Status:</span>
            <div className={styles.filterPills}>
              {[
                { label: 'Wszystkie', value: 'all' },
                { label: '📌 Przypięte', value: 'true' },
                { label: '📍 Zwykłe', value: 'false' }
              ].map(opt => (
                <button 
                  key={opt.value} 
                  className={`${styles.filterPill} ${filterPinned === opt.value ? styles.filterPillActive : ''}`} 
                  onClick={() => setFilterPinned(opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.filterSectionInline}>
            <span className={styles.filterLabel}>Sortowanie:</span>
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
              className={styles.sortSelect}
            >
              <option value="pinned_order">Kolejnosc przypietych</option>
              <option value="newest">Najnowsze</option>
              <option value="oldest">Najstarsze</option>
              <option value="price_asc">Cena: rosnąco</option>
              <option value="price_desc">Cena: malejąco</option>
              <option value="clicks_desc">Najpopularniejsze (kliknięcia)</option>
            </select>
          </div>
        </div>
      </div>

      <div style={{ marginBottom: '20px', opacity: 0.8, fontSize: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>Znaleziono produktów: <strong>{totalProducts}</strong></span>
        {selectedIds.length > 0 && (
          <span style={{ color: '#a78bfa' }}>Zaznaczono: <strong>{selectedIds.length}</strong></span>
        )}
      </div>

      {loading ? (
        <div className={styles.spinnerContainer}>
          <div className={styles.loadingSpinner}></div>
          <p style={{ marginTop: '10px' }}>Wczytywanie...</p>
        </div>
      ) : (
        <div className={styles.tableWrapper}>
          <ProductTable 
            products={products} 
            onEdit={openEdit} 
            onDelete={handleDelete}
            selectedIds={selectedIds}
            onSelectSingle={handleSelectSingle}
            onSelectAll={handleSelectAll}
            isAllSelected={isAllSelected}
            onUpdatePinnedOrder={handleUpdatePinnedOrder}
            onReorderPinned={handleReorderPinned}
            isReordering={isReordering}
            onImageClick={handleImageClick}
            onNameDoubleClick={() => {}}
            onNameSave={handleNameSave}
          />
        </div>
      )}

      {!loading && totalPages > 1 && (
        <div className={styles.pagination} style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '30px', alignItems: 'center' }}>
          <button 
            onClick={() => fetchProducts(currentPage - 1)} 
            disabled={currentPage === 1}
            style={{ padding: '8px 15px', borderRadius: '5px', background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none', cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
          >
            Poprzednia
          </button>
          <span style={{ color: 'white' }}>Strona {currentPage} z {totalPages}</span>
          <button 
            onClick={() => fetchProducts(currentPage + 1)} 
            disabled={currentPage === totalPages}
            style={{ padding: '8px 15px', borderRadius: '5px', background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}
          >
            Następna
          </button>
        </div>
      )}

      {/* Floating Bulk Actions Bar */}
      {selectedIds.length > 0 && (
        <div className={styles.bulkBar}>
          <div className={styles.bulkBarInner}>
            <div className={styles.bulkCount}>
              <span>⚡ Wybrano <strong>{selectedIds.length}</strong> produktów</span>
            </div>
            
            <div className={styles.bulkActions}>
              <div className={styles.bulkActionGroup}>
                <select 
                  onChange={(e) => {
                    if (e.target.value) {
                      handleBulkCategoryChange(e.target.value);
                      e.target.value = '';
                    }
                  }}
                  defaultValue=""
                  className={styles.bulkSelect}
                >
                  <option value="" disabled>Zmień kategorię...</option>
                  {PRODUCT_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className={styles.bulkActionGroup}>
                <select 
                  onChange={(e) => {
                    if (e.target.value) {
                      handleBulkBatchChange(e.target.value);
                      e.target.value = '';
                    }
                  }}
                  defaultValue=""
                  className={styles.bulkSelect}
                >
                  <option value="" disabled>Zmień batch...</option>
                  <option value="best">Best</option>
                  <option value="budget">Budget</option>
                  <option value="random">Random</option>
                </select>
              </div>

              <div className={styles.bulkActionGroup}>
                <button 
                  className={styles.bulkPinBtn} 
                  onClick={() => handleBulkPinChange(true)}
                >
                  📌 Przypnij
                </button>
                <button 
                  className={styles.bulkUnpinBtn} 
                  onClick={() => handleBulkPinChange(false)}
                >
                  📍 Odepnij
                </button>
              </div>

              <button 
                className={styles.bulkDeleteBtn} 
                onClick={handleBulkDelete}
              >
                🗑️ Usuń zaznaczone
              </button>
              
              <button 
                className={styles.bulkCancelBtn} 
                onClick={() => setSelectedIds([])}
              >
                Anuluj
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Add/Edit Modal */}
      {showModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.adminModal}>
            <h2>{editingProduct ? 'Edit Product' : 'Add Product'}</h2>
            <form onSubmit={handleSubmit}>
              <input 
                type="text" 
                placeholder="Name" 
                value={formData.name} 
                onChange={(e) => {
                  const name = e.target.value;
                  setFormData({
                    ...formData,
                    name,
                    category: detectCategory(name)
                  });
                }} 
                required 
              />
              <input 
                type="number" 
                step="0.01" 
                placeholder="Price" 
                value={formData.price} 
                onChange={(e) => setFormData({...formData, price: e.target.value})} 
                required 
              />
              <input 
                type="text" 
                placeholder="Image URL" 
                value={formData.image} 
                onChange={(e) => setFormData({...formData, image: e.target.value})} 
                required 
              />
              <input 
                type="text" 
                placeholder="Product Link" 
                value={formData.link} 
                onChange={(e) => setFormData({...formData, link: e.target.value})} 
                required 
              />
              <select 
                value={formData.category} 
                onChange={(e) => setFormData({...formData, category: e.target.value})}
              >
                {PRODUCT_CATEGORIES.map(category => (
                  <option key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </option>
                ))}
              </select>
              <select 
                value={formData.batch} 
                onChange={(e) => setFormData({...formData, batch: e.target.value})}
              >
                <option value="best">Best</option>
                <option value="budget">Budget</option>
                <option value="random">Random</option>
              </select>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '5px 0' }}>
                <input 
                  type="checkbox" 
                  id="isPinned"
                  checked={formData.isPinned} 
                  onChange={(e) => setFormData({...formData, isPinned: e.target.checked})}
                  style={{ width: 'auto', cursor: 'pointer' }}
                />
                <label htmlFor="isPinned" style={{ color: 'white', cursor: 'pointer', userSelect: 'none' }}>Pinned Product</label>
              </div>
              {formData.isPinned && (
                <input 
                  type="number" 
                  placeholder="Pinned Order (e.g. 1, 2, 3...)" 
                  value={formData.pinnedOrder} 
                  onChange={(e) => setFormData({...formData, pinnedOrder: e.target.value})}
                  style={{ marginTop: '0' }}
                />
              )}
              <div style={{ marginTop: '10px', padding: '15px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px dashed rgba(255,255,255,0.2)' }}>
                <h4 style={{ margin: '0 0 10px 0', color: '#a78bfa' }}>Zdjęcia QC</h4>
                
                {/* QC Link Scraper Field */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                  <input 
                    type="text" 
                    placeholder={formData.link ? "🔗 Wklej link lub zostaw puste (użyje linku produktu)..." : "🔗 Wklej link Weidian/Kakobuy..."}
                    value={qcScrapeUrl} 
                    onChange={(e) => setQcScrapeUrl(e.target.value)} 
                    style={{ flex: 1, margin: 0, padding: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '5px', color: 'white', fontSize: '13px' }}
                  />
                  <button 
                    type="button" 
                    onClick={handleQcScrape} 
                    disabled={qcScrapeLoading}
                    style={{ padding: '0 15px', background: '#a78bfa', color: 'black', border: 'none', borderRadius: '5px', cursor: qcScrapeLoading ? 'wait' : 'pointer', fontWeight: 'bold', fontSize: '13px' }}
                  >
                    {qcScrapeLoading ? '⏳ Pobieranie...' : 'Pobierz QC'}
                  </button>
                </div>

                {/* Bulk Assignment Tool */}
                {formData.qcImages && formData.qcImages.length > 0 && (
                  <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '6px', marginBottom: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)' }}>
                        Wybrano: <strong style={{ color: '#a78bfa' }}>{selectedQcIndices.length}</strong> / {formData.qcImages.length} zdjęć (kliknij zdjęcie, by zaznaczyć)
                      </span>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button 
                          type="button" 
                          onClick={() => setSelectedQcIndices(formData.qcImages.map((_, idx) => idx))} 
                          style={{ padding: '2px 6px', fontSize: '10px', background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer' }}
                        >
                          Wszystkie
                        </button>
                        <button 
                          type="button" 
                          onClick={() => setSelectedQcIndices([])} 
                          style={{ padding: '2px 6px', fontSize: '10px', background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer' }}
                        >
                          Odznacz
                        </button>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <input 
                        type="text" 
                        placeholder="Nazwa kolorystyki (np. Black Cat)..." 
                        value={bulkColorwayText} 
                        onChange={(e) => setBulkColorwayText(e.target.value)} 
                        style={{ flex: 1, margin: 0, padding: '6px 8px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', color: 'white', fontSize: '12px' }}
                      />
                      <button 
                        type="button" 
                        onClick={handleBulkAssignColorway} 
                        style={{ padding: '0 12px', background: '#a78bfa', color: 'black', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}
                      >
                        Przypisz
                      </button>
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', marginBottom: '10px', paddingBottom: '5px' }}>
                  {formData.qcImages?.map((qc, i) => {
                    const isSelected = selectedQcIndices.includes(i);
                    return (
                      <div 
                        key={i} 
                        style={{ 
                          position: 'relative', 
                          minWidth: '80px', 
                          padding: '4px', 
                          borderRadius: '6px', 
                          background: isSelected ? 'rgba(167, 139, 250, 0.15)' : 'transparent',
                          border: isSelected ? '2px solid #a78bfa' : '2px solid transparent',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <img 
                          src={qc.url} 
                          alt="QC" 
                          onClick={() => {
                            setSelectedQcIndices(prev => 
                              prev.includes(i) ? prev.filter(idx => idx !== i) : [...prev, i]
                            );
                          }}
                          style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '5px', cursor: 'pointer', display: 'block' }} 
                        />
                        <button type="button" onClick={() => removeQcImage(i)} style={{ position: 'absolute', top: '-2px', right: '-2px', background: 'red', color: 'white', border: 'none', borderRadius: '50%', width: '20px', height: '20px', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 5 }}>&times;</button>
                        <input type="text" value={qc.colorway} onChange={(e) => {
                          const newQc = [...formData.qcImages];
                          newQc[i].colorway = e.target.value;
                          setFormData({...formData, qcImages: newQc});
                        }} style={{ width: '100%', fontSize: '11px', padding: '2px 4px', marginTop: '5px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '3px' }} placeholder="Kolor" />
                      </div>
                    );
                  })}
                </div>
                <div>
                  <input type="file" accept="image/*" onChange={(e) => handleQcUpload(e.target.files[0])} style={{ display: 'none' }} id="qc-upload" />
                  <label htmlFor="qc-upload" style={{ display: 'block', textAlign: 'center', padding: '10px', background: 'rgba(167, 139, 250, 0.1)', color: '#a78bfa', borderRadius: '5px', cursor: qcUploadLoading ? 'wait' : 'pointer', fontWeight: 'bold' }}>
                    {qcUploadLoading ? '⏳ Wgrywanie...' : '📸 + Dodaj zdjęcie QC'}
                  </label>
                </div>
              </div>
              <div className={styles.modalActions}>
                <button type="submit">Save</button>
                <button type="button" onClick={() => {setShowModal(false); setEditingProduct(null); setFormData({ name: '', price: '', image: '', category: 'shoes', batch: 'best', link: '', isPinned: false, pinnedOrder: '', qcImages: [] }); setQcScrapeUrl('');}}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Scraper Modal */}
      {showScraperModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.adminModal}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0 }}>Add via Scraper</h2>
              <span style={{ fontSize: '24px', cursor: 'pointer', opacity: 0.5 }} onClick={() => setShowScraperModal(false)}>&times;</span>
            </div>
            
            {scraperStatus.message && (
              <div className={scraperStatus.type === 'success' ? styles.scraperSuccess : styles.scraperError}>
                {scraperStatus.message}
              </div>
            )}

            <form onSubmit={handleScrape}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#a78bfa' }}>Weidian Link</label>
                <input 
                  type="text" 
                  placeholder="https://weidian.com/item.html?itemID=..." 
                  value={scraperData.url} 
                  onChange={(e) => setScraperData({...scraperData, url: e.target.value})} 
                  required 
                  disabled={scraperLoading}
                />
                <span className={styles.scraperHint}>Paste the full Weidian link here.</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#a78bfa' }}>Custom Name (Optional)</label>
                <input 
                  type="text" 
                  placeholder="Leave empty to use original name" 
                  value={scraperData.name} 
                  onChange={(e) => setScraperData({...scraperData, name: e.target.value})} 
                  disabled={scraperLoading}
                />
                <span className={styles.scraperHint}>We'll try to translate or use the original name if left blank.</span>
              </div>

              <div className={styles.modalActions}>
                <button type="submit" className={styles.scraperBtn} disabled={scraperLoading} style={{ width: '100%' }}>
                  {scraperLoading ? (
                    <>
                      <div className={styles.loadingSpinner}></div>
                      Scraping...
                    </>
                  ) : '🚀 Start Scraping'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Scraper Modal */}
      {showBulkScraperModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.adminModal} style={{ maxWidth: '680px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0 }}>Bulk import</h2>
              <span style={{ fontSize: '24px', cursor: 'pointer', opacity: bulkLoading ? 0.5 : 1, pointerEvents: bulkLoading ? 'none' : 'auto' }} onClick={() => setShowBulkScraperModal(false)}>&times;</span>
            </div>
            
            <form onSubmit={handleBulkScrape}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '15px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#a78bfa' }}>Linki Weidian / agent linki</label>
                <textarea 
                  placeholder="https://weidian.com/item.html?itemID=123&#10;https://weidian.com/item.html?itemID=456" 
                  value={bulkText} 
                  onChange={(e) => setBulkText(e.target.value)} 
                  required 
                  disabled={bulkLoading}
                  style={{ height: '200px', padding: '12px', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', resize: 'vertical' }}
                />
                <span className={styles.scraperHint}>
                  {bulkUrls.length > 0 ? `Wykryto ${bulkUrls.length} unikalnych itemow.` : 'Wklej dowolny tekst z linkami zawierajacymi itemID.'}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginBottom: '15px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#a78bfa' }}>Tryb</label>
                  <select
                    value={bulkReplaceMode}
                    disabled={bulkLoading}
                    onChange={(e) => {
                      setBulkReplaceMode(e.target.value);
                      setReplacePinnedConfirm('');
                    }}
                    className={styles.bulkSelect}
                    style={{ width: '100%', padding: '11px 12px' }}
                  >
                    <option value="none">Dopisz / odswiez</option>
                    <option value="pinned">Podmien przypiete</option>
                    <option value="all">Podmien caly katalog</option>
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#a78bfa' }}>Batch</label>
                  <select
                    value={bulkBatch}
                    disabled={bulkLoading}
                    onChange={(e) => setBulkBatch(e.target.value)}
                    className={styles.bulkSelect}
                    style={{ width: '100%', padding: '11px 12px' }}
                  >
                    <option value="best">Best</option>
                    <option value="budget">Budget</option>
                    <option value="random">Random</option>
                  </select>
                </div>
              </div>

              {requiresBulkConfirm && (
                <div style={{ marginBottom: '15px', padding: '12px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '8px' }}>
                  <span style={{ display: 'block', color: '#fca5a5', fontSize: '12px', marginBottom: '8px' }}>
                    {bulkReplaceMode === 'all'
                      ? 'To usunie wszystkie obecne produkty po poprawnym pobraniu calej nowej listy.'
                      : 'To usunie obecne przypiete produkty po poprawnym pobraniu calej nowej listy.'}
                  </span>
                  <input
                    type="text"
                    value={replacePinnedConfirm}
                    disabled={bulkLoading}
                    onChange={(e) => setReplacePinnedConfirm(e.target.value)}
                    placeholder="Wpisz PODMIEN"
                    style={{ padding: '8px 10px', background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(239,68,68,0.35)', color: 'white', borderRadius: '6px', width: '100%' }}
                  />
                </div>
              )}

              <div style={{ marginBottom: '15px', padding: '10px 12px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: 'rgba(255,255,255,0.72)', fontSize: '12px' }}>
                Kazdy link dziala jak zwykly scraper: warianty z osobnymi zdjeciami wejda jako osobne produkty i beda przypiete w kolejnosci z listy.
              </div>

              {bulkProgress.total > 0 && (
                <div style={{ marginBottom: '20px', padding: '15px', background: 'rgba(0,0,0,0.3)', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px', fontWeight: 'bold' }}>
                    <span>Przetwarzanie: {bulkProgress.current} / {bulkProgress.total}</span>
                    <span style={{ color: '#34d399' }}>Sukces: {bulkProgress.successes}</span>
                    <span style={{ color: '#ef4444' }}>Błędy: {bulkProgress.failures}</span>
                  </div>
                  <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${(bulkProgress.current / bulkProgress.total) * 100}%`, height: '100%', background: 'linear-gradient(90deg, #a78bfa, #7c3aed)', transition: 'width 0.3s ease' }} />
                  </div>
                  {bulkProgress.logs.length > 0 && (
                    <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '150px', overflow: 'auto' }}>
                      {bulkProgress.logs.slice(0, 8).map((log, index) => (
                        <div key={`${log.itemId || index}-${index}`} style={{ display: 'grid', gridTemplateColumns: '82px minmax(0, 1fr)', gap: '8px', fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>
                          <span style={{ color: log.status === 'success' ? '#34d399' : log.status === 'error' ? '#ef4444' : '#fbbf24', fontWeight: 700 }}>
                            {log.status === 'success' ? (log.action || 'ok') : log.status}
                          </span>
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {log.name || log.message || log.url}
                          </span>
                        </div>
                      ))}
                      {bulkProgress.logs.length > 8 && (
                        <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)' }}>
                          +{bulkProgress.logs.length - 8} kolejnych wynikow
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className={styles.modalActions}>
                <button type="submit" className={styles.scraperBtn} disabled={bulkLoading || bulkUrls.length === 0 || (requiresBulkConfirm && replacePinnedConfirm !== REPLACE_CONFIRM_TEXT)} style={{ width: '100%' }}>
                  {bulkLoading ? (
                    <>
                      <div className={styles.loadingSpinner}></div>
                      Dodawanie...
                    </>
                  ) : 'Rozpocznij import'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast Notification Containers */}
      <div className={styles.toastContainer}>
        {toasts.map(toast => (
          <div key={toast.id} className={`${styles.toast} ${toast.type === 'success' ? styles.toastSuccess : styles.toastError}`}>
            <span className={styles.toastIcon}>
              {toast.type === 'success' ? '⚡' : '⚠️'}
            </span>
            <span className={styles.toastMessage}>{toast.message}</span>
            <button className={styles.toastClose} onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}>&times;</button>
          </div>
        ))}
      </div>

      {/* Confirmation Modal */}
      {confirmModal.isOpen && (
        <div className={styles.modalOverlay}>
          <div className={`${styles.adminModal} ${styles.confirmModal}`}>
            <h2>{confirmModal.title}</h2>
            <p>{confirmModal.message}</p>
            <div className={styles.modalActions}>
              <button 
                onClick={confirmModal.onConfirm}
                className={styles.confirmModalBtn}
              >
                Tak, wykonaj
              </button>
              <button 
                type="button" 
                onClick={() => setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: null })}
                className={styles.cancelModalBtn}
              >
                Anuluj
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Lightbox */}
      {lightboxImage && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.95)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            cursor: 'pointer'
          }}
          onClick={() => setLightboxImage(null)}
        >
          <button
            onClick={() => setLightboxImage(null)}
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              color: 'white',
              fontSize: '32px',
              width: '50px',
              height: '50px',
              borderRadius: '50%',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.2s',
              zIndex: 10001
            }}
            onMouseEnter={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.2)'}
            onMouseLeave={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.1)'}
          >
            ×
          </button>
          <img 
            src={lightboxImage} 
            alt="Full size preview" 
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '90vw',
              maxHeight: '90vh',
              objectFit: 'contain',
              borderRadius: '8px',
              cursor: 'default'
            }}
          />
        </div>
      )}

      {/* Template Import Modal */}
      {showTemplateModal && (
        <TemplateImportModal
          isOpen={showTemplateModal}
          onClose={() => setShowTemplateModal(false)}
          onImportComplete={(result) => {
            console.log('Template import completed:', result);
            setSelectedIds([]);
            setSortBy('pinned_order');
            fetchProducts(1);
          }}
          showToast={showToast}
        />
      )}
    </div>
  );
}
