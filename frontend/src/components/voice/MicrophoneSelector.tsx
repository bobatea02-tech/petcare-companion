/**
 * Microphone Device Selector Component
 * 
 * Allows users to select which microphone device to use for voice input.
 * Persists selection to localStorage for future sessions.
 */

import React, { useState, useEffect } from 'react';
import { Mic, Check } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface MicrophoneDevice {
  deviceId: string;
  label: string;
  groupId: string;
}

interface MicrophoneSelectorProps {
  onDeviceChange?: (deviceId: string) => void;
  className?: string;
}

export const MicrophoneSelector: React.FC<MicrophoneSelectorProps> = ({
  onDeviceChange,
  className = ''
}) => {
  const [devices, setDevices] = useState<MicrophoneDevice[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>('default');
  const [isLoading, setIsLoading] = useState(true);
  const [hasPermission, setHasPermission] = useState(false);

  /**
   * Load available microphone devices
   */
  const loadDevices = async () => {
    try {
      setIsLoading(true);

      // Request microphone permission first
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setHasPermission(true);

      // Get all audio input devices
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const audioDevices = allDevices
        .filter(device => device.kind === 'audioinput')
        .map(device => ({
          deviceId: device.deviceId,
          label: device.label || `Microphone ${device.deviceId.substring(0, 8)}`,
          groupId: device.groupId
        }));

      setDevices(audioDevices);

      // Stop the stream (we just needed it for permission)
      stream.getTracks().forEach(track => track.stop());

      // Load saved device preference
      const savedDevice = localStorage.getItem('preferred_microphone');
      if (savedDevice && audioDevices.some(d => d.deviceId === savedDevice)) {
        setSelectedDevice(savedDevice);
      } else if (audioDevices.length > 0) {
        setSelectedDevice(audioDevices[0].deviceId);
      }

      setIsLoading(false);
    } catch (error) {
      console.error('Error loading microphone devices:', error);
      setHasPermission(false);
      setIsLoading(false);
      
      toast.error('Microphone Access Required', {
        description: 'Please allow microphone access to select a device.'
      });
    }
  };

  /**
   * Handle device selection change
   */
  const handleDeviceChange = (deviceId: string) => {
    setSelectedDevice(deviceId);
    
    // Save preference
    localStorage.setItem('preferred_microphone', deviceId);
    
    // Notify parent component
    if (onDeviceChange) {
      onDeviceChange(deviceId);
    }
    
    toast.success('Microphone Changed', {
      description: devices.find(d => d.deviceId === deviceId)?.label || 'Device updated',
      duration: 2000
    });
  };

  /**
   * Test selected microphone
   */
  const testMicrophone = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          deviceId: selectedDevice ? { exact: selectedDevice } : undefined
        }
      });

      // Create audio context for visualization
      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      const microphone = audioContext.createMediaStreamSource(stream);
      microphone.connect(analyser);

      analyser.fftSize = 256;
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      // Check for audio input
      let hasAudio = false;
      const checkAudio = () => {
        analyser.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / bufferLength;
        
        if (average > 10) {
          hasAudio = true;
        }
      };

      // Check for 2 seconds
      const interval = setInterval(checkAudio, 100);

      setTimeout(() => {
        clearInterval(interval);
        stream.getTracks().forEach(track => track.stop());
        audioContext.close();

        if (hasAudio) {
          toast.success('Microphone Working!', {
            description: 'Audio input detected successfully.',
            duration: 3000
          });
        } else {
          toast.warning('No Audio Detected', {
            description: 'Please speak into the microphone or check your settings.',
            duration: 3000
          });
        }
      }, 2000);

      toast.info('Testing Microphone...', {
        description: 'Please speak into your microphone.',
        duration: 2000
      });

    } catch (error) {
      console.error('Error testing microphone:', error);
      toast.error('Test Failed', {
        description: 'Could not access the selected microphone.'
      });
    }
  };

  /**
   * Request microphone permission
   */
  const requestPermission = async () => {
    await loadDevices();
  };

  // Load devices on mount
  useEffect(() => {
    loadDevices();

    // Listen for device changes
    const handleDeviceChange = () => {
      loadDevices();
    };

    navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange);

    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', handleDeviceChange);
    };
  }, []);

  if (!hasPermission) {
    return (
      <div className={`space-y-3 ${className}`}>
        <Label>Microphone Device</Label>
        <div className="p-4 border border-border rounded-lg bg-muted/50">
          <p className="text-sm text-muted-foreground mb-3">
            Microphone permission required to select device
          </p>
          <Button
            onClick={requestPermission}
            size="sm"
            className="w-full"
          >
            <Mic className="w-4 h-4 mr-2" />
            Grant Microphone Access
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={`space-y-3 ${className}`}>
        <Label>Microphone Device</Label>
        <div className="p-4 border border-border rounded-lg bg-muted/50">
          <p className="text-sm text-muted-foreground">
            Loading microphone devices...
          </p>
        </div>
      </div>
    );
  }

  if (devices.length === 0) {
    return (
      <div className={`space-y-3 ${className}`}>
        <Label>Microphone Device</Label>
        <div className="p-4 border border-border rounded-lg bg-muted/50">
          <p className="text-sm text-muted-foreground">
            No microphone devices found
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <Label htmlFor="microphone-select">Microphone Device</Label>
      
      <Select
        value={selectedDevice}
        onValueChange={handleDeviceChange}
      >
        <SelectTrigger id="microphone-select" className="w-full">
          <SelectValue placeholder="Select microphone" />
        </SelectTrigger>
        <SelectContent>
          {devices.map((device) => (
            <SelectItem key={device.deviceId} value={device.deviceId}>
              <div className="flex items-center gap-2">
                <Mic className="w-4 h-4" />
                <span>{device.label}</span>
                {device.deviceId === selectedDevice && (
                  <Check className="w-4 h-4 ml-auto text-primary" />
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button
        onClick={testMicrophone}
        variant="outline"
        size="sm"
        className="w-full"
      >
        <Mic className="w-4 h-4 mr-2" />
        Test Microphone
      </Button>

      <p className="text-xs text-muted-foreground">
        {devices.length} microphone{devices.length !== 1 ? 's' : ''} available
      </p>
    </div>
  );
};

export default MicrophoneSelector;

/**
 * Hook to get selected microphone device ID
 */
export const useSelectedMicrophone = (): string | undefined => {
  const [deviceId, setDeviceId] = useState<string | undefined>();

  useEffect(() => {
    const savedDevice = localStorage.getItem('preferred_microphone');
    if (savedDevice) {
      setDeviceId(savedDevice);
    }
  }, []);

  return deviceId;
};

/**
 * Get user media with selected microphone
 */
export const getUserMediaWithSelectedMicrophone = async (
  constraints: MediaStreamConstraints = {}
): Promise<MediaStream> => {
  const savedDevice = localStorage.getItem('preferred_microphone');
  
  const audioConstraints: MediaTrackConstraints = {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
    ...(typeof constraints.audio === 'object' ? constraints.audio : {}),
  };

  // Add device ID if saved
  if (savedDevice && savedDevice !== 'default') {
    audioConstraints.deviceId = { exact: savedDevice };
  }

  return navigator.mediaDevices.getUserMedia({
    ...constraints,
    audio: audioConstraints
  });
};
