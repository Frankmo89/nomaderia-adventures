import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Product { name: string; price: string; rating: number; pros: string[]; cons: string[]; affiliate_url: string; }

const emptyProduct = (): Product => ({ name: "", price: "", rating: 5, pros: [""], cons: [""], affiliate_url: "" });

const AdminGearArticleForm = () => {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const { toast } = useToast();
  const [form, setForm] = useState({ title: "", slug: "", category: "", short_description: "", content_markdown: "", is_published: false, featured: false });
  const [products, setProducts] = useState<Product[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isEdit) return;
    const load = async () => {
      const { data } = await supabase.from("gear_articles").select("*").eq("id", id).maybeSingle();
      if (!data) return;
      setForm({
        title: data.title, slug: data.slug, category: data.category,
        short_description: data.short_description || "", content_markdown: data.content_markdown || "",
        is_published: data.is_published || false, featured: data.featured || false,
      });
      setProducts((data.products as unknown as Product[]) || []);
    };
    load();
  }, [id, isEdit]);

  const set = (key: string, val: string | boolean) => setForm((p) => ({ ...p, [key]: val }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = { ...form, products: JSON.parse(JSON.stringify(products)), short_description: form.short_description || null, content_markdown: form.content_markdown || null };
    const { error } = isEdit
      ? await supabase.from("gear_articles").update(payload).eq("id", id)
      : await supabase.from("gear_articles").insert(payload);
    setSaving(false);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else navigate("/admin/gear-articles");
  };

  const addProduct = () => setProducts([...products, emptyProduct()]);
  const removeProduct = (i: number) => setProducts(products.filter((_, idx) => idx !== i));
  const updateProduct = <K extends keyof Product>(i: number, key: K, val: Product[K]) =>
    setProducts(products.map((p, idx) => (idx === i ? { ...p, [key]: val } : p)));

  return (
    <div className="max-w-3xl">
      <h1 className="font-serif text-3xl text-foreground mb-6">{isEdit ? "Editar Artículo" : "Nuevo Artículo"}</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="bg-card border-border">
          <CardHeader><CardTitle className="text-card-foreground">Información</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label className="text-card-foreground">Título *</Label><Input value={form.title} onChange={(e) => set("title", e.target.value)} className="bg-background border-border text-foreground" required /></div>
              <div><Label className="text-card-foreground">Slug *</Label><Input value={form.slug} onChange={(e) => set("slug", e.target.value)} className="bg-background border-border text-foreground" required /></div>
              <div><Label className="text-card-foreground">Categoría *</Label><Input value={form.category} onChange={(e) => set("category", e.target.value)} className="bg-background border-border text-foreground" required /></div>
            </div>
            <div><Label className="text-card-foreground">Descripción Corta</Label><Textarea value={form.short_description} onChange={(e) => set("short_description", e.target.value)} className="bg-background border-border text-foreground" /></div>
            <div><Label className="text-card-foreground">Contenido (Markdown)</Label><Textarea rows={12} value={form.content_markdown} onChange={(e) => set("content_markdown", e.target.value)} className="bg-background border-border text-foreground font-mono text-sm" /></div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2"><Switch checked={form.is_published} onCheckedChange={(v) => set("is_published", v)} /><Label className="text-card-foreground">Publicado</Label></div>
              <div className="flex items-center gap-2"><Switch checked={form.featured} onCheckedChange={(v) => set("featured", v)} /><Label className="text-card-foreground">Destacado</Label></div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader><CardTitle className="text-card-foreground">Productos Recomendados</CardTitle></CardHeader>
          <CardContent className="space-y-6">
            {products.map((p, i) => (
              <div key={i} className="p-4 border border-border rounded-lg space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-card-foreground">Producto {i + 1}</span>
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeProduct(i)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Input placeholder="Nombre" value={p.name} onChange={(e) => updateProduct(i, "name", e.target.value)} className="bg-background border-border text-foreground" />
                  <Input placeholder="Precio" value={p.price} onChange={(e) => updateProduct(i, "price", e.target.value)} className="bg-background border-border text-foreground" />
                  <Input type="number" placeholder="Rating (1-5)" min={1} max={5} value={p.rating} onChange={(e) => updateProduct(i, "rating", Number(e.target.value))} className="bg-background border-border text-foreground" />
                </div>
                <Input placeholder="URL Afiliado" value={p.affiliate_url} onChange={(e) => updateProduct(i, "affiliate_url", e.target.value)} className="bg-background border-border text-foreground" />
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-card-foreground text-xs">Pros (uno por línea)</Label>
                    <Textarea value={p.pros.join("\n")} onChange={(e) => updateProduct(i, "pros", e.target.value.split("\n"))} className="bg-background border-border text-foreground text-sm" rows={3} />
                  </div>
                  <div>
                    <Label className="text-card-foreground text-xs">Contras (uno por línea)</Label>
                    <Textarea value={p.cons.join("\n")} onChange={(e) => updateProduct(i, "cons", e.target.value.split("\n"))} className="bg-background border-border text-foreground text-sm" rows={3} />
                  </div>
                </div>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={addProduct} className="border-border text-foreground">
              <Plus className="h-4 w-4 mr-1" /> Agregar Producto
            </Button>
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button type="submit" disabled={saving} className="bg-primary hover:bg-primary/90 text-primary-foreground">
            {saving ? "Guardando..." : isEdit ? "Actualizar" : "Crear Artículo"}
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate("/admin/gear-articles")} className="border-border text-foreground">Cancelar</Button>
        </div>
      </form>
    </div>
  );
};

export default AdminGearArticleForm;
