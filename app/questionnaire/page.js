'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

const BODY_ZONES = [
  { id: "neck", label: "Шея", icon: "🦴" },
  { id: "upper_back", label: "Грудной отдел", icon: "🦴" },
  { id: "lower_back", label: "Поясница", icon: "🦴" },
  { id: "shoulder", label: "Плечо", icon: "💪" },
  { id: "elbow", label: "Локоть", icon: "🖐️" },
  { id: "wrist", label: "Кисть / запястье", icon: "🖐️" },
  { id: "hip", label: "Тазобедренный сустав", icon: "🦴" },
  { id: "knee", label: "Колено", icon: "🦵" },
  { id: "ankle", label: "Голеностоп / стопа", icon: "🦶" },
  { id: "other", label: "Другое", icon: "📍" },
];

const CHRONIC_OPTIONS = [
  "Сахарный диабет",
  "Гипертония",
  "Заболевания щитовидной железы",
  "Заболевания ЖКТ",
  "Заболевания сердца",
  "Ревматоидный артрит",
  "Остеопороз",
  "Бронхиальная астма",
  "Аллергические заболевания",
  "Нет хронических заболеваний",
];

const VAS_LABELS = ["Нет боли","Минимальная","Слабая","Умеренная","Средняя","Ощутимая","Сильная","Очень сильная","Интенсивная","Нестерпимая","Максимальная"];
const VAS_COLORS = ["#10b981","#22c55e","#84cc16","#a3e635","#eab308","#f59e0b","#f97316","#ef4444","#dc2626","#b91c1c","#7f1d1d"];

function QuestionnaireContent() {
  const searchParams = useSearchParams();
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    lastName: "",
    firstName: "",
    patronymic: "",
    dob: "",
    phone: searchParams.get("phone") || "",
    zones: [],
    complaints: "",
    painVas: 5,
    painDuration: "",
    painWorse: "",
    chronicDiseases: [],
    chronicOther: "",
    allergies: "",
    medications: "",
    previousTreatment: "",
    surgeries: "",
    occupation: "",
    activityLevel: "",
    expectations: "",
    doctor: searchParams.get("doctor") || "",
    patientId: searchParams.get("pid") || "",
  });

  const [consent, setConsent] = useState(false);

  const s = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const toggleZone = (id) => {
    setForm(prev => ({
      ...prev,
      zones: prev.zones.includes(id) ? prev.zones.filter(z => z !== id) : [...prev.zones, id],
    }));
  };

  const toggleChronic = (item) => {
    if (item === "Нет хронических заболеваний") {
      setForm(prev => ({ ...prev, chronicDiseases: prev.chronicDiseases.includes(item) ? [] : [item] }));
      return;
    }
    setForm(prev => ({
      ...prev,
      chronicDiseases: prev.chronicDiseases.filter(d => d !== "Нет хронических заболеваний").includes(item)
        ? prev.chronicDiseases.filter(d => d !== item)
        : [...prev.chronicDiseases.filter(d => d !== "Нет хронических заболеваний"), item],
    }));
  };

  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitError("");

    // Save to Supabase via API
    try {
      const res = await fetch("/api/questionnaire", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, consent }),
      });
      const data = await res.json();
      if (data.error) {
        setSubmitError("Ошибка сохранения: " + data.error);
        setSubmitting(false);
        return;
      }
    } catch (e) {
      // Fallback: save to localStorage
      try {
        const existing = JSON.parse(localStorage.getItem("mk2_questionnaires") || "[]");
        existing.push({ ...form, consent, submittedAt: new Date().toISOString() });
        localStorage.setItem("mk2_questionnaires", JSON.stringify(existing));
      } catch (e2) { /* ignore */ }
    }

    setSubmitting(false);
    setSubmitted(true);
  };

  const steps = [
    { title: "Согласие", icon: "📋" },
    { title: "Личные данные", icon: "👤" },
    { title: "Что беспокоит", icon: "🩺" },
    { title: "Боль", icon: "📊" },
    { title: "Здоровье", icon: "💊" },
    { title: "Дополнительно", icon: "📋" },
  ];

  const canNext = () => {
    if (step === 0) return consent;
    if (step === 1) return form.lastName.trim() && form.firstName.trim() && form.phone.trim();
    if (step === 2) return form.zones.length > 0;
    return true;
  };

  if (submitted) {
    return (
      <div style={styles.container}>
        <div style={{ ...styles.card, textAlign: "center", padding: "48px 24px" }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>✅</div>
          <div style={{ fontFamily: "'DM Serif Display',serif", fontSize: 24, color: "#042f2e", marginBottom: 12 }}>Спасибо!</div>
          <div style={{ fontSize: 15, color: "#475569", lineHeight: 1.7 }}>
            Ваша анкета получена.<br />
            Врач ознакомится с ней перед приёмом.
          </div>
          <div style={{ marginTop: 24, padding: "16px", background: "#f0fdf4", borderRadius: 12, border: "1px solid #bbf7d0" }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#064e3b" }}>🏥 Atlant Clinic</div>
            <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>ул. Акпан Батыр, 46</div>
            <div style={{ fontSize: 13, color: "#64748b" }}>Ждём Вас на приёме!</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <div style={{ fontSize: 32, marginBottom: 4 }}>🏥</div>
        <div style={{ fontFamily: "'DM Serif Display',serif", fontSize: 22, color: "#042f2e" }}>Atlant Clinic</div>
        <div style={{ fontSize: 13, color: "#64748b", marginTop: 2 }}>Анкета пациента</div>
      </div>

      {/* Progress bar */}
      <div style={{ display: "flex", gap: 4, marginBottom: 20 }}>
        {steps.map((st, i) => (
          <div key={i} style={{ flex: 1, textAlign: "center" }}>
            <div style={{ height: 4, borderRadius: 2, background: i <= step ? "#0e7c6b" : "#e2e8f0", transition: "all .3s" }} />
            <div style={{ fontSize: 10, color: i <= step ? "#0e7c6b" : "#94a3b8", marginTop: 4, fontWeight: i === step ? 700 : 400 }}>{st.icon} {st.title}</div>
          </div>
        ))}
      </div>

      <div style={styles.card}>
        {/* Step 0: Informed Consent */}
        {step === 0 && (
          <div>
            <h2 style={styles.stepTitle}>📋 Информированное согласие</h2>
            <div style={{background:"#f8fafc",border:"1px solid #e2e8f0",borderRadius:12,padding:"16px",marginBottom:16,maxHeight:320,overflowY:"auto",fontSize:13,lineHeight:1.8,color:"#334155"}}>
              <p style={{fontWeight:700,marginBottom:8,fontSize:14,color:"#042f2e"}}>Согласие на обработку персональных данных и медицинское вмешательство</p>
              <p style={{marginBottom:8}}>Я, нижеподписавшийся(аяся), добровольно даю своё согласие на:</p>
              <p style={{marginBottom:6}}>1. <b>Обработку персональных данных</b> — сбор, хранение, использование и передачу моих персональных данных (ФИО, дата рождения, контактный телефон, данные о состоянии здоровья) в целях оказания медицинских услуг в клинике «Atlant Clinic».</p>
              <p style={{marginBottom:6}}>2. <b>Медицинское обследование и лечение</b> — проведение диагностических и лечебных процедур, назначенных лечащим врачом, включая: физиотерапевтические процедуры (TEKAR-терапия, SIS-терапия, УХТ, ультразвук, электрофизиопроцедуры, карбокситерапия), мануальную терапию, компьютерное вытяжение позвоночника, внутрисуставные инъекции под контролем УЗИ, PRP-терапию, медикаментозную терапию.</p>
              <p style={{marginBottom:6}}>3. <b>Информирование о рисках</b> — я осведомлён(а) о том, что любое медицинское вмешательство может сопровождаться рисками, включая: аллергические реакции, временное усиление болевого синдрома, гематомы в месте инъекции, индивидуальные реакции организма.</p>
              <p style={{marginBottom:6}}>4. <b>Конфиденциальность</b> — клиника обязуется соблюдать конфиденциальность моих персональных данных и медицинской информации в соответствии с законодательством Республики Казахстан.</p>
              <p style={{marginBottom:6}}>5. <b>Право на отказ</b> — я имею право отказаться от предложенного лечения на любом этапе, предварительно уведомив лечащего врача.</p>
              <p style={{marginBottom:0}}>6. <b>Достоверность данных</b> — я подтверждаю, что предоставленные мной данные о состоянии здоровья являются достоверными и полными.</p>
            </div>
            <label style={{display:"flex",alignItems:"flex-start",gap:10,cursor:"pointer",padding:"12px 14px",background:consent?"#f0fdf4":"#fff",border:consent?"2px solid #0e7c6b":"1.5px solid #e2e8f0",borderRadius:12,transition:"all .15s"}}>
              <input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)} style={{width:20,height:20,marginTop:2,accentColor:"#0e7c6b",flexShrink:0}}/>
              <span style={{fontSize:14,color:consent?"#064e3b":"#475569",fontWeight:consent?600:400,lineHeight:1.5}}>
                Я ознакомлен(а) с условиями и даю своё согласие на обработку персональных данных и медицинское вмешательство
              </span>
            </label>
          </div>
        )}

        {/* Step 1: Personal data */}
        {step === 1 && (
          <div>
            <h2 style={styles.stepTitle}>👤 Личные данные</h2>
            <div style={styles.field}>
              <label style={styles.label}>Фамилия *</label>
              <input style={styles.input} value={form.lastName} onChange={e => s("lastName", e.target.value)} placeholder="Ахметова" />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Имя *</label>
              <input style={styles.input} value={form.firstName} onChange={e => s("firstName", e.target.value)} placeholder="Айгерим" />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Отчество</label>
              <input style={styles.input} value={form.patronymic} onChange={e => s("patronymic", e.target.value)} placeholder="Болатовна" />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Дата рождения</label>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
                <select style={styles.input} value={form.dob?form.dob.split("-")[2]:""} onChange={e=>{const d=e.target.value;const m=form.dob?form.dob.split("-")[1]:"01";const y=form.dob?form.dob.split("-")[0]:"1990";if(d)s("dob",`${y}-${m}-${d.padStart(2,"0")}`);}}>
                  <option value="">День</option>
                  {Array.from({length:31},(_,i)=>i+1).map(d=><option key={d} value={String(d).padStart(2,"0")}>{d}</option>)}
                </select>
                <select style={styles.input} value={form.dob?form.dob.split("-")[1]:""} onChange={e=>{const m=e.target.value;const d=form.dob?form.dob.split("-")[2]:"01";const y=form.dob?form.dob.split("-")[0]:"1990";if(m)s("dob",`${y}-${m}-${d}`);}}>
                  <option value="">Месяц</option>
                  {["Январь","Февраль","Март","Апрель","Май","Июнь","Июль","Август","Сентябрь","Октябрь","Ноябрь","Декабрь"].map((name,i)=><option key={i} value={String(i+1).padStart(2,"0")}>{name}</option>)}
                </select>
                <select style={styles.input} value={form.dob?form.dob.split("-")[0]:""} onChange={e=>{const y=e.target.value;const m=form.dob?form.dob.split("-")[1]:"01";const d=form.dob?form.dob.split("-")[2]:"01";if(y)s("dob",`${y}-${m}-${d}`);}}>
                  <option value="">Год</option>
                  {Array.from({length:100},(_,i)=>new Date().getFullYear()-i).map(y=><option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Телефон *</label>
              <input style={styles.input} type="tel" value={form.phone} onChange={e => s("phone", e.target.value)} placeholder="+7 701 123 45 67" />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Род занятий</label>
              <input style={styles.input} value={form.occupation} onChange={e => s("occupation", e.target.value)} placeholder="Офисная работа, физический труд..." />
            </div>
          </div>
        )}

        {/* Step 2: What bothers */}
        {step === 2 && (
          <div>
            <h2 style={styles.stepTitle}>🩺 Что беспокоит?</h2>
            <p style={{ fontSize: 13, color: "#64748b", marginBottom: 16 }}>Выберите зоны, которые Вас беспокоят (можно несколько):</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
              {BODY_ZONES.map(z => (
                <button key={z.id} onClick={() => toggleZone(z.id)} style={{
                  padding: "12px", borderRadius: 10, border: form.zones.includes(z.id) ? "2px solid #0e7c6b" : "1.5px solid #e2e8f0",
                  background: form.zones.includes(z.id) ? "#f0fdf4" : "#fff", cursor: "pointer", textAlign: "center",
                  fontFamily: "inherit", fontSize: 13, fontWeight: form.zones.includes(z.id) ? 700 : 400,
                  color: form.zones.includes(z.id) ? "#064e3b" : "#334155", transition: "all .15s",
                }}>
                  <div style={{ fontSize: 24 }}>{z.icon}</div>
                  {z.label}
                </button>
              ))}
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Опишите жалобы подробнее</label>
              <textarea style={{ ...styles.input, minHeight: 80, resize: "vertical" }} value={form.complaints} onChange={e => s("complaints", e.target.value)} placeholder="Боль при движении, онемение, ограничение подвижности..." />
            </div>
          </div>
        )}

        {/* Step 3: Pain */}
        {step === 3 && (
          <div>
            <h2 style={styles.stepTitle}>📊 Оценка боли</h2>
            <div style={{ marginBottom: 20 }}>
              <label style={styles.label}>Шкала боли (VAS) — оцените от 0 до 10</label>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 8 }}>
                <input type="range" min={0} max={10} value={form.painVas} onChange={e => s("painVas", +e.target.value)} style={{ flex: 1, accentColor: VAS_COLORS[form.painVas], height: 10 }} />
                <div style={{ textAlign: "center", minWidth: 48 }}>
                  <div style={{ fontSize: 32, fontWeight: 800, color: VAS_COLORS[form.painVas], lineHeight: 1 }}>{form.painVas}</div>
                  <div style={{ fontSize: 10, color: VAS_COLORS[form.painVas], fontWeight: 600 }}>/10</div>
                </div>
              </div>
              <div style={{ fontSize: 14, color: VAS_COLORS[form.painVas], fontWeight: 600, marginTop: 4 }}>{VAS_LABELS[form.painVas]}</div>
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Как давно беспокоит?</label>
              <select style={styles.input} value={form.painDuration} onChange={e => s("painDuration", e.target.value)}>
                <option value="">— выберите —</option>
                <option value="days">Несколько дней</option>
                <option value="weeks">1–4 недели</option>
                <option value="months">1–6 месяцев</option>
                <option value="half_year">6–12 месяцев</option>
                <option value="years">Более года</option>
                <option value="chronic">Несколько лет (хроническая)</option>
              </select>
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Что усиливает боль?</label>
              <textarea style={{ ...styles.input, minHeight: 60, resize: "vertical" }} value={form.painWorse} onChange={e => s("painWorse", e.target.value)} placeholder="Движение, длительное сидение, нагрузка, холод..." />
            </div>
          </div>
        )}

        {/* Step 4: Health */}
        {step === 4 && (
          <div>
            <h2 style={styles.stepTitle}>💊 Состояние здоровья</h2>
            <div style={{ marginBottom: 16 }}>
              <label style={styles.label}>Хронические заболевания</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6 }}>
                {CHRONIC_OPTIONS.map(opt => (
                  <button key={opt} onClick={() => toggleChronic(opt)} style={{
                    padding: "6px 12px", borderRadius: 20, fontSize: 12, fontWeight: form.chronicDiseases.includes(opt) ? 700 : 400,
                    border: form.chronicDiseases.includes(opt) ? "1.5px solid #0e7c6b" : "1px solid #e2e8f0",
                    background: form.chronicDiseases.includes(opt) ? "#d1fae5" : "#fff",
                    color: form.chronicDiseases.includes(opt) ? "#064e3b" : "#475569",
                    cursor: "pointer", fontFamily: "inherit", transition: "all .15s",
                  }}>{opt}</button>
                ))}
              </div>
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Другие заболевания (если есть)</label>
              <input style={styles.input} value={form.chronicOther} onChange={e => s("chronicOther", e.target.value)} placeholder="Укажите, если не нашли в списке выше" />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Аллергии на лекарства</label>
              <input style={styles.input} value={form.allergies} onChange={e => s("allergies", e.target.value)} placeholder="Нет / Пенициллин, НПВС..." />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Принимаемые препараты</label>
              <input style={styles.input} value={form.medications} onChange={e => s("medications", e.target.value)} placeholder="Нет / Метформин, Ибупрофен..." />
            </div>
          </div>
        )}

        {/* Step 5: Additional */}
        {step === 5 && (
          <div>
            <h2 style={styles.stepTitle}>📋 Дополнительная информация</h2>
            <div style={styles.field}>
              <label style={styles.label}>Проходили ли ранее лечение по данной проблеме?</label>
              <textarea style={{ ...styles.input, minHeight: 60, resize: "vertical" }} value={form.previousTreatment} onChange={e => s("previousTreatment", e.target.value)} placeholder="Физиотерапия, инъекции, операции, массаж..." />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Перенесённые операции</label>
              <input style={styles.input} value={form.surgeries} onChange={e => s("surgeries", e.target.value)} placeholder="Нет / Артроскопия колена 2020..." />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Уровень физической активности</label>
              <select style={styles.input} value={form.activityLevel} onChange={e => s("activityLevel", e.target.value)}>
                <option value="">— выберите —</option>
                <option value="sedentary">Малоподвижный образ жизни</option>
                <option value="light">Лёгкая активность (прогулки)</option>
                <option value="moderate">Умеренная (спортзал 2-3 р/нед)</option>
                <option value="active">Активный (ежедневный спорт)</option>
                <option value="professional">Профессиональный спорт</option>
              </select>
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Что Вы ожидаете от лечения?</label>
              <textarea style={{ ...styles.input, minHeight: 60, resize: "vertical" }} value={form.expectations} onChange={e => s("expectations", e.target.value)} placeholder="Уменьшение боли, восстановление подвижности, возврат к спорту..." />
            </div>
          </div>
        )}

        {/* Navigation */}
        <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
          {step > 0 && (
            <button onClick={() => setStep(step - 1)} style={{ ...styles.btn, background: "#f1f5f9", color: "#475569", flex: 1 }}>← Назад</button>
          )}
          {step < steps.length - 1 ? (
            <button onClick={() => canNext() && setStep(step + 1)} disabled={!canNext()} style={{ ...styles.btn, background: canNext() ? "#0e7c6b" : "#e2e8f0", color: canNext() ? "#fff" : "#94a3b8", flex: 2, opacity: canNext() ? 1 : 0.6 }}>
              Далее →
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={submitting} style={{ ...styles.btn, background: submitting ? "#94a3b8" : "#0e7c6b", color: "#fff", flex: 2, fontSize: 16, opacity: submitting ? 0.7 : 1 }}>
              {submitting ? "⏳ Отправка..." : "✅ Отправить анкету"}
            </button>
          )}
        </div>
        {submitError && <div style={{marginTop:10,padding:"10px 14px",background:"#fef2f2",border:"1px solid #fca5a5",borderRadius:8,fontSize:13,color:"#dc2626"}}>{submitError}</div>}
      </div>

      {/* Footer */}
      <div style={{ textAlign: "center", marginTop: 16, fontSize: 11, color: "#94a3b8" }}>
        🏥 Atlant Clinic · ул. Акпан Батыр, 46 · Данные конфиденциальны
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #f0fdf4, #f0f2f5)",
    padding: "20px 16px",
    fontFamily: "'DM Sans', -apple-system, sans-serif",
    maxWidth: 480,
    margin: "0 auto",
  },
  card: {
    background: "#fff",
    borderRadius: 16,
    padding: "24px 20px",
    boxShadow: "0 4px 24px rgba(8,16,36,.08)",
  },
  stepTitle: {
    fontFamily: "'DM Serif Display', serif",
    fontSize: 20,
    color: "#042f2e",
    marginBottom: 16,
    paddingBottom: 12,
    borderBottom: "2px solid #0e7c6b",
  },
  field: {
    marginBottom: 14,
  },
  label: {
    display: "block",
    fontSize: 12,
    fontWeight: 700,
    color: "#64748b",
    marginBottom: 5,
    textTransform: "uppercase",
    letterSpacing: ".04em",
  },
  input: {
    width: "100%",
    padding: "11px 14px",
    border: "1.5px solid #dde4ef",
    borderRadius: 10,
    fontSize: 15,
    color: "#1a2332",
    outline: "none",
    fontFamily: "inherit",
    background: "#fff",
  },
  btn: {
    padding: "14px",
    borderRadius: 12,
    border: "none",
    fontSize: 15,
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: "inherit",
    transition: "all .15s",
  },
};

export default function QuestionnairePage() {
  return (
    <Suspense fallback={<div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",fontFamily:"'DM Sans',sans-serif",color:"#64748b"}}>⏳ Загрузка анкеты...</div>}>
      <QuestionnaireContent />
    </Suspense>
  );
}
