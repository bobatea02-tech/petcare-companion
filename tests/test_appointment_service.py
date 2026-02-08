"""
Unit tests for appointment management service.
"""

import pytest
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException

from app.services.appointment_service import AppointmentService, VetClinicService
from app.schemas.appointments import (
    AppointmentCreate, AppointmentUpdate,
    VetClinicCreate, EmergencyVetSearchRequest
)
from app.database.models import User, Pet, Appointment, VetClinic


@pytest.mark.asyncio
async def test_create_appointment(db_session: AsyncSession, test_user: User, test_pet: Pet):
    """Test creating a new appointment."""
    appointment_service = AppointmentService(db_session)
    
    # Create appointment data
    appointment_date = datetime.now() + timedelta(days=7)
    appointment_data = AppointmentCreate(
        appointment_date=appointment_date,
        appointment_type="checkup",
        purpose="Annual wellness exam",
        clinic_name="Happy Paws Veterinary Clinic",
        clinic_address="123 Main St, City, State 12345",
        clinic_phone="555-0123",
        veterinarian="Dr. Smith",
        notes="First visit to this clinic"
    )
    
    # Create appointment
    result = await appointment_service.create_appointment(
        str(test_user.id),
        str(test_pet.id),
        appointment_data
    )
    
    # Verify appointment was created
    assert result.pet_id == str(test_pet.id)
    assert result.appointment_type == "checkup"
    assert result.clinic_name == "Happy Paws Veterinary Clinic"
    assert result.status == "scheduled"
    assert result.is_upcoming is True
    assert result.reminder_sent_24h is False
    assert result.reminder_sent_2h is False


@pytest.mark.asyncio
async def test_get_pet_appointments(db_session: AsyncSession, test_user: User, test_pet: Pet):
    """Test retrieving appointments for a pet."""
    appointment_service = AppointmentService(db_session)
    
    # Create multiple appointments
    for i in range(3):
        appointment_date = datetime.now() + timedelta(days=i+1)
        appointment_data = AppointmentCreate(
            appointment_date=appointment_date,
            appointment_type="checkup",
            purpose=f"Visit {i+1}",
            clinic_name="Test Clinic",
            clinic_address="123 Test St",
            clinic_phone="555-0000"
        )
        await appointment_service.create_appointment(
            str(test_user.id),
            str(test_pet.id),
            appointment_data
        )
    
    # Get appointments
    result = await appointment_service.get_pet_appointments(
        str(test_user.id),
        str(test_pet.id)
    )
    
    # Verify appointments were retrieved
    assert result.total_count == 3
    assert result.upcoming_count == 3
    assert len(result.appointments) == 3


@pytest.mark.asyncio
async def test_update_appointment(db_session: AsyncSession, test_user: User, test_pet: Pet):
    """Test updating an appointment."""
    appointment_service = AppointmentService(db_session)
    
    # Create appointment
    appointment_date = datetime.now() + timedelta(days=7)
    appointment_data = AppointmentCreate(
        appointment_date=appointment_date,
        appointment_type="checkup",
        purpose="Annual exam",
        clinic_name="Test Clinic",
        clinic_address="123 Test St",
        clinic_phone="555-0000"
    )
    created = await appointment_service.create_appointment(
        str(test_user.id),
        str(test_pet.id),
        appointment_data
    )
    
    # Update appointment
    update_data = AppointmentUpdate(
        purpose="Annual wellness exam with vaccinations",
        veterinarian="Dr. Johnson"
    )
    updated = await appointment_service.update_appointment(
        str(test_user.id),
        str(test_pet.id),
        created.id,
        update_data
    )
    
    # Verify update
    assert updated.id == created.id
    assert updated.purpose == "Annual wellness exam with vaccinations"
    assert updated.veterinarian == "Dr. Johnson"
    assert updated.clinic_name == "Test Clinic"  # Unchanged field


@pytest.mark.asyncio
async def test_delete_appointment(db_session: AsyncSession, test_user: User, test_pet: Pet):
    """Test cancelling an appointment."""
    appointment_service = AppointmentService(db_session)
    
    # Create appointment
    appointment_date = datetime.now() + timedelta(days=7)
    appointment_data = AppointmentCreate(
        appointment_date=appointment_date,
        appointment_type="checkup",
        purpose="Annual exam",
        clinic_name="Test Clinic",
        clinic_address="123 Test St",
        clinic_phone="555-0000"
    )
    created = await appointment_service.create_appointment(
        str(test_user.id),
        str(test_pet.id),
        appointment_data
    )
    
    # Delete appointment
    await appointment_service.delete_appointment(
        str(test_user.id),
        str(test_pet.id),
        created.id
    )
    
    # Verify appointment is cancelled
    result = await appointment_service.get_appointment(
        str(test_user.id),
        str(test_pet.id),
        created.id
    )
    assert result.status == "cancelled"


@pytest.mark.asyncio
async def test_get_appointment_history(db_session: AsyncSession, test_user: User, test_pet: Pet):
    """Test retrieving appointment history."""
    appointment_service = AppointmentService(db_session)
    
    # Create past and future appointments
    past_date = datetime.now() - timedelta(days=30)
    future_date = datetime.now() + timedelta(days=30)
    
    for date in [past_date, future_date]:
        appointment_data = AppointmentCreate(
            appointment_date=date,
            appointment_type="checkup",
            purpose="Test appointment",
            clinic_name="Test Clinic",
            clinic_address="123 Test St",
            clinic_phone="555-0000"
        )
        await appointment_service.create_appointment(
            str(test_user.id),
            str(test_pet.id),
            appointment_data
        )
    
    # Get history
    result = await appointment_service.get_appointment_history(
        str(test_user.id),
        str(test_pet.id)
    )
    
    # Verify history
    assert result.pet_id == str(test_pet.id)
    assert result.total_appointments == 2
    assert result.upcoming_appointments == 1
    assert result.last_appointment_date is not None
    assert result.next_appointment_date is not None


@pytest.mark.asyncio
async def test_appointment_with_invalid_pet(db_session: AsyncSession, test_user: User):
    """Test creating appointment with invalid pet ID."""
    appointment_service = AppointmentService(db_session)
    
    appointment_date = datetime.now() + timedelta(days=7)
    appointment_data = AppointmentCreate(
        appointment_date=appointment_date,
        appointment_type="checkup",
        purpose="Test",
        clinic_name="Test Clinic",
        clinic_address="123 Test St",
        clinic_phone="555-0000"
    )
    
    # Should raise HTTPException
    with pytest.raises(HTTPException) as exc_info:
        await appointment_service.create_appointment(
            str(test_user.id),
            "00000000-0000-0000-0000-000000000000",
            appointment_data
        )
    
    assert exc_info.value.status_code == 404


@pytest.mark.asyncio
async def test_create_vet_clinic(db_session: AsyncSession):
    """Test creating a vet clinic."""
    vet_clinic_service = VetClinicService(db_session)
    
    clinic_data = VetClinicCreate(
        name="Emergency Pet Hospital",
        address="456 Emergency Ave, City, State 12345",
        phone_number="555-9999",
        email="info@emergencypet.com",
        website="https://emergencypet.com",
        latitude=40.7128,
        longitude=-74.0060,
        is_emergency=True,
        is_24_hour=True,
        services_offered="Emergency care, surgery, diagnostics"
    )
    
    result = await vet_clinic_service.create_vet_clinic(clinic_data)
    
    assert result.name == "Emergency Pet Hospital"
    assert result.is_emergency is True
    assert result.is_24_hour is True
    assert result.latitude == 40.7128
    assert result.longitude == -74.0060


@pytest.mark.asyncio
async def test_search_emergency_vets(db_session: AsyncSession):
    """Test searching for emergency vets by location."""
    vet_clinic_service = VetClinicService(db_session)
    
    # Create test clinics at different locations
    clinics_data = [
        {
            "name": "Nearby Emergency Vet",
            "address": "123 Close St",
            "phone_number": "555-0001",
            "latitude": 40.7128,
            "longitude": -74.0060,
            "is_emergency": True,
            "is_24_hour": True
        },
        {
            "name": "Far Emergency Vet",
            "address": "789 Far St",
            "phone_number": "555-0002",
            "latitude": 41.0,
            "longitude": -75.0,
            "is_emergency": True,
            "is_24_hour": False
        },
        {
            "name": "Regular Vet",
            "address": "456 Normal St",
            "phone_number": "555-0003",
            "latitude": 40.7200,
            "longitude": -74.0100,
            "is_emergency": False,
            "is_24_hour": False
        }
    ]
    
    for clinic_data in clinics_data:
        await vet_clinic_service.create_vet_clinic(VetClinicCreate(**clinic_data))
    
    # Search for emergency vets near first location
    result = await vet_clinic_service.search_emergency_vets(
        latitude=40.7128,
        longitude=-74.0060,
        radius_miles=10.0,
        emergency_only=True,
        twenty_four_hour_only=False
    )
    
    # Should find nearby emergency vet but not far one or regular vet
    assert result.total_found >= 1
    assert result.search_radius_miles == 10.0
    assert all(clinic.is_emergency for clinic in result.clinics)
    
    # Verify distance calculation
    if result.clinics:
        assert result.clinics[0].distance_miles is not None
        assert result.clinics[0].distance_miles >= 0


@pytest.mark.asyncio
async def test_get_upcoming_appointments(db_session: AsyncSession, test_user: User, test_pet: Pet):
    """Test getting upcoming appointments across all pets."""
    appointment_service = AppointmentService(db_session)
    
    # Create appointments at different times
    dates = [
        datetime.now() + timedelta(days=1),
        datetime.now() + timedelta(days=5),
        datetime.now() + timedelta(days=10)
    ]
    
    for date in dates:
        appointment_data = AppointmentCreate(
            appointment_date=date,
            appointment_type="checkup",
            purpose="Test appointment",
            clinic_name="Test Clinic",
            clinic_address="123 Test St",
            clinic_phone="555-0000"
        )
        await appointment_service.create_appointment(
            str(test_user.id),
            str(test_pet.id),
            appointment_data
        )
    
    # Get upcoming appointments within 7 days
    result = await appointment_service.get_upcoming_appointments(
        str(test_user.id),
        days_ahead=7
    )
    
    # Should find first two appointments
    assert len(result) == 2
    assert all(apt.is_upcoming for apt in result)
    
    # Verify sorted by date
    for i in range(len(result) - 1):
        assert result[i].appointment_date <= result[i+1].appointment_date


@pytest.mark.asyncio
async def test_appointment_filtering(db_session: AsyncSession, test_user: User, test_pet: Pet):
    """Test appointment filtering options."""
    appointment_service = AppointmentService(db_session)
    
    # Create past, upcoming, and cancelled appointments
    past_date = datetime.now() - timedelta(days=30)
    future_date = datetime.now() + timedelta(days=30)
    
    # Past appointment
    past_apt_data = AppointmentCreate(
        appointment_date=past_date,
        appointment_type="checkup",
        purpose="Past appointment",
        clinic_name="Test Clinic",
        clinic_address="123 Test St",
        clinic_phone="555-0000"
    )
    await appointment_service.create_appointment(
        str(test_user.id),
        str(test_pet.id),
        past_apt_data
    )
    
    # Future appointment
    future_apt_data = AppointmentCreate(
        appointment_date=future_date,
        appointment_type="checkup",
        purpose="Future appointment",
        clinic_name="Test Clinic",
        clinic_address="123 Test St",
        clinic_phone="555-0000"
    )
    future_apt = await appointment_service.create_appointment(
        str(test_user.id),
        str(test_pet.id),
        future_apt_data
    )
    
    # Cancelled appointment
    cancelled_apt_data = AppointmentCreate(
        appointment_date=future_date + timedelta(days=7),
        appointment_type="checkup",
        purpose="Cancelled appointment",
        clinic_name="Test Clinic",
        clinic_address="123 Test St",
        clinic_phone="555-0000"
    )
    cancelled_apt = await appointment_service.create_appointment(
        str(test_user.id),
        str(test_pet.id),
        cancelled_apt_data
    )
    await appointment_service.delete_appointment(
        str(test_user.id),
        str(test_pet.id),
        cancelled_apt.id
    )
    
    # Test: exclude past appointments
    result = await appointment_service.get_pet_appointments(
        str(test_user.id),
        str(test_pet.id),
        include_past=False,
        include_cancelled=True
    )
    assert result.total_count == 2  # Only future and cancelled
    
    # Test: exclude cancelled appointments
    result = await appointment_service.get_pet_appointments(
        str(test_user.id),
        str(test_pet.id),
        include_past=True,
        include_cancelled=False
    )
    assert result.total_count == 2  # Past and future, not cancelled
    
    # Test: include all
    result = await appointment_service.get_pet_appointments(
        str(test_user.id),
        str(test_pet.id),
        include_past=True,
        include_cancelled=True
    )
    assert result.total_count == 3  # All appointments



@pytest.mark.asyncio
async def test_create_emergency_appointment_from_triage(db_session: AsyncSession, test_user: User, test_pet: Pet):
    """Test creating emergency appointment from triage results."""
    appointment_service = AppointmentService(db_session)
    vet_clinic_service = VetClinicService(db_session)
    
    # Create emergency clinic
    clinic_data = VetClinicCreate(
        name="24/7 Emergency Vet",
        address="999 Emergency Blvd",
        phone_number="555-HELP",
        latitude=40.7128,
        longitude=-74.0060,
        is_emergency=True,
        is_24_hour=True
    )
    clinic = await vet_clinic_service.create_vet_clinic(clinic_data)
    
    # Create emergency appointment from triage
    result = await appointment_service.create_emergency_appointment_from_triage(
        str(test_user.id),
        str(test_pet.id),
        clinic.id,
        triage_assessment_id="test-assessment-123",
        notes="Pet showing severe symptoms"
    )
    
    # Verify emergency appointment
    assert result.pet_id == str(test_pet.id)
    assert result.appointment_type == "emergency"
    assert result.clinic_name == "24/7 Emergency Vet"
    assert result.status == "scheduled"
    assert "Emergency appointment created from triage assessment" in result.notes
    assert "test-assessment-123" in result.notes
    assert "Pet showing severe symptoms" in result.notes
    
    # Verify appointment is scheduled soon (within next hour)
    time_until = result.appointment_date - datetime.now()
    assert time_until.total_seconds() < 3600  # Less than 1 hour


@pytest.mark.asyncio
async def test_get_appointments_needing_reminders_24h(db_session: AsyncSession, test_user: User, test_pet: Pet):
    """Test getting appointments that need 24-hour reminders."""
    appointment_service = AppointmentService(db_session)
    
    # Create appointment 24 hours in the future
    appointment_date = datetime.now() + timedelta(hours=24)
    appointment_data = AppointmentCreate(
        appointment_date=appointment_date,
        appointment_type="checkup",
        purpose="Test appointment",
        clinic_name="Test Clinic",
        clinic_address="123 Test St",
        clinic_phone="555-0000"
    )
    created = await appointment_service.create_appointment(
        str(test_user.id),
        str(test_pet.id),
        appointment_data
    )
    
    # Get appointments needing 24h reminders
    result = await appointment_service.get_appointments_needing_reminders("24h")
    
    # Should find the appointment
    assert len(result) >= 1
    appointment_ids = [apt.id for apt in result]
    assert created.id in appointment_ids


@pytest.mark.asyncio
async def test_get_appointments_needing_reminders_2h(db_session: AsyncSession, test_user: User, test_pet: Pet):
    """Test getting appointments that need 2-hour reminders."""
    appointment_service = AppointmentService(db_session)
    
    # Create appointment 2 hours in the future
    appointment_date = datetime.now() + timedelta(hours=2)
    appointment_data = AppointmentCreate(
        appointment_date=appointment_date,
        appointment_type="checkup",
        purpose="Test appointment",
        clinic_name="Test Clinic",
        clinic_address="123 Test St",
        clinic_phone="555-0000"
    )
    created = await appointment_service.create_appointment(
        str(test_user.id),
        str(test_pet.id),
        appointment_data
    )
    
    # Get appointments needing 2h reminders
    result = await appointment_service.get_appointments_needing_reminders("2h")
    
    # Should find the appointment
    assert len(result) >= 1
    appointment_ids = [apt.id for apt in result]
    assert created.id in appointment_ids


@pytest.mark.asyncio
async def test_mark_reminder_sent(db_session: AsyncSession, test_user: User, test_pet: Pet):
    """Test marking reminder as sent."""
    appointment_service = AppointmentService(db_session)
    
    # Create appointment
    appointment_date = datetime.now() + timedelta(hours=24)
    appointment_data = AppointmentCreate(
        appointment_date=appointment_date,
        appointment_type="checkup",
        purpose="Test appointment",
        clinic_name="Test Clinic",
        clinic_address="123 Test St",
        clinic_phone="555-0000"
    )
    created = await appointment_service.create_appointment(
        str(test_user.id),
        str(test_pet.id),
        appointment_data
    )
    
    # Verify reminder not sent initially
    assert created.reminder_sent_24h is False
    assert created.reminder_sent_2h is False
    
    # Mark 24h reminder as sent
    await appointment_service.mark_reminder_sent(created.id, "24h")
    
    # Verify reminder marked
    updated = await appointment_service.get_appointment(
        str(test_user.id),
        str(test_pet.id),
        created.id
    )
    assert updated.reminder_sent_24h is True
    assert updated.reminder_sent_2h is False
    
    # Mark 2h reminder as sent
    await appointment_service.mark_reminder_sent(created.id, "2h")
    
    # Verify both reminders marked
    updated = await appointment_service.get_appointment(
        str(test_user.id),
        str(test_pet.id),
        created.id
    )
    assert updated.reminder_sent_24h is True
    assert updated.reminder_sent_2h is True


@pytest.mark.asyncio
async def test_emergency_appointment_with_invalid_clinic(db_session: AsyncSession, test_user: User, test_pet: Pet):
    """Test creating emergency appointment with invalid clinic ID."""
    appointment_service = AppointmentService(db_session)
    
    # Should raise HTTPException
    with pytest.raises(HTTPException) as exc_info:
        await appointment_service.create_emergency_appointment_from_triage(
            str(test_user.id),
            str(test_pet.id),
            "00000000-0000-0000-0000-000000000000",
            triage_assessment_id="test-123"
        )
    
    assert exc_info.value.status_code == 404
    assert "clinic" in exc_info.value.detail.lower()
