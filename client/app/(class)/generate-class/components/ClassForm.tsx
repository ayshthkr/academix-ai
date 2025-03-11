"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Info, Sparkle } from "lucide-react";
import { exampleClasses } from "../sampleClasses";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";

// Schema validation for form
const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string(),
  objectives: z.string(),
  duration: z.string(),
  targetAudience: z.string(),
});

export type FormValues = z.infer<typeof formSchema>;

interface ClassFormProps {
  onSubmit: (values: FormValues) => Promise<void>;
  isGenerating: boolean;
  isSaving: boolean;
  error: string | null;
}

export default function ClassForm({ onSubmit, isGenerating, isSaving, error }: ClassFormProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      objectives: "",
      duration: "10",
      targetAudience: "",
    },
  });

  // Function to fill form with a random example
  const fillWithRandomExample = () => {
    const randomExample = exampleClasses[Math.floor(Math.random() * exampleClasses.length)];

    form.setValue("title", randomExample.title);
    form.setValue("description", randomExample.description);
    form.setValue("objectives", randomExample.objectives);
    form.setValue("duration", randomExample.duration);
    form.setValue("targetAudience", randomExample.targetAudience);

    toast("Example Applied", {
      description: `Form filled with example: ${randomExample.title}`,
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Class Details</CardTitle>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="size-8 p-0"
                  onClick={(e) => {
                    e.preventDefault();
                    fillWithRandomExample();
                  }}
                >
                  <span className="sr-only">Fill with example</span>
                  <Sparkle className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <div className="p-1">
                  <p className="font-bold mb-2">Click for examples</p>
                  <p className="text-xs">
                    Click to fill the form with random example class details
                  </p>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <CardDescription>
          Enter details about your class to generate a week-by-week plan
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-6"
          >
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Class Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Introduction to AI" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="A comprehensive introduction to artificial intelligence concepts..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="objectives"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Learning Objectives</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Students will understand fundamental AI concepts..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="duration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duration (weeks)</FormLabel>
                    <FormControl>
                      <Input type="number" min="1" max="52" {...field} />
                    </FormControl>
                    <FormDescription>
                      Number of weeks for the course
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="targetAudience"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Target Audience</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Undergraduate computer science students"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Button
              type="submit"
              disabled={isGenerating || isSaving}
              className="w-full"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Generating Plan...
                </>
              ) : isSaving ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Saving to Database...
                </>
              ) : (
                "Generate Week Plans"
              )}
            </Button>

            {error && (
              <div className="text-red-500 text-sm mt-2">{error}</div>
            )}
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
