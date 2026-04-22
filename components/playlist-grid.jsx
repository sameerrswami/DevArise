"use client";

import { useRouter } from "next/navigation";
import { VideoCard } from "./video-card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { BookOpen, Clock, Star } from "lucide-react";

export function PlaylistGrid({ playlist, onVideoPlay, onBookmarkPlaylist }) {
  // Handle case where playlist might be an object with videos array or the array itself
  const isObject = playlist && !Array.isArray(playlist);
  const videosArray = isObject ? (playlist.videos || []) : (playlist || []);
  const title = isObject ? playlist.title : "Search Results";
  const description = isObject ? playlist.description : "";
  const totalVideos = isObject ? (playlist.totalVideos || videosArray.length) : videosArray.length;
  const completedVideos = isObject ? (playlist.completedVideos || 0) : 0;

  const progressPercentage =
    totalVideos > 0
      ? (completedVideos / totalVideos) * 100
      : 0;

  const router = useRouter();
  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Playlist Header */}
      <div className="bg-card border rounded-lg p-4 sm:p-6 display-grid">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-4 gap-4">
          <div className="flex-1">
            <h1 className="text-xl sm:text-2xl font-bold mb-2">
              {title}
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground mb-4">
              {description}
            </p>

            <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-xs sm:text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                <span>{totalVideos} videos</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>~{Math.round(totalVideos * 15)} min total</span>
              </div>
            </div>
          </div>

          <div className="flex flex-row sm:flex-col gap-2 sm:gap-3">
            {onBookmarkPlaylist && (
              <Button
                variant="outline"
                onClick={onBookmarkPlaylist}
                className="flex-1 sm:flex-none text-xs sm:text-sm"
              >
                <Star className="h-4 w-4 mr-1 sm:mr-2" />
                <span className="hidden xs:inline">Bookmark</span>
              </Button>
            )}

            <Button
              variant="outline"
              onClick={() => router.push("/dashboard/AddInterview")}
              className="flex-1 sm:flex-none text-xs sm:text-sm"
            >
              Give Interview
            </Button>
          </div>
        </div>

        {/* Progress Bar */}
        {completedVideos > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>
                {completedVideos} of {totalVideos} completed
              </span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>
        )}
      </div>

      {/* Video Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
        {videosArray.map((video, index) => (
          <VideoCard
            key={video.id + index}
            video={{
              ...video,
              isCompleted: false, // This would come from user progress in real app
              isBookmarked: false, // This would come from user bookmarks
            }}
            onPlay={() => {
              if (typeof window !== 'undefined') {
                // Store playlist in localStorage and use parent handler
                const playlistToStore = isObject ? playlist : { title, videos: videosArray, totalVideos };
                localStorage.setItem("neuro_playlist", JSON.stringify(playlistToStore));
              }
              onVideoPlay(video.id);
            }}
            onBookmark={(videoId) => {
              // Handle bookmarking logic here
              console.log("Bookmark video:", videoId);
            }}
          />
        ))}
      </div>
    </div>
  );
}
