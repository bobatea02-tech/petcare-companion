"""
Quick script to verify environment variables are loaded correctly.
"""
import os
from dotenv import load_dotenv

# Load .env file
load_dotenv()

print("=" * 60)
print("Environment Variable Check")
print("=" * 60)

# Check GEMINI_API_KEY
gemini_key = os.getenv("GEMINI_API_KEY")
if gemini_key:
    print(f"✓ GEMINI_API_KEY: Found (starts with: {gemini_key[:10]}...)")
else:
    print("✗ GEMINI_API_KEY: NOT FOUND")

# Check other important keys
scaledown_key = os.getenv("SCALEDOWN_API_KEY")
if scaledown_key:
    print(f"✓ SCALEDOWN_API_KEY: Found")
else:
    print("✗ SCALEDOWN_API_KEY: NOT FOUND")

# Check AI provider
ai_provider = os.getenv("AI_PROVIDER", "gemini")
print(f"✓ AI_PROVIDER: {ai_provider}")

# Check primary model
primary_model = os.getenv("PRIMARY_AI_MODEL", "gemini-2.5-flash")
print(f"✓ PRIMARY_AI_MODEL: {primary_model}")

print("=" * 60)

# Try to import and check settings
try:
    from app.core.config import settings
    print("\nSettings loaded successfully:")
    print(f"  GEMINI_API_KEY configured: {'Yes' if settings.GEMINI_API_KEY else 'No'}")
    print(f"  AI_PROVIDER: {settings.AI_PROVIDER}")
    print(f"  PRIMARY_AI_MODEL: {settings.PRIMARY_AI_MODEL}")
    print("=" * 60)
except Exception as e:
    print(f"\n✗ Error loading settings: {str(e)}")
    print("=" * 60)
