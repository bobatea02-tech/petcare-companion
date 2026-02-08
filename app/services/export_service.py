"""
Export service for generating health summaries in multiple formats.
"""

import json
import io
from typing import Dict, Any, Optional
from datetime import datetime, date
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib.colors import HexColor
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.platypus.tableofcontents import TableOfContents
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT
import logging

from app.schemas.health_records import HealthSummaryResponse

logger = logging.getLogger(__name__)


class HealthSummaryExporter:
    """Service for exporting health summaries in multiple formats."""
    
    def __init__(self):
        """Initialize the export service."""
        self.styles = getSampleStyleSheet()
        self._setup_custom_styles()
    
    def _setup_custom_styles(self):
        """Set up custom styles for PDF generation."""
        # Title style
        self.styles.add(ParagraphStyle(
            name='CustomTitle',
            parent=self.styles['Title'],
            fontSize=24,
            spaceAfter=30,
            textColor=HexColor('#2E86AB'),
            alignment=TA_CENTER
        ))
        
        # Section header style
        self.styles.add(ParagraphStyle(
            name='SectionHeader',
            parent=self.styles['Heading1'],
            fontSize=16,
            spaceBefore=20,
            spaceAfter=12,
            textColor=HexColor('#A23B72'),
            borderWidth=1,
            borderColor=HexColor('#A23B72'),
            borderPadding=5
        ))
        
        # Subsection header style
        self.styles.add(ParagraphStyle(
            name='SubsectionHeader',
            parent=self.styles['Heading2'],
            fontSize=14,
            spaceBefore=15,
            spaceAfter=8,
            textColor=HexColor('#F18F01')
        ))
        
        # Insight style
        self.styles.add(ParagraphStyle(
            name='InsightText',
            parent=self.styles['Normal'],
            fontSize=11,
            spaceBefore=5,
            spaceAfter=5,
            leftIndent=20,
            borderWidth=1,
            borderColor=HexColor('#C73E1D'),
            borderPadding=8,
            backColor=HexColor('#FFF8F0')
        ))
        
        # Stats style
        self.styles.add(ParagraphStyle(
            name='StatsText',
            parent=self.styles['Normal'],
            fontSize=12,
            spaceBefore=3,
            spaceAfter=3,
            leftIndent=10
        ))
    
    async def export_to_json(self, health_summary: HealthSummaryResponse) -> Dict[str, Any]:
        """
        Export health summary to JSON format.
        
        Args:
            health_summary: Health summary data to export
            
        Returns:
            Dictionary containing the health summary data
        """
        try:
            # Convert Pydantic model to dictionary with proper serialization
            summary_dict = health_summary.dict()
            
            # Convert datetime and date objects to ISO strings for JSON serialization
            def serialize_dates(obj):
                if isinstance(obj, datetime):
                    return obj.isoformat()
                elif isinstance(obj, date):
                    return obj.isoformat()
                elif isinstance(obj, dict):
                    return {k: serialize_dates(v) for k, v in obj.items()}
                elif isinstance(obj, list):
                    return [serialize_dates(item) for item in obj]
                return obj
            
            serialized_summary = serialize_dates(summary_dict)
            
            # Add export metadata
            export_metadata = {
                "export_format": "json",
                "export_timestamp": datetime.now().isoformat(),
                "export_version": "1.0",
                "data_integrity_hash": self._calculate_data_hash(serialized_summary)
            }
            
            return {
                "metadata": export_metadata,
                "health_summary": serialized_summary
            }
            
        except Exception as e:
            logger.error(f"Error exporting to JSON: {e}")
            raise
    
    async def export_to_pdf(self, health_summary: HealthSummaryResponse) -> bytes:
        """
        Export health summary to PDF format.
        
        Args:
            health_summary: Health summary data to export
            
        Returns:
            PDF file content as bytes
        """
        try:
            # Create PDF buffer
            buffer = io.BytesIO()
            
            # Create PDF document
            doc = SimpleDocTemplate(
                buffer,
                pagesize=A4,
                rightMargin=72,
                leftMargin=72,
                topMargin=72,
                bottomMargin=18
            )
            
            # Build PDF content
            story = []
            
            # Title
            title = f"Health Summary for {health_summary.pet_name}"
            story.append(Paragraph(title, self.styles['CustomTitle']))
            story.append(Spacer(1, 20))
            
            # Summary information
            summary_info = [
                f"<b>Pet ID:</b> {health_summary.pet_id}",
                f"<b>Summary Period:</b> {health_summary.summary_period_days} days",
                f"<b>Generated:</b> {health_summary.generated_at.strftime('%B %d, %Y at %I:%M %p')}",
            ]
            
            for info in summary_info:
                story.append(Paragraph(info, self.styles['Normal']))
            
            story.append(Spacer(1, 20))
            
            # Health Statistics Section
            story.append(Paragraph("Health Statistics", self.styles['SectionHeader']))
            
            stats_data = [
                ["Metric", "Count"],
                ["Total Health Records", str(health_summary.stats.total_records)],
                ["Symptom Log Entries", str(health_summary.stats.symptom_logs_count)],
                ["Vaccination Records", str(health_summary.stats.vaccinations_count)],
                ["AI Assessments", str(health_summary.stats.ai_assessments_count)],
                ["Emergency Visits", str(health_summary.stats.emergency_visits)],
                ["Routine Checkups", str(health_summary.stats.checkups_count)],
                ["Upcoming Vaccinations", str(health_summary.stats.upcoming_vaccinations)]
            ]
            
            if health_summary.stats.last_checkup_date:
                stats_data.append([
                    "Last Checkup", 
                    health_summary.stats.last_checkup_date.strftime('%B %d, %Y')
                ])
            
            stats_table = Table(stats_data, colWidths=[3*inch, 2*inch])
            stats_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), HexColor('#2E86AB')),
                ('TEXTCOLOR', (0, 0), (-1, 0), HexColor('#FFFFFF')),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 12),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('BACKGROUND', (0, 1), (-1, -1), HexColor('#F8F9FA')),
                ('GRID', (0, 0), (-1, -1), 1, HexColor('#DEE2E6'))
            ]))
            
            story.append(stats_table)
            story.append(Spacer(1, 20))
            
            # Recent Health Records Section
            if health_summary.recent_records:
                story.append(Paragraph("Recent Health Records", self.styles['SectionHeader']))
                
                for record in health_summary.recent_records[:5]:  # Limit to 5 most recent
                    story.append(Paragraph(f"<b>{record.record_type.title()} - {record.record_date}</b>", 
                                         self.styles['SubsectionHeader']))
                    story.append(Paragraph(record.description, self.styles['Normal']))
                    
                    if record.diagnosis:
                        story.append(Paragraph(f"<b>Diagnosis:</b> {record.diagnosis}", 
                                             self.styles['Normal']))
                    
                    if record.treatment_plan:
                        story.append(Paragraph(f"<b>Treatment:</b> {record.treatment_plan}", 
                                             self.styles['Normal']))
                    
                    if record.veterinarian:
                        story.append(Paragraph(f"<b>Veterinarian:</b> {record.veterinarian}", 
                                             self.styles['Normal']))
                    
                    # Add symptom logs if present
                    if record.symptom_logs:
                        story.append(Paragraph("<b>Symptoms:</b>", self.styles['Normal']))
                        for symptom in record.symptom_logs:
                            symptom_text = f"• {symptom.symptom_description}"
                            if symptom.severity:
                                symptom_text += f" (Severity: {symptom.severity})"
                            story.append(Paragraph(symptom_text, self.styles['Normal']))
                    
                    # Add vaccinations if present
                    if record.vaccinations:
                        story.append(Paragraph("<b>Vaccinations:</b>", self.styles['Normal']))
                        for vaccination in record.vaccinations:
                            vac_text = f"• {vaccination.vaccine_name} ({vaccination.vaccine_type})"
                            if vaccination.expiration_date:
                                vac_text += f" - Expires: {vaccination.expiration_date}"
                            story.append(Paragraph(vac_text, self.styles['Normal']))
                    
                    story.append(Spacer(1, 15))
            
            # AI Insights Section
            if health_summary.ai_insights:
                story.append(Paragraph("AI-Powered Health Insights", self.styles['SectionHeader']))
                
                for insight in health_summary.ai_insights:
                    priority_color = {
                        'high': '#C73E1D',
                        'medium': '#F18F01', 
                        'low': '#2E86AB'
                    }.get(insight.priority, '#2E86AB')
                    
                    insight_title = f"<b>{insight.title}</b> (Priority: {insight.priority.title()})"
                    story.append(Paragraph(insight_title, self.styles['SubsectionHeader']))
                    
                    insight_content = f"{insight.description}<br/><br/>"
                    insight_content += f"<i>Confidence: {insight.confidence:.1%} | Type: {insight.insight_type.title()}</i>"
                    
                    story.append(Paragraph(insight_content, self.styles['InsightText']))
                    story.append(Spacer(1, 10))
            
            # Footer
            story.append(Spacer(1, 30))
            footer_text = f"Generated by PawPal Voice Pet Care Assistant on {datetime.now().strftime('%B %d, %Y')}"
            story.append(Paragraph(footer_text, self.styles['Normal']))
            
            # Build PDF
            doc.build(story)
            
            # Get PDF content
            buffer.seek(0)
            pdf_content = buffer.getvalue()
            buffer.close()
            
            return pdf_content
            
        except Exception as e:
            logger.error(f"Error exporting to PDF: {e}")
            raise
    
    def _calculate_data_hash(self, data: Dict[str, Any]) -> str:
        """
        Calculate a simple hash for data integrity verification.
        
        Args:
            data: Data to hash
            
        Returns:
            Hash string for integrity verification
        """
        import hashlib
        
        # Convert data to JSON string and calculate hash
        data_string = json.dumps(data, sort_keys=True, default=str)
        return hashlib.md5(data_string.encode()).hexdigest()
    
    async def export_health_summary(
        self, 
        health_summary: HealthSummaryResponse, 
        format_type: str = "json"
    ) -> Dict[str, Any]:
        """
        Export health summary in the specified format.
        
        Args:
            health_summary: Health summary data to export
            format_type: Export format ("json" or "pdf")
            
        Returns:
            Dictionary containing export data and metadata
        """
        try:
            if format_type.lower() == "json":
                export_data = await self.export_to_json(health_summary)
                return {
                    "format": "json",
                    "content_type": "application/json",
                    "data": export_data,
                    "filename": f"health_summary_{health_summary.pet_name}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
                }
            
            elif format_type.lower() == "pdf":
                pdf_content = await self.export_to_pdf(health_summary)
                return {
                    "format": "pdf",
                    "content_type": "application/pdf",
                    "data": pdf_content,
                    "filename": f"health_summary_{health_summary.pet_name}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
                }
            
            else:
                raise ValueError(f"Unsupported export format: {format_type}")
                
        except Exception as e:
            logger.error(f"Error exporting health summary: {e}")
            raise