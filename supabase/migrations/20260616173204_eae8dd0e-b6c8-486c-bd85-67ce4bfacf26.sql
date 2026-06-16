
-- Roles
CREATE TYPE public.app_role AS ENUM ('doctor', 'patient');

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- Profiles policies
CREATE POLICY "Users view own profile" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = id OR public.has_role(auth.uid(), 'doctor'));
CREATE POLICY "Users update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- user_roles policies
CREATE POLICY "Users view own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'doctor'));

-- Auto-create profile + assign patient role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), NEW.email)
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'patient')
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Rubrics (doctor-uploaded reference documents)
CREATE TABLE public.rubrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  uploaded_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  storage_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  extracted_text TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rubrics TO authenticated;
GRANT ALL ON public.rubrics TO service_role;
ALTER TABLE public.rubrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Doctors manage rubrics" ON public.rubrics
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'doctor'))
  WITH CHECK (public.has_role(auth.uid(), 'doctor'));

-- Meals
CREATE TABLE public.meals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  meal_label TEXT,
  patient_notes TEXT,
  doctor_notes TEXT,
  analysis JSONB,
  status TEXT NOT NULL DEFAULT 'pending',
  eaten_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.meals TO authenticated;
GRANT ALL ON public.meals TO service_role;
ALTER TABLE public.meals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Patients view own meals" ON public.meals
  FOR SELECT TO authenticated USING (auth.uid() = patient_id OR public.has_role(auth.uid(), 'doctor'));
CREATE POLICY "Patients insert own meals" ON public.meals
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = patient_id);
CREATE POLICY "Patients update own meals" ON public.meals
  FOR UPDATE TO authenticated USING (auth.uid() = patient_id OR public.has_role(auth.uid(), 'doctor'));
CREATE POLICY "Patients delete own meals" ON public.meals
  FOR DELETE TO authenticated USING (auth.uid() = patient_id OR public.has_role(auth.uid(), 'doctor'));

-- Storage policies
-- meal-photos: patients upload/read own folder; doctors read all
CREATE POLICY "Patients read own meal photos" ON storage.objects
  FOR SELECT TO authenticated USING (
    bucket_id = 'meal-photos' AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR public.has_role(auth.uid(), 'doctor')
    )
  );
CREATE POLICY "Patients upload own meal photos" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (
    bucket_id = 'meal-photos' AND (storage.foldername(name))[1] = auth.uid()::text
  );
CREATE POLICY "Patients delete own meal photos" ON storage.objects
  FOR DELETE TO authenticated USING (
    bucket_id = 'meal-photos' AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR public.has_role(auth.uid(), 'doctor')
    )
  );

-- rubrics: only doctors
CREATE POLICY "Doctors manage rubric files" ON storage.objects
  FOR ALL TO authenticated USING (
    bucket_id = 'rubrics' AND public.has_role(auth.uid(), 'doctor')
  ) WITH CHECK (
    bucket_id = 'rubrics' AND public.has_role(auth.uid(), 'doctor')
  );
