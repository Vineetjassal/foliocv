import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Share2, Copy, Check, Twitter, Linkedin } from "lucide-react";

interface PortfolioShareCardProps {
  portfolioUrl?: string;
  userName?: string;
  title?: string;
}

export function PortfolioShareCard({
  portfolioUrl = window.location.href,
  userName = "Your Portfolio",
  title = "Check out my portfolio!",
}: PortfolioShareCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(portfolioUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const twitterShare = () => {
    const text = encodeURIComponent(`${title} ${portfolioUrl}`);
    window.open(`https://twitter.com/intent/tweet?text=${text}`, "_blank");
  };

  const linkedinShare = () => {
    const url = encodeURIComponent(portfolioUrl);
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, "_blank");
  };

  return (
    <Card className="w-full max-w-md shadow-lg border border-border">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Share2 className="w-5 h-5 text-primary" />
          Share Portfolio
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Preview Card */}
        <div className="rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 p-4">
          <p className="font-semibold text-foreground">{userName}</p>
          <p className="text-sm text-muted-foreground mt-1">{title}</p>
          <p className="text-xs text-primary mt-2 truncate">{portfolioUrl}</p>
        </div>

        {/* Copy Link */}
        <div className="flex gap-2">
          <Input
            value={portfolioUrl}
            readOnly
            className="text-sm flex-1"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="shrink-0"
          >
            {copied ? (
              <><Check className="w-4 h-4 text-green-500" /> Copied</>
            ) : (
              <><Copy className="w-4 h-4" /> Copy</>
            )}
          </Button>
        </div>

        {/* Social Share Buttons */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1 gap-2"
            onClick={twitterShare}
          >
            <Twitter className="w-4 h-4" /> Twitter
          </Button>
          <Button
            variant="outline"
            className="flex-1 gap-2"
            onClick={linkedinShare}
          >
            <Linkedin className="w-4 h-4" /> LinkedIn
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
