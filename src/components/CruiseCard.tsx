import { Link } from "react-router-dom";
import { Calendar, MapPin, Ship, Users } from "lucide-react";
import { format } from "date-fns";

export interface Cruise {
  id: string;
  name: string;
  ship_name: string | null;
  destination: string;
  duration_nights: number;
  price_per_person: number;
  departure_port: string;
  return_port: string;
  departure_date: string;
  return_date: string;
  available_spots: number;
  capacity: number;
  image_url: string | null;
}

const CruiseCard = ({ cruise }: { cruise: Cruise }) => {
  const sold = cruise.capacity - cruise.available_spots;
  const fillPct = Math.min(100, Math.round((sold / Math.max(cruise.capacity, 1)) * 100));

  return (
    <Link
      to={`/cruises/${cruise.id}`}
      className="group bg-gradient-card rounded-2xl overflow-hidden border border-border hover:border-primary/40 shadow-soft hover:shadow-elegant transition-all duration-500 ease-smooth hover:-translate-y-1 flex flex-col"
    >
      <div className="aspect-[4/3] bg-gradient-hero relative overflow-hidden">
        {cruise.image_url ? (
          <img
            src={cruise.image_url}
            alt={cruise.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-smooth"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Ship className="size-16 text-primary-foreground/40" strokeWidth={1.2} />
          </div>
        )}
        <div className="absolute top-4 left-4 bg-background/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium">
          {cruise.duration_nights} nights
        </div>
        <div className="absolute top-4 right-4 bg-accent text-accent-foreground px-3 py-1 rounded-full text-xs font-semibold">
          ${Number(cruise.price_per_person).toLocaleString()}
        </div>
      </div>

      <div className="p-5 flex-1 flex flex-col">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
          <MapPin className="size-3.5" />
          {cruise.destination}
        </div>
        <h3 className="font-display text-xl mb-1 group-hover:text-primary transition-colors">
          {cruise.name}
        </h3>
        {cruise.ship_name && (
          <p className="text-sm text-muted-foreground mb-4 flex items-center gap-1.5">
            <Ship className="size-3.5" /> {cruise.ship_name}
          </p>
        )}

        <div className="mt-auto space-y-3">
          <div className="flex items-center gap-1.5 text-sm text-foreground/80">
            <Calendar className="size-3.5 text-primary" />
            {format(new Date(cruise.departure_date), "MMM d, yyyy")}
          </div>
          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-muted-foreground flex items-center gap-1">
                <Users className="size-3" /> Availability
              </span>
              <span className="font-medium">{cruise.available_spots} spots left</span>
            </div>
            <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-primary-glow transition-all"
                style={{ width: `${fillPct}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default CruiseCard;