/**
 * Multi-Pet Comparison Page
 * Displays side-by-side comparison of health metrics across all user's pets
 * Feature: additional-amazing-features
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { MultiPetDashboard } from '@/components/MultiPetDashboard';
import { Pet } from '@/services/ComparisonService';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';

export default function MultiPetComparison() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPets();
  }, []);

  const fetchPets = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.getPets();

      if (response.error) {
        console.error('API Error:', response.error);
        const errorMsg = `Failed to load pets: ${response.error}`;
        setError(errorMsg);
        toast.error(errorMsg);
        throw new Error(response.error);
      }

      const data = response.data;
      
      if (!data || !data.pets) {
        console.warn('No pets data in response:', data);
        setPets([]);
        return;
      }
      
      setPets(data.pets.map((pet: any) => ({
        id: pet.id,
        name: pet.name,
        species: pet.species,
        breed: pet.breed,
        dateOfBirth: pet.birth_date ? new Date(pet.birth_date) : undefined,
      })));
    } catch (error) {
      console.error('Error fetching pets:', error);
      const errorMsg = `Failed to load pets: ${error instanceof Error ? error.message : 'Unknown error'}`;
      setError(errorMsg);
      toast.error(errorMsg);
      setPets([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-forest via-moss to-sage">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-cream border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-cream font-body">Loading comparison...</p>
        </div>
      </div>
    );
  }

  if (pets.length < 2) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-forest via-moss to-sage p-6">
        <div className="max-w-4xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => navigate('/dashboard')}
            className="mb-6 text-cream hover:text-white"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
          
          <div className="bg-white rounded-card p-12 text-center shadow-forest">
            <h1 className="font-display text-3xl text-forest mb-4">
              Multi-Pet Comparison
            </h1>
            {error ? (
              <>
                <p className="text-red-600 mb-4">{error}</p>
                <Button onClick={fetchPets} className="mr-2">
                  Retry
                </Button>
                <Button variant="outline" onClick={() => navigate('/dashboard')}>
                  Back to Dashboard
                </Button>
              </>
            ) : (
              <>
                <p className="text-moss mb-6">
                  You need at least 2 pets to use the comparison feature.
                </p>
                <Button onClick={() => navigate('/dashboard')}>
                  Add More Pets
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-forest via-moss to-sage p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => navigate('/dashboard')}
            className="text-cream hover:text-white"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
          
          <h1 className="font-display text-3xl text-cream">
            Compare Your Pets
          </h1>
          
          <div className="w-32" /> {/* Spacer for centering */}
        </div>

        <MultiPetDashboard userId={user?.id || ''} pets={pets} />
      </div>
    </div>
  );
}
