"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Edit, Plus, X, UploadCloud, Trash, Check, X as XIcon, Star, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { OwnerCalendar } from "@/components/owner-calendar";
import { authClient } from "@/lib/auth-client";

export default function FarmhouseDetailPage() {
  const { id } = useParams();
  const { data: session } = authClient.useSession();
  const isOwner = String((session?.user as any)?.role).toUpperCase() === "OWNER";

  const [farmhouse, setFarmhouse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isRestrictionModalOpen, setIsRestrictionModalOpen] = useState(false);
  
  // Tab State
  const [activeTab, setActiveTab] = useState<'details' | 'photos' | 'booking' | 'pricing' | 'reviews'>('details');

  // Reviews State
  const [reviews, setReviews] = useState<any[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [deletingReviewId, setDeletingReviewId] = useState<string | null>(null);

  // Photo Modal State
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Token Edit State
  const [isEditingToken, setIsEditingToken] = useState(false);
  const [newTokenAmount, setNewTokenAmount] = useState("");
  const [isSavingToken, setIsSavingToken] = useState(false);

  useEffect(() => {
    if (id) {
      api.get(`/farmhouses/${id}`)
        .then((res) => {
          setFarmhouse(res.data);
          setLoading(false);
        })
        .catch((err) => {
          setError(err.response?.data?.message || "Failed to load farmhouse");
          setLoading(false);
        });
    }
  }, [id]);

  useEffect(() => {
    if (id && activeTab === 'reviews') {
      setLoadingReviews(true);
      api.get(`/reviews/farmhouse/${id}`)
        .then((res) => setReviews(Array.isArray(res.data) ? res.data : []))
        .catch(console.error)
        .finally(() => setLoadingReviews(false));
    }
  }, [id, activeTab]);

  const handleDeleteReview = async (reviewId: string) => {
    setDeletingReviewId(reviewId);
    try {
      await api.delete(`/reviews/${reviewId}`);
      setReviews(reviews.filter(r => r.id !== reviewId));
    } catch {
      alert("Failed to delete review");
    } finally {
      setDeletingReviewId(null);
    }
  };

  const [photoToDelete, setPhotoToDelete] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setUploading(true);
    try {
      const formData = new FormData();
      Array.from(e.target.files).forEach(file => {
        formData.append("files", file);
      });
      const uploadRes = await api.post("/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      const newUrls = uploadRes.data.urls;
      const updatedPhotos = [...(farmhouse?.photos || []), ...newUrls];
      
      await api.patch(`/farmhouses/${id}`, { photos: updatedPhotos });
      setFarmhouse({ ...farmhouse, photos: updatedPhotos });
      setIsPhotoModalOpen(false);
    } catch (err: unknown) {
      alert((err as { response?: { data?: { message?: string } } }).response?.data?.message || "Failed to upload photos");
    } finally {
      setUploading(false);
    }
  };

  const confirmRemovePhoto = async () => {
    if (!photoToDelete || !farmhouse) return;
    try {
      const updatedPhotos = (farmhouse.photos || []).filter((p: string) => p !== photoToDelete);
      await api.patch(`/farmhouses/${id}`, { photos: updatedPhotos });
      setFarmhouse({ ...farmhouse, photos: updatedPhotos });
      setPhotoToDelete(null);
    } catch {
      alert("Failed to remove photo");
    }
  };

  const handleSetCoverPhoto = async (photoUrl: string) => {
    if (!photoUrl || !farmhouse || !id) return;
    try {
      const updatedPhotos = [photoUrl, ...(farmhouse.photos || []).filter((p: string) => p !== photoUrl)];
      await api.patch(`/farmhouses/${id}`, { photos: updatedPhotos });
      setFarmhouse({ ...farmhouse, photos: updatedPhotos });
    } catch {
      alert("Failed to update cover photo");
    }
  };

  const handleSaveToken = async () => {
    setIsSavingToken(true);
    try {
      await api.patch(`/farmhouses/${id}`, { tokenAmount: Number(newTokenAmount) });
      setFarmhouse({ ...farmhouse!, tokenAmount: Number(newTokenAmount) });
      setIsEditingToken(false);
    } catch {
      alert("Failed to update token amount");
    } finally {
      setIsSavingToken(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-muted">Loading farmhouse details...</div>;
  }

  if (error || !farmhouse) {
    return (
      <div className="space-y-4">
        <div className="bg-danger/10 text-danger p-4 rounded text-sm border border-danger/20">{error || "Farmhouse not found"}</div>
        <Link href="/farmhouses">
          <Button variant="outline">Back to Farmhouses</Button>
        </Link>
      </div>
    );
  }

  const BooleanCheck = ({ val, label }: { val: boolean; label: string }) => (
    <div className="flex items-center gap-2 py-1">
      {val ? <Check className="w-4 h-4 text-success" /> : <XIcon className="w-4 h-4 text-danger" />}
      <span className="text-sm text-primary">{label}</span>
    </div>
  );

  const StatBlock = ({ label, val }: { label: string; val: any }) => (
    <div className="bg-surface dark:bg-surface/50 p-3 rounded border border-border">
      <span className="block text-xs font-medium text-muted mb-1">{label}</span>
      <span className="font-semibold text-primary">{val || "0"}</span>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-4">
          <Link href="/farmhouses">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back
            </Button>
          </Link>
          <h2 className="text-2xl font-bold tracking-tight text-primary">
            {farmhouse.title}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          {isOwner ? (
            <Button size="sm" onClick={() => setIsRestrictionModalOpen(true)}>
              <Edit className="w-4 h-4 mr-2" /> Edit Farmhouse
            </Button>
          ) : (
            <Link href={`/farmhouses/${id}/edit`}>
              <Button size="sm">
                <Edit className="w-4 h-4 mr-2" /> Edit Farmhouse
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border overflow-x-auto">
        <button
          className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
            activeTab === 'details'
              ? 'border-accent-primary text-accent-primary dark:text-accent-primary'
              : 'border-transparent text-muted hover:text-primary dark:hover:text-muted'
          }`}
          onClick={() => setActiveTab('details')}
        >
          Comprehensive Details
        </button>
        <button
          className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
            activeTab === 'photos'
              ? 'border-accent-primary text-accent-primary dark:text-accent-primary'
              : 'border-transparent text-muted hover:text-primary dark:hover:text-muted'
          }`}
          onClick={() => setActiveTab('photos')}
        >
          Photos ({farmhouse?.photos?.length || 0})
        </button>
        <button
          className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
            activeTab === 'booking'
              ? 'border-accent-primary text-accent-primary dark:text-accent-primary'
              : 'border-transparent text-muted hover:text-primary dark:hover:text-muted'
          }`}
          onClick={() => setActiveTab('booking')}
        >
          Booking Calendar
        </button>
        <button
          className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
            activeTab === 'pricing'
              ? 'border-accent-primary text-accent-primary dark:text-accent-primary font-bold'
              : 'border-transparent text-muted hover:text-primary dark:hover:text-muted'
          }`}
          onClick={() => setActiveTab('pricing')}
        >
          💰 Weekend & Custom Pricing
        </button>
        <button
          className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
            activeTab === 'reviews'
              ? 'border-accent-primary text-accent-primary dark:text-accent-primary'
              : 'border-transparent text-muted hover:text-primary dark:hover:text-muted'
          }`}
          onClick={() => setActiveTab('reviews')}
        >
          Reviews & Ratings ({farmhouse.reviewCount || 0})
        </button>
      </div>

      <div className="bg-surface p-6 rounded-md shadow-sm border border-border min-h-[500px]">
        {activeTab === 'details' && (
          <div className="animate-in fade-in duration-300">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Left Column: Basic Info & Pricing */}
              <div className="space-y-8">
                <div>
                  <h3 className="text-lg font-bold text-primary mb-4 border-b border-border pb-2">Basic Info</h3>
                  {farmhouse.hostName && (
                    <p className="text-sm font-medium text-accent-primary mb-3">Host: {farmhouse.hostName}</p>
                  )}
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center bg-accent-primary/10 dark:bg-accent-primary/10 p-3 rounded">
                      <span className="text-sm font-medium text-primary dark:text-primary">Price/12Hr</span>
                      <span className="font-bold text-accent-primary dark:text-accent-primary">₹{farmhouse.price12Hours ? new Intl.NumberFormat('en-IN').format(farmhouse.price12Hours) : 'N/A'}</span>
                    </div>
                    <div className="flex justify-between items-center bg-accent-primary/10 dark:bg-accent-primary/10 p-3 rounded">
                      <span className="text-sm font-medium text-primary dark:text-primary">Price/24Hr</span>
                      <span className="font-bold text-accent-primary dark:text-accent-primary">₹{farmhouse.price24Hours ? new Intl.NumberFormat('en-IN').format(farmhouse.price24Hours) : 'N/A'}</span>
                    </div>
                    <div className="flex justify-between items-center bg-warning/10 dark:bg-warning/10 p-3 rounded">
                      <span className="text-sm font-medium text-warning dark:text-warning">Token Amount</span>
                      <span className="font-bold text-warning dark:text-warning">50% of Booking Total</span>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    <BooleanCheck val={farmhouse.isCoupleFriendly} label="Couple Friendly" />
                    <BooleanCheck val={farmhouse.isPetFriendly} label="Pet Friendly" />
                    <BooleanCheck val={farmhouse.isWheelchairAccessible} label="Wheelchair Accessible" />
                    
                    <div className="pt-2 flex items-center justify-between">
                      <span className="text-sm text-muted">Status</span>
                      <span className={`px-2 py-1 text-xs font-bold rounded ${farmhouse.isActive ? 'bg-success text-primary' : 'bg-danger text-primary'}`}>
                        {farmhouse.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-primary mb-4 border-b border-border pb-2">Location</h3>
                  <div className="text-sm text-primary space-y-2">
                    <p><strong className="text-primary">City:</strong> {farmhouse.city}</p>
                    <p><strong className="text-primary">Address:</strong> {farmhouse.streetAddress}</p>
                    <p className="text-xs text-muted mt-2 font-mono">Lat: {farmhouse.latitude}, Lng: {farmhouse.longitude}</p>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-bold text-primary mb-4 border-b border-border pb-2">Contacts</h3>
                  {farmhouse.contactNumbers && farmhouse.contactNumbers.length > 0 ? (
                    <div className="flex flex-col gap-2">
                      {farmhouse.contactNumbers.map((num: string, idx: number) => (
                        <div key={idx} className="bg-surface dark:bg-surface p-2 rounded text-sm font-medium font-mono">{num}</div>
                      ))}
                    </div>
                  ) : (
                    <span className="text-muted text-sm">No contact override provided.</span>
                  )}
                </div>
              </div>

              {/* Middle Column: Indoor Features */}
              <div className="space-y-8">
                <div>
                  <h3 className="text-lg font-bold text-primary mb-4 border-b border-border pb-2">Property (Indoor)</h3>
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <StatBlock label="Average Capacity" val={farmhouse.capacity ? `${farmhouse.capacity} Guests` : "N/A"} />
                    <StatBlock label="Extra Guest Fee" val={farmhouse.extraGuestFee ? `₹${farmhouse.extraGuestFee}/guest` : "None"} />
                    <StatBlock label="Total Bedrooms" val={farmhouse.roomCount} />
                    <StatBlock label="AC Rooms" val={farmhouse.acRoomCount} />
                    <StatBlock label="Total Halls" val={farmhouse.hallCount} />
                    <StatBlock label="Balconies" val={farmhouse.balconyCount} />
                    <StatBlock label="Terraces" val={farmhouse.terraceCount} />
                  </div>
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <StatBlock label="Single Beds" val={farmhouse.singleBedCount} />
                    <StatBlock label="Double Beds" val={farmhouse.doubleBedCount} />
                    <StatBlock label="Extra Mattresses" val={farmhouse.extraMattressCount} />
                    <StatBlock label="Sofas" val={farmhouse.sofaCount} />
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-primary mb-4 border-b border-border pb-2">Kitchen & Electronics</h3>
                  <div className="space-y-2 mb-4">
                    <BooleanCheck val={farmhouse.hasKitchen} label="Kitchen Available" />
                    <BooleanCheck val={farmhouse.hasFridge} label="Refrigerator" />
                    <BooleanCheck val={farmhouse.hasRoWater} label="RO Water Purifier" />
                    <BooleanCheck val={farmhouse.hasBbq} label="BBQ Setup" />
                    <BooleanCheck val={farmhouse.hasGas} label="Gas Stove" />
                  </div>
                  <div className="space-y-2">
                    <BooleanCheck val={farmhouse.hasTv} label="Television (TV)" />
                    <BooleanCheck val={farmhouse.hasSpeakers} label="Speakers / Music System" />
                    <BooleanCheck val={farmhouse.hasMicrophone} label="Microphone / Karaoke" />
                    <BooleanCheck val={farmhouse.hasWifi} label="WiFi Setup" />
                  </div>
                </div>
              </div>

              {/* Right Column: Outdoor & Custom Amenities */}
              <div className="space-y-8">
                <div>
                  <h3 className="text-lg font-bold text-primary mb-4 border-b border-border pb-2">Outdoor & Games</h3>
                  <div className="space-y-2 mb-4">
                    <BooleanCheck val={farmhouse.hasPool} label="Swimming Pool" />
                    <BooleanCheck val={farmhouse.hasTurf} label="Turf" />
                    <BooleanCheck val={farmhouse.hasRainDance} label="Rain Dance" />
                    <BooleanCheck val={farmhouse.hasPlayArea} label="Play Area" />
                    <BooleanCheck val={farmhouse.hasGardenArea} label="Garden Area" />
                    <BooleanCheck val={farmhouse.hasGazebo} label="Gazebo" />
                    <BooleanCheck val={farmhouse.hasCelebrationArea} label="Celebration Area" />
                  </div>
                  
                  <h4 className="font-semibold text-sm text-muted uppercase tracking-wider mb-2">Indoor Games</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <BooleanCheck val={farmhouse.hasCarom} label="Carom" />
                    <BooleanCheck val={farmhouse.hasChess} label="Chess" />
                    <BooleanCheck val={farmhouse.has8BallPool} label="8 Ball Pool" />
                    <BooleanCheck val={farmhouse.hasCricket} label="Cricket" />
                    <BooleanCheck val={farmhouse.hasBadminton} label="Badminton" />
                  </div>
                </div>

                {farmhouse.customAmenities && farmhouse.customAmenities.length > 0 && (
                  <div>
                    <h3 className="text-lg font-bold text-primary mb-4 border-b border-border pb-2">Additional Amenities</h3>
                    <div className="flex flex-wrap gap-2">
                      {farmhouse.customAmenities.map((amenity: string, idx: number) => (
                        <span key={idx} className="px-3 py-1 bg-surface border border-border rounded-full text-xs font-medium text-primary">
                          {amenity}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

        {activeTab === 'photos' && (
          <div className="animate-in fade-in duration-300">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-primary">Manage Photos</h3>
                <p className="text-xs text-muted font-medium mt-0.5">
                  The first photo with the gold ⭐ Cover badge will appear as the primary thumbnail on mobile app cards.
                </p>
              </div>
              <Button size="sm" variant="outline" onClick={() => setIsPhotoModalOpen(true)}>
                <Plus className="w-4 h-4 mr-2" /> Add Photo
              </Button>
            </div>
            {farmhouse.photos && farmhouse.photos.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {farmhouse.photos.map((photo: string, idx: number) => (
                  <div key={idx} className={`flex flex-col rounded-2xl overflow-hidden bg-surface border ${idx === 0 ? 'border-amber-500 ring-2 ring-amber-500/50 shadow-lg' : 'border-border shadow-sm'}`}>
                    <div className="relative aspect-video w-full bg-black/10">
                      <img src={photo} alt={`Farmhouse photo ${idx + 1}`} className="w-full h-full object-cover" />
                      {idx === 0 && (
                        <div className="absolute top-3 left-3 z-10 bg-amber-500 text-white text-xs font-extrabold px-3 py-1 rounded-full flex items-center gap-1 shadow-md">
                          <Star className="w-3.5 h-3.5 fill-white text-white" /> Cover Photo
                        </div>
                      )}
                    </div>
                    
                    {/* Control Footer Bar */}
                    <div className="p-3 bg-surface border-t border-border flex items-center justify-between gap-2">
                      {idx === 0 ? (
                        <span className="text-xs font-extrabold text-amber-500 flex items-center gap-1">
                          <Star className="w-4 h-4 fill-amber-500" /> Main App Thumbnail
                        </span>
                      ) : (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => handleSetCoverPhoto(photo)}
                          className="h-8 text-xs font-bold border-amber-500/40 text-amber-600 dark:text-amber-400 hover:bg-amber-500 hover:text-white transition-all flex items-center gap-1 shadow-xs"
                        >
                          <Star className="w-3.5 h-3.5 text-amber-500" /> Set as Cover
                        </Button>
                      )}

                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => setPhotoToDelete(photo)}
                        className="h-8 text-xs font-bold text-danger hover:bg-danger/10 hover:text-danger"
                        title="Delete photo"
                      >
                        <Trash className="w-3.5 h-3.5 mr-1" /> Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center border-2 border-dashed border-border rounded-md text-muted">
                No photos have been uploaded for this farmhouse yet.
              </div>
            )}
          </div>
        )}

        {activeTab === 'booking' && (
          <div className="animate-in fade-in duration-300">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-lg font-semibold text-primary mb-1">Availability & Custom Pricing</h3>
                <p className="text-muted text-sm">Manage weekend pricing, blackout dates, and track bookings.</p>
              </div>
              <Link href={`/farmhouses/${id}/pricing`}>
                <Button variant="outline" size="sm">
                  Set Custom / Weekend Prices
                </Button>
              </Link>
            </div>
            <OwnerCalendar farmhouseId={id as string} />
          </div>
        )}

        {activeTab === 'pricing' && (
          <div className="animate-in fade-in duration-300 space-y-6">
            <div className="flex justify-between items-center pb-4 border-b border-border">
              <div>
                <h3 className="text-lg font-extrabold text-primary flex items-center gap-2">
                  💰 Weekend & Custom Festival Pricing
                </h3>
                <p className="text-xs text-muted mt-1">Configure weekend surcharges, festival dates, and last-minute cancellation discounts for {farmhouse.title}.</p>
              </div>
              <Link href={`/farmhouses/${id}/pricing`}>
                <Button className="bg-accent-primary text-white font-bold" size="sm">
                  Open Dedicated Pricing Manager →
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-surface dark:bg-surface/50 p-4 rounded-xl border border-border space-y-2">
                <span className="text-xs font-bold text-muted uppercase">Base Weekday Rates</span>
                <div className="flex justify-between text-sm font-bold pt-1">
                  <span>12-Hour Price:</span>
                  <span className="text-accent-primary">₹{farmhouse.price12Hours?.toLocaleString('en-IN') || 'N/A'}</span>
                </div>
                <div className="flex justify-between text-sm font-bold">
                  <span>24-Hour Price:</span>
                  <span className="text-accent-primary">₹{farmhouse.price24Hours?.toLocaleString('en-IN') || 'N/A'}</span>
                </div>
              </div>

              <div className="bg-accent-primary/10 p-4 rounded-xl border border-accent-primary/20 space-y-2">
                <span className="text-xs font-bold text-accent-primary uppercase">Configured Weekend Rates (Sat/Sun)</span>
                <div className="flex justify-between text-sm font-bold pt-1">
                  <span>Weekend 12H Price:</span>
                  <span className="text-accent-primary">₹{(farmhouse.weekendPrice12Hours || farmhouse.price12Hours)?.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-sm font-bold">
                  <span>Weekend 24H Price:</span>
                  <span className="text-accent-primary">₹{(farmhouse.weekendPrice24Hours || farmhouse.price24Hours)?.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            <div className="p-6 bg-surface border border-border rounded-xl text-center space-y-3">
              <h4 className="font-bold text-primary">Need to add festival rates or discount cancelled dates?</h4>
              <p className="text-xs text-muted max-w-md mx-auto">Set custom dates like New Year, Independence Day, or Diwali with surge pricing or special strikethrough deals.</p>
              <Link href={`/farmhouses/${id}/pricing`}>
                <Button variant="outline" className="font-bold">
                  Manage Date-Specific Price Rules
                </Button>
              </Link>
            </div>
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="animate-in fade-in duration-300 space-y-4">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-border">
              <h3 className="text-lg font-semibold text-primary">User Reviews & Ratings</h3>
              <div className="flex items-center gap-2 bg-warning/10 px-3 py-1.5 rounded-full border border-warning/20">
                <Star className="w-4 h-4 text-warning fill-warning" />
                <span className="font-bold text-sm text-warning">{farmhouse.avgRating || 0} / 5</span>
                <span className="text-xs text-muted">({farmhouse.reviewCount || 0} reviews)</span>
              </div>
            </div>

            {loadingReviews ? (
              <div className="p-8 text-center text-muted">Loading reviews...</div>
            ) : reviews.length === 0 ? (
              <div className="p-12 text-center text-muted border-2 border-dashed border-border rounded-lg">
                No reviews submitted for this farmhouse yet.
              </div>
            ) : (
              <div className="space-y-4">
                {reviews.map((rev) => (
                  <div key={rev.id} className="p-4 border border-border rounded-lg bg-surface dark:bg-surface/50 flex justify-between items-start">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-primary text-sm">{rev.user?.name || "Guest User"}</span>
                        <div className="flex items-center text-warning">
                          {Array.from({ length: rev.rating }).map((_, i) => (
                            <Star key={i} className="w-3.5 h-3.5 fill-warning text-warning" />
                          ))}
                        </div>
                      </div>
                      <p className="text-sm text-primary whitespace-pre-wrap">{rev.comment}</p>
                      <span className="text-xs text-muted block">{new Date(rev.createdAt).toLocaleDateString()}</span>
                    </div>

                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-danger border-danger/30 hover:bg-danger/10" 
                      disabled={deletingReviewId === rev.id}
                      onClick={() => handleDeleteReview(rev.id)}
                    >
                      <Trash className="w-3.5 h-3.5 mr-1" />
                      {deletingReviewId === rev.id ? "Deleting..." : "Delete"}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Photo Upload Modal */}
      {isPhotoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-surface rounded-lg shadow-xl w-full max-w-md overflow-hidden border border-border">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="text-lg font-semibold text-primary">Upload Photos</h3>
              <button onClick={() => setIsPhotoModalOpen(false)} className="text-muted hover:text-primary dark:hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <div className="border-2 border-dashed border-border rounded-lg p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-surface dark:hover:bg-surface/50 transition-colors">
                <UploadCloud className="w-10 h-10 text-accent-primary mb-4" />
                <p className="text-sm font-medium text-primary mb-1">Click to upload or drag and drop</p>
                <p className="text-xs text-muted mb-4">SVG, PNG, JPG or GIF (max. 5MB)</p>
                <input type="file" multiple accept="image/*" className="hidden" id="photo-upload" onChange={handleFileUpload} />
                <Button size="sm" onClick={() => document.getElementById('photo-upload')?.click()} disabled={uploading}>
                  {uploading ? "Uploading..." : "Select Files"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Photo Delete Confirmation Modal */}
      {photoToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-surface rounded-lg p-6 max-w-sm w-full shadow-xl border border-border">
            <h3 className="text-lg font-bold text-primary mb-2">Delete Photo?</h3>
            <p className="text-sm text-muted mb-6">Are you sure you want to permanently remove this photo from the farmhouse?</p>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setPhotoToDelete(null)}>Cancel</Button>
              <Button className="bg-danger hover:bg-danger text-white" onClick={confirmRemovePhoto}>Delete</Button>
            </div>
          </div>
        </div>
      )}

      {/* Owner Edit Restriction Modal */}
      {isRestrictionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-surface border border-border rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-warning/20 text-warning flex items-center justify-center mx-auto">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-extrabold text-primary">Farmhouse Edit Restricted</h3>
            <p className="text-xs text-muted leading-relaxed">
              Please contact the System Admin to update details or photos for this farmhouse listing. Self-editing is disabled for owner accounts to maintain data integrity and optimize server performance.
            </p>
            <Button className="w-full bg-accent-primary text-white font-bold py-2.5" onClick={() => setIsRestrictionModalOpen(false)}>
              Got it, thanks
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
