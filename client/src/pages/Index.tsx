import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import CruiseCard, { Cruise } from "@/components/CruiseCard";
import { Button } from "@/components/ui/button";
import { Anchor, Compass, ShieldCheck, Sparkles } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import axios from "axios";

const Index = () => {
  const [cruises, setCruises] = useState<Cruise[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/cruises");
        setCruises(res.data ?? []);
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    };

    load();
  }, []);

  return (
    <div>
      {/* HERO */}
      <section className="relative bg-gradient-hero overflow-hidden">
        <div className="absolute inset-0 opacity-30 bg-[radial-gradient(ellipse_at_top_right,_white_0%,_transparent_50%)]" />
        <div className="absolute -bottom-px left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent" />
        <div className="container relative py-20 md:py-32 lg:py-40">
          <div className="max-w-3xl text-primary-foreground animate-fade-in">
            <div className="inline-flex items-center gap-2 bg-primary-foreground/10 backdrop-blur-sm border border-primary-foreground/20 rounded-full px-4 py-1.5 text-sm mb-6">
              <Sparkles className="size-3.5" /> Curated voyages, effortless booking
            </div>
            <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl leading-[1.05] text-balance mb-6">
              Sail somewhere<br />
              <span className="italic text-primary-foreground/90">unforgettable.</span>
            </h1>
            <p className="text-primary-foreground/80 text-lg md:text-xl max-w-xl mb-8">
              Modern coastal voyages, premium cabins, and routes designed for the curious traveler.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button variant="accent" size="xl" asChild>
                <a href="#cruises">Browse cruises</a>
              </Button>
              <Button
                size="xl"
                variant="outline"
                className="bg-transparent text-primary-foreground border-primary-foreground/30 hover:bg-primary-foreground/10 hover:text-primary-foreground"
                asChild
              >
                <Link to="/auth?mode=signup">Get started</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="container py-16 md:py-20">
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { icon: Compass, title: "Curated routes", body: "Hand-picked itineraries across the world's most beautiful coastlines." },
            { icon: ShieldCheck, title: "Confirmed instantly", body: "Real-time availability, secure booking, instant confirmation." },
            { icon: Anchor, title: "Premium ships", body: "Modern vessels with thoughtful amenities and refined cabins." },
          ].map(({ icon: Icon, title, body }) => (
            <div key={title} className="bg-gradient-card border border-border rounded-2xl p-6 shadow-soft">
              <div className="size-11 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Icon className="size-5 text-primary" />
              </div>
              <h3 className="font-display text-xl mb-1">{title}</h3>
              <p className="text-sm text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CRUISES */}
      <section id="cruises" className="container pb-24">
        <div className="flex items-end justify-between mb-8 gap-4 flex-wrap">
          <div>
            <p className="text-sm text-primary font-medium mb-2 uppercase tracking-wider">Set sail</p>
            <h2 className="font-display text-4xl md:text-5xl">Upcoming voyages</h2>
          </div>
          <p className="text-muted-foreground max-w-md text-sm">
            Browse our active cruise schedule. Click any voyage for full route, cabin classes, and booking.
          </p>
        </div>

        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-96 rounded-2xl" />
            ))}
          </div>
        ) : cruises.length === 0 ? (
          <div className="text-center py-20 bg-gradient-card rounded-2xl border border-border">
            <Anchor className="size-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-display text-2xl mb-2">No cruises yet</h3>
            <p className="text-muted-foreground mb-6">
              An admin needs to add cruises before voyagers can book.
            </p>
            <Button asChild variant="hero">
              <Link to="/admin">Go to admin panel</Link>
            </Button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {cruises.map((c: any) => (
              <CruiseCard
                key={c._id}
                cruise={{
                  ...c,
                  id: c._id, // ✅ ADD THIS LINE
                }}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Index;