"use client";

import React, { useRef, useState } from"react";
import { Button } from"./button";
import { UploadCloud, X, Loader2 } from"lucide-react";
import { api } from"@/lib/api";

interface ImageUploadProps {
 value?: string;
 onChange: (url: string) => void;
 disabled?: boolean;
}

export function ImageUpload({ value, onChange, disabled }: ImageUploadProps) {
 const [isUploading, setIsUploading] = useState(false);
 const inputRef = useRef<HTMLInputElement>(null);

 const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
 const file = e.target.files?.[0];
 if (!file) return;

 try {
 setIsUploading(true);
 const formData = new FormData();
 formData.append("files", file);

 const res = await api.post("/upload", formData, {
 headers: {
"Content-Type":"multipart/form-data",
 },
 });

 if (res.data.urls && res.data.urls.length > 0) {
 onChange(res.data.urls[0]);
 }
 } catch (error) {
 console.error("Upload failed", error);
 alert("Failed to upload image.");
 } finally {
 setIsUploading(false);
 if (inputRef.current) {
 inputRef.current.value ="";
 }
 }
 };

 const handleRemove = async () => {
 if (value) {
 try {
 await api.delete("/upload", { data: { url: value } });
 } catch (err) {
 console.error("Failed to delete image from server", err);
 }
 }
 onChange("");
 };

 return (
 <div className="w-full">
 {value ? (
 <div className="relative w-full h-40 rounded-xl border border-border dark:border-border overflow-hidden group">
 <img
 src={value}
 alt="Uploaded preview"
 className="w-full h-full object-cover transition-transform group-hover:scale-105"
 />
 {!disabled && (
 <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
 <Button
 type="button"
 variant="destructive"
 size="sm"
 onClick={handleRemove}
 className="gap-2"
 >
 <X className="w-4 h-4" />
 Remove
 </Button>
 </div>
 )}
 </div>
 ) : (
 <div
 onClick={() => !disabled && !isUploading && inputRef.current?.click()}
 className={`
 w-full h-40 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-colors
 ${disabled || isUploading ?"opacity-50 cursor-not-allowed bg-surface bg-surface border-border dark:border-border" :"cursor-pointer hover:bg-surface dark:hover:bg-surface border-border hover:border-border dark:hover:border-border"}
`}
 >
 {isUploading ? (
 <>
 <Loader2 className="w-8 h-8 text-muted animate-spin" />
 <span className="text-sm font-medium text-muted">Uploading...</span>
 </>
 ) : (
 <>
 <div className="w-12 h-12 rounded-full bg-surface dark:bg-surface flex items-center justify-center mb-2">
 <UploadCloud className="w-6 h-6 text-muted" />
 </div>
 <span className="text-sm font-medium text-primary">Click to upload image</span>
 <span className="text-xs text-muted">SVG, PNG, JPG or GIF (max. 5MB)</span>
 </>
 )}
 </div>
 )}
 <input
 type="file"
 ref={inputRef}
 onChange={handleFileChange}
 className="hidden"
 accept="image/*"
 disabled={disabled || isUploading}
 />
 </div>
 );
}
