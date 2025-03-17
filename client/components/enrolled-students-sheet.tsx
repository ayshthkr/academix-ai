"use client";

import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetDescription
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { UsersRound, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type Student = {
  id: string;
  email: string;
  joinedAt: string;
};

export function EnrolledStudentsSheet({ classId }: { classId: string }) {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const fetchEnrolledStudents = async () => {
      if (!classId) return;

      try {
        setLoading(true);
        setError(null);
        const response = await fetch(`/api/classes/${classId}/students`);

        if (!response.ok) {
          throw new Error("Failed to fetch enrolled students");
        }

        const data = await response.json();
        setStudents(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    if (open) {
      fetchEnrolledStudents();
    }
  }, [open, classId]);

  const getInitials = (email: string) => {
    return email.substring(0, 2).toUpperCase();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <UsersRound className="size-4" />
          <span>View Enrolled Students</span>
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Enrolled Students</SheetTitle>
          <SheetDescription>
            Students currently enrolled in this class
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="text-center text-red-500 py-4">{error}</div>
          ) : students.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No students enrolled yet
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                Total students: {students.length}
              </div>
              <div className="space-y-2">
                {students.map((student) => (
                  <div key={student.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>{getInitials(student.email)}</AvatarFallback>
                        <AvatarImage src={`https://www.gravatar.com/avatar/${student.id}?d=mp`} />
                      </Avatar>
                      <div>
                        <div className="font-medium">{student.email}</div>
                        <div className="text-xs text-muted-foreground">
                          Joined: {formatDate(student.joinedAt)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
