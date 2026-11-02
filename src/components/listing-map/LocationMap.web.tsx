import React, { useEffect, useMemo, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { LocationMapProps } from './LocationMap.types';

const DEFAULT_POINT = { latitude: 14.5995, longitude: 120.9842 };

type MapPickMessage = { type: 'sellspace-map-pick'; latitude: number; longitude: number };

export default function LocationMap({ point, onPick }: LocationMapProps) {
  const frameRef = useRef<HTMLIFrameElement | null>(null);
  const center = point ?? DEFAULT_POINT;
  const srcDoc = useMemo(() => {
    const lat = Number(center.latitude);
    const lng = Number(center.longitude);
    const marker = point ? `L.marker([${lat},${lng}], {draggable:true}).addTo(map).on('dragend', function(e){ var p=e.target.getLatLng(); window.parent.postMessage({type:'sellspace-map-pick',latitude:p.lat,longitude:p.lng},'*'); });` : '';
    return `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1"><link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"><style>html,body,#map{height:100%;width:100%;margin:0} .hint{position:absolute;z-index:999;bottom:8px;left:8px;background:white;padding:6px 8px;border-radius:6px;font:12px sans-serif;box-shadow:0 1px 5px #777}</style></head><body><div id="map"></div><div class="hint">Tap map to place pin</div><script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script><script>var map=L.map('map').setView([${lat},${lng}],${point ? 15 : 5});L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© OpenStreetMap contributors'}).addTo(map);${marker}map.on('click',function(e){window.parent.postMessage({type:'sellspace-map-pick',latitude:e.latlng.lat,longitude:e.latlng.lng},'*')});</script></body></html>`;
  }, [center.latitude, center.longitude, point]);

  useEffect(() => {
    const listener = (event: MessageEvent) => {
      const data = event.data as Partial<MapPickMessage> | null;
      if (data?.type !== 'sellspace-map-pick') return;
      if (typeof data.latitude !== 'number' || typeof data.longitude !== 'number') return;
      if (!Number.isFinite(data.latitude) || !Number.isFinite(data.longitude)) return;
      onPick({ latitude: data.latitude, longitude: data.longitude });
    };
    window.addEventListener('message', listener);
    return () => window.removeEventListener('message', listener);
  }, [onPick]);

  return (
    <View style={styles.container}>
      {React.createElement('iframe', {
        ref: frameRef,
        title: 'Choose listing location map',
        srcDoc,
        style: { border: 0, width: '100%', height: '100%', display: 'block' },
        sandbox: 'allow-scripts allow-same-origin',
      } as React.IframeHTMLAttributes<HTMLIFrameElement>)}
      <Text style={styles.attribution}>OpenStreetMap</Text>
    </View>
  );
}

const styles = StyleSheet.create({ container: { flex: 1, position: 'relative' }, attribution: { display: 'none' } as any });
