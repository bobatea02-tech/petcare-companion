'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {
  DocumentUpload,
  HealthRecordTimeline,
  VaccinationList,
  SymptomLogger,
  HealthSummary,
  DocumentViewer,
  AIAssessmentCard,
  HealthRecordSearch,
} from '@/components/health'
import { Button } from '@/components/ui/Button'
import type {
  HealthRecord,
  Vaccination,
  AIAssessment,
  Document,
  HealthSummary as HealthSummaryType,
  SymptomLogData,
} from '@/types/health'

export default function HealthRecordsPage() {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'records' | 'vaccinations' | 'documents' | 'symptoms' | 'summary'
  >('overview')
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null)
  const [selectedPetId] = useState('pet-123') // This would come from context/state

  // Mock data - in real app, this would come from API
  const mockHealthRecords: HealthRecord[] = [
    {
      id: '1',
      pet_id: 'pet-123',
      record_date: '2024-02-01',
      record_type: 'checkup',
      description: 'Annual wellness exam',
      veterinarian: 'Dr. Sarah Johnson',
      diagnosis: 'Healthy, no concerns',
      treatment_plan: 'Continue current diet and exercise routine',
      created_at: '2024-02-01T10:00:00Z',
    },
    {
      id: '2',
      pet_id: 'pet-123',
      record_date: '2024-01-15',
      record_type: 'vaccination',
      description: 'Rabies vaccination',
      veterinarian: 'Dr. Sarah Johnson',
      created_at: '2024-01-15T14:30:00Z',
    },
  ]

  const mockVaccinations: Vaccination[] = [
    {
      id: '1',
      pet_id: 'pet-123',
      vaccine_name: 'Rabies',
      vaccine_type: 'Core',
      administered_date: '2024-01-15',
      expiration_date: '2027-01-15',
      veterinarian: 'Dr. Sarah Johnson',
      batch_number: 'RB-2024-001',
      next_due_date: '2027-01-15',
    },
    {
      id: '2',
      pet_id: 'pet-123',
      vaccine_name: 'DHPP',
      vaccine_type: 'Core',
      administered_date: '2024-01-15',
      expiration_date: '2025-01-15',
      veterinarian: 'Dr. Sarah Johnson',
      batch_number: 'DHPP-2024-002',
      next_due_date: '2025-01-15',
    },
  ]

  const mockAIAssessment: AIAssessment = {
    id: '1',
    pet_id: 'pet-123',
    symptoms_reported: 'Vomiting, lethargy, loss of appetite',
    triage_level: 'yellow',
    ai_analysis:
      'Based on the reported symptoms, your pet may be experiencing gastrointestinal distress. The combination of vomiting and loss of appetite warrants veterinary attention.',
    recommendations:
      'Schedule a veterinary appointment within 24-48 hours. Monitor for additional symptoms such as diarrhea or fever. Ensure your pet stays hydrated.',
    model_used: 'GPT-4 Turbo',
    confidence_score: 0.87,
    created_at: '2024-02-05T09:30:00Z',
  }

  const mockHealthSummary: HealthSummaryType = {
    pet_id: 'pet-123',
    pet_name: 'Max',
    summary_date: '2024-02-07',
    recent_symptoms: [],
    recent_vaccinations: mockVaccinations,
    active_medications: [
      {
        id: '1',
        medication_name: 'Heartgard Plus',
        dosage: '1 tablet',
        frequency: 'Monthly',
        administration_instructions: 'Give with food',
      },
    ],
    recent_appointments: [
      {
        id: '1',
        appointment_date: '2024-02-01',
        purpose: 'Annual wellness exam',
        clinic_name: 'Happy Paws Veterinary Clinic',
        veterinarian: 'Dr. Sarah Johnson',
      },
    ],
    ai_insights:
      'Max is in excellent health overall. All vaccinations are up to date, and recent checkup showed no concerns. Continue current preventive care routine.',
    recommendations: [
      'Schedule next annual checkup in January 2025',
      'Continue monthly heartworm prevention',
      'Maintain current diet and exercise routine',
      'Monitor dental health and consider professional cleaning if needed',
    ],
  }

  const handleSymptomSubmit = async (data: SymptomLogData) => {
    console.log('Symptom log submitted:', data)
    // In real app, this would call API
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }

  const handleDocumentUpload = async (files: File[]) => {
    console.log('Documents uploaded:', files)
    // In real app, this would call API
  }

  const handleExportSummary = (format: 'pdf' | 'json') => {
    console.log('Exporting summary as:', format)
    // In real app, this would generate and download the file
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'records', label: 'Health Records', icon: '📋' },
    { id: 'vaccinations', label: 'Vaccinations', icon: '💉' },
    { id: 'documents', label: 'Documents', icon: '📄' },
    { id: 'symptoms', label: 'Log Symptoms', icon: '🩺' },
    { id: 'summary', label: 'Health Summary', icon: '📝' },
  ] as const

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Health Records & Documents
          </h1>
          <p className="text-gray-600">
            Manage your pet's health records, vaccinations, and medical documents
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-8 border-b border-gray-200">
          <nav className="flex space-x-8 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap
                  ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'overview' && (
            <div className="space-y-8">
              {/* AI Assessment Card */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Latest AI Assessment
                </h2>
                <AIAssessmentCard assessment={mockAIAssessment} />
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-gray-600">
                      Total Records
                    </h3>
                    <span className="text-2xl">📋</span>
                  </div>
                  <p className="text-3xl font-bold text-gray-900">
                    {mockHealthRecords.length}
                  </p>
                </div>

                <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-gray-600">
                      Vaccinations
                    </h3>
                    <span className="text-2xl">💉</span>
                  </div>
                  <p className="text-3xl font-bold text-gray-900">
                    {mockVaccinations.length}
                  </p>
                </div>

                <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-gray-600">
                      Next Checkup
                    </h3>
                    <span className="text-2xl">📅</span>
                  </div>
                  <p className="text-lg font-bold text-gray-900">Jan 2025</p>
                </div>
              </div>

              {/* Recent Records Timeline */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Recent Health Records
                </h2>
                <HealthRecordTimeline records={mockHealthRecords} />
              </div>
            </div>
          )}

          {activeTab === 'records' && (
            <div>
              <HealthRecordSearch records={mockHealthRecords} />
            </div>
          )}

          {activeTab === 'vaccinations' && (
            <div>
              <VaccinationList vaccinations={mockVaccinations} />
            </div>
          )}

          {activeTab === 'documents' && (
            <div className="space-y-6">
              <DocumentUpload
                petId={selectedPetId}
                onUploadComplete={handleDocumentUpload}
              />

              {/* Document List would go here */}
              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Uploaded Documents
                </h3>
                <p className="text-gray-500 text-center py-8">
                  No documents uploaded yet
                </p>
              </div>
            </div>
          )}

          {activeTab === 'symptoms' && (
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <SymptomLogger petId={selectedPetId} onSubmit={handleSymptomSubmit} />
            </div>
          )}

          {activeTab === 'summary' && (
            <div>
              <HealthSummary
                summary={mockHealthSummary}
                onExport={handleExportSummary}
              />
            </div>
          )}
        </motion.div>
      </div>

      {/* Document Viewer Modal */}
      {selectedDocument && (
        <DocumentViewer
          document={selectedDocument}
          isOpen={!!selectedDocument}
          onClose={() => setSelectedDocument(null)}
        />
      )}
    </div>
  )
}
