/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, CheckCircle2, Trash, UploadCloud, ChevronRight, ChevronLeft, Plus, X, Star } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import dynamic from 'next/dynamic';
import { MobilePreview } from "@/components/MobilePreview";
import { validateFarmhousePrices } from "@/lib/price-validator";

const MapSelector = dynamic(() => import('@/components/map-selector'), { ssr: false, loading: () => <div className="h-64 w-full bg-surface flex items-center justify-center border border-border rounded-md">Loading Map...</div> });

type Owner = {
  id: string;
  name: string;
  email: string;
};

export default function EditFarmhousePage() {
  const router = useRouter();
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState(1);

  const { data: session } = authClient.useSession();
  const isSystemAdmin = String((session?.user as any)?.role).toUpperCase() !== "OWNER";

  const [owners, setOwners] = useState<Owner[]>([]);
  const [selectedOwnerId, setSelectedOwnerId] = useState("");
  const [customAmenityInput, setCustomAmenityInput] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    price12Hours: "",
    price24Hours: "",
    capacity: "",
    maxIncludedGuests: "",
    extraGuestFee: "",
    streetAddress: "",
    city: "",
    state: "Maharashtra",
    postalCode: "",
    latitude: 18.5204,
    longitude: 73.8567,

    hasPool: false,
    poolType: "SEPARATE",
    poolLength: "",
    poolWidth: "",
    babyPoolLength: "",
    babyPoolWidth: "",
    hasTurf: false,
    hasRainDance: false,
    hasPlayArea: false,
    hasGardenArea: false,
    hasGazebo: false,
    hasCelebrationArea: false,
    isCoupleFriendly: false,
    isPetFriendly: false,

    roomCount: "",
    acRoomCount: "",
    nonAcRoomCount: "",
    hallCount: "",
    
    singleBedCount: "",
    doubleBedCount: "",
    extraMattressCount: "",
    sofaCount: "",
    balconyCount: "",
    terraceCount: "",

    hasKitchen: false,
    hasFridge: false,
    hasRoWater: false,
    hasBbq: false,
    hasGas: false,
    gasCharge: "",

    hasCarom: false,
    hasChess: false,
    has8BallPool: false,
    hasCricket: false,
    hasBadminton: false,

    hasTv: false,
    hasSpeakers: false,
    hasMicrophone: false,
    hasWifi: false,

    customAmenities: [] as string[],
    hostName: "",

    photos: [] as string[],
    contactNumbers: [""] as string[],
    isWheelchairAccessible: false,
  });

  const [addressSuggestions, setAddressSuggestions] = useState<any[]>([]);
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const addressSearchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const addressSearchSequence = useRef(0);

  useEffect(() => {
    if (isSystemAdmin) {
      api.get("/users/owners").then((res: any) => setOwners(res.data)).catch(console.error);
    }
  }, [isSystemAdmin]);

  useEffect(() => {
    if (id) {
      api.get(`/farmhouses/${id}`)
        .then((res) => {
          const f = res.data;
          
          let poolLength = "", poolWidth = "", babyPoolLength = "", babyPoolWidth = "";
          if (f.poolSize) {
            const parts = f.poolSize.split("x");
            poolLength = parts[0] || "";
            poolWidth = parts[1] || "";
          }
          if (f.babyPoolSize) {
            const parts = f.babyPoolSize.split("x");
            babyPoolLength = parts[0] || "";
            babyPoolWidth = parts[1] || "";
          }

          setFormData({
            title: f.title || "",
            price12Hours: f.price12Hours ? new Intl.NumberFormat('en-IN').format(f.price12Hours) : "",
            price24Hours: f.price24Hours ? new Intl.NumberFormat('en-IN').format(f.price24Hours) : "",
            capacity: f.capacity?.toString() || "",
            maxIncludedGuests: f.maxIncludedGuests?.toString() || "",
            extraGuestFee: f.extraGuestFee ? new Intl.NumberFormat('en-IN').format(f.extraGuestFee) : "",
            streetAddress: f.streetAddress || "",
            city: f.city || "",
            state: f.state || "Maharashtra",
            postalCode: f.postalCode || "",
            latitude: f.latitude || 18.5204,
            longitude: f.longitude || 73.8567,

            hasPool: f.hasPool || false,
            poolType: f.poolType || "NONE",
            poolLength,
            poolWidth,
            babyPoolLength,
            babyPoolWidth,

            hasTurf: f.hasTurf || false,
            hasRainDance: f.hasRainDance || false,
            hasPlayArea: f.hasPlayArea || false,
            hasGardenArea: f.hasGardenArea || false,
            hasGazebo: f.hasGazebo || false,
            hasCelebrationArea: f.hasCelebrationArea || false,
            isCoupleFriendly: f.isCoupleFriendly || false,
            isPetFriendly: f.isPetFriendly || false,

            roomCount: f.roomCount?.toString() || "",
            acRoomCount: f.acRoomCount?.toString() || "",
            nonAcRoomCount: f.nonAcRoomCount?.toString() || "",
            hallCount: f.hallCount?.toString() || "",
            
            singleBedCount: f.singleBedCount?.toString() || "",
            doubleBedCount: f.doubleBedCount?.toString() || "",
            extraMattressCount: f.extraMattressCount?.toString() || "",
            sofaCount: f.sofaCount?.toString() || "",
            balconyCount: f.balconyCount?.toString() || "",
            terraceCount: f.terraceCount?.toString() || "",

            hasKitchen: f.hasKitchen || false,
            hasFridge: f.hasFridge || false,
            hasRoWater: f.hasRoWater || false,
            hasBbq: f.hasBbq || false,
            hasGas: f.hasGas || false,
            gasCharge: f.gasCharge?.toString() || "",

            hasCarom: f.hasCarom || false,
            hasChess: f.hasChess || false,
            has8BallPool: f.has8BallPool || false,
            hasCricket: f.hasCricket || false,
            hasBadminton: f.hasBadminton || false,

            hasTv: f.hasTv || false,
            hasSpeakers: f.hasSpeakers || false,
            hasMicrophone: f.hasMicrophone || false,
            hasWifi: f.hasWifi || false,

            customAmenities: Array.isArray(f.customAmenities) ? f.customAmenities : [],
            hostName: f.hostName || "",

            photos: f.photos || [],
            contactNumbers: f.contactNumbers && f.contactNumbers.length > 0 ? f.contactNumbers.map((c: string) => c.replace(/^\+91/, "")) : [""],
            isWheelchairAccessible: f.isWheelchairAccessible || false,
          });

          if (f.ownerId) {
            setSelectedOwnerId(f.ownerId);
          }
          setLoading(false);
        })
        .catch((err) => {
          console.error(err);
          const status = err.response?.status;
          if (status === 403 || status === 404) {
            setError("Please contact your System Administrator for editing access to this farmhouse.");
          } else {
            setError(err.response?.data?.message || "Failed to load farmhouse details");
          }
          setLoading(false);
        });
    }
  }, [id]);

  // Calculate non-AC rooms automatically
  useEffect(() => {
    if (formData.roomCount && formData.acRoomCount) {
      const total = parseInt(formData.roomCount) || 0;
      const ac = parseInt(formData.acRoomCount) || 0;
      const nonAc = Math.max(0, total - ac);
      if (parseInt(formData.nonAcRoomCount || "0") !== nonAc) {
        setFormData(prev => ({ ...prev, nonAcRoomCount: String(nonAc) }));
      }
    }
  }, [formData.roomCount, formData.acRoomCount]);

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, "");
    if (!rawValue) {
      setFormData({ ...formData, [e.target.name]: "" });
      return;
    }
    const formatted = new Intl.NumberFormat('en-IN').format(Number(rawValue));
    setFormData({ ...formData, [e.target.name]: formatted });
  };

  const handleAddressSearch = (query: string) => {
    setSearchQuery(query);
    const sequence = ++addressSearchSequence.current;
    if (addressSearchTimer.current) clearTimeout(addressSearchTimer.current);
    if (query.length < 3) {
      setAddressSuggestions([]);
      setIsSearchingAddress(false);
      return;
    }
    setIsSearchingAddress(true);
    addressSearchTimer.current = setTimeout(async () => {
      try {
        const scopedQuery = formData.city ? `${query}, ${formData.city}` : query;
        const res = await api.get(`/geo/autocomplete?q=${encodeURIComponent(scopedQuery)}`);
        if (sequence === addressSearchSequence.current) setAddressSuggestions(res.data?.features || []);
      } catch (err) {
        if (sequence === addressSearchSequence.current) console.error(err);
      } finally {
        if (sequence === addressSearchSequence.current) setIsSearchingAddress(false);
      }
    }, 300);
  };

  const handleSelectAddress = async (feature: any) => {
    try {
    const selected = feature.placeId
      ? (await api.get(`/geo/place/${encodeURIComponent(feature.placeId)}`)).data
      : feature;
    const { name, city, state, postcode, street } = selected.properties;
    const [lng, lat] = selected.geometry.coordinates;
    setFormData(prev => ({
      ...prev,
      city: city || prev.city || "",
      state: state || prev.state || "",
      postalCode: postcode || prev.postalCode || "",
      streetAddress: street || name || prev.streetAddress,
      latitude: lat,
      longitude: lng,
    }));
    setAddressSuggestions([]);
    } catch (error) {
      console.error('Failed to load selected Google Place', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleAddCustomAmenity = () => {
    if (!customAmenityInput.trim()) return;
    setFormData(prev => ({
      ...prev,
      customAmenities: [...prev.customAmenities, customAmenityInput.trim()]
    }));
    setCustomAmenityInput("");
  };

  const handleRemoveCustomAmenity = (index: number) => {
    setFormData(prev => ({
      ...prev,
      customAmenities: prev.customAmenities.filter((_, i) => i !== index)
    }));
  };

  const handleSetCoverPhoto = (photoUrl: string) => {
    setFormData(prev => ({
      ...prev,
      photos: [photoUrl, ...prev.photos.filter(p => p !== photoUrl)]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const priceCheck = validateFarmhousePrices(formData.price12Hours, formData.price24Hours);
    if (!priceCheck.isValid) {
      setError(priceCheck.error || "Invalid pricing details.");
      setLoading(false);
      return;
    }

    try {
      await api.patch(`/farmhouses/${id}`, {
        title: formData.title,
        price12Hours: priceCheck.price12Hours!,
        price24Hours: priceCheck.price24Hours!,
        capacity: Number(formData.capacity) || 1,
        maxIncludedGuests: formData.maxIncludedGuests ? Number(formData.maxIncludedGuests) : undefined,
        extraGuestFee: formData.extraGuestFee ? Number(formData.extraGuestFee.replace(/,/g, "")) : undefined,

        streetAddress: formData.streetAddress,
        city: formData.city,
        state: formData.state,
        country: "India",
        postalCode: formData.postalCode,
        latitude: formData.latitude,
        longitude: formData.longitude,
        
        hasPool: formData.hasPool,
        poolType: formData.hasPool ? formData.poolType : null,
        poolSize: formData.hasPool && formData.poolLength && formData.poolWidth ? `${formData.poolLength}x${formData.poolWidth}` : null,
        babyPoolSize: formData.hasPool && formData.poolType === "SEPARATE" && formData.babyPoolLength && formData.babyPoolWidth ? `${formData.babyPoolLength}x${formData.babyPoolWidth}` : null,
        hasTurf: formData.hasTurf,
        hasRainDance: formData.hasRainDance,
        hasPlayArea: formData.hasPlayArea,
        hasGardenArea: formData.hasGardenArea,
        hasGazebo: formData.hasGazebo,
        hasCelebrationArea: formData.hasCelebrationArea,
        isCoupleFriendly: formData.isCoupleFriendly,
        isPetFriendly: formData.isPetFriendly,
        
        roomCount: Number(formData.roomCount) || 1,
        acRoomCount: Number(formData.acRoomCount) || 0,
        nonAcRoomCount: Number(formData.nonAcRoomCount) || 0,
        hallCount: Number(formData.hallCount) || 0,
        
        singleBedCount: Number(formData.singleBedCount) || 0,
        doubleBedCount: Number(formData.doubleBedCount) || 0,
        extraMattressCount: Number(formData.extraMattressCount) || 0,
        sofaCount: Number(formData.sofaCount) || 0,
        balconyCount: Number(formData.balconyCount) || 0,
        terraceCount: Number(formData.terraceCount) || 0,
        
        hasKitchen: formData.hasKitchen,
        hasFridge: formData.hasKitchen ? formData.hasFridge : false,
        hasRoWater: formData.hasKitchen ? formData.hasRoWater : false,
        hasBbq: formData.hasKitchen ? formData.hasBbq : false,
        hasGas: formData.hasKitchen ? formData.hasGas : false,
        gasCharge: formData.hasKitchen && formData.hasGas && formData.gasCharge ? Number(formData.gasCharge) : null,
        
        hasCarom: formData.hasCarom,
        hasChess: formData.hasChess,
        has8BallPool: formData.has8BallPool,
        hasCricket: formData.hasCricket,
        hasBadminton: formData.hasBadminton,
        
        hasTv: formData.hasTv,
        hasSpeakers: formData.hasSpeakers,
        hasMicrophone: formData.hasMicrophone,
        hasWifi: formData.hasWifi,

        customAmenities: formData.customAmenities,
        hostName: formData.hostName,
        
        contactNumbers: isSystemAdmin ? formData.contactNumbers.filter(Boolean).map(n => `+91${n}`) : undefined,
        isWheelchairAccessible: formData.isWheelchairAccessible,
        
        ownerId: isSystemAdmin ? selectedOwnerId : undefined,
        photos: formData.photos,
      });

      queryClient.invalidateQueries({ queryKey: ["farmhouses"] });
      queryClient.invalidateQueries({ queryKey: ["farmhouse", id] });
      router.refresh();
      router.push(`/farmhouses/${id}`);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to update farmhouse");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setUploading(true);
    try {
      const uploadData = new FormData();
      Array.from(e.target.files).forEach(file => uploadData.append("files", file));
      const uploadRes = await api.post("/upload", uploadData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setFormData(prev => ({ ...prev, photos: [...prev.photos, ...uploadRes.data.urls] }));
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to upload photos");
    } finally {
      setUploading(false);
    }
  };

  const handleRemovePhoto = async (url: string) => {
    try { await api.delete("/upload", { data: { url } }); } catch (err) {}
    setFormData(prev => ({ ...prev, photos: prev.photos.filter(p => p !== url) }));
  };

  const baseSteps = ["Basic Info", "Outdoor", "Property Details", "Photos", "Preview"];
  const stepperItems = isSystemAdmin ? ["Assign Owner", ...baseSteps] : baseSteps;
  const totalSteps = stepperItems.length;

  const nextStep = () => {
    setError("");
    setStep(s => Math.min(totalSteps, s + 1));
  };
  const prevStep = () => setStep(s => Math.max(1, s - 1));
  
  const renderStep = isSystemAdmin ? step - 1 : step;

  const Checkbox = ({ name, label }: { name: string, label: string }) => (
    <label className="flex items-center gap-3 p-3 border border-border rounded-lg cursor-pointer hover:bg-surface dark:hover:bg-surface/50 transition-colors">
      <input type="checkbox" name={name} checked={(formData as any)[name]} onChange={handleChange} className="w-5 h-5 text-accent-primary rounded border-border" />
      <span className="font-medium text-primary dark:text-primary">{label}</span>
    </label>
  );

  if (loading) {
    return <div className="p-12 text-center text-muted">Loading farmhouse details...</div>;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      <div className="flex items-center gap-4 mb-2">
        <Link href={`/farmhouses/${id}`}>
          <Button variant="outline" size="sm"><ArrowLeft className="w-4 h-4 mr-2" /> Back</Button>
        </Link>
        <h2 className="text-2xl font-bold tracking-tight text-primary">Edit Farmhouse</h2>
      </div>

      <div className="relative flex items-center justify-between mb-12 mt-8 overflow-x-auto pb-2 z-0">
        <div className="absolute left-0 top-4 w-full h-[2px] bg-surface dark:bg-surface" />
        {stepperItems.map((item, index) => (
          <button 
            key={index} 
            onClick={() => setStep(index + 1)}
            className="flex flex-col items-center flex-1 min-w-[80px] group focus:outline-none relative z-10"
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${step === index + 1 ? 'bg-accent-primary text-white ring-4 ring-accent-primary/20' : step > index + 1 ? 'bg-success text-white' : 'bg-surface text-muted border-2 border-border'}`}>
              {step > index + 1 ? <CheckCircle2 className="w-5 h-5" /> : index + 1}
            </div>
            <span className={`text-xs mt-3 font-medium text-center transition-colors ${step >= index + 1 ? 'text-primary' : 'text-muted group-hover:text-primary'}`}>{item}</span>
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-danger/10 text-danger p-6 rounded-lg text-base font-semibold border border-danger/20 shadow-sm mb-6">
          {error}
        </div>
      )}

      <form onSubmit={(e) => { e.preventDefault(); if(step < totalSteps) nextStep(); else handleSubmit(e); }} className="bg-surface p-6 md:p-8 rounded-xl shadow-sm border border-border text-primary">
        
        {/* Step 0: Assign Owner (Admin Only) */}
        {renderStep === 0 && (
          <div className="space-y-6">
            <h3 className="text-xl font-bold border-b pb-2 mb-4">Assign Owner</h3>
            <div className="space-y-4">
              <label className="block text-sm font-medium mb-1">Select Owner</label>
              <select 
                className="w-full p-2 border border-border rounded-md bg-surface text-primary"
                value={selectedOwnerId}
                onChange={(e) => setSelectedOwnerId(e.target.value)}
              >
                <option value="" disabled>-- Choose an Owner --</option>
                {owners.map(o => <option key={o.id} value={o.id}>{o.name} ({o.email})</option>)}
              </select>
            </div>
          </div>
        )}

        {/* Step 1: Basic Info */}
        {renderStep === 1 && (
          <div className="space-y-6">
            <h3 className="text-xl font-bold border-b pb-2 mb-4">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Farmhouse Title</label>
                <Input name="title" required value={formData.title} onChange={handleChange} placeholder="e.g. Sunset Villa" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Host / Contact Person Name</label>
                <Input name="hostName" value={formData.hostName} onChange={handleChange} placeholder="e.g. Rajesh Patil" />
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">12-Hour Price (₹)</label>
                <Input name="price12Hours" required value={formData.price12Hours} onChange={handlePriceChange} placeholder="5,000" />
                <span className="text-[11px] text-muted block mt-0.5">Day/Night shift price</span>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">24-Hour Price (₹)</label>
                <Input name="price24Hours" required value={formData.price24Hours} onChange={handlePriceChange} placeholder="8,000" />
                <span className="text-[11px] text-muted block mt-0.5">Full day & night price</span>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Average Capacity</label>
                <Input name="capacity" type="number" required value={formData.capacity} onChange={handleChange} placeholder="15" />
                <span className="text-[11px] text-muted block mt-0.5">Base guests included</span>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Extra Guest Fee (₹/person)</label>
                <Input name="extraGuestFee" value={formData.extraGuestFee} onChange={handlePriceChange} placeholder="500" />
                <span className="text-[11px] text-muted block mt-0.5">Charged if guests exceed avg</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
              <Checkbox name="isCoupleFriendly" label="Couple Friendly" />
              <Checkbox name="isPetFriendly" label="Pet Friendly" />
            </div>
            
            <h4 className="font-semibold text-lg mt-8 mb-2">Location</h4>
            <div className="relative">
              <label className="block text-sm font-medium mb-1 text-accent-primary dark:text-accent-primary">Search Locality</label>
              <Input required={false} value={searchQuery} onChange={(e) => handleAddressSearch(e.target.value)} placeholder="e.g. Mahapoli, Bhiwandi..." className="border-accent-primary/20 focus-visible:ring-accent-primary" />
              {addressSuggestions.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-surface border border-border rounded-md shadow-lg max-h-60 overflow-y-auto">
                  {addressSuggestions.map((feature, idx) => (
                    <div 
                      key={idx} 
                      className="p-3 hover:bg-surface dark:hover:bg-surface cursor-pointer border-b border-border last:border-0"
                      onClick={() => handleSelectAddress(feature)}
                    >
                      <p className="font-medium text-sm">{feature.properties.name}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">City</label>
              <Input name="city" required value={formData.city} onChange={handleChange} placeholder="Bhiwandi, Pune, Lonavala..." />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Detailed Address & Landmarks</label>
              <textarea 
                name="streetAddress" 
                required 
                value={formData.streetAddress} 
                onChange={handleChange} 
                placeholder="e.g. Surme Farmhouse, Behind the old Banyan tree..." 
                className="w-full min-h-[80px] px-3 py-2 border rounded-md border-border bg-transparent text-sm shadow-sm"
              />
            </div>
            
            <div className="mt-4">
              <label className="block text-sm font-medium mb-1">Map Location</label>
              <MapSelector 
                latitude={formData.latitude} 
                longitude={formData.longitude} 
                onChange={(lat, lng) => setFormData(prev => ({ ...prev, latitude: lat, longitude: lng }))}
              />
            </div>
          </div>
        )}

        {/* Step 2: Outdoor */}
        {renderStep === 2 && (
          <div className="space-y-6">
            <h3 className="text-xl font-bold border-b pb-2 mb-4">Outdoor Amenities</h3>
            
            <div className="space-y-4">
              <Checkbox name="hasPool" label="Swimming Pool" />
              
              {formData.hasPool && (
                <div className="ml-8 p-4 bg-surface border border-border rounded-lg space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Baby Pool Setup</label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2"><input type="radio" name="poolType" value="ATTACHED" checked={formData.poolType === "ATTACHED"} onChange={handleChange} /> Attached</label>
                      <label className="flex items-center gap-2"><input type="radio" name="poolType" value="SEPARATE" checked={formData.poolType === "SEPARATE"} onChange={handleChange} /> Separate</label>
                      <label className="flex items-center gap-2"><input type="radio" name="poolType" value="NONE" checked={formData.poolType === "NONE"} onChange={handleChange} /> No Baby Pool</label>
                    </div>
                  </div>
                  
                  {formData.poolType === "SEPARATE" ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium mb-2 text-primary">Adult Pool (ft)</label>
                        <div className="flex items-center gap-2">
                          <Input name="poolLength" type="number" placeholder="Length" value={formData.poolLength} onChange={handleChange} />
                          <span className="text-muted">x</span>
                          <Input name="poolWidth" type="number" placeholder="Width" value={formData.poolWidth} onChange={handleChange} />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2 text-primary">Baby Pool (ft)</label>
                        <div className="flex items-center gap-2">
                          <Input name="babyPoolLength" type="number" placeholder="Length" value={formData.babyPoolLength} onChange={handleChange} />
                          <span className="text-muted">x</span>
                          <Input name="babyPoolWidth" type="number" placeholder="Width" value={formData.babyPoolWidth} onChange={handleChange} />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-sm font-medium mb-2 text-primary">Total Pool Size (ft)</label>
                      <div className="flex items-center gap-2 max-w-xs">
                        <Input name="poolLength" type="number" placeholder="Length" value={formData.poolLength} onChange={handleChange} />
                        <span className="text-muted">x</span>
                        <Input name="poolWidth" type="number" placeholder="Width" value={formData.poolWidth} onChange={handleChange} />
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <Checkbox name="hasTurf" label="Turf" />
                <Checkbox name="hasRainDance" label="Rain Dance" />
                <Checkbox name="hasPlayArea" label="Play Area" />
                <Checkbox name="hasGardenArea" label="Garden Area" />
                <Checkbox name="hasGazebo" label="Gazebo" />
                <Checkbox name="hasCelebrationArea" label="Celebration Area" />
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Property Details (Indoor) */}
        {renderStep === 3 && (
          <div className="space-y-6">
            <h3 className="text-xl font-bold border-b pb-2 mb-4">Property Details (Indoor)</h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div><label className="block text-sm font-medium mb-1">Total Bedrooms</label><Input type="number" name="roomCount" value={formData.roomCount} onChange={handleChange} /></div>
              <div><label className="block text-sm font-medium mb-1">AC Rooms</label><Input type="number" name="acRoomCount" value={formData.acRoomCount} onChange={handleChange} /></div>
              <div><label className="block text-sm font-medium mb-1 text-muted">Non-AC Rooms</label><Input type="number" value={formData.nonAcRoomCount} disabled className="bg-surface text-muted" /></div>
              <div><label className="block text-sm font-medium mb-1">Total Halls</label><Input type="number" name="hallCount" value={formData.hallCount} onChange={handleChange} /></div>
            </div>

            <h4 className="font-semibold text-lg mt-6 mb-2">Beds & Seating</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div><label className="block text-sm font-medium mb-1">Single Beds</label><Input type="number" name="singleBedCount" value={formData.singleBedCount} onChange={handleChange} /></div>
              <div><label className="block text-sm font-medium mb-1">Double Beds</label><Input type="number" name="doubleBedCount" value={formData.doubleBedCount} onChange={handleChange} /></div>
              <div><label className="block text-sm font-medium mb-1">Extra Mattresses</label><Input type="number" name="extraMattressCount" value={formData.extraMattressCount} onChange={handleChange} /></div>
              <div><label className="block text-sm font-medium mb-1">Sofas</label><Input type="number" name="sofaCount" value={formData.sofaCount} onChange={handleChange} placeholder="0" /></div>
              <div><label className="block text-sm font-medium mb-1">Balconies</label><Input type="number" name="balconyCount" value={formData.balconyCount} onChange={handleChange} /></div>
              <div><label className="block text-sm font-medium mb-1">Terraces</label><Input type="number" name="terraceCount" value={formData.terraceCount} onChange={handleChange} placeholder="0" /></div>
            </div>

            <h4 className="font-semibold text-lg mt-6 mb-2">Kitchen</h4>
            <div className="p-4 border border-border rounded-lg space-y-4">
              <Checkbox name="hasKitchen" label="Property has a Kitchen" />
              {formData.hasKitchen && (
                <div className="pl-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Checkbox name="hasFridge" label="Fridge Available" />
                  <Checkbox name="hasRoWater" label="RO Water Purifier" />
                  <Checkbox name="hasBbq" label="BBQ Setup" />
                  <div className="space-y-2">
                    <Checkbox name="hasGas" label="Gas Stove" />
                    {formData.hasGas && (
                      <div className="ml-8">
                        <label className="block text-sm font-medium mb-1 text-muted">Gas Charge (₹)</label>
                        <Input type="number" name="gasCharge" value={formData.gasCharge} onChange={handleChange} placeholder="Leave blank if free" />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">
              <div>
                <h4 className="font-semibold text-lg mb-2">Indoor Games</h4>
                <div className="space-y-3">
                  <Checkbox name="hasCarom" label="Carom" />
                  <Checkbox name="hasChess" label="Chess" />
                  <Checkbox name="has8BallPool" label="8 Ball Pool / Snooker" />
                  <Checkbox name="hasCricket" label="Cricket Bat & Ball" />
                  <Checkbox name="hasBadminton" label="Badminton Set" />
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-lg mb-2">Electronics</h4>
                <div className="space-y-3">
                  <Checkbox name="hasTv" label="Television (TV)" />
                  <Checkbox name="hasSpeakers" label="Speakers / Music System" />
                  <Checkbox name="hasMicrophone" label="Microphone / Karaoke" />
                  <Checkbox name="hasWifi" label="WiFi Setup" />
                </div>
              </div>
            </div>

            {/* Custom Amenities */}
            <div className="mt-8 pt-4 border-t border-border">
              <h4 className="font-semibold text-lg mb-2">Additional Custom Amenities</h4>
              <div className="flex gap-2 mb-3">
                <Input 
                  value={customAmenityInput} 
                  onChange={(e) => setCustomAmenityInput(e.target.value)} 
                  placeholder="e.g. Private Bonfire Pit" 
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddCustomAmenity(); } }}
                />
                <Button type="button" variant="outline" onClick={handleAddCustomAmenity}>
                  <Plus className="w-4 h-4 mr-1" /> Add
                </Button>
              </div>

              {formData.customAmenities.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.customAmenities.map((amenity, idx) => (
                    <span key={idx} className="inline-flex items-center gap-1.5 px-3 py-1 bg-surface border border-border rounded-full text-sm font-medium text-primary">
                      {amenity}
                      <button type="button" onClick={() => handleRemoveCustomAmenity(idx)} className="text-muted hover:text-danger">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 4: Photos & Final */}
        {renderStep === 4 && (
          <div className="space-y-6">
            <h3 className="text-xl font-bold border-b pb-2 mb-4">Photos & Final Settings</h3>
            
            {isSystemAdmin && (
              <div className="mb-6">
                <label className="block text-sm font-medium mb-1">Contact Numbers (Optional Admin Override)</label>
                {formData.contactNumbers.map((num, idx) => (
                  <div key={idx} className="flex mb-2">
                    <span className="inline-flex items-center px-3 rounded-l-md border bg-surface text-muted">+91</span>
                    <Input value={num} onChange={(e) => {
                      let val = e.target.value.replace(/\D/g, "");
                      const newArr = [...formData.contactNumbers];
                      newArr[idx] = val.slice(0, 10);
                      setFormData({ ...formData, contactNumbers: newArr });
                    }} className="rounded-l-none flex-1" minLength={10} maxLength={10} placeholder="10 digit number" />
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={() => setFormData({ ...formData, contactNumbers: [...formData.contactNumbers, ""] })}>+ Add Phone</Button>
              </div>
            )}

            <Checkbox name="isWheelchairAccessible" label="Wheelchair / Disability Accessible" />

            <div>
              <label className="block text-sm font-medium mb-2 mt-4 text-primary">Property Photos</label>
              {formData.photos.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  {formData.photos.map((photo, idx) => (
                    <div key={idx} className={`relative aspect-video rounded-xl overflow-hidden bg-surface group shadow-card-rest border ${idx === 0 ? 'border-amber-500 ring-2 ring-amber-500/50' : 'border-border'}`}>
                      <img src={photo} alt="" className="w-full h-full object-cover" />
                      
                      {/* Primary Cover Badge or Set as Cover Button */}
                      {idx === 0 ? (
                        <div className="absolute top-2 left-2 bg-amber-500 text-white text-[10px] font-extrabold px-2 py-1 rounded-full flex items-center gap-1 shadow-md">
                          <Star className="w-3 h-3 fill-white" /> Cover Photo
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleSetCoverPhoto(photo)}
                          className="absolute top-2 left-2 bg-black/70 hover:bg-amber-600 text-white text-[10px] font-bold px-2 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm shadow-md flex items-center gap-1"
                        >
                          <Star className="w-3 h-3" /> Set as Cover
                        </button>
                      )}

                      <button 
                        type="button" 
                        onClick={() => handleRemovePhoto(photo)} 
                        className="absolute top-2 right-2 bg-black/50 hover:bg-rose-600 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm shadow-modal"
                        title="Remove Photo"
                      >
                        <Trash className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="border border-dashed border-border rounded-lg p-8 flex flex-col items-center justify-center bg-accent-primary/5 hover:bg-accent-primary/10 transition-colors shadow-inner">
                <UploadCloud className="w-10 h-10 text-accent-primary mb-4" />
                <input type="file" multiple accept="image/*" className="hidden" id="photo-upload" onChange={handleFileUpload} />
                <Button type="button" variant="outline" size="sm" className="bg-surface shadow-card-rest hover:shadow-card-hover text-primary" onClick={() => document.getElementById('photo-upload')?.click()} disabled={uploading}>
                  {uploading ? "Uploading..." : "Upload Images"}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Preview */}
        {renderStep === 5 && (
          <div className="space-y-6">
            <h3 className="text-xl font-bold border-b pb-2 mb-4">Mobile App Preview</h3>
            <MobilePreview data={formData} />
          </div>
        )}

        <div className="flex justify-between items-center mt-8 pt-4 border-t border-border">
          <Button type="button" variant="outline" onClick={prevStep} disabled={step === 1}><ChevronLeft className="w-4 h-4 mr-2" /> Previous</Button>
          <div className="flex items-center gap-3">
            {step < totalSteps ? (
              <Button type="submit">Next <ChevronRight className="w-4 h-4 ml-2" /></Button>
            ) : (
              <Button type="submit" disabled={loading} className="bg-success hover:bg-success text-white">
                <CheckCircle2 className="w-4 h-4 mr-2" /> {loading ? "Updating..." : "Update Farmhouse"}
              </Button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
