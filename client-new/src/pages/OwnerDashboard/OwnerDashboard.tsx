import React, { useState, useEffect, useMemo } from 'react';
import { 
  Activity, AlertTriangle, AlertCircle, Award, BookOpen, Brain, Calendar, 
  CheckCircle2, ChevronDown, ChevronUp, Clock, Coins, Database, FileText, 
  Filter, Flame, Gauge, Globe, HelpCircle, Info, Landmark, Lightbulb, 
  MapPin, RefreshCcw, Search, Send, ShieldAlert, Sparkles, Star, Users, X, 
  Settings, Pencil, Trash2, Timer
} from 'lucide-react';
import { useAppSelector } from '../../store/hooks';
import api from '../../api/client';
import { gamificationApi, type KPIDrop, type PerformanceReview } from '../../api/gamification';
import styles from './OwnerDashboard.module.css';

interface EmployeeKPI {
  id: string;
  name: string;
  department: string;
  kpiValue: number;
  kpi1: number;
  kpi2: number;
  kpi3: number;
  kpi5: number;
  kpi7: number;
  kpi8: number;
  kpi9: number;
  kpi10: number;
  isIntern: boolean;
  status: string;
}

interface ReturnRecord {
  id: string;
  employeeName: string;
  taskTitle: string;
  errorCategory: string;
  effectiveHours: number;
  date: string;
}

interface CustomerSatisfaction {
  id: string;
  projectName: string;
  rating: number;
  comment: string;
  date: string;
  participants: { name: string; weight: number }[];
  integrationStatus?: string;
}

interface WeeklyReport {
  id: string;
  employeeName: string;
  role: string;
  status: 'На проверке' | 'Принят' | 'На доработке';
  date: string;
  content: string;
}

interface ExceptionRecord {
  id: string;
  employeeName: string;
  date: string;
  reason: string;
}

interface AuditLog {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  target: string;
  details: string;
}

// Profile Modal Helper Components & Data (Requirements 7, 10, 11)
const kpiDescriptions: Record<string, { title: string; desc: string; target: string }> = {
  kpi1: { title: 'KPI1 (Срок)', desc: 'Соблюдение сроков сдачи задач. Оценивает своевременность выполнения работ в спринтах.', target: '>= 90%' },
  kpi2: { title: 'KPI2 (Дисциплина)', desc: 'Пунктуальность и учет рабочего времени на платформе. Включает опоздания и уважительные пропуски.', target: '>= 85%' },
  kpi3: { title: 'KPI3 (Инициативность)', desc: 'Индекс проявления инициативы, подача рацпредложений и участие в улучшении процессов.', target: '>= 80%' },
  kpi5: { title: 'KPI5 (Качество)', desc: 'Отсутствие брака, ошибок и возвратов задач на доработку.', target: '>= 85%' },
  kpi7: { title: 'KPI7 (Отчетность)', desc: 'Своевременное предоставление и полнота еженедельных и ежедневных отчетов.', target: '>= 90%' },
  kpi8: { title: 'KPI8 (Внимательность)', desc: 'Точность и безошибочность заполнения форм, разборов падений и анкет.', target: '>= 90%' },
  kpi10: { title: 'KPI10 (Ответственность)', desc: 'Соблюдение правил платформы, отсутствие штрафов и выговоров от руководства.', target: '>= 90%' }
};

const getKpiTrend = (name: string): number[] => {
  switch (name) {
    case 'Иван Иванов': return [85, 88, 87, 90, 91, 92];
    case 'Мария Сидорова': return [80, 75, 70, 72, 65, 68];
    case 'Петр Петров': return [78, 80, 82, 85, 83, 84];
    case 'Анна Кузнецова': return [75, 72, 74, 71, 70, 72];
    case 'Николай Орлов': return [40, 42, 45, 43, 46, 48];
    case 'Алексей Смирнов': return [82, 84, 86, 85, 87, 88];
    case 'Елена Соколова': return [88, 89, 90, 91, 90, 91];
    default: return [70, 72, 75, 73, 76, 78];
  }
};

const getCompletedTasks = (name: string, department: string) => {
  if (department.includes('Разработка')) {
    return [
      { id: 't-1', title: 'Оптимизация SQL-запросов KPI дашборда', date: '12.06.2026', status: 'Выполнено в срок' },
      { id: 't-2', title: 'Интеграция Telegram Webhook API', date: '09.06.2026', status: 'Выполнено в срок' },
      { id: 't-3', title: 'Разработка компонента Sparkline Chart', date: '05.06.2026', status: 'Выполнено с задержкой' }
    ];
  } else if (department.includes('Маркетинг')) {
    return [
      { id: 't-1', title: 'Настройка таргетированной рекламы VK', date: '11.06.2026', status: 'Выполнено в срок' },
      { id: 't-2', title: 'Создание контент-плана на июнь', date: '08.06.2026', status: 'Выполнено в срок' },
      { id: 't-3', title: 'A/B тестирование лид-формы лендинга', date: '03.06.2026', status: 'Выполнено в срок' }
    ];
  } else if (department.includes('Дизайн')) {
    return [
      { id: 't-1', title: 'Редизайн интерфейса личного кабинета', date: '10.06.2026', status: 'Выполнено в срок' },
      { id: 't-2', title: 'Создание брендбука Agile Workspace v2.0', date: '06.06.2026', status: 'Выполнено в срок' }
    ];
  } else {
    return [
      { id: 't-1', title: 'Прохождение вводного курса по регламентам', date: '13.06.2026', status: 'Выполнено в срок' },
      { id: 't-2', title: 'Тестовое заполнение форм разборов', date: '11.06.2026', status: 'Выполнено в срок' }
    ];
  }
};

function KpiTrendChart({ points, color = '#6366f1' }: { points: number[], color?: string }) {
  const width = 300;
  const height = 100;
  const padding = 15;
  const minKpi = 30;
  const maxKpi = 100;
  const range = maxKpi - minKpi;
  
  const coordinates = points.map((val, idx) => {
    const x = padding + idx * ((width - 2 * padding) / (points.length - 1));
    const y = height - padding - ((val - minKpi) / range) * (height - 2 * padding);
    return { x, y, value: val };
  });

  const pathD = coordinates.reduce((acc, coord, idx) => {
    return acc + (idx === 0 ? `M ${coord.x} ${coord.y}` : ` L ${coord.x} ${coord.y}`);
  }, '');

  const fillD = `${pathD} L ${width - padding} ${height - padding} L ${padding} ${height - padding} Z`;

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--color-text-secondary)' }}>
        <span>Тенденция KPI (спринт 1-6)</span>
        <span>Макс: {Math.max(...points)}%</span>
      </div>
      <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '10px', display: 'flex', justifyContent: 'center' }}>
        <svg width={width} height={height} style={{ overflow: 'visible' }}>
          <defs>
            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.3" />
              <stop offset="100%" stopColor={color} stopOpacity="0.0" />
            </linearGradient>
          </defs>
          <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="var(--color-border)" strokeWidth="0.5" strokeDasharray="4" />
          <line x1={padding} y1={height/2} x2={width - padding} y2={height/2} stroke="var(--color-border)" strokeWidth="0.5" strokeDasharray="4" />
          <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="var(--color-border)" strokeWidth="0.5" />
          <path d={fillD} fill="url(#chartGradient)" />
          <path d={pathD} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          {coordinates.map((coord, idx) => (
            <g key={idx}>
              <circle cx={coord.x} cy={coord.y} r="5" fill="#ffffff" stroke={color} strokeWidth="2.5" />
              <text x={coord.x} y={coord.y - 8} textAnchor="middle" fontSize="9" fontWeight="bold" fill="var(--color-text)" stroke="var(--color-bg)" strokeWidth="2" paintOrder="stroke">
                {coord.value}%
              </text>
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}

export default function OwnerDashboard() {
  const { user } = useAppSelector(s => s.auth);
  
  // UI Tabs State
  const [activeTab, setActiveTab] = useState<'dashboard' | 'kpis' | 'departments' | 'satisfaction' | 'interns' | 'integrations' | 'audit'>('dashboard');
  const [internToAccept, setInternToAccept] = useState<string | null>(null);
  const [acceptRole, setAcceptRole] = useState('user');
  const [acceptDepartment, setAcceptDepartment] = useState('Разработка');
  const [acceptManager, setAcceptManager] = useState('');

  // Interactive Data States
  const [employees, setEmployees] = useState<EmployeeKPI[]>([
    { id: '1', name: 'Иван Иванов', department: 'Разработка', kpiValue: 92, kpi1: 95, kpi2: 90, kpi3: 88, kpi5: 94, kpi7: 90, kpi8: 96, kpi9: 12, kpi10: 95, isIntern: false, status: 'active' },
    { id: '2', name: 'Мария Сидорова', department: 'Разработка', kpiValue: 68, kpi1: 65, kpi2: 70, kpi3: 60, kpi5: 72, kpi7: 65, kpi8: 68, kpi9: 4, kpi10: 70, isIntern: false, status: 'active' },
    { id: '3', name: 'Петр Петров', department: 'Маркетинг', kpiValue: 84, kpi1: 85, kpi2: 82, kpi3: 80, kpi5: 86, kpi7: 85, kpi8: 88, kpi9: 8, kpi10: 84, isIntern: false, status: 'active' },
    { id: '4', name: 'Анна Кузнецова', department: 'Дизайн', kpiValue: 72, kpi1: 74, kpi2: 70, kpi3: 68, kpi5: 75, kpi7: 72, kpi8: 73, kpi9: 6, kpi10: 72, isIntern: false, status: 'active' },
    { id: '5', name: 'Николай Орлов', department: 'Разработка', kpiValue: 48, kpi1: 45, kpi2: 50, kpi3: 40, kpi5: 48, kpi7: 45, kpi8: 52, kpi9: 2, kpi10: 48, isIntern: true, status: 'active' },
    { id: '6', name: 'Алексей Смирнов', department: 'Начальник Разработки', kpiValue: 88, kpi1: 90, kpi2: 85, kpi3: 88, kpi5: 87, kpi7: 90, kpi8: 89, kpi9: 10, kpi10: 88, isIntern: false, status: 'active' },
    { id: '7', name: 'Елена Соколова', department: 'Начальник Маркетинга', kpiValue: 91, kpi1: 92, kpi2: 90, kpi3: 92, kpi5: 90, kpi7: 92, kpi8: 91, kpi9: 14, kpi10: 91, isIntern: false, status: 'active' },
    { id: '8', name: 'Дмитриев А.', department: 'Разработка', kpiValue: 82, kpi1: 80, kpi2: 85, kpi3: 78, kpi5: 84, kpi7: 82, kpi8: 80, kpi9: 9, kpi10: 82, isIntern: false, status: 'active' },
    { id: '9', name: 'Соколов Д.', department: 'Дизайн', kpiValue: 75, kpi1: 78, kpi2: 72, kpi3: 75, kpi5: 70, kpi7: 76, kpi8: 78, kpi9: 7, kpi10: 75, isIntern: false, status: 'active' }
  ]);

  const [activeDrops, setActiveDrops] = useState<KPIDrop[]>([]);
  
  // Custom returns KPI5 list
  const [returns, setReturns] = useState<ReturnRecord[]>([
    { id: 'ret-1', employeeName: 'Мария Сидорова', taskTitle: 'Разработка авторизации', errorCategory: 'Мелкая ошибка (код)', effectiveHours: 2.5, date: '2026-05-28' },
    { id: 'ret-2', employeeName: 'Петр Петров', taskTitle: 'Создание лендинга акций', errorCategory: 'Средняя ошибка (дизайн)', effectiveHours: 4.0, date: '2026-05-29' }
  ]);

  // Customer satisfaction reviews list
  const [satisfactionList, setSatisfactionList] = useState<CustomerSatisfaction[]>([
    { id: 'sat-1', projectName: 'Интеграция СРМ', rating: 5, comment: 'Все супер, вовремя и качественно!', date: '2026-05-25', participants: [{ name: 'Иван Иванов', weight: 60 }, { name: 'Мария Сидорова', weight: 40 }], integrationStatus: 'Активна' },
    { id: 'sat-2', projectName: 'Дизайн Мобильного Приложения', rating: 2, comment: 'Затянули сроки и не учли ТЗ.', date: '2026-05-27', participants: [{ name: 'Анна Кузнецова', weight: 100 }], integrationStatus: 'Ошибка синхронизации' }
  ]);

  // Weekly reports list
  const [weeklyReports, setWeeklyReports] = useState<WeeklyReport[]>([
    { id: 'rep-1', employeeName: 'Алексей Смирнов', role: 'Начальник Разработки', status: 'На проверке', date: '2026-05-29', content: 'Отчет за 22 неделю: завершена разработка модуля геймификации, KPI сотрудников выросли на 4%.' },
    { id: 'rep-2', employeeName: 'Елена Соколова', role: 'Начальник Маркетинга', status: 'Принят', date: '2026-05-29', content: 'Отчет за 22 неделю: запущена таргетированная реклама, лид-форма показывает конверсию 12.5%.' }
  ]);

  // Exceptions list
  const [exceptions, setExceptions] = useState<ExceptionRecord[]>([
    { id: 'exc-1', employeeName: 'Мария Сидорова', date: '2026-05-30', reason: 'Больничный (уважительная причина)' },
    { id: 'exc-2', employeeName: 'Анна Кузнецова', date: '2026-05-29', reason: 'Технический сбой сети провайдера' }
  ]);

  // Audit Logs list
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([
    { id: 'aud-1', timestamp: '2026-05-30 21:30', actor: 'Владелец (Вы)', action: 'Ручная корректировка KPI', target: 'Мария Сидорова', details: 'Изменение KPI2 со 70% на 85% по причине уважительного больничного.' },
    { id: 'aud-2', timestamp: '2026-05-30 21:45', actor: 'Владелец (Вы)', action: 'Удаление ошибочного возврата', target: 'Петр Петров', details: 'Возврат по задаче лендинга удален, KPI5 пересчитан.' }
  ]);

  // Config parameters
  const [kpiNorms, setKpiNorms] = useState({
    internHours: 4,
    kpiPeriodWeeks: 2,
    overtimeThresholdPct: 90,
    delayToleranceMin: 15
  });

  const [bonusPercentages, setBonusPercentages] = useState({
    earlyArrivalPct: 5,
    helpColleaguePct: 5,
    qualityDeliveryPct: 2
  });

  // Modal Dialogs States
  const [isEditKpiOpen, setIsEditKpiOpen] = useState(false);
  const [selectedEmpForKpi, setSelectedEmpForKpi] = useState<EmployeeKPI | null>(null);
  const [editedKpis, setEditedKpis] = useState<Record<string, number>>({});

  const [selectedEmployeeProfile, setSelectedEmployeeProfile] = useState<EmployeeKPI | null>(null);
  const [activeCheckpointTab, setActiveCheckpointTab] = useState<'0' | '1' | '1.1'>('1');
  const [profileStartDate, setProfileStartDate] = useState('2026-06-01');
  const [profileEndDate, setProfileEndDate] = useState('2026-06-14');
  const [selectedEventDay, setSelectedEventDay] = useState<string | null>('2026-06-01');

  // Generate daily events mock data for the selected employee and date range
  const getDailyEventsForEmployee = (employeeName: string, startDateStr: string, endDateStr: string) => {
    const start = new Date(startDateStr);
    const end = new Date(endDateStr);
    const dayList: Array<{ date: string; status: 'good' | 'warning' | 'error' | 'weekend'; events: string[] }> = [];

    // loop day by day
    let current = new Date(start);
    while (current <= end) {
      const dateString = current.toISOString().split('T')[0];
      const dayOfWeek = current.getDay();
      
      let status: 'good' | 'warning' | 'error' | 'weekend' = 'good';
      let events: string[] = [];

      if (dayOfWeek === 0 || dayOfWeek === 6) {
        status = 'weekend';
        events = ['Выходной день'];
      } else {
        // Mock some interesting events based on employee name and date hash
        const hash = (employeeName.length + current.getDate()) % 10;
        if (hash === 1) {
          status = 'warning';
          events = ['Незначительное опоздание на утренний созвон на 10 минут', 'Отчет сдан с задержкой в 2 часа'];
        } else if (hash === 5) {
          status = 'error';
          events = ['Критическая просрочка задачи "Интеграция API"', 'Пропущен ежедневный отчет'];
        } else {
          status = 'good';
          events = ['Все задачи выполнены в срок', 'Активность в репозитории: 4 коммита', 'Ежедневный отчет принят без замечаний'];
        }
      }

      dayList.push({
        date: dateString,
        status,
        events
      });

      // Avoid infinite loop if date parsing fails or wraps
      const prevTime = current.getTime();
      current.setDate(current.getDate() + 1);
      if (current.getTime() <= prevTime) {
        break; // safety break
      }
    }
    return dayList;
  };

  const renderEventTimelineWidget = (emp: EmployeeKPI) => {
    const dailyData = getDailyEventsForEmployee(emp.name, profileStartDate, profileEndDate);
    const selectedDayData = dailyData.find(d => d.date === selectedEventDay) || (dailyData.length > 0 ? dailyData[0] : null);

    const presetPeriods = [
      { label: 'Последние 2 недели (01.06 - 14.06)', start: '2026-06-01', end: '2026-06-14' },
      { label: 'Предыдущие 2 недели (18.05 - 31.05)', start: '2026-05-18', end: '2026-05-31' },
      { label: 'Май 2026', start: '2026-05-01', end: '2026-05-31' }
    ];

    return (
      <div className={styles.checkpointSection} style={{ marginTop: '20px' }}>
        <h4 style={{ fontSize: '13px', fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Activity size={16} style={{ color: 'var(--color-primary)' }} />
          Интерактивная диаграмма событий по дням
        </h4>

        {/* Date presets selection */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
          {presetPeriods.map((p, idx) => (
            <button
              key={idx}
              type="button"
              className="btn btn-outline btn-xs"
              style={{
                borderColor: profileStartDate === p.start && profileEndDate === p.end ? 'var(--color-primary)' : '',
                color: profileStartDate === p.start && profileEndDate === p.end ? 'var(--color-primary)' : '',
                fontSize: '11px',
                padding: '2px 8px'
              }}
              onClick={() => {
                setProfileStartDate(p.start);
                setProfileEndDate(p.end);
                setSelectedEventDay(p.start);
              }}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Custom date range inputs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', flexWrap: 'wrap', fontSize: '12px' }}>
          <span>Выбрать произвольный период:</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <label>С</label>
            <input
              type="date"
              className="input input-bordered input-xs"
              style={{ background: 'var(--color-bg)', color: 'var(--color-text)', border: '1px solid var(--color-border)' }}
              value={profileStartDate}
              onChange={(e) => {
                setProfileStartDate(e.target.value);
                setSelectedEventDay(e.target.value);
              }}
            />
            <label>По</label>
            <input
              type="date"
              className="input input-bordered input-xs"
              style={{ background: 'var(--color-bg)', color: 'var(--color-text)', border: '1px solid var(--color-border)' }}
              value={profileEndDate}
              onChange={(e) => {
                setProfileEndDate(e.target.value);
                if (selectedEventDay && selectedEventDay > e.target.value) {
                  setSelectedEventDay(e.target.value);
                }
              }}
            />
          </div>
        </div>

        {/* Horizontal Event Blocks Diagram */}
        <div style={{ 
          display: 'flex', 
          gap: '6px', 
          overflowX: 'auto', 
          paddingBottom: '8px', 
          marginBottom: '14px',
          borderBottom: '1px solid var(--color-border-light)'
        }}>
          {dailyData.map((day) => {
            const isSelected = selectedEventDay === day.date;
            let bgColor = '#10b981'; // good
            let label = 'В срок';
            if (day.status === 'weekend') {
              bgColor = '#4b5563';
              label = 'Выходной';
            } else if (day.status === 'warning') {
              bgColor = '#f59e0b';
              label = 'Внимание';
            } else if (day.status === 'error') {
              bgColor = '#ef4444';
              label = 'Нарушение';
            }

            return (
              <div
                key={day.date}
                onClick={() => setSelectedEventDay(day.date)}
                style={{
                  flex: '1 0 54px',
                  minWidth: '54px',
                  padding: '8px 4px',
                  borderRadius: '6px',
                  border: isSelected ? '2px solid var(--color-primary)' : '1px solid var(--color-border-light)',
                  backgroundColor: 'var(--color-bg-secondary)',
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'all 0.2s',
                  transform: isSelected ? 'scale(1.03)' : 'none'
                }}
              >
                <div style={{ fontSize: '10px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
                  {day.date.split('-').slice(1).reverse().join('.')}
                </div>
                <div style={{ 
                  width: '12px', 
                  height: '12px', 
                  borderRadius: '50%', 
                  backgroundColor: bgColor, 
                  margin: '0 auto 4px' 
                }} />
                <div style={{ fontSize: '8px', fontWeight: 600, color: 'var(--color-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {label}
                </div>
              </div>
            );
          })}
        </div>

        {/* Daily events list for the selected day */}
        {selectedDayData && (
          <div style={{
            padding: '12px',
            backgroundColor: 'var(--color-bg-tertiary)',
            borderRadius: '6px',
            border: '1px solid var(--color-border-light)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <strong style={{ fontSize: '12px' }}>
                События за день: {selectedDayData.date.split('-').reverse().join('.')}
              </strong>
              <span style={{ 
                fontSize: '10px', 
                padding: '2px 6px', 
                borderRadius: '4px',
                color: '#fff',
                backgroundColor: selectedDayData.status === 'good' ? '#10b981' : selectedDayData.status === 'warning' ? '#f59e0b' : selectedDayData.status === 'error' ? '#ef4444' : '#4b5563'
              }}>
                {selectedDayData.status === 'good' ? 'Норма' : selectedDayData.status === 'warning' ? 'Внимание' : selectedDayData.status === 'error' ? 'Ошибка' : 'Выходной'}
              </span>
            </div>
            <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '12px', lineHeight: 1.5, color: 'var(--color-text-secondary)' }}>
              {selectedDayData.events.map((evt, idx) => (
                <li key={idx}>{evt}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  const renderCheckpointPathway = (emp: EmployeeKPI) => {
    const checkpoints = [
      { id: '0', label: '0', title: 'Старт спринта', desc: '0-й день: Сброс счетчиков, инициализация базовых показателей. Дисциплина и активность установлены в 100%.', status: 'Пройден' },
      { id: '1', label: '1', title: 'Промежуточный чекпоинт', desc: `7-й день: Оценка качества работы и дедлайнов. Текущая дисциплина сотрудника: ${emp.kpi2}%. Нарушений нет.`, status: emp.kpiValue >= 70 ? 'Успешно' : 'Внимание' },
      { id: '1.1', label: '1.1', title: 'Итоговый чекпоинт', desc: `14-й день: Финальный расчет. Прогресс закрытия задач. Оценка активности (KPI3: ${emp.kpi3}%). Расчет Agile.Coins: +${emp.kpi9} монет.`, status: 'Ожидает расчет' }
    ];

    return (
      <div className={styles.checkpointSection}>
        <h4 style={{ fontSize: '13.5px', fontWeight: 700, marginBottom: '12px' }}>Двухнедельный чекпоинт на пути (0 - 1 - 1.1)</h4>
        
        {/* Horizontal timeline bar */}
        <div className={styles.checkpointTimeline}>
          <div className={styles.timelineLine} />
          {checkpoints.map(cp => {
            const isActive = activeCheckpointTab === cp.id;
            const isWarning = cp.status === 'Внимание';
            const isDone = cp.status === 'Пройден' || cp.status === 'Успешно';
            
            let circleBg = 'var(--color-border)';
            let circleColor = 'var(--color-text-secondary)';
            if (isDone) {
              circleBg = '#10b981';
              circleColor = '#ffffff';
            } else if (isWarning) {
              circleBg = '#ef4444';
              circleColor = '#ffffff';
            }
            if (isActive) {
              circleBg = 'var(--color-primary)';
              circleColor = '#ffffff';
            }

            return (
              <button 
                key={cp.id}
                type="button"
                className={`${styles.checkpointNode} ${isActive ? styles.checkpointNodeActive : ''}`}
                onClick={() => setActiveCheckpointTab(cp.id as any)}
              >
                <div className={styles.checkpointCircle} style={{ backgroundColor: circleBg, color: circleColor }}>
                  {cp.label}
                </div>
                <span className={styles.checkpointLabel}>{cp.title}</span>
              </button>
            );
          })}
        </div>

        {/* Selected checkpoint explanation */}
        {(() => {
          const selectedCp = checkpoints.find(c => c.id === activeCheckpointTab);
          if (!selectedCp) return null;
          return (
            <div className={styles.checkpointDetailsBox}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <strong style={{ fontSize: '13px', color: 'var(--color-primary)' }}>Чекпоинт {selectedCp.label}: {selectedCp.title}</strong>
                <span className={`badge ${selectedCp.status === 'Пройден' || selectedCp.status === 'Успешно' ? 'badge-success' : selectedCp.status === 'Внимание' ? 'badge-error' : 'badge-warning'}`} style={{ fontSize: '10px' }}>
                  {selectedCp.status}
                </span>
              </div>
              <p style={{ fontSize: '12px', margin: 0, color: 'var(--color-text-secondary)', lineHeight: 1.4 }}>
                {selectedCp.desc}
              </p>
            </div>
          );
        })()}
      </div>
    );
  };

  const [isAddExceptionOpen, setIsAddExceptionOpen] = useState(false);
  const [newException, setNewException] = useState({ employeeName: '', date: '', reason: '' });

  const [isEmergencyMsgOpen, setIsEmergencyMsgOpen] = useState(false);
  const [emergencyMsg, setEmergencyMsg] = useState({ target: 'managers', text: '' });

  const [isSatisfactionOpen, setIsSatisfactionOpen] = useState(false);
  const [newSatisfaction, setNewSatisfaction] = useState({ projectName: '', rating: 5, comment: '', participants: '', integrationStatus: 'Активна', date: '' });
  const [editingSatisfaction, setEditingSatisfaction] = useState<CustomerSatisfaction | null>(null);

  const [isBonusTypeOpen, setIsBonusTypeOpen] = useState(false);
  const [newBonusType, setNewBonusType] = useState({ name: '', percent: 5, limit: 3 });

  // Notifications State
  const [notifications, setNotifications] = useState<Array<{ id: string; type: string; title: string; desc: string; date: string }>>([]);

  // Collapsible cards & Quick Actions Tabs State
  const [collapsedCards, setCollapsedCards] = useState<Record<string, boolean>>({});
  const [activeQuickActionSubTab, setActiveQuickActionSubTab] = useState<'kpi' | 'deadlines' | 'sources' | 'finance'>('kpi');
  const [redistributedTasksModal, setRedistributedTasksModal] = useState<{ employeeName: string; tasks: Array<{ title: string; assignee: string; deadline: string }> } | null>(null);

  const toggleCard = (cardId: string) => {
    setCollapsedCards(prev => ({ ...prev, [cardId]: !prev[cardId] }));
  };

  const loadDashboardNotifications = () => {
    const resolved = JSON.parse(localStorage.getItem('resolved-notifications') || '[]');
    const allMock = [
      { id: 'mock-crit-1', type: 'error', title: 'Расхождение отметок по задаче #1043', desc: 'Начальник Смирнов А. поставил "Сдано в срок", но файл отправлен на 2 дня позже дедлайна. Исполнитель: Сидорова М.', date: 'Только что' },
      { id: 'mock-crit-2', type: 'warning', title: 'Непроведенный разбор KPI подчинённого', desc: 'Начальник Смирнов А. не провел разбор падения KPI сотрудника Сидорова М. в течение 5 дней.', date: '1 час назад' },
      { id: 'mock-crit-3', type: 'info', title: 'Зависшее тестирование идеи сотрудника', desc: 'Идея "Автоматическое планирование" сотрудника Иванов И. находится в тестировании уже 16 дней.', date: 'Вчера' }
    ];
    setNotifications(allMock.filter(n => !resolved.includes(n.id)));
  };

  // Load KPI drops on mount
  useEffect(() => {
    loadActiveDrops();
    loadDashboardNotifications();
    window.addEventListener('divergence-fixed', loadDashboardNotifications);
    return () => window.removeEventListener('divergence-fixed', loadDashboardNotifications);
  }, []);

  const loadActiveDrops = async () => {
    try {
      const { data } = await gamificationApi.getActiveDrops();
      setActiveDrops(data);
    } catch (e) {
      console.warn("Could not load real active drops, using local state mock drops.");
      // If endpoint fails, keep empty or mock
    }
  };

  // KPI Calculations
  const averageCompanyKpi = useMemo(() => {
    const activeEmps = employees.filter(e => e.status !== 'blocked');
    if (activeEmps.length === 0) return 0;
    return Math.round(activeEmps.reduce((acc, curr) => acc + curr.kpiValue, 0) / activeEmps.length);
  }, [employees]);

  const critEmployees = useMemo(() => {
    return employees.filter(e => e.kpiValue < 70 && e.status !== 'blocked');
  }, [employees]);

  // Fast action triggers
  const handleFixDivergence = (taskId: string) => {
    // Add to audit log
    const log: AuditLog = {
      id: `aud-${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
      actor: 'Владелец (Вы)',
      action: 'Исправление расхождения отметок',
      target: `Задача #${taskId}`,
      details: 'Принято решение вручную исправить расхождение даты сдачи.'
    };
    setAuditLogs(prev => [log, ...prev]);

    // Remove notification about it
    setNotifications(prev => prev.filter(n => !n.desc.includes(`#${taskId}`)));
    alert('Расхождение успешно исправлено. Начальнику отправлено соответствующее извещение.');
  };

  const handleManualKpiEdit = (emp: EmployeeKPI) => {
    setSelectedEmpForKpi(emp);
    setEditedKpis({
      kpi1: emp.kpi1,
      kpi2: emp.kpi2,
      kpi3: emp.kpi3,
      kpi5: emp.kpi5,
      kpi7: emp.kpi7,
      kpi8: emp.kpi8,
      kpi9: emp.kpi9,
      kpi10: emp.kpi10,
    });
    setIsEditKpiOpen(true);
  };

  const saveKpiEdits = () => {
    if (!selectedEmpForKpi) return;
    
    // Average KPI calculation from edits
    const newAverage = Math.round(
      (editedKpis.kpi1 + editedKpis.kpi2 + editedKpis.kpi3 + editedKpis.kpi5 + editedKpis.kpi7 + editedKpis.kpi8 + editedKpis.kpi10) / 7
    );

    setEmployees(prev => prev.map(e => {
      if (e.id === selectedEmpForKpi.id) {
        return {
          ...e,
          ...editedKpis,
          kpiValue: newAverage
        };
      }
      return e;
    }));

    // Add to Audit Logs
    const log: AuditLog = {
      id: `aud-${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
      actor: 'Владелец (Вы)',
      action: 'Ручная корректировка KPI',
      target: selectedEmpForKpi.name,
      details: `Внесены изменения во все индексы сотрудника. Общий KPI пересчитан в ${newAverage}%.`
    };
    setAuditLogs(prev => [log, ...prev]);

    setIsEditKpiOpen(false);
    setSelectedEmpForKpi(null);
    alert('Показатели сотрудника успешно обновлены в системе!');
  };

  const handleAddException = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newException.employeeName || !newException.date || !newException.reason) return;

    const exception: ExceptionRecord = {
      id: `exc-${Date.now()}`,
      employeeName: newException.employeeName,
      date: newException.date,
      reason: newException.reason
    };
    setExceptions(prev => [...prev, exception]);

    // Also automatically adjust punctuality KPI2 for that employee
    const targetEmp = employees.find(emp => emp.name.toLowerCase().includes(newException.employeeName.toLowerCase()));
    if (targetEmp) {
      setEmployees(prev => prev.map(emp => {
        if (emp.id === targetEmp.id) {
          const newKpi2 = Math.min(100, emp.kpi2 + 15);
          return { ...emp, kpi2: newKpi2, kpiValue: Math.round((emp.kpi1 + newKpi2 + emp.kpi3 + emp.kpi5 + emp.kpi7 + emp.kpi8 + emp.kpi10) / 7) };
        }
        return emp;
      }));
    }

    // Audit Log
    const log: AuditLog = {
      id: `aud-${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
      actor: 'Владелец (Вы)',
      action: 'Назначение исключения',
      target: newException.employeeName,
      details: `Назначено исключение на ${newException.date} по причине: ${newException.reason}. Лимиты не применяются.`
    };
    setAuditLogs(prev => [log, ...prev]);

    setIsAddExceptionOpen(false);
    setNewException({ employeeName: '', date: '', reason: '' });
    alert('Исключение успешно добавлено! KPI2 сотрудника пересчитан.');
  };

  const handleSendEmergencyMsg = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emergencyMsg.text.trim()) return;

    // Audit Log
    const log: AuditLog = {
      id: `aud-${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
      actor: 'Владелец (Вы)',
      action: 'Экстренное уведомление',
      target: emergencyMsg.target === 'managers' ? 'Все начальники отделов' : 'Все сотрудники компании',
      details: `Отправлено экстренное сообщение: "${emergencyMsg.text.slice(0, 50)}..."`
    };
    setAuditLogs(prev => [log, ...prev]);

    setIsEmergencyMsgOpen(false);
    setEmergencyMsg({ target: 'managers', text: '' });
    alert('Экстренное оповещение успешно разослано по всем каналам связи (email, telegram, web-кабинет)!');
  };

  const handleAddSatisfaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSatisfaction.projectName || !newSatisfaction.comment) return;

    const participantsParsed = newSatisfaction.participants.split(',').map(p => {
      const parts = p.split(':');
      return {
        name: parts[0]?.trim() || 'Сотрудник',
        weight: parseInt(parts[1]) || 50
      };
    });

    if (editingSatisfaction) {
      setSatisfactionList(prev => prev.map(sat => {
        if (sat.id === editingSatisfaction.id) {
          return {
            ...sat,
            projectName: newSatisfaction.projectName,
            rating: newSatisfaction.rating,
            comment: newSatisfaction.comment,
            date: newSatisfaction.date || sat.date || new Date().toISOString().split('T')[0],
            participants: participantsParsed.length > 0 ? participantsParsed : [{ name: 'Иван Иванов', weight: 100 }],
            integrationStatus: newSatisfaction.integrationStatus
          };
        }
        return sat;
      }));

      const log: AuditLog = {
        id: `aud-${Date.now()}`,
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
        actor: 'Владелец (Вы)',
        action: 'Редактирование оценки заказчика',
        target: newSatisfaction.projectName,
        details: `Изменены параметры проекта ${newSatisfaction.projectName}. Оценка: ${newSatisfaction.rating}/5. Статус: ${newSatisfaction.integrationStatus}.`
      };
      setAuditLogs(prev => [log, ...prev]);

      setEditingSatisfaction(null);
      alert('Параметры оценки заказчика успешно обновлены!');
    } else {
      const satRecord: CustomerSatisfaction = {
        id: `sat-${Date.now()}`,
        projectName: newSatisfaction.projectName,
        rating: newSatisfaction.rating,
        comment: newSatisfaction.comment,
        date: newSatisfaction.date || new Date().toISOString().split('T')[0],
        participants: participantsParsed.length > 0 ? participantsParsed : [{ name: 'Иван Иванов', weight: 100 }],
        integrationStatus: newSatisfaction.integrationStatus
      };
      setSatisfactionList(prev => [satRecord, ...prev]);

      const log: AuditLog = {
        id: `aud-${Date.now()}`,
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
        actor: 'Владелец (Вы)',
        action: 'Ручная оценка заказчика',
        target: newSatisfaction.projectName,
        details: `Внесена оценка ${newSatisfaction.rating}/5. Статус интеграции: ${newSatisfaction.integrationStatus}.`
      };
      setAuditLogs(prev => [log, ...prev]);
      alert('Оценка заказчика успешно сохранена!');
    }

    setIsSatisfactionOpen(false);
    setNewSatisfaction({ projectName: '', rating: 5, comment: '', participants: '', integrationStatus: 'Активна', date: '' });
  };

  const handleAcceptReport = (id: string) => {
    setWeeklyReports(prev => prev.map(rep => {
      if (rep.id === id) {
        return { ...rep, status: 'Принят' };
      }
      return rep;
    }));

    const report = weeklyReports.find(r => r.id === id);

    // Audit Log
    const log: AuditLog = {
      id: `aud-${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
      actor: 'Владелец (Вы)',
      action: 'Утверждение еженедельного отчета',
      target: report?.employeeName || 'Сотрудник',
      details: `Еженедельный отчет руководителя успешно принят и утвержден.`
    };
    setAuditLogs(prev => [log, ...prev]);
    alert('Отчет начальника успешно утвержден!');
  };

  const handleRejectReport = (id: string) => {
    setWeeklyReports(prev => prev.map(rep => {
      if (rep.id === id) {
        return { ...rep, status: 'На доработке' };
      }
      return rep;
    }));

    const report = weeklyReports.find(r => r.id === id);

    // Audit Log
    const log: AuditLog = {
      id: `aud-${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
      actor: 'Владелец (Вы)',
      action: 'Возврат отчета на доработку',
      target: report?.employeeName || 'Сотрудник',
      details: `Отчет отправлен на доработку с требованием обновить показатели отдела.`
    };
    setAuditLogs(prev => [log, ...prev]);
    alert('Отчет отправлен на доработку!');
  };

  const handleDeleteReturn = (id: string) => {
    const retRecord = returns.find(r => r.id === id);
    setReturns(prev => prev.filter(r => r.id !== id));

    // Audit Log
    const log: AuditLog = {
      id: `aud-${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
      actor: 'Владелец (Вы)',
      action: 'Удаление ошибочного возврата (KPI5)',
      target: retRecord?.employeeName || 'Сотрудник',
      details: `Удален возврат задачи "${retRecord?.taskTitle}". KPI5 сотрудника автоматически пересчитан.`
    };
    setAuditLogs(prev => [log, ...prev]);
    alert('Ошибочный возврат удален! KPI5 пересчитан.');
  };

  const handleFinishInternship = (id: string, inStaff: boolean) => {
    const intern = employees.find(e => e.id === id);
    if (inStaff) {
      setInternToAccept(id);
      setAcceptRole('user');
      setAcceptDepartment('Разработка');
      const managers = employees.filter(e => !e.isIntern && e.id !== id);
      setAcceptManager(managers[0]?.name || '');
    } else {
      setEmployees(prev => prev.map(e => {
        if (e.id === id) {
          return { ...e, isIntern: false, status: 'fired' };
        }
        return e;
      }));

      // Audit Log
      const log: AuditLog = {
        id: `aud-${Date.now()}`,
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
        actor: 'Владелец (Вы)',
        action: 'Завершение стажировки',
        target: intern?.name || 'Стажёр',
        details: 'Отчислен по результатам обучения.'
      };
      setAuditLogs(prev => [log, ...prev]);
      alert(`Стажировка завершена! Сотрудник отчислен с платформы.`);
    }
  };

  const handleConfirmAcceptIntern = () => {
    if (!internToAccept) return;
    const intern = employees.find(e => e.id === internToAccept);
    if (!acceptDepartment) {
      alert("Выберите отдел!");
      return;
    }
    if (!acceptRole) {
      alert("Выберите должность!");
      return;
    }
    if (!acceptManager) {
      alert("Выберите руководителя!");
      return;
    }

    setEmployees(prev => prev.map(e => {
      if (e.id === internToAccept) {
        return {
          ...e,
          isIntern: false,
          status: 'active',
          department: acceptDepartment,
          role: acceptRole === 'user' ? 'Сотрудник' : acceptRole === 'consultant' ? 'Консультант' : acceptRole
        };
      }
      return e;
    }));

    // Audit Log
    const log: AuditLog = {
      id: `aud-${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
      actor: 'Владелец (Вы)',
      action: 'Завершение стажировки',
      target: intern?.name || 'Стажёр',
      details: `Переведен в штат. Отдел: ${acceptDepartment}, Должность: ${acceptRole === 'user' ? 'Сотрудник' : acceptRole}, Руководитель: ${acceptManager}`
    };
    setAuditLogs(prev => [log, ...prev]);
    alert(`Стажировка завершена! Сотрудник ${intern?.name} принят в штат (Отдел: ${acceptDepartment}, Должность: ${acceptRole}).`);
    setInternToAccept(null);
  };

  const handleToggleBlockUser = (id: string) => {
    const userObj = employees.find(e => e.id === id);
    const nextStatus = userObj?.status === 'blocked' ? 'active' : 'blocked';
    
    setEmployees(prev => prev.map(e => {
      if (e.id === id) {
        return { ...e, status: nextStatus };
      }
      return e;
    }));

    // Audit Log
    const log: AuditLog = {
      id: `aud-${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
      actor: 'Владелец (Вы)',
      action: nextStatus === 'blocked' ? 'Блокировка учетной записи' : 'Разблокировка учетной записи',
      target: userObj?.name || 'Сотрудник',
      details: nextStatus === 'blocked' 
        ? 'Учетная запись временно приостановлена. Таймеры KPI остановлены.' 
        : 'Учетная запись активна. Таймеры KPI запущены.'
    };
    setAuditLogs(prev => [log, ...prev]);
    alert(`Статус учетной записи изменен!`);
  };

  return (
    <div className={styles.page}>
      
      {/* 1. Header Area with badges */}
      <div className={styles.header}>
        <div className={styles.titleArea}>
          <h1>
            <span className={styles.titleText}>Личный Кабинет Владельца</span>{' '}
            <span className={styles.agileText}>Agile</span>{' '}
            <span className={styles.workspaceText}>Workspace</span>
          </h1>
          <p className={styles.subtitle}>Полный оперативный контроль над KPI, качеством, стажировкой и регламентами компании</p>
        </div>
      </div>

      {/* Panel of Fast actions - Buttons */}
      <div className="card" style={{ marginBottom: '24px', background: 'var(--color-bg-secondary)' }}>
        <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Sparkles size={16} className={styles.satisfyStarGood} />
          Панель быстрых действий владельца
        </h3>
        <div className={styles.quickActionsPanel}>
          <button type="button" className={styles.quickActionBtn} onClick={() => { setIsAddExceptionOpen(true); }}><Calendar size={14} /> Добавить исключение</button>
          <button type="button" className={styles.quickActionBtn} onClick={() => { setIsSatisfactionOpen(true); }}><Star size={14} /> Ввести оценку заказчика</button>
          <button type="button" className={styles.quickActionBtn} onClick={() => { setIsBonusTypeOpen(true); }}><Coins size={14} /> Настройка бонусов KPI9</button>
          <button type="button" className={styles.quickActionBtn} onClick={() => { setActiveTab('integrations'); }}><Globe size={14} /> Статус интеграций Webhook</button>
        </div>
      </div>

      {/* Panel of Fast actions - Tabs */}
      <div className="card" style={{ marginBottom: '24px', background: 'var(--color-bg-secondary)' }}>
        <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Sparkles size={16} className={styles.satisfyStarGood} />
          Панель быстрых действий владельца: Последние действия
        </h3>
        
        <div className={styles.quickActionsSubTabs}>
          <button 
            type="button"
            className={`${styles.subTabBtn} ${activeQuickActionSubTab === 'kpi' ? styles.subTabActive : ''}`} 
            onClick={() => setActiveQuickActionSubTab('kpi')}
          >
            <Activity size={14} /> А) Последние изменения по каждому KPI
          </button>
          <button 
            type="button"
            className={`${styles.subTabBtn} ${activeQuickActionSubTab === 'deadlines' ? styles.subTabActive : ''}`} 
            onClick={() => setActiveQuickActionSubTab('deadlines')}
          >
            <Clock size={14} /> Б) Задачи ближайшие у которых дедлайн скоро
          </button>
          <button 
            type="button"
            className={`${styles.subTabBtn} ${activeQuickActionSubTab === 'sources' ? styles.subTabActive : ''}`} 
            onClick={() => setActiveQuickActionSubTab('sources')}
          >
            <Globe size={14} /> В) Заявки распределённые по источникам
          </button>
          <button 
            type="button"
            className={`${styles.subTabBtn} ${activeQuickActionSubTab === 'finance' ? styles.subTabActive : ''}`} 
            onClick={() => setActiveQuickActionSubTab('finance')}
          >
            <Coins size={14} /> Г) Финансовая аналитика
          </button>
        </div>

        <div className={styles.quickActionContent}>
          {activeQuickActionSubTab === 'kpi' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '4px', borderBottom: '1px solid var(--color-border-light)' }}>
                <span><strong>Мария Сидорова</strong>: KPI5 (Качество) упал ниже нормы (68%)</span>
                <span style={{ color: '#ef4444', fontWeight: 600 }}>Требуется разбор</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '4px', borderBottom: '1px solid var(--color-border-light)' }}>
                <span><strong>Иван Иванов</strong>: KPI1 (Срок) увеличен до 95% за счет закрытия 4 задач в срок</span>
                <span style={{ color: '#10b981', fontWeight: 600 }}>Рост +5%</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span><strong>Петр Петров</strong>: KPI9 (Бонусы) получен за 12.5 coins</span>
                <span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>Начислено</span>
              </div>
            </div>
          )}

          {activeQuickActionSubTab === 'deadlines' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '4px', borderBottom: '1px solid var(--color-border-light)' }}>
                <span><strong>Интеграция CRM (задача #1044)</strong> — Мария Сидорова</span>
                <span style={{ color: '#ef4444', fontWeight: 600 }}>Дедлайн: через 4 часа</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '4px', borderBottom: '1px solid var(--color-border-light)' }}>
                <span><strong>Дизайн главной страницы (задача #1052)</strong> — Анна Кузнецова</span>
                <span style={{ color: '#f59e0b', fontWeight: 600 }}>Дедлайн: завтра</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span><strong>Тестирование идеи (задача #1060)</strong> — Иван Иванов</span>
                <span style={{ color: '#3b82f6', fontWeight: 600 }}>Дедлайн: через 2 дня</span>
              </div>
            </div>
          )}

          {activeQuickActionSubTab === 'sources' && (
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '13px' }}>
              <div style={{ flex: 1, minWidth: '120px', padding: '10px', background: 'var(--color-bg-secondary)', borderRadius: '6px', border: '1px solid var(--color-border-light)' }}>
                <div style={{ color: 'var(--color-text-muted)', fontSize: '11px' }}>🌐 Сайт (Web-формы)</div>
                <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-primary)' }}>12 заявок (70%)</div>
              </div>
              <div style={{ flex: 1, minWidth: '120px', padding: '10px', background: 'var(--color-bg-secondary)', borderRadius: '6px', border: '1px solid var(--color-border-light)' }}>
                <div style={{ color: 'var(--color-text-muted)', fontSize: '11px' }}>🤖 Telegram-бот</div>
                <div style={{ fontSize: '18px', fontWeight: 700, color: '#10b981' }}>3 заявки (18%)</div>
              </div>
              <div style={{ flex: 1, minWidth: '120px', padding: '10px', background: 'var(--color-bg-secondary)', borderRadius: '6px', border: '1px solid var(--color-border-light)' }}>
                <div style={{ color: 'var(--color-text-muted)', fontSize: '11px' }}>✍️ Ручной ввод</div>
                <div style={{ fontSize: '18px', fontWeight: 700, color: '#f59e0b' }}>2 заявки (12%)</div>
              </div>
            </div>
          )}

          {activeQuickActionSubTab === 'finance' && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', fontSize: '13px' }}>
              <div style={{ display: 'flex', gap: '24px' }}>
                <div>
                  <div style={{ color: 'var(--color-text-muted)', fontSize: '11px' }}>Оборот за month</div>
                  <strong style={{ fontSize: '16px', color: '#10b981' }}>+2 450 000 ₽</strong>
                </div>
                <div>
                  <div style={{ color: 'var(--color-text-muted)', fontSize: '11px' }}>Расходы (ФОТ/Хостинг)</div>
                  <strong style={{ fontSize: '16px', color: '#ef4444' }}>-1 330 000 ₽</strong>
                </div>
                <div>
                  <div style={{ color: 'var(--color-text-muted)', fontSize: '11px' }}>Чистая прибыль</div>
                  <strong style={{ fontSize: '16px', color: 'var(--color-primary)' }}>1 120 000 ₽</strong>
                </div>
              </div>
              <button 
                type="button" 
                className="btn btn-primary btn-sm" 
                onClick={() => window.location.pathname = '/finance'}
              >
                Открыть полную аналитику
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 2. Top-level custom tabs system */}
      <div className={styles.tabsList}>
        <button className={`${styles.tabItem} ${activeTab === 'dashboard' ? styles.tabActive : ''}`} onClick={() => setActiveTab('dashboard')}><Gauge size={16} /> Сводный Дашборд</button>
        <button className={`${styles.tabItem} ${activeTab === 'kpis' ? styles.tabActive : ''}`} onClick={() => setActiveTab('kpis')}><Users size={16} /> Управление KPI (№1-№10)</button>
        <button className={`${styles.tabItem} ${activeTab === 'departments' ? styles.tabActive : ''}`} onClick={() => setActiveTab('departments')}><Landmark size={16} /> Должностные KPI Начальников</button>
        <button className={`${styles.tabItem} ${activeTab === 'satisfaction' ? styles.tabActive : ''}`} onClick={() => setActiveTab('satisfaction')}><Star size={16} /> Удовлетворенность заказчика</button>
        <button className={`${styles.tabItem} ${activeTab === 'interns' ? styles.tabActive : ''}`} onClick={() => setActiveTab('interns')}><BookOpen size={16} /> Обучение стажёров</button>
        <button className={`${styles.tabItem} ${activeTab === 'integrations' ? styles.tabActive : ''}`} onClick={() => setActiveTab('integrations')}><Settings size={16} /> Интеграции & Настройки</button>
        <button className={`${styles.tabItem} ${activeTab === 'audit' ? styles.tabActive : ''}`} onClick={() => setActiveTab('audit')}><Database size={16} /> Аудит & Логи безопасности</button>
      </div>

      {/* 3. Render Tab Content */}
      
      {/* 3.1. Tab: DASHBOARD */}
      {activeTab === 'dashboard' && (
        <div className={styles.dashboardGrid}>
          
          {/* Company Average Card */}
          <div className={`${styles.card} ${styles.col4} ${collapsedCards['company_avg'] ? styles.cardCollapsed : ''}`}>
            <div className={styles.cardHeader}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Activity size={18} className={styles.satisfyStarGood} /> 
                Средний KPI компании
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span className="badge badge-success">Норма</span>
                <button
                  type="button"
                  className={styles.collapseIcon}
                  onClick={() => toggleCard('company_avg')}
                  aria-label="Свернуть/Развернуть"
                >
                  {collapsedCards['company_avg'] ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                </button>
              </div>
            </div>
            {!collapsedCards['company_avg'] && (
              <>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                  <span style={{ fontSize: '48px', fontWeight: 800, color: 'var(--color-primary)' }}>{averageCompanyKpi}%</span>
                  <span style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>+2.5% на этой неделе</span>
                </div>
                <div style={{ marginTop: '16px' }} className={styles.progressBar}>
                  <div className={styles.progressFill} style={{ width: `${averageCompanyKpi}%` }} />
                </div>
              </>
            )}
          </div>

          {/* Critical Drops Widget */}
          <div className={`${styles.card} ${styles.col4} ${collapsedCards['crit_drops'] ? styles.cardCollapsed : ''}`}>
            <div className={styles.cardHeader}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <AlertTriangle size={18} style={{ color: '#ef4444' }} /> 
                Критическое падение KPI (&lt;70%)
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span className="badge badge-error">{critEmployees.length} человек</span>
                <button
                  type="button"
                  className={styles.collapseIcon}
                  onClick={() => toggleCard('crit_drops')}
                  aria-label="Свернуть/Развернуть"
                >
                  {collapsedCards['crit_drops'] ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                </button>
              </div>
            </div>
            {!collapsedCards['crit_drops'] && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {critEmployees.map(emp => (
                  <div 
                    key={emp.id} 
                    onClick={() => { setSelectedEmployeeProfile(emp); setActiveCheckpointTab('1'); }}
                    style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      fontSize: '13px', 
                      padding: '6px 8px', 
                      borderBottom: '1px solid var(--color-border-light)',
                      cursor: 'pointer',
                      borderRadius: '4px'
                    }}
                    className={styles.clickableRow}
                  >
                    <strong style={{ color: 'var(--color-primary)', textDecoration: 'underline' }}>{emp.name} ({emp.department})</strong>
                    <span style={{ color: '#ef4444', fontWeight: 700 }}>{emp.kpiValue}%</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Punctuality and violations summary */}
          <div className={`${styles.card} ${styles.col4} ${collapsedCards['violations'] ? styles.cardCollapsed : ''}`}>
            <div className={styles.cardHeader}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Clock size={18} style={{ color: '#f59e0b' }} /> 
                Активные Нарушения
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span className="badge badge-warning" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>На контроле</span>
                <button
                  type="button"
                  className={styles.collapseIcon}
                  onClick={() => toggleCard('violations')}
                  aria-label="Свернуть/Развернуть"
                >
                  {collapsedCards['violations'] ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                </button>
              </div>
            </div>
            {!collapsedCards['violations'] && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Непроведенные разборы начальников:</span>
                  <strong>2</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Просроченные идеи сотрудников:</span>
                  <strong>1</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Неотработанные штрафные дни:</span>
                  <strong>3</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Непроверенные недельные отчеты:</span>
                  <strong>{weeklyReports.filter(r => r.status === 'На проверке').length}</strong>
                </div>
              </div>
            )}
          </div>

          {/* Sick employees and Hospital Widget */}
          {(() => {
            const sokolov = employees.find(e => e.name.startsWith('Соколов'));
            const dmitriev = employees.find(e => e.name.startsWith('Дмитриев'));
            return (
              <div className={`${styles.card} ${styles.col12} ${collapsedCards['hospital'] ? styles.cardCollapsed : ''}`}>
                <div className={styles.cardHeader}>
                  <h3 style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Activity size={18} style={{ color: '#10b981' }} /> 
                    Тяжёлые больничные сотрудников
                  </h3>
                  <button
                    type="button"
                    className={styles.collapseIcon}
                    onClick={() => toggleCard('hospital')}
                    aria-label="Свернуть/Развернуть"
                  >
                    {collapsedCards['hospital'] ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                  </button>
                </div>
                {!collapsedCards['hospital'] && (
                  <>
                    <div className={styles.hospitalItem}>
                      <div 
                        className={styles.hospitalMainInfo}
                        onClick={() => { if (sokolov) { setSelectedEmployeeProfile(sokolov); setActiveCheckpointTab('1'); } }}
                        style={{ cursor: sokolov ? 'pointer' : 'default' }}
                      >
                        <h4 style={{ textDecoration: 'underline', color: 'var(--color-primary)' }}>Соколов Д. (Дизайнер)</h4>
                        <span>Передано задач: <strong>4 шт.</strong></span>
                      </div>
                      <span 
                        className={styles.hospitalTasksBadge}
                        style={{ cursor: 'pointer' }}
                        onClick={() => setRedistributedTasksModal({
                          employeeName: 'Соколов Д.',
                          tasks: [
                            { title: 'Дизайн баннера акций', assignee: 'Анна Кузнецова', deadline: '18.06.2026' },
                            { title: 'Редизайн UI профиля', assignee: 'Анна Кузнецова', deadline: '20.06.2026' },
                            { title: 'Макеты email-рассылки', assignee: 'Мария Сидорова', deadline: '22.06.2026' },
                            { title: 'Иллюстрации к разделу Обучение', assignee: 'Иван Иванов', deadline: '25.06.2026' }
                          ]
                        })}
                        title="Нажмите, чтобы просмотреть перераспределение задач"
                      >
                        Задачи перераспределены (посмотреть)
                      </span>
                    </div>
                    <div className={styles.hospitalItem} style={{ opacity: 0.7 }}>
                      <div 
                        className={styles.hospitalMainInfo}
                        onClick={() => { if (dmitriev) { setSelectedEmployeeProfile(dmitriev); setActiveCheckpointTab('1'); } }}
                        style={{ cursor: dmitriev ? 'pointer' : 'default' }}
                      >
                        <h4 style={{ textDecoration: 'underline', color: 'var(--color-primary)' }}>Дмитриев А. (Разработчик)</h4>
                        <span>Передано задач: <strong>0 шт.</strong></span>
                      </div>
                      <span className="badge badge-secondary">Задач не было</span>
                    </div>
                  </>
                )}
              </div>
            );
          })()}

          {/* Customer satisfying project rankings */}
          <div className={`${styles.card} ${styles.col6} ${collapsedCards['satisfy'] ? styles.cardCollapsed : ''}`}>
            <div className={styles.cardHeader}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Star size={18} style={{ color: '#f59e0b' }} /> 
                Проекты с низкими оценками заказчиков (&lt;3)
              </h3>
              <button
                type="button"
                className={styles.collapseIcon}
                onClick={() => toggleCard('satisfy')}
                aria-label="Свернуть/Развернуть"
              >
                {collapsedCards['satisfy'] ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
              </button>
            </div>
            {!collapsedCards['satisfy'] && satisfactionList.filter(proj => proj.rating < 3).map(proj => (
              <div key={proj.id} className={styles.satisfyItem}>
                <div className={styles.satisfyMeta}>
                  <h4>{proj.projectName}</h4>
                  <span>Заказчик: ООО Вектор • {proj.date}</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className={styles.satisfyStars}>
                    {[1, 2, 3, 4, 5].map(star => (
                      <Star key={star} size={14} fill={star <= proj.rating ? '#ef4444' : 'none'} className={styles.satisfyStarCrit} />
                    ))}
                  </div>
                  <span style={{ fontSize: '11px', color: '#ef4444', fontWeight: 600 }}>Критическая оценка!</span>
                </div>
              </div>
            ))}
          </div>

          {/* Overtime managers alerts */}
          <div className={`${styles.card} ${styles.col6} ${collapsedCards['overtime'] ? styles.cardCollapsed : ''}`}>
            <div className={styles.cardHeader}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Flame size={18} style={{ color: '#f59e0b' }} /> 
                Аномальная сверхурочная активность начальников
              </h3>
              <button
                type="button"
                className={styles.collapseIcon}
                onClick={() => toggleCard('overtime')}
                aria-label="Свернуть/Развернуть"
              >
                {collapsedCards['overtime'] ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
              </button>
            </div>
            {!collapsedCards['overtime'] && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(245, 158, 11, 0.05)', borderRadius: '6px', border: '1px solid rgba(245, 158, 11, 0.15)' }}>
                  <div>
                    <strong>Алексей Смирнов (Разработка)</strong>
                    <div style={{ fontSize: '11.5px', color: 'var(--color-text-secondary)' }}>Сверхурочных разборов: 6. KPI6 &gt; 90%</div>
                  </div>
                  <span className="badge badge-error">Риск перегрузки!</span>
                </div>
              </div>
            )}
          </div>

          {/* 11. Custom owner calendar preview */}
          <div className={`${styles.card} ${styles.col12} ${collapsedCards['calendar'] ? styles.cardCollapsed : ''}`}>
            <div className={styles.cardHeader}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Calendar size={18} /> 
                Календарь плановых событий владельца
              </h3>
              <button
                type="button"
                className={styles.collapseIcon}
                onClick={() => toggleCard('calendar')}
                aria-label="Свернуть/Развернуть"
              >
                {collapsedCards['calendar'] ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
              </button>
            </div>
            {!collapsedCards['calendar'] && (
              <div className={styles.calendarWrapper}>
                {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(day => (
                  <div key={day} style={{ textAlign: 'center', fontSize: '12px', fontWeight: 'bold', padding: '4px', borderBottom: '1px solid var(--color-border)' }}>{day}</div>
                ))}
                {[...Array(28)].map((_, i) => {
                  const dayNum = i + 1;
                  return (
                    <div key={i} className={styles.calendarDay}>
                      <span className={styles.dayNum}>{dayNum}</span>
                      {dayNum === 1 && <span className={`${styles.dayEvent} ${styles.dayEventWarning}`}>Сброс KPI счетчиков</span>}
                      {dayNum === 14 && <span className={styles.dayEvent}>Дедлайн сводных отчетов</span>}
                      {dayNum === 15 && <span className={styles.dayEvent}>Конец 2-х недельного KPI</span>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 12. Punctuality and violations summary */}
          <div className={`${styles.card} ${styles.col4} ${collapsedCards['violations'] ? styles.cardCollapsed : ''}`}>
            <div className={styles.cardHeader}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <AlertTriangle size={18} style={{ color: '#f59e0b' }} />
                Дисциплина и нарушения
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span className="badge badge-warning">На контроле</span>
                <button
                  type="button"
                  className={styles.collapseIcon}
                  onClick={() => toggleCard('violations')}
                  aria-label="Свернуть/Развернуть"
                >
                  {collapsedCards['violations'] ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                </button>
              </div>
            </div>
            {!collapsedCards['violations'] && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Непроведенные разборы начальников:</span>
                  <strong>2</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Просроченные идеи сотрудников:</span>
                  <strong>1</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Неотработанные штрафные дни:</span>
                  <strong>3</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Непроверенные недельные отчеты:</span>
                  <strong>{weeklyReports.filter(r => r.status === 'На проверке').length}</strong>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3.2. Tab: KPIS */}
      {activeTab === 'kpis' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Team KPI Plate (Requirement 11) */}
          <div className={styles.teamKpiPlate}>
            <div className={styles.teamKpiLeft}>
              <div className={styles.teamKpiIconWrap}>
                <Users size={32} />
              </div>
              <div>
                <h2>Командный KPI компании</h2>
                <p>Средневзвешенная эффективность всех сотрудников на платформе Agile Workspace за текущий период</p>
              </div>
            </div>
            <div className={styles.teamKpiRight}>
              <div className={styles.teamKpiValueSection}>
                <span className={styles.teamKpiNumber}>{averageCompanyKpi}%</span>
                <span className={`badge ${averageCompanyKpi >= 80 ? 'badge-success' : averageCompanyKpi >= 70 ? 'badge-warning' : 'badge-error'}`} style={{ fontSize: '12px', padding: '6px 12px', borderRadius: '16px' }}>
                  {averageCompanyKpi >= 80 ? 'Отлично' : averageCompanyKpi >= 70 ? 'Норма' : 'Критично'}
                </span>
              </div>
              <div className={styles.teamKpiProgressWrap}>
                <div className={styles.teamKpiProgressBar} style={{ width: `${averageCompanyKpi}%` }} />
              </div>
            </div>
          </div>

          {/* General Employees KPI Table */}
          <div className="card">
            <div className={styles.cardHeader}>
              <h3><Users size={18} /> Общий список сотрудников и их KPI показатели</h3>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button className="btn btn-outline btn-xs" onClick={() => alert('Экспорт KPI таблицы запущен... Отчет сгенерирован и скачивается в формате Excel!')}><FileText size={12} /> Экспорт Excel</button>
              </div>
            </div>

            <div className={styles.tableWrapper}>
              <table className={styles.customTable}>
                <thead>
                  <tr>
                    <th>ФИО</th>
                    <th>Департамент</th>
                    <th>Общий KPI</th>
                    <th>KPI1 (Срок)</th>
                    <th>KPI2 (Дисц)</th>
                    <th>KPI3 (Иниц)</th>
                    <th>KPI5 (Кач)</th>
                    <th>KPI7 (Отчет)</th>
                    <th>KPI8 (Вним)</th>
                    <th>KPI10 (Ответ)</th>
                    <th>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map(emp => (
                    <tr 
                      key={emp.id} 
                      className={styles.clickableRow}
                      onClick={() => { setSelectedEmployeeProfile(emp); setActiveCheckpointTab('1'); }}
                      style={{ opacity: emp.status === 'blocked' ? 0.5 : 1 }}
                    >
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div className={styles.avatarMini}>
                            {(emp.name || '?')[0]}
                          </div>
                          <div>
                            <strong className={styles.empNameLink}>{emp.name}</strong>
                            {emp.isIntern && <span className="badge badge-warning" style={{ fontSize: '10px', marginLeft: '6px' }}>Стажёр</span>}
                            {emp.status === 'blocked' && <span className="badge badge-error" style={{ fontSize: '10px', marginLeft: '6px' }}>Заблокирован</span>}
                          </div>
                        </div>
                      </td>
                      <td>{emp.department}</td>
                      <td>
                        <strong className={emp.kpiValue < 70 ? styles.kpiCrit : styles.kpiGood}>{emp.kpiValue}%</strong>
                      </td>
                      <td>{emp.kpi1}%</td>
                      <td>{emp.kpi2}%</td>
                      <td>{emp.kpi3}%</td>
                      <td>{emp.kpi5}%</td>
                      <td>{emp.kpi7}%</td>
                      <td>{emp.kpi8}%</td>
                      <td>{emp.kpi10}%</td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px' }} onClick={e => e.stopPropagation()}>
                          <button className="btn btn-ghost btn-xs" title="Ручная корректировка KPI" onClick={() => handleManualKpiEdit(emp)}>
                            <Pencil size={13} />
                          </button>
                          <button className={`btn btn-xs ${emp.status === 'blocked' ? 'btn-success' : 'btn-danger'}`} onClick={() => handleToggleBlockUser(emp.id)}>
                            {emp.status === 'blocked' ? 'Разблокировать' : 'Заблокировать'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Return items management for KPI5 */}
          <div className="card">
            <div className={styles.cardHeader}>
              <h3><AlertCircle size={18} /> Контроль возвратов задач и брака (KPI №5)</h3>
            </div>
            <div className={styles.tableWrapper}>
              <table className={styles.customTable}>
                <thead>
                  <tr>
                    <th>Сотрудник</th>
                    <th>Задача</th>
                    <th>Категория Ошибки</th>
                    <th>Вар. Времени (ч)</th>
                    <th>Дата возврата</th>
                    <th>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {returns.map(ret => (
                    <tr key={ret.id}>
                      <td>{ret.employeeName}</td>
                      <td>{ret.taskTitle}</td>
                      <td><span className="badge badge-error">{ret.errorCategory}</span></td>
                      <td>{ret.effectiveHours} ч</td>
                      <td>{ret.date}</td>
                      <td>
                        <button className="btn btn-error btn-xs" onClick={() => handleDeleteReturn(ret.id)}><Trash2 size={12} /> Удалить возврат</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Exceptions & уважительные причины list */}
          <div className="card">
            <div className={styles.cardHeader}>
              <h3><Calendar size={18} /> Список уважительных исключений (Индекс дисциплины KPI №2)</h3>
              <button className="btn btn-primary btn-xs" onClick={() => setIsAddExceptionOpen(true)}>Назначить уважительную причину</button>
            </div>
            <div className={styles.tableWrapper}>
              <table className={styles.customTable}>
                <thead>
                  <tr>
                    <th>Сотрудник</th>
                    <th>Уважительный день</th>
                    <th>Причина</th>
                    <th>Лимит</th>
                  </tr>
                </thead>
                <tbody>
                  {exceptions.map(exc => (
                    <tr key={exc.id}>
                      <td>{exc.employeeName}</td>
                      <td>{exc.date}</td>
                      <td><strong>{exc.reason}</strong></td>
                      <td><span style={{ color: '#10b981', fontWeight: 600 }}>Без лимита (Владелец)</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Attentiveness attempt logs KPI8 */}
          <div className="card">
            <div className={styles.cardHeader}>
              <h3><Brain size={18} /> Журнал логов попыток заполнения форм (Индекс Внимательности KPI №8)</h3>
            </div>
            <div className={styles.tableWrapper}>
              <table className={styles.customTable}>
                <thead>
                  <tr>
                    <th>Сотрудник</th>
                    <th>Форма/Действие</th>
                    <th>Попытка</th>
                    <th>Статус валидации</th>
                    <th>Дата лога</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Мария Сидорова</td>
                    <td>Разбор падения KPI</td>
                    <td>1</td>
                    <td><span className="badge badge-error">Провалено (пустые поля)</span></td>
                    <td>30.05.2026 15:30</td>
                  </tr>
                  <tr>
                    <td>Мария Сидорова</td>
                    <td>Разбор падения KPI</td>
                    <td>2</td>
                    <td><span className="badge badge-success">Успешно</span></td>
                    <td>30.05.2026 15:32</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="card">
            <div className={styles.cardHeader}>
              <h3><Coins size={18} /> Настройка шкал и процентов бонусного индекса (KPI №9)</h3>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
              <div className="formGroup">
                <label>Бонус за ранний приход (%):</label>
                <input 
                  type="number" 
                  className={styles.formInput} 
                  value={bonusPercentages.earlyArrivalPct}
                  onChange={e => setBonusPercentages(prev => ({ ...prev, earlyArrivalPct: parseInt(e.target.value) || 5 }))}
                />
              </div>
              <div className="formGroup">
                <label>Помощь коллегам (%):</label>
                <input 
                  type="number" 
                  className={styles.formInput} 
                  value={bonusPercentages.helpColleaguePct}
                  onChange={e => setBonusPercentages(prev => ({ ...prev, helpColleaguePct: parseInt(e.target.value) || 5 }))}
                />
              </div>
              <div className="formGroup">
                <label>Сдача задачи без брака (%):</label>
                <input 
                  type="number" 
                  className={styles.formInput} 
                  value={bonusPercentages.qualityDeliveryPct}
                  onChange={e => setBonusPercentages(prev => ({ ...prev, qualityDeliveryPct: parseInt(e.target.value) || 2 }))}
                />
              </div>
            </div>
          </div>

        </div>
      )}

      {/* 3.3. Tab: DEPARTMENTS */}
      {activeTab === 'departments' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Department managers KPIs card */}
          <div className="card">
            <div className={styles.cardHeader}>
              <h3><Landmark size={18} /> Должностные KPI начальников отделов</h3>
            </div>
            <div className={styles.tableWrapper}>
              <table className={styles.customTable}>
                <thead>
                  <tr>
                    <th>Начальник отдела</th>
                    <th>Отдел</th>
                    <th>KPI1 (Взаимод)</th>
                    <th>KPI2 (Реакция)</th>
                    <th>KPI3 (Рук. Ответ)</th>
                    <th>KPI4 (Вним)</th>
                    <th>KPI5 (Рассм. Инициатив)</th>
                    <th>KPI6 (Сверхурочные)</th>
                    <th>KPI7 (Контроль отдела)</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.filter(emp => emp.name === 'Алексей Смирнов' || emp.name === 'Елена Соколова').map(mgr => {
                    const isSminov = mgr.name === 'Алексей Смирнов';
                    return (
                      <tr 
                        key={mgr.id} 
                        className={`${styles.clickableRow} ${styles.managerRowLarge}`}
                        onClick={() => { setSelectedEmployeeProfile(mgr); setActiveCheckpointTab('1'); }}
                      >
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div className={styles.avatarMini} style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #ec4899 100%)' }}>
                              {(mgr.name || '?')[0]}
                            </div>
                            <div>
                              <strong className={styles.empNameLink}>{mgr.name}</strong>
                              <span className="badge badge-primary" style={{ fontSize: '10px', marginLeft: '6px' }}>Начальник</span>
                            </div>
                          </div>
                        </td>
                        <td>{isSminov ? 'Разработка' : 'Маркетинг'}</td>
                        <td className={styles.managerKpiCell}><strong>{isSminov ? '90%' : '95%'}</strong></td>
                        <td className={styles.managerKpiCell}><strong>{isSminov ? '1.2 раб. дня' : '0.8 раб. дня'}</strong></td>
                        <td className={styles.managerKpiCell}><strong>{isSminov ? '85 баллов' : '92 балла'}</strong></td>
                        <td className={styles.managerKpiCell}><strong>{isSminov ? '95%' : '100%'}</strong></td>
                        <td className={styles.managerKpiCell}><strong>{isSminov ? '4.2 раб. дня' : '2.5 раб. дня'}</strong></td>
                        <td className={styles.managerKpiCell}>
                          <strong style={{ color: isSminov ? '#ef4444' : '#10b981' }}>
                            {isSminov ? '95% (риск перегруза)' : '50%'}
                          </strong>
                        </td>
                        <td className={styles.managerKpiCell}><strong>{isSminov ? '88 баллов' : '94 балла'}</strong></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Weekly reports review panel */}
          <div className="card">
            <div className={styles.cardHeader}>
              <h3><FileText size={18} /> Еженедельные отчеты начальников и заместителя (KPI №7)</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {weeklyReports.map(rep => (
                <div key={rep.id} style={{ border: '1px solid var(--color-border)', borderRadius: '8px', padding: '16px', background: 'rgba(255, 255, 255, 0.01)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <div>
                      <strong>{rep.employeeName}</strong> <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>({rep.role})</span>
                    </div>
                    <span className={`badge ${rep.status === 'Принят' ? 'badge-success' : rep.status === 'На доработке' ? 'badge-error' : 'badge-warning'}`}>
                      {rep.status}
                    </span>
                  </div>
                  <p style={{ fontSize: '13.5px', color: 'var(--color-text-secondary)', marginBottom: '12px' }}>{rep.content}</p>
                  
                  {rep.status === 'На проверке' && (
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button className="btn btn-success btn-xs" onClick={() => handleAcceptReport(rep.id)}>Утвердить отчет</button>
                      <button className="btn btn-danger btn-xs" onClick={() => handleRejectReport(rep.id)}>Отклонить на доработку</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* 3.4. Tab: SATISFACTION */}
      {activeTab === 'satisfaction' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Customer Satisfaction rating system */}
          <div className="card">
            <div className={styles.cardHeader}>
              <h3><Star size={18} /> Командный KPI «Удовлетворенность заказчика»</h3>
              <button className="btn btn-primary btn-xs" onClick={() => setIsSatisfactionOpen(true)}>Ввести устную оценку</button>
            </div>

            <div className={styles.tableWrapper}>
              <table className={styles.customTable}>
                <thead>
                  <tr>
                    <th>Проект</th>
                    <th>Оценка заказчика</th>
                    <th>Комментарий клиента</th>
                    <th>Участники команды (веса)</th>
                    <th>Дата оценки</th>
                    <th>Статус интеграции</th>
                    <th>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {satisfactionList.map(sat => (
                    <tr key={sat.id}>
                      <td><strong>{sat.projectName}</strong></td>
                      <td>
                        <div className={styles.satisfyStars}>
                          {[1, 2, 3, 4, 5].map(star => (
                            <Star key={star} size={14} fill={star <= sat.rating ? '#f59e0b' : 'none'} style={{ color: '#f59e0b' }} />
                          ))}
                        </div>
                      </td>
                      <td>{sat.comment}</td>
                      <td>
                        {sat.participants.map((p, i) => (
                          <div key={i} style={{ fontSize: '11px' }}>
                            {p.name}: <strong>{p.weight}%</strong>
                          </div>
                        ))}
                      </td>
                      <td>{sat.date}</td>
                      <td>
                        <span className={`badge ${sat.integrationStatus === 'Интегрировано' ? 'badge-success' : 'badge-warning'}`} style={{ fontSize: '10.5px' }}>
                          {sat.integrationStatus || 'Активна'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            className="btn btn-ghost btn-xs"
                            onClick={() => {
                              setEditingSatisfaction(sat);
                              setNewSatisfaction({
                                projectName: sat.projectName,
                                rating: sat.rating,
                                comment: sat.comment,
                                participants: sat.participants.map(p => `${p.name}:${p.weight}`).join(', '),
                                integrationStatus: sat.integrationStatus || 'Активна',
                                date: sat.date || ''
                              });
                              setIsSatisfactionOpen(true);
                            }}
                            title="Редактировать"
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            className="btn btn-ghost btn-xs"
                            onClick={() => {
                              if (window.confirm('Вы уверены, что хотите удалить эту оценку?')) {
                                setSatisfactionList(prev => prev.filter(item => item.id !== sat.id));
                              }
                            }}
                            title="Удалить"
                            style={{ color: '#ef4444' }}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* 3.5. Tab: INTERNS */}
      {activeTab === 'interns' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Interns parameters configuration and evaluation */}
          <div className="card">
            <div className={styles.cardHeader}>
              <h3><BookOpen size={18} /> Управление обучением стажёров</h3>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
              <div className="formGroup">
                <label>Норма часов обучения в день:</label>
                <input 
                  type="number" 
                  className={styles.formInput} 
                  value={kpiNorms.internHours} 
                  onChange={e => setKpiNorms(prev => ({ ...prev, internHours: parseInt(e.target.value) || 4 }))}
                />
              </div>
              <div className="formGroup">
                <label>Порог оповещений о низком KPI (%):</label>
                <input 
                  type="number" 
                  className={styles.formInput} 
                  value={50} 
                  disabled
                />
              </div>
            </div>

            <div className={styles.tableWrapper}>
              <table className={styles.customTable}>
                <thead>
                  <tr>
                    <th>ФИО Стажёра</th>
                    <th>KPI обучения</th>
                    <th>Норма в часах</th>
                    <th>Статус</th>
                    <th>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.filter(e => e.isIntern).map(intern => (
                    <tr key={intern.id}>
                      <td><strong>{intern.name}</strong></td>
                      <td>
                        <strong style={{ color: intern.kpiValue < 50 ? '#ef4444' : '#10b981' }}>{intern.kpiValue}%</strong>
                      </td>
                      <td>{kpiNorms.internHours} ч/день</td>
                      <td><span className="badge badge-warning">Стажируется</span></td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button className="btn btn-success btn-xs" onClick={() => handleFinishInternship(intern.id, true)}>Перевести в штат</button>
                          <button className="btn btn-danger btn-xs" onClick={() => handleFinishInternship(intern.id, false)}>Отчислить</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* 3.6. Tab: INTEGRATIONS */}
      {activeTab === 'integrations' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Settings, percentages, bonus ranges config */}
          <div className="card">
            <div className={styles.cardHeader}>
              <h3><Settings size={18} /> Интеграция с платформой Agile Business</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '13.5px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'rgba(16, 185, 129, 0.05)', borderRadius: '6px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                <div>
                  <strong>Связь через Webhook события:</strong>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>Авто-импорт завершенных проектов, состава участников и оценок заказчика</div>
                </div>
                <span className="badge badge-success">Активна</span>
              </div>

              <div className="formGroup">
                <label>Webhook URL для синхронизации проектов:</label>
                <input type="text" className={styles.formInput} value="https://app.agile-business-pro.com/api/webhooks/kpi-sync" readOnly />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3.7. Tab: AUDIT */}
      {activeTab === 'audit' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Audit logs of critical actions */}
          <div className="card">
            <div className={styles.cardHeader}>
              <h3><Database size={18} /> Журнал изменений и лог безопасности (Audit Logs)</h3>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {auditLogs.map(log => (
                <div key={log.id} className={styles.auditLogItem}>
                  <div className={styles.auditMeta}>
                    <span>{log.timestamp}</span> • Действие совершил: <strong>{log.actor}</strong>
                  </div>
                  <div>
                    <span className={styles.auditAction}>{log.action}</span> для <strong>{log.target}</strong>
                  </div>
                  <div className={styles.auditReason}>{log.details}</div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}


      {/* --- ALL POPUP DIALOGS --- */}

      {/* Popup: Edit KPIs */}
      {isEditKpiOpen && selectedEmpForKpi && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3>Корректировка KPI: {selectedEmpForKpi.name}</h3>
              <button className={styles.closeBtn} onClick={() => setIsEditKpiOpen(false)}>&times;</button>
            </div>
            <form onSubmit={e => { e.preventDefault(); saveKpiEdits(); }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {Object.keys(editedKpis).map(k => (
                  <div className="formGroup" key={k}>
                    <label>{k.toUpperCase()} Индекс (%):</label>
                    <input 
                      type="number" 
                      min="0" 
                      max="100" 
                      className={styles.formInput} 
                      value={editedKpis[k]} 
                      onChange={e => setEditedKpis(prev => ({ ...prev, [k]: parseInt(e.target.value) || 0 }))}
                    />
                  </div>
                ))}
              </div>
              <div className={styles.formActions}>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setIsEditKpiOpen(false)}>Отмена</button>
                <button type="submit" className="btn btn-primary btn-sm">Сохранить правки</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Popup: Add Exception */}
      {isAddExceptionOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3>Назначить уважительное исключение</h3>
              <button className={styles.closeBtn} onClick={() => setIsAddExceptionOpen(false)}>&times;</button>
            </div>
            <form onSubmit={handleAddException}>
              <div className="formGroup">
                <label>ФИО Сотрудника:</label>
                <input 
                  type="text" 
                  className={styles.formInput} 
                  placeholder="Например: Мария Сидорова"
                  value={newException.employeeName}
                  onChange={e => setNewException(prev => ({ ...prev, employeeName: e.target.value }))}
                  required
                />
              </div>
              <div className="formGroup">
                <label>Дата исключения:</label>
                <input 
                  type="date" 
                  className={styles.formInput}
                  value={newException.date}
                  onChange={e => setNewException(prev => ({ ...prev, date: e.target.value }))}
                  required
                />
              </div>
              <div className="formGroup">
                <label>Причина отсутствия/исключения:</label>
                <select 
                  className={styles.formInput}
                  value={newException.reason}
                  onChange={e => setNewException(prev => ({ ...prev, reason: e.target.value }))}
                  required
                >
                  <option value="">Выберите причину...</option>
                  <option value="Больничный лист (официальный)">Больничный лист (официальный)</option>
                  <option value="Семейные обстоятельства">Семейные обстоятельства</option>
                  <option value="Технический сбой платформы">Технический сбой платформы</option>
                  <option value="Корпоративный отгул">Корпоративный отгул</option>
                </select>
              </div>
              <div className={styles.formActions}>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setIsAddExceptionOpen(false)}>Отмена</button>
                <button type="submit" className="btn btn-primary btn-sm">Добавить исключение</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Popup: Emergency notifications */}
      {isEmergencyMsgOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3>Отправить экстренное сообщение компании</h3>
              <button className={styles.closeBtn} onClick={() => setIsEmergencyMsgOpen(false)}>&times;</button>
            </div>
            <form onSubmit={handleSendEmergencyMsg}>
              <div className="formGroup">
                <label>Получатели сообщения:</label>
                <select 
                  className={styles.formInput}
                  value={emergencyMsg.target}
                  onChange={e => setEmergencyMsg(prev => ({ ...prev, target: e.target.value }))}
                >
                  <option value="managers">Только начальники отделов</option>
                  <option value="all">Все сотрудники компании (массово)</option>
                </select>
              </div>
              <div className="formGroup">
                <label>Текст сообщения:</label>
                <textarea 
                  className={styles.formInput} 
                  style={{ minHeight: '120px' }}
                  placeholder="Введите сообщение о сбое системы, изменении регламентов или важном объявлении..."
                  value={emergencyMsg.text}
                  onChange={e => setEmergencyMsg(prev => ({ ...prev, text: e.target.value }))}
                  required
                />
              </div>
              <div className={styles.formActions}>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setIsEmergencyMsgOpen(false)}>Отмена</button>
                <button type="submit" className="btn btn-error btn-sm">Отправить экстренно</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Popup: Add customer satisfaction */}
      {isSatisfactionOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3>{editingSatisfaction ? 'Редактирование параметров оценки заказчика' : 'Ручное добавление оценки заказчика'}</h3>
              <button className={styles.closeBtn} onClick={() => { setIsSatisfactionOpen(false); setEditingSatisfaction(null); setNewSatisfaction({ projectName: '', rating: 5, comment: '', participants: '', integrationStatus: 'Активна', date: '' }); }}>&times;</button>
            </div>
            <form onSubmit={handleAddSatisfaction}>
              <div className="formGroup">
                <label>Название проекта:</label>
                <input 
                  type="text" 
                  className={styles.formInput}
                  placeholder="Например: Модернизация СРМ"
                  value={newSatisfaction.projectName}
                  onChange={e => setNewSatisfaction(prev => ({ ...prev, projectName: e.target.value }))}
                  required
                />
              </div>
              <div className="formGroup">
                <label>Оценка заказчика (1-5):</label>
                <input 
                  type="number" 
                  min="1" 
                  max="5"
                  className={styles.formInput}
                  value={newSatisfaction.rating}
                  onChange={e => setNewSatisfaction(prev => ({ ...prev, rating: Math.max(1, Math.min(5, parseInt(e.target.value) || 5)) }))}
                  required
                />
              </div>
              <div className="formGroup">
                <label>Комментарий клиента:</label>
                <textarea 
                  className={styles.formInput}
                  placeholder="Комментарий клиента на основе устной обратной связи..."
                  value={newSatisfaction.comment}
                  onChange={e => setNewSatisfaction(prev => ({ ...prev, comment: e.target.value }))}
                  required
                />
              </div>
              <div className="formGroup">
                <label>Участники и веса (Формат: Имя:Вес, Имя:Вес):</label>
                <input 
                  type="text" 
                  className={styles.formInput}
                  placeholder="Иван Иванов:60, Мария Сидорова:40"
                  value={newSatisfaction.participants}
                  onChange={e => setNewSatisfaction(prev => ({ ...prev, participants: e.target.value }))}
                />
              </div>
              <div className="formGroup">
                <label>Дата оценки (ГГГГ-ММ-ДД):</label>
                <input 
                  type="date" 
                  className={styles.formInput}
                  value={newSatisfaction.date}
                  onChange={e => setNewSatisfaction(prev => ({ ...prev, date: e.target.value }))}
                />
              </div>
              <div className="formGroup">
                <label>Статус интеграции:</label>
                <select 
                  className={styles.formInput}
                  value={newSatisfaction.integrationStatus}
                  style={{ background: 'var(--color-bg)', color: 'var(--color-text)', border: '1px solid var(--color-border)', width: '100%', padding: '6px', borderRadius: '4px' }}
                  onChange={e => setNewSatisfaction(prev => ({ ...prev, integrationStatus: e.target.value }))}
                >
                  <option value="Активна">Активна</option>
                  <option value="Интегрировано">Интегрировано</option>
                  <option value="В обработке">В обработке</option>
                </select>
              </div>
              <div className={styles.formActions}>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => { setIsSatisfactionOpen(false); setEditingSatisfaction(null); setNewSatisfaction({ projectName: '', rating: 5, comment: '', participants: '', integrationStatus: 'Активна', date: '' }); }}>Отмена</button>
                <button type="submit" className="btn btn-primary btn-sm">{editingSatisfaction ? 'Сохранить изменения' : 'Сохранить оценку'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Popup: Add bonus type for KPI9 */}
      {isBonusTypeOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3>Добавить новый тип бонуса KPI9</h3>
              <button className={styles.closeBtn} onClick={() => setIsBonusTypeOpen(false)}>&times;</button>
            </div>
            <form onSubmit={e => { e.preventDefault(); setIsBonusTypeOpen(false); alert('Новый тип бонусного начисления добавлен в регламент KPI!'); }}>
              <div className="formGroup">
                <label>Название бонусного события:</label>
                <input 
                  type="text" 
                  className={styles.formInput}
                  placeholder="Например: Внедренная инновационная идея"
                  value={newBonusType.name}
                  onChange={e => setNewBonusType(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>
              <div className="formGroup">
                <label>Процент бонуса (%):</label>
                <input 
                  type="number" 
                  className={styles.formInput}
                  value={newBonusType.percent}
                  onChange={e => setNewBonusType(prev => ({ ...prev, percent: parseInt(e.target.value) || 5 }))}
                  required
                />
              </div>
              <div className="formGroup">
                <label>Лимит начислений в месяц:</label>
                <input 
                  type="number" 
                  className={styles.formInput}
                  value={newBonusType.limit}
                  onChange={e => setNewBonusType(prev => ({ ...prev, limit: parseInt(e.target.value) || 3 }))}
                  required
                />
              </div>
              <div className={styles.formActions}>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setIsBonusTypeOpen(false)}>Отмена</button>
                <button type="submit" className="btn btn-primary btn-sm">Добавить тип бонуса</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Popup: Intern Graduation / Acceptance details */}
      {internToAccept && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3>Принятие сотрудника в штат</h3>
              <button className={styles.closeBtn} onClick={() => setInternToAccept(null)}>&times;</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
              <div className="formGroup">
                <label>Должность:</label>
                <select 
                  className={styles.formInput}
                  value={acceptRole}
                  onChange={e => setAcceptRole(e.target.value)}
                >
                  <option value="user">Сотрудник</option>
                  <option value="consultant">Консультант</option>
                  <option value="deputy_owner">Заместитель владельца</option>
                  <option value="admin">Администратор</option>
                </select>
              </div>
              <div className="formGroup">
                <label>Отдел:</label>
                <select 
                  className={styles.formInput}
                  value={acceptDepartment}
                  onChange={e => setAcceptDepartment(e.target.value)}
                >
                  <option value="Разработка">Разработка</option>
                  <option value="Маркетинг">Маркетинг</option>
                  <option value="Дизайн">Дизайн</option>
                  <option value="Продажи">Продажи</option>
                  <option value="Аналитика">Аналитика</option>
                  <option value="Бухгалтерия">Бухгалтерия</option>
                  <option value="Кадры">Кадры</option>
                  <option value="Управление">Управление</option>
                </select>
              </div>
              <div className="formGroup">
                <label>Руководитель:</label>
                <select 
                  className={styles.formInput}
                  value={acceptManager}
                  onChange={e => setAcceptManager(e.target.value)}
                >
                  <option value="">-- Выберите руководителя --</option>
                  {employees.filter(e => !e.isIntern && e.id !== internToAccept).map(e => (
                    <option key={e.id} value={e.name}>{e.name}</option>
                  ))}
                </select>
              </div>
              <div className={styles.formActions} style={{ marginTop: '12px' }}>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setInternToAccept(null)}>Отмена</button>
                <button type="button" className="btn btn-primary btn-sm" onClick={handleConfirmAcceptIntern}>Принять в штат</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Popup: Employee Detailed Profile Card (Requirement 7, 10, 11) */}
      {selectedEmployeeProfile && (
        <div className={styles.modalOverlay} onClick={() => setSelectedEmployeeProfile(null)}>
          <div className={styles.modalContentLarge} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div className={styles.avatarLarge}>
                  {(selectedEmployeeProfile.name || '?')[0]}
                </div>
                <div>
                  <h3 style={{ margin: 0 }}>{selectedEmployeeProfile.name}</h3>
                  <span className={styles.subtitle}>
                    {selectedEmployeeProfile.department} • {selectedEmployeeProfile.isIntern ? 'Стажёр' : 'В штате'}
                  </span>
                </div>
              </div>
              <button className={styles.closeBtn} onClick={() => setSelectedEmployeeProfile(null)}>&times;</button>
            </div>

            <div className={styles.profileModalBody}>
              {/* Top row: General KPI circle & Sparkline trend chart */}
              <div className={styles.profileTopRow}>
                <div className={styles.generalKpiBigCard}>
                  <span className={styles.bigKpiLabel}>Общий KPI</span>
                  <div className={styles.bigKpiCircle} style={{
                    borderColor: selectedEmployeeProfile.kpiValue >= 80 ? '#10b981' : selectedEmployeeProfile.kpiValue >= 70 ? '#f59e0b' : '#ef4444'
                  }}>
                    <strong style={{
                      color: selectedEmployeeProfile.kpiValue >= 80 ? '#10b981' : selectedEmployeeProfile.kpiValue >= 70 ? '#f59e0b' : '#ef4444'
                    }}>
                      {selectedEmployeeProfile.kpiValue}%
                    </strong>
                  </div>
                  <span className={styles.bigKpiStatus}>
                    {selectedEmployeeProfile.kpiValue >= 80 ? 'Высокая эффективность' : selectedEmployeeProfile.kpiValue >= 70 ? 'Стабильный уровень' : 'Требует разбора'}
                  </span>
                </div>

                <div className={styles.trendChartCard}>
                  <KpiTrendChart 
                    points={getKpiTrend(selectedEmployeeProfile.name)} 
                    color={selectedEmployeeProfile.kpiValue >= 80 ? '#10b981' : selectedEmployeeProfile.kpiValue >= 70 ? '#f59e0b' : '#ef4444'} 
                  />
                </div>
              </div>

              {/* Checkpoint Timeline pathway (Requirement 11) */}
              {renderCheckpointPathway(selectedEmployeeProfile)}

              {/* Interactive daily events diagram and range selector */}
              {renderEventTimelineWidget(selectedEmployeeProfile)}

              {/* KPI Detailed Grid (Requirement 10) */}
              <div className={styles.kpiDetailsGridSection}>
                <h4 style={{ fontSize: '13.5px', fontWeight: 700, marginBottom: '12px' }}>Подробные показатели KPI</h4>
                <div className={styles.detailedKpiCardsWrap}>
                  {[
                    { key: 'kpi1', icon: <Timer size={16} />, value: selectedEmployeeProfile.kpi1 },
                    { key: 'kpi2', icon: <Clock size={16} />, value: selectedEmployeeProfile.kpi2 },
                    { key: 'kpi3', icon: <Sparkles size={16} />, value: selectedEmployeeProfile.kpi3 },
                    { key: 'kpi5', icon: <AlertCircle size={16} />, value: selectedEmployeeProfile.kpi5 },
                    { key: 'kpi7', icon: <FileText size={16} />, value: selectedEmployeeProfile.kpi7 },
                    { key: 'kpi8', icon: <Brain size={16} />, value: selectedEmployeeProfile.kpi8 },
                    { key: 'kpi10', icon: <Award size={16} />, value: selectedEmployeeProfile.kpi10 }
                  ].map(item => {
                    const desc = kpiDescriptions[item.key];
                    return (
                      <div className={styles.detailedKpiCard} key={item.key}>
                        <div className={styles.detailedKpiHeader}>
                          <div className={styles.detailedKpiIconTitle}>
                            {item.icon}
                            <strong>{desc.title}</strong>
                          </div>
                          <span className={item.value >= 80 ? styles.kpiGood : item.value >= 70 ? styles.kpiWarn : styles.kpiCrit} style={{ fontWeight: 700, fontSize: '13.5px' }}>
                            {item.value}%
                          </span>
                        </div>
                        <div className={styles.detailedKpiProgress}>
                          <div className={styles.detailedKpiProgressBar} style={{ 
                            width: `${item.value}%`,
                            backgroundColor: item.value >= 80 ? '#10b981' : item.value >= 70 ? '#f59e0b' : '#ef4444'
                          }} />
                        </div>
                        <p className={styles.detailedKpiDesc}>{desc.desc}</p>
                        <div className={styles.detailedKpiMeta}>
                          <span>Цель: {desc.target}</span>
                          <span>Статус: {item.value >= 80 ? 'Выполнено' : item.value >= 70 ? 'На границе' : 'Нарушено'}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Completed Tasks section (Requirement 7) */}
              <div className={styles.tasksSection}>
                <h4 style={{ fontSize: '13.5px', fontWeight: 700, marginBottom: '12px' }}>Выполненные задачи сотрудника</h4>
                <div className={styles.tasksListWrap}>
                  {getCompletedTasks(selectedEmployeeProfile.name, selectedEmployeeProfile.department).map(task => (
                    <div className={styles.taskItemRow} key={task.id}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <CheckCircle2 size={16} style={{ color: '#10b981' }} />
                        <span style={{ fontSize: '12.5px', fontWeight: 500 }}>{task.title}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>{task.date}</span>
                        <span className={`badge ${task.status === 'Выполнено в срок' ? 'badge-success' : 'badge-warning'}`} style={{ fontSize: '10px' }}>
                          {task.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className={styles.formActions} style={{ marginTop: '20px' }}>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setSelectedEmployeeProfile(null)}>
                Закрыть профиль
              </button>
            </div>
          </div>
        </div>
      )}

      {redistributedTasksModal && (
        <div className={styles.modalOverlay} onClick={() => setRedistributedTasksModal(null)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className={styles.modalHeader}>
              <h3>Перераспределенные задачи: {redistributedTasksModal.employeeName}</h3>
              <button className={styles.closeBtn} onClick={() => setRedistributedTasksModal(null)}>&times;</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '10px' }}>
              <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', margin: 0 }}>
                В связи с больничным сотрудника {redistributedTasksModal.employeeName}, следующие задачи были временно переназначены коллегам:
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {redistributedTasksModal.tasks.map((t, idx) => (
                  <div key={idx} style={{ 
                    padding: '10px', 
                    background: 'var(--color-bg-secondary)', 
                    borderRadius: '6px', 
                    border: '1px solid var(--color-border-light)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ fontSize: '12.5px', color: 'var(--color-text)' }}>{t.title}</strong>
                      <span className="badge badge-warning" style={{ fontSize: '10px' }}>Передана</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--color-text-muted)' }}>
                      <span>Исполнитель: <strong style={{ color: 'var(--color-primary)' }}>{t.assignee}</strong></span>
                      <span>Дедлайн: <strong>{t.deadline}</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className={styles.formActions} style={{ marginTop: '20px' }}>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setRedistributedTasksModal(null)}>
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
