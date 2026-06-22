import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ExternalLink, Zap, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

type DeployStatus = "idle" | "deploying" | "success" | "error";

export function VercelDeployPanel() {
  const [repoUrl, setRepoUrl] = useState("");
  const [projectName, setProjectName] = useState("");
  const [status, setStatus] = useState<DeployStatus>("idle");
  const [deployUrl, setDeployUrl] = useState("");

  const VERCEL_DEPLOY_HOOK = ""; // User should set their Vercel Deploy Hook URL

  const handleDeploy = async () => {
    if (!repoUrl.trim()) return;
    setStatus("deploying");

    try {
      if (VERCEL_DEPLOY_HOOK) {
        await fetch(VERCEL_DEPLOY_HOOK, { method: "POST" });
        setStatus("success");
        setDeployUrl(`https://${projectName || "your-project"}.vercel.app`);
      } else {
        // Fallback: open Vercel import page
        const encoded = encodeURIComponent(repoUrl);
        window.open(
          `https://vercel.com/new/clone?repository-url=${encoded}&project-name=${encodeURIComponent(projectName)}`,
          "_blank"
        );
        setStatus("success");
        setDeployUrl("https://vercel.com/dashboard");
      }
    } catch {
      setStatus("error");
    }
  };

  return (
    <Card className="w-full max-w-md shadow-lg border border-border">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Zap className="w-5 h-5 text-black dark:text-white" />
          Deploy to Vercel
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="repo-url">GitHub Repository URL</Label>
          <Input
            id="repo-url"
            placeholder="https://github.com/username/repo"
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="project-name">Project Name (optional)</Label>
          <Input
            id="project-name"
            placeholder="my-portfolio"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
          />
        </div>

        <Button
          className="w-full bg-black hover:bg-gray-900 text-white"
          onClick={handleDeploy}
          disabled={status === "deploying" || !repoUrl.trim()}
        >
          {status === "deploying" ? (
            <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Deploying...</>
          ) : (
            <><Zap className="w-4 h-4 mr-2" /> Deploy Now</>
          )}
        </Button>

        {status === "success" && (
          <div className="flex items-center gap-2 text-green-600 text-sm">
            <CheckCircle className="w-4 h-4" />
            <span>Deployment triggered!</span>
            {deployUrl && (
              <a
                href={deployUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 underline"
              >
                View <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        )}
        {status === "error" && (
          <div className="flex items-center gap-2 text-red-500 text-sm">
            <AlertCircle className="w-4 h-4" />
            <span>Deployment failed. Check your configuration.</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
