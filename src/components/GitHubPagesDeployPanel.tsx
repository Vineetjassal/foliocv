import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Github, ExternalLink, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

type DeployStatus = "idle" | "deploying" | "success" | "error";

export function GitHubPagesDeployPanel() {
  const [username, setUsername] = useState("");
  const [repoName, setRepoName] = useState("");
  const [branch, setBranch] = useState("gh-pages");
  const [status, setStatus] = useState<DeployStatus>("idle");

  const pagesUrl = username && repoName
    ? `https://${username}.github.io/${repoName}`
    : null;

  const handleDeploy = async () => {
    if (!username.trim() || !repoName.trim()) return;
    setStatus("deploying");

    // Simulate setup instructions / open GitHub Pages settings
    setTimeout(() => {
      window.open(
        `https://github.com/${username}/${repoName}/settings/pages`,
        "_blank"
      );
      setStatus("success");
    }, 1000);
  };

  return (
    <Card className="w-full max-w-md shadow-lg border border-border">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Github className="w-5 h-5" />
          Deploy to GitHub Pages
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="gh-username">GitHub Username</Label>
          <Input
            id="gh-username"
            placeholder="vineetjassal"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="gh-repo">Repository Name</Label>
          <Input
            id="gh-repo"
            placeholder="my-portfolio"
            value={repoName}
            onChange={(e) => setRepoName(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="gh-branch">Branch</Label>
          <Input
            id="gh-branch"
            placeholder="gh-pages"
            value={branch}
            onChange={(e) => setBranch(e.target.value)}
          />
        </div>

        {pagesUrl && (
          <div className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
            Site URL:{" "}
            <a
              href={pagesUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline"
            >
              {pagesUrl}
            </a>
          </div>
        )}

        <Button
          className="w-full gap-2"
          onClick={handleDeploy}
          disabled={status === "deploying" || !username.trim() || !repoName.trim()}
        >
          {status === "deploying" ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Setting up...</>
          ) : (
            <><Github className="w-4 h-4" /> Configure GitHub Pages</>
          )}
        </Button>

        {status === "success" && (
          <div className="flex items-center gap-2 text-green-600 text-sm">
            <CheckCircle className="w-4 h-4" />
            <span>GitHub Pages settings opened!</span>
            <a
              href={`https://github.com/${username}/${repoName}/settings/pages`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 underline"
            >
              Manage <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}
        {status === "error" && (
          <div className="flex items-center gap-2 text-red-500 text-sm">
            <AlertCircle className="w-4 h-4" />
            <span>Something went wrong. Please try again.</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
