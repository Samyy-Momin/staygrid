import React from'react';
import { MapPin, Users, Info, Wifi, Tv, Coffee, Droplets, Heart, Star } from'lucide-react';

interface MobilePreviewProps {
 data: any;
}

export function MobilePreview({ data }: MobilePreviewProps) {
 const photoUrl = data.photos?.[0] ||'https://placehold.co/600x400?text=No+Photo';

 const formatPrice = (price: string | number) => {
 if (!price) return'0';
 return price.toString();
 };

 return (
 <div className="flex flex-col xl:flex-row items-center justify-center gap-12 w-full mt-6 bg-surface bg-surface/50 p-8 rounded-xl border border-border dark:border-border">
 
 {/* PHONE 1: CARD VIEW */}
 <div className="relative mx-auto border-border dark:border-border bg-surface border-[8px] rounded-[2.5rem] h-[600px] w-[300px] shadow-xl overflow-hidden flex flex-col shrink-0">
 {/* Notch */}
 <div className="absolute top-0 inset-x-0 h-6 bg-border rounded-b-3xl w-40 mx-auto z-20"></div>
 
 {/* Screen Content */}
 <div className="bg-surface flex-1 overflow-y-auto pb-4 custom-scrollbar">
 {/* Header */}
 <div className="pt-12 px-4 pb-4 bg-surface bg-surface shadow-sm mb-6 flex justify-between items-center">
 <h2 className="text-xl font-bold text-primary">Trending Now</h2>
 <span className="text-primary font-semibold text-sm">See All</span>
 </div>

 {/* Card */}
 <div className="mx-4 bg-surface dark:bg-surface rounded-3xl overflow-hidden shadow-sm border border-border">
 <div className="relative w-full h-56 bg-surface border-b border-border">
 <img src={photoUrl} alt="Cover" className="w-full h-full object-cover" />
 <div className="absolute top-4 right-4 w-10 h-10 bg-surface/30 dark:bg-black/30 backdrop-blur-md rounded-full flex items-center justify-center">
 <Heart size={20} color="#ffffff" />
 </div>
 <div className="absolute bottom-4 left-4 bg-surface/90 dark:bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-1">
 <Star size={14} color="#f59e0b" fill="#f59e0b" />
 <span className="text-primary font-bold text-xs">4.8</span>
 </div>
 </div>
 
 <div className="p-4">
 <div className="flex justify-between items-start">
 <div className="flex-1 pr-4">
 <h3 className="text-lg font-bold text-primary mb-1 truncate">{data.title ||'Untitled Farmhouse'}</h3>
 <p className="text-sm text-muted dark:text-muted flex items-center gap-1 truncate">
 <MapPin className="w-3 h-3" /> {data.city ||'City'}{data.streetAddress ?`, ${data.streetAddress}` :''}
 </p>
 </div>
 <div className="items-end text-right shrink-0">
 <p className="text-lg font-bold text-primary">₹{formatPrice(data.price12Hours)}</p>
 <p className="text-xs text-muted dark:text-muted">from</p>
 </div>
 </div>
 <button className="w-full bg-primary text-surface font-semibold text-base py-3 rounded-xl mt-4">
 Book Now
 </button>
 </div>
 </div>
 </div>
 </div>

 {/* PHONE 2: DETAIL VIEW */}
 <div className="relative mx-auto border-border dark:border-border bg-surface border-[8px] rounded-[2.5rem] h-[600px] w-[300px] shadow-xl overflow-hidden flex flex-col shrink-0">
 {/* Notch */}
 <div className="absolute top-0 inset-x-0 h-6 bg-border rounded-b-3xl w-40 mx-auto z-20"></div>
 
 {/* Screen Content */}
 <div className="bg-surface flex-1 overflow-y-auto pb-20 custom-scrollbar relative">
 
 <div className="h-56 w-full bg-surface border-b border-border relative">
 <img src={photoUrl} alt="Cover" className="w-full h-full object-cover" />
 <div className="absolute top-10 left-4 w-8 h-8 bg-black/40 rounded-full flex items-center justify-center text-white">
 <ChevronLeft className="w-5 h-5" />
 </div>
 </div>

 <div className="p-4">
 {/* Header + Location */}
 <h1 className="text-xl font-bold text-primary leading-tight mb-1">{data.title ||'Untitled Farmhouse'}</h1>
 <p className="text-xs text-muted flex items-center gap-1 mb-4">
 <MapPin className="w-3.5 h-3.5" /> {data.streetAddress ||'Address'}, {data.city ||'City'}
 </p>

 {/* Quick Stats */}
 <div className="flex flex-wrap gap-2 mb-6">
 <span className="px-2.5 py-1 bg-surface bg-surface rounded-md text-[10px] font-semibold text-primary">
 {data.capacity || 0} Guests
 </span>
 <span className="px-2.5 py-1 bg-surface bg-surface rounded-md text-[10px] font-semibold text-primary">
 {data.roomCount || 0} Bedrooms
 </span>
 {data.hasPool && (
 <span className="px-2.5 py-1 bg-accent-primary/10 dark:bg-accent-primary/10 rounded-md text-[10px] font-semibold text-accent-primary dark:text-accent-primary">
 Swimming Pool
 </span>
 )}
 </div>

 {/* Pricing Details */}
 <div className="mb-6 space-y-2 border-b border-border dark:border-border pb-4">
 <h3 className="text-sm font-bold text-primary mb-2">Pricing & Capacity</h3>
 <div className="flex justify-between text-sm">
 <span className="text-muted">12-Hour Price</span>
 <span className="font-semibold text-primary">₹{formatPrice(data.price12Hours)}</span>
 </div>
 <div className="flex justify-between text-sm">
 <span className="text-muted">24-Hour Price</span>
 <span className="font-semibold text-primary">₹{formatPrice(data.price24Hours)}</span>
 </div>
 <div className="flex justify-between text-sm">
 <span className="text-muted">Avg Capacity</span>
 <span className="font-semibold text-primary">{data.capacity || 0} Guests</span>
 </div>
 {data.extraGuestFee && Number(data.extraGuestFee) > 0 ? (
 <div className="flex justify-between text-sm">
 <span className="text-muted">Extra Guest Fee</span>
 <span className="font-semibold text-primary">₹{formatPrice(data.extraGuestFee)}/guest</span>
 </div>
 ) : null}
 </div>

 {/* Outdoor Amenities */}
 <div className="mb-6 border-b border-border dark:border-border pb-4">
 <h3 className="text-sm font-bold text-primary mb-3">Outdoor Amenities</h3>
 <div className="space-y-3">
 {data.hasPool && (
 <div className="bg-accent-primary/10 dark:bg-accent-primary/10 p-3 rounded-lg">
 <div className="flex items-center gap-2 mb-1"><Droplets className="w-4 h-4 text-accent-primary" /> <span className="font-semibold text-accent-primary text-sm">Swimming Pool</span></div>
 <div className="text-xs text-accent-primary dark:text-accent-primary ml-6">Adult Pool: {data.poolSize ||'N/A'} ft</div>
 {data.babyPoolSetup && data.babyPoolSetup !=='NONE' && (
 <div className="text-xs text-accent-primary dark:text-accent-primary ml-6 mt-0.5">Baby Pool: {data.babyPoolSetup} ({data.babyPoolSize ||'N/A'} ft)</div>
 )}
 </div>
 )}
 
 <div className="flex flex-wrap gap-2">
 {data.hasTurf && <span className="px-3 py-1.5 bg-success/10 text-success dark:bg-success/10 dark:text-success text-xs rounded-full font-medium">Turf</span>}
 {data.hasRainDance && <span className="px-3 py-1.5 bg-accent-primary/10 text-accent-primary text-xs rounded-full font-medium">Rain Dance</span>}
 {data.hasPlayArea && <span className="px-3 py-1.5 bg-warning/10 text-warning dark:bg-warning/10 dark:text-warning text-xs rounded-full font-medium">Play Area</span>}
 {data.hasGardenArea && <span className="px-3 py-1.5 bg-success/10 text-success dark:bg-success/10 dark:text-success text-xs rounded-full font-medium">Garden Area</span>}
 {data.hasGazebo && <span className="px-3 py-1.5 bg-surface text-primary dark:bg-surface text-xs rounded-full font-medium">Gazebo</span>}
 {data.hasCelebrationArea && <span className="px-3 py-1.5 bg-accent-premium/10 text-accent-premium dark:bg-accent-premium/10 dark:text-accent-premium text-xs rounded-full font-medium">Celebration Area</span>}
 </div>
 </div>
 </div>

 {/* Property Details (Indoor) */}
 <div className="mb-6 border-b border-border dark:border-border pb-4">
 <h3 className="text-sm font-bold text-primary mb-3">Property Details (Indoor)</h3>
 <div className="grid grid-cols-2 gap-4 mb-4">
 <div className="bg-surface bg-surface p-3 rounded-lg">
 <p className="text-xs text-muted">Total Bedrooms</p>
 <p className="font-bold text-primary">{data.roomCount || 0}</p>
 </div>
 <div className="bg-surface bg-surface p-3 rounded-lg">
 <p className="text-xs text-muted">AC / Non-AC</p>
 <p className="font-bold text-primary">{data.acRoomCount || 0} / {data.nonAcRoomCount || 0}</p>
 </div>
 <div className="bg-surface bg-surface p-3 rounded-lg">
 <p className="text-xs text-muted">Total Halls</p>
 <p className="font-bold text-primary">{data.hallCount || 0}</p>
 </div>
 <div className="bg-surface bg-surface p-3 rounded-lg">
 <p className="text-xs text-muted">Balconies</p>
 <p className="font-bold text-primary">{data.balconyCount || 0}</p>
 </div>
 </div>

 <div className="space-y-2 text-sm text-muted dark:text-muted">
 <div className="flex justify-between"><span>Single Beds</span> <span className="font-medium text-primary">{data.singleBeds || 0}</span></div>
 <div className="flex justify-between"><span>Double Beds</span> <span className="font-medium text-primary">{data.doubleBeds || 0}</span></div>
 <div className="flex justify-between"><span>Extra Mattresses</span> <span className="font-medium text-primary">{data.extraMattresses || 0}</span></div>
 </div>
 </div>

 {/* Kitchen & Electronics */}
 <div className="mb-6 border-b border-border dark:border-border pb-4">
 <h3 className="text-sm font-bold text-primary mb-3">Kitchen & Electronics</h3>
 <div className="space-y-3">
 {data.hasKitchen && (
 <div className="flex items-center gap-2 text-sm text-primary">
 <Coffee className="w-4 h-4" /> Property has a Kitchen
 </div>
 )}
 <div className="flex flex-wrap gap-2 mt-2">
 {data.hasFridge && <span className="px-2.5 py-1 bg-surface text-primary dark:bg-surface text-xs rounded border border-border">Fridge</span>}
 {data.hasROWater && <span className="px-2.5 py-1 bg-surface text-primary dark:bg-surface text-xs rounded border border-border">RO Water</span>}
 {data.hasBBQ && <span className="px-2.5 py-1 bg-surface text-primary dark:bg-surface text-xs rounded border border-border">BBQ Setup</span>}
 {data.hasGasStove && <span className="px-2.5 py-1 bg-surface text-primary dark:bg-surface text-xs rounded border border-border">Gas Stove {data.gasCharge ?`(₹${data.gasCharge})` :'(Free)'}</span>}
 {data.hasTv && <span className="px-2.5 py-1 bg-surface text-primary dark:bg-surface text-xs rounded border border-border">Smart TV</span>}
 {data.hasSpeakers && <span className="px-2.5 py-1 bg-surface text-primary dark:bg-surface text-xs rounded border border-border">Speakers/Music</span>}
 {data.hasMic && <span className="px-2.5 py-1 bg-surface text-primary dark:bg-surface text-xs rounded border border-border">Karaoke/Mic</span>}
 {data.hasWifi && <span className="px-2.5 py-1 bg-surface text-primary dark:bg-surface text-xs rounded border border-border">WiFi Setup</span>}
 </div>
 </div>
 </div>

 {/* Indoor Games */}
 <div className="mb-6 border-b border-border dark:border-border pb-4">
 <h3 className="text-sm font-bold text-primary mb-3">Indoor Games</h3>
 <div className="flex flex-wrap gap-2">
 {data.hasCarom && <span className="px-3 py-1.5 bg-accent-nature/10 text-accent-nature dark:bg-accent-nature/10 dark:text-accent-nature text-xs rounded-full font-medium">Carom</span>}
 {data.hasUno && <span className="px-3 py-1.5 bg-accent-nature/10 text-accent-nature dark:bg-accent-nature/10 dark:text-accent-nature text-xs rounded-full font-medium">UNO</span>}
 {data.hasPlayingCards && <span className="px-3 py-1.5 bg-accent-nature/10 text-accent-nature dark:bg-accent-nature/10 dark:text-accent-nature text-xs rounded-full font-medium">Teen Patti</span>}
 {data.hasChess && <span className="px-3 py-1.5 bg-accent-nature/10 text-accent-nature dark:bg-accent-nature/10 dark:text-accent-nature text-xs rounded-full font-medium">Chess</span>}
 {data.has8BallPool && <span className="px-3 py-1.5 bg-accent-nature/10 text-accent-nature dark:bg-accent-nature/10 dark:text-accent-nature text-xs rounded-full font-medium">8 Ball Pool</span>}
 {(!data.hasCarom && !data.hasUno && !data.hasPlayingCards && !data.hasChess && !data.has8BallPool) && <span className="text-xs text-muted">No indoor games selected</span>}
 </div>
 </div>

 {/* Final Settings */}
 <div className="mb-6">
 <h3 className="text-sm font-bold text-primary mb-3">Settings & Contact</h3>
 <div className="space-y-2 text-sm">
 <div className="flex justify-between">
 <span className="text-muted">Token Booking Amount</span> 
 <span className="font-semibold text-primary">₹{data.tokenAmount || 0}</span>
 </div>
 {data.isAccessible && (
 <div className="flex justify-between mt-2 pt-2 border-t border-border dark:border-border">
 <span className="text-muted">Wheelchair Accessible</span> 
 <span className="font-semibold text-success">Yes</span>
 </div>
 )}
 <div className="mt-4">
 <span className="text-muted block mb-2">Public Contact Numbers</span>
 <div className="space-y-1">
 {(data.contactNumbers || []).map((num: string, idx: number) => (
 <div key={idx} className="bg-surface bg-surface px-3 py-2 rounded text-primary dark:text-primary font-medium">
 {num}
 </div>
 ))}
 {(!data.contactNumbers || data.contactNumbers.length === 0) && <span className="text-muted italic">None provided</span>}
 </div>
 </div>
 </div>
 </div>

 </div>
 
 {/* Bottom Bar */}
 <div className="absolute bottom-0 inset-x-0 h-16 bg-surface bg-surface border-t border-border dark:border-border px-4 flex items-center justify-between z-10 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
 <div>
 <p className="text-[10px] text-muted font-semibold uppercase tracking-wider">Starts From</p>
 <p className="text-sm font-bold text-primary">₹{formatPrice(data.price12Hours)}</p>
 </div>
 <button className="bg-accent-primary text-white font-bold text-sm px-8 py-2.5 rounded-xl">
 Book
 </button>
 </div>
 </div>
 </div>
 
 </div>
 );
}

// ChevronLeft icon missing from imports above so we define a basic one if needed or just add it to imports
function ChevronLeft(props: any) {
 return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="m15 18-6-6 6-6"/></svg>
}

