import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import ImageUpload from "@/components/dashboard/ImageUpload";

const blogCategories = [
  "Noticias",
  "Trending Hikes",
  "Historias",
  "Preparación",
  "Errores",
  "Inspiración",
  "Consejos",
  "Listas",
];

const AdminBlogPostForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isEdit = Boolean(id);

  const [form, setForm] = useState({
    title: "",
    slug: "",
    category: "Preparación",
    short_description: "",
    content_markdown: "",
    hero_image_url: "",
    author: "Nomaderia",
    is_published: false,
    featured: false,
    reading_time_min: "5",
    meta_description: "",
  });
  const [tags, setTags] = useState<string[]>([]);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      const { data } = await supabase.from("blog_posts").select("*").eq("id", id).maybeSingle();
      if (data) {
        const d = data as any;
        setForm({
          title: d.title || "",
          slug: d.slug || "",
          category: d.category || "Preparación",
          short_description: d.short_description || "",
          content_markdown: d.content_markdown || "",
          hero_image_url: d.hero_image_url || "",
          author: d.author || "Nomaderia",
          is_published: d.is_published || false,
          featured: d.featured || false,
          reading_time_min: String(d.reading_time_min || "5"),
          meta_description: d.meta_description || "",
        });
        setTags((d.tags as string[]) || []);
      }
    };
    load();
  }, [id]);

  const set = (key: string, value: any) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      title: form.title,
      slug: form.slug,
      category: form.category,
      short_description: form.short_description || null,
      content_markdown: form.content_markdown || null,
      hero_image_url: form.hero_image_url || null,
      author: form.author || null,
      is_published: form.is_published,
      featured: form.featured,
      reading_time_min: form.reading_time_min ? Number(form.reading_time_min) : null,
      meta_description: form.meta_description || null,
      tags,
    };

    if (isEdit) {
      const { error } = await supabase.from("blog_posts").update(payload).eq("id", id!);
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    } else {
      const { error } = await supabase.from("blog_posts").insert(payload);
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    }
    toast({ title: isEdit ? "Post actualizado" : "Post creado" });
    navigate("/admin/blog-posts");
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
      <h1 className="font-serif text-3xl text-foreground">{isEdit ? "Editar Post" : "Nuevo Post"}</h1>

      <div className="space-y-2">
        <Label className="text-foreground">Título</Label>
        <Input value={form.title} onChange={(e) => set("title", e.target.value)} required />
      </div>
      <div className="space-y-2">
        <Label className="text-foreground">Slug</Label>
        <Input value={form.slug} onChange={(e) => set("slug", e.target.value)} required />
      </div>
      <div className="space-y-2">
        <Label className="text-foreground">Categoría</Label>
        <Select value={form.category} onValueChange={(v) => set("category", v)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {blogCategories.map((cat) => (
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label className="text-foreground">Autor</Label>
        <Input value={form.author} onChange={(e) => set("author", e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label className="text-foreground">Tiempo de lectura (min)</Label>
        <Input type="number" value={form.reading_time_min} onChange={(e) => set("reading_time_min", e.target.value)} min={1} />
      </div>
      <div className="space-y-2">
        <Label className="text-foreground">Hero Image</Label>
        <ImageUpload
          bucket="blog-posts"
          currentUrl={form.hero_image_url}
          onUploadComplete={(url) => set("hero_image_url", url)}
        />
      </div>
      <div className="space-y-2">
        <Label className="text-foreground">Descripción corta</Label>
        <Textarea value={form.short_description} onChange={(e) => set("short_description", e.target.value)} rows={2} />
      </div>
      <div className="space-y-2">
        <Label className="text-foreground">Meta Description (SEO)</Label>
        <Textarea value={form.meta_description} onChange={(e) => set("meta_description", e.target.value)} rows={2} placeholder="Descripción optimizada para Google (máx 160 caracteres)" />
      </div>
      <div className="space-y-2">
        <Label className="text-foreground">Tags (uno por línea)</Label>
        <Textarea
          value={tags.join("\n")}
          onChange={(e) => setTags(e.target.value.split("\n").filter((t) => t.trim()))}
          rows={3}
          className="font-mono text-sm"
          placeholder={"hiking\nmexico\nprincipiantes"}
        />
      </div>
      <div className="space-y-2">
        <Label className="text-foreground">Contenido (Markdown)</Label>
        <Textarea value={form.content_markdown} onChange={(e) => set("content_markdown", e.target.value)} rows={12} className="font-mono text-sm" />
      </div>
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <Switch checked={form.is_published} onCheckedChange={(v) => set("is_published", v)} />
          <Label className="text-foreground">Publicado</Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch checked={form.featured} onCheckedChange={(v) => set("featured", v)} />
          <Label className="text-foreground">Destacado</Label>
        </div>
      </div>
      <div className="flex gap-3">
        <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground">
          {isEdit ? "Guardar" : "Crear"}
        </Button>
        <Button type="button" variant="outline" onClick={() => navigate("/admin/blog-posts")}>Cancelar</Button>
      </div>
    </form>
  );
};

export default AdminBlogPostForm;
