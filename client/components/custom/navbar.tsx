"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

import { handleSignOut } from "@/app/actions"; // Import the server action
import { History } from "./history";
import { SlashIcon } from "./icons";
import { ThemeToggle } from "./theme-toggle";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { ClassDropdown } from "./class-dropdown";

// Change this to be a client component that fetches the session
export const Navbar = () => {
  interface User {
    id: string;
    email: string;
  }

  interface Session {
    user: User;
  }

  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    // Fetch the session on the client side
    const getSession = async () => {
      try {
        const response = await fetch("/api/auth/session");
        const data = await response.json();
        setSession(data);
      } catch (error) {
        console.error("Failed to get session:", error);
      }
    };

    getSession();
  }, []);

  return (
    <>
      <div className="bg-background absolute top-0 left-0 w-full py-2 px-3 justify-between flex flex-row items-center z-30">
        <div className="flex flex-row gap-3 items-center">
          <History user={session?.user} />
          <div className="flex flex-row gap-2 items-center">
            <div className="text-zinc-500">
              <SlashIcon size={16} />
            </div>
            <div className="text-sm dark:text-zinc-300 truncate w-28 md:w-fit">
              Academix
            </div>

            {/* Add the class dropdown only for logged in users */}
            {session?.user?.id && (
              <ClassDropdown userId={session.user.id} />
            )}
          </div>
        </div>

        {session ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                className="py-1.5 px-2 h-fit font-normal"
                variant="secondary"
              >
                {session.user?.email}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <ThemeToggle />
              </DropdownMenuItem>
              <DropdownMenuItem className="p-1 z-50">
                <form
                  className="w-full"
                  action={handleSignOut} // Use the imported server action
                >
                  <button
                    type="submit"
                    className="w-full text-left px-1 py-0.5 text-red-500"
                  >
                    Sign out
                  </button>
                </form>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button className="py-1.5 px-2 h-fit font-normal text-white" asChild>
            <Link href="/login">Login</Link>
          </Button>
        )}
      </div>
    </>
  );
};
