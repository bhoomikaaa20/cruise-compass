import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Anchor, Calendar, MapPin, Ship, Users, X } from "lucide-react";
import { format, isAfter, parseISO } from "date-fns";
import { toast } from "sonner";

type BookingRow = {
  id: string;
  passenger_count: number;
  cabin_class: string;
  travel_date: string;
  total_price: number;
  status: string;
  created_at: string;
  cruises: {
    id: string;
    name: string;
    destination: string;
    image_url: string | null;
    departure_port: string;
    return_port: string;
    duration_nights: number;
  } | null;
};

const MyBookings = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select("*, cruises(id, name, destination, image_url, departure_port, return_port, duration_nights)")
        .order("travel_date", { ascending: true });
      if (error) toast.error(error.message);
      setBookings((data as unknown as BookingRow[]) ?? []);
      setLoading(false);
    };
    load();
  }, [user]);

  const cancel = async (id: string) => {
    const { error } = await supabase.from("bookings").update({ status: "cancelled" }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Booking cancelled");
    setBookings((b) => b.map((x) => (x.id === id ? { ...x, status: "cancelled" } : x)));
  };

  const upcoming = bookings.filter((b) => b.status !== "cancelled" && isAfter(parseISO(b.travel_date), new Date()));
  const past = bookings.filter((b) => !upcoming.includes(b));

  return (
    <div className="container py-12">
      <div className="mb-10">
        <p className="text-sm text-primary font-medium mb-2 uppercase tracking-wider">Your account</p>
        <h1 className="font-display text-4xl md:text-5xl">My Bookings</h1>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => <Skeleton key={i} className="h-40 rounded-2xl" />)}
        </div>
      ) : bookings.length === 0 ? (
        <div className="text-center py-20 bg-gradient-card rounded-2xl border border-border">
          <Anchor className="size-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-display text-2xl mb-2">No bookings yet</h3>
          <p className="text-muted-foreground mb-6">Time to plan your first voyage.</p>
          <Button variant="hero" asChild><Link to="/">Browse cruises</Link></Button>
        </div>
      ) : (
        <div className="space-y-10">
          {upcoming.length > 0 && (
            <Section title="Upcoming voyages" bookings={upcoming} onCancel={cancel} />
          )}
          {past.length > 0 && (
            <Section title="Past & cancelled" bookings={past} onCancel={cancel} muted />
          )}
        </div>
      )}
    </div>
  );
};

const Section = ({
  title,
  bookings,
  onCancel,
  muted,
}: {
  title: string;
  bookings: BookingRow[];
  onCancel: (id: string) => void;
  muted?: boolean;
}) => (
  <section>
    <h2 className="font-display text-2xl mb-4">{title}</h2>
    <div className="space-y-4">
      {bookings.map((b) => (
        <div
          key={b.id}
          className={`bg-gradient-card border border-border rounded-2xl p-5 shadow-soft flex flex-col sm:flex-row gap-5 ${
            muted ? "opacity-70" : ""
          }`}
        >
          <div className="sm:w-40 h-32 sm:h-auto bg-gradient-hero rounded-xl overflow-hidden flex-shrink-0">
            {b.cruises?.image_url ? (
              <img src={b.cruises.image_url} alt={b.cruises.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Ship className="size-10 text-primary-foreground/40" />
              </div>
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <h3 className="font-display text-xl">{b.cruises?.name}</h3>
                <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                  <MapPin className="size-3.5" /> {b.cruises?.destination}
                </p>
              </div>
              <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                b.status === "confirmed" ? "bg-primary/10 text-primary"
                : b.status === "cancelled" ? "bg-destructive/10 text-destructive"
                : "bg-accent/20 text-accent-foreground"
              }`}>
                {b.status}
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 text-sm">
              <Detail icon={Calendar} label="Travel date" value={format(parseISO(b.travel_date), "MMM d, yyyy")} />
              <Detail icon={Users} label="Passengers" value={String(b.passenger_count)} />
              <Detail icon={Ship} label="Cabin" value={b.cabin_class} />
              <Detail icon={Anchor} label="Total" value={`$${Number(b.total_price).toLocaleString()}`} />
            </div>
          </div>
          {b.status === "confirmed" && !muted && (
            <Button variant="ghost" size="sm" onClick={() => onCancel(b.id)} className="self-start text-destructive hover:text-destructive">
              <X className="size-4" /> Cancel
            </Button>
          )}
        </div>
      ))}
    </div>
  </section>
);

const Detail = ({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) => (
  <div>
    <p className="text-xs text-muted-foreground flex items-center gap-1"><Icon className="size-3" /> {label}</p>
    <p className="font-medium capitalize">{value}</p>
  </div>
);

export default MyBookings;