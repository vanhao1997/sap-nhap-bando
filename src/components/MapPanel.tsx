import { useEffect, useMemo } from 'react'
import L from 'leaflet'
import type { Feature, FeatureCollection } from 'geojson'
import { GeoJSON as GeoJsonLayer, MapContainer, Marker, TileLayer, Tooltip, useMap } from 'react-leaflet'
import type { AdminUnit } from '../types'

interface MapPanelProps {
  selectedUnit: AdminUnit | null
  provinceGeo: FeatureCollection
}

const DEFAULT_CENTER: L.LatLngExpression = [16.2, 106.8]
const markerIcon = L.divIcon({
  className: 'selected-marker',
  html: '<span></span>',
  iconSize: [22, 22],
  iconAnchor: [11, 11],
})

export function MapPanel({ selectedUnit, provinceGeo }: MapPanelProps) {
  const selectedProvinceCode = selectedUnit?.kind === 'province' ? selectedUnit.ma : selectedUnit?.parent_ma
  const selectedFeature = useMemo(() => {
    if (!selectedProvinceCode) return null
    return provinceGeo.features.find((feature) => {
      const properties = feature.properties as { ma?: string } | null
      return properties?.ma === selectedProvinceCode
    }) ?? null
  }, [provinceGeo.features, selectedProvinceCode])

  const markerPosition = selectedUnit?.centroid_lat && selectedUnit.centroid_lon
    ? ([selectedUnit.centroid_lat, selectedUnit.centroid_lon] as L.LatLngExpression)
    : null

  return (
    <section className="map-panel" aria-label="Bản đồ hành chính">
      <div className="map-toolbar">
        <div>
          <h2>Bản đồ</h2>
          <p>{selectedUnit ? selectedUnit.ten : 'Chọn đơn vị để định vị'}</p>
        </div>
        <span>{selectedUnit?.kind === 'province' ? 'Polygon tỉnh' : 'Centroid xã/phường'}</span>
      </div>

      <MapContainer
        center={DEFAULT_CENTER}
        className="map-canvas"
        zoom={5}
        minZoom={5}
        maxZoom={12}
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <GeoJsonLayer
          key={selectedProvinceCode ?? 'all-provinces'}
          data={provinceGeo}
          style={(feature) => {
            const properties = feature?.properties as { ma?: string } | undefined
            const selected = Boolean(selectedProvinceCode && properties?.ma === selectedProvinceCode)
            return {
              color: selected ? '#0f766e' : '#6b8aa6',
              fillColor: selected ? '#2dd4bf' : '#d8e8f0',
              fillOpacity: selected ? 0.52 : 0.2,
              opacity: selected ? 0.95 : 0.45,
              weight: selected ? 2.4 : 0.8,
            }
          }}
        />
        {markerPosition ? (
          <Marker icon={markerIcon} position={markerPosition}>
            <Tooltip direction="top" offset={[0, -12]} opacity={1} permanent={selectedUnit?.kind === 'commune'}>
              {selectedUnit?.ten}
            </Tooltip>
          </Marker>
        ) : null}
        <FitSelection feature={selectedFeature} position={markerPosition} selectedUnit={selectedUnit} />
      </MapContainer>
    </section>
  )
}

function FitSelection({
  feature,
  position,
  selectedUnit,
}: {
  feature: Feature | null
  position: L.LatLngExpression | null
  selectedUnit: AdminUnit | null
}) {
  const map = useMap()

  useEffect(() => {
    if (!selectedUnit) return

    if (selectedUnit.kind === 'province' && feature) {
      const bounds = L.geoJSON(feature).getBounds()
      if (bounds.isValid()) {
        map.fitBounds(bounds, { animate: true, padding: [34, 34], maxZoom: 8 })
        return
      }
    }

    if (position) {
      map.flyTo(position, selectedUnit.kind === 'commune' ? 10 : 7, { animate: true, duration: 0.65 })
    }
  }, [feature, map, position, selectedUnit])

  return null
}
