import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Anchor, Calendar, MapPin, Ship, Users, Utensils, Wifi, Sparkles } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

type CruiseRow = {
  id: string;
  name: string;
  ship_name: string | null;
  destination: string;
  description: string | null;
  duration_nights: number;
  price_per_person: number;
  departure_port: string;
  return_port: string;
  route: string[];
  departure_date: string;
  return_date: string;
  capacity: number;
  available_spots: number;
  facilities: string[];
  image_url: string | null;
  gallery: string[];
};

const CABIN_MULT: Record<string, number> = {
  interior: 1,
  oceanview: 1.25,
  balcony: 1.6,
  suite: 2.4,
};

const CruiseDetails = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [cruise, setCruise] = useState<CruiseRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [passengers, setPassengers] = useState(2);
  const [cabin, setCabin] = useState<keyof typeof CABIN_MULT>("interior");
  const [travelDate, setTravelDate] = useState("");
  const [booking, setBooking] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase.from("cruises").select("*").eq("id", id).maybeSingle();
      if (error) toast.error(error.message);
      setCruise(data as CruiseRow | null);
      if (data) setTravelDate((data as CruiseRow).departure_date);
      setLoading(false);
    };
    if (id) load();
  }, [id]);

  if (loading) {
    return (
      <div className="container py-12 space-y-6">
        <Skeleton className="h-96 rounded-2xl" />
        <Skeleton className="h-12 w-2/3" />
        <Skeleton className="h-32" />
      </div>
    );
  }

  if (!cruise) {
    return (
      <div className="container py-24 text-center">
        <h1 className="font-display text-3xl mb-3">Cruise not found</h1>
        <Button asChild><Link to="/">Back to cruises</Link></Button>
      </div>
    );
  }

  const totalPrice = Number(cruise.price_per_person) * passengers * CABIN_MULT[cabin];

  const handleBook = async () => {
    if (!user) {
      navigate(`/auth?mode=signup`);
      return;
    }
    if (passengers > cruise.available_spots) {
      toast.error(`Only ${cruise.available_spots} spots remaining`);
      return;
    }
    setBooking(true);
    const { error } = await supabase.from("bookings").insert({
      user_id: user.id,
      cruise_id: cruise.id,
      passenger_count: passengers,
      cabin_class: cabin,
      travel_date: travelDate,
      total_price: totalPrice,
      contact_email: user.email ?? null,
      status: "confirmed" as const,
    } as never);
    setBooking(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Booking confirmed! Bon voyage 🚢");
    navigate("/bookings");
  };

  return (
    <div>
      {/* Hero */}
      <div className="relative h-[50vh] min-h-[360px] bg-gradient-hero overflow-hidden">
        {cruise.image_url ? (
          <img src={cruise.image_url} alt={cruise.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Ship className="size-24 text-primary-foreground/30" strokeWidth={1} />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 container pb-8">
          <div className="inline-flex items-center gap-1.5 bg-background/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium mb-3">
            <MapPin className="size-3.5" /> {cruise.destination}
          </div>
          <h1 className="font-display text-4xl md:text-6xl text-balance max-w-3xl">{cruise.name}</h1>
          {cruise.ship_name && (
            <p className="text-muted-foreground mt-2 flex items-center gap-1.5">
              <Ship className="size-4" /> Aboard the {cruise.ship_name}
            </p>
          )}
        </div>
      </div>

      <div className="container py-12 grid lg:grid-cols-[1fr,420px] gap-10">
        {/* Left: details */}
        <div className="space-y-10">
          {cruise.description && (
            <section>
              <h2 className="font-display text-2xl mb-3">About this voyage</h2>
              <p className="text-foreground/80 leading-relaxed whitespace-pre-line">{cruise.description}</p>
            </section>
          )}

          <section>
            <h2 className="font-display text-2xl mb-4">Route</h2>
            <div className="bg-gradient-card border border-border rounded-2xl p-6 shadow-soft">
              <div className="flex items-center gap-3 flex-wrap">
                <Stop label={cruise.departure_port} highlight />
                {cruise.route.map((stop, i) => (
                  <span key={`stop-${i}`} className="contents">
                    <Wave />
                    <Stop label={stop} />
                  </span>
                ))}
                <Wave />
                <Stop label={cruise.return_port} highlight />
              </div>
            </div>
          </section>

          <section>
            <h2 className="font-display text-2xl mb-4">Schedule</h2>
            <div className="grid sm:grid-cols-3 gap-4">
              <InfoTile icon={Calendar} label="Departs" value={format(new Date(cruise.departure_date), "MMM d, yyyy")} />
              <InfoTile icon={Anchor} label="Returns" value={format(new Date(cruise.return_date), "MMM d, yyyy")} />
              <InfoTile icon={Users} label="Available" value={`${cruise.available_spots} / ${cruise.capacity}`} />
            </div>
          </section>

          {cruise.facilities.length > 0 && (
            <section>
              <h2 className="font-display text-2xl mb-4">Onboard facilities</h2>
              <div className="grid sm:grid-cols-2 gap-3">
                {cruise.facilities.map((f) => (
                  <div key={f} className="flex items-center gap-3 bg-gradient-card border border-border rounded-xl p-4">
                    <div className="size-9 rounded-full bg-primary/10 flex items-center justify-center">
                      <Sparkles className="size-4 text-primary" />
                    </div>
                    <span className="text-sm font-medium">{f}</span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Right: booking card */}
        <aside className="lg:sticky lg:top-24 self-start">
          <div className="bg-gradient-card border border-border rounded-2xl p-6 shadow-elegant">
            <div className="flex items-baseline gap-2 mb-1">
              <span className="font-display text-4xl text-primary">${Number(cruise.price_per_person).toLocaleString()}</span>
              <span className="text-sm text-muted-foreground">/ person</span>
            </div>
            <p className="text-xs text-muted-foreground mb-6">Interior cabin base rate · {cruise.duration_nights} nights</p>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="travelDate">Travel date</Label>
                <Input
                  id="travelDate"
                  type="date"
                  value={travelDate}
                  min={cruise.departure_date}
                  onChange={(e) => setTravelDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="passengers">Passengers</Label>
                <Input
                  id="passengers"
                  type="number"
                  min={1}
                  max={Math.max(cruise.available_spots, 1)}
                  value={passengers}
                  onChange={(e) => setPassengers(Math.max(1, parseInt(e.target.value) || 1))}
                />
              </div>
              <div className="space-y-2">
                <Label>Cabin class</Label>
                <Select value={cabin} onValueChange={(v) => setCabin(v as keyof typeof CABIN_MULT)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="interior">Interior</SelectItem>
                    <SelectItem value="oceanview">Ocean View (+25%)</SelectItem>
                    <SelectItem value="balcony">Balcony (+60%)</SelectItem>
                    <SelectItem value="suite">Suite (+140%)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-border">
                <span className="text-sm text-muted-foreground">Total</span>
                <span className="font-display text-2xl">${totalPrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
              </div>

              <Button
                variant="hero"
                size="lg"
                className="w-full"
                onClick={handleBook}
                disabled={booking || cruise.available_spots === 0}
              >
                {cruise.available_spots === 0 ? "Sold out" : booking ? "Booking..." : user ? "Book this voyage" : "Sign in to book"}
              </Button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

const Stop = ({ label, highlight }: { label: string; highlight?: boolean }) => (
  <div
    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
      highlight ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
    }`}
  >
    <MapPin className="size-3.5" /> {label}
  </div>
);

const Wave = () => (
  <svg className="text-primary/40" width="28" height="8" viewBox="0 0 28 8" fill="none">
    <path d="M1 4 Q 7 0 14 4 T 27 4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
  </svg>
);

const InfoTile = ({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) => (
  <div className="bg-gradient-card border border-border rounded-xl p-4">
    <Icon className="size-4 text-primary mb-2" />
    <p className="text-xs text-muted-foreground mb-1">{label}</p>
    <p className="font-medium">{value}</p>
  </div>
);

export default CruiseDetails;