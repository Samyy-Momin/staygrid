"use client";

import React, { useEffect, useRef, useState } from "react";

interface MapSelectorProps {
  latitude: number;
  longitude: number;
  onChange?: (lat: number, lng: number) => void;
}

const GOOGLE_MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
const DEFAULT_CENTER = { lat: 18.5204, lng: 73.8567 };

export default function MapSelector({ latitude, longitude, onChange }: MapSelectorProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const onChangeRef = useRef(onChange);
  const [error, setError] = useState("");

  useEffect(() => { onChangeRef.current = onChange; }, [onChange]);

  useEffect(() => {
    if (!mapContainer.current) return;
    if (!GOOGLE_MAPS_KEY) {
      setError("Set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to enable the location map.");
      return;
    }

    let disposed = false;
    const initMap = () => {
      if (disposed || !mapContainer.current || !(window as any).google?.maps) return;
      const googleMaps = (window as any).google.maps;
      const initial = {
        lat: Number(latitude) || DEFAULT_CENTER.lat,
        lng: Number(longitude) || DEFAULT_CENTER.lng,
      };
      const map = new googleMaps.Map(mapContainer.current, {
        center: initial,
        zoom: 12,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        clickableIcons: false,
      });
      const marker = new googleMaps.Marker({ position: initial, map, draggable: true });
      map.addListener("click", (event: any) => {
        if (!event.latLng) return;
        marker.setPosition(event.latLng);
        onChangeRef.current?.(event.latLng.lat(), event.latLng.lng());
      });
      marker.addListener("dragend", () => {
        const position = marker.getPosition();
        if (position) onChangeRef.current?.(position.lat(), position.lng());
      });
      mapRef.current = map;
      markerRef.current = marker;
      setError("");
    };

    const existing = document.getElementById("staygrid-google-maps") as HTMLScriptElement | null;
    if ((window as any).google?.maps) {
      initMap();
    } else if (existing) {
      existing.addEventListener("load", initMap, { once: true });
      existing.addEventListener("error", () => setError("Google Maps could not load. Check API access and billing."), { once: true });
    } else {
      const script = document.createElement("script");
      script.id = "staygrid-google-maps";
      script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(GOOGLE_MAPS_KEY)}&loading=async`;
      script.async = true;
      script.onload = initMap;
      script.onerror = () => setError("Google Maps could not load. Check API access and billing.");
      document.head.appendChild(script);
    }

    return () => {
      disposed = true;
      const maps = (window as any).google?.maps;
      if (maps && mapRef.current) maps.event.clearInstanceListeners(mapRef.current);
      if (maps && markerRef.current) maps.event.clearInstanceListeners(markerRef.current);
      mapRef.current = null;
      markerRef.current = null;
      if (mapContainer.current) mapContainer.current.replaceChildren();
    };
    // Map listeners use the initial coordinate and the latest onChange callback.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!mapRef.current || !markerRef.current) return;
    const center = { lat: Number(latitude) || DEFAULT_CENTER.lat, lng: Number(longitude) || DEFAULT_CENTER.lng };
    markerRef.current.setPosition(center);
    mapRef.current.panTo(center);
    mapRef.current.setZoom(14);
  }, [latitude, longitude]);

  return (
    <div className="relative h-80 w-full overflow-hidden rounded-md border border-border">
      <div ref={mapContainer} className="h-full w-full" />
      {error && <div className="absolute inset-0 grid place-items-center bg-surface/95 p-6 text-center text-sm text-danger">{error}</div>}
      <div className="absolute left-2 top-2">
        <button
          type="button"
          onClick={() => {
            if (!navigator.geolocation) return setError("Location access is not available in this browser.");
            navigator.geolocation.getCurrentPosition(
              ({ coords }) => onChangeRef.current?.(coords.latitude, coords.longitude),
              () => setError("Location permission is unavailable. You can select a point on the map."),
              { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 },
            );
          }}
          className="rounded-md border border-border bg-surface px-3 py-2 text-sm font-medium text-primary shadow-md"
        >
          Use My Current Location
        </button>
      </div>
      <div className="pointer-events-none absolute bottom-2 left-2 rounded bg-surface/90 px-2 py-1 font-mono text-xs text-primary shadow-sm">
        {Number(latitude || DEFAULT_CENTER.lat).toFixed(4)}, {Number(longitude || DEFAULT_CENTER.lng).toFixed(4)}
      </div>
    </div>
  );
}
