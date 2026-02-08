/**
 * Health Records and Document Management Components
 * 
 * This module provides comprehensive health record management including:
 * - Document upload with drag-and-drop
 * - Health record timeline with filtering
 * - Vaccination certificates with certificate styling
 * - Symptom logging with body part selection
 * - Exportable health summaries
 * - Document viewer with zoom, rotation, and annotations
 * - AI assessment result cards
 * - Health record search functionality
 */

export { DocumentUpload } from './DocumentUpload'
export type { DocumentUploadProps } from './DocumentUpload'

export { HealthRecordTimeline } from './HealthRecordTimeline'
export type { HealthRecordTimelineProps } from './HealthRecordTimeline'

export { VaccinationCard, VaccinationList } from './VaccinationCard'
export type { VaccinationCardProps, VaccinationListProps } from './VaccinationCard'

export { SymptomLogger } from './SymptomLogger'
export type { SymptomLoggerProps, SymptomLogData } from './SymptomLogger'

export { HealthSummary } from './HealthSummary'
export type { HealthSummaryProps } from './HealthSummary'

export { DocumentViewer } from './DocumentViewer'
export type { DocumentViewerProps } from './DocumentViewer'

export { AIAssessmentCard } from './AIAssessmentCard'
export type { AIAssessmentCardProps } from './AIAssessmentCard'

export { HealthRecordSearch } from './HealthRecordSearch'
export type { HealthRecordSearchProps } from './HealthRecordSearch'
