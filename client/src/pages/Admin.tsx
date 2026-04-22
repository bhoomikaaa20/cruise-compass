import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Anchor, Edit, Plus, Ship, Trash2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import axios from "axios";

const API = "http://localhost:5000/api/admin";

type Cruise = any;
type AdminBooking = any;

const emptyForm = {
  name: "",
  ship_name: "",
  destination: "",
  description: "",
  duration_nights: 7,
  price_per_person: 1500,
  departure_port: "",
  return_port: "",
  route: "",
  departure_date: "",
  return_date: "",
  capacity: 200,
  facilities: "",
  image_url: "",
};

const Admin = () => {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [cruises, setCruises] = useState<Cruise[]>([]);
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false); // REQUIRED (no UI change)

  // ✅ AUTH CHECK (same behavior, just safer)
  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      navigate("/auth");
      return;
    }

    if (!isAdmin) {
      toast.error("Admin access required");
      navigate("/");
      return;
    }
  }, [user, isAdmin, authLoading, navigate]);

  useEffect(() => {
    if (!isAdmin) return;
    loadAll();
  }, [isAdmin]);

  // ✅ LOAD DATA (REPLACED SUPABASE)
  const loadAll = async () => {
    setLoading(true);

    const token = localStorage.getItem("token");

    try {
      const [cruiseRes, bookingRes] = await Promise.all([
        axios.get(`${API}/cruises`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${API}/bookings`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      setCruises(cruiseRes.data || []);
      setBookings(bookingRes.data || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load data");
    }

    setLoading(false);
  };

  const startEdit = (c: any) => {
    setEditingId(c._id);

    setForm({
      name: c.name,
      ship_name: c.ship_name ?? "",
      destination: c.destination,
      description: c.description ?? "",
      duration_nights: c.duration_nights,
      price_per_person: Number(c.price_per_person),
      departure_port: c.departure_port,
      return_port: c.return_port,
      route: (c.route || []).join(", "),
      departure_date: c.departure_date,
      return_date: c.return_date,
      capacity: c.capacity,
      facilities: (c.facilities || []).join(", "),
      image_url: c.image_url ?? "",
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const reset = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  // ❌ Supabase storage removed (UI unchanged)
  const handleImage = async () => {
    toast.error("Use image URL instead");
  };

  // ✅ SAVE (CREATE / UPDATE)
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const token = localStorage.getItem("token");

    const payload = {
      name: form.name.trim(),
      ship_name: form.ship_name.trim() || null,
      destination: form.destination.trim(),
      description: form.description.trim() || null,
      duration_nights: Number(form.duration_nights),
      price_per_person: Number(form.price_per_person),
      departure_port: form.departure_port.trim(),
      return_port: form.return_port.trim(),
      route: form.route.split(",").map((s) => s.trim()).filter(Boolean),
      departure_date: form.departure_date,
      return_date: form.return_date,
      capacity: Number(form.capacity),
      facilities: form.facilities.split(",").map((s) => s.trim()).filter(Boolean),
      image_url: form.image_url.trim() || null,
    };

    try {
      if (editingId) {
        await axios.put(`${API}/cruises/${editingId}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        await axios.post(`${API}/cruises`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      toast.success(editingId ? "Cruise updated" : "Cruise created");
      reset();
      loadAll();
    } catch {
      toast.error("Error saving cruise");
    }

    setSaving(false);
  };

  const remove = async (id: string) => {


    const token = localStorage.getItem("token");

    try {
      await axios.delete(`${API}/cruises/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success("Cruise deleted");
      loadAll();
    } catch {
      toast.error("Delete failed");
    }
  };

  // ✅ UPDATE BOOKING
  const updateBooking = async (id: string, status: string) => {
    try {
      await axios.put(`${API}/bookings/${id}`, { status });
      toast.success("Booking updated");
      loadAll();
    } catch {
      toast.error("Update failed");
    }
  };

  if (authLoading) return <div className="container py-12">Loading...</div>;
  if (!user || !isAdmin) return null;

  return (
    <div className="container py-12">
      <div className="mb-8">
        <p className="text-sm text-primary font-medium mb-2 uppercase tracking-wider">Admin</p>
        <h1 className="font-display text-4xl md:text-5xl">Manage cruises</h1>
      </div>

      <Tabs defaultValue="cruises" className="space-y-8">
        <TabsList>
          <TabsTrigger value="cruises">Cruises ({cruises.length})</TabsTrigger>
          <TabsTrigger value="bookings">Bookings ({bookings.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="cruises" className="space-y-8">
          <form onSubmit={save} className="bg-gradient-card border border-border rounded-2xl p-6 shadow-soft space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-2xl flex items-center gap-2">
                {editingId ? <><Edit className="size-5" /> Edit cruise</> : <><Plus className="size-5" /> New cruise</>}
              </h2>
              {editingId && <Button type="button" variant="ghost" size="sm" onClick={reset}>Cancel edit</Button>}
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Cruise name" required>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </Field>
              <Field label="Ship name">
                <Input value={form.ship_name} onChange={(e) => setForm({ ...form, ship_name: e.target.value })} />
              </Field>
              <Field label="Destination" required>
                <Input value={form.destination} onChange={(e) => setForm({ ...form, destination: e.target.value })} placeholder="Mediterranean, Caribbean..." required />
              </Field>
              <Field label="Duration (nights)" required>
                <Input type="number" min={1} value={form.duration_nights} onChange={(e) => setForm({ ...form, duration_nights: Number(e.target.value) })} required />
              </Field>
              <Field label="Departure port" required>
                <Input value={form.departure_port} onChange={(e) => setForm({ ...form, departure_port: e.target.value })} required />
              </Field>
              <Field label="Return port" required>
                <Input value={form.return_port} onChange={(e) => setForm({ ...form, return_port: e.target.value })} required />
              </Field>
              <Field label="Departure date" required>
                <Input type="date" value={form.departure_date} onChange={(e) => setForm({ ...form, departure_date: e.target.value })} required />
              </Field>
              <Field label="Return date" required>
                <Input type="date" value={form.return_date} onChange={(e) => setForm({ ...form, return_date: e.target.value })} required />
              </Field>
              <Field label="Price per person ($)" required>
                <Input type="number" min={0} step="0.01" value={form.price_per_person} onChange={(e) => setForm({ ...form, price_per_person: Number(e.target.value) })} required />
              </Field>
              <Field label="Capacity" required>
                <Input type="number" min={1} value={form.capacity} onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })} required />
              </Field>
            </div>
            <Field label="Route stops (comma separated)">
              <Input value={form.route} onChange={(e) => setForm({ ...form, route: e.target.value })} placeholder="Barcelona, Marseille, Naples..." />
            </Field>
            <Field label="Facilities (comma separated)">
              <Input value={form.facilities} onChange={(e) => setForm({ ...form, facilities: e.target.value })} placeholder="Pool, Spa, Fine dining..." />
            </Field>
            <Field label="Description">
              <Textarea rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </Field>

            <Field label="Cover image">
              <div className="flex items-center gap-3 flex-wrap">
                {form.image_url && (
                  <img src={form.image_url} alt="preview" className="size-16 rounded-lg object-cover border border-border" />
                )}
                <label className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-background hover:bg-secondary cursor-pointer text-sm font-medium transition">
                  <Upload className="size-4" />
                  {uploading ? "Uploading..." : "Upload image"}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleImage(e.target.files[0])}
                  />
                </label>
                {form.image_url && (
                  <Button type="button" size="sm" variant="ghost" onClick={() => setForm({ ...form, image_url: "" })}>
                    <X className="size-4" /> Remove
                  </Button>
                )}
              </div>
            </Field>

            <Button type="submit" variant="hero" size="lg" disabled={saving}>
              {saving ? "Saving..." : editingId ? "Update cruise" : "Create cruise"}
            </Button>
          </form>

          <div>
            <h2 className="font-display text-2xl mb-4">All cruises</h2>
            {loading ? (
              <div className="space-y-3">{[1, 2].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
            ) : cruises.length === 0 ? (
              <p className="text-muted-foreground text-center py-12">No cruises yet. Add one above.</p>
            ) : (
              <div className="space-y-3">
                {cruises.map((c) => (
                  <div key={c._id} className="bg-gradient-card border border-border rounded-xl p-4 flex items-center gap-4 shadow-soft">
                    <div className="size-14 rounded-lg bg-gradient-hero flex items-center justify-center overflow-hidden flex-shrink-0">
                      {c.image_url ? <img src={c.image_url} alt="" className="w-full h-full object-cover" /> : <Ship className="size-6 text-primary-foreground/60" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-display text-lg truncate">{c.name}</p>
                      <p className="text-sm text-muted-foreground truncate">
                        {c.destination} · {format(new Date(c.departure_date), "MMM d, yyyy")} · ${Number(c.price_per_person).toLocaleString()} · {c.available_spots}/{c.capacity} left
                      </p>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => startEdit(c)}><Edit className="size-4" /></Button>
                    <Button size="sm" variant="ghost" onClick={() => remove(c._id)} className="text-destructive hover:text-destructive">
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="bookings">
          {loading ? (
            <div className="space-y-3">{[1, 2].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
          ) : bookings.length === 0 ? (
            <div className="text-center py-20 bg-gradient-card rounded-2xl border border-border">
              <Anchor className="size-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No bookings yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {bookings.map((b) => (
                <div key={b.id} className="bg-gradient-card border border-border rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-3 shadow-soft">
                  <div className="flex-1">
                    <p className="font-display text-lg">{b.cruises?.name ?? "Cruise"}</p>
                    <p className="text-sm text-muted-foreground">
                      {b.profiles?.display_name ?? b.contact_email ?? "Guest"} · {b.passenger_count} pax · {b.cabin_class} · {format(new Date(b.travel_date), "MMM d, yyyy")} · ${Number(b.total_price).toLocaleString()}
                    </p>
                  </div>
                  <span className={`text-xs px-3 py-1 rounded-full font-medium ${b.status === "confirmed" ? "bg-primary/10 text-primary"
                    : b.status === "cancelled" ? "bg-destructive/10 text-destructive"
                      : "bg-accent/20 text-accent-foreground"
                    }`}>{b.status}</span>
                  <div className="flex gap-2">
                    {b.status !== "confirmed" && <Button size="sm" variant="outline" onClick={() => updateBooking(b.id, "confirmed")}>Confirm</Button>}
                    {b.status !== "cancelled" && <Button size="sm" variant="ghost" onClick={() => updateBooking(b.id, "cancelled")} className="text-destructive">Cancel</Button>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

const Field = ({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) => (
  <div className="space-y-2">
    <Label>{label}{required && <span className="text-destructive">*</span>}</Label>
    {children}
  </div>
);

export default Admin;