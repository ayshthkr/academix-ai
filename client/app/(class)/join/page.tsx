"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

// Component that uses useSearchParams
const JoinClassForm = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const classCode = searchParams.get("code");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [classDetails, setClassDetails] = useState<any>(null);

  useEffect(() => {
    if (!classCode) {
      setError("No class code provided");
      return;
    }

    // Fetch class details based on the code
    const fetchClassDetails = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/classes/details?code=${classCode}`);
        if (!response.ok) {
          throw new Error("Class not found or invalid code");
        }
        const data = await response.json();
        setClassDetails(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch class details"
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchClassDetails();
  }, [classCode]);

  const handleJoinClass = async () => {
    if (!classCode) return;

    try {
      setIsLoading(true);
      const response = await fetch("/api/classes/join", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ classCode }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to join class");
      }

      setSuccess(true);
      setTimeout(() => {
        router.push(`/class/${classCode}`);
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <CardHeader>
        <CardTitle>Join Class</CardTitle>
        <CardDescription>
          {isLoading
            ? "Loading class information..."
            : "Join a class using the provided code"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="size-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-4 bg-green-50 border-green-300">
            <Check className="size-4 text-green-500" />
            <AlertTitle className="text-green-700">Success!</AlertTitle>
            <AlertDescription className="text-green-600">
              You have successfully joined the class. Redirecting...
            </AlertDescription>
          </Alert>
        )}

        {classDetails && !error && !success && (
          <div className="space-y-4">
            <div>
              <h3 className="font-medium">Class: {classDetails.title}</h3>
              <p className="text-sm text-muted-foreground">
                {classDetails.description}
              </p>
            </div>
            <div>
              <p className="text-sm">Click join to enroll in this class:</p>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button
          onClick={handleJoinClass}
          disabled={isLoading || !!error || success || !classDetails}
          className="w-full"
        >
          {isLoading ? "Processing..." : "Join Class"}
        </Button>
      </CardFooter>
    </>
  );
};

// Main page component with Suspense
export default function JoinClassPage() {
  return (
    <div className="container max-w-md mx-auto py-10">
      <Card>
        <Suspense
          fallback={
            <CardHeader>
              <CardTitle>Join Class</CardTitle>
              <CardDescription>Loading class information...</CardDescription>
            </CardHeader>
          }
        >
          <JoinClassForm />
        </Suspense>
      </Card>
    </div>
  );
}
