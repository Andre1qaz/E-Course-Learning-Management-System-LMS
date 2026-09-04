"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";

interface Activity {
  id: string;
  type: string;
  title: string;
  description: string | null;
  status: string;
  order: number;
  metadata: any;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface QuizFormProps {
  weekId: string;
  token: string;
  activity?: Activity;
  onSuccess: () => void;
  onCancel: () => void;
}

export function QuizForm({ weekId, token, activity, onSuccess, onCancel }: QuizFormProps) {
  const { data: session } = useSession();
  const currentToken = session?.accessToken || token;
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState("30");
  const [passingScore, setPassingScore] = useState("60");
  const [allowRetake, setAllowRetake] = useState(false);
  const [maxAttempts, setMaxAttempts] = useState("1");
  const [showResults, setShowResults] = useState(true);
  const [showExplanation, setShowExplanation] = useState(false);
  const [shuffleQuestions, setShuffleQuestions] = useState(false);
  const [shuffleOptions, setShuffleOptions] = useState(false);
  const [isPublished, setIsPublished] = useState(false);

  // Populate form with activity data if editing
  useEffect(() => {
    if (activity) {
      setTitle(activity.title);
      setDescription(activity.description || "");
      setDuration(String(activity.metadata?.duration || 30));
      setPassingScore(String(activity.metadata?.passingScore || 60));
      setAllowRetake(activity.metadata?.allowRetake || false);
      setMaxAttempts(String(activity.metadata?.maxAttempts || 1));
      setShowResults(activity.metadata?.showResults !== undefined ? activity.metadata.showResults : true);
      setShowExplanation(activity.metadata?.showExplanation || false);
      setShuffleQuestions(activity.metadata?.shuffleQuestions || false);
      setShuffleOptions(activity.metadata?.shuffleOptions || false);
      setIsPublished(activity.status === "PUBLISHED");
    }
  }, [activity]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const isEdit = !!activity;
      const url = isEdit
        ? `/weeks/${weekId}/activities/${activity.id}`
        : `/weeks/${weekId}/activities`;
      
      const method = isEdit ? "PUT" : "POST";

      const response = await apiFetch(url, {
        method,
        body: JSON.stringify({
          type: "QUIZ",
          title,
          description,
          status: isPublished ? "PUBLISHED" : "DRAFT",
          order: activity?.order || 0,
          metadata: {
            duration: parseInt(duration),
            passingScore: parseInt(passingScore),
            allowRetake,
            maxAttempts: parseInt(maxAttempts),
            showResults,
            showExplanation,
            shuffleQuestions,
            shuffleOptions,
          },
        }),
      }, currentToken);

      if (response.success) {
        // If creating a new activity, create the quiz record
        if (!isEdit && response.data) {
          const activityData = response.data as { id: string };
          const quizResponse = await apiFetch<{ id: string }>(`/quizzes/activity/${activityData.id}`, {
            method: "POST",
            body: JSON.stringify({
              title,
              description,
              duration: parseInt(duration),
              passingScore: parseInt(passingScore),
              allowRetake,
              maxAttempts: parseInt(maxAttempts),
              isPublished,
              showResults,
              showExplanation,
              shuffleQuestions,
              shuffleOptions,
            }),
          }, currentToken);
          
          if (quizResponse.success && quizResponse.data) {
            // Update activity metadata with quiz ID
            const activityOrder = (activity as Activity | undefined)?.order ?? 0;
            await apiFetch(`/weeks/${weekId}/activities/${activityData.id}`, {
              method: "PUT",
              body: JSON.stringify({
                type: "QUIZ",
                title,
                description,
                status: isPublished ? "PUBLISHED" : "DRAFT",
                order: activityOrder,
                metadata: {
                  quizId: quizResponse.data.id,
                  duration: parseInt(duration),
                  passingScore: parseInt(passingScore),
                  allowRetake,
                  maxAttempts: parseInt(maxAttempts),
                  showResults,
                  showExplanation,
                  shuffleQuestions,
                  shuffleOptions,
                },
              }),
            }, currentToken);
          }
        }

        toast.success(isEdit ? "Quiz updated successfully" : "Quiz created successfully");
        onSuccess();
      } else {
        toast.error(response.message || (isEdit ? "Failed to update quiz" : "Failed to create quiz"));
      }
    } catch (error) {
      console.error("Error saving quiz:", error);
      toast.error(error instanceof Error ? error.message : "Error saving quiz");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="duration">Duration (minutes)</Label>
        <Input
          id="duration"
          type="number"
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
          min="1"
          max="480"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="passingScore">Passing Score (%)</Label>
        <Input
          id="passingScore"
          type="number"
          value={passingScore}
          onChange={(e) => setPassingScore(e.target.value)}
          min="0"
          max="100"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="maxAttempts">Max Attempts</Label>
        <Input
          id="maxAttempts"
          type="number"
          value={maxAttempts}
          onChange={(e) => setMaxAttempts(e.target.value)}
          min="1"
          max="10"
        />
      </div>
      <div className="flex items-center space-x-2">
        <Switch
          id="allowRetake"
          checked={allowRetake}
          onCheckedChange={setAllowRetake}
        />
        <Label htmlFor="allowRetake">Allow Retake</Label>
      </div>
      <div className="flex items-center space-x-2">
        <Switch
          id="showResults"
          checked={showResults}
          onCheckedChange={setShowResults}
        />
        <Label htmlFor="showResults">Show Results to Students</Label>
      </div>
      <div className="flex items-center space-x-2">
        <Switch
          id="showExplanation"
          checked={showExplanation}
          onCheckedChange={setShowExplanation}
        />
        <Label htmlFor="showExplanation">Show Explanations</Label>
      </div>
      <div className="flex items-center space-x-2">
        <Switch
          id="shuffleQuestions"
          checked={shuffleQuestions}
          onCheckedChange={setShuffleQuestions}
        />
        <Label htmlFor="shuffleQuestions">Shuffle Questions</Label>
      </div>
      <div className="flex items-center space-x-2">
        <Switch
          id="shuffleOptions"
          checked={shuffleOptions}
          onCheckedChange={setShuffleOptions}
        />
        <Label htmlFor="shuffleOptions">Shuffle Options</Label>
      </div>
      <div className="flex items-center space-x-2">
        <Switch
          id="published"
          checked={isPublished}
          onCheckedChange={setIsPublished}
        />
        <Label htmlFor="published">Publish immediately</Label>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? (activity ? "Updating..." : "Creating...") : (activity ? "Update Quiz" : "Create Quiz")}
        </Button>
      </div>
    </form>
  );
}
