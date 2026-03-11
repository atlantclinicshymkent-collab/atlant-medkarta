-- ============================================
-- Atlant Clinic МедКарта — Database Schema
-- Run this in Supabase SQL Editor
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── PROFILES (extends Supabase auth.users) ───
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT DEFAULT 'doctor' CHECK (role IN ('admin', 'doctor')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, role)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), 'doctor');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ─── DOCTORS ───
CREATE TABLE doctors (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  specialization TEXT,
  phone TEXT,
  email TEXT,
  schedule TEXT[] DEFAULT '{}',
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── PATIENTS ───
CREATE TABLE patients (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  last_name TEXT NOT NULL,
  first_name TEXT NOT NULL,
  patronymic TEXT DEFAULT '',
  dob DATE,
  phone TEXT,
  diagnosis TEXT,
  doctor TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'discharged', 'referred')),
  last_visit DATE,
  notes TEXT DEFAULT '',
  next_visit_date DATE,
  next_visit_note TEXT DEFAULT '',
  admission_date DATE,
  passport_series TEXT DEFAULT '',
  passport_number TEXT DEFAULT '',
  passport_issued TEXT DEFAULT '',
  iin TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── APPOINTMENTS ───
CREATE TABLE appointments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  doctor TEXT NOT NULL,
  date DATE NOT NULL,
  time TEXT,
  type TEXT DEFAULT 'Первичний прийом',
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'done', 'cancelled', 'missed')),
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── PROCEDURE CATALOG ───
CREATE TABLE procedure_catalog (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT DEFAULT 'Інше',
  icon TEXT DEFAULT '📋',
  color TEXT DEFAULT '#64748b',
  default_sessions INT DEFAULT 5,
  price INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── PROTOCOLS ───
CREATE TABLE protocols (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  procedures JSONB DEFAULT '[]',
  start_date DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused')),
  doctor TEXT,
  diagnosis TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── PODIATECH ───
CREATE TABLE podiatech (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  date DATE,
  foot_type TEXT,
  hallux_valgus BOOLEAN DEFAULT FALSE,
  arch_index TEXT,
  pressure_notes TEXT DEFAULT '',
  insole_status TEXT DEFAULT 'ordered' CHECK (insole_status IN ('ordered', 'production', 'ready', 'delivered')),
  insole_delivery_date DATE,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── INSOLE STOCK ───
CREATE TABLE insole_stock (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  type TEXT NOT NULL,
  size INT NOT NULL,
  cost INT DEFAULT 0,
  price INT DEFAULT 0,
  qty INT DEFAULT 0,
  notes TEXT DEFAULT '',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── INSOLE STOCK LOG ───
CREATE TABLE insole_stock_log (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  date DATE DEFAULT CURRENT_DATE,
  op_type TEXT NOT NULL CHECK (op_type IN ('in', 'out')),
  insole_type TEXT NOT NULL,
  size INT NOT NULL,
  qty INT NOT NULL,
  cost INT DEFAULT 0,
  price INT DEFAULT 0,
  patient_id UUID REFERENCES patients(id) ON DELETE SET NULL,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── ROW LEVEL SECURITY ───
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE procedure_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE protocols ENABLE ROW LEVEL SECURITY;
ALTER TABLE podiatech ENABLE ROW LEVEL SECURITY;
ALTER TABLE insole_stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE insole_stock_log ENABLE ROW LEVEL SECURITY;

-- Policies: all authenticated users can read; admins can write everything
-- Doctors can read all, write their own data

CREATE POLICY "Authenticated can read profiles" ON profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE POLICY "Authenticated can read doctors" ON doctors FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can manage doctors" ON doctors FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated can read patients" ON patients FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can manage patients" ON patients FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated can read appointments" ON appointments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can manage appointments" ON appointments FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated can read procedure_catalog" ON procedure_catalog FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can manage procedure_catalog" ON procedure_catalog FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated can read protocols" ON protocols FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can manage protocols" ON protocols FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated can read podiatech" ON podiatech FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can manage podiatech" ON podiatech FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated can read insole_stock" ON insole_stock FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can manage insole_stock" ON insole_stock FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated can read insole_stock_log" ON insole_stock_log FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can manage insole_stock_log" ON insole_stock_log FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ─── INDEXES ───
CREATE INDEX idx_patients_doctor ON patients(doctor);
CREATE INDEX idx_patients_status ON patients(status);
CREATE INDEX idx_appointments_date ON appointments(date);
CREATE INDEX idx_appointments_doctor ON appointments(doctor);
CREATE INDEX idx_appointments_patient ON appointments(patient_id);
CREATE INDEX idx_protocols_patient ON protocols(patient_id);
CREATE INDEX idx_podiatech_patient ON podiatech(patient_id);

-- ─── INSERT DEFAULT PROCEDURES ───
INSERT INTO procedure_catalog (name, category, icon, color, default_sessions, price) VALUES
  ('TEKAR-терапія', 'Фізіотерапія', '⚡', '#8b5cf6', 10, 8000),
  ('SIS-терапія', 'Фізіотерапія', '🔬', '#06b6d4', 8, 7000),
  ('УХТ (ударно-хвильова)', 'Фізіотерапія', '💥', '#f97316', 5, 6000),
  ('Ультразвук', 'Фізіотерапія', '🔊', '#3b82f6', 10, 3000),
  ('Карбокситерапія', 'Ін''єкції', '💨', '#10b981', 6, 5000),
  ('Електрофізіопроцедура', 'Фізіотерапія', '⚙️', '#64748b', 10, 3500),
  ('Комп. витягування хребта', 'Мануальна', '🦴', '#a855f7', 10, 5000),
  ('Мануальна терапія', 'Мануальна', '🤲', '#ec4899', 8, 7000),
  ('Внутрішньосуглобова ін''єкція (УЗД)', 'Ін''єкції', '💉', '#ef4444', 3, 15000),
  ('PRP-терапія', 'Ін''єкції', '🩸', '#dc2626', 3, 25000),
  ('Блокада', 'Ін''єкції', '🎯', '#f59e0b', 1, 10000),
  ('Фармакотерапія', 'Медикаменти', '💊', '#2563eb', 1, 0),
  ('УЗД черевної порожнини', 'Діагностика', '🔬', '#0e7c6b', 1, 8000),
  ('УЗД нирок та сечостатевої системи', 'Діагностика', '🔬', '#0e7c6b', 1, 6000),
  ('УЗД щитовидної залози', 'Діагностика', '🔬', '#0e7c6b', 1, 5000),
  ('УЗД суглобів', 'Діагностика', '🔬', '#0e7c6b', 1, 6000),
  ('УЗД м''яких тканин', 'Діагностика', '🔬', '#06b6d4', 1, 5000),
  ('УЗД хребта', 'Діагностика', '🔬', '#06b6d4', 1, 7000),
  ('УЗД судин (доплер)', 'Діагностика', '🔬', '#7c3aed', 1, 8000),
  ('УЗД молочних залоз', 'Діагностика', '🔬', '#ec4899', 1, 5500);

-- ─── INSERT DEFAULT DOCTORS ───
INSERT INTO doctors (name, specialization, phone, email, schedule) VALUES
  ('Андрухів Макар Романович', 'Ортопед', '+77001112233', 'andrukhiv@atlant.kz', ARRAY['Пн','Вт','Ср','Чт','Пт']),
  ('Тлеубергенов Даулет Талгатович', 'Ортопед', '+77002223344', '', ARRAY['Пн','Ср','Пт']),
  ('Караев Алосман Асанович', 'Фізіотерапевт', '+77003334455', '', ARRAY['Вт','Чт','Сб']),
  ('Жанар', 'Реабілітолог', '', '', ARRAY['Пн','Вт','Ср','Чт','Пт']);
