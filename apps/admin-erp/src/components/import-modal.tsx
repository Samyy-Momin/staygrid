"use client";

import { useState } from"react";
import { Button } from"@/components/ui/button";
import { Download, Upload, X, CheckCircle2, AlertCircle } from"lucide-react";
import Papa from"papaparse";
import { api } from"@/lib/api";

type ImportRow = Record<string, string>;

export function ImportModal({ isOpen, onClose, onSuccess }: { isOpen: boolean; onClose: () => void; onSuccess?: () => void }) {
 const [step, setStep] = useState<"UPLOAD" |"PREVIEW" |"SUCCESS">("UPLOAD");
 const [loading, setLoading] = useState(false);
 const [error, setError] = useState("");
 
 // Validation Results
 const [previewData, setPreviewData] = useState<any[]>([]);
 const [stats, setStats] = useState({ total: 0, valid: 0, invalid: 0 });

 if (!isOpen) return null;

 const downloadTemplate = () => {
 const headers = [
'owner_email','owner_name','owner_phone','owner_password', 
'farmhouse_title','description','price12Hours','price24Hours','capacity','tokenAmount',
'isActive','isFeatured','isCoupleFriendly','isPetFriendly','isWheelchairAccessible',
'city','streetAddress','latitude','longitude',
'hasPool','poolSize','hasTurf','hasRainDance','hasPlayArea','hasGardenArea','hasGazebo',
'roomCount','acRoomCount','hasKitchen','hasFridge','hasRoWater','hasBbq','hasGas',
'hasWifi','hasTv','hasSpeakers','hasMicrophone',
'hasCarom','hasUno','hasTeenPatti','hasChess','has8BallPool'
 ].join(',');
 
 const sampleRow = [
'example@owner.com','John Owner',`'+919876543210`,'pass123',
'Sunset Villa','A beautiful property with sunset views','5000','8000','10','2000',
'true','false','true','true','true',
'Lonavala','"Plot 4, Main Road"','18.75','73.40',
'true','15x25','false','true','true','true','false',
'3','2','true','true','true','false','false',
'true','true','true','false',
'true','false','true','false','true'
 ].join(',');

 const csvContent = headers +'\n' + sampleRow +'\n';
 const blob = new Blob([csvContent], { type:'text/csv;charset=utf-8;' });
 const url = URL.createObjectURL(blob);
 const link = document.createElement("a");
 link.href = url;
 link.setAttribute("download","staygrid_import_template.csv");
 document.body.appendChild(link);
 link.click();
 document.body.removeChild(link);
 };

 const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
 const file = e.target.files?.[0];
 if (!file) return;

 setLoading(true);
 setError("");

 Papa.parse(file, {
 header: true,
 skipEmptyLines: true,
 complete: async (results) => {
 try {
 const res = await api.post("/import/validate", results.data);
 setPreviewData(res.data.rows);
 setStats({ total: res.data.total, valid: res.data.validToImport, invalid: res.data.invalid });
 setStep("PREVIEW");
 } catch (err: any) {
 setError(err.response?.data?.message ||"Failed to validate CSV");
 } finally {
 setLoading(false);
 }
 },
 error: (err) => {
 setError("Error parsing CSV file");
 setLoading(false);
 }
 });
 };

 const executeImport = async () => {
 setLoading(true);
 setError("");
 try {
 await api.post("/import/execute", previewData);
 setStep("SUCCESS");
 if (onSuccess) onSuccess();
 } catch (err: any) {
 setError(err.response?.data?.message ||"Failed to execute import");
 } finally {
 setLoading(false);
 }
 };

 const reset = () => {
 setStep("UPLOAD");
 setPreviewData([]);
 setError("");
 setLoading(false);
 onClose();
 };

 return (
 <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
 <div className="bg-surface rounded-lg shadow-xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
 <div className="flex items-center justify-between p-4 border-b border-border dark:border-border">
 <h3 className="text-lg font-bold text-primary">Import Owners & Farmhouses</h3>
 <button onClick={reset} className="text-muted hover:text-primary dark:hover:text-muted">
 <X className="w-5 h-5" />
 </button>
 </div>

 <div className="p-6 overflow-y-auto flex-1">
 {error && (
 <div className="bg-danger/10 text-danger p-3 rounded text-sm border border-danger/20 mb-4 flex items-center">
 <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" /> {error}
 </div>
 )}

 {step ==="UPLOAD" && (
 <div className="space-y-6">
 <div className="bg-accent-primary/10 dark:bg-accent-primary/10 border border-accent-primary/20 dark:border-accent-primary/20 rounded p-4 text-sm text-accent-primary dark:text-accent-primary">
 <p className="font-semibold mb-1">How it works:</p>
 <ol className="list-decimal pl-5 space-y-1">
 <li>Download the CSV template.</li>
 <li>Fill in owner details and their farmhouse details on the same row.</li>
 <li>If an owner email already exists, we will skip creating the owner and simply attach the farmhouse to them.</li>
 </ol>
 </div>

 <div className="grid grid-cols-2 gap-4">
 <Button onClick={downloadTemplate} variant="outline" className="h-24 flex flex-col items-center justify-center border-dashed">
 <Download className="w-6 h-6 mb-2 text-muted" />
 <span>Download Template</span>
 </Button>
 
 <div className="relative h-24">
 <input 
 type="file" 
 accept=".csv" 
 onChange={handleFileUpload}
 className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
 disabled={loading}
 />
 <Button variant="outline" className="w-full h-full flex flex-col items-center justify-center border-dashed bg-surface bg-surface hover:bg-surface dark:hover:bg-surface pointer-events-none">
 <Upload className="w-6 h-6 mb-2 text-muted" />
 <span>{loading ?"Parsing..." :"Upload Filled CSV"}</span>
 </Button>
 </div>
 </div>
 </div>
 )}

 {step ==="PREVIEW" && (
 <div className="space-y-4">
 <div className="flex gap-4 mb-4">
 <div className="bg-surface bg-surface px-4 py-2 rounded">
 <span className="block text-xs text-muted uppercase font-bold">Total Rows</span>
 <span className="text-xl font-bold">{stats.total}</span>
 </div>
 <div className="bg-success/10 dark:bg-success/10 px-4 py-2 rounded border border-success/20 dark:border-success/20">
 <span className="block text-xs text-success dark:text-success uppercase font-bold">Valid (Will Import)</span>
 <span className="text-xl font-bold text-success dark:text-success">{stats.valid}</span>
 </div>
 <div className="bg-danger/10 dark:bg-danger/20 px-4 py-2 rounded border border-danger/20 dark:border-danger/20">
 <span className="block text-xs text-danger dark:text-danger uppercase font-bold">Invalid (Skipped)</span>
 <span className="text-xl font-bold text-danger dark:text-danger">{stats.invalid}</span>
 </div>
 </div>

 <div className="border border-border dark:border-border rounded-md overflow-hidden">
 <table className="w-full text-left text-sm">
 <thead className="bg-surface bg-surface text-muted">
 <tr>
 <th className="px-4 py-2">Status</th>
 <th className="px-4 py-2">Owner Email</th>
 <th className="px-4 py-2">Farmhouse</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-border dark:divide-border">
 {previewData.map((row, idx) => (
 <tr key={idx} className="bg-surface">
 <td className="px-4 py-2">
 {row.status ==='NEW_OWNER' && <span className="text-success font-medium text-xs bg-success/10 px-2 py-1 rounded">New Owner</span>}
 {row.status === 'EXISTING_OWNER' && <span className="text-accent-primary font-medium text-xs bg-accent-primary/10 px-2 py-1 rounded">Existing Owner</span>}
 {row.status ==='INVALID' && <span className="text-danger font-medium text-xs bg-danger/10 px-2 py-1 rounded">Invalid: {row.reason}</span>}
 </td>
 <td className="px-4 py-2 text-primary dark:text-primary">{row.owner_email ||'-'}</td>
 <td className="px-4 py-2 text-primary dark:text-primary">{row.farmhouse_title ||'-'}</td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>

 <div className="flex justify-end gap-2 pt-4">
 <Button variant="outline" onClick={() => setStep("UPLOAD")}>Cancel</Button>
 <Button onClick={executeImport} disabled={loading || stats.valid === 0}>
 {loading ?"Importing..." :`Confirm & Import ${stats.valid} Rows`}
 </Button>
 </div>
 </div>
 )}

 {step ==="SUCCESS" && (
 <div className="text-center py-8 space-y-4">
 <CheckCircle2 className="w-16 h-16 text-success mx-auto" />
 <h3 className="text-xl font-bold text-primary">Import Complete!</h3>
 <p className="text-muted dark:text-muted">The data has been successfully imported into the system.</p>
 <Button onClick={reset} className="mt-4">Close & Refresh</Button>
 </div>
 )}
 </div>
 </div>
 </div>
 );
}
