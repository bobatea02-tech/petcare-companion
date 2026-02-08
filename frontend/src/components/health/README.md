# Health Records and Document Management Components

This directory contains comprehensive UI components for managing pet health records, medical documents, vaccinations, and AI-powered health assessments.

## Components Overview

### 1. DocumentUpload
**Purpose**: Drag-and-drop file upload interface for medical documents

**Features**:
- Drag-and-drop zone with visual feedback
- File validation (format and size)
- Multiple file selection
- Document categorization (medical record, vaccination certificate, lab result, etc.)
- Tag system for organization
- Real-time upload progress

**Usage**:
```tsx
<DocumentUpload
  petId="pet-123"
  onUploadComplete={(files) => console.log('Uploaded:', files)}
  maxFileSize={10}
  acceptedFormats={['.pdf', '.jpg', '.png']}
/>
```

### 2. HealthRecordTimeline
**Purpose**: Chronological display of health records with filtering

**Features**:
- Timeline visualization with medical icons
- Filter by record type (symptom, vaccination, checkup, surgery, lab result)
- Color-coded record types
- Clickable records for detailed view
- Empty state handling

**Usage**:
```tsx
<HealthRecordTimeline
  records={healthRecords}
  onRecordClick={(record) => console.log('Selected:', record)}
/>
```

### 3. VaccinationCard & VaccinationList
**Purpose**: Certificate-style display of vaccination records

**Features**:
- Certificate styling with decorative elements
- Status badges (Valid, Expiring Soon, Expired)
- Expiration tracking and alerts
- Batch number display
- Next due date highlighting
- Paw print watermark

**Usage**:
```tsx
<VaccinationList vaccinations={vaccinations} />
// or
<VaccinationCard vaccination={singleVaccination} />
```

### 4. SymptomLogger
**Purpose**: Interactive symptom logging with body part selection

**Features**:
- Common symptom quick-selection
- Custom symptom input
- Body part selection with visual icons
- Severity rating (mild, moderate, severe)
- Additional notes field
- Real-time validation

**Usage**:
```tsx
<SymptomLogger
  petId="pet-123"
  onSubmit={(data) => {
    console.log('Symptoms:', data.symptoms)
    console.log('Body parts:', data.bodyParts)
    console.log('Severity:', data.severity)
  }}
/>
```

### 5. HealthSummary
**Purpose**: Exportable health summary with print-friendly layout

**Features**:
- Comprehensive health overview
- AI-powered insights section
- Recent symptoms, vaccinations, medications, appointments
- Export to PDF and JSON
- Print-optimized layout
- Page break controls for printing

**Usage**:
```tsx
<HealthSummary
  summary={healthSummaryData}
  onExport={(format) => {
    if (format === 'pdf') {
      // Generate PDF
    } else {
      // Export JSON
    }
  }}
/>
```

### 6. DocumentViewer
**Purpose**: Full-featured document viewer with annotations

**Features**:
- Zoom controls (50% - 200%)
- Rotation (90° increments)
- Image annotation system
- Click-to-add notes
- Download and print functionality
- PDF iframe viewer
- File type detection

**Usage**:
```tsx
<DocumentViewer
  document={selectedDocument}
  isOpen={isViewerOpen}
  onClose={() => setIsViewerOpen(false)}
/>
```

### 7. AIAssessmentCard
**Purpose**: Display AI-powered health assessments with confidence indicators

**Features**:
- Triage level display (Green, Yellow, Red)
- Color-coded urgency indicators
- Confidence score visualization
- Symptoms reported section
- AI analysis and recommendations
- Model information display
- Medical disclaimer

**Usage**:
```tsx
<AIAssessmentCard assessment={aiAssessment} />
```

### 8. HealthRecordSearch
**Purpose**: Advanced search and filtering for health records

**Features**:
- Full-text search across all record fields
- Filter by record type
- Date range filtering
- Real-time results
- Clear filters functionality
- Results count display
- Empty state handling

**Usage**:
```tsx
<HealthRecordSearch
  records={allHealthRecords}
  onRecordSelect={(record) => console.log('Selected:', record)}
/>
```

## Data Types

All components use TypeScript types defined in `@/types/health.ts`:

- `HealthRecord`: Core health record structure
- `Vaccination`: Vaccination certificate data
- `AIAssessment`: AI analysis results
- `Document`: File metadata and storage info
- `SymptomLog`: Symptom logging data
- `HealthSummary`: Comprehensive health summary
- `RecordType`: Enum for record categories
- `TriageLevel`: Enum for urgency levels
- `SeverityLevel`: Enum for symptom severity

## Styling

All components use:
- Tailwind CSS for styling
- Framer Motion for animations
- Pet-themed color palette
- Responsive design (mobile-first)
- Print-friendly layouts where applicable

## Accessibility

Components follow WCAG 2.1 AA guidelines:
- Semantic HTML structure
- ARIA labels and attributes
- Keyboard navigation support
- Focus indicators
- Screen reader friendly
- Color contrast compliance

## Integration Example

See `frontend/src/app/dashboard/health-records/page.tsx` for a complete integration example showing all components working together in a tabbed interface.

## Requirements Validation

This implementation satisfies the following requirements from the spec:

- **6.1**: Timestamped symptom log entries with AI assessment results
- **6.2**: Vaccination record storage with dates and expiration information
- **6.3**: AI assessment results linked to pet profiles
- **6.4**: Chronological health history with filtering capabilities
- **6.5**: Exportable health summaries for veterinary appointments
- **9.1**: File upload with format and size validation
- **9.2**: Medical document parsing and extraction
- **9.3**: File organization by pet and document type

## Future Enhancements

Potential improvements:
- OCR integration for automatic data extraction
- Multi-language support
- Voice-to-text for symptom logging
- Integration with veterinary clinic systems
- Automated vaccination reminders
- Health trend analysis and charts
