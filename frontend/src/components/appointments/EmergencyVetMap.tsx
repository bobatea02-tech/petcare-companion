/**
 * EmergencyVetMap Component
 * Interactive map for emergency vet locations with paw markers and clustering
 */
'use client'

import React, { useState, useEffect } from 'react'
import { VetClinic } from '@/types/appointments'
import { colors, borderRadius, spacing, shadows } from '@/lib/design-tokens'

interface EmergencyVetMapProps {
  clinics: VetClinic[]
  userLocation?: { latitude: number; longitude: number }
  onClinicSelect?: (clinic: VetClinic) => void
  height?: string
}

export const EmergencyVetMap: React.FC<EmergencyVetMapProps> = ({
  clinics,
  userLocation,
  onClinicSelect,
  height = '500px',
}) => {
  const [selectedClinic, setSelectedClinic] = useState<VetClinic | null>(null)
  const [mapLoaded, setMapLoaded] = useState(false)

  // Note: In a real implementation, you would integrate with Google Maps API
  // This is a simplified version showing the UI structure

  const handleClinicClick = (clinic: VetClinic) => {
    setSelectedClinic(clinic)
    onClinicSelect && onClinicSelect(clinic)
  }

  const getDirections = (clinic: VetClinic) => {
    if (clinic.latitude && clinic.longitude) {
      // Open in Google Maps
      const url = `https://www.google.com/maps/dir/?api=1&destination=${clinic.latitude},${clinic.longitude}`
      window.open(url, '_blank')
    } else if (clinic.address) {
      // Fallback to address search
      const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(clinic.address)}`
      window.open(url, '_blank')
    }
  }

  const getAppleMapsDirections = (clinic: VetClinic) => {
    if (clinic.latitude && clinic.longitude) {
      const url = `http://maps.apple.com/?daddr=${clinic.latitude},${clinic.longitude}`
      window.open(url, '_blank')
    } else if (clinic.address) {
      const url = `http://maps.apple.com/?address=${encodeURIComponent(clinic.address)}`
      window.open(url, '_blank')
    }
  }

  return (
    <div style={{ position: 'relative' }}>
      {/* Map Container */}
      <div
        style={{
          height,
          backgroundColor: '#f3f4f6',
          borderRadius: borderRadius.lg,
          overflow: 'hidden',
          position: 'relative',
          boxShadow: shadows.md,
        }}
      >
        {/* Placeholder for actual map integration */}
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            gap: spacing.md,
            padding: spacing.xl,
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '4rem' }}>🗺️</div>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#111827', margin: `0 0 ${spacing.sm} 0` }}>
              Emergency Vet Map
            </h3>
            <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>
              {clinics.length} emergency vet clinic{clinics.length !== 1 ? 's' : ''} found nearby
            </p>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#9ca3af', maxWidth: '400px' }}>
            In production, this would display an interactive Google Maps view with paw print markers for each clinic.
            Click on clinics below to get directions.
          </div>
        </div>

        {/* User Location Marker */}
        {userLocation && (
          <div
            style={{
              position: 'absolute',
              top: spacing.md,
              right: spacing.md,
              backgroundColor: colors.secondary[500],
              color: 'white',
              padding: spacing.sm,
              borderRadius: borderRadius.md,
              fontSize: '0.75rem',
              fontWeight: 600,
              boxShadow: shadows.md,
            }}
          >
            📍 Your Location
          </div>
        )}
      </div>

      {/* Clinic List Overlay */}
      <div
        style={{
          marginTop: spacing.md,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: spacing.md,
        }}
      >
        {clinics.map((clinic) => (
          <div
            key={clinic.id}
            onClick={() => handleClinicClick(clinic)}
            style={{
              backgroundColor: 'white',
              borderRadius: borderRadius.lg,
              padding: spacing.md,
              boxShadow: shadows.md,
              border: selectedClinic?.id === clinic.id ? `2px solid ${colors.primary[500]}` : '1px solid #e5e7eb',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {/* Clinic Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.sm }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: spacing.xs, marginBottom: spacing.xs }}>
                  <span style={{ fontSize: '1.5rem' }}>🐾</span>
                  <h4 style={{ fontSize: '1rem', fontWeight: 600, color: '#111827', margin: 0 }}>
                    {clinic.name}
                  </h4>
                </div>
                {clinic.distance_miles !== undefined && (
                  <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                    📍 {clinic.distance_miles.toFixed(1)} miles away
                  </div>
                )}
              </div>
              {clinic.rating && (
                <div
                  style={{
                    backgroundColor: colors.accent[50],
                    color: colors.accent[700],
                    padding: `${spacing.xs} ${spacing.sm}`,
                    borderRadius: borderRadius.md,
                    fontSize: '0.75rem',
                    fontWeight: 600,
                  }}
                >
                  ⭐ {clinic.rating.toFixed(1)}
                </div>
              )}
            </div>

            {/* Badges */}
            <div style={{ display: 'flex', gap: spacing.xs, marginBottom: spacing.sm, flexWrap: 'wrap' }}>
              {clinic.is_emergency && (
                <span
                  style={{
                    backgroundColor: '#fee2e2',
                    color: '#991b1b',
                    padding: `2px ${spacing.xs}`,
                    borderRadius: borderRadius.sm,
                    fontSize: '0.625rem',
                    fontWeight: 600,
                  }}
                >
                  🚨 EMERGENCY
                </span>
              )}
              {clinic.is_24_hour && (
                <span
                  style={{
                    backgroundColor: colors.secondary[50],
                    color: colors.secondary[700],
                    padding: `2px ${spacing.xs}`,
                    borderRadius: borderRadius.sm,
                    fontSize: '0.625rem',
                    fontWeight: 600,
                  }}
                >
                  🕐 24/7
                </span>
              )}
            </div>

            {/* Address */}
            <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: spacing.sm }}>
              {clinic.address}
            </div>

            {/* Contact */}
            <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: spacing.md }}>
              📞 {clinic.phone_number}
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: spacing.xs }}>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  getDirections(clinic)
                }}
                style={{
                  flex: 1,
                  backgroundColor: colors.secondary[500],
                  color: 'white',
                  padding: spacing.sm,
                  borderRadius: borderRadius.md,
                  border: 'none',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                🗺️ Google Maps
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  getAppleMapsDirections(clinic)
                }}
                style={{
                  flex: 1,
                  backgroundColor: '#374151',
                  color: 'white',
                  padding: spacing.sm,
                  borderRadius: borderRadius.md,
                  border: 'none',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                🍎 Apple Maps
              </button>
            </div>
          </div>
        ))}
      </div>

      {clinics.length === 0 && (
        <div
          style={{
            textAlign: 'center',
            padding: spacing.xl,
            color: '#6b7280',
          }}
        >
          <div style={{ fontSize: '3rem', marginBottom: spacing.md }}>🔍</div>
          <p style={{ fontSize: '1rem', fontWeight: 500 }}>No emergency vet clinics found</p>
          <p style={{ fontSize: '0.875rem' }}>Try expanding your search radius</p>
        </div>
      )}
    </div>
  )
}
