import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Anchor, Calendar, MapPin, Ship, Users, X } from "lucide-react";
import { format, isAfter, parseISO } from "date-fns";
import { toast } from "sonner";
import axios from "axios";

type BookingRow = any;

const MyBookings = () => {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;

    const load = async () => {
      try {
        const token = localStorage.getItem("token");

        const url = isAdmin
          ? "http://localhost:5000/api/admin/bookings"
          : "http://localhost:5000/api/bookings/my";

        const res = await axios.get(url, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setBookings(res.data ?? []);
      } catch {
        toast.error("Failed to load bookings");
      }

      setLoading(false);
    };

    load();
  }, [user, isAdmin]);

  const cancel = async (id: string) => {
    try {
      const token = localStorage.getItem("token");

      await axios.put(
        `http://localhost:5000/api/bookings/${id}/cancel`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      toast.success("Booking cancelled");

      setBookings((b) =>
        b.map((x) =>
          x._id === id ? { ...x, status: "cancelled" } : x
        )
      );
    } catch {
      toast.error("Cancel failed");
    }
  };

  const deleteBooking = async (id: string) => {
    try {
      const token = localStorage.getItem("token");

      await axios.delete(`http://localhost:5000/api/admin/bookings/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success("Booking deleted");

      setBookings((b) => b.filter((x) => x._id !== id));
    } catch {
      toast.error("Delete failed");
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      const token = localStorage.getItem("token");

      await axios.put(
        `http://localhost:5000/api/admin/bookings/${id}`,
        { status },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      toast.success("Status updated");

      setBookings((b) =>
        b.map((x) =>
          x._id === id ? { ...x, status } : x
        )
      );
    } catch {
      toast.error("Update failed");
    }
  };

  const upcoming = bookings.filter(
    (b) =>
      b.status !== "cancelled" &&
      isAfter(parseISO(b.travel_date), new Date())
  );

  const past = bookings.filter((b) => !upcoming.includes(b));

  return (
    <div className="container py-12">
      <div className="mb-10">
        <p className="text-sm text-primary font-medium mb-2 uppercase tracking-wider">
          Your account
        </p>

        <h1 className="font-display text-4xl md:text-5xl">
          {isAdmin ? "All Bookings" : "My Bookings"}
        </h1>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-40 rounded-2xl" />
          ))}
        </div>
      ) : bookings.length === 0 ? (
        <div className="text-center py-20 bg-gradient-card rounded-2xl border border-border">
          <Anchor className="size-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-display text-2xl mb-2">
            {isAdmin ? "No bookings found" : "No bookings yet"}
          </h3>
          <p className="text-muted-foreground mb-6">
            {isAdmin
              ? "No users have booked yet."
              : "Time to plan your first voyage."}
          </p>

          {!isAdmin && (
            <Button variant="hero" asChild>
              <Link to="/">Browse cruises</Link>
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-10">
          {upcoming.length > 0 && (
            <Section
              title="Upcoming voyages"
              bookings={upcoming}
              onCancel={cancel}
              isAdmin={isAdmin}
              updateStatus={updateStatus}       // ✅ FIX
              deleteBooking={deleteBooking}     // ✅ FIX
            />
          )}
          {past.length > 0 && (
            <Section
              title="Past & cancelled"
              bookings={past}
              onCancel={cancel}
              muted
              isAdmin={isAdmin}
              updateStatus={updateStatus}       // ✅ FIX
              deleteBooking={deleteBooking}     // ✅ FIX
            />
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
  isAdmin,
  updateStatus,
  deleteBooking,
}: {
  title: string;
  bookings: BookingRow[];
  onCancel: (id: string) => void;
  muted?: boolean;
  isAdmin?: boolean;
  updateStatus: (id: string, status: string) => void;
  deleteBooking: (id: string) => void;
}) => (
  <section>
    <h2 className="font-display text-2xl mb-4">{title}</h2>

    <div className="space-y-4">
      {bookings.map((b) => (
        <div
          key={b._id}
          className={`bg-gradient-card border border-border rounded-2xl p-5 shadow-soft flex flex-col sm:flex-row gap-5 ${muted ? "opacity-70" : ""
            }`}
        >
          {isAdmin && (
            <p className="text-xs text-muted-foreground mb-2">
              👤 {b.user?.name} ({b.user?.email})
            </p>
          )}

          <div className="sm:w-40 h-32 sm:h-auto bg-gradient-hero rounded-xl overflow-hidden flex-shrink-0">
            {b.cruise?.image_url ? (
              <img
                src={b.cruise.image_url}
                alt={b.cruise.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Ship className="size-10 text-primary-foreground/40" />
              </div>
            )}
          </div>

          <div className="flex-1">
            <h3 className="font-display text-xl">{b.cruise?.name}</h3>

            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
              <MapPin className="size-3.5" /> {b.cruise?.destination}
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 text-sm">
              <Detail
                icon={Calendar}
                label="Travel date"
                value={format(parseISO(b.travel_date), "MMM d, yyyy")}
              />
              <Detail
                icon={Users}
                label="Passengers"
                value={String(b.passenger_count)}
              />
              <Detail
                icon={Ship}
                label="Cabin"
                value={b.cabin_class}
              />
              <Detail
                icon={Anchor}
                label="Total"
                value={`$${Number(b.total_price).toLocaleString()}`}
              />
            </div>

            {/* ADMIN BUTTONS (YOUR ORIGINAL UI POSITION) */}
            {isAdmin && (
              <div className="flex gap-2 mt-4">


                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => updateStatus(b._id, "cancelled")}
                >
                  Cancel
                </Button>

                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => deleteBooking(b._id)}
                >
                  Delete
                </Button>
              </div>
            )}
          </div>
          <div className="mt-3">
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold 
    ${b.status === "confirmed"
                  ? "bg-green-100 text-green-700"
                  : b.status === "cancelled"
                    ? "bg-red-100 text-red-700"
                    : "bg-yellow-100 text-yellow-700"
                }`}
            >
              {b.status}
            </span>
          </div>

          {b.status === "confirmed" && !muted && !isAdmin && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onCancel(b._id)}
              className="self-start text-destructive hover:text-destructive"
            >
              <X className="size-4" /> Cancel
            </Button>
          )}
        </div>
      ))}
    </div>
  </section>
);

const Detail = ({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) => (
  <div>
    <p className="text-xs text-muted-foreground flex items-center gap-1">
      <Icon className="size-3" /> {label}
    </p>
    <p className="font-medium capitalize">{value}</p>
  </div>
);

export default MyBookings;