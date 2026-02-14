"""
Quick diagnostic script to check if backend is running and accessible.
"""

import requests
import sys

def check_backend():
    """Check if backend is running."""
    print("=" * 60)
    print("CHECKING BACKEND CONNECTION")
    print("=" * 60)
    print()
    
    backend_url = "http://localhost:8000"
    
    # Check root endpoint
    print(f"1. Checking backend at {backend_url}...")
    try:
        response = requests.get(f"{backend_url}/", timeout=5)
        if response.status_code == 200:
            print(f"   ✅ Backend is running!")
            print(f"   Response: {response.json()}")
        else:
            print(f"   ❌ Backend returned status code: {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print(f"   ❌ Cannot connect to backend at {backend_url}")
        print(f"   Make sure the backend is running:")
        print(f"   python -m uvicorn app.main:app --reload")
        return False
    except Exception as e:
        print(f"   ❌ Error: {e}")
        return False
    
    print()
    
    # Check health endpoint
    print(f"2. Checking health endpoint...")
    try:
        response = requests.get(f"{backend_url}/health", timeout=5)
        if response.status_code == 200:
            print(f"   ✅ Health check passed!")
            print(f"   Response: {response.json()}")
        else:
            print(f"   ⚠️  Health check returned: {response.status_code}")
    except Exception as e:
        print(f"   ❌ Error: {e}")
    
    print()
    
    # Check API v1 health
    print(f"3. Checking API v1 health endpoint...")
    try:
        response = requests.get(f"{backend_url}/api/v1/health", timeout=5)
        if response.status_code == 200:
            print(f"   ✅ API v1 health check passed!")
            print(f"   Response: {response.json()}")
        else:
            print(f"   ⚠️  API v1 health check returned: {response.status_code}")
    except Exception as e:
        print(f"   ❌ Error: {e}")
    
    print()
    
    # Check AI service health
    print(f"4. Checking AI service health...")
    try:
        response = requests.get(f"{backend_url}/api/v1/ai/health", timeout=10)
        if response.status_code == 200:
            data = response.json()
            print(f"   ✅ AI service is healthy!")
            print(f"   Status: {data.get('status')}")
            print(f"   Models available: {data.get('models_available')}")
            print(f"   Primary model: {data.get('primary_model')}")
        else:
            print(f"   ⚠️  AI service returned: {response.status_code}")
    except Exception as e:
        print(f"   ❌ Error: {e}")
    
    print()
    print("=" * 60)
    print("DIAGNOSIS COMPLETE")
    print("=" * 60)
    print()
    
    return True

def check_frontend_config():
    """Check frontend configuration."""
    print("=" * 60)
    print("CHECKING FRONTEND CONFIGURATION")
    print("=" * 60)
    print()
    
    try:
        with open("frontend/.env.local", "r") as f:
            content = f.read()
            print("Frontend .env.local contents:")
            print("-" * 60)
            print(content)
            print("-" * 60)
            print()
            
            if "localhost:8000" in content:
                print("✅ Frontend is configured to connect to localhost:8000")
            elif "localhost:8080" in content:
                print("❌ Frontend is configured for localhost:8080 (WRONG!)")
                print("   Should be: NEXT_PUBLIC_API_URL=http://localhost:8000")
            else:
                print("⚠️  Could not determine API URL configuration")
    except FileNotFoundError:
        print("❌ frontend/.env.local not found!")
        print("   Create it with:")
        print("   NEXT_PUBLIC_API_URL=http://localhost:8000")
    except Exception as e:
        print(f"❌ Error reading config: {e}")
    
    print()

if __name__ == "__main__":
    print()
    print("🔍 PawPal Connection Diagnostic Tool")
    print()
    
    # Check frontend config
    check_frontend_config()
    
    # Check backend
    backend_ok = check_backend()
    
    if backend_ok:
        print("✅ All checks passed! Your setup looks good.")
        print()
        print("Next steps:")
        print("1. Make sure frontend is running: cd frontend && npm run dev")
        print("2. Open http://localhost:3000 in your browser")
        print("3. Try the chat feature")
        sys.exit(0)
    else:
        print("❌ Some checks failed. Please fix the issues above.")
        print()
        print("To start the backend:")
        print("  python -m uvicorn app.main:app --reload")
        print()
        print("To start the frontend:")
        print("  cd frontend && npm run dev")
        sys.exit(1)
