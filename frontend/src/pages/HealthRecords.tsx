import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Activity, Syringe, TrendingUp, Download, Plus, Archive, ArchiveRestore } from "lucide-react";
import { toast } from "sonner";

interface Pet {
  id: string;
  name: string;
  species: string;
  breed?: string;
  birth_date: string;
  weight?: number;
}

interface HealthRecord {
  id: string;
  record_date: string;
  record_type: string;
  description: string;
  veterinarian?: string;
  clinic_name?: string;
  diagnosis?: string;
  treatment_plan?: string;
  weight?: number;
  is_archived?: boolean;
  archived_at?: string;
}

interface WeightEntry {
  date: string;
  weight: number;
  source: string;
}

interface Vaccination {
  id: string;
  vaccine_name: string;
  vaccine_type: string;
  administered_date: string;
  expiration_date?: string;
  veterinarian?: string;
  clinic_name?: string;
  is_expired: boolean;
  days_until_expiration?: number;
}

export default function HealthRecords() {
  const { petId } = useParams<{ petId: string }>();
  const [pet, setPet] = useState<Pet | null>(null);
  const [healthRecords, setHealthRecords] = useState<HealthRecord[]>([]);
  const [vaccinations, setVaccinations] = useState<Vaccination[]>([]);
  const [weightHistory, setWeightHistory] = useState<WeightEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showArchived, setShowArchived] = useState(false);

  useEffect(() => {
    if (petId) {
      fetchHealthData();
    }
  }, [petId, showArchived]);

  const fetchHealthData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      
      console.log("Fetching pet data for ID:", petId);
      
      // Fetch pet details
      const petResponse = await fetch(`http://localhost:8000/api/v1/pets/${petId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      console.log("Pet response status:", petResponse.status);
      
      let petData: Pet | null = null;
      if (petResponse.ok) {
        petData = await petResponse.json();
        console.log("Pet data received:", petData);
        setPet(petData);
      } else {
        const errorText = await petResponse.text();
        console.error("Failed to fetch pet:", petResponse.status, errorText);
        toast.error("Failed to load pet information");
        setLoading(false);
        return;
      }

      // Fetch health records
      const archivedParam = showArchived ? 'true' : 'false';
      const recordsResponse = await fetch(
        `http://localhost:8000/api/v1/health-records/pet/${petId}?archived=${archivedParam}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      
      console.log("Health records response status:", recordsResponse.status);
      
      if (recordsResponse.ok) {
        const recordsData = await recordsResponse.json();
        console.log("Health records data:", recordsData);
        setHealthRecords(recordsData.records || []);
        
        // Extract vaccinations from health records
        const allVaccinations: Vaccination[] = [];
        recordsData.records?.forEach((record: HealthRecord & { vaccinations?: Vaccination[] }) => {
          if (record.vaccinations) {
            allVaccinations.push(...record.vaccinations);
          }
        });
        setVaccinations(allVaccinations);

        // Extract weight history from records and pet profile
        const weights: WeightEntry[] = [];
        
        // Add current weight from pet profile
        if (petData?.weight) {
          weights.push({
            date: new Date().toISOString(),
            weight: petData.weight,
            source: "Current Profile"
          });
        }

        // Extract weights from health records (checkups, etc.)
        recordsData.records?.forEach((record: HealthRecord) => {
          if (record.weight) {
            weights.push({
              date: record.record_date,
              weight: record.weight,
              source: record.record_type.replace("_", " ")
            });
          }
        });

        setWeightHistory(weights.sort((a, b) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        ));
      } else {
        console.error("Failed to fetch health records:", recordsResponse.status);
        // Don't show error for health records, just continue with empty data
      }
    } catch (error) {
      console.error("Error fetching health data:", error);
      toast.error("Failed to load health records");
    } finally {
      setLoading(false);
    }
  };

  const exportHealthSummary = async (format: "json" | "pdf") => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:8000/api/v1/health-records/pet/${petId}/export/${format}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${pet?.name}-health-summary.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success(`Health summary exported as ${format.toUpperCase()}`);
      }
    } catch (error) {
      console.error("Error exporting health summary:", error);
      toast.error("Failed to export health summary");
    }
  };

  const toggleArchiveRecord = async (recordId: string, currentlyArchived: boolean) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:8000/api/v1/health-records/${recordId}/archive?archive=${!currentlyArchived}`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      
      if (response.ok) {
        toast.success(currentlyArchived ? "Record restored to current" : "Record moved to history");
        fetchHealthData(); // Refresh the data
      } else {
        toast.error("Failed to update record");
      }
    } catch (error) {
      console.error("Error archiving record:", error);
      toast.error("Failed to update record");
    }
  };

  const getRecordTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      symptom_log: "bg-yellow-100 text-yellow-800",
      vaccination: "bg-green-100 text-green-800",
      checkup: "bg-blue-100 text-blue-800",
      emergency: "bg-red-100 text-red-800",
      surgery: "bg-purple-100 text-purple-800",
      diagnostic: "bg-indigo-100 text-indigo-800",
    };
    return colors[type] || "bg-gray-100 text-gray-800";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading health records...</p>
        </div>
      </div>
    );
  }

  if (!pet) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Pet not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{pet.name}'s Health Records</h1>
          <p className="text-muted-foreground mt-1">
            {pet.species} • {pet.breed || "Mixed"} • {pet.weight ? `${pet.weight} lbs` : "Weight not recorded"}
          </p>
        </div>
        <div className="flex gap-2 items-center">
          <Button 
            variant={showArchived ? "outline" : "default"}
            onClick={() => { setShowArchived(false); fetchHealthData(); }}
            size="sm"
          >
            Current
          </Button>
          <Button 
            variant={showArchived ? "default" : "outline"}
            onClick={() => { setShowArchived(true); fetchHealthData(); }}
            size="sm"
          >
            History
          </Button>
          <Button variant="outline" onClick={() => exportHealthSummary("json")}>
            <Download className="mr-2 h-4 w-4" />
            Export JSON
          </Button>
          <Button variant="outline" onClick={() => exportHealthSummary("pdf")}>
            <Download className="mr-2 h-4 w-4" />
            Export PDF
          </Button>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Record
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="timeline" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="timeline">
            <Activity className="mr-2 h-4 w-4" />
            Timeline
          </TabsTrigger>
          <TabsTrigger value="medical">
            <Calendar className="mr-2 h-4 w-4" />
            Medical History
          </TabsTrigger>
          <TabsTrigger value="vaccinations">
            <Syringe className="mr-2 h-4 w-4" />
            Vaccinations
          </TabsTrigger>
          <TabsTrigger value="weight">
            <TrendingUp className="mr-2 h-4 w-4" />
            Weight Tracking
          </TabsTrigger>
        </TabsList>

        {/* Health Timeline Tab */}
        <TabsContent value="timeline" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Health Timeline</CardTitle>
              <CardDescription>Chronological view of all health events</CardDescription>
            </CardHeader>
            <CardContent>
              {healthRecords.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No health records yet</p>
              ) : (
                <div className="space-y-4">
                  {healthRecords
                    .sort((a, b) => new Date(b.record_date).getTime() - new Date(a.record_date).getTime())
                    .map((record) => (
                      <div key={record.id} className="flex gap-4 border-l-2 border-primary pl-4 py-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge className={getRecordTypeColor(record.record_type)}>
                              {record.record_type.replace("_", " ")}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              {new Date(record.record_date).toLocaleDateString()}
                            </span>
                            {record.is_archived && (
                              <Badge variant="outline" className="text-xs">
                                Archived
                              </Badge>
                            )}
                          </div>
                          <p className="font-medium">{record.description}</p>
                          {record.diagnosis && (
                            <p className="text-sm text-muted-foreground mt-1">
                              Diagnosis: {record.diagnosis}
                            </p>
                          )}
                          {record.treatment_plan && (
                            <p className="text-sm text-muted-foreground">
                              Treatment: {record.treatment_plan}
                            </p>
                          )}
                          {record.veterinarian && (
                            <p className="text-sm text-muted-foreground">
                              Vet: {record.veterinarian} {record.clinic_name && `at ${record.clinic_name}`}
                            </p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleArchiveRecord(record.id, record.is_archived || false)}
                          title={record.is_archived ? "Restore to current" : "Move to history"}
                        >
                          {record.is_archived ? (
                            <ArchiveRestore className="h-4 w-4" />
                          ) : (
                            <Archive className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Medical History Tab */}
        <TabsContent value="medical" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Medical History</CardTitle>
              <CardDescription>Complete medical records and visits</CardDescription>
            </CardHeader>
            <CardContent>
              {healthRecords.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No medical records yet</p>
              ) : (
                <div className="space-y-4">
                  {healthRecords
                    .filter((r) => r.record_type !== "vaccination")
                    .sort((a, b) => new Date(b.record_date).getTime() - new Date(a.record_date).getTime())
                    .map((record) => (
                      <Card key={record.id}>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 flex-1">
                              <Badge className={getRecordTypeColor(record.record_type)}>
                                {record.record_type.replace("_", " ")}
                              </Badge>
                              <CardTitle className="text-lg">{record.description}</CardTitle>
                              {record.is_archived && (
                                <Badge variant="outline" className="text-xs">
                                  Archived
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-muted-foreground">
                                {new Date(record.record_date).toLocaleDateString()}
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleArchiveRecord(record.id, record.is_archived || false)}
                                title={record.is_archived ? "Restore to current" : "Move to history"}
                              >
                                {record.is_archived ? (
                                  <ArchiveRestore className="h-4 w-4" />
                                ) : (
                                  <Archive className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          {record.diagnosis && (
                            <div>
                              <p className="text-sm font-medium">Diagnosis:</p>
                              <p className="text-sm text-muted-foreground">{record.diagnosis}</p>
                            </div>
                          )}
                          {record.treatment_plan && (
                            <div>
                              <p className="text-sm font-medium">Treatment Plan:</p>
                              <p className="text-sm text-muted-foreground">{record.treatment_plan}</p>
                            </div>
                          )}
                          {record.veterinarian && (
                            <div>
                              <p className="text-sm font-medium">Veterinarian:</p>
                              <p className="text-sm text-muted-foreground">
                                {record.veterinarian}
                                {record.clinic_name && ` - ${record.clinic_name}`}
                              </p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Vaccinations Tab */}
        <TabsContent value="vaccinations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Vaccination Records</CardTitle>
              <CardDescription>Track all vaccinations and their expiration dates</CardDescription>
            </CardHeader>
            <CardContent>
              {vaccinations.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No vaccination records yet</p>
              ) : (
                <div className="space-y-4">
                  {vaccinations
                    .sort((a, b) => new Date(b.administered_date).getTime() - new Date(a.administered_date).getTime())
                    .map((vaccination) => (
                      <Card key={vaccination.id} className={vaccination.is_expired ? "border-red-200" : ""}>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">{vaccination.vaccine_name}</CardTitle>
                            <div className="flex items-center gap-2">
                              {vaccination.is_expired ? (
                                <Badge variant="destructive">Expired</Badge>
                              ) : vaccination.days_until_expiration && vaccination.days_until_expiration <= 30 ? (
                                <Badge className="bg-yellow-100 text-yellow-800">
                                  Due in {vaccination.days_until_expiration} days
                                </Badge>
                              ) : (
                                <Badge className="bg-green-100 text-green-800">Active</Badge>
                              )}
                            </div>
                          </div>
                          <CardDescription>{vaccination.vaccine_type}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="font-medium">Administered:</p>
                              <p className="text-muted-foreground">
                                {new Date(vaccination.administered_date).toLocaleDateString()}
                              </p>
                            </div>
                            {vaccination.expiration_date && (
                              <div>
                                <p className="font-medium">Expires:</p>
                                <p className="text-muted-foreground">
                                  {new Date(vaccination.expiration_date).toLocaleDateString()}
                                </p>
                              </div>
                            )}
                            {vaccination.veterinarian && (
                              <div>
                                <p className="font-medium">Veterinarian:</p>
                                <p className="text-muted-foreground">{vaccination.veterinarian}</p>
                              </div>
                            )}
                            {vaccination.clinic_name && (
                              <div>
                                <p className="font-medium">Clinic:</p>
                                <p className="text-muted-foreground">{vaccination.clinic_name}</p>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Weight Tracking Tab */}
        <TabsContent value="weight" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Weight Tracking</CardTitle>
              <CardDescription>Monitor your pet's weight over time</CardDescription>
            </CardHeader>
            <CardContent>
              {pet.weight ? (
                <div className="space-y-6">
                  {/* Current Weight Display */}
                  <div className="flex items-center justify-center">
                    <div className="bg-primary/10 rounded-lg p-6 text-center">
                      <p className="text-sm text-muted-foreground mb-2">Current Weight</p>
                      <p className="text-4xl font-bold">{pet.weight} lbs</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        Last updated: {new Date().toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {/* Weight History */}
                  {weightHistory.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Weight History</h3>
                      <div className="space-y-3">
                        {weightHistory.map((entry, index) => {
                          const prevWeight = weightHistory[index + 1]?.weight;
                          const weightChange = prevWeight ? entry.weight - prevWeight : 0;
                          const changePercent = prevWeight ? ((weightChange / prevWeight) * 100).toFixed(1) : 0;

                          return (
                            <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                              <div className="flex-1">
                                <p className="font-medium">{entry.weight} lbs</p>
                                <p className="text-sm text-muted-foreground">
                                  {new Date(entry.date).toLocaleDateString()} • {entry.source}
                                </p>
                              </div>
                              {weightChange !== 0 && (
                                <div className={`flex items-center gap-1 ${weightChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  <TrendingUp className={`h-4 w-4 ${weightChange < 0 ? 'rotate-180' : ''}`} />
                                  <span className="text-sm font-medium">
                                    {weightChange > 0 ? '+' : ''}{weightChange.toFixed(1)} lbs ({changePercent}%)
                                  </span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Add Weight Button */}
                  <Button className="w-full" variant="outline">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Weight Entry
                  </Button>
                </div>
              ) : (
                <div className="text-center py-8">
                  <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">
                    No weight data recorded yet
                  </p>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add First Weight Entry
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}