'use client';
import { useState, useMemo, useEffect } from 'react';
import { useLanguage } from '../lib/i18n';
import { translateStatus as translateStatusFe, translateLocation as translateLocationFe } from '../lib/trackingTranslations';
import { estimateDelivery, getCountryDeltaNote } from '../lib/deliveryEstimator';
import styles from '../styles/Tracking.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faHashtag,
  faTruck,
  faCalendarDay,
  faBox,
  faMapPin,
  faExclamationTriangle,
  faSearch,
  faArrowRight,
  faGlobe,
  faCalendarAlt,
  faUser,
  faInfoCircle,
  faTimes,
  faMap,
  faClock,
  faCopy,
  faCheck
} from '@fortawesome/free-solid-svg-icons';
import TrackingGlobe from './TrackingGlobe';

const COUNTRY_MAP = {
  'PL': 'POLSKA',
  'DE': 'NIEMCY',
  'CN': 'CHINY',
  'NL': 'HOLANDIA',
  'GB': 'WIELKA BRYTANIA',
  'US': 'USA',
  'FR': 'FRANCJA',
  'ES': 'HISZPANIA',
  'IT': 'WŁOCHY',
  'BE': 'BELGIA',
  'CZ': 'CZECHY',
  'SK': 'SŁOWACJA',
  'HU': 'WĘGRY',
  'AT': 'AUSTRIA'
};

export default function Tracking() {
  const { t, language } = useLanguage();
  const [trackingCode, setTrackingCode] = useState('');
  const [trackingData, setTrackingData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showAll, setShowAll] = useState(false);
  const [showGlobe, setShowGlobe] = useState(false);
  const itemsToShow = 15;
  const [initialLoad, setInitialLoad] = useState(true);
  const [copiedField, setCopiedField] = useState(null);

  const copyToClipboard = (text, fieldName) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2000);
    });
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const lastCode = localStorage.getItem('last_tracking_code');
      if (lastCode && initialLoad) {
        // Just show it as last searched, don't auto-fetch
        setInitialLoad(false);
      }
    }
  }, [initialLoad]);

  const lastSearchedCode = typeof window !== 'undefined' ? localStorage.getItem('last_tracking_code') : null;

  const fetchTrackingData = async (code) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('last_tracking_code', code);
    }
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/tracking/${encodeURIComponent(code)}?lang=en`);
      if (!response.ok) throw new Error(t('tracking.errorServer'));
      const data = await response.json();
      if (!data.success) {
        setError(data.message || t('tracking.errorNotFound'));
        setTrackingData(null);
      } else {
        setTrackingData(data);
      }
    } catch (err) {
      setError(t('tracking.errorGeneral'));
      setTrackingData(null);
    }
    setLoading(false);
  };

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (trackingCode) {
      fetchTrackingData(trackingCode);
    }
  };

  const toggleShowAll = () => {
    setShowAll((prev) => !prev);
  };

  // DHL sometimes tags an event with a country name that contradicts where the
  // package actually is (e.g. "Holandia" on a China export event). When the
  // location is a bare country name that disagrees with the detected country
  // group, show the group's country instead of the misleading label.
  const GENERIC_COUNTRY_LABELS = {
    'holandia': 'NL', 'holland': 'NL', 'netherlands': 'NL',
    'polska': 'PL', 'poland': 'PL',
    'niemcy': 'DE', 'germany': 'DE',
    'chiny': 'CN', 'china': 'CN',
  };

  const resolveDisplayLocation = (rawLocation, groupCode) => {
    const key = (rawLocation || '').trim().toLowerCase();
    const labelCountry = GENERIC_COUNTRY_LABELS[key];
    if (labelCountry && labelCountry !== groupCode) {
      return COUNTRY_MAP[groupCode] || rawLocation;
    }
    return rawLocation;
  };

  // Logic to group tracking data by country
  const groupedData = useMemo(() => {
    if (!trackingData?.Szczegóły_przesyłki) return [];

    const getCountryInfo = (item) => {
      const location = (item.Lokalizacja || '').toLowerCase();
      const originalLocation = (item.OriginalLocation || '').toLowerCase();
      const originalStatus = (item.OriginalStatus || '').toLowerCase();
      
      // ========================================
      // HARDCODE FIX: If displayed location is "Holandia" = CHINA
      // Real Netherlands events have specific cities or "Brak danych o lokalizacji"
      // ========================================
      if (location === 'holandia' || location === 'holland' || location === 'netherlands') {
        return { code: 'CN', name: 'CHINY' };
      }
      
      // ========================================
      // PRIORITY 0: EXPLICIT CITY NAMES OVERRIDE EVERYTHING
      // Check location first - if it's a specific Chinese/Polish city, use that!
      // ========================================
      
      // Chinese cities - must check FIRST before any status checks
      // Also check if status mentions Chinese city even if location is wrong
      if (originalLocation.includes('shanghai') || originalLocation.includes('szanghaj') ||
          originalLocation.includes('上海') ||
          originalLocation.includes('shenzhen') || originalLocation.includes('深圳') ||
          originalLocation.includes('putian') || originalLocation.includes('莆田') ||
          originalLocation.includes('beijing') || originalLocation.includes('北京') ||
          originalLocation.includes('pekin') ||
          originalStatus.includes('shanghai') || originalStatus.includes('szanghaj') ||
          originalStatus.includes('shenzhen') || originalStatus.includes('beijing')) {
        return { code: 'CN', name: 'CHINY' };
      }
      
      // Polish cities with explicit names
      if (originalLocation.includes('poznan') || originalLocation.includes('poznań') ||
          originalLocation.includes('stalowa wola') || originalLocation.includes('warszawa') ||
          originalLocation.includes('stryków') || originalLocation.includes('strykow') ||
          originalLocation.includes('rudnik')) {
        return { code: 'PL', name: 'POLSKA' };
      }
      
      // German cities
      if (originalLocation.includes('bremen') || originalLocation.includes('brema') ||
          originalLocation.includes('hamburg')) {
        return { code: 'DE', name: 'NIEMCY' };
      }
      
      // Dutch cities
      if (originalLocation.includes('oirschot') || originalLocation.includes('vijfhuizen') ||
          originalLocation.includes('veenendaal')) {
        return { code: 'NL', name: 'HOLANDIA' };
      }
      
      // ========================================
      // PRIORITY 1: STATUS-BASED DETECTION (Most reliable!)
      // Check what's happening in the status first
      // ========================================
      
      // DHL-specific statuses with "Poland" prefix but actually in respective countries
      if (originalStatus.includes('poland, the international shipment has been processed in the parcel center of origin')) {
        // This is Poland receiving from abroad
        return { code: 'PL', name: 'POLSKA' };
      }
      
      if (originalStatus.includes('germany, the international shipment has been processed')) {
        // This is Germany hub
        return { code: 'DE', name: 'NIEMCY' };
      }
      
      // Final delivery statuses = POLAND (destination)
      if (originalStatus.includes('successfully delivered') ||
          originalStatus.includes('pomyślnie dostarczona') ||
          originalStatus.includes('delivered successfully') ||
          originalStatus.includes('签收')) {
        return { code: 'PL', name: 'POLSKA' };
      }
      
      // DHL Poland-specific statuses (actual Polish operations)
      if (originalStatus.includes('poland, the shipment has been loaded onto the delivery vehicle') ||
          originalStatus.includes('poland, the shipment is being prepared for delivery') ||
          originalStatus.includes('poland, the shipment has been processed in the parcel center') ||
          originalStatus.includes('poland, the shipment has arrived in the destination country') ||
          originalStatus.includes('loaded onto the delivery vehicle') ||
          originalStatus.includes('prepared for delivery in the delivery depot')) {
        return { code: 'PL', name: 'POLSKA' };
      }
      
      // DHL statuses mentioning destination country
      if (originalStatus.includes('the shipment has arrived in the destination country')) {
        return { code: 'PL', name: 'POLSKA' };
      }
      
      // Poland-specific operations
      if (originalStatus.includes('processed in the destination parcel center') ||
          originalStatus.includes('unloaded from movement') ||
          originalStatus.includes('przesyłka została przetworzona w docelowym centrum obsługi paczek') ||
          originalStatus.includes('rozładunek z pojazdu transportowego') ||
          originalStatus.includes('przybył pojazd transportowy')) {
        // Check if location explicitly mentions Polish city OR is generic "polska"/"pl"
        if (originalLocation.includes('poznan') || originalLocation.includes('poznań') ||
            originalLocation.includes('stalowa') || originalLocation.includes('rudnik') ||
            originalLocation.includes('polska') || originalLocation === 'pl') {
          return { code: 'PL', name: 'POLSKA' };
        }
      }
      
      // "Processed in parcel center of origin" with Polish city = POLAND
      if (originalStatus.includes('processed in the parcel center of origin') ||
          originalStatus.includes('przetworzona w centrum dystrybucyjnym of origin')) {
        // Check location
        if (originalLocation.includes('poznan') || originalLocation.includes('poznań') ||
            originalLocation.includes('stalowa') || originalLocation.includes('rudnik') ||
            originalLocation.includes('polska')) {
          return { code: 'PL', name: 'POLSKA' };
        }
        // Bremen = Germany
        if (originalLocation.includes('bremen') || originalLocation.includes('brema')) {
          return { code: 'DE', name: 'NIEMCY' };
        }
      }
      
      // Flight events
      if (originalStatus.includes('flight has departed') || 
          originalStatus.includes('航班已起飞')) {
        return { code: 'CN', name: 'CHINY' };
      }
      
      if (originalStatus.includes('flight has arrived') || 
          originalStatus.includes('航班已抵达')) {
        return { code: 'NL', name: 'HOLANDIA' };
      }
      
      // Customs and processing - EXPORT (China)
      if (originalStatus.includes('export customs clearance completed') ||
          originalStatus.includes('出口清关完成') ||
          originalStatus.includes('export customs') ||
          originalStatus.includes('odprawa celna eksportowa') ||
          originalStatus.includes('expected flight') ||
          originalStatus.includes('预计')) {
        return { code: 'CN', name: 'CHINY' };
      }
      
      // Customs and processing - IMPORT (Netherlands/Europe)
      // BUT: Check if it's really import or misclassified export
      if (originalStatus.includes('customs clearance completed pending scanning') ||
          originalStatus.includes('清关完成,等待提取') ||
          originalStatus.includes('dismantling the board') ||
          originalStatus.includes('拆板中')) {
        return { code: 'NL', name: 'HOLANDIA' };
      }
      
      // Generic "odprawa celna zakończona" WITHOUT "eksportowa" 
      // Context check: if location mentions Netherlands but NO real arrival = China export
      if ((originalStatus.includes('odprawa celna zakończona') ||
           originalStatus.includes('customs clearance completed') ||
           originalStatus.includes('清关完成')) &&
          !originalStatus.includes('export') &&
          !originalStatus.includes('eksportowa') &&
          !originalStatus.includes('出口')) {
        
        // If status explicitly has Chinese "抵达【ams】" = real Netherlands
        if (originalStatus.includes('抵达【ams】')) {
          return { code: 'NL', name: 'HOLANDIA' };
        }
        
        // If location has specific Dutch cities (not generic) = real Netherlands
        if (originalLocation.includes('amsterdam') ||
            originalLocation.includes('rotterdam') || originalLocation.includes('eindhoven') ||
            originalLocation.includes('oirschot') || originalLocation.includes('vijfhuizen')) {
          return { code: 'NL', name: 'HOLANDIA' };
        }
        
        // If location mentions Netherlands/Holland = misclassified China export
        if (originalLocation.includes('holandia') || originalLocation.includes('holland') || 
            originalLocation.includes('netherlands')) {
          return { code: 'CN', name: 'CHINY' };
        }
        
        // Default to Netherlands
        return { code: 'NL', name: 'HOLANDIA' };
      }
      
      // Short status codes like "AMS" without Chinese context = China facility codes
      if (originalStatus.trim().toLowerCase() === 'ams' && 
          !originalStatus.includes('抵达') && !originalStatus.includes('arrived')) {
        return { code: 'CN', name: 'CHINY' };
      }
      
      // Chinese warehouse operations
      if (originalStatus.includes('货物离开操作中心') ||
          originalStatus.includes('到达操作中心') ||
          originalStatus.includes('快件到达机场') ||
          originalStatus.includes('快件已出库') ||
          originalStatus.includes('启运') ||
          originalStatus.includes('快件到达始发地海关')) {
        return { code: 'CN', name: 'CHINY' };
      }
      
      // Netherlands arrival/processing
      // Real Amsterdam arrival has explicit Chinese text
      if (originalStatus.includes('抵达【ams】')) {
        return { code: 'NL', name: 'HOLANDIA' };
      }
      
      if (originalStatus.includes('目的地清关完成')) {
        return { code: 'NL', name: 'HOLANDIA' };
      }
      
      // Initial tracking data received
      if (originalStatus.includes('shipment information received') ||
          originalStatus.includes('货物电子信息已经收到') ||
          originalStatus.includes('instruction data') ||
          originalStatus.includes('已预报')) {
        return { code: 'CN', name: 'CHINY' };
      }
      
      // ========================================
      // PRIORITY 2: Special case statuses for Germany
      // ========================================
      
      // "Pick-up was successful" = DHL picking up from Netherlands (happens in GERMANY)
      if (originalStatus.includes('pick-up was successful') || 
          originalStatus.includes('odbiór przebiegł pomyślnie')) {
        return { code: 'DE', name: 'NIEMCY' };
      }
      
      // "Loaded to movement/tour vehicle" - check location carefully
      if (originalStatus.includes('loaded to movement') || 
          originalStatus.includes('załadowany do pojazdu')) {
        // If location contains "polska" in status OR location = POLAND
        if (originalStatus.includes('polska') || 
            originalLocation.includes('polska') ||
            originalLocation.includes('poland')) {
          return { code: 'PL', name: 'POLSKA' };
        }
        // If it mentions Polish city explicitly = POLAND  
        if (originalLocation.includes('poznan') || originalLocation.includes('poznań') ||
            originalLocation.includes('stalowa') || originalLocation.includes('rudnik') ||
            originalLocation.includes('warszawa')) {
          return { code: 'PL', name: 'POLSKA' };
        }
        // Otherwise generic "PL" without context = GERMANY (loading for transport TO Poland)
        return { code: 'DE', name: 'NIEMCY' };
      }
      
      // ========================================
      // PRIORITY 3: EXACT country codes (only when no city)
      // ========================================
      
      if (originalLocation === 'pl') {
        return { code: 'PL', name: 'POLSKA' };
      }
      
      if (originalLocation === 'de' || originalLocation === 'germany') {
        return { code: 'DE', name: 'NIEMCY' };
      }
      
      if (originalLocation === 'nl' || originalLocation === 'netherlands') {
        return { code: 'NL', name: 'HOLANDIA' };
      }
      
      // ========================================
      // PRIORITY 4: Check for Chinese characters = China
      // ========================================
      
      if (/[\u4e00-\u9fa5]/.test(originalStatus) || /[\u4e00-\u9fa5]/.test(originalLocation)) {
        return { code: 'CN', name: 'CHINY' };
      }
      
      // ========================================
      // DEFAULT: China (origin)
      // ========================================
      
      return { code: 'CN', name: 'CHINY' };
    };

    const rawGroups = [];
    let currentGroup = null;

    const items = showAll ? trackingData.Szczegóły_przesyłki : trackingData.Szczegóły_przesyłki.slice(0, itemsToShow);

    items.forEach((item) => {
      const country = getCountryInfo(item);
      if (!currentGroup || currentGroup.code !== country.code) {
        currentGroup = {
          ...country,
          items: []
        };
        rawGroups.push(currentGroup);
      }
      currentGroup.items.push(item);
    });

    // Merge adjacent groups with the same country code
    // (prevents NL → CN → NL fragmentation when one event is misdetected)
    const groups = [];
    rawGroups.forEach((group) => {
      const prev = groups[groups.length - 1];
      if (prev && prev.code === group.code) {
        prev.items = [...prev.items, ...group.items];
      } else {
        groups.push({ ...group, items: [...group.items] });
      }
    });

    return groups;
  }, [trackingData, showAll, language]);

  const [showSidePanel, setShowSidePanel] = useState(true);

  return (
    <div className={styles.trackingPage}>
      <div className={styles.nebulaGlow} />

      <div className={`${styles.mainContainer} ${styles.animateIn}`}>
        {/* ... existing main container content ... */}
        <div className={styles.header}>
          <h1>{t('tracking.title')}</h1>
          <p>{t('tracking.subtitle')}</p>
        </div>

        <div className={styles.trackingBox}>
          <form onSubmit={handleSubmit} className={styles.inputGroup}>
            <FontAwesomeIcon icon={faSearch} className={styles.inputIcon} />
            <input
              type="text"
              className={styles.input}
              placeholder={t('tracking.placeholder')}
              value={trackingCode}
              onChange={(e) => setTrackingCode(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            />
            <button className={styles.trackBtn} type="submit" disabled={loading}>
              {loading ? <div className={styles.spinnerSmall}></div> : <FontAwesomeIcon icon={faArrowRight} />}
            </button>
          </form>

          {lastSearchedCode && (
            <div className={styles.lastSearched} onClick={() => {
              setTrackingCode(lastSearchedCode);
              fetchTrackingData(lastSearchedCode);
            }}>
              <span>OSTATNIO SZUKANE:</span> <strong>{lastSearchedCode}</strong> <FontAwesomeIcon icon={faArrowRight} />
            </div>
          )}

          {error && (
            <div className={styles.statusMsg}>
              <FontAwesomeIcon icon={faExclamationTriangle} /> {error}
            </div>
          )}

          {trackingData && (() => {
            const destCountry = (trackingData.Informacje_główne?.Kraj || 'PL')
              .trim().toUpperCase().replace(/^.*\(([A-Z]{2})\).*$/, '$1').slice(0, 2);
            const estimate = estimateDelivery(trackingData.Szczegóły_przesyłki || [], language, destCountry);
            const deltaNote = getCountryDeltaNote(estimate.destinationCountry, estimate.countryDelta, language);
            return (
            <div className={styles.resultCard}>
              
              <div className={styles.mapBannerWrapper}>
                <span className={styles.betaBadge}>{t('tracking.beta')}</span>
                <div className={styles.mapBanner} onClick={() => setShowGlobe(true)}>
                  <h3>
                    {t('tracking.open3DMap')} <FontAwesomeIcon icon={faArrowRight} />
                  </h3>
                </div>
              </div>

              {/* ── ESTIMATED DELIVERY CARD ── */}
              <div className={`${styles.estimateCard} ${styles[`estimate_${estimate.confidence}`]}`}>
                <div className={styles.estimateIcon}>
                  <FontAwesomeIcon icon={estimate.isDelivered ? faBox : faClock} />
                </div>
                <div className={styles.estimateBody}>
                  <p className={styles.estimateLabel}>
                    {language === 'pl' ? 'SZACOWANA DOSTAWA' :
                     language === 'de' ? 'GESCHÄTZTE LIEFERUNG' :
                     language === 'es' ? 'ENTREGA ESTIMADA' :
                     'ESTIMATED DELIVERY'}
                  </p>
                  {estimate.isDelivered ? (
                    <p className={styles.estimateDelivered}>
                      ✓ {estimate.label}
                    </p>
                  ) : estimate.dateRange ? (
                    <>
                      <p className={styles.estimateDates}>{estimate.dateRange}</p>
                      {deltaNote && (
                        <p className={styles.estimateCountryNote}>{deltaNote}</p>
                      )}
                    </>
                  ) : (
                    <p className={styles.estimateDates}>—</p>
                  )}
                  <p className={styles.estimateMilestone}>
                    <FontAwesomeIcon icon={faMapPin} />
                    {estimate.label}
                  </p>
                </div>
                <div className={`${styles.estimateConfidenceDot} ${styles[`dot_${estimate.confidence}`]}`} />
              </div>

              <div className={styles.mainInfoSection}>
                <h2 className={styles.sectionTitle}>{t('tracking.mainInfo')}</h2>
                <div className={styles.infoGrid}>
                  <div className={styles.infoItem}>
                    <FontAwesomeIcon icon={faHashtag} />
                    <span><strong>{t('tracking.reference')}:</strong> {trackingData.Informacje_główne['Numer referencyjny']}</span>
                    <button 
                      className={styles.copyBtn}
                      onClick={() => copyToClipboard(trackingData.Informacje_główne['Numer referencyjny'], 'reference')}
                      title="Kopiuj"
                    >
                      <FontAwesomeIcon icon={copiedField === 'reference' ? faCheck : faCopy} />
                    </button>
                  </div>
                  <div className={styles.infoItem}>
                    <FontAwesomeIcon icon={faTruck} />
                    <span><strong>{t('tracking.trackingNumber')}:</strong> {trackingData.Informacje_główne['Numer śledzenia']}</span>
                    <button 
                      className={styles.copyBtn}
                      onClick={() => copyToClipboard(trackingData.Informacje_główne['Numer śledzenia'], 'tracking')}
                      title="Kopiuj"
                    >
                      <FontAwesomeIcon icon={copiedField === 'tracking' ? faCheck : faCopy} />
                    </button>
                  </div>
                  <div className={styles.infoItem}>
                    <FontAwesomeIcon icon={faGlobe} />
                    <span><strong>{t('tracking.country')}:</strong> {translateLocationFe(trackingData.Informacje_główne.Kraj || 'Polska', language)}</span>
                  </div>
                  <div className={styles.infoItem}>
                    <FontAwesomeIcon icon={faCalendarAlt} />
                    <span><strong>{t('tracking.date')}:</strong> {trackingData.Informacje_główne.Data}</span>
                  </div>
                  {trackingData.Informacje_główne.Odbiorca && (
                    <div className={styles.infoItem}>
                      <FontAwesomeIcon icon={faUser} />
                      <span><strong>{t('tracking.recipient')}:</strong> {(() => {
                        let recipient = trackingData.Informacje_główne.Odbiorca;
                        // Clean up recipient field (backup cleaning on frontend)
                        recipient = recipient.replace(/^签收/, '').trim();
                        recipient = recipient.replace(/Poland,\s*The shipment has been successfully delivered\s*\/?\s*/gi, '').trim();
                        recipient = recipient.replace(/Poland\s*$/i, '').trim();
                        recipient = recipient.replace(/\s*\/\s*Poland\s*$/i, '').trim();
                        return recipient || 'Brak danych';
                      })()}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className={styles.timelineSection}>
                <h2 className={styles.sectionTitle}>{t('tracking.history')}</h2>
                
                {groupedData.map((group, gIndex) => (
                  <div key={gIndex} className={styles.countryGroup}>
                      <div className={styles.countryHeader}>
                        <span className={styles.countryCode}>{group.code}</span>
                        <h3 className={styles.countryName}>{translateLocationFe(group.name, language).toUpperCase()}</h3>
                        <div className={styles.countryDivider} />
                      </div>
                      
                      <div className={styles.timelineWrapper}>
                        {group.items.map((detail, index) => (
                          <div key={index} className={styles.timelineItem}>
                            <div className={styles.timelineDot}></div>
                            <div className={styles.timelineContent}>
                              <p className={styles.timelineDate}>
                                <FontAwesomeIcon icon={faCalendarDay} />
                                {detail.Data}
                              </p>
                              <p className={styles.timelineStatus}>
                                {translateStatusFe(detail.Status, language)}
                              </p>
                              {detail.Lokalizacja && (
                                <p className={styles.timelineLocation}>
                                  <FontAwesomeIcon icon={faMapPin} />
                                  {translateLocationFe(resolveDisplayLocation(detail.Lokalizacja, group.code), language)}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                  </div>
                ))}

                {trackingData.Szczegóły_przesyłki.length > itemsToShow && (
                  <button className={styles.showMoreBtn} onClick={toggleShowAll}>
                    {showAll ? t('tracking.showLess') : t('tracking.showMore')}
                  </button>
                )}
              </div>
            </div>
            );
          })()}
        </div>
      </div>

      {showGlobe && (
        <div className={styles.globeModal}>
          <div className={styles.globeHeader}>
            <button className={styles.closeGlobe} onClick={() => setShowGlobe(false)}>
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>

          <button 
            className={`${styles.mobileInfoToggle} ${showSidePanel ? styles.active : ''}`}
            onClick={() => setShowSidePanel(!showSidePanel)}
          >
            <FontAwesomeIcon icon={showSidePanel ? faTimes : faInfoCircle} />
          </button>
          
          <div className={`${styles.sideInfoBox} ${showSidePanel ? styles.visible : styles.hidden}`}>
            <h2 className={styles.floatingTitle}>{t('tracking.location')}</h2>
            
            <div className={styles.statusSection}>
              <p className={styles.statusLabel}>{t('tracking.status')}:</p>
              <p className={styles.statusValue}>{translateStatusFe(trackingData.Informacje_główne['Ostatni status'], language)}</p>
            </div>

            <div className={styles.locationSection}>
              <p className={styles.statusLabel}>{t('tracking.location')}:</p>
              <p className={styles.locationLabel}>{translateLocationFe(trackingData.Informacje_główne.Kraj || 'Polska', language)}</p>
            </div>

            {/* ── ESTIMATED DELIVERY IN GLOBE PANEL ── */}
            {(() => {
              const destCountry2 = (trackingData.Informacje_główne?.Kraj || 'PL')
                .trim().toUpperCase().replace(/^.*\(([A-Z]{2})\).*$/, '$1').slice(0, 2);
              const est = estimateDelivery(trackingData.Szczegóły_przesyłki || [], language, destCountry2);
              const dn = getCountryDeltaNote(est.destinationCountry, est.countryDelta, language);
              return (
                <div className={styles.globeEstimateSection}>
                  <p className={styles.statusLabel}>
                    <FontAwesomeIcon icon={faClock} style={{marginRight:'6px'}} />
                    {language === 'pl' ? 'SZACOWANA DOSTAWA' :
                     language === 'de' ? 'GESCHÄTZTE LIEFERUNG' :
                     language === 'es' ? 'ENTREGA ESTIMADA' :
                     'ESTIMATED DELIVERY'}
                  </p>
                  {est.isDelivered ? (
                    <p className={`${styles.deliveryTimeValue} ${styles.deliveredBadge}`}>✓ {est.label}</p>
                  ) : est.dateRange ? (
                    <>
                      <p className={styles.globeEstimateDates}>{est.dateRange}</p>
                      {dn && <p className={styles.globeCountryNote}>{dn}</p>}
                      <p className={styles.globeEstimateMilestone}>
                        <FontAwesomeIcon icon={faMapPin} />
                        {est.label}
                      </p>
                    </>
                  ) : (
                    <p className={styles.deliveryTimeValue}>{est.label}</p>
                  )}
                  <div className={styles.confidenceBar}>
                    <div className={`${styles.confidenceFill} ${styles[`fill_${est.confidence}`]}`} />
                  </div>
                  <p className={styles.confidenceText}>
                    {est.confidence === 'high'
                      ? (language === 'pl' ? '● Wysoka pewność' : language === 'de' ? '● Hohe Genauigkeit' : '● High confidence')
                      : est.confidence === 'medium'
                      ? (language === 'pl' ? '◐ Średnia pewność' : language === 'de' ? '◐ Mittlere Genauigkeit' : '◐ Medium confidence')
                      : (language === 'pl' ? '○ Niska pewność' : language === 'de' ? '○ Niedrige Genauigkeit' : '○ Low confidence')}
                  </p>
                </div>
              );
            })()}

          </div>

          <TrackingGlobe data={trackingData} />
        </div>
      )}
    </div>
  );
}