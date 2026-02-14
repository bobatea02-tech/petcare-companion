import { useState } from 'react';
import { api } from '@/lib/api';

export default function TestMumbaiAPI() {
  const [results, setResults] = useState<any>({});
  const [loading, setLoading] = useState(false);

  const testEndpoint = async (name: string, apiCall: () => Promise<any>) => {
    setLoading(true);
    try {
      const response = await apiCall();
      setResults((prev: any) => ({
        ...prev,
        [name]: { success: true, data: response },
      }));
    } catch (error) {
      setResults((prev: any) => ({
        ...prev,
        [name]: { success: false, error: String(error) },
      }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Mumbai API Test</h1>

        <div className="space-y-4">
          <button
            onClick={() => testEndpoint('health', () => api.healthCheck())}
            disabled={loading}
            className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            Test Health Check
          </button>

          <button
            onClick={() => testEndpoint('areas', () => api.getMumbaiAreas())}
            disabled={loading}
            className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
          >
            Test Get Mumbai Areas
          </button>

          <button
            onClick={() => testEndpoint('services', () => api.getServiceTypes())}
            disabled={loading}
            className="w-full px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50"
          >
            Test Get Service Types
          </button>
        </div>

        <div className="mt-8 space-y-4">
          {Object.entries(results).map(([name, result]: [string, any]) => (
            <div
              key={name}
              className={`p-4 rounded ${
                result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
              }`}
            >
              <h3 className="font-bold mb-2">{name}</h3>
              {result.success ? (
                <pre className="text-sm overflow-auto">
                  {JSON.stringify(result.data, null, 2)}
                </pre>
              ) : (
                <p className="text-red-700">{result.error}</p>
              )}
            </div>
          ))}
        </div>

        <div className="mt-8 p-4 bg-gray-100 rounded">
          <h3 className="font-bold mb-2">API Base URL:</h3>
          <p className="text-sm font-mono">{import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'}</p>
        </div>
      </div>
    </div>
  );
}
