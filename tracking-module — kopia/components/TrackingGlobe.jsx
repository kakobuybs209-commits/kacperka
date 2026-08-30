'use client';
import { useRef, useEffect, useState, useMemo } from 'react';
import dynamic from 'next/dynamic';

const Globe = dynamic(() => import('react-globe.gl'), { ssr: false });

const COORDINATES = {
  CHINA_WAREHOUSE: { lat: 22.5431, lng: 114.0579, name: 'Magazyn 📦' },
  SHENZHEN: { lat: 22.5431, lng: 114.0579, name: 'Sortownia (CN) 🇨🇳' },
  GUANGZHOU: { lat: 23.1291, lng: 113.2644, name: 'Sortownia (CN) 🇨🇳' },
  HONG_KONG: { lat: 22.3193, lng: 114.1694, name: 'Hong Kong 🇭🇰' },
  SHANGHAI: { lat: 31.2304, lng: 121.4737, name: 'Szanghaj 🇨🇳' },
  FRANKFURT: { lat: 50.1109, lng: 8.6821, name: 'Frankfurt 🇩🇪' },
  AMSTERDAM: { lat: 52.3676, lng: 4.9041, name: 'Amsterdam 🇳🇱' },
  OIRSCHOT: { lat: 51.5036, lng: 5.3094, name: 'Oirschot 🇳🇱' },
  VIJFHUIZEN: { lat: 52.3486, lng: 4.6756, name: 'Vijfhuizen 🇳🇱' },
  WARSAW: { lat: 52.2297, lng: 21.0122, name: 'Polska 🇵🇱' },
  GERMANY: { lat: 51.1657, lng: 10.4515, name: 'Niemcy 🇩🇪' },
  POLAND: { lat: 51.9194, lng: 19.1451, name: 'Polska 🇵🇱' },
  NETHERLANDS: { lat: 52.1326, lng: 5.2913, name: 'Holandia 🇳🇱' }
};

export default function TrackingGlobe({ data }) {
  const globeRef = useRef();

  const { arcsData, labelsData, pointsData } = useMemo(() => {
    if (!data?.Szczegóły_przesyłki) return { arcsData: [], labelsData: [], pointsData: [] };

    const getCoords = (text) => {
      const lower = (text || '').toLowerCase();
      if (lower.includes('shenzhen') || lower.includes('sortowni')) return COORDINATES.SHENZHEN;
      if (lower.includes('guangzhou')) return COORDINATES.GUANGZHOU;
      if (lower.includes('hong kong') || lower.includes('hkg')) return COORDINATES.HONG_KONG;
      if (lower.includes('shanghai') || lower.includes('szanghaj')) return COORDINATES.SHANGHAI;
      if (lower.includes('frankfurt') || lower.includes('fra')) return COORDINATES.FRANKFURT;
      if (lower.includes('amsterdam') || lower.includes('ams')) return COORDINATES.AMSTERDAM;
      if (lower.includes('oirschot')) return COORDINATES.OIRSCHOT;
      if (lower.includes('vijfhuizen')) return COORDINATES.VIJFHUIZEN;
      if (lower.includes('warsaw') || lower.includes('warszawa') || lower.includes('polska')) return COORDINATES.WARSAW;
      if (lower.includes('niemcy') || lower.includes('germany') || lower.includes('dhl')) return COORDINATES.GERMANY;
      if (lower.includes('holandia') || lower.includes('netherlands') || lower.includes('(nl)')) return COORDINATES.NETHERLANDS;
      if (lower.includes('chiny') || lower.includes('china')) return COORDINATES.SHENZHEN;
      return null;
    };

    const history = [...data.Szczegóły_przesyłki].reverse();
    const points = [];
    points.push({ ...COORDINATES.CHINA_WAREHOUSE, label: COORDINATES.CHINA_WAREHOUSE.name });

    history.forEach(item => {
      const coords = getCoords(item.Lokalizacja || item.Status);
      if (coords) {
        const lastPoint = points[points.length - 1];
        if (lastPoint.lat !== coords.lat || lastPoint.lng !== coords.lng) {
          points.push({ ...coords, label: coords.name || '' });
        }
      }
    });

    if (points.length === 1) {
      if (data.Informacje_główne.Kraj?.includes('DE')) {
        points.push({ ...COORDINATES.FRANKFURT, label: 'Germany Hub 🇩🇪' });
      } else if (data.Informacje_główne.Kraj?.includes('NL')) {
        points.push({ ...COORDINATES.AMSTERDAM, label: 'Netherlands Hub 🇳🇱' });
      } else {
        points.push({ ...COORDINATES.WARSAW, label: 'Dostarczono ✅' });
      }
    } else if (!points[points.length-1].label) {
        points[points.length-1].label = 'Dostarczono ✅';
    }

    const arcs = [];
    const labels = [];

    for (let i = 0; i < points.length - 1; i++) {
      arcs.push({
        startLat: points[i].lat,
        startLng: points[i].lng,
        endLat: points[i+1].lat,
        endLng: points[i+1].lng,
        color: ['#8b5cf6', '#00d9ff'] // Purple to Cyan gradient
      });
    }

    points.forEach((p, idx) => {
      // Only show labels for start, end, and unique middle points to avoid overlap
      if (idx === 0 || idx === points.length - 1) {
        const isDelivered = (p.label || '').includes('Dostarczono');
        labels.push({
          lat: p.lat,
          lng: p.lng,
          text: p.label || '',
          color: isDelivered ? '#22c55e' : '#ffffff',
          size: idx === points.length - 1 ? 2.5 : 1.5
        });
      }
    });

    return { arcsData: arcs, labelsData: labels, pointsData: points };
  }, [data]);

  useEffect(() => {
    if (globeRef.current) {
      const controls = globeRef.current.controls();
      if (controls) {
        controls.autoRotate = true;
        controls.autoRotateSpeed = 0.5;
        controls.enableZoom = false;
      }
      
      if (labelsData.length > 0) {
        // Focus on the current (last) location
        const last = labelsData[labelsData.length - 1];
        globeRef.current.pointOfView({ 
          lat: last.lat, 
          lng: last.lng, 
          altitude: 1.5 
        }, 2000);
      }
    }
  }, [labelsData]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <Globe
        ref={globeRef}
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
        bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
        backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
        
        arcsData={arcsData}
        arcColor={'color'}
        arcDashLength={0.4}
        arcDashGap={0.2}
        arcDashAnimateTime={1500}
        arcStroke={1.5}
        arcAltitude={0.2}

        ringsData={pointsData}
        ringColor={() => '#8b5cf6'}
        ringMaxRadius={3}
        ringPropagationSpeed={2}
        ringRepeatPeriod={1000}
        
        htmlElementsData={labelsData}
        htmlElement={d => {
          const el = document.createElement('div');
          el.innerHTML = `<div style="
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 4px 10px;
            border-radius: 6px;
            font-size: 13px;
            font-weight: 600;
            white-space: nowrap;
            display: flex;
            align-items: center;
            gap: 6px;
            border: 1px solid rgba(255, 255, 255, 0.1);
            box-shadow: 0 4px 15px rgba(0,0,0,0.5);
            pointer-events: none;
            user-select: none;
          ">
            ${d.text}
          </div>`;
          return el;
        }}
        htmlLat={d => d.lat}
        htmlLng={d => d.lng}
        
        atmosphereColor="#ffffff"
        atmosphereAltitude={0.15}
        
        backgroundColor="rgba(0,0,0,0)"
      />
    </div>
  );
}
