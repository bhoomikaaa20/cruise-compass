import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Anchor, LogOut, Menu, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const Layout = () => {
  const { user, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const navLink = ({ isActive }: { isActive: boolean }) =>
    cn(
      "text-sm font-medium transition-colors hover:text-primary",
      isActive ? "text-primary" : "text-foreground/70"
    );

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="sticky top-0 z-50 glass">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="size-9 rounded-full bg-gradient-hero flex items-center justify-center shadow-soft group-hover:shadow-glow transition-smooth">
              <Anchor className="size-4 text-primary-foreground" strokeWidth={2.5} />
            </div>
            <span className="font-display text-2xl tracking-tight">Marea</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <NavLink to="/" end className={navLink}>Cruises</NavLink>
            {user && (
              <NavLink to="/bookings" className={navLink}>
                {isAdmin ? "All Bookings" : "My Bookings"}
              </NavLink>
            )}
            {isAdmin && <NavLink to="/admin" className={navLink}>Admin</NavLink>}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                <LogOut className="size-4" /> Sign out
              </Button>
            ) : (
              <>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/auth">Sign in</Link>
                </Button>
                <Button variant="hero" size="sm" asChild>
                  <Link to="/auth?mode=signup">Get started</Link>
                </Button>
              </>
            )}
          </div>

          <button className="md:hidden" onClick={() => setOpen(!open)} aria-label="Menu">
            {open ? <X className="size-6" /> : <Menu className="size-6" />}
          </button>
        </div>

        {open && (
          <div className="md:hidden border-t border-border bg-background">
            <div className="container py-4 flex flex-col gap-4">
              <NavLink to="/" end className={navLink} onClick={() => setOpen(false)}>Cruises</NavLink>
              {user && <NavLink to="/bookings" className={navLink} onClick={() => setOpen(false)}>My Bookings</NavLink>}
              {isAdmin && <NavLink to="/admin" className={navLink} onClick={() => setOpen(false)}>Admin</NavLink>}
              <div className="flex gap-2 pt-2 border-t border-border">
                {user ? (
                  <Button variant="outline" size="sm" onClick={handleSignOut} className="w-full">
                    Sign out
                  </Button>
                ) : (
                  <>
                    <Button variant="outline" size="sm" asChild className="flex-1">
                      <Link to="/auth" onClick={() => setOpen(false)}>Sign in</Link>
                    </Button>
                    <Button variant="hero" size="sm" asChild className="flex-1">
                      <Link to="/auth?mode=signup" onClick={() => setOpen(false)}>Sign up</Link>
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-border bg-secondary/30 mt-20">
        <div className="container py-12 grid gap-8 md:grid-cols-3">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="size-8 rounded-full bg-gradient-hero flex items-center justify-center">
                <Anchor className="size-4 text-primary-foreground" />
              </div>
              <span className="font-display text-xl">Marea</span>
            </div>
            <p className="text-sm text-muted-foreground max-w-xs">
              Curated cruise voyages for the modern traveler.
            </p>
          </div>

          <div>
            <h4 className="font-display text-base mb-3">Explore</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/" className="hover:text-primary">All Cruises</Link></li>
              {user && <li><Link to="/bookings" className="hover:text-primary">My Bookings</Link></li>}
            </ul>
          </div>

          {/* ✅ ONLY THIS PART UPDATED */}
          <div>
            <h4 className="font-display text-base mb-3">Set sail</h4>

            <p className="text-sm text-muted-foreground mb-2">
              📍 London, United Kingdom
            </p>

            <p className="text-sm text-muted-foreground mb-2">
              📞 +44 20 7946 0958
            </p>

            <p className="text-sm text-muted-foreground mb-3">
              ✉️ support@mareacruises.com
            </p>

            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Marea Cruises. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;