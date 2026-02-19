import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Share2, Check, MessageCircle, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ShareButtonsProps {
  url: string;
  title: string;
  description?: string;
  className?: string;
}

const ShareButtons = ({ url, title, description, className }: ShareButtonsProps) => {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  const encodedDesc = encodeURIComponent(description || "");

  const openPopup = (shareUrl: string) => {
    window.open(shareUrl, "_blank", "noopener,noreferrer,width=600,height=400");
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast({ title: "¡Enlace copiado al portapapeles!" });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "No se pudo copiar el enlace", variant: "destructive" });
    }
  };

  return (
    <div className={className}>
      <span className="text-muted-foreground text-sm mr-2">Compartir:</span>
      <div className="flex items-center gap-2 flex-wrap mt-2">
        {/* Facebook */}
        <Button
          variant="outline"
          size="sm"
          className="gap-2 border-foreground/20 hover:bg-[#1877F2] hover:text-white hover:border-[#1877F2]"
          onClick={() => openPopup(`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`)}
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
          </svg>
          Facebook
        </Button>

        {/* Twitter/X */}
        <Button
          variant="outline"
          size="sm"
          className="gap-2 border-foreground/20 hover:bg-foreground hover:text-background"
          onClick={() => openPopup(`https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`)}
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
          X
        </Button>

        {/* WhatsApp */}
        <Button
          variant="outline"
          size="sm"
          className="gap-2 border-foreground/20 hover:bg-[#25D366] hover:text-white hover:border-[#25D366]"
          onClick={() => openPopup(`https://wa.me/?text=${encodedTitle}%20${encodedUrl}`)}
        >
          <MessageCircle className="h-4 w-4" />
          WhatsApp
        </Button>

        {/* Telegram */}
        <Button
          variant="outline"
          size="sm"
          className="gap-2 border-foreground/20 hover:bg-[#0088cc] hover:text-white hover:border-[#0088cc]"
          onClick={() => openPopup(`https://t.me/share/url?url=${encodedUrl}&text=${encodedDesc || encodedTitle}`)}
        >
          <Send className="h-4 w-4" />
          Telegram
        </Button>

        {/* Copiar enlace */}
        <Button
          variant="outline"
          size="sm"
          className="gap-2 border-foreground/20"
          onClick={copyLink}
        >
          {copied ? (
            <Check className="h-4 w-4 text-green-500" />
          ) : (
            <Share2 className="h-4 w-4" />
          )}
          {copied ? "¡Copiado!" : "Copiar enlace"}
        </Button>
      </div>
    </div>
  );
};

export default ShareButtons;
