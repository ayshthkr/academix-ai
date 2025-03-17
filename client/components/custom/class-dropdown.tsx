"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { ChevronsUpDown, Loader2, UserIcon, GraduationCapIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { SlashIcon } from "./icons";

interface Class {
  id: string;
  title: string;
  role: string; // Add role field to identify owner vs student
}

interface ClassDropdownProps {
  userId: string;
}

export function ClassDropdown({ userId }: ClassDropdownProps) {
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Extract class ID from pathname if we're on a class page
  const currentClassId = pathname?.startsWith("/class/")
    ? pathname.replace("/class/", "")
    : null;

  // Find the current class object based on ID
  const currentClass = classes.find((c) => c.id === currentClassId);

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        // Use the API endpoint to access server-only code instead of direct imports
        const response = await fetch("/api/user-classes");
        const data = await response.json();

        if (data.success) {
          setClasses(data.classes || []);
        }
      } catch (error) {
        console.error("Failed to fetch classes:", error);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchClasses();
    } else {
      setLoading(false);
    }
  }, [userId]);

  // Helper function to truncate text
  const truncateText = (text: string, maxLength: number = 25) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div className="flex flex-row items-center gap-2 cursor-pointer">
          <div className="text-zinc-500">
            <SlashIcon size={16} />
          </div>
          <div className="text-sm dark:text-zinc-300 flex items-center gap-1 max-w-[150px]">
            {/* Show truncated class name if on a class page, otherwise show "Class" */}
            <span className="truncate">
              {currentClass ? (
                truncateText(currentClass.title, 20)
              ) : (
                <span className="flex gap-1">
                  Select a Class <ChevronsUpDown size={14} />
                </span>
              )}
            </span>
            {loading && <Loader2 className="size-3 animate-spin shrink-0" />}
          </div>
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="max-w-[300px]">
        {classes.length > 0 ? (
          classes.map((cls) => (
            <DropdownMenuItem
              key={cls.id}
              onClick={() => router.push(`/class/${cls.id}`)}
              className={`cursor-pointer flex flex-row items-start justify-between ${
                cls.id === currentClassId ? "bg-secondary/50 font-medium" : ""
              }`}
            >
              {/* Format as truncated classname - classcode with proper wrapping */}
              <div className="w-full">
                <div className="truncate">{truncateText(cls.title, 30)}</div>
                <span className="text-xs text-muted-foreground font-mono truncate">
                  {cls.id}
                </span>
              </div>

              {/* Role indicator icon */}
              <div className="ml-2 text-muted-foreground pt-1">
                {cls.role === 'owner' ? (
                  <GraduationCapIcon size={14} className="text-primary" />
                ) : (
                  <UserIcon size={14} />
                )}
              </div>
            </DropdownMenuItem>
          ))
        ) : (
          <DropdownMenuItem disabled={loading}>
            {loading ? "Loading classes..." : "No classes found"}
          </DropdownMenuItem>
        )}
        <DropdownMenuItem
          onClick={() => router.push("/generate-class")}
          className="font-medium text-primary cursor-pointer border-t mt-1 pt-1"
        >
          Create New Class
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
