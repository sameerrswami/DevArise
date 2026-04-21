"use client";
import { Button } from "@/components/ui/button";
import { Lightbulb, WebcamIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import Webcam from "react-webcam";

function Interview({ params }) {
  const [interviewData, setInterviewData] = useState(null);
  const [webCamEnabled, setWebCamEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isNavigating, setIsNavigating] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const getInterviewDetails = async () => {
      try {
        console.log(
          "Interview page loaded, fetching details for:",
          params.interviewId,
        );
        const resp = await fetch(`/api/interview?mockId=${params.interviewId}`);
        const data = await resp.json();
        console.log("Interview response received:", data);
        if (data.success && data.result) {
          console.log("Interview data loaded successfully");
          console.log(
            "jsonMockResp preview:",
            data.result.jsonMockResp?.substring(0, 100),
          );
          setInterviewData(data.result);
        } else {
          console.error("Interview fetch failed:", data.error);
          setInterviewData(null);
        }
      } catch (error) {
        console.error("Error fetching interview details:", error);
        setInterviewData(null);
      } finally {
        setIsLoading(false);
      }
    };

    getInterviewDetails();
  }, [params.interviewId]);

  const handleStartInterview = () => {
    setIsNavigating(true);
    setTimeout(() => {
      router.push(`/dashboard/interview/${params.interviewId}/start`);
    }, 100);
  };

  const handleEnableCamera = () => {
    setWebCamEnabled(true);
  };

  const handleUserMedia = () => {
    setWebCamEnabled(true);
  };

  const handleUserMediaError = () => {
    setWebCamEnabled(false);
  };

  if (isLoading) {
    return (
      <div className="my-10 flex justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-pulse text-lg font-medium">
            Loading interview details...
          </div>
          <div className="text-xs text-muted-foreground">
            Please wait while we prepare your interview
          </div>
        </div>
      </div>
    );
  }

  if (!interviewData) {
    return (
      <div className="my-10 flex justify-center">
        <div className="text-red-500">Interview not found</div>
      </div>
    );
  }

  return (
    <>
      <div className="my-6 sm:my-10 max-w-6xl mx-auto px-3 sm:px-4">
        <h2 className="font-bold text-xl sm:text-2xl mb-6 sm:mb-8">
          Let&apos;s Get Started
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-10">
          <div className="flex flex-col my-3 sm:my-5 gap-4 sm:gap-5">
            <div className="flex flex-col p-4 sm:p-6 rounded-lg border border-gray-200 gap-3 sm:gap-4 bg-white shadow-sm">
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <h3 className="text-xs sm:text-sm font-medium text-gray-500 mb-1">
                    Job Position
                  </h3>
                  <p className="text-base sm:text-lg font-semibold text-gray-900">
                    {interviewData.jobPosition}
                  </p>
                </div>

                <div>
                  <h3 className="text-xs sm:text-sm font-medium text-gray-500 mb-1">
                    Job Description/Tech Stack
                  </h3>
                  <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                    {interviewData.jobDesc}
                  </p>
                </div>

                <div>
                  <h3 className="text-xs sm:text-sm font-medium text-gray-500 mb-1">
                    Years of Experience
                  </h3>
                  <p className="text-base sm:text-lg font-semibold text-gray-900">
                    {interviewData.jobExperience} years
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 sm:p-5 border rounded-lg border-yellow-200 bg-yellow-50">
              <h2 className="flex gap-2 items-center text-yellow-700 font-semibold mb-2 sm:mb-3 text-sm sm:text-base">
                <Lightbulb className="h-4 w-4 sm:h-5 sm:w-5" />
                Information
              </h2>
              <p className="text-yellow-700 text-xs sm:text-sm leading-relaxed">
                {process.env.NEXT_PUBLIC_INFORMATION}
              </p>
            </div>
          </div>

          <div className="flex flex-col justify-center">
            <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6 shadow-sm">
              {webCamEnabled ? (
                <div className="flex flex-col items-center">
                  <Webcam
                    onUserMedia={handleUserMedia}
                    onUserMediaError={handleUserMediaError}
                    mirrored={true}
                    className="rounded-lg border border-gray-300 w-full max-w-[400px]"
                    style={{
                      height: "auto",
                      aspectRatio: "4/3",
                      maxHeight: 300,
                    }}
                  />

                  <p className="text-xs sm:text-sm text-gray-600 mt-3">
                    Camera is active and ready
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center text-center">
                  <div className="bg-gray-50 rounded-lg p-6 sm:p-8 mb-4 w-full">
                    <WebcamIcon className="h-16 w-16 sm:h-20 sm:w-20 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">
                      Camera Setup Required
                    </h3>
                    <p className="text-sm sm:text-base text-gray-600 mb-4">
                      Please enable your camera and microphone to proceed with
                      the interview
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full font-medium"
                    onClick={handleEnableCamera}
                    disabled={isNavigating}
                  >
                    Enable Camera and Microphone
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-center sm:justify-end items-end mt-6 sm:mt-10">
          <Button
            className="px-6 sm:px-8 py-2 font-medium cursor-pointer w-full sm:w-auto"
            disabled={isNavigating}
            onClick={handleStartInterview}
          >
            Start Interview
          </Button>
        </div>
      </div>

      {isNavigating && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-lg p-6 sm:p-8 shadow-2xl border max-w-sm w-full mx-4">
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                <div className="w-12 h-12 border-4 border-gray-200 rounded-full animate-spin border-t-primary"></div>
              </div>

              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  Starting Interview...
                </h3>
                <p className="text-sm text-gray-500">
                  Please wait while we prepare everything
                </p>
              </div>

              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                <div
                  className="w-2 h-2 bg-primary rounded-full animate-bounce"
                  style={{ animationDelay: "0.1s" }}
                ></div>
                <div
                  className="w-2 h-2 bg-primary rounded-full animate-bounce"
                  style={{ animationDelay: "0.2s" }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Interview;
