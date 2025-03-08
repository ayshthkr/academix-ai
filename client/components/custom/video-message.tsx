"use client";

import { useEffect, useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, CheckCircle } from "lucide-react";

type VideoMessageProps = {
  url: string;
};

export function VideoMessage({ url }: VideoMessageProps) {
  const [content, setContent] = useState<string | null>(null);
  const [isVideo, setIsVideo] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [downloaded, setDownloaded] = useState<boolean>(false);
  const [downloading, setDownloading] = useState<boolean>(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Function to download the video to client device
  const downloadVideo = async () => {
    try {
      setDownloading(true);
      const response = await fetch(url);
      const blob = await response.blob();

      // Create a temporary link to download the file
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');

      // Extract filename from URL or use a default
      const urlParts = url.split('/');
      const filename = urlParts[urlParts.length - 1] || 'video.mp4';

      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setDownloaded(true);
      setDownloading(false);
    } catch (err) {
      setError("Error downloading video");
      setDownloading(false);
    }
  };

  useEffect(() => {
    const checkUrl = async () => {
      try {
        const response = await fetch(url);

        if (response.status === 200) {
          const contentType = response.headers.get('content-type');

          if (contentType && contentType.includes('video')) {
            setIsVideo(true);
            setIsLoading(false);
            // Stop polling once video is available
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
            }
          } else if (contentType && contentType.includes('text')) {
            const textResponse = await fetch(url);
            const text = await textResponse.text();
            setContent(text);
            setIsLoading(false);
            setIsVideo(false);
          } else {
            // Keep polling if content isn't ready
            setIsLoading(true);
          }
        } else {
          // Resource not found, continue polling
          setIsLoading(true);
        }
      } catch (err) {
        setError("Error checking resource");
        setIsLoading(true);
      }
    };

    // Initial check
    checkUrl();

    // Set up polling every 2 seconds
    intervalRef.current = setInterval(checkUrl, 2000);

    // Clean up interval on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [url]);

  if (error) {
    return <div className="text-red-500">Error: {error}</div>;
  }

  if (isLoading) {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="p-4">
          <div className="flex items-center justify-center">
            <p>Loading content from {url}...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isVideo) {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="p-4">
          <video controls className="w-full rounded-md mb-3">
            <source src={url} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
          <div className="flex justify-end">
            <Button
              onClick={downloadVideo}
              disabled={downloading || downloaded}
              variant="outline"
              size="sm"
              className="flex items-center gap-1"
            >
              {downloading ? (
                "Downloading..."
              ) : downloaded ? (
                <>
                  <CheckCircle size={16} className="text-green-500" />
                  <span>Downloaded</span>
                </>
              ) : (
                <>
                  <Download size={16} />
                  <span>Download Video</span>
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardContent className="p-4">
        <pre className="whitespace-pre-wrap">{content}</pre>
      </CardContent>
    </Card>
  );
}
