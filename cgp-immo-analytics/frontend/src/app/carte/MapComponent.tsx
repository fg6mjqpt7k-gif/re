'use client'

import 'leaflet/dist/leaflet.css'

import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet'
import type { SCPIImmeuble } from '../../lib/data'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TaggedImmeuble extends SCPIImmeuble {
  scpiNom: string
  scpiId: string
}

interface MapComponentProps {
  immeubles: TaggedImmeuble[]
  scpiColors: Record<string, string>
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatEuro(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace('.0', '') + ' M\u00a0\u20ac'
  if (n >= 1_000) return (n / 1_000).toFixed(0) + ' k\u00a0\u20ac'
  return n.toLocaleString('fr-FR') + ' \u20ac'
}

function formatNumber(n: number): string {
  return n.toLocaleString('fr-FR')
}

// ---------------------------------------------------------------------------
// Map Component
// ---------------------------------------------------------------------------

export default function MapComponent({ immeubles, scpiColors }: MapComponentProps) {
  return (
    <MapContainer
      center={[48.5, 8]}
      zoom={5}
      className="leaflet-container h-[600px] w-full"
      style={{ background: '#0B1120' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />
      {immeubles.map((imm, idx) => {
        const color = scpiColors[imm.scpiId] || '#94A3B8'
        return (
          <CircleMarker
            key={`${imm.scpiId}-${imm.nom}-${idx}`}
            center={[imm.lat, imm.lng]}
            radius={8}
            pathOptions={{
              color: color,
              fillColor: color,
              fillOpacity: 0.7,
              weight: 2,
              opacity: 0.9,
            }}
          >
            <Popup>
              <div style={{
                fontFamily: 'system-ui, sans-serif',
                minWidth: 220,
                color: '#1e293b',
              }}>
                <div style={{
                  fontWeight: 700,
                  fontSize: 14,
                  marginBottom: 8,
                  color: '#0f172a',
                  borderBottom: '2px solid ' + color,
                  paddingBottom: 6,
                }}>
                  {imm.nom}
                </div>
                <div style={{ fontSize: 12, lineHeight: 1.8 }}>
                  <div><strong>Adresse:</strong> {imm.adresse}, {imm.ville}</div>
                  <div><strong>Type:</strong> {imm.type}</div>
                  <div><strong>Surface:</strong> {formatNumber(imm.surface)} m&sup2;</div>
                  <div><strong>Locataire:</strong> {imm.locataire}</div>
                  <div><strong>Loyer annuel:</strong> {formatEuro(imm.loyer)}</div>
                  <div style={{
                    marginTop: 6,
                    paddingTop: 6,
                    borderTop: '1px solid #e2e8f0',
                  }}>
                    <span style={{
                      display: 'inline-block',
                      padding: '2px 8px',
                      borderRadius: 6,
                      backgroundColor: color + '20',
                      color: color,
                      fontWeight: 600,
                      fontSize: 11,
                    }}>
                      {imm.scpiNom}
                    </span>
                  </div>
                </div>
              </div>
            </Popup>
          </CircleMarker>
        )
      })}
    </MapContainer>
  )
}
