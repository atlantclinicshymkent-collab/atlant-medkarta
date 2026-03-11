import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import * as XLSX from "xlsx";

const SPECIALIZATIONS = ["Ортопед", "Физиотерапевт", "Невролог", "Мануальный терапевт", "Ревматолог", "Подиатр", "Хирург", "Реабилитолог", "Эндокринолог", "Гастроэнтеролог"];
const WEEKDAYS = ["Пн","Вт","Ср","Чт","Пт","Сб","Вс"];
const SAMPLE_DOCTORS = [
  { id:1, name:"Андрухів Макар Романович", specialization:"Ортопед", phone:"+77001112233", email:"andrukhiv@atlant.kz", schedule:["Пн","Вт","Ср","Чт","Пт"], notes:"" },
  { id:2, name:"Тлеубергенов Даулет Талгатович", specialization:"Ортопед", phone:"+77002223344", email:"", schedule:["Пн","Ср","Пт"], notes:"" },
  { id:3, name:"Караев Алосман Асанович", specialization:"Физиотерапевт", phone:"+77003334455", email:"", schedule:["Вт","Чт","Сб"], notes:"" },
  { id:4, name:"Жанар", specialization:"Реабилитолог", phone:"", email:"", schedule:["Пн","Вт","Ср","Чт","Пт"], notes:"" },
];
const EMPTY_DOCTOR = { name:"", specialization:"", phone:"", email:"", schedule:[], notes:"" };
const STATUSES = { active: "Наблюдается", discharged: "Выписан", referred: "Направлен" };
const STATUS_COLORS = { active: "#10b981", discharged: "#6366f1", referred: "#f59e0b" };
const APPT_TYPES = ["Первичный приём", "Повторная консультация", "Плановый осмотр", "Анализы / диагностика", "Процедура"];
const APPT_STATUSES = { scheduled: "Запланирован", done: "Проведён", cancelled: "Отменён", missed: "Не явился" };
const APPT_STATUS_COLORS = { scheduled: "#2563eb", done: "#10b981", cancelled: "#ef4444", missed: "#f59e0b" };
const EMPTY_PATIENT = { lastName:"", firstName:"", patronymic:"", dob:"", phone:"", diagnosis:"", doctor:"", status:"active", lastVisit:"", notes:"", nextVisitDate:"", nextVisitNote:"", admissionDate:"", passportSeries:"", passportNumber:"", passportIssued:"", iin:"" };
const EMPTY_APPT = { patientId:"", doctor:"", date:"", time:"", type:"Первичный приём", status:"scheduled", notes:"" };

// ─── Treatment protocol templates ───
const PROCEDURE_CATEGORIES = ["Физиотерапия", "Инъекции", "Мануальная", "Медикаменты", "Диагностика", "Другое"];
const PROCEDURE_ICONS = ["⚡","🔬","💥","🔊","💨","⚙️","🦴","🤲","💉","🩸","🎯","💊","📋","🧪","🔧","❤️"];
const PROCEDURE_COLORS = ["#8b5cf6","#06b6d4","#f97316","#3b82f6","#10b981","#64748b","#a855f7","#ec4899","#ef4444","#dc2626","#f59e0b","#2563eb","#0e7c6b","#7c3aed","#475569","#be185d"];
const SAMPLE_PROCEDURES = [
  { id:1, name: "TEKAR-терапия", category: "Физиотерапия", icon: "⚡", color: "#8b5cf6", defaultSessions: 10, price: 8000 },
  { id:2, name: "SIS-терапия", category: "Физиотерапия", icon: "🔬", color: "#06b6d4", defaultSessions: 8, price: 7000 },
  { id:3, name: "УВТ (ударно-волновая)", category: "Физиотерапия", icon: "💥", color: "#f97316", defaultSessions: 5, price: 6000 },
  { id:4, name: "Ультразвук", category: "Физиотерапия", icon: "🔊", color: "#3b82f6", defaultSessions: 10, price: 3000 },
  { id:5, name: "Карбокситерапия", category: "Инъекции", icon: "💨", color: "#10b981", defaultSessions: 6, price: 5000 },
  { id:6, name: "Электрофизиопроцедура", category: "Физиотерапия", icon: "⚙️", color: "#64748b", defaultSessions: 10, price: 3500 },
  { id:7, name: "Комп. вытяжение позвоночника", category: "Мануальная", icon: "🦴", color: "#a855f7", defaultSessions: 10, price: 5000 },
  { id:8, name: "Мануальнаяя терапия", category: "Мануальная", icon: "🤲", color: "#ec4899", defaultSessions: 8, price: 7000 },
  { id:9, name: "Внутрисуставная инъекция (УЗИ)", category: "Инъекции", icon: "💉", color: "#ef4444", defaultSessions: 3, price: 15000 },
  { id:10, name: "PRP-терапия", category: "Инъекции", icon: "🩸", color: "#dc2626", defaultSessions: 3, price: 25000 },
  { id:11, name: "Блокада", category: "Инъекции", icon: "🎯", color: "#f59e0b", defaultSessions: 1, price: 10000 },
  { id:12, name: "Фармакотерапия", category: "Медикаменты", icon: "💊", color: "#2563eb", defaultSessions: 1, price: 0 },
  { id:13, name: "УЗИ брюшной полости", category: "Диагностика", icon: "🔬", color: "#0e7c6b", defaultSessions: 1, price: 8000 },
  { id:14, name: "УЗИ почек и мочеполовой системы", category: "Диагностика", icon: "🔬", color: "#0e7c6b", defaultSessions: 1, price: 6000 },
  { id:15, name: "УЗИ щитовидной железы", category: "Диагностика", icon: "🔬", color: "#0e7c6b", defaultSessions: 1, price: 5000 },
  { id:16, name: "УЗИ суставов", category: "Диагностика", icon: "🔬", color: "#0e7c6b", defaultSessions: 1, price: 6000 },
  { id:17, name: "УЗИ мягких тканей", category: "Диагностика", icon: "🔬", color: "#06b6d4", defaultSessions: 1, price: 5000 },
  { id:18, name: "УЗИ позвоночника", category: "Диагностика", icon: "🔬", color: "#06b6d4", defaultSessions: 1, price: 7000 },
  { id:19, name: "УЗИ сосудов (допплер)", category: "Диагностика", icon: "🔬", color: "#7c3aed", defaultSessions: 1, price: 8000 },
  { id:20, name: "УЗИ молочных желёз", category: "Диагностика", icon: "🔬", color: "#ec4899", defaultSessions: 1, price: 5500 },
];

const DIAGNOSES_CATALOG = [
  "Межпозвоночная грыжа (L4-L5)", "Межпозвоночная грыжа (L5-S1)", "Межпозвоночная грыжа шейного отдела",
  "Остеохондроз поясничного отдела", "Остеохондроз шейного отдела", "Остеохондроз грудного отдела",
  "Гонартроз (коленный сустав)", "Коксартроз (тазобедренный сустав)", "Артроз плечевого сустава",
  "Плантарный фасциит", "Hallux valgus", "Плоскостопие",
  "Миофасциальный болевой синдром", "Бурсит", "Синовиит",
  "Ревматоидный артрит", "Подагрический артрит",
  "Сколиоз", "Кифоз", "Цервикалгия", "Люмбалгия", "Торакалгия",
  "Эпикондилит", "Туннельный синдром",
];

// ─── Podiatech constants ───
const FOOT_TYPES = ["Нормальная стопа", "Плоскостопие (I ст.)", "Плоскостопие (II ст.)", "Плоскостопие (III ст.)", "Полая стопа", "Вальгусная деформация", "Варусная деформация"];
const INSOLE_STATUSES = { ordered: "Заказано", production: "У производстве", ready: "Готово", delivered: "Выдано" };
const INSOLE_STATUS_COLORS = { ordered: "#f59e0b", production: "#2563eb", ready: "#10b981", delivered: "#6366f1" };
const INSOLE_TYPES = ["Повседневная", "Спортивная", "Диабетическая", "Детская", "Ортопедическая каркасная", "Полустелька"];
const INSOLE_SIZES = Array.from({length:19}, (_,i) => i+30); // 30-48
const STOCK_OP_TYPES = { in: "Приход", out: "Выдача" };

const SAMPLE_STOCK = [
  { id:401, type:"Повседневная", size:39, cost:8500, price:15000, qty:3, notes:"Sidas 3Feet Activ Low" },
  { id:402, type:"Повседневная", size:42, cost:8500, price:15000, qty:2, notes:"Sidas 3Feet Activ Mid" },
  { id:403, type:"Спортивная", size:41, cost:11000, price:19000, qty:1, notes:"Sidas Run+ Protect" },
  { id:404, type:"Спортивная", size:44, cost:11000, price:19000, qty:2, notes:"Sidas Run+ Protect" },
  { id:405, type:"Диабетическая", size:40, cost:12000, price:22000, qty:1, notes:"Sidas Conform'able Diabetic" },
  { id:406, type:"Повседневная", size:37, cost:8500, price:15000, qty:4, notes:"Sidas 3Feet Activ High" },
  { id:407, type:"Детская", size:33, cost:6000, price:10000, qty:2, notes:"Sidas Kids+" },
  { id:408, type:"Ортопедическая каркасная", size:38, cost:14000, price:25000, qty:1, notes:"Индивидуальное изготовление" },
];

const SAMPLE_STOCK_LOG = [
  { id:501, date:"2026-02-15", opType:"in", insoleType:"Повседневная", size:39, qty:5, cost:8500, price:15000, notes:"Партия от Sidas" },
  { id:502, date:"2026-02-20", opType:"out", insoleType:"Повседневная", size:39, qty:1, patientId:3, notes:"Выдано пациенту" },
  { id:503, date:"2026-03-01", opType:"out", insoleType:"Повседневная", size:39, qty:1, patientId:null, notes:"Выдано без привязки" },
  { id:504, date:"2026-02-15", opType:"in", insoleType:"Спортивная", size:41, qty:2, cost:11000, price:19000, notes:"Партия от Sidas" },
  { id:505, date:"2026-02-28", opType:"out", insoleType:"Спортивная", size:41, qty:1, patientId:4, notes:"" },
  { id:506, date:"2026-03-01", opType:"in", insoleType:"Диабетическая", size:40, qty:1, cost:12000, price:22000, notes:"" },
];

// ─── Medications catalog ───
const MEDICATION_CATEGORIES = {
  "НПВП": ["Мелоксикам", "Диклофенак", "Ибупрофен", "Нимесулид", "Целекоксиб", "Эторикоксиб", "Кеторолак", "Декскетопрофен"],
  "Миорелаксанты": ["Тизанидин", "Толперизон", "Баклофен", "Сирдалуд"],
  "Хондропротекторы": ["Хондроитин сульфат", "Глюкозамин", "Дона", "Артра", "Терафлекс", "Мукосат", "Алфлутоп"],
  "Гиалуроновая кислота": ["Ostenil", "Ostenil Plus", "Synvisc", "Fermatron", "Curavisc", "Hyalgan", "Sinovial"],
  "Кортикостероиды": ["Дипроспан", "Дексаметазон", "Кеналог", "Гидрокортизон", "Флостерон"],
  "PRP / биопрепараты": ["PRP (собственная кровь)", "SVF", "Ортокин"],
  "Витамины / нейротропы": ["Витамин B1/B6/B12", "Мильгамма", "Нейрорубин", "Нуклео ЦМФ Форте"],
  "Обезболивающие (для блокад)": ["Лидокаин", "Бупивакаин", "Ропивакаин", "Новокаин"],
  "Другое": ["Карбоген (CO₂)", "Озон", "Плазмолифтинг"],
};
const ALL_MEDICATIONS = Object.values(MEDICATION_CATEGORIES).flat();

const SAMPLE_PATIENTS = [
  { id:1, lastName:"Ахметова", firstName:"Айгерим", patronymic:"Болатовна", dob:"1985-03-12", phone:"+77011234567", diagnosis:"Остеохондроз поясничного отдела", doctor:"Андрухів Макар Романович", status:"active", lastVisit:"2026-02-20", notes:"", nextVisitDate:"2026-03-15", nextVisitNote:"Контроль, TEKAR №6" },
  { id:2, lastName:"Нурланов", firstName:"Бауыржан", patronymic:"Сейткалиевич", dob:"1970-07-25", phone:"+77052345678", diagnosis:"Гонартроз (коленный сустав)", doctor:"Тлеубергенов Даулет Талгатович", status:"active", lastVisit:"2026-03-01", notes:"", nextVisitDate:"2026-03-10", nextVisitNote:"Инъекция №2" },
  { id:3, lastName:"Жумабекова", firstName:"Дина", patronymic:"Маратовна", dob:"1992-11-08", phone:"+77713456789", diagnosis:"Плантарный фасциит", doctor:"Андрухів Макар Романович", status:"discharged", lastVisit:"2026-01-15", notes:"Подиатрична корекція", nextVisitDate:"", nextVisitNote:"" },
  { id:4, lastName:"Ковальчук", firstName:"Елена", patronymic:"Петровна", dob:"1988-06-22", phone:"+77019876543", diagnosis:"Межпозвоночная грыжа (L5-S1)", doctor:"Андрухів Макар Романович", status:"active", lastVisit:"2026-03-05", notes:"Комплексное лечение", nextVisitDate:"2026-03-12", nextVisitNote:"УХТ №3, витягування" },
];
const SAMPLE_APPTS = [
  { id:101, patientId:1, doctor:"Андрухів Макар Романович", date:"2026-03-15", time:"10:00", type:"Процедура", status:"scheduled", notes:"TEKAR-терапія №6" },
  { id:102, patientId:2, doctor:"Тлеубергенов Даулет Талгатович", date:"2026-03-10", time:"09:30", type:"Процедура", status:"scheduled", notes:"Инъекция гиалуроновой кислоты" },
  { id:103, patientId:4, doctor:"Андрухів Макар Романович", date:"2026-03-12", time:"11:00", type:"Процедура", status:"scheduled", notes:"УХТ №3" },
  { id:104, patientId:1, doctor:"Андрухів Макар Романович", date:"2026-03-08", time:"10:00", type:"Процедура", status:"done", notes:"TEKAR-терапія №5" },
  { id:105, patientId:4, doctor:"Андрухів Макар Романович", date:"2026-03-05", time:"11:00", type:"Процедура", status:"done", notes:"УХТ №2" },
  { id:106, patientId:2, doctor:"Тлеубергенов Даулет Талгатович", date:"2026-03-01", time:"09:30", type:"Процедура", status:"done", notes:"Инъекция №1" },
  { id:107, patientId:3, doctor:"Андрухів Макар Романович", date:"2026-01-15", time:"14:00", type:"Повторная консультация", status:"done", notes:"Контроль після стелек" },
  { id:108, patientId:1, doctor:"Андрухів Макар Романович", date:"2026-02-20", time:"10:00", type:"Первичный приём", status:"done", notes:"" },
  { id:109, patientId:4, doctor:"Андрухів Макар Романович", date:"2026-02-28", time:"11:00", type:"Первичный приём", status:"done", notes:"МРТ L5-S1" },
  { id:110, patientId:2, doctor:"Тлеубергенов Даулет Талгатович", date:"2026-02-15", time:"09:00", type:"Первичный приём", status:"done", notes:"Rö колінного суглоба" },
];

const SAMPLE_PROTOCOLS = [
  { id:201, patientId:1, name:"Курс TEKAR-терапии", procedures:[
    { procedureName:"TEKAR-терапия", totalSessions:10, completedSessions:5, notes:"Поясничный отдел", medications:[] }
  ], startDate:"2026-02-20", status:"active", doctor:"Андрухів Макар Романович", diagnosis:"Остеохондроз поясничного отдела" },
  { id:202, patientId:2, name:"Курс инъекций гиалуроновой кислоты", procedures:[
    { procedureName:"Внутрисуставная инъекция (УЗИ)", totalSessions:3, completedSessions:1, notes:"Коленный сустав", medications:["Ostenil Plus"] }
  ], startDate:"2026-03-01", status:"active", doctor:"Тлеубергенов Даулет Талгатович", diagnosis:"Гонартроз (коленный сустав)" },
  { id:203, patientId:4, name:"Комплексное лечение грыжи L5-S1", procedures:[
    { procedureName:"УВТ (ударно-волновая)", totalSessions:5, completedSessions:2, notes:"Поясничный отдел", medications:[] },
    { procedureName:"Комп. вытяжение позвоночника", totalSessions:10, completedSessions:3, notes:"", medications:[] },
    { procedureName:"Мануальнаяя терапия", totalSessions:8, completedSessions:2, notes:"", medications:[] },
    { procedureName:"Фармакотерапия", totalSessions:1, completedSessions:1, notes:"", medications:["Мелоксикам","Тизанидин","Мильгамма"] },
  ], startDate:"2026-02-28", status:"active", doctor:"Андрухів Макар Романович", diagnosis:"Межпозвоночная грыжа (L5-S1)" },
  { id:204, patientId:3, name:"Лечение плантарного фасциита", procedures:[
    { procedureName:"УВТ (ударно-волновая)", totalSessions:5, completedSessions:5, notes:"Пяточная шпора", medications:[] },
    { procedureName:"Карбокситерапия", totalSessions:4, completedSessions:4, notes:"", medications:[] },
  ], startDate:"2025-11-01", status:"completed", doctor:"Андрухів Макар Романович", diagnosis:"Плантарный фасциит" },
];

const SAMPLE_PODIATECH = [
  { id:301, patientId:3, date:"2025-12-10", footType:"Плоскостопие (II ст.)", halluxValgus:true, archIndex:"0.31", pressureNotes:"Перегрузка медиального склепіння, смещение центра давления латерально", insoleStatus:"delivered", insoleDeliveryDate:"2026-01-10", notes:"Корекція повздовжнього склепіння + розвантаження I плюсно-фалангового суглоба" },
  { id:302, patientId:4, date:"2026-03-01", footType:"Плоскостопие (I ст.)", halluxValgus:false, archIndex:"0.38", pressureNotes:"Незначительное снижение повздовжнього склепіння, равномерное распределение давления", insoleStatus:"production", insoleDeliveryDate:"", notes:"Профилактические стельки для коррекции биомеханики ходьбы" },
];

const uid = () => Date.now() + Math.random();
const calcAge = (dob) => !dob ? "—" : Math.floor((Date.now() - new Date(dob)) / (1000*60*60*24*365.25)) + " р.";
const fmt = (d) => { if (!d) return "—"; const [y,m,day]=d.split("-"); return `${day}.${m}.${y}`; };
const today = () => new Date().toISOString().slice(0,10);
const daysUntil = (d) => !d ? null : Math.ceil((new Date(d) - new Date(today())) / 86400000);
const fullName = (p) => p ? `${p.lastName} ${p.firstName} ${p.patronymic||""}`.trim() : "—";
const shortName = (p) => p ? `${p.lastName} ${p.firstName?.[0]||""}.${p.patronymic?.[0]?p.patronymic[0]+".":""}` : "—";
const cleanPhone = (phone) => (phone||"").replace(/[\s\-\(\)]/g,"");

const formatPhone = (raw) => {
  const d = cleanPhone(raw).replace(/^\+7/,"");
  if (d.length !== 10) return raw;
  return `+7 (${d.slice(0,3)}) ${d.slice(3,6)}-${d.slice(6,8)}-${d.slice(8,10)}`;
};

const buildMsg = (p) => {
  const d = daysUntil(p.nextVisitDate);
  const when = d===0?"сегодня":d===1?"завтра":fmt(p.nextVisitDate);
  return `Уважаемый(ая) ${p.firstName} ${p.patronymic||""}!\n\nНапоминаем, что Вам назначена консультация ${when}${p.nextVisitNote?" ("+p.nextVisitNote+")":""}.\n\nВрач: ${p.doctor}\nAtlant Clinic\n\nЖдём Вас! 🏥`;
};

const openWA  = (phone, text) => { const p=cleanPhone(phone); if(!p){alert("Укажите номер телефона!");return;} window.open(`https://wa.me/${p.replace("+","")}?text=${encodeURIComponent(text)}`,"_blank"); };
const openTG  = (phone, text) => { const p=cleanPhone(phone); if(!p){alert("Укажите номер телефона!");return;} window.open(`https://t.me/${p}?text=${encodeURIComponent(text)}`,"_blank"); };
const doCopy  = async (text, cb) => { try{ await navigator.clipboard.writeText(text); cb(); }catch{ alert(text); } };

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@300;400;500;600;700&display=swap');
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'DM Sans',sans-serif;background:#f0f2f5}
  .btn{cursor:pointer;border:none;border-radius:8px;font-size:13px;font-weight:600;transition:all .18s;font-family:inherit}
  .btn:hover{filter:brightness(1.06);transform:translateY(-1px)}
  .btn:active{transform:translateY(0)}
  .btn:disabled{opacity:.4;cursor:default;transform:none!important}
  input,select,textarea{font-family:inherit}
  .row-tr:hover td{background:#f0f6ff!important}
  ::-webkit-scrollbar{width:5px;height:5px}
  ::-webkit-scrollbar-thumb{background:#b8cce0;border-radius:3px}
  .chip{display:inline-block;padding:3px 11px;border-radius:20px;font-size:12px;font-weight:700}
  .modal-bg{position:fixed;inset:0;background:rgba(8,16,36,.55);display:flex;align-items:center;justify-content:center;z-index:200;animation:fi .18s;backdrop-filter:blur(4px)}
  @keyframes fi{from{opacity:0}to{opacity:1}}
  .modal{background:#fff;border-radius:18px;box-shadow:0 32px 80px rgba(8,16,36,.3);animation:su .22s}
  @keyframes su{from{opacity:0;transform:translateY(24px) scale(.97)}to{opacity:1;transform:translateY(0) scale(1)}}
  .field label{display:block;font-size:11px;font-weight:700;color:#64748b;margin-bottom:5px;letter-spacing:.06em;text-transform:uppercase}
  .field input,.field select,.field textarea{width:100%;padding:9px 12px;border:1.5px solid #dde4ef;border-radius:8px;font-size:14px;color:#1a2332;outline:none;transition:border-color .15s,box-shadow .15s;background:#fff}
  .field input:focus,.field select:focus,.field textarea:focus{border-color:#0e7c6b;box-shadow:0 0 0 3px rgba(14,124,107,.12)}
  th{font-size:11px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;color:#64748b;white-space:nowrap}
  .tab{cursor:pointer;padding:10px 18px;border-radius:8px;font-size:13.5px;font-weight:600;transition:all .15s;white-space:nowrap;position:relative}
  .tab:hover{background:rgba(14,124,107,.08);color:#0e7c6b}
  .tab.active{background:#0e7c6b;color:#fff;box-shadow:0 2px 12px rgba(14,124,107,.35)}
  .card{background:#fff;border-radius:14px;box-shadow:0 2px 12px rgba(8,16,36,.06)}
  .badge{background:#ef4444;color:#fff;font-size:10px;font-weight:700;border-radius:10px;padding:1px 6px;min-width:18px;text-align:center;position:absolute;top:-5px;right:-5px}
  .progress-bar{height:8px;border-radius:4px;background:#e8edf3;overflow:hidden;position:relative}
  .progress-fill{height:100%;border-radius:4px;transition:width .4s ease}
  .timeline-dot{width:14px;height:14px;border-radius:50%;border:3px solid #fff;box-shadow:0 0 0 2px #cbd5e1;position:relative;z-index:2;flex-shrink:0}
  .timeline-line{position:absolute;left:6px;top:14px;bottom:0;width:2px;background:#e2e8f0}
  .stat-ring{position:relative;display:inline-flex;align-items:center;justify-content:center}
  @keyframes fadeSlide{from{opacity:0;transform:translateX(-10px)}to{opacity:1;transform:translateX(0)}}
  .fade-item{animation:fadeSlide .3s ease forwards;opacity:0}
  td:hover .slot-plus{opacity:.35!important}
  td:hover{background:#f0fdf433}
  @media print {
    .no-print { display: none !important; }
    body { background: white !important; }
    .discharge-print-wrapper { display: block; }
    .modal-bg { position: static !important; backdrop-filter: none !important; background: white !important; }
    .modal { box-shadow: none !important; border-radius: 0 !important; max-height: none !important; overflow: visible !important; }
  }
  .discharge-print-wrapper {}
` ;

const WA_SVG = <svg width="15" height="15" viewBox="0 0 32 32" fill="none"><circle cx="16" cy="16" r="16" fill="#fff" fillOpacity=".2"/><path d="M23.5 8.5A10.4 10.4 0 0 0 16 5.5C10.2 5.5 5.5 10.2 5.5 16c0 1.8.5 3.6 1.4 5.1L5.5 26.5l5.6-1.5A10.4 10.4 0 0 0 16 26.5c5.8 0 10.5-4.7 10.5-10.5 0-2.8-1.1-5.4-3-7.5z" fill="#fff"/></svg>;
const TG_SVG = <svg width="15" height="15" viewBox="0 0 32 32" fill="none"><path d="M23.5 9L6 15.8c-1.2.5-1.2 1.1-.2 1.4l4.3 1.3 10-6.3c.5-.3.9-.1.6.2l-8 7.2v2.8l2.1-2a85 85 0 0 0 5.8 4.3c.7.4 1.2.2 1.4-.6l2.5-12.2c.3-1.2-.5-1.7-2-1z" fill="#fff"/></svg>;

// ═══════════════════════════════════════════
// MINI BAR CHART COMPONENT
// ═══════════════════════════════════════════
function MiniBar({ data, height=120, barColor="#0e7c6b" }) {
  const max = Math.max(...data.map(d=>d.value), 1);
  return (
    <div style={{display:"flex",alignItems:"flex-end",gap:3,height,padding:"0 2px"}}>
      {data.map((d,i) => (
        <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
          <div style={{fontSize:10,fontWeight:700,color:"#475569"}}>{d.value||""}</div>
          <div style={{width:"100%",borderRadius:"4px 4px 0 0",background:barColor,opacity:.15+.85*(d.value/max),height:`${Math.max(4,(d.value/max)*height*0.7)}px`,transition:"height .4s ease"}}/>
          <div style={{fontSize:9,color:"#94a3b8",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",maxWidth:50}}>{d.label}</div>
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════
// DONUT CHART COMPONENT
// ═══════════════════════════════════════════
function DonutChart({ segments, size=120, strokeWidth=16, centerLabel="" }) {
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const total = segments.reduce((s,seg) => s + seg.value, 0);
  let offset = 0;
  return (
    <div className="stat-ring" style={{width:size,height:size}}>
      <svg width={size} height={size} style={{transform:"rotate(-90deg)"}}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#e8edf3" strokeWidth={strokeWidth}/>
        {segments.map((seg,i) => {
          const dash = total > 0 ? (seg.value / total) * circ : 0;
          const el = <circle key={i} cx={size/2} cy={size/2} r={r} fill="none" stroke={seg.color} strokeWidth={strokeWidth} strokeDasharray={`${dash} ${circ-dash}`} strokeDashoffset={-offset} strokeLinecap="round" style={{transition:"all .5s ease"}}/>;
          offset += dash;
          return el;
        })}
      </svg>
      <div style={{position:"absolute",fontSize:13,fontWeight:700,color:"#1a2332",textAlign:"center",lineHeight:1.2}}>
        {centerLabel || total}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// MESSENGER MODAL
// ═══════════════════════════════════════════
function MessengerModal({ patient, onClose }) {
  const [text, setText] = useState(() => buildMsg(patient));
  const [copied, setCopied] = useState(false);
  const phone = cleanPhone(patient.phone);
  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal" style={{width:520,maxHeight:"92vh",overflow:"auto"}} onClick={e=>e.stopPropagation()}>
        <div style={{background:"linear-gradient(135deg,#064e3b,#0e7c6b)",padding:"18px 24px",borderRadius:"18px 18px 0 0",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div>
            <div style={{fontFamily:"'DM Serif Display',serif",fontSize:18,color:"#fff"}}>📨 Надіслати напоминания</div>
            <div style={{color:"rgba(255,255,255,.65)",fontSize:13,marginTop:2}}>{fullName(patient)} · {phone?formatPhone(patient.phone):"телефон не указан"}</div>
          </div>
          <button className="btn" onClick={onClose} style={{background:"rgba(255,255,255,.15)",color:"#fff",padding:"5px 11px"}}>✕</button>
        </div>
        <div style={{padding:"20px 24px",display:"flex",flexDirection:"column",gap:14}}>
          {patient.nextVisitDate && (
            <div style={{background:"#f0fdf4",border:"1px solid #bbf7d0",borderRadius:10,padding:"10px 14px",fontSize:13,display:"flex",gap:10,alignItems:"center"}}>
              <span style={{fontSize:20}}>🗓</span>
              <div><b>Следующий визит:</b> {fmt(patient.nextVisitDate)}{patient.nextVisitNote&&<span style={{color:"#475569"}}> — {patient.nextVisitNote}</span>}{daysUntil(patient.nextVisitDate)<0&&<span style={{color:"#dc2626",fontWeight:700}}> ⚠️ Просрочено!</span>}</div>
            </div>
          )}
          <div className="field">
            <label>Текст сообщения</label>
            <textarea rows={7} value={text} onChange={e=>setText(e.target.value)} style={{resize:"vertical",fontSize:13,lineHeight:1.6}}/>
          </div>
          <div style={{background:"#f0f9ff",border:"1px solid #bae6fd",borderRadius:10,padding:"12px 14px",fontSize:13,lineHeight:1.6,whiteSpace:"pre-wrap",color:"#0c4a6e",maxHeight:160,overflowY:"auto"}}>{text}</div>
          <button className="btn" onClick={()=>setText(buildMsg(patient))} style={{background:"#f1f5f9",color:"#475569",padding:"7px 14px",alignSelf:"flex-start",fontSize:12}}>🔄 Сбросить шаблон</button>
          <div style={{borderTop:"1px solid #f0f4f8",paddingTop:14}}>
            <div style={{fontSize:11,fontWeight:700,color:"#64748b",marginBottom:10,textTransform:"uppercase",letterSpacing:".06em"}}>Отправить через мессенджер</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
              <button className="btn" onClick={()=>openWA(patient.phone,text)} style={{background:"#25d366",color:"#fff",padding:"12px 8px",display:"flex",flexDirection:"column",alignItems:"center",gap:5,opacity:phone?1:.5}}>
                <span style={{fontSize:26}}>📱</span><span style={{fontSize:13,fontWeight:700}}>WhatsApp</span>
              </button>
              <button className="btn" onClick={()=>openTG(patient.phone,text)} style={{background:"#0088cc",color:"#fff",padding:"12px 8px",display:"flex",flexDirection:"column",alignItems:"center",gap:5,opacity:phone?1:.5}}>
                <span style={{fontSize:26}}>✈️</span><span style={{fontSize:13,fontWeight:700}}>Telegram</span>
              </button>
              <button className="btn" onClick={()=>doCopy(text,()=>{setCopied(true);setTimeout(()=>setCopied(false),2000);})} style={{background:copied?"#10b981":"#f1f5f9",color:copied?"#fff":"#475569",padding:"12px 8px",display:"flex",flexDirection:"column",alignItems:"center",gap:5}}>
                <span style={{fontSize:26}}>{copied?"✅":"📋"}</span><span style={{fontSize:13,fontWeight:700}}>{copied?"Скопировано!":"Копировать"}</span>
              </button>
            </div>
            {!phone&&<div style={{marginTop:10,fontSize:12,color:"#ef4444",background:"#fef2f2",padding:"8px 12px",borderRadius:8}}>⚠️ Телефон не указан. Додайте номер у картці.</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

function MsgBtns({ patient, setMessengerPat }) {
  return (
    <div style={{display:"flex",gap:4}} onClick={e=>e.stopPropagation()}>
      <button className="btn" title="WhatsApp" onClick={()=>setMessengerPat(patient)} style={{background:"#25d366",color:"#fff",padding:"5px 9px",display:"flex",alignItems:"center",gap:4}}>{WA_SVG}<span style={{fontSize:11}}>WA</span></button>
      <button className="btn" title="Telegram" onClick={()=>setMessengerPat(patient)} style={{background:"#0088cc",color:"#fff",padding:"5px 9px",display:"flex",alignItems:"center",gap:4}}>{TG_SVG}<span style={{fontSize:11}}>TG</span></button>
    </div>
  );
}

// ═══════════════════════════════════════════
// PATIENT FORM
// ═══════════════════════════════════════════
function PatientForm({form,setForm,isAdd,onSave,onClose,doctorNames}) {
  const s=(k,v)=>setForm(f=>({...f,[k]:v}));
  const valid=form.lastName?.trim()&&form.firstName?.trim();
  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal" style={{width:600,maxHeight:"93vh",overflow:"auto"}} onClick={e=>e.stopPropagation()}>
        <div style={{padding:"18px 24px",borderBottom:"1px solid #f0f4f8",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div style={{fontFamily:"'DM Serif Display',serif",fontSize:19}}>{isAdd?"Новый пациент":"Редактирование"}</div>
          <button className="btn" onClick={onClose} style={{background:"#f1f5f9",color:"#64748b",padding:"5px 11px"}}>✕</button>
        </div>
        <div style={{padding:"20px 24px",display:"flex",flexDirection:"column",gap:12}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <div className="field"><label>Фамилия *</label><input value={form.lastName||""} onChange={e=>s("lastName",e.target.value)} placeholder="Ахметова"/></div>
            <div className="field"><label>Имя *</label><input value={form.firstName||""} onChange={e=>s("firstName",e.target.value)} placeholder="Айгерим"/></div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <div className="field"><label>Отчество</label><input value={form.patronymic||""} onChange={e=>s("patronymic",e.target.value)} placeholder="Болатовна"/></div>
            <div className="field"><label>Дата рождения</label><input type="date" value={form.dob||""} onChange={e=>s("dob",e.target.value)}/></div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <div className="field">
              <label>Телефон (WA / TG)</label>
              <input value={form.phone||""} onChange={e=>s("phone",e.target.value)} placeholder="+77011234567"/>
            </div>
            <div className="field"><label>ИИН</label><input value={form.iin||""} onChange={e=>s("iin",e.target.value)} placeholder="000000000000" maxLength={12}/></div>
          </div>
          <div style={{background:"#f8fafc",border:"1px solid #e2e8f0",borderRadius:10,padding:"12px 14px"}}>
            <div style={{fontSize:11,fontWeight:700,color:"#64748b",marginBottom:8,textTransform:"uppercase",letterSpacing:".06em"}}>📄 Паспортные данные</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
              <div className="field"><label>Серия</label><input value={form.passportSeries||""} onChange={e=>s("passportSeries",e.target.value)} placeholder="AB"/></div>
              <div className="field"><label>Номер</label><input value={form.passportNumber||""} onChange={e=>s("passportNumber",e.target.value)} placeholder="1234567"/></div>
              <div className="field"><label>Кем выдан</label><input value={form.passportIssued||""} onChange={e=>s("passportIssued",e.target.value)} placeholder="МВД РК"/></div>
            </div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <div className="field"><label>Дата поступления</label><input type="date" value={form.admissionDate||""} onChange={e=>s("admissionDate",e.target.value)}/></div>
            <div className="field"><label>Последний визит</label><input type="date" value={form.lastVisit||""} onChange={e=>s("lastVisit",e.target.value)}/></div>
          </div>
          <div className="field"><label>Диагноз</label>
            <input list="diag-list" value={form.diagnosis||""} onChange={e=>s("diagnosis",e.target.value)} placeholder="Выберите или введите диагноз"/>
            <datalist id="diag-list">{DIAGNOSES_CATALOG.map(d=><option key={d} value={d}/>)}</datalist>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <div className="field"><label>Лечащий врач</label>
              <select value={form.doctor||""} onChange={e=>s("doctor",e.target.value)}>
                <option value="">— выбрать —</option>
                {doctorNames.map(d=><option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div className="field"><label>Статус</label>
              <select value={form.status||"active"} onChange={e=>s("status",e.target.value)}>
                {Object.entries(STATUSES).map(([k,v])=><option key={k} value={k}>{v}</option>)}
              </select>
            </div>
          </div>
          <div style={{background:"#f0fdf4",border:"1px solid #bbf7d0",borderRadius:10,padding:"12px 14px"}}>
            <div style={{fontSize:11,fontWeight:700,color:"#166534",marginBottom:8,textTransform:"uppercase",letterSpacing:".06em"}}>🔔 Напоминания</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              <div className="field"><label>Дата наступного визиту</label><input type="date" value={form.nextVisitDate||""} onChange={e=>s("nextVisitDate",e.target.value)}/></div>
              <div className="field"><label>Цель / примечание</label><input value={form.nextVisitNote||""} onChange={e=>s("nextVisitNote",e.target.value)} placeholder="Контроль, процедура…"/></div>
            </div>
          </div>
          <div className="field"><label>Примечания</label><textarea rows={2} value={form.notes||""} onChange={e=>s("notes",e.target.value)} placeholder="Дополнительная информация…" style={{resize:"vertical"}}/></div>
          <div style={{display:"flex",gap:10,marginTop:4}}>
            <button className="btn" onClick={()=>valid&&onSave(form)} disabled={!valid} style={{flex:1,background:valid?"#0e7c6b":"#e2e8f0",color:valid?"#fff":"#94a3b8",padding:"12px",fontSize:15}}>{isAdd?"➕ Добавить пациента":"💾 Сохранить"}</button>
            <button className="btn" onClick={onClose} style={{background:"#f1f5f9",color:"#475569",padding:"12px 20px"}}>Отменить</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// APPOINTMENT FORM (with inline new patient)
// ═══════════════════════════════════════════
function ApptForm({form,setForm,isAdd,patients,onSave,onClose,doctorNames,onCreatePatient}) {
  const s=(k,v)=>setForm(f=>({...f,[k]:v}));
  const [newPat, setNewPat] = useState(false);
  const [np, setNp] = useState({lastName:"",firstName:"",patronymic:"",phone:"",diagnosis:""});
  const npSet = (k,v) => setNp(prev=>({...prev,[k]:v}));
  const npValid = np.lastName?.trim() && np.firstName?.trim();
  const valid = newPat ? (npValid && form.date && form.doctor) : (form.patientId && form.date && form.doctor);

  const handleSave = () => {
    if (!valid) return;
    if (newPat && onCreatePatient) {
      const newId = Date.now() + Math.random();
      const patient = { ...EMPTY_PATIENT, id: newId, lastName: np.lastName, firstName: np.firstName, patronymic: np.patronymic, phone: np.phone, diagnosis: np.diagnosis, doctor: form.doctor, status: "active", lastVisit: form.date };
      onCreatePatient(patient);
      onSave({ ...form, patientId: newId });
    } else {
      onSave(form);
    }
  };

  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal" style={{width:540,maxHeight:"93vh",overflow:"auto"}} onClick={e=>e.stopPropagation()}>
        <div style={{padding:"18px 24px",borderBottom:"1px solid #f0f4f8",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div style={{fontFamily:"'DM Serif Display',serif",fontSize:19}}>{isAdd?"Новый запись на прием":"Редактирование записьу"}</div>
          <button className="btn" onClick={onClose} style={{background:"#f1f5f9",color:"#64748b",padding:"5px 11px"}}>✕</button>
        </div>
        <div style={{padding:"20px 24px",display:"flex",flexDirection:"column",gap:12}}>

          {/* Toggle: existing vs new patient */}
          {isAdd&&<div style={{display:"flex",gap:6,marginBottom:2}}>
            <button className="btn" onClick={()=>{setNewPat(false);}} style={{flex:1,padding:"9px",background:!newPat?"#0e7c6b":"#f1f5f9",color:!newPat?"#fff":"#475569",fontSize:13}}>👤 Существующий пациент</button>
            <button className="btn" onClick={()=>{setNewPat(true);s("patientId","");}} style={{flex:1,padding:"9px",background:newPat?"#0e7c6b":"#f1f5f9",color:newPat?"#fff":"#475569",fontSize:13}}>＋ Новый пациент</button>
          </div>}

          {/* Existing patient select */}
          {!newPat&&<div className="field"><label>Пациент *</label>
            <select value={form.patientId||""} onChange={e=>{const p=patients.find(p=>p.id===+e.target.value);s("patientId",+e.target.value);if(p&&!form.doctor)s("doctor",p.doctor||"");}}>
              <option value="">— выбрать пациента —</option>
              {[...patients].sort((a,b)=>a.lastName.localeCompare(b.lastName,"uk")).map(p=><option key={p.id} value={p.id}>{fullName(p)}</option>)}
            </select>
          </div>}

          {/* New patient fields */}
          {newPat&&<div style={{background:"#f0fdf4",border:"1px solid #bbf7d0",borderRadius:12,padding:"14px 16px"}}>
            <div style={{fontSize:11,fontWeight:700,color:"#166534",marginBottom:10,textTransform:"uppercase",letterSpacing:".06em"}}>👤 Новый пациент</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
              <div className="field"><label>Фамилия *</label><input value={np.lastName} onChange={e=>npSet("lastName",e.target.value)} placeholder="Ахметова"/></div>
              <div className="field"><label>Имя *</label><input value={np.firstName} onChange={e=>npSet("firstName",e.target.value)} placeholder="Айгерим"/></div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
              <div className="field"><label>Отчество</label><input value={np.patronymic} onChange={e=>npSet("patronymic",e.target.value)} placeholder="Болатовна"/></div>
              <div className="field"><label>Телефон</label><input value={np.phone} onChange={e=>npSet("phone",e.target.value)} placeholder="+77011234567"/></div>
            </div>
            <div className="field"><label>Диагноз</label>
              <input list="diag-list-appt" value={np.diagnosis} onChange={e=>npSet("diagnosis",e.target.value)} placeholder="Выберите или введите диагноз"/>
              <datalist id="diag-list-appt">{DIAGNOSES_CATALOG.map(d=><option key={d} value={d}/>)}</datalist>
            </div>
          </div>}

          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <div className="field"><label>Дата *</label><input type="date" value={form.date||""} onChange={e=>s("date",e.target.value)}/></div>
            <div className="field"><label>Время</label><input type="time" value={form.time||""} onChange={e=>s("time",e.target.value)}/></div>
          </div>
          <div className="field"><label>Врач *</label>
            <select value={form.doctor||""} onChange={e=>s("doctor",e.target.value)}>
              <option value="">— выбрать —</option>
              {doctorNames.map(d=><option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div className="field"><label>Тип приему</label>
            <select value={form.type||APPT_TYPES[0]} onChange={e=>s("type",e.target.value)}>
              {APPT_TYPES.map(t=><option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          {!isAdd&&<div className="field"><label>Статус</label>
            <select value={form.status||"scheduled"} onChange={e=>s("status",e.target.value)}>
              {Object.entries(APPT_STATUSES).map(([k,v])=><option key={k} value={k}>{v}</option>)}
            </select>
          </div>}
          <div className="field"><label>Примечания</label><textarea rows={2} value={form.notes||""} onChange={e=>s("notes",e.target.value)} placeholder="Мета визиту, подготовка…" style={{resize:"vertical"}}/></div>
          <div style={{display:"flex",gap:10,marginTop:4}}>
            <button className="btn" onClick={handleSave} disabled={!valid} style={{flex:1,background:valid?"#0e7c6b":"#e2e8f0",color:valid?"#fff":"#94a3b8",padding:"12px",fontSize:15}}>{isAdd?(newPat?"👤📅 Создать пациента і запись":"📅 Создать запись"):"💾 Сохранить"}</button>
            <button className="btn" onClick={onClose} style={{background:"#f1f5f9",color:"#475569",padding:"12px 20px"}}>Отменить</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// PROTOCOL FORM
// ═══════════════════════════════════════════
function ProtocolForm({form,setForm,isAdd,patients,onSave,onClose,doctorNames,procCatalog}) {
  const s=(k,v)=>setForm(f=>({...f,[k]:v}));
  const addProc = () => setForm(f=>({...f, procedures:[...f.procedures, {procedureName:"",totalSessions:5,completedSessions:0,notes:"",medications:[]}]}));
  const updateProc = (i,k,v) => setForm(f=>({...f, procedures:f.procedures.map((p,j)=>j===i?{...p,[k]:v}:p)}));
  const removeProc = (i) => setForm(f=>({...f, procedures:f.procedures.filter((_,j)=>j!==i)}));
  const toggleMed = (i, med) => {
    setForm(f=>({...f, procedures:f.procedures.map((p,j)=>{
      if(j!==i) return p;
      const meds = p.medications||[];
      return {...p, medications: meds.includes(med) ? meds.filter(m=>m!==med) : [...meds, med]};
    })}));
  };
  const needsMeds = (procName) => {
    const lower = (procName||"").toLowerCase();
    return lower.includes("инъекц") || lower.includes("інєкц") || lower.includes("injection") || lower.includes("фармако") || lower.includes("блокад") || lower.includes("prp") || lower.includes("карбокс");
  };
  const valid=form.patientId&&form.name&&form.procedures.length>0;
  const selPatient = patients.find(p=>p.id===+form.patientId);

  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal" style={{width:640,maxHeight:"93vh",overflow:"auto"}} onClick={e=>e.stopPropagation()}>
        <div style={{background:"linear-gradient(135deg,#064e3b,#0e7c6b)",padding:"18px 24px",borderRadius:"18px 18px 0 0",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div style={{fontFamily:"'DM Serif Display',serif",fontSize:18,color:"#fff"}}>{isAdd?"💊 Новый протокол лечения":"Редактирование протоколу"}</div>
          <button className="btn" onClick={onClose} style={{background:"rgba(255,255,255,.15)",color:"#fff",padding:"5px 11px"}}>✕</button>
        </div>
        <div style={{padding:"20px 24px",display:"flex",flexDirection:"column",gap:12}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <div className="field"><label>Пациент *</label>
              <select value={form.patientId||""} onChange={e=>{s("patientId",+e.target.value); const p=patients.find(p=>p.id===+e.target.value); if(p){s("doctor",p.doctor||"");s("diagnosis",p.diagnosis||"");}}}>
                <option value="">— выбрать —</option>
                {[...patients].sort((a,b)=>a.lastName.localeCompare(b.lastName,"uk")).map(p=><option key={p.id} value={p.id}>{fullName(p)}</option>)}
              </select>
            </div>
            <div className="field"><label>Дата начала</label><input type="date" value={form.startDate||""} onChange={e=>s("startDate",e.target.value)}/></div>
          </div>
          <div className="field"><label>Название протокола *</label><input value={form.name||""} onChange={e=>s("name",e.target.value)} placeholder="Курс TEKAR + мануальна терапія"/></div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <div className="field"><label>Врач</label>
              <select value={form.doctor||""} onChange={e=>s("doctor",e.target.value)}>
                <option value="">— выбрать —</option>
                {doctorNames.map(d=><option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div className="field"><label>Диагноз</label><input value={form.diagnosis||""} onChange={e=>s("diagnosis",e.target.value)} list="diag-list2"/>
              <datalist id="diag-list2">{DIAGNOSES_CATALOG.map(d=><option key={d} value={d}/>)}</datalist>
            </div>
          </div>

          <div style={{background:"#f8fafc",borderRadius:12,padding:"14px 16px",border:"1px solid #e2e8f0"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
              <div style={{fontSize:12,fontWeight:700,color:"#0e7c6b",textTransform:"uppercase",letterSpacing:".06em"}}>Процедуры ({form.procedures.length})</div>
              <button className="btn" onClick={addProc} style={{background:"#0e7c6b",color:"#fff",padding:"5px 14px",fontSize:12}}>＋ Добавить процедуру</button>
            </div>
            {form.procedures.map((proc,i) => {
              const catItem = procCatalog.find(c=>c.name===proc.procedureName);
              return (
                <div key={i} style={{background:"#fff",borderRadius:10,padding:"12px 14px",marginBottom:8,border:"1px solid #e8edf3"}}>
                  <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:8}}>
                    {catItem&&<span style={{fontSize:18}}>{catItem.icon}</span>}
                    <select value={proc.procedureName} onChange={e=>{updateProc(i,"procedureName",e.target.value);const c=procCatalog.find(c=>c.name===e.target.value);if(c)updateProc(i,"totalSessions",c.defaultSessions);}} style={{flex:1,padding:"7px 10px",border:"1.5px solid #dde4ef",borderRadius:7,fontSize:13}}>
                      <option value="">— выбрать процедуру —</option>
                      {procCatalog.map(c=><option key={c.name} value={c.name}>{c.icon} {c.name}</option>)}
                    </select>
                    <button className="btn" onClick={()=>removeProc(i)} style={{background:"#fef2f2",color:"#dc2626",padding:"5px 8px",fontSize:12}}>✕</button>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 2fr",gap:8}}>
                    <div className="field"><label>Всего</label><input type="number" min={1} value={proc.totalSessions} onChange={e=>updateProc(i,"totalSessions",+e.target.value)}/></div>
                    <div className="field"><label>Выполнено</label><input type="number" min={0} max={proc.totalSessions} value={proc.completedSessions} onChange={e=>updateProc(i,"completedSessions",+e.target.value)}/></div>
                    <div className="field"><label>Примечания</label><input value={proc.notes||""} onChange={e=>updateProc(i,"notes",e.target.value)} placeholder="Зона, область…"/></div>
                  </div>
                  {needsMeds(proc.procedureName)&&(
                    <div style={{marginTop:8,background:"#fef3c7",border:"1px solid #fde68a",borderRadius:8,padding:"10px 12px"}}>
                      <div style={{fontSize:11,fontWeight:700,color:"#92400e",marginBottom:8,textTransform:"uppercase",letterSpacing:".06em"}}>💊 Препараты</div>
                      {(proc.medications||[]).length>0&&(
                        <div style={{display:"flex",flexWrap:"wrap",gap:4,marginBottom:8}}>
                          {(proc.medications||[]).map(med=>(
                            <span key={med} style={{background:"#fff",border:"1px solid #fde68a",borderRadius:6,padding:"3px 8px",fontSize:12,display:"flex",alignItems:"center",gap:4}}>
                              {med}
                              <button onClick={()=>toggleMed(i,med)} style={{background:"none",border:"none",cursor:"pointer",color:"#dc2626",fontSize:14,padding:0,lineHeight:1}}>×</button>
                            </span>
                          ))}
                        </div>
                      )}
                      <select value="" onChange={e=>{if(e.target.value)toggleMed(i,e.target.value);e.target.value="";}} style={{width:"100%",padding:"7px 10px",border:"1.5px solid #fde68a",borderRadius:7,fontSize:12,background:"#fff"}}>
                        <option value="">＋ добавить препарат…</option>
                        {Object.entries(MEDICATION_CATEGORIES).map(([cat,meds])=>(
                          <optgroup key={cat} label={cat}>
                            {meds.filter(m=>!(proc.medications||[]).includes(m)).map(m=><option key={m} value={m}>{m}</option>)}
                          </optgroup>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              );
            })}
            {form.procedures.length===0&&<div style={{textAlign:"center",color:"#94a3b8",padding:"16px",fontSize:13}}>Добавьте хотя бы одну процедуру</div>}
          </div>

          {!isAdd&&<div className="field"><label>Статус протокола</label>
            <select value={form.status||"active"} onChange={e=>s("status",e.target.value)}>
              <option value="active">Активный</option>
              <option value="completed">Завершён</option>
              <option value="paused">Приостановлено</option>
            </select>
          </div>}
          <div style={{display:"flex",gap:10,marginTop:4}}>
            <button className="btn" onClick={()=>valid&&onSave(form)} disabled={!valid} style={{flex:1,background:valid?"#0e7c6b":"#e2e8f0",color:valid?"#fff":"#94a3b8",padding:"12px",fontSize:15}}>{isAdd?"💊 Создать протокол":"💾 Сохранить"}</button>
            <button className="btn" onClick={onClose} style={{background:"#f1f5f9",color:"#475569",padding:"12px 20px"}}>Отменить</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// PODIATECH FORM
// ═══════════════════════════════════════════
function PodiatechForm({form,setForm,isAdd,patients,onSave,onClose}) {
  const s=(k,v)=>setForm(f=>({...f,[k]:v}));
  const valid=form.patientId&&form.footType;
  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal" style={{width:560,maxHeight:"93vh",overflow:"auto"}} onClick={e=>e.stopPropagation()}>
        <div style={{background:"linear-gradient(135deg,#1e3a5f,#2563eb)",padding:"18px 24px",borderRadius:"18px 18px 0 0",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div style={{fontFamily:"'DM Serif Display',serif",fontSize:18,color:"#fff"}}>🦶 {isAdd?"Новая диагностика Podiatech":"Редактирование"}</div>
          <button className="btn" onClick={onClose} style={{background:"rgba(255,255,255,.15)",color:"#fff",padding:"5px 11px"}}>✕</button>
        </div>
        <div style={{padding:"20px 24px",display:"flex",flexDirection:"column",gap:12}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <div className="field"><label>Пациент *</label>
              <select value={form.patientId||""} onChange={e=>s("patientId",+e.target.value)}>
                <option value="">— выбрать —</option>
                {[...patients].sort((a,b)=>a.lastName.localeCompare(b.lastName,"uk")).map(p=><option key={p.id} value={p.id}>{fullName(p)}</option>)}
              </select>
            </div>
            <div className="field"><label>Дата діагностики</label><input type="date" value={form.date||""} onChange={e=>s("date",e.target.value)}/></div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <div className="field"><label>Тип стопы *</label>
              <select value={form.footType||""} onChange={e=>s("footType",e.target.value)}>
                <option value="">— выбрать —</option>
                {FOOT_TYPES.map(f=><option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div className="field"><label>Индекс свода</label><input value={form.archIndex||""} onChange={e=>s("archIndex",e.target.value)} placeholder="0.00 – 1.00"/></div>
          </div>
          <div style={{display:"flex",gap:12,alignItems:"center"}}>
            <label style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",fontSize:14}}>
              <input type="checkbox" checked={form.halluxValgus||false} onChange={e=>s("halluxValgus",e.target.checked)} style={{width:18,height:18,accentColor:"#0e7c6b"}}/>
              Hallux Valgus
            </label>
          </div>
          <div className="field"><label>Результаты барографии / подоскопии</label><textarea rows={3} value={form.pressureNotes||""} onChange={e=>s("pressureNotes",e.target.value)} placeholder="Распределение давления, зоны перегрузки…" style={{resize:"vertical"}}/></div>
          <div style={{background:"#eff6ff",border:"1px solid #bfdbfe",borderRadius:10,padding:"12px 14px"}}>
            <div style={{fontSize:11,fontWeight:700,color:"#1e40af",marginBottom:8,textTransform:"uppercase",letterSpacing:".06em"}}>🥿 Ортопедичні стельки</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              <div className="field"><label>Статус стелек</label>
                <select value={form.insoleStatus||"ordered"} onChange={e=>s("insoleStatus",e.target.value)}>
                  {Object.entries(INSOLE_STATUSES).map(([k,v])=><option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div className="field"><label>Дата готовности / видачі</label><input type="date" value={form.insoleDeliveryDate||""} onChange={e=>s("insoleDeliveryDate",e.target.value)}/></div>
            </div>
          </div>
          <div className="field"><label>Рекомендации / примечания</label><textarea rows={2} value={form.notes||""} onChange={e=>s("notes",e.target.value)} placeholder="Тип коррекции, особенности…" style={{resize:"vertical"}}/></div>
          <div style={{display:"flex",gap:10,marginTop:4}}>
            <button className="btn" onClick={()=>valid&&onSave(form)} disabled={!valid} style={{flex:1,background:valid?"#2563eb":"#e2e8f0",color:valid?"#fff":"#94a3b8",padding:"12px",fontSize:15}}>{isAdd?"🦶 Сохранить діагностику":"💾 Сохранить"}</button>
            <button className="btn" onClick={onClose} style={{background:"#f1f5f9",color:"#475569",padding:"12px 20px"}}>Отменить</button>
          </div>
        </div>
      </div>
    </div>
  );
}


// ═══════════════════════════════════════════
// DOCTOR FORM
// ═══════════════════════════════════════════
function DoctorForm({form,setForm,isAdd,onSave,onClose}) {
  const s=(k,v)=>setForm(f=>({...f,[k]:v}));
  const toggleDay = (day) => setForm(f=>({...f, schedule: f.schedule.includes(day) ? f.schedule.filter(d=>d!==day) : [...f.schedule, day] }));
  const valid=form.name?.trim();
  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal" style={{width:520,maxHeight:"93vh",overflow:"auto"}} onClick={e=>e.stopPropagation()}>
        <div style={{background:"linear-gradient(135deg,#1e3a5f,#0e7c6b)",padding:"18px 24px",borderRadius:"18px 18px 0 0",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div style={{fontFamily:"'DM Serif Display',serif",fontSize:18,color:"#fff"}}>👨‍⚕️ {isAdd?"Новый специалист":"Редактирование специалиста"}</div>
          <button className="btn" onClick={onClose} style={{background:"rgba(255,255,255,.15)",color:"#fff",padding:"5px 11px"}}>✕</button>
        </div>
        <div style={{padding:"20px 24px",display:"flex",flexDirection:"column",gap:12}}>
          <div className="field"><label>ФИО *</label><input value={form.name||""} onChange={e=>s("name",e.target.value)} placeholder="Фамилия Имя Отчество"/></div>
          <div className="field"><label>Специализация</label>
            <select value={form.specialization||""} onChange={e=>s("specialization",e.target.value)}>
              <option value="">— выбрать —</option>
              {SPECIALIZATIONS.map(sp=><option key={sp} value={sp}>{sp}</option>)}
            </select>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <div className="field"><label>Телефон</label><input value={form.phone||""} onChange={e=>s("phone",e.target.value)} placeholder="+77001112233"/></div>
            <div className="field"><label>Email</label><input type="email" value={form.email||""} onChange={e=>s("email",e.target.value)} placeholder="doctor@atlant.kz"/></div>
          </div>
          <div style={{background:"#f0fdf4",border:"1px solid #bbf7d0",borderRadius:10,padding:"12px 14px"}}>
            <div style={{fontSize:11,fontWeight:700,color:"#166534",marginBottom:10,textTransform:"uppercase",letterSpacing:".06em"}}>📅 График роботи</div>
            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
              {WEEKDAYS.map(day=>(
                <button key={day} className="btn" onClick={()=>toggleDay(day)} style={{
                  padding:"8px 14px",fontSize:13,fontWeight:600,
                  background:form.schedule?.includes(day)?"#0e7c6b":"#f1f5f9",
                  color:form.schedule?.includes(day)?"#fff":"#64748b",
                  border:form.schedule?.includes(day)?"2px solid #0e7c6b":"2px solid #e2e8f0",
                  borderRadius:8,minWidth:42,textAlign:"center"
                }}>{day}</button>
              ))}
            </div>
          </div>
          <div className="field"><label>Примечания</label><textarea rows={2} value={form.notes||""} onChange={e=>s("notes",e.target.value)} placeholder="Дополнительная информация…" style={{resize:"vertical"}}/></div>
          <div style={{display:"flex",gap:10,marginTop:4}}>
            <button className="btn" onClick={()=>valid&&onSave(form)} disabled={!valid} style={{flex:1,background:valid?"#0e7c6b":"#e2e8f0",color:valid?"#fff":"#94a3b8",padding:"12px",fontSize:15}}>{isAdd?"👨‍⚕️ Добавить специалиста":"💾 Сохранить"}</button>
            <button className="btn" onClick={onClose} style={{background:"#f1f5f9",color:"#475569",padding:"12px 20px"}}>Отменить</button>
          </div>
        </div>
      </div>
    </div>
  );
}


// ═══════════════════════════════════════════
// STOCK OPERATION FORM
// ═══════════════════════════════════════════
function StockOpForm({form,setForm,patients,stock,onSave,onClose}) {
  const s=(k,v)=>setForm(f=>({...f,[k]:v}));
  const valid=form.insoleType&&form.size&&form.qty>0;
  const isOut = form.opType==="out";
  const available = isOut ? (stock.find(st=>st.type===form.insoleType&&st.size===+form.size)?.qty||0) : null;
  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal" style={{width:520,maxHeight:"93vh",overflow:"auto"}} onClick={e=>e.stopPropagation()}>
        <div style={{background:isOut?"linear-gradient(135deg,#7c2d12,#ea580c)":"linear-gradient(135deg,#064e3b,#0e7c6b)",padding:"18px 24px",borderRadius:"18px 18px 0 0",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div style={{fontFamily:"'DM Serif Display',serif",fontSize:18,color:"#fff"}}>{isOut?"📤 Выдача стелек":"📥 Приход стелек"}</div>
          <button className="btn" onClick={onClose} style={{background:"rgba(255,255,255,.15)",color:"#fff",padding:"5px 11px"}}>✕</button>
        </div>
        <div style={{padding:"20px 24px",display:"flex",flexDirection:"column",gap:12}}>
          <div style={{display:"flex",gap:8,marginBottom:4}}>
            <button className="btn" onClick={()=>s("opType","in")} style={{flex:1,padding:"10px",background:!isOut?"#0e7c6b":"#f1f5f9",color:!isOut?"#fff":"#475569",fontSize:14}}>📥 Приход</button>
            <button className="btn" onClick={()=>s("opType","out")} style={{flex:1,padding:"10px",background:isOut?"#ea580c":"#f1f5f9",color:isOut?"#fff":"#475569",fontSize:14}}>📤 Выдача</button>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <div className="field"><label>Тип стельки *</label>
              <select value={form.insoleType||""} onChange={e=>s("insoleType",e.target.value)}>
                <option value="">— выбрать —</option>
                {INSOLE_TYPES.map(t=><option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="field"><label>Размер *</label>
              <select value={form.size||""} onChange={e=>s("size",+e.target.value)}>
                <option value="">— выбрать —</option>
                {INSOLE_SIZES.map(sz=><option key={sz} value={sz}>{sz}</option>)}
              </select>
            </div>
          </div>
          {isOut&&form.insoleType&&form.size&&(
            <div style={{background:available>0?"#f0fdf4":"#fef2f2",border:`1px solid ${available>0?"#bbf7d0":"#fca5a5"}`,borderRadius:10,padding:"8px 14px",fontSize:13,color:available>0?"#166534":"#dc2626",fontWeight:600}}>
              На складе: {available} шт.{available===0&&" ⚠️ Нет в наличии!"}
            </div>
          )}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12}}>
            <div className="field"><label>Количество *</label><input type="number" min={1} max={isOut?available||999:999} value={form.qty||""} onChange={e=>s("qty",+e.target.value)}/></div>
            {!isOut&&<><div className="field"><label>Собістоимость (₸)</label><input type="number" min={0} value={form.cost||""} onChange={e=>s("cost",+e.target.value)} placeholder="0"/></div>
            <div className="field"><label>Цена для пац. (₸)</label><input type="number" min={0} value={form.price||""} onChange={e=>s("price",+e.target.value)} placeholder="0"/></div></>}
          </div>
          {isOut&&(
            <div className="field"><label>Пациент (необязательно)</label>
              <select value={form.patientId||""} onChange={e=>s("patientId",e.target.value?+e.target.value:"")}>
                <option value="">— без привязки —</option>
                {[...patients].sort((a,b)=>a.lastName.localeCompare(b.lastName,"uk")).map(p=><option key={p.id} value={p.id}>{p.lastName} {p.firstName}</option>)}
              </select>
            </div>
          )}
          <div className="field"><label>Дата</label><input type="date" value={form.date||""} onChange={e=>s("date",e.target.value)}/></div>
          <div className="field"><label>Примечания</label><input value={form.notes||""} onChange={e=>s("notes",e.target.value)} placeholder="Модель, артикул, партия…"/></div>
          <div style={{display:"flex",gap:10,marginTop:4}}>
            <button className="btn" onClick={()=>valid&&onSave(form)} disabled={!valid||(isOut&&form.qty>available)} style={{flex:1,background:valid&&!(isOut&&form.qty>available)?isOut?"#ea580c":"#0e7c6b":"#e2e8f0",color:valid?"#fff":"#94a3b8",padding:"12px",fontSize:15}}>{isOut?"📤 Оформить видачу":"📥 Оформить приход"}</button>
            <button className="btn" onClick={onClose} style={{background:"#f1f5f9",color:"#475569",padding:"12px 20px"}}>Отменить</button>
          </div>
        </div>
      </div>
    </div>
  );
}


// ═══════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════

// ═══════════════════════════════════════════
// DISCHARGE SUMMARY MODAL (Выписной эпикриз)
// ═══════════════════════════════════════════
function DischargeSummaryModal({ patient, protocols, appointments, procCatalog, onClose }) {
  const [recommendations, setRecommendations] = useState(patient.notes || "");
  const [improvement, setImprovement] = useState(5);
  const [nextVisitDate, setNextVisitDate] = useState(patient.nextVisitDate || "");
  const [nextVisitNote, setNextVisitNote] = useState(patient.nextVisitNote || "");

  const patProtocols = protocols.filter(pr => pr.patientId === patient.id || pr.patientId === String(patient.id));
  const patAppts = appointments.filter(a => (a.patientId === patient.id || a.patientId === String(patient.id)) && a.status === "done").sort((a,b)=>a.date.localeCompare(b.date));

  const completedProcedures = [];
  patProtocols.forEach(pr => {
    pr.procedures.forEach(proc => {
      if (proc.completedSessions > 0) {
        const cat = procCatalog.find(c=>c.name===proc.procedureName);
        completedProcedures.push({ name:proc.procedureName, sessions:proc.completedSessions, total:proc.totalSessions, notes:proc.notes, medications:proc.medications||[], icon:cat?.icon||"📋", color:cat?.color||"#64748b", price:cat?.price||0 });
      }
    });
  });

  const improvLabels = ["","Без изменений","Незначительное улучшение","Небольшое улучшение","Умеренное улучшение","Заметное улучшение","Хорошее улучшение","Значительное улучшение","Существенное улучшение","Выраженное улучшение","Полное восстановление"];
  const improvColors = ["","#dc2626","#f97316","#f59e0b","#eab308","#84cc16","#22c55e","#16a34a","#15803d","#166534","#0e7c6b"];

  const handlePrint = () => window.print();

  const handlePDF = () => {
    const printCSS = `
      @media print {
        body > *:not(.discharge-print-wrapper) { display: none !important; }
        .discharge-print-wrapper { display: block !important; position: fixed; inset: 0; background: white; z-index: 9999; overflow: auto; padding: 20px; }
        .no-print { display: none !important; }
        @page { margin: 15mm; }
      }
    `;
    const style = document.createElement('style');
    style.textContent = printCSS;
    document.head.appendChild(style);
    window.print();
    setTimeout(() => document.head.removeChild(style), 1000);
  };

  return (
    <div className="modal-bg no-print" onClick={onClose}>
      <div className="modal" style={{width:760,maxHeight:"95vh",overflow:"auto"}} onClick={e=>e.stopPropagation()}>
        <div style={{background:"linear-gradient(135deg,#042f2e,#064e3b,#0e7c6b)",padding:"18px 24px",borderRadius:"18px 18px 0 0",display:"flex",justifyContent:"space-between",alignItems:"center"}} className="no-print">
          <div>
            <div style={{fontFamily:"'DM Serif Display',serif",fontSize:18,color:"#fff"}}>📄 Выписной эпикриз</div>
            <div style={{color:"rgba(255,255,255,.65)",fontSize:13,marginTop:2}}>{fullName(patient)}</div>
          </div>
          <div style={{display:"flex",gap:8}}>
            <button className="btn" onClick={handlePrint} style={{background:"#fff",color:"#064e3b",padding:"8px 16px",fontWeight:700}}>🖨️ Печать</button>
            <button className="btn" onClick={handlePDF} style={{background:"rgba(255,255,255,.2)",color:"#fff",padding:"8px 16px",fontWeight:700}}>📥 PDF</button>
            <button className="btn" onClick={onClose} style={{background:"rgba(255,255,255,.15)",color:"#fff",padding:"5px 11px"}}>✕</button>
          </div>
        </div>

        {/* Settings panel */}
        <div style={{padding:"16px 24px",background:"#f8fafc",borderBottom:"1px solid #e2e8f0"}} className="no-print">
          <div style={{fontSize:11,fontWeight:700,color:"#64748b",marginBottom:10,textTransform:"uppercase",letterSpacing:".06em"}}>⚙️ Параметры выписки</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12}}>
            <div className="field"><label>Дата повторной консультации</label><input type="date" value={nextVisitDate} onChange={e=>setNextVisitDate(e.target.value)} style={{width:"100%",padding:"8px 10px",border:"1.5px solid #dde4ef",borderRadius:8,fontSize:13,outline:"none"}}/></div>
            <div className="field"><label>Цель консультации</label><input value={nextVisitNote} onChange={e=>setNextVisitNote(e.target.value)} placeholder="Контроль, продолжение..." style={{width:"100%",padding:"8px 10px",border:"1.5px solid #dde4ef",borderRadius:8,fontSize:13,outline:"none"}}/></div>
            <div>
              <label style={{display:"block",fontSize:11,fontWeight:700,color:"#64748b",marginBottom:4,textTransform:"uppercase"}}>Шкала улучшения (1–10)</label>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <input type="range" min={1} max={10} value={improvement} onChange={e=>setImprovement(+e.target.value)} style={{flex:1,accentColor:improvColors[improvement]}}/>
                <span style={{fontWeight:800,color:improvColors[improvement],fontSize:18,minWidth:22}}>{improvement}</span>
              </div>
              <div style={{fontSize:11,color:improvColors[improvement],fontWeight:600}}>{improvLabels[improvement]}</div>
            </div>
          </div>
          <div style={{marginTop:12}}>
            <label style={{display:"block",fontSize:11,fontWeight:700,color:"#64748b",marginBottom:4,textTransform:"uppercase"}}>Рекомендации врача</label>
            <textarea rows={3} value={recommendations} onChange={e=>setRecommendations(e.target.value)} placeholder="Рекомендации по лечению, образу жизни, повторной консультации..." style={{width:"100%",padding:"8px 10px",border:"1.5px solid #dde4ef",borderRadius:8,fontSize:13,outline:"none",resize:"vertical"}}/>
          </div>
        </div>

        {/* PRINTABLE DISCHARGE DOCUMENT */}
        <div className="discharge-print-wrapper" style={{padding:"28px 32px"}}>
          {/* Header */}
          <div style={{textAlign:"center",marginBottom:24,borderBottom:"2px solid #0e7c6b",paddingBottom:16}}>
            <div style={{fontFamily:"'DM Serif Display',serif",fontSize:26,color:"#042f2e"}}>🏥 Atlant Clinic</div>
            <div style={{fontSize:14,color:"#64748b",marginTop:4,fontWeight:600}}>ВЫПИСНОЙ ЭПИКРИЗ</div>
            <div style={{fontSize:12,color:"#94a3b8",marginTop:2}}>Дата выдачи: {fmt(today())}</div>
          </div>

          {/* Patient */}
          <div style={{background:"#f0fdf4",border:"1px solid #bbf7d0",borderRadius:12,padding:"16px 20px",marginBottom:20}}>
            <div style={{fontSize:11,fontWeight:700,color:"#166534",marginBottom:12,textTransform:"uppercase",letterSpacing:".06em"}}>👤 Данные пациента</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
              {[
                ["ФИО", fullName(patient)],
                ["Дата рождения", fmt(patient.dob) + (patient.dob ? ` (${calcAge(patient.dob)})` : "")],
                ["Телефон", patient.phone || "—"],
                ["ИИН", patient.iin || "—"],
                ...(patient.passportNumber ? [["Паспорт", `${patient.passportSeries||""} ${patient.passportNumber}`.trim()]] : []),
                ["Лечащий врач", patient.doctor || "—"],
                ["Дата поступления", fmt(patient.admissionDate || patient.lastVisit)],
                ["Последний визит", fmt(patient.lastVisit)],
                ["Статус", {active:"Наблюдается",discharged:"Выписан",referred:"Направлен"}[patient.status] || patient.status],
              ].map(([label, value]) => (
                <div key={label} style={{display:"flex",gap:6,fontSize:13}}>
                  <span style={{fontWeight:700,color:"#166534",minWidth:140}}>{label}:</span>
                  <span>{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Diagnosis */}
          <div style={{background:"#eff6ff",border:"1px solid #bfdbfe",borderRadius:12,padding:"14px 20px",marginBottom:20}}>
            <div style={{fontSize:11,fontWeight:700,color:"#1e40af",marginBottom:8,textTransform:"uppercase",letterSpacing:".06em"}}>🩺 Диагноз</div>
            <div style={{fontSize:17,fontWeight:700,color:"#1e3a5f"}}>{patient.diagnosis || "—"}</div>
          </div>

          {/* Procedures */}
          {completedProcedures.length > 0 && (
            <div style={{marginBottom:20}}>
              <div style={{fontSize:12,fontWeight:700,color:"#0e7c6b",marginBottom:12,textTransform:"uppercase",letterSpacing:".06em"}}>⚕️ Проведённые процедуры</div>
              <table style={{width:"100%",borderCollapse:"collapse",border:"1px solid #e2e8f0",borderRadius:10,overflow:"hidden"}}>
                <thead>
                  <tr style={{background:"#f0fdf4"}}>
                    {["Процедура","Выполнено","Препараты","Примечания","Стоимость"].map(h=>(
                      <th key={h} style={{padding:"8px 12px",textAlign:"left",fontSize:11,fontWeight:700,color:"#166534",borderBottom:"1px solid #e2e8f0"}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {completedProcedures.map((proc,i)=>(
                    <tr key={i} style={{borderBottom:"1px solid #f0f4f8",background:i%2?"#fff":"#fafffe"}}>
                      <td style={{padding:"7px 12px",fontSize:13,fontWeight:600}}><span style={{color:proc.color}}>{proc.icon}</span> {proc.name}</td>
                      <td style={{padding:"7px 12px",fontSize:13}}><b style={{color:"#0e7c6b"}}>{proc.sessions}</b><span style={{color:"#94a3b8"}}>/{proc.total}</span></td>
                      <td style={{padding:"7px 12px",fontSize:12,color:"#475569"}}>{proc.medications.length>0?proc.medications.join(", "):"—"}</td>
                      <td style={{padding:"7px 12px",fontSize:12,color:"#64748b"}}>{proc.notes||"—"}</td>
                      <td style={{padding:"7px 12px",fontSize:12,color:"#0e7c6b",fontWeight:600}}>{proc.price?`${(proc.price*proc.sessions).toLocaleString()} ₸`:"—"}</td>
                    </tr>
                  ))}
                  {completedProcedures.some(p=>p.price>0)&&(
                    <tr style={{background:"#f0fdf4",borderTop:"2px solid #bbf7d0"}}>
                      <td colSpan={4} style={{padding:"8px 12px",fontWeight:700,fontSize:13,textAlign:"right"}}>Итого:</td>
                      <td style={{padding:"8px 12px",fontWeight:800,fontSize:14,color:"#0e7c6b"}}>{completedProcedures.reduce((s,p)=>s+(p.price*p.sessions),0).toLocaleString()} ₸</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Visit history */}
          {patAppts.length > 0 && (
            <div style={{marginBottom:20}}>
              <div style={{fontSize:12,fontWeight:700,color:"#2563eb",marginBottom:10,textTransform:"uppercase",letterSpacing:".06em"}}>📅 История посещений</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                {patAppts.map(a=>(
                  <div key={a.id} style={{background:"#eff6ff",border:"1px solid #bfdbfe",borderRadius:8,padding:"5px 12px",fontSize:12}}>
                    <b style={{color:"#1e40af"}}>{fmt(a.date)}</b>{a.time?` ${a.time}`:""} — {a.type}{a.notes?` · ${a.notes}`:""}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Improvement scale */}
          <div style={{background:"#f0fdf4",border:"1px solid #bbf7d0",borderRadius:12,padding:"14px 20px",marginBottom:20}}>
            <div style={{fontSize:11,fontWeight:700,color:"#166534",marginBottom:10,textTransform:"uppercase",letterSpacing:".06em"}}>📊 Шкала улучшения состояния</div>
            <div style={{display:"flex",alignItems:"center",gap:16}}>
              <div style={{flex:1}}>
                <div style={{height:14,borderRadius:7,background:"#e2e8f0",overflow:"hidden"}}>
                  <div style={{height:"100%",width:`${improvement*10}%`,background:`linear-gradient(90deg,#ef4444,${improvColors[improvement]})`,borderRadius:7}}/>
                </div>
                <div style={{display:"flex",justifyContent:"space-between",marginTop:4,fontSize:10,color:"#94a3b8"}}><span>1 — Без изменений</span><span>10 — Полное восстановление</span></div>
              </div>
              <div style={{textAlign:"center",minWidth:56}}>
                <div style={{fontSize:36,fontWeight:800,color:improvColors[improvement]}}>{improvement}</div>
                <div style={{fontSize:11,color:"#94a3b8",fontWeight:600}}>/10</div>
              </div>
            </div>
            <div style={{marginTop:8,fontSize:15,fontWeight:700,color:improvColors[improvement]}}>{improvLabels[improvement]}</div>
          </div>

          {/* Recommendations */}
          {recommendations && (
            <div style={{background:"#fefce8",border:"1px solid #fde68a",borderRadius:12,padding:"14px 20px",marginBottom:20}}>
              <div style={{fontSize:11,fontWeight:700,color:"#92400e",marginBottom:8,textTransform:"uppercase",letterSpacing:".06em"}}>📋 Рекомендации врача</div>
              <div style={{fontSize:14,lineHeight:1.8,color:"#1a2332",whiteSpace:"pre-wrap"}}>{recommendations}</div>
            </div>
          )}

          {/* Next visit */}
          {nextVisitDate && (
            <div style={{background:"#eff6ff",border:"2px solid #3b82f6",borderRadius:12,padding:"14px 20px",marginBottom:20}}>
              <div style={{fontSize:11,fontWeight:700,color:"#1e40af",marginBottom:8,textTransform:"uppercase",letterSpacing:".06em"}}>🗓 Повторная консультация</div>
              <div style={{fontSize:20,fontWeight:700,color:"#1e3a5f"}}>{fmt(nextVisitDate)}</div>
              {nextVisitNote && <div style={{fontSize:14,color:"#475569",marginTop:4}}>{nextVisitNote}</div>}
            </div>
          )}

          {/* Signature */}
          <div style={{borderTop:"1px solid #e2e8f0",paddingTop:16,display:"flex",justifyContent:"space-between",alignItems:"flex-end"}}>
            <div style={{fontSize:12,color:"#64748b"}}>
              <div>Врач: <b>{patient.doctor||"—"}</b></div>
              <div style={{marginTop:4}}>Дата: {fmt(today())}</div>
            </div>
            <div style={{textAlign:"right"}}>
              <div style={{fontSize:11,color:"#94a3b8",marginBottom:24}}>Подпись врача:</div>
              <div style={{borderBottom:"1px solid #475569",width:200,marginBottom:4}}/>
              <div style={{fontSize:11,color:"#94a3b8"}}>М.П. / Печать</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MedKarta({ supabase, session, profile }) {
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [protocols, setProtocols] = useState([]);
  const [podiatech, setPodiatech] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [stock, setStock] = useState([]);
  const [stockLog, setStockLog] = useState([]);
  const [procCatalog, setProcCatalog] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [tab, setTab] = useState("patients");
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterDoctor, setFilterDoctor] = useState("all");
  const [apptDate, setApptDate] = useState(today());
  const [modal, setModal] = useState(null);
  const [editPat, setEditPat] = useState(null);
  const [editAppt, setEditAppt] = useState(null);
  const [editProtocol, setEditProtocol] = useState(null);
  const [editPodiatech, setEditPodiatech] = useState(null);
  const [editDoctor, setEditDoctor] = useState(null);
  const [editStockOp, setEditStockOp] = useState(null);
  const [editProc, setEditProc] = useState(null);
  const [viewPat, setViewPat] = useState(null);
  const [messengerPat, setMessengerPat] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [toast, setToast] = useState(null);
  const [sortBy, setSortBy] = useState("lastName");
  const [timelinePat, setTimelinePat] = useState(null);
  const [podiatechSubTab, setPodiatechSubTab] = useState("diag");
  const [protocolSubTab, setProtocolSubTab] = useState("protocols");

  const doctorNames = useMemo(() => doctors.map(d => d.name), [doctors]);

  // ─── Storage: Supabase (primary) with localStorage fallback ───
  const [usingSupabase, setUsingSupabase] = useState(false);

  const loadLocal = (key, fallback) => {
    try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
  };
  const saveLocal = (key, data) => {
    try { localStorage.setItem(key, JSON.stringify(data)); } catch(e) { console.error(e); }
  };

  // Map Supabase row → local state
  const mapPat = (r) => ({ id:r.id, lastName:r.last_name, firstName:r.first_name, patronymic:r.patronymic||"", dob:r.dob||"", phone:r.phone||"", diagnosis:r.diagnosis||"", doctor:r.doctor||"", status:r.status||"active", lastVisit:r.last_visit||"", notes:r.notes||"", nextVisitDate:r.next_visit_date||"", nextVisitNote:r.next_visit_note||"", admissionDate:r.admission_date||"", passportSeries:r.passport_series||"", passportNumber:r.passport_number||"", passportIssued:r.passport_issued||"", iin:r.iin||"" });
  const mapAppt = (r) => ({ id:r.id, patientId:r.patient_id, doctor:r.doctor||"", date:r.date||"", time:r.time||"", type:r.type||"Первичный приём", status:r.status||"scheduled", notes:r.notes||"" });
  const mapProto = (r) => ({ id:r.id, patientId:r.patient_id, name:r.name||"", procedures:r.procedures||[], startDate:r.start_date||"", status:r.status||"active", doctor:r.doctor||"", diagnosis:r.diagnosis||"" });
  const mapDoc = (r) => ({ id:r.id, name:r.name||"", specialization:r.specialization||"", phone:r.phone||"", email:r.email||"", schedule:r.schedule||[], notes:r.notes||"" });
  const mapPodio = (r) => ({ id:r.id, patientId:r.patient_id, date:r.date||"", footType:r.foot_type||"", halluxValgus:r.hallux_valgus||false, archIndex:r.arch_index||"", pressureNotes:r.pressure_notes||"", insoleStatus:r.insole_status||"ordered", insoleDeliveryDate:r.insole_delivery_date||"", notes:r.notes||"" });
  const mapStock_ = (r) => ({ id:r.id, type:r.type||"", size:r.size||0, cost:r.cost||0, price:r.price||0, qty:r.qty||0, notes:r.notes||"" });
  const mapStockLog_ = (r) => ({ id:r.id, date:r.date||"", opType:r.op_type||"in", insoleType:r.insole_type||"", size:r.size||0, qty:r.qty||0, cost:r.cost||0, price:r.price||0, patientId:r.patient_id||null, notes:r.notes||"" });
  const mapProc_ = (r) => ({ id:r.id, name:r.name||"", category:r.category||"Другое", icon:r.icon||"📋", color:r.color||"#64748b", defaultSessions:r.default_sessions||5, price:r.price||0 });

  // Load from Supabase, fallback to localStorage
  useEffect(() => {
    const loadFromSupabase = async () => {
      if (!supabase) return false;
      try {
        const [pR,aR,prR,dR,poR,stR,slR,pcR] = await Promise.all([
          supabase.from("patients").select("*").order("last_name"),
          supabase.from("appointments").select("*").order("date",{ascending:false}),
          supabase.from("protocols").select("*").order("created_at",{ascending:false}),
          supabase.from("doctors").select("*").order("name"),
          supabase.from("podiatech").select("*").order("date",{ascending:false}),
          supabase.from("insole_stock").select("*"),
          supabase.from("insole_stock_log").select("*").order("date",{ascending:false}),
          supabase.from("procedure_catalog").select("*").order("name"),
        ]);
        if (pR.error) return false;
        setPatients((pR.data||[]).map(mapPat));
        setAppointments((aR.data||[]).map(mapAppt));
        setProtocols((prR.data||[]).map(mapProto));
        setDoctors((dR.data||[]).map(mapDoc));
        setPodiatech((poR.data||[]).map(mapPodio));
        setStock((stR.data||[]).map(mapStock_));
        setStockLog((slR.data||[]).map(mapStockLog_));
        setProcCatalog((pcR.data||[]).length>0?(pcR.data||[]).map(mapProc_):SAMPLE_PROCEDURES);
        return true;
      } catch(e) { console.error("Supabase load error:", e); return false; }
    };
    loadFromSupabase().then(ok => {
      if (ok) {
        setUsingSupabase(true);
      } else {
        setPatients(loadLocal("mk2_patients", SAMPLE_PATIENTS));
        setAppointments(loadLocal("mk2_appts", SAMPLE_APPTS));
        setProtocols(loadLocal("mk2_protocols", SAMPLE_PROTOCOLS));
        setPodiatech(loadLocal("mk2_podiatech", SAMPLE_PODIATECH));
        setDoctors(loadLocal("mk2_doctors", SAMPLE_DOCTORS));
        setStock(loadLocal("mk2_stock", SAMPLE_STOCK));
        setStockLog(loadLocal("mk2_stocklog", SAMPLE_STOCK_LOG));
        setProcCatalog(loadLocal("mk2_proccatalog", SAMPLE_PROCEDURES));
      }
      setLoaded(true);
    });
  }, []);

  // Real-time subscriptions (Supabase only)
  useEffect(() => {
    if (!usingSupabase || !supabase) return;
    const chs = [];
    const sub = (table, cb) => {
      const ch = supabase.channel(`rt:${table}`).on("postgres_changes",{event:"*",schema:"public",table},cb).subscribe();
      chs.push(ch);
    };
    sub("patients", async () => { const {data}=await supabase.from("patients").select("*").order("last_name"); if(data) setPatients(data.map(mapPat)); });
    sub("appointments", async () => { const {data}=await supabase.from("appointments").select("*").order("date",{ascending:false}); if(data) setAppointments(data.map(mapAppt)); });
    sub("protocols", async () => { const {data}=await supabase.from("protocols").select("*").order("created_at",{ascending:false}); if(data) setProtocols(data.map(mapProto)); });
    sub("doctors", async () => { const {data}=await supabase.from("doctors").select("*").order("name"); if(data) setDoctors(data.map(mapDoc)); });
    sub("podiatech", async () => { const {data}=await supabase.from("podiatech").select("*").order("date",{ascending:false}); if(data) setPodiatech(data.map(mapPodio)); });
    sub("insole_stock", async () => { const {data}=await supabase.from("insole_stock").select("*"); if(data) setStock(data.map(mapStock_)); });
    return () => chs.forEach(ch => supabase.removeChannel(ch));
  }, [usingSupabase]);

  // Save to localStorage when NOT using Supabase
  useEffect(() => {
    if (!loaded || usingSupabase) return;
    saveLocal("mk2_patients", patients);
    saveLocal("mk2_appts", appointments);
    saveLocal("mk2_protocols", protocols);
    saveLocal("mk2_podiatech", podiatech);
    saveLocal("mk2_doctors", doctors);
    saveLocal("mk2_stock", stock);
    saveLocal("mk2_stocklog", stockLog);
    saveLocal("mk2_proccatalog", procCatalog);
  }, [patients, appointments, protocols, podiatech, doctors, stock, stockLog, procCatalog, loaded, usingSupabase]);

  // ─── Email notification on appointment creation ───
  const sendApptEmail = async (appt, patient) => {
    const doc = doctors.find(d => d.name === appt.doctor);
    if (!doc?.email) return;
    const patName = patient ? `${patient.lastName} ${patient.firstName} ${patient.patronymic||""}`.trim() : "Неизвестный";
    try {
      await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: doc.email,
          subject: `📅 Новая запись: ${patName} — ${fmt(appt.date)} ${appt.time||""}`,
          html: `
            <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden">
              <div style="background:linear-gradient(135deg,#042f2e,#0e7c6b);padding:20px 24px;color:#fff">
                <h2 style="margin:0;font-size:18px">🏥 Atlant Clinic — Новый запись</h2>
              </div>
              <div style="padding:20px 24px">
                <p style="margin:0 0 12px"><strong>Пациент:</strong> ${patName}</p>
                <p style="margin:0 0 12px"><strong>Дата:</strong> ${fmt(appt.date)}</p>
                <p style="margin:0 0 12px"><strong>Час:</strong> ${appt.time || "не указано"}</p>
                <p style="margin:0 0 12px"><strong>Тип:</strong> ${appt.type}</p>
                ${appt.notes ? `<p style="margin:0 0 12px"><strong>Примечания:</strong> ${appt.notes}</p>` : ""}
                ${patient?.phone ? `<p style="margin:0 0 12px"><strong>Телефон:</strong> ${formatPhone(patient.phone)}</p>` : ""}
                ${patient?.diagnosis ? `<p style="margin:0 0 12px"><strong>Диагноз:</strong> ${patient.diagnosis}</p>` : ""}
              </div>
              <div style="padding:12px 24px;background:#f0f2f5;font-size:12px;color:#64748b">
                Автоматическое уведомление от МедКарта
              </div>
            </div>
          `,
        }),
      });
    } catch (e) { console.error('Email send failed:', e); }
  };

  const showToast = (msg, type="success") => { setToast({msg,type}); setTimeout(()=>setToast(null),3000); };

  const reminders = useMemo(() => patients
    .filter(p=>p.nextVisitDate)
    .map(p=>({ patient:p, days:daysUntil(p.nextVisitDate) }))
    .filter(r=>r.days!==null && r.days<=14)
    .sort((a,b)=>a.days-b.days), [patients]);
  const urgentCount = reminders.filter(r=>r.days<=3).length;

  const filteredPats = useMemo(() => {
    let list = patients.filter(p => {
      const q=search.toLowerCase();
      return (!q||fullName(p).toLowerCase().includes(q)||(p.diagnosis||"").toLowerCase().includes(q)||(p.phone||"").includes(q))
        && (filterStatus==="all"||p.status===filterStatus)
        && (filterDoctor==="all"||p.doctor===filterDoctor);
    });
    return [...list].sort((a,b)=>(a[sortBy]||"").localeCompare(b[sortBy]||"","uk"));
  }, [patients,search,filterStatus,filterDoctor,sortBy]);

  const getP = id => patients.find(p=>p.id===id);

  // ─── CRUD ───
  // ─── CRUD helpers (Supabase OR localStorage) ───────────────────────────
  const savePat = async (form) => {
    if (usingSupabase && supabase) {
      const row = { last_name:form.lastName, first_name:form.firstName, patronymic:form.patronymic||"", dob:form.dob||null, phone:form.phone||"", diagnosis:form.diagnosis||"", doctor:form.doctor||"", status:form.status||"active", last_visit:form.lastVisit||null, notes:form.notes||"", next_visit_date:form.nextVisitDate||null, next_visit_note:form.nextVisitNote||"", admission_date:form.admissionDate||null, passport_series:form.passportSeries||"", passport_number:form.passportNumber||"", passport_issued:form.passportIssued||"", iin:form.iin||"" };
      if (modal==="addPat") { const {data,error}=await supabase.from("patients").insert(row).select().single(); if(!error&&data) setPatients(prev=>[...prev,mapPat(data)]); }
      else { const {data,error}=await supabase.from("patients").update(row).eq("id",form.id).select().single(); if(!error&&data) setPatients(prev=>prev.map(p=>p.id===form.id?mapPat(data):p)); }
    } else {
      if (modal==="addPat") setPatients(prev=>[...prev,{...form,id:uid()}]);
      else setPatients(prev=>prev.map(p=>p.id===form.id?form:p));
    }
    setModal(null); showToast(modal==="addPat"?"Пациент добавлен":"Данные сохранены");
  };
  const deletePat = async (id) => {
    if (usingSupabase && supabase) await supabase.from("patients").delete().eq("id",id);
    setPatients(prev=>prev.filter(p=>p.id!==id));
    setAppointments(prev=>prev.filter(a=>a.patientId!==id));
    setProtocols(prev=>prev.filter(p=>p.patientId!==id));
    setPodiatech(prev=>prev.filter(p=>p.patientId!==id));
    setDeleteTarget(null); setModal(null); setViewPat(null);
    showToast("Пациент удалён","error");
  };
  const saveAppt = async (form) => {
    if (usingSupabase && supabase) {
      const row = { patient_id:form.patientId, doctor:form.doctor||"", date:form.date, time:form.time||null, type:form.type||"Первичный приём", status:form.status||"scheduled", notes:form.notes||"" };
      if (modal==="addAppt") { const {data,error}=await supabase.from("appointments").insert(row).select().single(); if(!error&&data){setAppointments(prev=>[...prev,mapAppt(data)]); const patient=patients.find(p=>p.id===form.patientId); sendApptEmail(form,patient);} }
      else { const {data,error}=await supabase.from("appointments").update(row).eq("id",form.id).select().single(); if(!error&&data) setAppointments(prev=>prev.map(a=>a.id===form.id?mapAppt(data):a)); }
    } else {
      if (modal==="addAppt") { setAppointments(prev=>[...prev,{...form,id:uid()}]); const patient=patients.find(p=>p.id===form.patientId); sendApptEmail(form,patient); }
      else setAppointments(prev=>prev.map(a=>a.id===form.id?form:a));
    }
    setModal(null); showToast(modal==="addAppt"?"Запись создана":"Запись обновлена");
  };
  const deleteAppt = async (id) => { if(usingSupabase&&supabase) await supabase.from("appointments").delete().eq("id",id); setAppointments(prev=>prev.filter(a=>a.id!==id)); setDeleteTarget(null); showToast("Запись удалена","error"); };
  const changeApptStatus = async (id,status) => { if(usingSupabase&&supabase) await supabase.from("appointments").update({status}).eq("id",id); setAppointments(prev=>prev.map(a=>a.id===id?{...a,status}:a)); showToast("Статус обновлён"); };
  const saveProtocol = async (form) => {
    if (usingSupabase && supabase) {
      const row = { patient_id:form.patientId, name:form.name, procedures:form.procedures, start_date:form.startDate||null, status:form.status||"active", doctor:form.doctor||"", diagnosis:form.diagnosis||"" };
      if (modal==="addProtocol") { const {data,error}=await supabase.from("protocols").insert(row).select().single(); if(!error&&data) setProtocols(prev=>[...prev,mapProto(data)]); }
      else { const {data,error}=await supabase.from("protocols").update(row).eq("id",form.id).select().single(); if(!error&&data) setProtocols(prev=>prev.map(p=>p.id===form.id?mapProto(data):p)); }
    } else {
      if (modal==="addProtocol") setProtocols(prev=>[...prev,{...form,id:uid()}]);
      else setProtocols(prev=>prev.map(p=>p.id===form.id?form:p));
    }
    setModal(null); showToast(modal==="addProtocol"?"Протокол создан":"Протокол обновлён");
  };
  const deleteProtocol = async (id) => { if(usingSupabase&&supabase) await supabase.from("protocols").delete().eq("id",id); setProtocols(prev=>prev.filter(p=>p.id!==id)); setDeleteTarget(null); showToast("Протокол удалён","error"); };
  const savePodiatech = (form) => {
    if (modal==="addPodiatech") setPodiatech(prev=>[...prev,{...form,id:uid()}]);
    else setPodiatech(prev=>prev.map(p=>p.id===form.id?form:p));
    setModal(null); showToast(modal==="addPodiatech"?"Диагностика сохранена":"Данные обновлены");
  };
  const deletePodiatech = (id) => { setPodiatech(prev=>prev.filter(p=>p.id!==id)); setDeleteTarget(null); showToast("Запись удалена","error"); };
  const saveDoctor = async (form) => {
    if (usingSupabase && supabase) {
      const row={name:form.name,specialization:form.specialization||"",phone:form.phone||"",email:form.email||"",schedule:form.schedule||[],notes:form.notes||""};
      if(modal==="addDoctor"){const{data,error}=await supabase.from("doctors").insert(row).select().single();if(!error&&data)setDoctors(prev=>[...prev,mapDoc(data)]);}
      else{const{data,error}=await supabase.from("doctors").update(row).eq("id",form.id).select().single();if(!error&&data)setDoctors(prev=>prev.map(d=>d.id===form.id?mapDoc(data):d));}
    } else {
    if (modal==="addDoctor") setDoctors(prev=>[...prev,{...form,id:uid()}]);
    else {
      const old = doctors.find(d=>d.id===form.id);
      if (old && old.name !== form.name) {
        setPatients(prev=>prev.map(p=>p.doctor===old.name?{...p,doctor:form.name}:p));
        setAppointments(prev=>prev.map(a=>a.doctor===old.name?{...a,doctor:form.name}:a));
        setProtocols(prev=>prev.map(pr=>pr.doctor===old.name?{...pr,doctor:form.name}:pr));
      }
      setDoctors(prev=>prev.map(d=>d.id===form.id?form:d));
    }
    }
    setModal(null); showToast(modal==="addDoctor"?"Специалист добавлен":"Данные сохранены");
  };
  const deleteDoctor = (id) => { setDoctors(prev=>prev.filter(d=>d.id!==id)); setDeleteTarget(null); showToast("Специалист удалён","error"); };

  const saveStockOp = (form) => {
    const logEntry = { ...form, id: uid(), date: form.date || today() };
    setStockLog(prev => [...prev, logEntry]);
    // Update stock
    setStock(prev => {
      const existing = prev.find(s => s.type === form.insoleType && s.size === +form.size);
      if (form.opType === "in") {
        if (existing) {
          return prev.map(s => s.id === existing.id ? { ...s, qty: s.qty + (+form.qty), cost: +form.cost || s.cost, price: +form.price || s.price, notes: form.notes || s.notes } : s);
        } else {
          return [...prev, { id: uid(), type: form.insoleType, size: +form.size, cost: +form.cost || 0, price: +form.price || 0, qty: +form.qty, notes: form.notes }];
        }
      } else {
        if (existing) {
          const newQty = Math.max(0, existing.qty - (+form.qty));
          return prev.map(s => s.id === existing.id ? { ...s, qty: newQty } : s);
        }
        return prev;
      }
    });
    setModal(null);
    showToast(form.opType === "in" ? "Приход оформлен" : "Выдача оформлена");
  };
  const deleteStockItem = (id) => { setStock(prev => prev.filter(s => s.id !== id)); setDeleteTarget(null); showToast("Позиция удалена","error"); };
  const saveProcCatalogItem = (form) => {
    if (modal==="addProc") setProcCatalog(prev=>[...prev,{...form,id:uid()}]);
    else setProcCatalog(prev=>prev.map(p=>p.id===form.id?form:p));
    setModal(null); showToast(modal==="addProc"?"Процедура добавлена":"Процедура обновлена");
  };
  const deleteProcCatalogItem = (id) => { setProcCatalog(prev=>prev.filter(p=>p.id!==id)); setDeleteTarget(null); showToast("Процедура удалена","error"); };

  const exportExcel = () => {
    const wb = XLSX.utils.book_new();
    const pr=[["Фамилия","Имя","Отчество","Дата рожд.","Вік","Телефон","Диагноз","Врач","Статус","Ост. визит","Наст. визит","Мета","Примечания"]];
    patients.forEach(p=>pr.push([p.lastName,p.firstName,p.patronymic,fmt(p.dob),calcAge(p.dob),p.phone?formatPhone(p.phone):"",p.diagnosis,p.doctor,STATUSES[p.status]||p.status,fmt(p.lastVisit),fmt(p.nextVisitDate),p.nextVisitNote,p.notes]));
    const ws1=XLSX.utils.aoa_to_sheet(pr); ws1["!cols"]=[14,12,14,12,6,18,24,22,14,13,13,20,22].map(w=>({wch:w}));
    XLSX.utils.book_append_sheet(wb,ws1,"Пациенты");
    const ar=[["Дата","Час","Пациент","Врач","Тип","Статус","Примечания"]];
    [...appointments].sort((a,b)=>a.date.localeCompare(b.date)).forEach(a=>{const p=getP(a.patientId);ar.push([fmt(a.date),a.time,p?fullName(p):"—",a.doctor,a.type,APPT_STATUSES[a.status]||a.status,a.notes]);});
    const ws2=XLSX.utils.aoa_to_sheet(ar); ws2["!cols"]=[12,8,22,22,20,14,28].map(w=>({wch:w}));
    XLSX.utils.book_append_sheet(wb,ws2,"Записьи");
    const protRows=[["Пациент","Протокол","Врач","Диагноз","Дата начала","Статус","Процедуры"]];
    protocols.forEach(pr=>{const p=getP(pr.patientId);protRows.push([p?fullName(p):"—",pr.name,pr.doctor,pr.diagnosis,fmt(pr.startDate),pr.status,pr.procedures.map(proc=>`${proc.procedureName}: ${proc.completedSessions}/${proc.totalSessions}`).join("; ")]);});
    const ws3=XLSX.utils.aoa_to_sheet(protRows); ws3["!cols"]=[22,28,22,24,13,12,50].map(w=>({wch:w}));
    XLSX.utils.book_append_sheet(wb,ws3,"Протоколи");
    const docRows=[["ПІБ","Специализация","Телефон","Email","График","Примечания"]];
    doctors.forEach(d=>docRows.push([d.name,d.specialization||"",d.phone?formatPhone(d.phone):"",d.email||"",(d.schedule||[]).join(", "),d.notes||""]));
    const ws4=XLSX.utils.aoa_to_sheet(docRows); ws4["!cols"]=[28,16,18,22,20,28].map(w=>({wch:w}));
    XLSX.utils.book_append_sheet(wb,ws4,"Специалисти");
    XLSX.writeFile(wb,`Atlant_МедКарта_${today()}.xlsx`);
    showToast("Excel скачан 📥");
  };

  // ─── Analytics computations ───
  const analytics = useMemo(() => {
    const doneAppts = appointments.filter(a=>a.status==="done");
    const doctorLoad = {};
    doctorNames.forEach(d => { doctorLoad[d] = { total: appointments.filter(a=>a.doctor===d).length, done: doneAppts.filter(a=>a.doctor===d).length, scheduled: appointments.filter(a=>a.doctor===d&&a.status==="scheduled").length, patients: new Set(patients.filter(p=>p.doctor===d).map(p=>p.id)).size }; });
    const diagCounts = {};
    patients.forEach(p => { if(p.diagnosis) diagCounts[p.diagnosis] = (diagCounts[p.diagnosis]||0)+1; });
    const topDiag = Object.entries(diagCounts).sort((a,b)=>b[1]-a[1]).slice(0,8);
    const monthlyAppts = {};
    doneAppts.forEach(a => { const m = a.date?.slice(0,7); if(m) monthlyAppts[m]=(monthlyAppts[m]||0)+1; });
    const months = Object.keys(monthlyAppts).sort().slice(-6);
    const monthLabels = months.map(m => { const [y,mo]=m.split("-"); return `${mo}.${y.slice(2)}`; });
    const procCounts = {};
    protocols.forEach(pr => pr.procedures.forEach(proc => { procCounts[proc.procedureName] = (procCounts[proc.procedureName]||0)+proc.completedSessions; }));
    const topProcs = Object.entries(procCounts).sort((a,b)=>b[1]-a[1]).slice(0,8);
    const activeProts = protocols.filter(p=>p.status==="active").length;
    const completedProts = protocols.filter(p=>p.status==="completed").length;
    return { doctorLoad, topDiag, months, monthLabels, monthlyAppts, topProcs, activeProts, completedProts };
  }, [appointments, patients, protocols, doctorNames]);

  // ─── Timeline for patient ───
  const getTimeline = useCallback((patId) => {
    const events = [];
    appointments.filter(a=>a.patientId===patId).forEach(a => {
      events.push({ date:a.date, time:a.time, type:"appt", status:a.status, label:a.type, notes:a.notes, doctor:a.doctor, color:APPT_STATUS_COLORS[a.status] });
    });
    protocols.filter(p=>p.patientId===patId).forEach(p => {
      events.push({ date:p.startDate, time:"", type:"protocol", status:p.status, label:`Протокол: ${p.name}`, notes:p.procedures.map(pr=>`${pr.procedureName} ${pr.completedSessions}/${pr.totalSessions}`).join(", "), doctor:p.doctor, color:p.status==="active"?"#0e7c6b":p.status==="completed"?"#6366f1":"#f59e0b" });
    });
    podiatech.filter(p=>p.patientId===patId).forEach(p => {
      events.push({ date:p.date, time:"", type:"podiatech", status:p.insoleStatus, label:`Podiatech: ${p.footType}`, notes:p.notes, doctor:"", color:"#2563eb" });
    });
    return events.sort((a,b)=>(b.date||"").localeCompare(a.date||"")||(b.time||"").localeCompare(a.time||""));
  }, [appointments, protocols, podiatech]);

  if (!loaded) return <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",fontSize:18,color:"#64748b",fontFamily:"'DM Sans',sans-serif"}}>⏳ Загрузка…</div>;

  const TABS = [
    {id:"patients",label:"👤 Пациенты",count:patients.length},
    {id:"appointments",label:"📅 Записьи",count:appointments.filter(a=>a.status==="scheduled").length},
    {id:"protocols",label:"💊 Протоколы",count:protocols.filter(p=>p.status==="active").length},
    {id:"podiatech",label:"🦶 Podiatech",count:podiatech.length},
    {id:"doctors",label:"👨‍⚕️ Специалисти",count:doctors.length},
    {id:"analytics",label:"📊 Аналитика",count:null},
    {id:"reminders",label:"🔔 Напоминания",count:reminders.length,urgent:urgentCount},
  ];

  return (
    <div style={{fontFamily:"'DM Sans',sans-serif",minHeight:"100vh",background:"#f0f2f5"}}>
      <style>{CSS}</style>

      {toast&&<div style={{position:"fixed",bottom:24,left:"50%",transform:"translateX(-50%)",background:toast.type==="error"?"#dc2626":"#0e7c6b",color:"#fff",padding:"11px 24px",borderRadius:10,fontWeight:600,fontSize:14,zIndex:999,boxShadow:"0 8px 28px rgba(0,0,0,.2)",animation:"su .2s",whiteSpace:"nowrap"}}>{toast.msg}</div>}

      {/* ─── HEADER ─── */}
      <div style={{background:"linear-gradient(135deg,#042f2e,#064e3b,#0e7c6b)",padding:"0 28px",boxShadow:"0 4px 20px rgba(8,40,32,.25)"}}>
        <div style={{maxWidth:1400,margin:"0 auto",display:"flex",alignItems:"center",justifyContent:"space-between",height:64}}>
          <div style={{display:"flex",alignItems:"center",gap:14}}>
            <div style={{width:40,height:40,borderRadius:10,background:"rgba(255,255,255,.12)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22}}>🏥</div>
            <div>
              <div style={{fontFamily:"'DM Serif Display',serif",fontSize:21,color:"#fff"}}>Atlant Clinic</div>
              <div style={{fontSize:10,color:"rgba(255,255,255,.45)",letterSpacing:".12em",textTransform:"uppercase",display:"flex",alignItems:"center",gap:6}}>
                МедКарта · Учёт пациентов
                {usingSupabase&&<span style={{background:"rgba(255,255,255,.15)",padding:"1px 7px",borderRadius:8,fontSize:9,letterSpacing:".08em"}}>🌐 Онлайн</span>}
              </div>
            </div>
          </div>
          <div style={{display:"flex",gap:8}}>
            <button className="btn" onClick={exportExcel} style={{background:"rgba(255,255,255,.1)",color:"#fff",padding:"8px 16px",border:"1px solid rgba(255,255,255,.2)"}}>📥 Excel</button>
            <button className="btn" onClick={()=>{setEditPat({...EMPTY_PATIENT});setModal("addPat");}} style={{background:"#fff",color:"#064e3b",padding:"8px 18px",fontWeight:700}}>＋ Пациент</button>
            {profile&&<div style={{display:"flex",alignItems:"center",gap:8,marginLeft:8}}>
              <div style={{fontSize:11,color:"rgba(255,255,255,.6)",textAlign:"right",lineHeight:1.3}}>
                <div style={{fontWeight:600,color:"#fff"}}>{profile.full_name||profile.email}</div>
                <div>{profile.role==="admin"?"Адмін":"Врач"}</div>
              </div>
              <button className="btn" onClick={()=>supabase?.auth.signOut()} style={{background:"rgba(255,255,255,.1)",color:"#fff",padding:"6px 12px",border:"1px solid rgba(255,255,255,.2)",fontSize:12}}>Вийти</button>
            </div>}
          </div>
        </div>
      </div>

      {/* ─── TABS ─── */}
      <div style={{background:"#fff",borderBottom:"1px solid #e2e8f0",padding:"0 28px"}}>
        <div style={{maxWidth:1400,margin:"0 auto",display:"flex",gap:4,padding:"10px 0",overflowX:"auto"}}>
          {TABS.map(t=>(
            <div key={t.id} style={{position:"relative"}}>
              <div className={`tab${tab===t.id?" active":""}`} onClick={()=>setTab(t.id)}>
                {t.label}
                {t.count!=null&&t.count>0&&<span style={{marginLeft:6,background:tab===t.id?"rgba(255,255,255,.25)":"rgba(14,124,107,.1)",color:tab===t.id?"#fff":"#0e7c6b",borderRadius:10,padding:"1px 7px",fontSize:11,fontWeight:700}}>{t.count}</span>}
              </div>
              {t.urgent>0&&<span className="badge">{t.urgent}</span>}
            </div>
          ))}
        </div>
      </div>

      <div style={{maxWidth:1400,margin:"0 auto",padding:"22px 28px"}}>

        {/* ════════════════════════════════════════ */}
        {/* TAB: PATIENTS                           */}
        {/* ════════════════════════════════════════ */}
        {tab==="patients"&&<>
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,marginBottom:20}}>
            {[{l:"Всего",v:patients.length,i:"👥",c:"#0e7c6b"},{l:"Спостерігаються",v:patients.filter(p=>p.status==="active").length,i:"🟢",c:"#10b981"},{l:"Виписані",v:patients.filter(p=>p.status==="discharged").length,i:"📋",c:"#6366f1"},{l:"Активных протоколов",v:protocols.filter(p=>p.status==="active").length,i:"💊",c:"#f59e0b"}].map(s=>(
              <div key={s.l} className="card" style={{padding:"14px 18px",borderLeft:`4px solid ${s.c}`}}>
                <div style={{fontSize:22,marginBottom:2}}>{s.i}</div>
                <div style={{fontSize:28,fontWeight:700,fontFamily:"'DM Serif Display',serif",color:s.c}}>{s.v}</div>
                <div style={{fontSize:12,color:"#64748b"}}>{s.l}</div>
              </div>
            ))}
          </div>
          <div className="card" style={{padding:"12px 16px",marginBottom:14,display:"flex",gap:10,flexWrap:"wrap",alignItems:"center"}}>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍  Поиск за именем, диагнозом, телефоном…" style={{flex:1,minWidth:200,padding:"8px 12px",border:"1.5px solid #dde4ef",borderRadius:8,fontSize:14,outline:"none"}}/>
            <select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)} style={{padding:"8px 12px",border:"1.5px solid #dde4ef",borderRadius:8,fontSize:14,outline:"none",background:"#fff"}}>
              <option value="all">Все статусы</option>
              {Object.entries(STATUSES).map(([k,v])=><option key={k} value={k}>{v}</option>)}
            </select>
            <select value={filterDoctor} onChange={e=>setFilterDoctor(e.target.value)} style={{padding:"8px 12px",border:"1.5px solid #dde4ef",borderRadius:8,fontSize:14,outline:"none",background:"#fff"}}>
              <option value="all">Усі врачі</option>
              {doctorNames.map(d=><option key={d} value={d}>{d}</option>)}
            </select>
            <span style={{fontSize:13,color:"#94a3b8"}}>Найдено: <b style={{color:"#1a2332"}}>{filteredPats.length}</b></span>
          </div>
          <div className="card" style={{overflow:"hidden"}}>
            <table style={{width:"100%",borderCollapse:"collapse"}}>
              <thead>
                <tr style={{background:"#f8fafc",borderBottom:"2px solid #e8edf5"}}>
                  {[["lastName","ПІБ"],["dob","Дата рожд."],["phone","Телефон"],["diagnosis","Диагноз"],["doctor","Врач"],["nextVisitDate","Наст. визит"],["status","Статус"]].map(([k,l])=>(
                    <th key={k} onClick={()=>setSortBy(k)} style={{padding:"11px 14px",textAlign:"left",cursor:"pointer"}}>{l}{sortBy===k?" ▲":""}</th>
                  ))}
                  <th style={{padding:"11px 14px",textAlign:"right"}}>Действия</th>
                </tr>
              </thead>
              <tbody>
                {filteredPats.length===0&&<tr><td colSpan={8} style={{textAlign:"center",padding:"52px",color:"#94a3b8",fontSize:15}}>Пациентів не найдено</td></tr>}
                {filteredPats.map(p=>{
                  const days=daysUntil(p.nextVisitDate);
                  const overdue=days!==null&&days<0; const soon=days!==null&&days>=0&&days<=3;
                  return (
                    <tr key={p.id} className="row-tr" style={{borderBottom:"1px solid #f0f4f8",cursor:"pointer"}} onClick={()=>{setViewPat(p);setModal("viewPat");}}>
                      <td style={{padding:"10px 14px",fontWeight:600,fontSize:14}}>{fullName(p)}</td>
                      <td style={{padding:"10px 14px",fontSize:12,color:"#64748b"}}>{fmt(p.dob)}<br/><span style={{fontSize:11,color:"#94a3b8"}}>{calcAge(p.dob)}</span></td>
                      <td style={{padding:"10px 14px",fontSize:13,color:"#475569",whiteSpace:"nowrap"}}>{p.phone?formatPhone(p.phone):"—"}</td>
                      <td style={{padding:"10px 14px",fontSize:13,maxWidth:150}}><span title={p.diagnosis} style={{display:"block",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.diagnosis||"—"}</span></td>
                      <td style={{padding:"10px 14px",fontSize:12,color:"#475569",maxWidth:120}}><span title={p.doctor} style={{display:"block",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.doctor||"—"}</span></td>
                      <td style={{padding:"10px 14px",fontSize:13}}>
                        {p.nextVisitDate?<span style={{color:overdue?"#dc2626":soon?"#f59e0b":"#10b981",fontWeight:600}}>{fmt(p.nextVisitDate)}<span style={{fontSize:11,display:"block",fontWeight:400}}>{overdue?`просрочено ${-days}д`:days===0?"сегодня":`через ${days}д`}</span></span>:<span style={{color:"#94a3b8"}}>—</span>}
                      </td>
                      <td style={{padding:"10px 14px"}}><span className="chip" style={{background:STATUS_COLORS[p.status]+"22",color:STATUS_COLORS[p.status]}}>{STATUSES[p.status]}</span></td>
                      <td style={{padding:"10px 14px",textAlign:"right"}} onClick={e=>e.stopPropagation()}>
                        <div style={{display:"flex",gap:3,justifyContent:"flex-end"}}>
                          {p.nextVisitDate&&<MsgBtns patient={p} setMessengerPat={setMessengerPat}/>}
                          <button className="btn" onClick={()=>{setDischargePat(p);setModal("discharge");}} title="Выписка" style={{background:"#f0fdf4",color:"#0e7c6b",padding:"5px 8px"}}>📄</button>
                          <button className="btn" onClick={()=>{setTimelinePat(p);setModal("timeline");}} title="История" style={{background:"#faf5ff",color:"#7c3aed",padding:"5px 8px"}}>📋</button>
                          <button className="btn" onClick={()=>{setEditPat({...p});setModal("editPat");}} style={{background:"#eff6ff",color:"#2563eb",padding:"5px 8px"}}>✏️</button>
                          <button className="btn" onClick={()=>setDeleteTarget({type:"patient",id:p.id,name:fullName(p)})} style={{background:"#fef2f2",color:"#dc2626",padding:"5px 8px"}}>🗑</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>}

        {/* ════════════════════════════════════════ */}
        {/* TAB: APPOINTMENTS (CALENDAR)             */}
        {/* ════════════════════════════════════════ */}
        {tab==="appointments"&&(()=>{
          const TIME_SLOTS = [];
          for(let h=8;h<19;h++) for(let m=0;m<60;m+=30) TIME_SLOTS.push(`${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}`);
          TIME_SLOTS.push("19:00");
          const apptDateDay = new Date(apptDate+"T00:00:00");
          const dayName = WEEKDAYS[apptDateDay.getDay()===0?6:apptDateDay.getDay()-1];
          const workingDocs = doctors.filter(d=>(d.schedule||[]).includes(dayName));
          const allDayAppts = appointments.filter(a=>a.date===apptDate);
          const getApptAt = (doc, time) => allDayAppts.find(a=>a.time===time&&a.doctor===doc);
          const prevDay = () => { const d=new Date(apptDate+"T00:00:00"); d.setDate(d.getDate()-1); setApptDate(d.toISOString().slice(0,10)); };
          const nextDay = () => { const d=new Date(apptDate+"T00:00:00"); d.setDate(d.getDate()+1); setApptDate(d.toISOString().slice(0,10)); };
          const isNow = (time) => { if(apptDate!==today()) return false; const now=new Date(); const [h,m]=time.split(":").map(Number); const slotMin=h*60+m; const nowMin=now.getHours()*60+now.getMinutes(); return nowMin>=slotMin&&nowMin<slotMin+30; };

          return <>
          <div style={{display:"flex",gap:12,marginBottom:16,alignItems:"center",flexWrap:"wrap"}}>
            <div style={{display:"flex",alignItems:"center",gap:4}}>
              <button className="btn" onClick={prevDay} style={{background:"#f1f5f9",color:"#475569",padding:"8px 12px",fontSize:16}}>◀</button>
              <input type="date" value={apptDate} onChange={e=>setApptDate(e.target.value)} style={{padding:"8px 12px",border:"1.5px solid #dde4ef",borderRadius:8,fontSize:14,outline:"none",background:"#fff"}}/>
              <button className="btn" onClick={nextDay} style={{background:"#f1f5f9",color:"#475569",padding:"8px 12px",fontSize:16}}>▶</button>
            </div>
            <button className="btn" onClick={()=>setApptDate(today())} style={{background:apptDate===today()?"#0e7c6b":"rgba(14,124,107,.08)",color:apptDate===today()?"#fff":"#0e7c6b",padding:"8px 14px"}}>Сегодня</button>
            <div style={{fontFamily:"'DM Serif Display',serif",fontSize:18}}>{fmt(apptDate)}, {dayName}</div>
            <div style={{display:"flex",gap:12,marginLeft:8}}>
              {Object.entries(APPT_STATUSES).map(([k,v])=>{
                const cnt = allDayAppts.filter(a=>a.status===k).length;
                return cnt>0?<div key={k} style={{display:"flex",alignItems:"center",gap:4,fontSize:12}}>
                  <span style={{width:8,height:8,borderRadius:"50%",background:APPT_STATUS_COLORS[k]}}/>{v}: <b>{cnt}</b>
                </div>:null;
              })}
            </div>
            <button className="btn" onClick={()=>{setEditAppt({...EMPTY_APPT,date:apptDate});setModal("addAppt");}} style={{background:"#0e7c6b",color:"#fff",padding:"8px 18px",marginLeft:"auto"}}>＋ Новая запись</button>
          </div>

          {workingDocs.length===0?(
            <div className="card" style={{padding:"52px",textAlign:"center",color:"#94a3b8",fontSize:15}}>
              📭 На {dayName} нет работающих врачей
              {doctors.length>0&&<div style={{marginTop:8,fontSize:13}}>Проверьте график во вкладке «Специалисты»</div>}
            </div>
          ):(
            <div className="card" style={{overflow:"auto",maxHeight:"calc(100vh - 220px)"}}>
              <table style={{width:"100%",borderCollapse:"collapse",minWidth:workingDocs.length*200+80}}>
                <thead>
                  <tr style={{position:"sticky",top:0,zIndex:10,background:"#fff"}}>
                    <th style={{padding:"10px 8px",textAlign:"left",width:70,borderBottom:"2px solid #e8edf5",borderRight:"1px solid #f0f4f8",position:"sticky",left:0,background:"#fff",zIndex:11}}>Время</th>
                    {workingDocs.map(doc=>(
                      <th key={doc.id} style={{padding:"10px 12px",textAlign:"center",borderBottom:"2px solid #e8edf5",borderRight:"1px solid #f0f4f8",minWidth:180}}>
                        <div style={{fontSize:12,fontWeight:700}}>{doc.name.split(" ").slice(0,2).join(" ")}</div>
                        {doc.specialization&&<div style={{fontSize:10,fontWeight:500,color:"#94a3b8",textTransform:"none",letterSpacing:0}}>{doc.specialization}</div>}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {TIME_SLOTS.map((time,ti)=>{
                    const isHour = time.endsWith(":00");
                    const nowSlot = isNow(time);
                    return (
                      <tr key={time} style={{background:nowSlot?"#f0fdf4":ti%2===0?"#fff":"#fafbfc",borderBottom:isHour?"2px solid #e8edf5":"1px solid #f0f4f8",position:"relative"}}>
                        {nowSlot&&<td colSpan={workingDocs.length+1} style={{position:"absolute",left:0,right:0,top:0,height:2,background:"#ef4444",zIndex:5,padding:0,border:"none"}}/>}
                        <td style={{padding:"6px 8px",fontSize:12,fontWeight:isHour?700:400,color:isHour?"#1a2332":"#94a3b8",borderRight:"1px solid #f0f4f8",verticalAlign:"top",position:"sticky",left:0,background:nowSlot?"#f0fdf4":ti%2===0?"#fff":"#fafbfc",zIndex:3,whiteSpace:"nowrap"}}>{time}</td>
                        {workingDocs.map(doc=>{
                          const appt = getApptAt(doc.name, time);
                          const p = appt ? getP(appt.patientId) : null;
                          return (
                            <td key={doc.id} style={{padding:"3px 6px",borderRight:"1px solid #f0f4f8",verticalAlign:"top",height:38,cursor:"pointer",position:"relative"}}
                              onClick={()=>{if(!appt){setEditAppt({...EMPTY_APPT,date:apptDate,time,doctor:doc.name});setModal("addAppt");}}}>
                              {appt?(
                                <div style={{
                                  background:APPT_STATUS_COLORS[appt.status]+"18",
                                  borderLeft:`3px solid ${APPT_STATUS_COLORS[appt.status]}`,
                                  borderRadius:"0 6px 6px 0",padding:"4px 8px",fontSize:12,
                                  cursor:"pointer",transition:"all .15s",position:"relative"
                                }}
                                  onClick={(e)=>{e.stopPropagation();setEditAppt({...appt});setModal("editAppt");}}>
                                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:4}}>
                                    <span
                                        style={{fontWeight:700,color:"#1a2332",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",cursor:"pointer",textDecoration:"underline dotted #94a3b8",textUnderlineOffset:2}}
                                        title="Открыть карту пациента"
                                        onClick={e=>{e.stopPropagation();if(p){setViewPat(p);setModal("viewPat");}}}
                                      >{p?shortName(p):"—"}</span>
                                    <div style={{display:"flex",gap:2,flexShrink:0}}>
                                      {appt.status==="scheduled"&&<>
                                        <button className="btn" onClick={e=>{e.stopPropagation();changeApptStatus(appt.id,"done");}} style={{background:APPT_STATUS_COLORS.done,color:"#fff",padding:"1px 5px",fontSize:10,lineHeight:1}}>✓</button>
                                        <button className="btn" onClick={e=>{e.stopPropagation();changeApptStatus(appt.id,"missed");}} style={{background:APPT_STATUS_COLORS.missed,color:"#fff",padding:"1px 5px",fontSize:10,lineHeight:1}}>✗</button>
                                      </>}
                                      <button className="btn" onClick={e=>{e.stopPropagation();setDeleteTarget({type:"appt",id:appt.id,name:`${time} ${p?shortName(p):""}`});}} style={{background:"#fef2f2",color:"#dc2626",padding:"1px 5px",fontSize:10,lineHeight:1}}>🗑</button>
                                    </div>
                                  </div>
                                  <div style={{fontSize:10,color:"#64748b",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{appt.type}{appt.notes?" · "+appt.notes:""}</div>
                                </div>
                              ):(
                                <div style={{height:"100%",minHeight:30,borderRadius:6,transition:"background .15s",display:"flex",alignItems:"center",justifyContent:"center"}}>
                                  <span style={{opacity:0,fontSize:16,transition:"opacity .15s",pointerEvents:"none"}} className="slot-plus">＋</span>
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* All upcoming appointments list below calendar */}
          {allDayAppts.filter(a=>!a.time).length>0&&(
            <div style={{marginTop:16}}>
              <div style={{fontSize:12,fontWeight:700,color:"#64748b",marginBottom:8,textTransform:"uppercase",letterSpacing:".07em"}}>Записьи без вказаного часу</div>
              <div style={{display:"flex",flexDirection:"column",gap:6}}>
                {allDayAppts.filter(a=>!a.time).map(a=>{
                  const p=getP(a.patientId);
                  return <div key={a.id} className="card" style={{padding:"10px 16px",display:"flex",alignItems:"center",gap:12,borderLeft:`3px solid ${APPT_STATUS_COLORS[a.status]}`}}>
                    <div style={{flex:1}}>
                      <span style={{fontWeight:600,fontSize:13}}>{p?fullName(p):"—"}</span>
                      <span style={{fontSize:12,color:"#64748b",marginLeft:8}}>{a.type} · {a.doctor}{a.notes?" · "+a.notes:""}</span>
                    </div>
                    <span className="chip" style={{background:APPT_STATUS_COLORS[a.status]+"22",color:APPT_STATUS_COLORS[a.status],fontSize:11}}>{APPT_STATUSES[a.status]}</span>
                    <button className="btn" onClick={()=>{setEditAppt({...a});setModal("editAppt");}} style={{background:"#eff6ff",color:"#2563eb",padding:"4px 8px",fontSize:11}}>✏️</button>
                  </div>;
                })}
              </div>
            </div>
          )}
          </>;
        })()}

        {/* ════════════════════════════════════════ */}
        {/* TAB: PROTOCOLS                          */}
        {/* ════════════════════════════════════════ */}
        {tab==="protocols"&&<>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14,flexWrap:"wrap",gap:12}}>
            <div>
              <div style={{fontFamily:"'DM Serif Display',serif",fontSize:22}}>Протоколи та процедури</div>
              <div style={{fontSize:13,color:"#64748b",marginTop:2}}>Курсы лечения · Прайс процедур</div>
            </div>
            <div style={{display:"flex",gap:8}}>
              {protocolSubTab==="protocols"&&<button className="btn" onClick={()=>{setEditProtocol({patientId:"",name:"",procedures:[{procedureName:"",totalSessions:5,completedSessions:0,notes:""}],startDate:today(),status:"active",doctor:"",diagnosis:""});setModal("addProtocol");}} style={{background:"#0e7c6b",color:"#fff",padding:"8px 16px"}}>＋ Протокол</button>}
              {protocolSubTab==="catalog"&&<button className="btn" onClick={()=>{setEditProc({name:"",category:"Физиотерапия",icon:"⚡",color:"#8b5cf6",defaultSessions:5,price:0});setModal("addProc");}} style={{background:"#0e7c6b",color:"#fff",padding:"8px 16px"}}>＋ Процедура</button>}
            </div>
          </div>

          <div style={{display:"flex",gap:4,marginBottom:16}}>
            {[{id:"protocols",label:"💊 Протоколы",count:protocols.filter(p=>p.status==="active").length},{id:"catalog",label:"📋 Прайс процедур",count:procCatalog.length}].map(st=>(
              <div key={st.id} className={`tab${protocolSubTab===st.id?" active":""}`} onClick={()=>setProtocolSubTab(st.id)}>
                {st.label}
                <span style={{marginLeft:6,background:protocolSubTab===st.id?"rgba(255,255,255,.25)":"rgba(14,124,107,.1)",color:protocolSubTab===st.id?"#fff":"#0e7c6b",borderRadius:10,padding:"1px 7px",fontSize:11,fontWeight:700}}>{st.count}</span>
              </div>
            ))}
          </div>

          {/* ─── PROTOCOLS SUB-TAB ─── */}
          {protocolSubTab==="protocols"&&<>
            {protocols.length===0
              ?<div className="card" style={{padding:"52px",textAlign:"center",color:"#94a3b8"}}>Протоколів поки нет</div>
              :<div style={{display:"flex",flexDirection:"column",gap:14}}>
                {[...protocols].sort((a,b)=>a.status==="active"?-1:b.status==="active"?1:0).map(pr=>{
                  const p=getP(pr.patientId);
                  const totalAll = pr.procedures.reduce((s,proc)=>s+proc.totalSessions,0);
                  const doneAll = pr.procedures.reduce((s,proc)=>s+proc.completedSessions,0);
                  const pct = totalAll>0?Math.round(doneAll/totalAll*100):0;
                  const statusColor = pr.status==="active"?"#0e7c6b":pr.status==="completed"?"#6366f1":"#f59e0b";
                  const statusLabel = pr.status==="active"?"Активный":pr.status==="completed"?"Завершён":"Приостановлено";
                  const totalPrice = pr.procedures.reduce((s,proc)=>{const cat=procCatalog.find(c=>c.name===proc.procedureName);return s+(cat?.price||0)*proc.totalSessions;},0);
                  return (
                    <div key={pr.id} className="card" style={{padding:0,overflow:"hidden",borderLeft:`4px solid ${statusColor}`}}>
                      <div style={{padding:"16px 20px",display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:12}}>
                        <div style={{flex:1,minWidth:200}}>
                          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                            <span style={{fontFamily:"'DM Serif Display',serif",fontSize:17}}>{pr.name}</span>
                            <span className="chip" style={{background:statusColor+"22",color:statusColor}}>{statusLabel}</span>
                          </div>
                          <div style={{fontSize:13,color:"#64748b"}}>{p?fullName(p):"—"} · {pr.doctor} · {pr.diagnosis}</div>
                          <div style={{fontSize:12,color:"#94a3b8",marginTop:2}}>Начало: {fmt(pr.startDate)}{totalPrice>0?` · Стоимость курсу: ${totalPrice.toLocaleString()} ₸`:""}</div>
                        </div>
                        <div style={{textAlign:"right",minWidth:100}}>
                          <div style={{fontSize:28,fontWeight:700,fontFamily:"'DM Serif Display',serif",color:statusColor}}>{pct}%</div>
                          <div style={{fontSize:12,color:"#64748b"}}>{doneAll} / {totalAll} сеансов</div>
                        </div>
                      </div>
                      <div style={{padding:"0 20px 8px"}}>
                        <div className="progress-bar" style={{marginBottom:12}}>
                          <div className="progress-fill" style={{width:`${pct}%`,background:`linear-gradient(90deg,${statusColor},${statusColor}aa)`}}/>
                        </div>
                        <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:12}}>
                          {pr.procedures.map((proc,i)=>{
                            const cat = procCatalog.find(c=>c.name===proc.procedureName);
                            const procPct = proc.totalSessions>0?Math.round(proc.completedSessions/proc.totalSessions*100):0;
                            return (
                              <div key={i} style={{background:"#f8fafc",borderRadius:10,padding:"8px 12px",border:"1px solid #e8edf3",minWidth:140,flex:"1 1 140px"}}>
                                <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}>
                                  <span style={{fontSize:15}}>{cat?.icon||"📋"}</span>
                                  <span style={{fontSize:12,fontWeight:700,color:cat?.color||"#475569"}}>{proc.procedureName||"—"}</span>
                                </div>
                                <div className="progress-bar" style={{height:6,marginBottom:4}}>
                                  <div className="progress-fill" style={{width:`${procPct}%`,background:cat?.color||"#64748b"}}/>
                                </div>
                                <div style={{fontSize:11,color:"#64748b"}}>{proc.completedSessions}/{proc.totalSessions}{cat?.price?` · ${(cat.price*proc.totalSessions).toLocaleString()} ₸`:""} {proc.notes&&`· ${proc.notes}`}</div>
                                {(proc.medications||[]).length>0&&<div style={{fontSize:10,color:"#92400e",marginTop:3,display:"flex",flexWrap:"wrap",gap:3}}>{proc.medications.map(m=><span key={m} style={{background:"#fef3c7",padding:"1px 6px",borderRadius:4}}>💊{m}</span>)}</div>}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      <div style={{borderTop:"1px solid #f0f4f8",padding:"10px 20px",display:"flex",gap:6,justifyContent:"flex-end"}}>
                        {pr.status==="active"&&<button className="btn" onClick={()=>{const updated={...pr,procedures:pr.procedures.map(proc=>({...proc,completedSessions:Math.min(proc.completedSessions+1,proc.totalSessions)}))};setProtocols(prev=>prev.map(p=>p.id===pr.id?updated:p));showToast("+1 сеанс добавлено");}} style={{background:"#f0fdf4",color:"#10b981",padding:"6px 14px",fontSize:12}}>＋1 сеанс</button>}
                        <button className="btn" onClick={()=>{setEditProtocol({...pr,procedures:pr.procedures.map(p=>({...p}))});setModal("editProtocol");}} style={{background:"#eff6ff",color:"#2563eb",padding:"6px 12px",fontSize:12}}>✏️ Редактировать</button>
                        <button className="btn" onClick={()=>setDeleteTarget({type:"protocol",id:pr.id,name:pr.name})} style={{background:"#fef2f2",color:"#dc2626",padding:"6px 12px",fontSize:12}}>🗑</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            }
          </>}

          {/* ─── PROCEDURE CATALOG SUB-TAB ─── */}
          {protocolSubTab==="catalog"&&<>
            {(()=>{
              const cats = {};
              procCatalog.forEach(p=>{ if(!cats[p.category]) cats[p.category]=[]; cats[p.category].push(p); });
              return Object.entries(cats).length===0
                ?<div className="card" style={{padding:"52px",textAlign:"center",color:"#94a3b8"}}>Процедур поки нет</div>
                :<div style={{display:"flex",flexDirection:"column",gap:14}}>
                  {Object.entries(cats).map(([cat,items])=>(
                    <div key={cat} className="card" style={{overflow:"hidden"}}>
                      <div style={{padding:"14px 20px",borderBottom:"1px solid #f0f4f8",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                        <span style={{fontFamily:"'DM Serif Display',serif",fontSize:16}}>{cat}</span>
                        <span style={{fontSize:13,color:"#64748b"}}>{items.length} процедур</span>
                      </div>
                      <table style={{width:"100%",borderCollapse:"collapse"}}>
                        <thead>
                          <tr style={{background:"#f8fafc"}}>
                            {["","Назва","Сеансов","Цена за сеанс","Стоимость курсу",""].map((h,i)=><th key={i} style={{padding:"8px 14px",textAlign:i===5?"right":"left",fontSize:10}}>{h}</th>)}
                          </tr>
                        </thead>
                        <tbody>
                          {items.sort((a,b)=>a.name.localeCompare(b.name,"uk")).map(proc=>(
                            <tr key={proc.id} className="row-tr" style={{borderBottom:"1px solid #f0f4f8"}}>
                              <td style={{padding:"8px 14px",fontSize:18,width:36,textAlign:"center"}}><span style={{display:"inline-block",width:28,height:28,borderRadius:7,background:proc.color+"22",lineHeight:"28px",textAlign:"center"}}>{proc.icon}</span></td>
                              <td style={{padding:"8px 14px",fontWeight:600,fontSize:14}}>{proc.name}</td>
                              <td style={{padding:"8px 14px",fontSize:13,color:"#64748b"}}>{proc.defaultSessions} сеансов</td>
                              <td style={{padding:"8px 14px",fontSize:14,fontWeight:700,color:"#0e7c6b"}}>{proc.price?`${proc.price.toLocaleString()} ₸`:"—"}</td>
                              <td style={{padding:"8px 14px",fontSize:13,color:"#475569"}}>{proc.price?`${(proc.price*proc.defaultSessions).toLocaleString()} ₸`:"—"}</td>
                              <td style={{padding:"8px 14px",textAlign:"right"}}>
                                <div style={{display:"flex",gap:4,justifyContent:"flex-end"}}>
                                  <button className="btn" onClick={()=>{setEditProc({...proc});setModal("editProc");}} style={{background:"#eff6ff",color:"#2563eb",padding:"4px 10px",fontSize:11}}>✏️</button>
                                  <button className="btn" onClick={()=>setDeleteTarget({type:"procCatalog",id:proc.id,name:proc.name})} style={{background:"#fef2f2",color:"#dc2626",padding:"4px 10px",fontSize:11}}>🗑</button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ))}
                </div>;
            })()}
          </>}
        </>}

        {/* ════════════════════════════════════════ */}
        {/* TAB: PODIATECH                          */}
        {/* ════════════════════════════════════════ */}
        {tab==="podiatech"&&(()=>{
          const totalStock = stock.reduce((s,item)=>s+item.qty,0);
          const totalValue = stock.reduce((s,item)=>s+item.qty*item.price,0);
          const totalCost = stock.reduce((s,item)=>s+item.qty*item.cost,0);
          const byType = {};
          stock.forEach(s=>{ if(!byType[s.type]) byType[s.type]={qty:0,items:[]}; byType[s.type].qty+=s.qty; byType[s.type].items.push(s); });
          const deliveredTotal = stockLog.filter(l=>l.opType==="out").reduce((s,l)=>s+l.qty,0);

          return <>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14,flexWrap:"wrap",gap:12}}>
            <div>
              <div style={{fontFamily:"'DM Serif Display',serif",fontSize:22}}>Podiatech Sidas</div>
              <div style={{fontSize:13,color:"#64748b",marginTop:2}}>Диагностика стопы · Стельки · Склад</div>
            </div>
            <div style={{display:"flex",gap:8}}>
              {podiatechSubTab==="diag"&&<button className="btn" onClick={()=>{setEditPodiatech({patientId:"",date:today(),footType:"",halluxValgus:false,archIndex:"",pressureNotes:"",insoleStatus:"ordered",insoleDeliveryDate:"",notes:""});setModal("addPodiatech");}} style={{background:"#2563eb",color:"#fff",padding:"8px 16px"}}>＋ Диагностика</button>}
              {podiatechSubTab==="stock"&&<>
                <button className="btn" onClick={()=>{setEditStockOp({opType:"in",insoleType:"",size:"",qty:1,cost:0,price:0,date:today(),notes:"",patientId:""});setModal("stockOp");}} style={{background:"#0e7c6b",color:"#fff",padding:"8px 16px"}}>📥 Приход</button>
                <button className="btn" onClick={()=>{setEditStockOp({opType:"out",insoleType:"",size:"",qty:1,cost:0,price:0,date:today(),notes:"",patientId:""});setModal("stockOp");}} style={{background:"#ea580c",color:"#fff",padding:"8px 16px"}}>📤 Выдача</button>
              </>}
            </div>
          </div>

          {/* Sub-tabs */}
          <div style={{display:"flex",gap:4,marginBottom:16}}>
            {[{id:"diag",label:"🦶 Диагностика",count:podiatech.length},{id:"stock",label:"📦 Склад стелек",count:totalStock},{id:"log",label:"📋 История операций",count:stockLog.length}].map(st=>(
              <div key={st.id} className={`tab${podiatechSubTab===st.id?" active":""}`} onClick={()=>setPodiatechSubTab(st.id)}>
                {st.label}
                {st.count>0&&<span style={{marginLeft:6,background:podiatechSubTab===st.id?"rgba(255,255,255,.25)":"rgba(14,124,107,.1)",color:podiatechSubTab===st.id?"#fff":"#0e7c6b",borderRadius:10,padding:"1px 7px",fontSize:11,fontWeight:700}}>{st.count}</span>}
              </div>
            ))}
          </div>

          {/* ─── DIAGNOSTICS SUB-TAB ─── */}
          {podiatechSubTab==="diag"&&<>
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,marginBottom:20}}>
              {[{l:"Диагностик",v:podiatech.length,c:"#2563eb",i:"🦶"},{l:"Заказано",v:podiatech.filter(p=>p.insoleStatus==="ordered"||p.insoleStatus==="production").length,c:"#f59e0b",i:"🔄"},{l:"Готово / выдано",v:podiatech.filter(p=>p.insoleStatus==="ready"||p.insoleStatus==="delivered").length,c:"#10b981",i:"✅"},{l:"Выдано усього",v:deliveredTotal,c:"#6366f1",i:"📤"}].map(s=>(
                <div key={s.l} className="card" style={{padding:"12px 16px",borderLeft:`4px solid ${s.c}`}}>
                  <div style={{fontSize:20}}>{s.i}</div>
                  <div style={{fontSize:26,fontWeight:700,fontFamily:"'DM Serif Display',serif",color:s.c}}>{s.v}</div>
                  <div style={{fontSize:11,color:"#64748b"}}>{s.l}</div>
                </div>
              ))}
            </div>
            {podiatech.length===0
              ?<div className="card" style={{padding:"52px",textAlign:"center",color:"#94a3b8"}}>Записьей діагностики нет</div>
              :<div style={{display:"flex",flexDirection:"column",gap:12}}>
                {[...podiatech].sort((a,b)=>(b.date||"").localeCompare(a.date||"")).map(pd=>{
                  const p=getP(pd.patientId);
                  return (
                    <div key={pd.id} className="card" style={{padding:"18px 20px",borderLeft:`4px solid ${INSOLE_STATUS_COLORS[pd.insoleStatus]||"#64748b"}`}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:12}}>
                        <div style={{flex:1}}>
                          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                            <span style={{fontSize:20}}>🦶</span>
                            <span style={{fontFamily:"'DM Serif Display',serif",fontSize:17}}>{p?fullName(p):"—"}</span>
                            <span className="chip" style={{background:(INSOLE_STATUS_COLORS[pd.insoleStatus]||"#64748b")+"22",color:INSOLE_STATUS_COLORS[pd.insoleStatus]||"#64748b"}}>{INSOLE_STATUSES[pd.insoleStatus]||pd.insoleStatus}</span>
                          </div>
                          <div style={{display:"flex",gap:16,flexWrap:"wrap",fontSize:13,color:"#475569",marginBottom:6}}>
                            <span>📅 {fmt(pd.date)}</span>
                            <span>🦶 {pd.footType}</span>
                            {pd.halluxValgus&&<span style={{color:"#dc2626",fontWeight:600}}>⚠ Hallux Valgus</span>}
                            {pd.archIndex&&<span>Индекс: {pd.archIndex}</span>}
                          </div>
                          {pd.pressureNotes&&<div style={{fontSize:12,color:"#64748b",background:"#f8fafc",padding:"8px 12px",borderRadius:8,marginBottom:6}}>{pd.pressureNotes}</div>}
                          {pd.notes&&<div style={{fontSize:13,color:"#1a2332"}}>{pd.notes}</div>}
                          {pd.insoleDeliveryDate&&<div style={{fontSize:12,color:"#0e7c6b",marginTop:4}}>📦 Дата: {fmt(pd.insoleDeliveryDate)}</div>}
                        </div>
                        <div style={{display:"flex",gap:6}}>
                          <button className="btn" onClick={()=>{setEditPodiatech({...pd});setModal("editPodiatech");}} style={{background:"#eff6ff",color:"#2563eb",padding:"6px 12px",fontSize:12}}>✏️</button>
                          <button className="btn" onClick={()=>setDeleteTarget({type:"podiatech",id:pd.id,name:`Podiatech ${p?shortName(p):""}`})} style={{background:"#fef2f2",color:"#dc2626",padding:"6px 12px",fontSize:12}}>🗑</button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            }
          </>}

          {/* ─── STOCK SUB-TAB ─── */}
          {podiatechSubTab==="stock"&&<>
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,marginBottom:20}}>
              {[{l:"На складе (пар)",v:totalStock,c:"#2563eb",i:"📦"},{l:"Позиций",v:stock.filter(s=>s.qty>0).length,c:"#0e7c6b",i:"📋"},{l:"Стоимость складу",v:`${(totalCost/1000).toFixed(0)}к ₸`,c:"#f59e0b",i:"💰"},{l:"Роздрібна стоимость",v:`${(totalValue/1000).toFixed(0)}к ₸`,c:"#10b981",i:"💵"}].map(s=>(
                <div key={s.l} className="card" style={{padding:"12px 16px",borderLeft:`4px solid ${s.c}`}}>
                  <div style={{fontSize:20}}>{s.i}</div>
                  <div style={{fontSize:22,fontWeight:700,fontFamily:"'DM Serif Display',serif",color:s.c}}>{s.v}</div>
                  <div style={{fontSize:11,color:"#64748b"}}>{s.l}</div>
                </div>
              ))}
            </div>

            {/* Stock by type */}
            {Object.entries(byType).length===0
              ?<div className="card" style={{padding:"52px",textAlign:"center",color:"#94a3b8"}}>Склад пуст</div>
              :Object.entries(byType).sort((a,b)=>b[1].qty-a[1].qty).map(([type,data])=>(
                <div key={type} className="card" style={{marginBottom:14,overflow:"hidden"}}>
                  <div style={{padding:"14px 20px",borderBottom:"1px solid #f0f4f8",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <div style={{display:"flex",alignItems:"center",gap:10}}>
                      <span style={{fontSize:18}}>🥿</span>
                      <span style={{fontFamily:"'DM Serif Display',serif",fontSize:16}}>{type}</span>
                    </div>
                    <span style={{fontSize:13,fontWeight:700,color:"#0e7c6b"}}>{data.qty} пар</span>
                  </div>
                  <table style={{width:"100%",borderCollapse:"collapse"}}>
                    <thead>
                      <tr style={{background:"#f8fafc"}}>
                        {["Размер","Количество","Собістоимость","Цена для пац.","Примечания",""].map((h,i)=><th key={i} style={{padding:"8px 14px",textAlign:i===5?"right":"left",fontSize:10}}>{h}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {data.items.sort((a,b)=>a.size-b.size).map(item=>(
                        <tr key={item.id} className="row-tr" style={{borderBottom:"1px solid #f0f4f8"}}>
                          <td style={{padding:"8px 14px",fontWeight:700,fontSize:15}}>{item.size}</td>
                          <td style={{padding:"8px 14px"}}><span style={{background:item.qty>0?(item.qty<=2?"#fef3c7":"#d1fae5"):"#fee2e2",padding:"3px 10px",borderRadius:12,fontWeight:700,fontSize:13,color:item.qty>0?(item.qty<=2?"#92400e":"#065f46"):"#991b1b"}}>{item.qty} пар</span></td>
                          <td style={{padding:"8px 14px",fontSize:13,color:"#64748b"}}>{item.cost?`${item.cost.toLocaleString()} ₸`:"—"}</td>
                          <td style={{padding:"8px 14px",fontSize:13,fontWeight:600,color:"#0e7c6b"}}>{item.price?`${item.price.toLocaleString()} ₸`:"—"}</td>
                          <td style={{padding:"8px 14px",fontSize:12,color:"#64748b",maxWidth:200}}><span style={{display:"block",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.notes||"—"}</span></td>
                          <td style={{padding:"8px 14px",textAlign:"right"}}>
                            <button className="btn" onClick={()=>{setEditStockOp({opType:"out",insoleType:item.type,size:item.size,qty:1,date:today(),notes:"",patientId:""});setModal("stockOp");}} style={{background:"#fff7ed",color:"#ea580c",padding:"4px 10px",fontSize:11}}>📤 Видати</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))
            }

            {/* Size distribution visual */}
            {stock.filter(s=>s.qty>0).length>0&&(
              <div className="card" style={{padding:"20px",marginTop:6}}>
                <div style={{fontSize:14,fontWeight:700,marginBottom:14,color:"#1a2332"}}>📊 Остатки за размерами</div>
                <MiniBar data={INSOLE_SIZES.filter(sz=>stock.some(s=>s.size===sz&&s.qty>0)).map(sz=>({label:String(sz),value:stock.filter(s=>s.size===sz).reduce((sum,s)=>sum+s.qty,0)}))} barColor="#2563eb" height={100}/>
              </div>
            )}
          </>}

          {/* ─── LOG SUB-TAB ─── */}
          {podiatechSubTab==="log"&&<>
            {stockLog.length===0
              ?<div className="card" style={{padding:"52px",textAlign:"center",color:"#94a3b8"}}>Операций поки нет</div>
              :<div className="card" style={{overflow:"hidden"}}>
                <table style={{width:"100%",borderCollapse:"collapse"}}>
                  <thead>
                    <tr style={{background:"#f8fafc",borderBottom:"2px solid #e8edf5"}}>
                      {["Дата","Операция","Тип стельки","Размер","Кіл-ть","Пациент","Примечания"].map((h,i)=><th key={i} style={{padding:"10px 14px",textAlign:"left"}}>{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {[...stockLog].sort((a,b)=>(b.date||"").localeCompare(a.date||"")).map(log=>{
                      const p = log.patientId ? getP(log.patientId) : null;
                      const isIn = log.opType==="in";
                      return (
                        <tr key={log.id} className="row-tr" style={{borderBottom:"1px solid #f0f4f8"}}>
                          <td style={{padding:"10px 14px",fontSize:13}}>{fmt(log.date)}</td>
                          <td style={{padding:"10px 14px"}}><span className="chip" style={{background:isIn?"#d1fae5":"#fff7ed",color:isIn?"#065f46":"#9a3412"}}>{isIn?"📥 Приход":"📤 Выдача"}</span></td>
                          <td style={{padding:"10px 14px",fontSize:13,fontWeight:600}}>{log.insoleType}</td>
                          <td style={{padding:"10px 14px",fontSize:15,fontWeight:700}}>{log.size}</td>
                          <td style={{padding:"10px 14px",fontSize:14,fontWeight:700,color:isIn?"#065f46":"#9a3412"}}>{isIn?"+":"-"}{log.qty}</td>
                          <td style={{padding:"10px 14px",fontSize:13}}>{p?shortName(p):"—"}</td>
                          <td style={{padding:"10px 14px",fontSize:12,color:"#64748b"}}>{log.notes||"—"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            }
          </>}
          </>;
        })()}

        {/* ════════════════════════════════════════ */}
        {/* TAB: DOCTORS                            */}
        {/* ════════════════════════════════════════ */}
        {tab==="doctors"&&<>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18,flexWrap:"wrap",gap:12}}>
            <div>
              <div style={{fontFamily:"'DM Serif Display',serif",fontSize:22}}>Специалисти клініки</div>
              <div style={{fontSize:13,color:"#64748b",marginTop:2}}>Управління врачями та графиком роботи</div>
            </div>
            <button className="btn" onClick={()=>{setEditDoctor({...EMPTY_DOCTOR});setModal("addDoctor");}} style={{background:"#0e7c6b",color:"#fff",padding:"8px 18px"}}>＋ Новый специалист</button>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(340px,1fr))",gap:14}}>
            {doctors.map(doc=>{
              const patCount = patients.filter(p=>p.doctor===doc.name).length;
              const apptCount = appointments.filter(a=>a.doctor===doc.name&&a.status==="scheduled").length;
              const protCount = protocols.filter(p=>p.doctor===doc.name&&p.status==="active").length;
              const todayDay = WEEKDAYS[new Date().getDay()===0?6:new Date().getDay()-1];
              const isWorkingToday = doc.schedule?.includes(todayDay);
              return (
                <div key={doc.id} className="card" style={{padding:0,overflow:"hidden"}}>
                  <div style={{background:"linear-gradient(135deg,#042f2e,#064e3b)",padding:"16px 20px",display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                    <div>
                      <div style={{fontFamily:"'DM Serif Display',serif",fontSize:17,color:"#fff"}}>{doc.name}</div>
                      {doc.specialization&&<div style={{fontSize:13,color:"rgba(255,255,255,.6)",marginTop:2}}>{doc.specialization}</div>}
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:6}}>
                      {isWorkingToday&&<span className="chip" style={{background:"#10b98133",color:"#6ee7b7",border:"1px solid #10b98155",fontSize:11}}>Сегодня работает</span>}
                    </div>
                  </div>
                  <div style={{padding:"16px 20px"}}>
                    <div style={{display:"flex",gap:16,marginBottom:12,fontSize:13,color:"#475569"}}>
                      {doc.phone&&<span>📞 {formatPhone(doc.phone)}</span>}
                      {doc.email&&<span>✉️ {doc.email}</span>}
                    </div>
                    {doc.schedule?.length>0&&(
                      <div style={{marginBottom:12}}>
                        <div style={{fontSize:11,fontWeight:700,color:"#64748b",marginBottom:6,textTransform:"uppercase",letterSpacing:".06em"}}>График</div>
                        <div style={{display:"flex",gap:4}}>
                          {WEEKDAYS.map(day=>(
                            <div key={day} style={{
                              width:32,height:32,borderRadius:8,fontSize:12,fontWeight:600,
                              display:"flex",alignItems:"center",justifyContent:"center",
                              background:doc.schedule.includes(day)?"#0e7c6b":"#f1f5f9",
                              color:doc.schedule.includes(day)?"#fff":"#94a3b8",
                              border:day===todayDay?"2px solid #f59e0b":"none"
                            }}>{day}</div>
                          ))}
                        </div>
                      </div>
                    )}
                    <div style={{display:"flex",gap:14,fontSize:13,marginBottom:12}}>
                      <span style={{color:"#0e7c6b",fontWeight:600}}>👥 {patCount} пац.</span>
                      <span style={{color:"#2563eb",fontWeight:600}}>📅 {apptCount} запись.</span>
                      <span style={{color:"#f59e0b",fontWeight:600}}>💊 {protCount} прот.</span>
                    </div>
                    {doc.notes&&<div style={{fontSize:12,color:"#64748b",background:"#f8fafc",padding:"8px 12px",borderRadius:8,marginBottom:12}}>{doc.notes}</div>}
                    <div style={{display:"flex",gap:6,justifyContent:"flex-end"}}>
                      <button className="btn" onClick={()=>{setEditDoctor({...doc,schedule:[...(doc.schedule||[])]});setModal("editDoctor");}} style={{background:"#eff6ff",color:"#2563eb",padding:"6px 14px",fontSize:12}}>✏️ Редактировать</button>
                      <button className="btn" onClick={()=>setDeleteTarget({type:"doctor",id:doc.id,name:doc.name})} style={{background:"#fef2f2",color:"#dc2626",padding:"6px 14px",fontSize:12}}>🗑</button>
                    </div>
                  </div>
                </div>
              );
            })}
            {doctors.length===0&&<div className="card" style={{padding:"52px",textAlign:"center",color:"#94a3b8",gridColumn:"1/-1"}}>Специалистів поки нет</div>}
          </div>
        </>}

        {/* ════════════════════════════════════════ */}
        {/* TAB: ANALYTICS                          */}
        {/* ════════════════════════════════════════ */}
        {tab==="analytics"&&<>
          <div style={{fontFamily:"'DM Serif Display',serif",fontSize:22,marginBottom:18}}>📊 Аналитика клиники</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,marginBottom:20}}>
            {[{l:"Пациенты",v:patients.length,c:"#0e7c6b",i:"👥"},{l:"Проведено приемів",v:appointments.filter(a=>a.status==="done").length,c:"#2563eb",i:"✅"},{l:"Активных протоколов",v:analytics.activeProts,c:"#f59e0b",i:"💊"},{l:"Podiatech диагностик",v:podiatech.length,c:"#8b5cf6",i:"🦶"}].map(s=>(
              <div key={s.l} className="card" style={{padding:"16px 20px",borderLeft:`4px solid ${s.c}`,display:"flex",alignItems:"center",gap:14}}>
                <div style={{fontSize:32}}>{s.i}</div>
                <div>
                  <div style={{fontSize:30,fontWeight:700,fontFamily:"'DM Serif Display',serif",color:s.c}}>{s.v}</div>
                  <div style={{fontSize:12,color:"#64748b"}}>{s.l}</div>
                </div>
              </div>
            ))}
          </div>

          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:20}}>
            {/* Doctor workload */}
            <div className="card" style={{padding:"20px"}}>
              <div style={{fontSize:14,fontWeight:700,marginBottom:14,color:"#1a2332"}}>👨‍⚕️ Загруженность врачів</div>
              {doctorNames.map(d=>{
                const load = analytics.doctorLoad[d]||{total:0,done:0,scheduled:0,patients:0};
                const doc = doctors.find(dr=>dr.name===d);
                return (
                  <div key={d} style={{marginBottom:14,paddingBottom:14,borderBottom:"1px solid #f0f4f8"}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                      <span style={{fontSize:13,fontWeight:600}}>{d.split(" ").slice(0,2).join(" ")}{doc?.specialization?<span style={{fontWeight:400,color:"#64748b"}}> · {doc.specialization}</span>:""}</span>
                      <span style={{fontSize:12,color:"#64748b"}}>{load.patients} пац.</span>
                    </div>
                    <div style={{display:"flex",gap:12,fontSize:12}}>
                      <span style={{color:"#10b981"}}>✓ {load.done} провед.</span>
                      <span style={{color:"#2563eb"}}>⏳ {load.scheduled} заплан.</span>
                      <span style={{color:"#1a2332"}}>Σ {load.total}</span>
                    </div>
                    <div className="progress-bar" style={{marginTop:6,height:6}}>
                      <div className="progress-fill" style={{width:`${Math.min(100,load.total*5)}%`,background:"#0e7c6b"}}/>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Top diagnoses */}
            <div className="card" style={{padding:"20px"}}>
              <div style={{fontSize:14,fontWeight:700,marginBottom:14,color:"#1a2332"}}>🩺 Топ диагнозів</div>
              {analytics.topDiag.length===0?<div style={{color:"#94a3b8",fontSize:13}}>Нет даних</div>:
                analytics.topDiag.map(([diag,count],i) => (
                  <div key={diag} style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
                    <div style={{width:24,height:24,borderRadius:"50%",background:"#0e7c6b22",color:"#0e7c6b",fontSize:11,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center"}}>{i+1}</div>
                    <div style={{flex:1,fontSize:13,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}} title={diag}>{diag}</div>
                    <div style={{fontWeight:700,fontSize:14,color:"#0e7c6b"}}>{count}</div>
                  </div>
                ))
              }
            </div>
          </div>

          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
            {/* Monthly visits chart */}
            <div className="card" style={{padding:"20px"}}>
              <div style={{fontSize:14,fontWeight:700,marginBottom:14,color:"#1a2332"}}>📅 Приеми по місяцях</div>
              {analytics.months.length>0?
                <MiniBar data={analytics.months.map((m,i)=>({label:analytics.monthLabels[i],value:analytics.monthlyAppts[m]||0}))} barColor="#0e7c6b"/>
                :<div style={{color:"#94a3b8",fontSize:13}}>Нет даних</div>}
            </div>

            {/* Procedures stats */}
            <div className="card" style={{padding:"20px"}}>
              <div style={{fontSize:14,fontWeight:700,marginBottom:14,color:"#1a2332"}}>⚡ Процедуры (выполнено сеансов)</div>
              {analytics.topProcs.length===0?<div style={{color:"#94a3b8",fontSize:13}}>Нет даних</div>:
                analytics.topProcs.map(([name,count]) => {
                  const cat = procCatalog.find(c=>c.name===name);
                  return (
                    <div key={name} style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
                      <span style={{fontSize:16}}>{cat?.icon||"📋"}</span>
                      <div style={{flex:1,fontSize:13}}>{name}</div>
                      <div style={{fontWeight:700,color:cat?.color||"#475569"}}>{count}</div>
                    </div>
                  );
                })
              }
            </div>
          </div>
        </>}

        {/* ════════════════════════════════════════ */}
        {/* TAB: REMINDERS                          */}
        {/* ════════════════════════════════════════ */}
        {tab==="reminders"&&<>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18,flexWrap:"wrap",gap:12}}>
            <div>
              <div style={{fontFamily:"'DM Serif Display',serif",fontSize:22}}>Напоминания</div>
              <div style={{fontSize:13,color:"#64748b",marginTop:2}}>Визити у найближчі 14 днів</div>
            </div>
            {urgentCount>0&&<div style={{background:"#fef2f2",border:"1px solid #fca5a5",borderRadius:10,padding:"10px 18px",color:"#dc2626",fontWeight:700}}>🚨 Срочно: {urgentCount}</div>}
          </div>
          {reminders.length===0
            ?<div className="card" style={{padding:"52px",textAlign:"center",color:"#94a3b8",fontSize:15}}>🎉 Нет ближайших напоминаний</div>
            :[{label:"🔴 Прострочені",filter:r=>r.days<0,col:"#dc2626"},{label:"🟠 Сегодня / завтра",filter:r=>r.days>=0&&r.days<=1,col:"#f59e0b"},{label:"🟡 Через 2–7 дней",filter:r=>r.days>=2&&r.days<=7,col:"#eab308"},{label:"🟢 Через 8–14 дней",filter:r=>r.days>=8&&r.days<=14,col:"#10b981"}].map(group=>{
              const items=reminders.filter(group.filter); if(!items.length) return null;
              return <div key={group.label} style={{marginBottom:22}}>
                <div style={{fontSize:12,fontWeight:700,color:"#64748b",marginBottom:8,textTransform:"uppercase",letterSpacing:".07em"}}>{group.label} ({items.length})</div>
                {items.map(({patient:p,days})=>(
                  <div key={p.id} style={{background:"#fff",borderLeft:`4px solid ${group.col}`,borderRadius:"0 12px 12px 0",padding:"12px 16px",marginBottom:8,boxShadow:"0 2px 8px rgba(8,16,36,.06)",display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}>
                    <div style={{width:38,height:38,borderRadius:"50%",background:group.col+"22",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>👤</div>
                    <div style={{flex:1,minWidth:180}}>
                      <div style={{fontWeight:700,fontSize:15}}>{fullName(p)}</div>
                      <div style={{fontSize:12,color:"#64748b"}}>{p.phone?formatPhone(p.phone):"—"} · {p.doctor}</div>
                      <div style={{fontSize:12,color:"#475569"}}>{p.diagnosis}{p.nextVisitNote?" · 📋 "+p.nextVisitNote:""}</div>
                    </div>
                    <div style={{textAlign:"right",marginRight:4}}>
                      <div style={{fontWeight:700,color:group.col,fontSize:15}}>{fmt(p.nextVisitDate)}</div>
                      <div style={{fontSize:12,color:"#64748b"}}>{days<0?`просрочено на ${-days}д`:days===0?"сегодня":days===1?"завтра":`через ${days}д`}</div>
                    </div>
                    <div style={{display:"flex",flexDirection:"column",gap:6}}>
                      <button className="btn" onClick={()=>setMessengerPat(p)} style={{background:"#25d366",color:"#fff",padding:"7px 16px",fontSize:13,display:"flex",alignItems:"center",gap:6}}>{WA_SVG} WhatsApp</button>
                      <button className="btn" onClick={()=>setMessengerPat(p)} style={{background:"#0088cc",color:"#fff",padding:"7px 16px",fontSize:13,display:"flex",alignItems:"center",gap:6}}>{TG_SVG} Telegram</button>
                    </div>
                  </div>
                ))}
              </div>;
            })
          }
        </>}

      </div>

      {/* ════════════════════════════════════════ */}
      {/* MODALS                                  */}
      {/* ════════════════════════════════════════ */}

      {messengerPat&&<MessengerModal patient={messengerPat} onClose={()=>setMessengerPat(null)}/>}
      {modal==="discharge"&&dischargePat&&<DischargeSummaryModal patient={dischargePat} protocols={protocols} appointments={appointments} procCatalog={procCatalog} onClose={()=>{setModal(null);setDischargePat(null);}}/>}

      {/* Patient view modal */}
      {modal==="viewPat"&&viewPat&&(
        <div className="modal-bg" onClick={()=>setModal(null)}>
          <div className="modal" style={{width:560,maxHeight:"92vh",overflow:"auto"}} onClick={e=>e.stopPropagation()}>
            <div style={{background:"linear-gradient(135deg,#042f2e,#064e3b)",padding:"20px 24px",borderRadius:"18px 18px 0 0",display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
              <div>
                <div style={{fontFamily:"'DM Serif Display',serif",fontSize:21,color:"#fff"}}>{fullName(viewPat)}</div>
                <div style={{color:"rgba(255,255,255,.6)",fontSize:13,marginTop:2}}>{fmt(viewPat.dob)} · {calcAge(viewPat.dob)} · {viewPat.phone?formatPhone(viewPat.phone):"—"}</div>
              </div>
              <span className="chip" style={{background:STATUS_COLORS[viewPat.status]+"44",color:"#fff",border:`1px solid ${STATUS_COLORS[viewPat.status]}`}}>{STATUSES[viewPat.status]}</span>
            </div>
            <div style={{padding:"20px 24px"}}>
              {[["🩺 Диагноз",viewPat.diagnosis||"—"],["👨‍⚕️ Врач",viewPat.doctor||"—"],["📆 Последний визит",fmt(viewPat.lastVisit)],["🔔 Следующий визит",viewPat.nextVisitDate?`${fmt(viewPat.nextVisitDate)} (${(d=>d<0?`просрочено ${-d}д`:d===0?"сегодня":`через ${d}д`)(daysUntil(viewPat.nextVisitDate))})`:"—"],["📋 Мета визиту",viewPat.nextVisitNote||"—"],["📝 Примечания",viewPat.notes||"—"]].map(([l,v])=>(
                <div key={l} style={{display:"flex",gap:10,marginBottom:11,paddingBottom:11,borderBottom:"1px solid #f0f4f8"}}>
                  <div style={{fontSize:13,color:"#64748b",minWidth:150,fontWeight:600}}>{l}</div>
                  <div style={{fontSize:14}}>{v}</div>
                </div>
              ))}
              {/* Protocols for this patient */}
              <div style={{marginTop:8}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                  <div style={{fontSize:11,fontWeight:700,color:"#0e7c6b",textTransform:"uppercase",letterSpacing:".06em"}}>💊 Протоколы лечения</div>
                  <button className="btn" onClick={()=>{setEditProtocol({patientId:viewPat.id,name:"",procedures:[{procedureName:"",totalSessions:5,completedSessions:0,notes:""}],startDate:today(),status:"active",doctor:viewPat.doctor||"",diagnosis:viewPat.diagnosis||""});setModal("addProtocol");}} style={{background:"#0e7c6b",color:"#fff",padding:"4px 12px",fontSize:11}}>＋ Протокол</button>
                </div>
                {protocols.filter(pr=>pr.patientId===viewPat.id).length>0?
                  protocols.filter(pr=>pr.patientId===viewPat.id).map(pr=>{
                    const totalAll = pr.procedures.reduce((s,proc)=>s+proc.totalSessions,0);
                    const doneAll = pr.procedures.reduce((s,proc)=>s+proc.completedSessions,0);
                    const pct = totalAll>0?Math.round(doneAll/totalAll*100):0;
                    const statusColor = pr.status==="active"?"#0e7c6b":pr.status==="completed"?"#6366f1":"#f59e0b";
                    return (
                      <div key={pr.id} style={{background:"#f0fdf4",borderRadius:10,padding:"10px 14px",marginBottom:8,border:"1px solid #bbf7d0"}}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                          <div style={{display:"flex",alignItems:"center",gap:6}}>
                            <span style={{fontWeight:700,fontSize:13}}>{pr.name}</span>
                            <span className="chip" style={{background:statusColor+"22",color:statusColor,fontSize:10}}>{pr.status==="active"?"Активный":pr.status==="completed"?"Завершён":"Пауза"}</span>
                          </div>
                          <div style={{display:"flex",gap:4}}>
                            {pr.status==="active"&&<button className="btn" onClick={()=>{const updated={...pr,procedures:pr.procedures.map(proc=>({...proc,completedSessions:Math.min(proc.completedSessions+1,proc.totalSessions)}))};setProtocols(prev=>prev.map(p=>p.id===pr.id?updated:p));showToast("+1 сеанс");}} style={{background:"#d1fae5",color:"#065f46",padding:"2px 8px",fontSize:10}}>＋1</button>}
                            <button className="btn" onClick={()=>{setEditProtocol({...pr,procedures:pr.procedures.map(p=>({...p}))});setModal("editProtocol");}} style={{background:"#eff6ff",color:"#2563eb",padding:"2px 8px",fontSize:10}}>✏️</button>
                          </div>
                        </div>
                        <div className="progress-bar" style={{height:6,marginBottom:6}}>
                          <div className="progress-fill" style={{width:`${pct}%`,background:statusColor}}/>
                        </div>
                        <div style={{fontSize:11,color:"#475569"}}>{pr.procedures.map(p=>{const meds=(p.medications||[]).length>0?` [${p.medications.join(", ")}]`:"";return `${procCatalog.find(c=>c.name===p.procedureName)?.icon||"📋"} ${p.procedureName} ${p.completedSessions}/${p.totalSessions}${meds}`;}).join("  ·  ")}</div>
                      </div>
                    );
                  })
                :<div style={{color:"#94a3b8",fontSize:13,padding:"4px 0"}}>Нет протоколів</div>}
              </div>
              {/* Appointments for this patient */}
              <div style={{marginTop:8}}>
                <div style={{fontSize:11,fontWeight:700,color:"#64748b",marginBottom:8,textTransform:"uppercase",letterSpacing:".06em"}}>Записьи на прием</div>
                {appointments.filter(a=>a.patientId===viewPat.id).sort((a,b)=>b.date.localeCompare(a.date)).slice(0,5).map(a=>(
                  <div key={a.id} style={{display:"flex",justifyContent:"space-between",padding:"7px 10px",background:"#f8fafc",borderRadius:7,marginBottom:4,fontSize:13}}>
                    <span>{fmt(a.date)} {a.time} — {a.type}{a.notes?` · ${a.notes}`:""}</span>
                    <span className="chip" style={{background:APPT_STATUS_COLORS[a.status]+"22",color:APPT_STATUS_COLORS[a.status],fontSize:11}}>{APPT_STATUSES[a.status]}</span>
                  </div>
                ))}
                {appointments.filter(a=>a.patientId===viewPat.id).length===0&&<div style={{color:"#94a3b8",fontSize:13}}>Нет записьей</div>}
              </div>
              <div style={{display:"flex",gap:8,marginTop:16,flexWrap:"wrap"}}>
                <button className="btn" onClick={()=>{setDischargePat(viewPat);setModal("discharge");}} style={{background:"#f0fdf4",color:"#0e7c6b",padding:"9px 14px"}}>📄 Выписка</button>
              <button className="btn" onClick={()=>{setModal(null);setTimelinePat(viewPat);setTimeout(()=>setModal("timeline"),50);}} style={{background:"#faf5ff",color:"#7c3aed",padding:"9px 14px"}}>📋 История</button>
                <button className="btn" onClick={()=>{setEditAppt({...EMPTY_APPT,patientId:viewPat.id,doctor:viewPat.doctor,date:today()});setModal("addAppt");}} style={{background:"#f0fdf4",color:"#10b981",padding:"9px 14px"}}>📅 Записьати</button>
                {viewPat.nextVisitDate&&<button className="btn" onClick={()=>{setModal(null);setMessengerPat(viewPat);}} style={{background:"#25d366",color:"#fff",padding:"9px 14px",display:"flex",alignItems:"center",gap:5}}>{WA_SVG} WA/TG</button>}
                <button className="btn" onClick={()=>{setEditPat({...viewPat});setModal("editPat");}} style={{flex:1,background:"#0e7c6b",color:"#fff",padding:"9px"}}>✏️ Редактировать</button>
                <button className="btn" onClick={()=>setDeleteTarget({type:"patient",id:viewPat.id,name:fullName(viewPat)})} style={{background:"#fef2f2",color:"#dc2626",padding:"9px 14px"}}>🗑</button>
                <button className="btn" onClick={()=>setModal(null)} style={{background:"#f1f5f9",color:"#475569",padding:"9px 14px"}}>✕</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Timeline modal */}
      {modal==="timeline"&&timelinePat&&(
        <div className="modal-bg" onClick={()=>setModal(null)}>
          <div className="modal" style={{width:600,maxHeight:"92vh",overflow:"auto"}} onClick={e=>e.stopPropagation()}>
            <div style={{background:"linear-gradient(135deg,#3b0764,#7c3aed)",padding:"18px 24px",borderRadius:"18px 18px 0 0",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div>
                <div style={{fontFamily:"'DM Serif Display',serif",fontSize:18,color:"#fff"}}>📋 История лечения</div>
                <div style={{color:"rgba(255,255,255,.65)",fontSize:13,marginTop:2}}>{fullName(timelinePat)}</div>
              </div>
              <button className="btn" onClick={()=>setModal(null)} style={{background:"rgba(255,255,255,.15)",color:"#fff",padding:"5px 11px"}}>✕</button>
            </div>
            <div style={{padding:"20px 24px"}}>
              {(()=>{
                const events = getTimeline(timelinePat.id);
                if(events.length===0) return <div style={{textAlign:"center",color:"#94a3b8",padding:"30px"}}>Нет записьей в історії</div>;
                return events.map((ev,i) => (
                  <div key={i} style={{display:"flex",gap:14,marginBottom:0,position:"relative",animationDelay:`${i*0.05}s`}} className="fade-item">
                    <div style={{display:"flex",flexDirection:"column",alignItems:"center",position:"relative"}}>
                      <div className="timeline-dot" style={{background:ev.color,boxShadow:`0 0 0 2px ${ev.color}33`}}/>
                      {i<events.length-1&&<div style={{width:2,background:"#e2e8f0",flex:1,minHeight:20}}/>}
                    </div>
                    <div style={{flex:1,paddingBottom:18}}>
                      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                        <span style={{fontSize:12,color:"#64748b",fontWeight:600}}>{fmt(ev.date)} {ev.time}</span>
                        <span className="chip" style={{background:ev.color+"22",color:ev.color,fontSize:11}}>
                          {ev.type==="appt"?APPT_STATUSES[ev.status]||ev.status:ev.type==="protocol"?(ev.status==="active"?"Активный":"Завершён"):INSOLE_STATUSES[ev.status]||ev.status}
                        </span>
                      </div>
                      <div style={{fontWeight:600,fontSize:14,color:"#1a2332"}}>{ev.label}</div>
                      {ev.notes&&<div style={{fontSize:12,color:"#475569",marginTop:2}}>{ev.notes}</div>}
                      {ev.doctor&&<div style={{fontSize:11,color:"#94a3b8",marginTop:2}}>👨‍⚕️ {ev.doctor}</div>}
                    </div>
                  </div>
                ));
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Form modals */}
      {(modal==="addPat"||modal==="editPat")&&editPat&&<PatientForm form={editPat} setForm={setEditPat} isAdd={modal==="addPat"} onSave={savePat} onClose={()=>setModal(null)} doctorNames={doctorNames}/>}
      {(modal==="addAppt"||modal==="editAppt")&&editAppt&&<ApptForm form={editAppt} setForm={setEditAppt} isAdd={modal==="addAppt"} patients={patients} onSave={saveAppt} onClose={()=>setModal(null)} doctorNames={doctorNames} onCreatePatient={(p)=>setPatients(prev=>[...prev,p])}/>}
      {(modal==="addProtocol"||modal==="editProtocol")&&editProtocol&&<ProtocolForm form={editProtocol} setForm={setEditProtocol} isAdd={modal==="addProtocol"} patients={patients} onSave={saveProtocol} onClose={()=>setModal(null)} doctorNames={doctorNames} procCatalog={procCatalog}/>}
      {(modal==="addDoctor"||modal==="editDoctor")&&editDoctor&&<DoctorForm form={editDoctor} setForm={setEditDoctor} isAdd={modal==="addDoctor"} onSave={saveDoctor} onClose={()=>setModal(null)}/>}
      {(modal==="addPodiatech"||modal==="editPodiatech")&&editPodiatech&&<PodiatechForm form={editPodiatech} setForm={setEditPodiatech} isAdd={modal==="addPodiatech"} patients={patients} onSave={savePodiatech} onClose={()=>setModal(null)}/>}
      {modal==="stockOp"&&editStockOp&&<StockOpForm form={editStockOp} setForm={setEditStockOp} patients={patients} stock={stock} onSave={saveStockOp} onClose={()=>setModal(null)}/>}

      {/* Procedure catalog form */}
      {(modal==="addProc"||modal==="editProc")&&editProc&&(
        <div className="modal-bg" onClick={()=>setModal(null)}>
          <div className="modal" style={{width:500,maxHeight:"93vh",overflow:"auto"}} onClick={e=>e.stopPropagation()}>
            <div style={{background:"linear-gradient(135deg,#064e3b,#0e7c6b)",padding:"18px 24px",borderRadius:"18px 18px 0 0",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div style={{fontFamily:"'DM Serif Display',serif",fontSize:18,color:"#fff"}}>{modal==="addProc"?"📋 Новая процедура":"Редактирование процедури"}</div>
              <button className="btn" onClick={()=>setModal(null)} style={{background:"rgba(255,255,255,.15)",color:"#fff",padding:"5px 11px"}}>✕</button>
            </div>
            <div style={{padding:"20px 24px",display:"flex",flexDirection:"column",gap:12}}>
              <div className="field"><label>Название процедуры *</label><input value={editProc.name||""} onChange={e=>setEditProc(f=>({...f,name:e.target.value}))} placeholder="Название процедуры"/></div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                <div className="field"><label>Категория</label>
                  <select value={editProc.category||""} onChange={e=>setEditProc(f=>({...f,category:e.target.value}))}>
                    {PROCEDURE_CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="field"><label>Сеансов за замовчуванням</label><input type="number" min={1} value={editProc.defaultSessions||5} onChange={e=>setEditProc(f=>({...f,defaultSessions:+e.target.value}))}/></div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                <div className="field"><label>Цена за сеанс (₸)</label><input type="number" min={0} value={editProc.price||0} onChange={e=>setEditProc(f=>({...f,price:+e.target.value}))} placeholder="0"/></div>
                <div style={{fontSize:13,color:"#64748b",alignSelf:"end",paddingBottom:10}}>Курс: <b style={{color:"#0e7c6b"}}>{((editProc.price||0)*(editProc.defaultSessions||1)).toLocaleString()} ₸</b></div>
              </div>
              <div>
                <label style={{display:"block",fontSize:11,fontWeight:700,color:"#64748b",marginBottom:8,letterSpacing:".06em",textTransform:"uppercase"}}>Иконка и цвет</label>
                <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:10}}>
                  {PROCEDURE_ICONS.map(ic=>(
                    <button key={ic} className="btn" onClick={()=>setEditProc(f=>({...f,icon:ic}))} style={{width:36,height:36,fontSize:18,background:editProc.icon===ic?"#0e7c6b22":"#f8fafc",border:editProc.icon===ic?"2px solid #0e7c6b":"2px solid #e2e8f0",borderRadius:8}}>{ic}</button>
                  ))}
                </div>
                <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                  {PROCEDURE_COLORS.map(cl=>(
                    <button key={cl} className="btn" onClick={()=>setEditProc(f=>({...f,color:cl}))} style={{width:28,height:28,background:cl,borderRadius:7,border:editProc.color===cl?"3px solid #1a2332":"3px solid transparent"}}/>
                  ))}
                </div>
              </div>
              <div style={{display:"flex",gap:10,marginTop:8}}>
                <button className="btn" onClick={()=>editProc.name?.trim()&&saveProcCatalogItem(editProc)} disabled={!editProc.name?.trim()} style={{flex:1,background:editProc.name?.trim()?"#0e7c6b":"#e2e8f0",color:editProc.name?.trim()?"#fff":"#94a3b8",padding:"12px",fontSize:15}}>{modal==="addProc"?"📋 Добавить процедуру":"💾 Сохранить"}</button>
                <button className="btn" onClick={()=>setModal(null)} style={{background:"#f1f5f9",color:"#475569",padding:"12px 20px"}}>Отменить</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {deleteTarget&&(
        <div className="modal-bg" onClick={()=>setDeleteTarget(null)}>
          <div className="modal" style={{width:360,padding:"30px 26px",textAlign:"center"}} onClick={e=>e.stopPropagation()}>
            <div style={{fontSize:42,marginBottom:10}}>🗑️</div>
            <div style={{fontFamily:"'DM Serif Display',serif",fontSize:18,marginBottom:6}}>Удалить?</div>
            <div style={{fontSize:14,color:"#64748b",marginBottom:6}}><b>{deleteTarget.name}</b></div>
            {deleteTarget.type==="patient"&&<div style={{fontSize:12,color:"#ef4444",marginBottom:16}}>Усі записьи, протоколи та дані Podiatech також будуть видалені.</div>}
            <div style={{fontSize:12,color:"#94a3b8",marginBottom:22}}>Цю дію не можна отменить.</div>
            <div style={{display:"flex",gap:10}}>
              <button className="btn" onClick={()=>{
                if(deleteTarget.type==="patient") deletePat(deleteTarget.id);
                else if(deleteTarget.type==="appt") deleteAppt(deleteTarget.id);
                else if(deleteTarget.type==="protocol") deleteProtocol(deleteTarget.id);
                else if(deleteTarget.type==="podiatech") deletePodiatech(deleteTarget.id);
                else if(deleteTarget.type==="doctor") deleteDoctor(deleteTarget.id);
                else if(deleteTarget.type==="stockItem") deleteStockItem(deleteTarget.id);
                else if(deleteTarget.type==="procCatalog") deleteProcCatalogItem(deleteTarget.id);
              }} style={{flex:1,background:"#dc2626",color:"#fff",padding:"11px",fontSize:14}}>Удалить</button>
              <button className="btn" onClick={()=>setDeleteTarget(null)} style={{flex:1,background:"#f1f5f9",color:"#475569",padding:"11px"}}>Отменить</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
