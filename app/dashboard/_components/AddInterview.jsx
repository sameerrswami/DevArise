"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { generateInterviewQuestions } from "@/utils/GeminiAIModal.js";
import { LoaderCircle, Plus } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function AddInterview({ onSuccess, variant = "button" }) {
  const [openDialog, setOpenDialog] = useState(false);
  const [jobPosition, setJobPosition] = useState("");
  const [jobDesc, setJobDesc] = useState("");
  const [jobExperience, setJobExperience] = useState("");
  const [loading, setLoading] = useState(false);
  const [jsonResponse, setJsonResponse] = useState("");

  const router = useRouter();

  const onSubmit = async (e) => {
    setLoading(true);
    e.preventDefault();
    try {
      console.log("Starting interview creation with:", {
        jobPosition,
        jobDesc,
        jobExperience,
      });

      const questionCount =
        process.env.NEXT_PUBLIC_INTERVIEW_QUESTION_COUNT || "10";
      let questions;
      let lastError;
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          console.log(
            `Attempt ${attempt + 1} to generate interview questions...`,
          );
          questions = await generateInterviewQuestions({
            jobPosition,
            jobDesc,
            jobExperience,
            questionCount,
          });
          console.log("Interview questions generated successfully");
          break;
        } catch (error) {
          lastError = error;
          console.error(`Attempt ${attempt + 1} failed:`, error);
          if (error.message?.includes("503") && attempt < 2) {
            const waitTime = 2000 * (attempt + 1);
            console.log(`Waiting ${waitTime}ms before retry...`);
            await new Promise((resolve) => setTimeout(resolve, waitTime));
            continue;
          } else if (attempt < 2) {
            // Retry on other errors too
            const waitTime = 1000 * (attempt + 1);
            console.log(`Retrying in ${waitTime}ms...`);
            await new Promise((resolve) => setTimeout(resolve, waitTime));
            continue;
          } else {
            throw error;
          }
        }
      }

      if (!questions) {
        throw new Error(
          `Failed to generate interview questions after 3 attempts: ${lastError?.message}`,
        );
      }

      const MockJsonResp = JSON.stringify(questions);
      setJsonResponse(MockJsonResp);

      if (MockJsonResp) {
        try {
          const mockId = uuidv4();
          console.log("Sending interview data to API:", {
            mockId,
            questionCount: MockJsonResp.split('"question"').length,
          });
          const resp = await fetch("/api/interview", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              mockId: mockId,
              jsonMockResp: MockJsonResp,
              jobPosition: jobPosition,
              jobDesc: jobDesc,
              jobExperience: jobExperience,
            }),
          });
          const data = await resp.json();
          console.log("API Response:", data);
          if (data.success && data.data) {
            console.log("Interview created successfully:", data.data);
            toast.success("Interview created! Starting interview...");
            setOpenDialog(false);
            setJobPosition("");
            setJobDesc("");
            setJobExperience("");
            setJsonResponse("");
            if (onSuccess) onSuccess();
            
            setTimeout(() => {
              try {
                router.push(`/dashboard/interview/${mockId}`);
              } catch (pushError) {
                console.error("Router push failed:", pushError);
              }
            }, 1000);
          } else {
            // Throw custom error object to catch block
            throw { message: data.error || "Failed to create interview", isLimitError: data.isLimitError };
          }
        } catch (err) {
          console.error("Error creating interview:", err);
          
          if (err.isLimitError) {
             toast.error(err.message, {
                action: {
                  label: 'Upgrade Plan',
                  onClick: () => router.push('/pricing')
                },
                duration: 5000,
             });
             setOpenDialog(false);
          } else {
             toast.error(err.message || "Failed to create interview. Please try again.");
          }
        }
      } else {
        const errorMsg =
          "Failed to generate interview questions. Please try again.";
        console.error(errorMsg);
        toast.error(errorMsg);
      }
    } catch (error) {
      const errorMsg =
        error instanceof Error
          ? error.message
          : "An unexpected error occurred. Please try again.";
      console.error("Unexpected error in onSubmit:", error);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  if (variant === "card") {
    return (
      <>
        <div
          className="p-6 sm:p-10 border rounded-lg bg-secondary hover:scale-105 hover:shadow-md cursor-pointer transition-all border-dashed"
          onClick={() => setOpenDialog(true)}
        >
          <h2 className="text-base sm:text-lg text-center">
            + Add New Interview
          </h2>
        </div>

        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
          <DialogContent className="max-w-[95vw] sm:max-w-2xl mx-2 sm:mx-auto">
            <DialogHeader>
              <DialogTitle className="text-xl sm:text-2xl">
                Tell us more about your job interview
              </DialogTitle>
              <DialogDescription className="text-sm sm:text-base">
                Add details about your job position/role, job description, and
                years of experience.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={onSubmit}>
              <div>
                <h2 className="text-sm sm:text-base">
                  Add Details about your job position/role, Job description and
                  years of experience
                </h2>

                <div className="mt-5 sm:mt-7 my-3">
                  <label className="text-sm sm:text-base">
                    Job Role/Job Position
                  </label>
                  <Input
                    placeholder="Ex. Full Stack Developer"
                    required
                    value={jobPosition}
                    onChange={(event) => setJobPosition(event.target.value)}
                  />
                </div>
                <div className="my-3">
                  <label className="text-sm sm:text-base">
                    Job Description/ Tech Stack (In Short)
                  </label>
                  <Textarea
                    placeholder="Ex. React, Angular, NodeJs, MySql etc"
                    required
                    className="text-sm sm:text-base"
                    value={jobDesc}
                    onChange={(event) => setJobDesc(event.target.value)}
                  />
                </div>
                <div className="my-3">
                  <label className="text-sm sm:text-base">
                    Years of experience
                  </label>
                  <Input
                    placeholder="Ex.5"
                    type="number"
                    max="100"
                    required
                    value={jobExperience}
                    onChange={(event) => setJobExperience(event.target.value)}
                  />
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-5 justify-end mt-4">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setOpenDialog(false)}
                  className="w-full sm:w-auto"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full sm:w-auto"
                >
                  {loading ? (
                    <>
                      <LoaderCircle className="animate-spin mr-2" /> Generating
                      interview
                    </>
                  ) : (
                    "Start Interview"
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // Button variant
  return (
    <>
      <Button onClick={() => setOpenDialog(true)} className="gap-2">
        <Plus className="h-4 w-4" />
        New Interview
      </Button>

      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl mx-2 sm:mx-auto">
          <DialogHeader>
            <DialogTitle className="text-xl sm:text-2xl">
              Tell us more about your job interview
            </DialogTitle>
            <DialogDescription className="text-sm sm:text-base">
              Add details about your job position/role, job description, and
              years of experience.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={onSubmit}>
            <div>
              <h2 className="text-sm sm:text-base">
                Add Details about your job position/role, Job description and
                years of experience
              </h2>

              <div className="mt-5 sm:mt-7 my-3">
                <label className="text-sm sm:text-base">
                  Job Role/Job Position
                </label>
                <Input
                  placeholder="Ex. Full Stack Developer"
                  required
                  value={jobPosition}
                  onChange={(event) => setJobPosition(event.target.value)}
                />
              </div>
              <div className="my-3">
                <label className="text-sm sm:text-base">
                  Job Description/ Tech Stack (In Short)
                </label>
                <Textarea
                  placeholder="Ex. React, Angular, NodeJs, MySql etc"
                  required
                  className="text-sm sm:text-base"
                  value={jobDesc}
                  onChange={(event) => setJobDesc(event.target.value)}
                />
              </div>
              <div className="my-3">
                <label className="text-sm sm:text-base">
                  Years of experience
                </label>
                <Input
                  placeholder="Ex.5"
                  type="number"
                  max="100"
                  required
                  value={jobExperience}
                  onChange={(event) => setJobExperience(event.target.value)}
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-5 justify-end mt-4">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setOpenDialog(false)}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto"
              >
                {loading ? (
                  <>
                    <LoaderCircle className="animate-spin mr-2" /> Generating
                      interview
                  </>
                ) : (
                  "Start Interview"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
