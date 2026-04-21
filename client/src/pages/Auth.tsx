import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Anchor } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

const authSchema = z.object({
  email: z.string().trim().email("Invalid email").max(255),
  password: z.string().min(6, "Password must be at least 6 characters").max(72),
  displayName: z.string().trim().min(1, "Name required").max(80).optional(),
});

const Auth = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { user, login, register } = useAuth();

  const [mode, setMode] = useState<"signin" | "signup">(
    params.get("mode") === "signup" ? "signup" : "signin"
  );

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);

  // 🔹 Redirect if already logged in
  useEffect(() => {
    if (user) navigate("/");
  }, [user, navigate]);

  // 🔹 Submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const parsed = authSchema.safeParse({
      email,
      password,
      displayName: mode === "signup" ? displayName : undefined,
    });

    if (!parsed.success) {
      toast.error(parsed.error.errors[0].message);
      return;
    }

    setLoading(true);

    try {
      if (mode === "signup") {
        await register(displayName, email, password);
        toast.success("Account created! Please sign in.");
        setMode("signin"); // 👈 switch UI to login
      } else {
        await login(email, password);
        toast.success("Welcome back!");

      }


    } catch (err: any) {
      const msg = err?.response?.data?.msg || "Authentication failed";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] grid lg:grid-cols-2">
      {/* LEFT SIDE */}
      <div className="hidden lg:flex bg-gradient-hero relative overflow-hidden items-center justify-center p-12">
        <div className="absolute inset-0 opacity-30 bg-[radial-gradient(ellipse_at_top,_white_0%,_transparent_60%)]" />
        <div className="relative max-w-md text-primary-foreground space-y-6 animate-fade-in">
          <Anchor className="size-12" strokeWidth={1.5} />
          <h1 className="font-display text-5xl leading-tight">
            Your next horizon awaits.
          </h1>
          <p className="text-primary-foreground/80 text-lg">
            Discover beautiful cruise journeys around the world.
          </p>
        </div>
      </div>

      {/* RIGHT SIDE */}
      <div className="flex items-center justify-center p-6 sm:p-12 bg-gradient-sea">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8 flex justify-center">
            <div className="size-14 rounded-full bg-gradient-hero flex items-center justify-center shadow-elegant">
              <Anchor className="size-6 text-primary-foreground" />
            </div>
          </div>

          <h2 className="font-display text-4xl mb-2">
            {mode === "signup" ? "Create account" : "Welcome back"}
          </h2>

          <p className="text-muted-foreground mb-8">
            {mode === "signup"
              ? "Start your journey."
              : "Sign in to continue."}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <div className="space-y-2">
                <Label htmlFor="displayName">Full name</Label>
                <Input
                  id="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Jane Doe"
                  required
                />
              </div>
            )}

            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Password</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading
                ? "Please wait..."
                : mode === "signup"
                  ? "Create account"
                  : "Sign in"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {mode === "signup"
              ? "Already have an account?"
              : "New here?"}{" "}
            <button
              onClick={() =>
                setMode(mode === "signup" ? "signin" : "signup")
              }
              className="text-primary font-medium hover:underline"
            >
              {mode === "signup" ? "Sign in" : "Create one"}
            </button>
          </p>

          <Link
            to="/"
            className="block mt-8 text-center text-sm text-muted-foreground hover:text-primary"
          >
            ← Back to cruises
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Auth;