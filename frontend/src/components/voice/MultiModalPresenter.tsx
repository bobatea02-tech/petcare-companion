import React, { useEffect, useState, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export interface VisualData {
  type: 'chart' | 'timeline' | 'calendar' | 'list' | 'table';
  title: string;
  data: any;
  highlightKey?: string; // Key to highlight in sync with speech
}

export interface MultiModalPresenterProps {
  visualData: VisualData | null;
  isActive: boolean;
  currentSpeechSegment?: string; // Current segment being spoken
  onVisualizationComplete?: () => void;
}

/**
 * MultiModalPresenter Component
 * 
 * Provides synchronized voice and visual output for JoJo voice assistant.
 * Displays charts, timelines, calendars, and lists while highlighting
 * elements in real-time as they are mentioned in speech.
 * 
 * Features:
 * - Health data charts with real-time highlighting
 * - Appointment calendars with date highlighting
 * - Feeding/medication timelines
 * - Synchronized visual feedback during speech
 */
export const MultiModalPresenter: React.FC<MultiModalPresenterProps> = ({
  visualData,
  isActive,
  currentSpeechSegment,
  onVisualizationComplete
}) => {
  const [highlightedItem, setHighlightedItem] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync highlighting with speech
  useEffect(() => {
    if (currentSpeechSegment && visualData?.highlightKey) {
      // Extract key from speech segment (e.g., "weight" from "Your pet's weight is...")
      const key = extractKeyFromSpeech(currentSpeechSegment, visualData.highlightKey);
      setHighlightedItem(key);
      
      // Auto-clear highlight after 2 seconds
      const timer = setTimeout(() => setHighlightedItem(null), 2000);
      return () => clearTimeout(timer);
    }
  }, [currentSpeechSegment, visualData]);

  // Notify when visualization is complete
  useEffect(() => {
    if (visualData && isActive) {
      const timer = setTimeout(() => {
        onVisualizationComplete?.();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [visualData, isActive, onVisualizationComplete]);

  if (!visualData || !isActive) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        "w-full transition-all duration-300",
        isActive ? "opacity-100 scale-100" : "opacity-0 scale-95"
      )}
    >
      <Card className="p-6 bg-gradient-to-br from-background to-muted/20">
        <h3 className="text-lg font-semibold mb-4">{visualData.title}</h3>
        
        {visualData.type === 'chart' && (
          <HealthChart
            data={visualData.data}
            highlightedItem={highlightedItem}
          />
        )}
        
        {visualData.type === 'timeline' && (
          <Timeline
            data={visualData.data}
            highlightedItem={highlightedItem}
          />
        )}
        
        {visualData.type === 'calendar' && (
          <CalendarView
            data={visualData.data}
            highlightedItem={highlightedItem}
          />
        )}
        
        {visualData.type === 'list' && (
          <ListView
            data={visualData.data}
            highlightedItem={highlightedItem}
          />
        )}
        
        {visualData.type === 'table' && (
          <TableView
            data={visualData.data}
            highlightedItem={highlightedItem}
          />
        )}
      </Card>
    </div>
  );
};

// Helper function to extract key from speech
function extractKeyFromSpeech(speech: string, highlightKey: string): string | null {
  const lowerSpeech = speech.toLowerCase();
  const lowerKey = highlightKey.toLowerCase();
  
  if (lowerSpeech.includes(lowerKey)) {
    return highlightKey;
  }
  
  return null;
}

// Health Chart Component
interface HealthChartProps {
  data: Array<{ name: string; value: number; date?: string }>;
  highlightedItem: string | null;
}

const HealthChart: React.FC<HealthChartProps> = ({ data, highlightedItem }) => {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line
          type="monotone"
          dataKey="value"
          stroke="#8884d8"
          strokeWidth={2}
          dot={(props: any) => {
            const isHighlighted = highlightedItem && props.payload.name === highlightedItem;
            return (
              <circle
                cx={props.cx}
                cy={props.cy}
                r={isHighlighted ? 8 : 4}
                fill={isHighlighted ? "#ff6b6b" : "#8884d8"}
                className={cn(
                  "transition-all duration-300",
                  isHighlighted && "animate-pulse"
                )}
              />
            );
          }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

// Timeline Component
interface TimelineProps {
  data: Array<{ id: string; time: string; title: string; description: string }>;
  highlightedItem: string | null;
}

const Timeline: React.FC<TimelineProps> = ({ data, highlightedItem }) => {
  return (
    <div className="space-y-4">
      {data.map((item) => {
        const isHighlighted = highlightedItem === item.id;
        return (
          <div
            key={item.id}
            className={cn(
              "flex gap-4 p-4 rounded-lg transition-all duration-300",
              isHighlighted
                ? "bg-primary/20 border-2 border-primary scale-105"
                : "bg-muted/50 border border-transparent"
            )}
          >
            <div className="flex-shrink-0 w-16 text-sm font-medium text-muted-foreground">
              {item.time}
            </div>
            <div className="flex-1">
              <h4 className="font-semibold">{item.title}</h4>
              <p className="text-sm text-muted-foreground">{item.description}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// Calendar View Component
interface CalendarViewProps {
  data: {
    appointments: Array<{ date: Date; title: string; id: string }>;
  };
  highlightedItem: string | null;
}

const CalendarView: React.FC<CalendarViewProps> = ({ data, highlightedItem }) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  
  // Highlight dates with appointments
  const appointmentDates = data.appointments.map(apt => format(apt.date, 'yyyy-MM-dd'));
  
  return (
    <div className="space-y-4">
      <Calendar
        mode="single"
        selected={selectedDate}
        onSelect={setSelectedDate}
        className="rounded-md border"
        modifiers={{
          appointment: (date) => appointmentDates.includes(format(date, 'yyyy-MM-dd')),
          highlighted: (date) => {
            const apt = data.appointments.find(
              a => format(a.date, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd') && a.id === highlightedItem
            );
            return !!apt;
          }
        }}
        modifiersStyles={{
          appointment: { fontWeight: 'bold', textDecoration: 'underline' },
          highlighted: { backgroundColor: 'hsl(var(--primary))', color: 'white', borderRadius: '50%' }
        }}
      />
      
      <div className="space-y-2">
        {data.appointments.map((apt) => {
          const isHighlighted = highlightedItem === apt.id;
          return (
            <div
              key={apt.id}
              className={cn(
                "p-3 rounded-lg transition-all duration-300",
                isHighlighted
                  ? "bg-primary/20 border-2 border-primary"
                  : "bg-muted/50"
              )}
            >
              <div className="font-medium">{format(apt.date, 'PPP')}</div>
              <div className="text-sm text-muted-foreground">{apt.title}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// List View Component
interface ListViewProps {
  data: Array<{ id: string; title: string; subtitle?: string; value?: string }>;
  highlightedItem: string | null;
}

const ListView: React.FC<ListViewProps> = ({ data, highlightedItem }) => {
  return (
    <div className="space-y-2">
      {data.map((item) => {
        const isHighlighted = highlightedItem === item.id;
        return (
          <div
            key={item.id}
            className={cn(
              "flex items-center justify-between p-4 rounded-lg transition-all duration-300",
              isHighlighted
                ? "bg-primary/20 border-2 border-primary scale-105"
                : "bg-muted/50 border border-transparent"
            )}
          >
            <div>
              <div className="font-medium">{item.title}</div>
              {item.subtitle && (
                <div className="text-sm text-muted-foreground">{item.subtitle}</div>
              )}
            </div>
            {item.value && (
              <div className="text-lg font-semibold">{item.value}</div>
            )}
          </div>
        );
      })}
    </div>
  );
};

// Table View Component
interface TableViewProps {
  data: {
    headers: string[];
    rows: Array<{ id: string; cells: string[] }>;
  };
  highlightedItem: string | null;
}

const TableView: React.FC<TableViewProps> = ({ data, highlightedItem }) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b">
            {data.headers.map((header, index) => (
              <th key={index} className="px-4 py-2 text-left font-semibold">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.rows.map((row) => {
            const isHighlighted = highlightedItem === row.id;
            return (
              <tr
                key={row.id}
                className={cn(
                  "border-b transition-all duration-300",
                  isHighlighted
                    ? "bg-primary/20 border-primary"
                    : "hover:bg-muted/50"
                )}
              >
                {row.cells.map((cell, index) => (
                  <td key={index} className="px-4 py-2">
                    {cell}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default MultiModalPresenter;
