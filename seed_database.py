"""
Database seeding script to create sample pets and health records
Run this to populate the database with test data
"""
import asyncio
from datetime import date, datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.connection import get_db_session
from app.database.models import User, Pet, HealthRecord, Vaccination
from app.core.security import get_password_hash
import uuid

async def seed_database():
    """Seed the database with sample data"""
    print("🌱 Starting database seeding...")
    
    async for db in get_db_session():
        try:
            # Create a test user
            print("Creating test user...")
            test_user = User(
                id=uuid.uuid4(),
                email="test@petpal.com",
                password_hash=get_password_hash("password123"),
                first_name="Test",
                last_name="User",
                phone_number="+1234567890",
                is_active=True,
                email_verified=True,
                created_at=datetime.now()
            )
            db.add(test_user)
            await db.flush()
            print(f"✅ Created user: {test_user.email}")

            # Create sample pets
            pets_data = [
                {
                    "name": "Buddy",
                    "species": "dog",
                    "breed": "Golden Retriever",
                    "birth_date": date(2020, 3, 15),
                    "weight": 65.0,
                    "gender": "male",
                    "medical_conditions": "None",
                    "allergies": "None known",
                },
                {
                    "name": "Luna",
                    "species": "cat",
                    "breed": "Siamese",
                    "birth_date": date(2021, 7, 20),
                    "weight": 10.0,
                    "gender": "female",
                    "medical_conditions": "None",
                    "allergies": "None known",
                },
                {
                    "name": "Max",
                    "species": "dog",
                    "breed": "German Shepherd",
                    "birth_date": date(2019, 1, 10),
                    "weight": 75.0,
                    "gender": "male",
                    "medical_conditions": "Hip dysplasia",
                    "allergies": "None known",
                }
            ]

            created_pets = []
            for pet_data in pets_data:
                pet = Pet(
                    id=uuid.uuid4(),
                    user_id=test_user.id,
                    **pet_data,
                    is_active=True,
                    created_at=datetime.now()
                )
                db.add(pet)
                await db.flush()
                created_pets.append(pet)
                print(f"✅ Created pet: {pet.name} ({pet.species})")

            # Create health records for each pet
            print("\nCreating health records...")
            
            # Buddy's health records
            buddy = created_pets[0]
            
            # Annual checkup
            checkup = HealthRecord(
                id=uuid.uuid4(),
                pet_id=buddy.id,
                record_date=date.today() - timedelta(days=30),
                record_type="checkup",
                description="Annual wellness examination",
                diagnosis="Healthy, no issues found",
                treatment_plan="Continue current diet and exercise routine. Weight: 65 lbs, Temperature: 101.5°F, Heart rate: 90 bpm",
                veterinarian="Dr. Sarah Johnson",
                clinic_name="Happy Paws Veterinary Clinic",
                created_at=datetime.now()
            )
            db.add(checkup)
            await db.flush()
            print(f"  ✅ Added checkup for {buddy.name}")

            # Vaccination record
            vaccination_record = HealthRecord(
                id=uuid.uuid4(),
                pet_id=buddy.id,
                record_date=date.today() - timedelta(days=60),
                record_type="vaccination",
                description="Annual vaccinations",
                veterinarian="Dr. Sarah Johnson",
                clinic_name="Happy Paws Veterinary Clinic",
                created_at=datetime.now()
            )
            db.add(vaccination_record)
            await db.flush()

            # Add specific vaccinations
            vaccinations = [
                {
                    "vaccine_name": "Rabies",
                    "vaccine_type": "Core",
                    "administered_date": date.today() - timedelta(days=60),
                    "expiration_date": date.today() + timedelta(days=1035),  # 3 years
                    "batch_number": "RAB-2024-001"
                },
                {
                    "vaccine_name": "DHPP (Distemper, Hepatitis, Parvovirus, Parainfluenza)",
                    "vaccine_type": "Core",
                    "administered_date": date.today() - timedelta(days=60),
                    "expiration_date": date.today() + timedelta(days=365),  # 1 year
                    "batch_number": "DHPP-2024-002"
                },
                {
                    "vaccine_name": "Bordetella",
                    "vaccine_type": "Non-core",
                    "administered_date": date.today() - timedelta(days=60),
                    "expiration_date": date.today() + timedelta(days=180),  # 6 months
                    "batch_number": "BORD-2024-003"
                }
            ]

            for vacc_data in vaccinations:
                vaccination = Vaccination(
                    id=uuid.uuid4(),
                    health_record_id=vaccination_record.id,
                    veterinarian="Dr. Sarah Johnson",
                    clinic_name="Happy Paws Veterinary Clinic",
                    **vacc_data,
                    created_at=datetime.now()
                )
                db.add(vaccination)
                print(f"  ✅ Added vaccination: {vacc_data['vaccine_name']}")

            await db.flush()

            # Weight tracking record
            weight_check = HealthRecord(
                id=uuid.uuid4(),
                pet_id=buddy.id,

                record_date=date.today() - timedelta(days=90),
                record_type="checkup",
                description="Weight check",

                veterinarian="Dr. Sarah Johnson",
                clinic_name="Happy Paws Veterinary Clinic",
                created_at=datetime.now()
            )
            db.add(weight_check)
            print(f"  ✅ Added weight check for {buddy.name}")

            # Luna's health records
            luna = created_pets[1]
            
            luna_checkup = HealthRecord(
                id=uuid.uuid4(),
                pet_id=luna.id,

                record_date=date.today() - timedelta(days=45),
                record_type="checkup",
                description="Routine wellness exam",
                diagnosis="Healthy, dental cleaning recommended",
                treatment_plan="Schedule dental cleaning in 3 months",
                veterinarian="Dr. Michael Chen",
                clinic_name="Feline Care Center",

                created_at=datetime.now()
            )
            db.add(luna_checkup)
            print(f"  ✅ Added checkup for {luna.name}")

            # Luna's vaccinations
            luna_vacc = HealthRecord(
                id=uuid.uuid4(),
                pet_id=luna.id,

                record_date=date.today() - timedelta(days=90),
                record_type="vaccination",
                description="Annual cat vaccinations",
                veterinarian="Dr. Michael Chen",
                clinic_name="Feline Care Center",
                created_at=datetime.now()
            )
            db.add(luna_vacc)
            await db.flush()

            cat_vaccinations = [
                {
                    "vaccine_name": "FVRCP (Feline Viral Rhinotracheitis, Calicivirus, Panleukopenia)",
                    "vaccine_type": "Core",
                    "administered_date": date.today() - timedelta(days=90),
                    "expiration_date": date.today() + timedelta(days=275),  # ~1 year
                    "batch_number": "FVRCP-2024-001"
                },
                {
                    "vaccine_name": "Rabies",
                    "vaccine_type": "Core",
                    "administered_date": date.today() - timedelta(days=90),
                    "expiration_date": date.today() + timedelta(days=1005),  # 3 years
                    "batch_number": "RAB-CAT-2024-001"
                }
            ]

            for vacc_data in cat_vaccinations:
                vaccination = Vaccination(
                    id=uuid.uuid4(),
                    health_record_id=luna_vacc.id,
                    veterinarian="Dr. Michael Chen",
                    clinic_name="Feline Care Center",
                    **vacc_data,
                    created_at=datetime.now()
                )
                db.add(vaccination)
                print(f"  ✅ Added vaccination for {luna.name}: {vacc_data['vaccine_name']}")

            # Max's health records
            max_pet = created_pets[2]
            
            max_checkup = HealthRecord(
                id=uuid.uuid4(),
                pet_id=max_pet.id,

                record_date=date.today() - timedelta(days=15),
                record_type="checkup",
                description="Hip dysplasia follow-up",
                diagnosis="Mild hip dysplasia, manageable with medication",
                treatment_plan="Continue joint supplements, monitor mobility",
                veterinarian="Dr. Emily Rodriguez",
                clinic_name="Canine Orthopedic Specialists",

                created_at=datetime.now()
            )
            db.add(max_checkup)
            print(f"  ✅ Added checkup for {max_pet.name}")

            # Commit all changes
            await db.commit()
            print("\n✅ Database seeding completed successfully!")
            print(f"\n📧 Test user credentials:")
            print(f"   Email: test@petpal.com")
            print(f"   Password: password123")
            print(f"\n🐾 Created {len(created_pets)} pets with health records")
            
        except Exception as e:
            await db.rollback()
            print(f"\n❌ Error seeding database: {e}")
            raise
        finally:
            await db.close()
            break

if __name__ == "__main__":
    print("=" * 60)
    print("🗄️  PetPal Database Seeding Script")
    print("=" * 60)
    asyncio.run(seed_database())
