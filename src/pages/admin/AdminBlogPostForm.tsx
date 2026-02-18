import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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
  });

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
        });
      }
    };
    load();
  }, [id]);

  const set = (key: string, value: any) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...form };

    if (isEdit) {
      const { error } = await supabase.from("blog_posts").update(payload as any).eq("id", id!);
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    } else {
      const { error } = await supabase.from("blog_posts").insert(payload as any);
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
        <Input value={form.category} onChange={(e) => set("category", e.target.value)} required />
      </div>
      <div className="space-y-2">
        <Label className="text-foreground">Autor</Label>
        <Input value={form.author} onChange={(e) => set("author", e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label className="text-foreground">Descripción corta</Label>
        <Textarea value={form.short_description} onChange={(e) => set("short_description", e.target.value)} rows={2} />
      </div>
      <div className="space-y-2">
        <Label className="text-foreground">Hero Image URL</Label>
        <Input value={form.hero_image_url} onChange={(e) => set("hero_image_url", e.target.value)} />
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
