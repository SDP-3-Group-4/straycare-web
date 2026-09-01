import { useLayoutEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Clock,
  Cross,
  LocateFixed,
  MapPin,
  Navigation,
  Star,
} from "lucide-react";
import L from "leaflet";
import {
  MapContainer,
  Marker,
  Polyline,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { CLINICS, type Clinic } from "../../../data/clinics";
import { haversineDistanceKm, formatDistance } from "../../../utils/geo";
import { useUserLocation } from "../../../hooks/useUserLocation";

const RADIUS_KM = 3;

function isOpenNow(clinic: Clinic): boolean {
  const hour = new Date().getHours();
  if (clinic.openHour === 0 && clinic.closeHour === 24) return true;
  return hour >= clinic.openHour && hour < clinic.closeHour;
}

const formatHour = (h24: number) => {
  const h = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h}:00 ${h24 >= 12 ? "PM" : "AM"}`;
};

const userIcon = L.divIcon({
  className: "",
  html: '<div style="width:15px;height:15px;border-radius:9999px;background:#772BFB;border:3px solid #fff;box-shadow:0 0 0 4px rgba(119,43,251,0.25), 0 2px 6px rgba(0,0,0,0.25);"></div>',
  iconSize: [15, 15],
  iconAnchor: [7.5, 7.5],
});

const clinicIcon = L.divIcon({
  className: "",
  html: '<svg width="26" height="34" viewBox="0 0 24 24" style="filter:drop-shadow(0 2px 3px rgba(0,0,0,0.35));"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#772BFB"/><circle cx="12" cy="9" r="3.2" fill="#fff"/></svg>',
  iconSize: [26, 34],
  iconAnchor: [13, 32],
});

const activeClinicIcon = L.divIcon({
  className: "",
  html: '<div style="display:flex;flex-direction:column;align-items:center;"><span style="background:#772BFB;color:#fff;font-weight:700;font-size:10px;padding:1px 7px;border-radius:9999px;box-shadow:0 1px 4px rgba(0,0,0,0.3);margin-bottom:2px;">Selected</span><svg width="30" height="38" viewBox="0 0 24 24" style="filter:drop-shadow(0 2px 4px rgba(0,0,0,0.4));"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#5B21B6"/><circle cx="12" cy="9" r="3.2" fill="#fff"/></svg></div>',
  iconSize: [30, 46],
  iconAnchor: [15, 44],
});

function FitRoute({
  user,
  clinic,
}: {
  user: [number, number];
  clinic: [number, number];
}) {
  const map = useMap();
  const bounds = useMemo(() => L.latLngBounds([user, clinic]), [user, clinic]);
  useLayoutEffect(() => {
    map.fitBounds(bounds, { padding: [22, 22], maxZoom: 15 });
  }, [map, bounds]);
  return null;
}

const googleMapsUrl = (clinic: Clinic) =>
  `https://www.google.com/maps/dir/?api=1&destination=${clinic.lat},${clinic.lng}`;

function RefetchOnClick({ onClick }: { onClick: () => void }) {
  useMapEvents({ click: () => onClick() });
  return null;
}

export default function NearbyClinicsWidget() {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const { location, resolved, error, requestLocation } = useUserLocation();

  const requestWithRetry = () => {
    if (!resolved || error) requestLocation();
  };

  const nearby = useMemo(() => {
    return CLINICS.map((clinic) => ({
      clinic,
      distanceKm: haversineDistanceKm(
        location.lat,
        location.lng,
        clinic.lat,
        clinic.lng,
      ),
    }))
      .filter(({ distanceKm }) => distanceKm <= RADIUS_KM)
      .sort((a, b) => a.distanceKm - b.distanceKm);
  }, [location]);

  if (nearby.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-[var(--sc-border)] overflow-hidden transition-all duration-300">
        <div className="p-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--sc-brand-50)] text-[var(--sc-brand-600)] flex items-center justify-center shrink-0">
              <Cross size={20} />
            </div>
            <h3 className="font-bold text-[var(--sc-text-primary)] text-[15px] leading-tight">
              Nearby Clinics
            </h3>
          </div>
        </div>
        <div className="px-3 pb-3.5 text-[12px] text-gray-500 font-medium">
          No clinics within {RADIUS_KM} km of your location.
        </div>
      </div>
    );
  }

  const active = nearby[activeIndex % nearby.length];
  if (!active) return null;

  const open = isOpenNow(active.clinic);
  const userPos: [number, number] = [location.lat, location.lng];
  const clinicPos: [number, number] = [active.clinic.lat, active.clinic.lng];
  const canCycle = nearby.length > 1;

  return (
    <div className="bg-white rounded-2xl border border-[var(--sc-border)] overflow-hidden transition-all duration-300">
      <div
        className="p-3 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setIsCollapsed(!isCollapsed)}
        role="button"
        aria-expanded={!isCollapsed}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-[var(--sc-brand-50)] text-[var(--sc-brand-600)] flex items-center justify-center shrink-0">
            <Cross size={20} />
          </div>
          <h3 className="font-bold text-[var(--sc-text-primary)] text-[15px] leading-tight">
            Nearby Clinics
          </h3>
        </div>
        <ChevronDown
          size={20}
          className={`text-gray-400 transition-transform duration-300 ${isCollapsed ? "" : "rotate-180"}`}
        />
      </div>

      {!isCollapsed && (
        <div className="px-3 pb-3">
          <div className="relative h-32 rounded-xl overflow-hidden border border-gray-200 z-0">
            <MapContainer
              center={userPos}
              zoom={13}
              maxZoom={18}
              scrollWheelZoom={false}
              zoomControl={false}
              className="w-full h-full"
            >
              <RefetchOnClick onClick={requestWithRetry} />
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              {resolved && <FitRoute user={userPos} clinic={clinicPos} />}
              {resolved && active && (
                <>
                  <Marker position={userPos} icon={userIcon} />
                  {nearby.map(({ clinic }) => (
                    <Marker
                      key={clinic.id}
                      position={[clinic.lat, clinic.lng]}
                      icon={
                        clinic.id === active.clinic.id
                          ? activeClinicIcon
                          : clinicIcon
                      }
                    />
                  ))}
                  <Polyline
                    positions={[userPos, clinicPos]}
                    pathOptions={{
                      color: "#772BFB",
                      weight: 4,
                      dashArray: "10 12",
                      opacity: 0.85,
                    }}
                  />
                </>
              )}
            </MapContainer>

            {/* Radius chip */}
            <span className="absolute top-1.5 left-1.5 z-[1000] bg-white/95 text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-sm text-gray-700">
              Within {RADIUS_KM} km
            </span>

            {/* Location request overlay */}
            {!resolved && (
              <div className="absolute inset-0 z-[1000] flex items-center justify-center bg-[var(--sc-brand-50)]/85 backdrop-blur-[2px]">
                <button
                  onClick={() => requestLocation()}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-[var(--sc-brand-600)] hover:bg-[var(--sc-brand-700)] text-white text-[12px] font-bold rounded-lg shadow-lg transition-colors"
                >
                  <LocateFixed size={14} />
                  Enable location
                </button>
              </div>
            )}
            {resolved && error && (
              <span className="absolute bottom-1.5 left-1.5 z-[1000] bg-red-50/95 text-red-600 text-[10px] font-semibold px-1.5 py-0.5 rounded-full shadow-sm">
                Location unavailable — showing default area
              </span>
            )}
          </div>

          {/* Clinic info — compact, single-line rows */}
          <div className="mt-2 flex items-center gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <h4 className="font-bold text-[var(--sc-text-primary)] text-[14px] leading-snug truncate">
                  {active.clinic.name}
                </h4>
                {open && (
                  <span
                    className="shrink-0 w-2 h-2 rounded-full bg-green-500"
                    aria-label="Open now"
                  />
                )}
                <span className="flex items-center gap-0.5 ml-auto shrink-0 text-[12px] font-bold text-[var(--sc-brand-600)]">
                  <Navigation size={12} />
                  {formatDistance(active.distanceKm)}
                </span>
              </div>
              <p className="flex items-center gap-1 text-[12px] text-gray-500 mt-0.5 truncate">
                <MapPin size={13} className="shrink-0 text-gray-400" />
                {active.clinic.address}
              </p>
              <div className="flex items-center gap-2 mt-0.5 text-[11px]">
                <span className="flex items-center gap-1 font-semibold text-gray-700">
                  <Star size={12} className="fill-amber-400 text-amber-400" />
                  {active.clinic.rating.toFixed(1)}
                </span>
                <span
                  className={`flex items-center gap-1 font-medium ${open ? "text-green-600" : "text-gray-500"}`}
                >
                  <Clock size={12} className={open ? "" : "text-gray-400"} />
                  {open
                    ? `Open till ${formatHour(active.clinic.closeHour)}`
                    : "Closed now"}
                </span>
              </div>
            </div>
            <div className="flex flex-col items-center gap-1 shrink-0">
              <button
                onClick={() =>
                  canCycle && setActiveIndex((i) => (i + 1) % nearby.length)
                }
                disabled={!canCycle}
                aria-label={canCycle ? "Next clinic" : "Only one clinic nearby"}
                title={canCycle ? "Next clinic" : "Only one clinic nearby"}
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors shadow-sm ${
                  canCycle
                    ? "bg-[var(--sc-brand-600)] hover:bg-[var(--sc-brand-700)] text-white cursor-pointer"
                    : "bg-gray-100 text-gray-300 cursor-not-allowed"
                }`}
              >
                <ChevronRight size={18} />
              </button>
              {canCycle && (
                <span className="text-[10px] font-bold text-gray-400 leading-none">
                  {(activeIndex % nearby.length) + 1}/{nearby.length}
                </span>
              )}
            </div>
          </div>

          {/* Open in Google Maps — compact link */}
          <a
            href={googleMapsUrl(active.clinic)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 mt-2 w-full py-2 text-[12px] font-bold text-[var(--sc-brand-700)] bg-[var(--sc-brand-50)] hover:bg-[var(--sc-brand-100)] rounded-lg transition-colors border border-[var(--sc-brand-100)]"
          >
            <Navigation size={13} />
            Open in Google Maps
          </a>
        </div>
      )}
    </div>
  );
}
