"use client";

import React, { useEffect, useState, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Header from "@/components/header";
import { CheckCircle2, Loader2 } from "lucide-react";

const loadingSteps = [
  { id: 1, text: "Understanding your requirements", duration: 3000 },
  { id: 2, text: "Matching with 500+ AI tools", duration: 3000 },
  { id: 3, text: "Creating your workflow...", duration: 3000 },
];

const AiSearchPage = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get("search") || "";
  const displayQuery = (() => {
    try {
      return decodeURIComponent(query);
    } catch {
      return query;
    }
  })();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState([]);
  const [error, setError] = useState(null);
  const hasSearched = useRef(false);

  // Handle step progression
  useEffect(() => {
    const stepInterval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev < loadingSteps.length - 1) {
          setCompletedSteps((completed) => [...completed, prev]);
          return prev + 1;
        }
        return prev;
      });
    }, 3000);

    return () => clearInterval(stepInterval);
  }, []);

  // Handle AI search, save to DB, and redirect
  useEffect(() => {
    if (!query) {
      router.push("/");
      return;
    }

    // Prevent duplicate API calls
    if (hasSearched.current) return;
    hasSearched.current = true;

    const performSearch = async () => {
      try {
        // Call the API route to generate workflow and save to DB
        // Safely decode the query, handling malformed URI sequences (e.g., lone % symbols)
        let decodedQuery;
        try {
          decodedQuery = decodeURIComponent(query);
        } catch (e) {
          // If decoding fails, use the original query as-is
          decodedQuery = query;
        }
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);
        let response;
        try {
          const res = await fetch("/api/ai-search", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ decodedQuery }),
            signal: controller.signal,
          });

          if (!res.ok) {
            throw new Error("AI search request failed");
          }

          response = await res.json();
        } finally {
          clearTimeout(timeoutId);
        }
        
        if (response.error) {
          throw new Error(response.error);
        }
        
        if (!response.workflowId) {
          throw new Error("No workflow generated");
        }

        // Mark all steps complete before redirecting
        setCompletedSteps([0, 1, 2]);
        setCurrentStep(2);

        // Small delay to show completion, then redirect
        setTimeout(() => {
          router.push(`/workflow/${response.workflowId}`);
        }, 500);
        
      } catch (err) {
        setError("Something went wrong. Please try again.");
        hasSearched.current = false; // Allow retry on error
      }
    };

    performSearch();
  }, [query, router]);

  if (!query) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50/50 to-white">
      <Header />
      
      <main className="pt-20 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {error ? (
            <div className="flex flex-col items-center justify-center text-center py-20">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">
                Something went wrong
              </h1>
              <p className="text-gray-500 mb-6">{error}</p>
              <button
                onClick={() => router.push("/")}
                className="px-6 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center py-20">
              {/* Spinning Loader */}
              <div className="w-16 h-16 mb-8 rounded-full bg-blue-100 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
              </div>

              {/* Title */}
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                Analyzing your needs...
              </h1>
              
              {/* Subtitle */}
              <p className="text-lg text-gray-500 mb-10 max-w-xl">
                Our AI is finding the perfect tools and creating a custom workflow for you
              </p>

              {/* Loading Steps */}
              <div className="flex flex-col items-start gap-4">
                {loadingSteps.map((step, index) => {
                  const isCompleted = completedSteps.includes(index);
                  const isCurrent = currentStep === index && !isCompleted;
                  
                  return (
                    <div
                      key={step.id}
                      className="flex items-center gap-3"
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="w-5 h-5 text-blue-500" />
                      ) : isCurrent ? (
                        <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                      ) : (
                        <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                      )}
                      <span
                        className={`text-base ${
                          isCompleted
                            ? "text-gray-700"
                            : isCurrent
                            ? "text-gray-700"
                            : "text-gray-400"
                        }`}
                      >
                        {step.text}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Query Display */}
              <div className="mt-10 text-sm text-gray-400">
                Searching for: "{displayQuery}"
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AiSearchPage;
