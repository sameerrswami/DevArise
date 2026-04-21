"use client";

export default function PlaylistError() {
  return (
    <div className="container mx-auto px-4 py-16 text-center">
      <h1 className="text-2xl font-bold mb-4">Playlist Not Found</h1>
      <p className="text-muted-foreground mb-8">
        The playlist you&apos;re looking for doesn&apos;t exist or you don&apos;t have
        permission to view it.
      </p>
    </div>
  );
}
