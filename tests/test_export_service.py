"""
Tests for export service functionality.
"""

import pytest
import json
from datetime import date, datetime

from app.services.export_service import HealthSummaryExporter
from app.schemas.health_records import (
    HealthSummaryResponse, HealthSummaryStats, HealthRecordResponse,
    AIInsight, RecordTypeEnum
)


class TestExportService:
    """Test export service functionality."""
    
    @pytest.fixture
    def sample_health_summary(self):
        """Create a sample health summary for testing."""
        stats = HealthSummaryStats(
            total_records=3,
            symptom_logs_count=2,
            vaccinations_count=1,
            ai_assessments_count=1,
            emergency_visits=0,
            checkups_count=2,
            last_checkup_date=date(2024, 1, 15),
            upcoming_vaccinations=0
        )
        
        # Create a sample health record
        health_record = HealthRecordResponse(
            id="test-record-id",
            pet_id="test-pet-id",
            record_date=date.today(),
            record_type=RecordTypeEnum.CHECKUP,
            description="Annual wellness exam",
            veterinarian="Dr. Smith",
            clinic_name="Pet Care Clinic",
            diagnosis="Healthy",
            treatment_plan="Continue current care",
            created_at=datetime.now(),
            updated_at=datetime.now(),
            symptom_logs=[],
            vaccinations=[],
            ai_assessments=[]
        )
        
        ai_insight = AIInsight(
            insight_type="recommendation",
            title="Regular Exercise",
            description="Continue regular exercise routine to maintain good health.",
            confidence=0.9,
            priority="medium"
        )
        
        return HealthSummaryResponse(
            pet_id="test-pet-id",
            pet_name="Buddy",
            summary_period_days=90,
            generated_at=datetime.now(),
            stats=stats,
            recent_records=[health_record],
            ai_insights=[ai_insight],
            export_formats=["json", "pdf"]
        )
    
    @pytest.mark.asyncio
    async def test_export_to_json(self, sample_health_summary):
        """Test exporting health summary to JSON format."""
        exporter = HealthSummaryExporter()
        
        result = await exporter.export_to_json(sample_health_summary)
        
        assert "metadata" in result
        assert "health_summary" in result
        assert result["metadata"]["export_format"] == "json"
        assert result["metadata"]["export_version"] == "1.0"
        assert result["health_summary"]["pet_name"] == "Buddy"
        assert result["health_summary"]["stats"]["total_records"] == 3
    
    @pytest.mark.asyncio
    async def test_export_to_pdf(self, sample_health_summary):
        """Test exporting health summary to PDF format."""
        exporter = HealthSummaryExporter()
        
        pdf_content = await exporter.export_to_pdf(sample_health_summary)
        
        assert isinstance(pdf_content, bytes)
        assert len(pdf_content) > 0
        # Check PDF header
        assert pdf_content.startswith(b'%PDF-')
    
    @pytest.mark.asyncio
    async def test_export_health_summary_json(self, sample_health_summary):
        """Test complete export workflow for JSON format."""
        exporter = HealthSummaryExporter()
        
        result = await exporter.export_health_summary(sample_health_summary, "json")
        
        assert result["format"] == "json"
        assert result["content_type"] == "application/json"
        assert "data" in result
        assert "filename" in result
        assert result["filename"].endswith(".json")
    
    @pytest.mark.asyncio
    async def test_export_health_summary_pdf(self, sample_health_summary):
        """Test complete export workflow for PDF format."""
        exporter = HealthSummaryExporter()
        
        result = await exporter.export_health_summary(sample_health_summary, "pdf")
        
        assert result["format"] == "pdf"
        assert result["content_type"] == "application/pdf"
        assert isinstance(result["data"], bytes)
        assert "filename" in result
        assert result["filename"].endswith(".pdf")
    
    @pytest.mark.asyncio
    async def test_export_invalid_format(self, sample_health_summary):
        """Test export with invalid format raises error."""
        exporter = HealthSummaryExporter()
        
        with pytest.raises(ValueError, match="Unsupported export format"):
            await exporter.export_health_summary(sample_health_summary, "xml")