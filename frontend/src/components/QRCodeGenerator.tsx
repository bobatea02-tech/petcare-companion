/**
 * QRCodeGenerator Component
 * Generates and displays QR codes for shareable pet profiles
 */

import React, { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Copy, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface QRCodeGeneratorProps {
  qrCodeData: string;
  shareUrl: string;
  petName: string;
}

export const QRCodeGenerator: React.FC<QRCodeGeneratorProps> = ({
  qrCodeData,
  shareUrl,
  petName,
}) => {
  const { toast } = useToast();
  const qrRef = useRef<HTMLDivElement>(null);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast({
        title: 'Success',
        description: 'Link copied to clipboard',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to copy link',
        variant: 'destructive',
      });
    }
  };

  const handleDownloadQR = () => {
    try {
      const svg = qrRef.current?.querySelector('svg');
      if (!svg) {
        throw new Error('QR code not found');
      }

      // Convert SVG to data URL
      const svgData = new XMLSerializer().serializeToString(svg);
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const svgUrl = URL.createObjectURL(svgBlob);

      // Create download link
      const downloadLink = document.createElement('a');
      downloadLink.href = svgUrl;
      downloadLink.download = `${petName.replace(/\s+/g, '-')}-profile-qr.svg`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      URL.revokeObjectURL(svgUrl);

      toast({
        title: 'Success',
        description: 'QR code downloaded',
      });
    } catch (error) {
      console.error('Error downloading QR code:', error);
      toast({
        title: 'Error',
        description: 'Failed to download QR code',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* QR Code Display */}
      <div className="flex justify-center p-6 bg-white rounded-lg border">
        <div ref={qrRef} className="relative">
          <QRCodeSVG
            value={qrCodeData}
            size={256}
            level="H"
            includeMargin={true}
            className="rounded-lg"
          />
        </div>
      </div>

      {/* Share URL */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Share Link</label>
        <div className="flex gap-2">
          <Input
            value={shareUrl}
            readOnly
            className="flex-1 font-mono text-sm"
          />
          <Button
            variant="outline"
            size="icon"
            onClick={handleCopyLink}
            title="Copy link"
          >
            <Copy className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={handleDownloadQR}
          className="flex-1 gap-2"
        >
          <Download className="h-4 w-4" />
          Download QR Code
        </Button>
      </div>

      {/* Instructions */}
      <div className="text-sm text-muted-foreground space-y-2">
        <p className="font-medium">How to share:</p>
        <ul className="list-disc list-inside space-y-1 ml-2">
          <li>Show the QR code for others to scan</li>
          <li>Copy and share the link via WhatsApp, email, or SMS</li>
          <li>Download the QR code to print or share digitally</li>
        </ul>
      </div>
    </div>
  );
};
