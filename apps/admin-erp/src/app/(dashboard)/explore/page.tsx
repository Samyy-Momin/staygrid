"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Sparkles, Plus, Trash2, RefreshCw, Film, Image as ImageIcon, ExternalLink, Upload, CheckCircle2, Home, Star } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminExplorePage() {
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [instagramToken, setInstagramToken] = useState("");
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  // Private Video Form State
  const [mediaType, setMediaType] = useState("REEL");
  const [mediaUrl, setMediaUrl] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [selectedFarmhouseId, setSelectedFarmhouseId] = useState("");
  const [isFeatured, setIsFeatured] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // 1. Fetch Explore Feed
  const { data: exploreMedia = [], isLoading } = useQuery({
    queryKey: ["admin-explore-media"],
    queryFn: async () => {
      const res = await api.get("/explore");
      return Array.isArray(res.data) ? res.data : [];
    },
  });

  // 2. Fetch Farmhouses for dropdown tagging
  const { data: farmhouses = [] } = useQuery({
    queryKey: ["admin-farmhouses-list"],
    queryFn: async () => {
      const res = await api.get("/farmhouses?limit=1000");
      return Array.isArray(res.data?.data) ? res.data.data : (Array.isArray(res.data) ? res.data : []);
    },
  });

  // Handle Video File Upload to Cloudinary
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("files", files[0]);
      const res = await api.post("/upload/video", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (res.data?.url) {
        setMediaUrl(res.data.url);
        setThumbnailUrl(res.data.thumbnailUrl || res.data.url);
      }
    } catch (err) {
      console.error("Upload error:", err);
      alert("Failed to upload video file. Please check file size.");
    } finally {
      setIsUploading(false);
    }
  };

  // Add Private Reel Mutation
  const addReelMutation = useMutation({
    mutationFn: async (payload: any) => {
      await api.post("/explore/admin", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-explore-media"] });
      setShowAddModal(false);
      resetForm();
    },
  });

  // Delete Reel Mutation
  const deleteReelMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/explore/admin/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-explore-media"] });
    },
  });

  // Sync Instagram Graph API Mutation
  const syncInstagramMutation = useMutation({
    mutationFn: async (token: string) => {
      const res = await api.post("/explore/sync-instagram", { accessToken: token });
      return res.data;
    },
    onSuccess: (data) => {
      if (data?.success) {
        setSyncStatus(`✅ Synced ${data.syncedCount} new Reels from Instagram!`);
        queryClient.invalidateQueries({ queryKey: ["admin-explore-media"] });
        setShowSyncModal(false);
      } else {
        setSyncStatus(`⚠️ Sync notice: ${data?.error || 'Check Instagram token'}`);
      }
    },
  });

  const resetForm = () => {
    setMediaType("REEL");
    setMediaUrl("");
    setThumbnailUrl("");
    setCaption("");
    setSelectedFarmhouseId("");
    setIsFeatured(false);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-2xl font-[Inter_800ExtraBold] text-primary flex items-center gap-2">
            🎬 Instagram & Private Reels Manager
          </h1>
          <p className="text-xs text-muted font-medium mt-1">
            Upload custom platform videos or sync Instagram Reels, tag StayGrid farmhouses for direct bookings, and mark paid host promotions!
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            onClick={() => setShowSyncModal(true)}
            variant="outline"
            className="bg-surface hover:bg-border/40 text-primary font-bold text-xs rounded-xl border-purple-500/40 text-purple-600 dark:text-purple-400"
          >
            <Sparkles className="w-4 h-4 mr-1.5 text-purple-600" /> Sync Instagram
          </Button>

          <Button
            onClick={() => {
              resetForm();
              setShowAddModal(true);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm"
          >
            <Plus className="w-4 h-4 mr-1.5" /> 🎥 Upload Private Video
          </Button>
        </div>
      </div>

      {syncStatus && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          {syncStatus}
        </div>
      )}

      {/* Media Grid */}
      {isLoading ? (
        <div className="p-16 text-center text-muted font-medium">Loading explore media...</div>
      ) : exploreMedia.length === 0 ? (
        <div className="p-16 text-center bg-surface border border-border rounded-3xl">
          <Film className="w-12 h-12 text-muted mx-auto mb-3" />
          <h3 className="text-sm font-bold text-primary mb-1">No Video Tours Added Yet</h3>
          <p className="text-xs text-muted max-w-sm mx-auto font-medium mb-4">
            Upload custom MP4 video files or sync Instagram Reels to feature stay video tours.
          </p>
          <Button onClick={() => setShowAddModal(true)} className="bg-blue-600 text-white text-xs font-bold rounded-xl">
            Upload First Video
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {exploreMedia.map((item: any) => (
            <div key={item.id} className="bg-surface border border-border rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between">
              <div className="relative aspect-[9/16] bg-black">
                <img
                  src={item.thumbnailUrl || item.mediaUrl}
                  alt={item.caption || "Reel"}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-bold text-white flex items-center gap-1">
                  {item.type === "REEL" ? <Film className="w-3 h-3" /> : <ImageIcon className="w-3 h-3" />}
                  {item.instagramPostUrl ? "Instagram Reel" : "Private Video"}
                </div>

                {item.isFeatured && (
                  <div className="absolute top-3 right-3 bg-amber-500 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold text-white shadow-sm flex items-center gap-1">
                    <Star className="w-3 h-3 fill-white" /> Featured
                  </div>
                )}
              </div>

              <div className="p-4 space-y-2">
                <p className="text-xs font-bold text-primary line-clamp-2">{item.caption || "StayGrid Video Tour"}</p>

                {item.farmhouse ? (
                  <div className="p-2 bg-blue-500/10 border border-blue-500/20 rounded-xl text-[11px] font-bold text-blue-600 flex items-center gap-1.5">
                    <Home className="w-3.5 h-3.5" /> {item.farmhouse.title}
                  </div>
                ) : (
                  <div className="p-2 bg-surface border border-border rounded-xl text-[11px] font-medium text-muted">
                    ⚠️ Not tagged to any farmhouse
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-border">
                  {item.instagramPostUrl ? (
                    <a href={item.instagramPostUrl} target="_blank" rel="noreferrer" className="text-[10px] font-bold text-blue-600 hover:underline flex items-center gap-1">
                      Instagram Post <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    <span className="text-[10px] font-bold text-emerald-600">Platform Video</span>
                  )}

                  <button
                    onClick={() => deleteReelMutation.mutate(item.id)}
                    className="p-1.5 text-rose-600 hover:bg-rose-500/10 rounded-lg transition"
                    title="Delete Reel"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL 1: UPLOAD PRIVATE VIDEO / REEL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
            <div className="flex justify-between items-center border-b border-border pb-3">
              <h3 className="text-lg font-[Inter_800ExtraBold] text-primary flex items-center gap-2">
                🎥 Upload Private Video / Reel
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-muted hover:text-primary p-1">✕</button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Media Type Selector */}
              <div>
                <label className="font-bold text-primary block mb-1">1. Media Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setMediaType("REEL")}
                    className={`py-2 px-3 rounded-xl border font-bold text-xs transition ${
                      mediaType === "REEL" ? "bg-blue-600 text-white border-blue-600" : "bg-surface border-border"
                    }`}
                  >
                    🎥 9:16 Video Reel
                  </button>
                  <button
                    type="button"
                    onClick={() => setMediaType("PHOTO")}
                    className={`py-2 px-3 rounded-xl border font-bold text-xs transition ${
                      mediaType === "PHOTO" ? "bg-blue-600 text-white border-blue-600" : "bg-surface border-border"
                    }`}
                  >
                    📸 Photo Card
                  </button>
                </div>
              </div>

              {/* Video File Upload or URL */}
              <div>
                <label className="font-bold text-primary block mb-1">2. Choose MP4 Video File or Video URL</label>
                <div className="flex items-center gap-2 mb-2">
                  <label className="flex-1 px-4 py-2.5 bg-blue-500/10 border border-blue-500/30 rounded-xl font-bold text-blue-600 text-xs flex items-center justify-center gap-2 cursor-pointer hover:bg-blue-500/20 transition">
                    <Upload className="w-4 h-4" />
                    {isUploading ? "Uploading Video..." : "Upload MP4 File from Computer"}
                    <input type="file" accept="video/mp4,video/*,image/*" onChange={handleFileUpload} className="hidden" />
                  </label>
                </div>
                <input
                  type="text"
                  placeholder="Or paste direct video MP4 URL (https://...)"
                  value={mediaUrl}
                  onChange={(e) => setMediaUrl(e.target.value)}
                  className="w-full p-2.5 bg-surface border border-border rounded-xl font-medium text-primary"
                />
              </div>

              {/* Tag StayGrid Farmhouse */}
              <div>
                <label className="font-bold text-primary block mb-1">3. Tag Farmhouse (Which farmhouse is in this video?)</label>
                <select
                  value={selectedFarmhouseId}
                  onChange={(e) => setSelectedFarmhouseId(e.target.value)}
                  className="w-full p-2.5 bg-surface border border-border rounded-xl font-bold text-primary"
                >
                  <option value="">-- Select Farmhouse (For Direct "Book Now" Button) --</option>
                  {farmhouses.map((fh: any) => (
                    <option key={fh.id} value={fh.id}>🏡 {fh.title} ({fh.city})</option>
                  ))}
                </select>
              </div>

              {/* Caption */}
              <div>
                <label className="font-bold text-primary block mb-1">4. Caption / Headline</label>
                <input
                  type="text"
                  placeholder="e.g. 🔥 Private Pool & Night Glow at Zain Villa! Tag your gang 🏊"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  className="w-full p-2.5 bg-surface border border-border rounded-xl font-medium text-primary"
                />
              </div>

              {/* Mark as Featured Priority */}
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isFeatured}
                    onChange={(e) => setIsFeatured(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-600"
                  />
                  <span className="font-bold text-amber-800 dark:text-amber-300">
                    🔥 Mark as Featured Reel (Shows at top of Home Carousel for Paid Promotions!)
                  </span>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2 border-t border-border">
              <Button variant="outline" onClick={() => setShowAddModal(false)} className="text-xs font-bold">
                Cancel
              </Button>
              <Button
                onClick={() => addReelMutation.mutate({
                  type: mediaType,
                  mediaUrl,
                  thumbnailUrl: mediaUrl,
                  caption,
                  isFeatured,
                  farmhouseId: selectedFarmhouseId || null,
                })}
                disabled={!mediaUrl.trim() || isUploading}
                className="bg-blue-600 text-white font-bold text-xs shadow-sm"
              >
                {addReelMutation.isPending ? "Saving..." : "Save & Publish Video"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: META INSTAGRAM GRAPH API AUTO-SYNC */}
      {showSyncModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-border pb-3">
              <h3 className="text-lg font-[Inter_800ExtraBold] text-purple-600 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-pink-600" /> Sync Instagram Reels
              </h3>
              <button onClick={() => setShowSyncModal(false)} className="text-muted hover:text-primary p-1">✕</button>
            </div>

            <p className="text-xs text-muted font-medium">
              Paste your Meta Graph API Long-Lived Access Token to auto-fetch all published Reels & Photos directly from @staygridmumbai into your app!
            </p>

            <div>
              <label className="font-bold text-primary block mb-1 text-xs">Meta Access Token</label>
              <input
                type="password"
                placeholder="Paste token string (EAAG...)"
                value={instagramToken}
                onChange={(e) => setInstagramToken(e.target.value)}
                className="w-full p-3 bg-surface border border-border rounded-xl text-xs font-mono text-primary"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2 border-t border-border">
              <Button variant="outline" onClick={() => setShowSyncModal(false)} className="text-xs font-bold">
                Cancel
              </Button>
              <Button
                onClick={() => syncInstagramMutation.mutate(instagramToken)}
                disabled={syncInstagramMutation.isPending || !instagramToken.trim()}
                className="bg-purple-600 text-white font-bold text-xs"
              >
                {syncInstagramMutation.isPending ? "Syncing..." : "Sync Reels Now"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
