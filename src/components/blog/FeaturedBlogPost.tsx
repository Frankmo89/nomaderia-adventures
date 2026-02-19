import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Clock, ArrowRight } from "lucide-react";

interface FeaturedBlogPostProps {
  post: {
    slug: string;
    title: string;
    short_description: string | null;
    hero_image_url: string | null;
    category: string;
    author: string | null;
    created_at: string;
    reading_time_min?: number | null;
  };
}

const FeaturedBlogPost = ({ post }: FeaturedBlogPostProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mb-12"
    >
      <Link
        to={`/blog/${post.slug}`}
        className="group block relative rounded-2xl overflow-hidden shadow-2xl h-[50vh] min-h-[400px]"
      >
        {post.hero_image_url ? (
          <img
            src={post.hero_image_url}
            alt={post.title}
            loading="eager"
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-accent/30 to-secondary/30" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
          <div className="flex items-center gap-3 mb-3">
            <Badge className="bg-primary text-primary-foreground">
              {post.category}
            </Badge>
            {post.reading_time_min && (
              <span className="text-muted-foreground text-sm flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {post.reading_time_min} min
              </span>
            )}
            {post.author && (
              <span className="text-muted-foreground text-sm">
                por {post.author}
              </span>
            )}
          </div>
          <h2 className="font-serif text-2xl md:text-4xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
            {post.title}
          </h2>
          {post.short_description && (
            <p className="text-foreground/80 text-sm md:text-base max-w-2xl line-clamp-2 mb-3">
              {post.short_description}
            </p>
          )}
          <span className="text-primary font-medium inline-flex items-center gap-1 group-hover:gap-2 transition-all">
            Leer artículo <ArrowRight className="h-4 w-4" />
          </span>
        </div>
      </Link>
    </motion.div>
  );
};

export default FeaturedBlogPost;
