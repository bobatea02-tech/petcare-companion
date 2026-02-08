import React from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import type { Vaccination } from '@/types/health'

export interface VaccinationCardProps {
  vaccination: Vaccination
  className?: string
}

export const VaccinationCard: React.FC<VaccinationCardProps> = ({
  vaccination,
  className,
}) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const isExpiringSoon = () => {
    if (!vaccination.expiration_date) return false
    const expirationDate = new Date(vaccination.expiration_date)
    const today = new Date()
    const daysUntilExpiration = Math.floor(
      (expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    )
    return daysUntilExpiration <= 30 && daysUntilExpiration > 0
  }

  const isExpired = () => {
    if (!vaccination.expiration_date) return false
    return new Date(vaccination.expiration_date) < new Date()
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'relative bg-gradient-to-br from-white to-gray-50 rounded-xl p-6 border-2 shadow-lg',
        isExpired()
          ? 'border-red-300'
          : isExpiringSoon()
          ? 'border-yellow-300'
          : 'border-green-300',
        className
      )}
    >
      {/* Certificate Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
            <svg
              className="w-6 h-6 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">
              Vaccination Certificate
            </h3>
            <p className="text-sm text-gray-500">Official Record</p>
          </div>
        </div>

        {/* Status Badge */}
        {isExpired() ? (
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
            Expired
          </span>
        ) : isExpiringSoon() ? (
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700">
            Expiring Soon
          </span>
        ) : (
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
            Valid
          </span>
        )}
      </div>

      {/* Decorative Border */}
      <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-green-400 via-blue-400 to-purple-400 rounded-t-xl" />

      {/* Vaccine Information */}
      <div className="space-y-3 mb-4">
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
            Vaccine Name
          </p>
          <p className="text-xl font-bold text-gray-900">
            {vaccination.vaccine_name}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
              Type
            </p>
            <p className="text-sm font-medium text-gray-900">
              {vaccination.vaccine_type}
            </p>
          </div>

          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
              Administered Date
            </p>
            <p className="text-sm font-medium text-gray-900">
              {formatDate(vaccination.administered_date)}
            </p>
          </div>
        </div>

        {vaccination.expiration_date && (
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
              Expiration Date
            </p>
            <p className="text-sm font-medium text-gray-900">
              {formatDate(vaccination.expiration_date)}
            </p>
          </div>
        )}

        {vaccination.next_due_date && (
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
              Next Due Date
            </p>
            <p className="text-sm font-medium text-primary-600">
              {formatDate(vaccination.next_due_date)}
            </p>
          </div>
        )}
      </div>

      {/* Veterinarian Information */}
      {vaccination.veterinarian && (
        <div className="pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
            Administered By
          </p>
          <p className="text-sm font-medium text-gray-900">
            {vaccination.veterinarian}
          </p>
        </div>
      )}

      {/* Batch Number */}
      {vaccination.batch_number && (
        <div className="mt-3">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
            Batch Number
          </p>
          <p className="text-xs font-mono text-gray-700 bg-gray-100 px-2 py-1 rounded inline-block">
            {vaccination.batch_number}
          </p>
        </div>
      )}

      {/* Decorative Paw Print Watermark */}
      <div className="absolute bottom-4 right-4 opacity-5">
        <svg
          className="w-20 h-20"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M12 2C10.9 2 10 2.9 10 4C10 5.1 10.9 6 12 6C13.1 6 14 5.1 14 4C14 2.9 13.1 2 12 2M7 7C5.9 7 5 7.9 5 9C5 10.1 5.9 11 7 11C8.1 11 9 10.1 9 9C9 7.9 8.1 7 7 7M17 7C15.9 7 15 7.9 15 9C15 10.1 15.9 11 17 11C18.1 11 19 10.1 19 9C19 7.9 18.1 7 17 7M12 10C9.8 10 8 11.8 8 14C8 16.2 9.8 18 12 18C14.2 18 16 16.2 16 14C16 11.8 14.2 10 12 10Z" />
        </svg>
      </div>
    </motion.div>
  )
}

export interface VaccinationListProps {
  vaccinations: Vaccination[]
  className?: string
}

export const VaccinationList: React.FC<VaccinationListProps> = ({
  vaccinations,
  className,
}) => {
  const sortedVaccinations = [...vaccinations].sort(
    (a, b) =>
      new Date(b.administered_date).getTime() -
      new Date(a.administered_date).getTime()
  )

  return (
    <div className={cn('grid gap-6 md:grid-cols-2', className)}>
      {sortedVaccinations.map((vaccination) => (
        <VaccinationCard key={vaccination.id} vaccination={vaccination} />
      ))}
    </div>
  )
}
