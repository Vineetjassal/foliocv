import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Linkedin, Upload, CheckCircle, AlertCircle, FileJson } from "lucide-react";

export interface LinkedInProfile {
  firstName?: string;
  lastName?: string;
  headline?: string;
  summary?: string;
  positions?: Array<{
    title: string;
    companyName: string;
    startDate?: string;
    endDate?: string;
    description?: string;
  }>;
  skills?: Array<{ name: string }>;
  education?: Array<{
    schoolName: string;
    degreeName?: string;
    fieldOfStudy?: string;
    startDate?: string;
    endDate?: string;
  }>;
}

interface LinkedInImportProps {
  onImport: (profile: LinkedInProfile) => void;
}

export function LinkedInImport({ onImport }: LinkedInImportProps) {
  const [jsonText, setJsonText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parseAndImport = (raw: string) => {
    try {
      const parsed: LinkedInProfile = JSON.parse(raw);
      onImport(parsed);
      setSuccess(true);
      setError(null);
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      setError("Invalid JSON. Please paste a valid LinkedIn export JSON.");
      setSuccess(false);
    }
  };

  const handleManualImport = () => {
    if (!jsonText.trim()) {
      setError("Please paste your LinkedIn JSON data.");
      return;
    }
    parseAndImport(jsonText);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target?.result as string;
      setJsonText(content);
      parseAndImport(content);
    };
    reader.readAsText(file);
  };

  return (
    <Card className="w-full max-w-lg shadow-lg border border-border">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Linkedin className="w-5 h-5 text-[#0A66C2]" />
          Import from LinkedIn
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Export your LinkedIn data as JSON and paste it below, or upload the file directly.
        </p>

        {/* File Upload */}
        <div
          className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border p-6 cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => fileInputRef.current?.click()}
        >
          <FileJson className="w-8 h-8 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">Click to upload LinkedIn JSON file</p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={handleFileUpload}
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-muted-foreground">or paste JSON</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* Paste Area */}
        <div className="space-y-2">
          <Label htmlFor="linkedin-json">LinkedIn JSON Data</Label>
          <Textarea
            id="linkedin-json"
            placeholder='{"firstName": "Vineet", "positions": [...], "skills": [...]}'
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            className="min-h-[120px] font-mono text-xs"
          />
        </div>

        <Button
          className="w-full gap-2 bg-[#0A66C2] hover:bg-[#004182] text-white"
          onClick={handleManualImport}
        >
          <Upload className="w-4 h-4" /> Import Profile Data
        </Button>

        {success && (
          <div className="flex items-center gap-2 text-green-600 text-sm">
            <CheckCircle className="w-4 h-4" />
            Profile imported successfully!
          </div>
        )}
        {error && (
          <div className="flex items-center gap-2 text-red-500 text-sm">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
