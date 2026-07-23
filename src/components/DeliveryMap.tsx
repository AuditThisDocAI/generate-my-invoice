import React, { useEffect, useState } from 'react';
import { APIProvider, Map, AdvancedMarker, Pin, useMap, useMapsLibrary, MapMouseEvent } from '@vis.gl/react-google-maps';

const API_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
  '';
const hasValidKey = Boolean(API_KEY) && API_KEY !== 'YOUR_API_KEY';

function MapContent({ address, originAddress }: { address: string, originAddress?: string }) {
  const placesLib = useMapsLibrary('places');
  const map = useMap();
  const [destinationLoc, setDestinationLoc] = useState<google.maps.LatLngLiteral | null>(null);
  const [originLoc, setOriginLoc] = useState<google.maps.LatLngLiteral | null>(null);
  const [polyline, setPolyline] = useState<google.maps.Polyline | null>(null);

  useEffect(() => {
    if (!map) return;
    const pl = new google.maps.Polyline({
      strokeColor: '#4F46E5',
      strokeOpacity: 0.8,
      strokeWeight: 4,
      geodesic: true,
    });
    setPolyline(pl);
    return () => pl.setMap(null);
  }, [map]);

  useEffect(() => {
    if (!placesLib || !address || !map) {
      setDestinationLoc(null);
      return;
    }
    placesLib.Place.searchByText({
      textQuery: address,
      fields: ['location'],
      maxResultCount: 1,
    }).then(({ places }) => {
      if (places && places.length > 0 && places[0].location) {
        const loc = {
          lat: places[0].location.lat(),
          lng: places[0].location.lng()
        };
        setDestinationLoc(loc);
      }
    }).catch(err => {
      console.error("Geocoding failed:", err);
    });
  }, [placesLib, address, map]);

  useEffect(() => {
    if (!placesLib || !originAddress || !map) {
      setOriginLoc(null);
      return;
    }
    placesLib.Place.searchByText({
      textQuery: originAddress,
      fields: ['location'],
      maxResultCount: 1,
    }).then(({ places }) => {
      if (places && places.length > 0 && places[0].location) {
        const loc = {
          lat: places[0].location.lat(),
          lng: places[0].location.lng()
        };
        setOriginLoc(loc);
      }
    }).catch(err => {
      console.error("Geocoding failed:", err);
    });
  }, [placesLib, originAddress, map]);

  useEffect(() => {
    if (!map) return;
    
    if (destinationLoc && originLoc) {
      if (polyline) {
        polyline.setPath([originLoc, destinationLoc]);
        polyline.setMap(map);
      }
      const bounds = new google.maps.LatLngBounds();
      bounds.extend(originLoc);
      bounds.extend(destinationLoc);
      map.fitBounds(bounds, 50);
    } else if (destinationLoc) {
      if (polyline) polyline.setMap(null);
      map.setCenter(destinationLoc);
      map.setZoom(15);
    } else if (originLoc) {
      if (polyline) polyline.setMap(null);
      map.setCenter(originLoc);
      map.setZoom(15);
    } else {
      if (polyline) polyline.setMap(null);
    }
  }, [map, destinationLoc, originLoc, polyline]);

  return (
    <>
      {originLoc && (
        <AdvancedMarker position={originLoc}>
          <Pin background="#10B981" glyphColor="#fff" borderColor="#059669" />
        </AdvancedMarker>
      )}
      {destinationLoc && (
        <AdvancedMarker position={destinationLoc}>
          <Pin background="#4F46E5" glyphColor="#fff" borderColor="#4338CA" />
        </AdvancedMarker>
      )}
    </>
  );
}

function TrafficLayerComponent({ show }: { show: boolean }) {
  const map = useMap();
  const [layer, setLayer] = useState<google.maps.TrafficLayer | null>(null);

  useEffect(() => {
    if (!map) return;
    const tl = new google.maps.TrafficLayer();
    setLayer(tl);
    return () => {
      tl.setMap(null);
    };
  }, [map]);

  useEffect(() => {
    if (!layer || !map) return;
    layer.setMap(show ? map : null);
  }, [layer, show, map]);

  return null;
}

function MapZoomAnimator({ zoomLevel }: { zoomLevel: number }) {
  const map = useMap();
  useEffect(() => {
    if (map && map.getZoom() !== zoomLevel) {
      map.moveCamera({ zoom: zoomLevel });
    }
  }, [map, zoomLevel]);
  return null;
}

export function DeliveryMap({ address, originAddress }: { address: string, originAddress?: string }) {
  const [mapType, setMapType] = useState<string>('roadmap');
  const [showTraffic, setShowTraffic] = useState<boolean>(false);
  const [searchInput, setSearchInput] = useState<string>('');
  const [currentAddress, setCurrentAddress] = useState<string>(address);
  const [customStops, setCustomStops] = useState<google.maps.LatLngLiteral[]>([]);
  const [zoomLevel, setZoomLevel] = useState<number>(2);

  useEffect(() => {
    setCurrentAddress(address);
  }, [address]);

  const handleMapClick = (e: MapMouseEvent) => {
    if (e.detail.latLng) {
      setCustomStops(prev => [...prev, e.detail.latLng!]);
    }
  };

  if (!hasValidKey) {
    return (
      <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 text-center">
        <h4 className="text-[11px] font-bold text-zinc-800 mb-1.5 uppercase tracking-wide">Google Maps API Key Required</h4>
        <p className="text-[9px] text-zinc-600 mb-2 leading-relaxed">Add a Google Maps Platform key to visualize delivery destinations.</p>
        <ol className="text-[9.5px] text-zinc-600 text-left list-decimal list-inside mx-auto max-w-sm space-y-1">
          <li>Get an API key from Google Cloud Console</li>
          <li>Open <strong>Settings</strong> (⚙️) → <strong>Secrets</strong></li>
          <li>Add <code>GOOGLE_MAPS_PLATFORM_KEY</code></li>
          <li>Paste your key and press Enter</li>
        </ol>
      </div>
    );
  }

  // A custom dark JSON style to ensure map renders dark even if colorScheme="DARK" is unsupported on this mapId
  const darkMapStyle = [
    { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
    { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
    { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
    { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
    { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
    { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#263c3f" }] },
    { featureType: "poi.park", elementType: "labels.text.fill", stylers: [{ color: "#6b9a76" }] },
    { featureType: "road", elementType: "geometry", stylers: [{ color: "#38414e" }] },
    { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#212a37" }] },
    { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#9ca5b3" }] },
    { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#746855" }] },
    { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#1f2835" }] },
    { featureType: "road.highway", elementType: "labels.text.fill", stylers: [{ color: "#f3d19c" }] },
    { featureType: "transit", elementType: "geometry", stylers: [{ color: "#2f3948" }] },
    { featureType: "transit.station", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
    { featureType: "water", elementType: "geometry", stylers: [{ color: "#17263c" }] },
    { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#515c6d" }] },
    { featureType: "water", elementType: "labels.text.stroke", stylers: [{ color: "#17263c" }] }
  ];

  const handleSearch = () => {
    if (searchInput.trim()) {
      setCurrentAddress(searchInput.trim());
    }
  };

  return (
    <div className="w-full mt-3 flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleSearch();
            }
          }}
          placeholder="Search location to center map..."
          className="flex-1 text-xs p-2.5 rounded-xl border border-zinc-200 bg-white focus:border-indigo-500 focus:outline-none"
        />
        <button
          onClick={handleSearch}
          type="button"
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-[10.5px] font-bold transition-colors shadow-sm"
        >
          Search
        </button>
      </div>

      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider">Live Traffic Layer</span>
        <button
          onClick={() => setShowTraffic(!showTraffic)}
          className={`relative inline-flex h-4 w-8 items-center rounded-full transition-colors ${showTraffic ? 'bg-amber-500' : 'bg-zinc-300'}`}
          title="Toggle live traffic congestion data"
        >
          <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${showTraffic ? 'translate-x-4' : 'translate-x-1'}`} />
        </button>
      </div>
      
      {!currentAddress ? (
        <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 text-center h-[250px] flex items-center justify-center">
          <p className="text-[11px] font-medium text-zinc-500 flex flex-col items-center gap-2">
            <span className="text-lg">📍</span>
            Provide a recipient address or search to view the delivery map.
          </p>
        </div>
      ) : (
        <div className="relative w-full" id="delivery-map-container">
          <div className="absolute top-2 right-2 z-10 bg-zinc-900/90 backdrop-blur-md border border-zinc-700/50 p-1 rounded-lg flex items-center gap-1 shadow-lg">
            {customStops.length > 0 && (
              <>
                <button
                  onClick={() => setCustomStops([])}
                  className="px-3 py-1.5 text-[9.5px] font-black tracking-wider uppercase rounded-md transition-colors text-red-400 hover:text-red-300 hover:bg-zinc-800"
                >
                  Clear Stops ({customStops.length})
                </button>
                <div className="w-px h-4 bg-zinc-700 mx-1"></div>
              </>
            )}
            <button
              onClick={() => setMapType('roadmap')}
              className={`px-3 py-1.5 text-[9.5px] font-black tracking-wider uppercase rounded-md transition-colors ${mapType === 'roadmap' ? 'bg-indigo-600 text-white' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'}`}
            >
              Roadmap
            </button>
            <button
              onClick={() => setMapType('satellite')}
              className={`px-3 py-1.5 text-[9.5px] font-black tracking-wider uppercase rounded-md transition-colors ${mapType === 'satellite' ? 'bg-indigo-600 text-white' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'}`}
            >
              Satellite
            </button>
          </div>
          <div className="absolute bottom-6 left-2 z-10 bg-zinc-900/90 backdrop-blur-md border border-zinc-700/50 p-2.5 rounded-lg shadow-lg pointer-events-none">
            <h5 className="text-[9.5px] font-black uppercase tracking-widest text-zinc-400 mb-1.5">Map Legend</h5>
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-[#10B981] border border-[#059669]"></div>
                <span className="text-[10px] text-zinc-300 font-medium">Origin</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-[#4F46E5] border border-[#4338CA]"></div>
                <span className="text-[10px] text-zinc-300 font-medium">Destination</span>
              </div>
              {customStops.length > 0 && (
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#F59E0B] border border-[#D97706]"></div>
                  <span className="text-[10px] text-zinc-300 font-medium">Custom Stop</span>
                </div>
              )}
              <div className="flex items-center gap-2 mt-0.5">
                <div className="w-2.5 h-[3px] rounded-full bg-[#4F46E5]"></div>
                <span className="text-[10px] text-zinc-300 font-medium">Route Path</span>
              </div>
              {showTraffic && (
                <div className="flex items-center gap-2 mt-0.5">
                   <div className="flex gap-0.5">
                      <div className="w-1 h-2 rounded-sm bg-[#84E184]"></div>
                      <div className="w-1 h-2 rounded-sm bg-[#FFB732]"></div>
                      <div className="w-1 h-2 rounded-sm bg-[#FF3232]"></div>
                   </div>
                   <span className="text-[10px] text-zinc-300 font-medium">Live Traffic</span>
                </div>
              )}
            </div>
          </div>
          <div className="absolute bottom-6 right-2 z-10 bg-zinc-900/90 backdrop-blur-md border border-zinc-700/50 p-2.5 rounded-lg shadow-lg flex items-center gap-3">
            <span className="text-[9.5px] font-black uppercase tracking-widest text-zinc-400">Zoom</span>
            <input 
              type="range" 
              min="1" 
              max="20" 
              value={zoomLevel} 
              onChange={(e) => setZoomLevel(Number(e.target.value))} 
              className="w-24 h-1.5 bg-zinc-700 rounded-full appearance-none outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:bg-indigo-500 [&::-webkit-slider-thumb]:rounded-full cursor-pointer"
            />
          </div>
          <div className="rounded-xl overflow-hidden border border-zinc-800 h-[250px] relative w-full shadow-sm bg-zinc-950">
            <APIProvider apiKey={API_KEY} version="weekly">
              <Map
                defaultCenter={{ lat: 37.42, lng: -122.08 }}
                defaultZoom={2}
                onZoomChanged={(e) => setZoomLevel(e.detail.zoom)}
                mapId="DELIVERY_DESTINATION_MAP"
                mapTypeId={mapType}
                colorScheme={"DARK"}
                styles={darkMapStyle}
                internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
                gestureHandling="cooperative"
                disableDefaultUI={true}
                style={{ width: '100%', height: '100%' }}
                onClick={handleMapClick}
              >
                <MapZoomAnimator zoomLevel={zoomLevel} />
                <MapContent address={currentAddress} originAddress={originAddress} />
                <TrafficLayerComponent show={showTraffic} />
                {customStops.map((stop, i) => (
                  <AdvancedMarker key={`stop-${i}`} position={stop}>
                    <Pin background="#F59E0B" glyphColor="#fff" borderColor="#D97706" />
                  </AdvancedMarker>
                ))}
              </Map>
            </APIProvider>
          </div>
        </div>
      )}
    </div>
  );
}
