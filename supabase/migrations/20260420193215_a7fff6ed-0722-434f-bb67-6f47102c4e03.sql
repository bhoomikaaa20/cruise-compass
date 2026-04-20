-- ROLES ENUM AND TABLE
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer role check
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- PROFILES
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles viewable by owner"
  ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- Updated at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile + default role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    NEW.email
  );
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- CRUISES
CREATE TABLE public.cruises (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  ship_name TEXT,
  destination TEXT NOT NULL,
  description TEXT,
  duration_nights INT NOT NULL DEFAULT 7,
  price_per_person NUMERIC(10,2) NOT NULL,
  departure_port TEXT NOT NULL,
  return_port TEXT NOT NULL,
  route TEXT[] NOT NULL DEFAULT '{}',
  departure_date DATE NOT NULL,
  return_date DATE NOT NULL,
  capacity INT NOT NULL DEFAULT 100,
  available_spots INT NOT NULL DEFAULT 100,
  facilities TEXT[] NOT NULL DEFAULT '{}',
  image_url TEXT,
  gallery TEXT[] NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.cruises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Cruises are viewable by everyone"
  ON public.cruises FOR SELECT USING (true);
CREATE POLICY "Admins can insert cruises"
  ON public.cruises FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update cruises"
  ON public.cruises FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete cruises"
  ON public.cruises FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_cruises_updated_at
  BEFORE UPDATE ON public.cruises
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- BOOKINGS
CREATE TYPE public.booking_status AS ENUM ('pending', 'confirmed', 'cancelled');
CREATE TYPE public.cabin_class AS ENUM ('interior', 'oceanview', 'balcony', 'suite');

CREATE TABLE public.bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cruise_id UUID NOT NULL REFERENCES public.cruises(id) ON DELETE CASCADE,
  passenger_count INT NOT NULL DEFAULT 1 CHECK (passenger_count > 0),
  cabin_class cabin_class NOT NULL DEFAULT 'interior',
  travel_date DATE NOT NULL,
  total_price NUMERIC(10,2) NOT NULL,
  status booking_status NOT NULL DEFAULT 'confirmed',
  contact_email TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own bookings"
  ON public.bookings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins view all bookings"
  ON public.bookings FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users create own bookings"
  ON public.bookings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users cancel own bookings"
  ON public.bookings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins manage all bookings"
  ON public.bookings FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Decrement available spots when booking created
CREATE OR REPLACE FUNCTION public.decrement_cruise_spots()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status <> 'cancelled' THEN
    UPDATE public.cruises
    SET available_spots = GREATEST(available_spots - NEW.passenger_count, 0)
    WHERE id = NEW.cruise_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_booking_created
  AFTER INSERT ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.decrement_cruise_spots();

-- Restore spots when booking cancelled
CREATE OR REPLACE FUNCTION public.restore_cruise_spots_on_cancel()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.status <> 'cancelled' AND NEW.status = 'cancelled' THEN
    UPDATE public.cruises
    SET available_spots = available_spots + OLD.passenger_count
    WHERE id = NEW.cruise_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_booking_cancelled
  AFTER UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.restore_cruise_spots_on_cancel();

-- STORAGE BUCKET for cruise images
INSERT INTO storage.buckets (id, name, public)
VALUES ('cruise-images', 'cruise-images', true);

CREATE POLICY "Cruise images are publicly viewable"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'cruise-images');

CREATE POLICY "Admins can upload cruise images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'cruise-images' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update cruise images"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'cruise-images' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete cruise images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'cruise-images' AND public.has_role(auth.uid(), 'admin'));