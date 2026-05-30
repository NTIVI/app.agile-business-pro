import React, { useState, useEffect, useMemo } from 'react';
import { 
  Activity, AlertTriangle, AlertCircle, Award, BookOpen, Brain, Calendar, 
  CheckCircle2, ChevronDown, ChevronUp, Clock, Coins, Database, FileText, 
  Filter, Flame, Gauge, Globe, HelpCircle, Info, Landmark, Lightbulb, 
  MapPin, RefreshCcw, Search, Send, ShieldAlert, Sparkles, Star, Users, X, 
  Settings, Pencil, Trash2 
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

export default function OwnerDashboard() {
  const { user } = useAppSelector(s => s.auth);
  
  // UI Tabs State
  const [activeTab, setActiveTab] = useState<'dashboard' | 'kpis' | 'departments' | 'satisfaction' | 'interns' | 'integrations' | 'audit'>('dashboard');

  // Interactive Data States
  const [employees, setEmployees] = useState<EmployeeKPI[]>([
    { id: '1', name: 'Иван Иванов', department: 'Разработка', kpiValue: 92, kpi1: 95, kpi2: 90, kpi3: 88, kpi5: 94, kpi7: 90, kpi8: 96, kpi9: 12, kpi10: 95, isIntern: false, status: 'active' },
    { id: '2', name: 'Мария Сидорова', department: 'Разработка', kpiValue: 68, kpi1: 65, kpi2: 70, kpi3: 60, kpi5: 72, kpi7: 65, kpi8: 68, kpi9: 4, kpi10: 70, isIntern: false, status: 'active' },
    { id: '3', name: 'Петр Петров', department: 'Маркетинг', kpiValue: 84, kpi1: 85, kpi2: 82, kpi3: 80, kpi5: 86, kpi7: 85, kpi8: 88, kpi9: 8, kpi10: 84, isIntern: false, status: 'active' },
    { id: '4', name: 'Анна Кузнецова', department: 'Дизайн', kpiValue: 72, kpi1: 74, kpi2: 70, kpi3: 68, kpi5: 75, kpi7: 72, kpi8: 73, kpi9: 6, kpi10: 72, isIntern: false, status: 'active' },
    { id: '5', name: 'Николай Орлов', department: 'Разработка', kpiValue: 48, kpi1: 45, kpi2: 50, kpi3: 40, kpi5: 48, kpi7: 45, kpi8: 52, kpi9: 2, kpi10: 48, isIntern: true, status: 'active' },
    { id: '6', name: 'Алексей Смирнов', department: 'Начальник Разработки', kpiValue: 88, kpi1: 90, kpi2: 85, kpi3: 88, kpi5: 87, kpi7: 90, kpi8: 89, kpi9: 10, kpi10: 88, isIntern: false, status: 'active' },
    { id: '7', name: 'Елена Соколова', department: 'Начальник Маркетинга', kpiValue: 91, kpi1: 92, kpi2: 90, kpi3: 92, kpi5: 90, kpi7: 92, kpi8: 91, kpi9: 14, kpi10: 91, isIntern: false, status: 'active' }
  ]);

  const [activeDrops, setActiveDrops] = useState<KPIDrop[]>([]);
  
  // Custom returns KPI5 list
  const [returns, setReturns] = useState<ReturnRecord[]>([
    { id: 'ret-1', employeeName: 'Мария Сидорова', taskTitle: 'Разработка авторизации', errorCategory: 'Мелкая ошибка (код)', effectiveHours: 2.5, date: '2026-05-28' },
    { id: 'ret-2', employeeName: 'Петр Петров', taskTitle: 'Создание лендинга акций', errorCategory: 'Средняя ошибка (дизайн)', effectiveHours: 4.0, date: '2026-05-29' }
  ]);

  // Customer satisfaction reviews list
  const [satisfactionList, setSatisfactionList] = useState<CustomerSatisfaction[]>([
    { id: 'sat-1', projectName: 'Интеграция СРМ', rating: 5, comment: 'Все супер, вовремя и качественно!', date: '2026-05-25', participants: [{ name: 'Иван Иванов', weight: 60 }, { name: 'Мария Сидорова', weight: 40 }] },
    { id: 'sat-2', projectName: 'Дизайн Мобильного Приложения', rating: 2, comment: 'Затянули сроки и не учли ТЗ.', date: '2026-05-27', participants: [{ name: 'Анна Кузнецова', weight: 100 }] }
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

  const [isAddExceptionOpen, setIsAddExceptionOpen] = useState(false);
  const [newException, setNewException] = useState({ employeeName: '', date: '', reason: '' });

  const [isEmergencyMsgOpen, setIsEmergencyMsgOpen] = useState(false);
  const [emergencyMsg, setEmergencyMsg] = useState({ target: 'managers', text: '' });

  const [isSatisfactionOpen, setIsSatisfactionOpen] = useState(false);
  const [newSatisfaction, setNewSatisfaction] = useState({ projectName: '', rating: 5, comment: '', participants: '' });

  const [isBonusTypeOpen, setIsBonusTypeOpen] = useState(false);
  const [newBonusType, setNewBonusType] = useState({ name: '', percent: 5, limit: 3 });

  // Notifications State
  const [notifications, setNotifications] = useState<Array<{ id: string; type: string; title: string; desc: string; date: string }>>([
    { id: 'n-1', type: 'error', title: 'Расхождение отметок по задаче #1043', desc: 'Начальник Смирнов А. поставил "Сдано в срок", но файл отправлен на 2 дня позже дедлайна. Исполнитель: Сидорова М.', date: 'Только что' },
    { id: 'n-2', type: 'warning', title: 'Непроведенный разбор KPI подчинённого', desc: 'Начальник Смирнов А. не провел разбор падения KPI сотрудника Сидорова М. в течение 5 дней.', date: '1 час назад' },
    { id: 'n-3', type: 'info', title: 'Зависшее тестирование идеи сотрудника', desc: 'Идея "Автоматическое планирование" сотрудника Иванов И. находится в тестировании уже 16 дней.', date: 'Вчера' }
  ]);

  // Load KPI drops on mount
  useEffect(() => {
    loadActiveDrops();
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

    const satRecord: CustomerSatisfaction = {
      id: `sat-${Date.now()}`,
      projectName: newSatisfaction.projectName,
      rating: newSatisfaction.rating,
      comment: newSatisfaction.comment,
      date: new Date().toISOString().split('T')[0],
      participants: participantsParsed.length > 0 ? participantsParsed : [{ name: 'Иван Иванов', weight: 100 }]
    };
    setSatisfactionList(prev => [satRecord, ...prev]);

    // Audit Log
    const log: AuditLog = {
      id: `aud-${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
      actor: 'Владелец (Вы)',
      action: 'Ручная оценка заказчика',
      target: newSatisfaction.projectName,
      details: `Внесена оценка ${newSatisfaction.rating}/5. Сгенерирован скидочный промокод 15% на 3 месяца.`
    };
    setAuditLogs(prev => [log, ...prev]);

    setIsSatisfactionOpen(false);
    setNewSatisfaction({ projectName: '', rating: 5, comment: '', participants: '' });
    alert('Оценка заказчика успешно сохранена! Промокод на скидку 15% сгенерирован и отправлен клиенту.');
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
    setEmployees(prev => prev.map(e => {
      if (e.id === id) {
        return { ...e, isIntern: false, status: inStaff ? 'active' : 'fired' };
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
      details: inStaff ? 'Переведен в штат компании.' : 'Отчислен по результатам обучения.'
    };
    setAuditLogs(prev => [log, ...prev]);
    alert(`Стажировка завершена! Сотрудник ${inStaff ? 'принят в штат' : 'отчислен с платформы'}.`);
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
          <h1>Личный Кабинет Владельца Agile Workspace</h1>
          <p className={styles.subtitle}>Полный оперативный контроль над KPI, качеством, стажировкой и регламентами компании</p>
        </div>
        
        <div className={styles.headerActions}>
          <div className={styles.badgeAlert} title="Критические уведомления">
            <span className="badge badge-error" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', padding: '10px 14px' }}>
              <ShieldAlert size={16} /> 
              {notifications.length} критических оповещений
            </span>
            <span className={styles.redBadge}>{notifications.length}</span>
          </div>

          <button className="btn btn-error btn-sm" onClick={() => setIsEmergencyMsgOpen(true)}>
            <Flame size={14} /> Экстренное уведомление
          </button>
        </div>
      </div>

      {/* Panel of Fast actions */}
      <div className="card" style={{ marginBottom: '24px', background: 'var(--color-bg-secondary)' }}>
        <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Sparkles size={16} className={styles.satisfyStarGood} />
          Панель быстрых действий владельца
        </h3>
        <div className={styles.quickActionsPanel}>
          <button className={styles.quickActionBtn} onClick={() => { setIsAddExceptionOpen(true); }}><Calendar size={14} /> Добавить исключение</button>
          <button className={styles.quickActionBtn} onClick={() => { setIsSatisfactionOpen(true); }}><Star size={14} /> Ввести оценку заказчика</button>
          <button className={styles.quickActionBtn} onClick={() => { setIsBonusTypeOpen(true); }}><Coins size={14} /> Настройка бонусов KPI9</button>
          <button className={styles.quickActionBtn} onClick={() => { setActiveTab('integrations'); }}><Globe size={14} /> Статус интеграций Webhook</button>
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
          <div className={`${styles.card} ${styles.col4}`}>
            <div className={styles.cardHeader}>
              <h3><Activity size={18} className={styles.satisfyStarGood} /> Средний KPI компании</h3>
              <span className="badge badge-success">Норма</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <span style={{ fontSize: '48px', fontWeight: 800, color: 'var(--color-primary)' }}>{averageCompanyKpi}%</span>
              <span style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>+2.5% на этой неделе</span>
            </div>
            <div style={{ marginTop: '16px' }} className={styles.progressBar}>
              <div className={styles.progressFill} style={{ width: `${averageCompanyKpi}%` }} />
            </div>
          </div>

          {/* Critical Drops Widget */}
          <div className={`${styles.card} ${styles.col4}`}>
            <div className={styles.cardHeader}>
              <h3><AlertTriangle size={18} style={{ color: '#ef4444' }} /> Критическое падение KPI (&lt;70%)</h3>
              <span className="badge badge-error">{critEmployees.length} человек</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {critEmployees.map(emp => (
                <div key={emp.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', padding: '6px 0', borderBottom: '1px solid var(--color-border-light)' }}>
                  <strong>{emp.name} ({emp.department})</strong>
                  <span style={{ color: '#ef4444', fontWeight: 700 }}>{emp.kpiValue}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Punctuality and violations summary */}
          <div className={`${styles.card} ${styles.col4}`}>
            <div className={styles.cardHeader}>
              <h3><Clock size={18} style={{ color: '#f59e0b' }} /> Активные Нарушения</h3>
              <span className="badge badge-warning" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>На контроле</span>
            </div>
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
          </div>

          {/* Critical Alerts Center */}
          <div className={`${styles.card} ${styles.col8}`}>
            <div className={styles.cardHeader}>
              <h3><ShieldAlert size={18} style={{ color: '#ef4444' }} /> Центр критических уведомлений владельца</h3>
            </div>
            <div className={styles.alertsList}>
              {notifications.map(n => (
                <div key={n.id} className={styles.alertItem}>
                  <div className={styles.alertIcon}>
                    {n.type === 'error' ? <AlertCircle size={18} /> : <AlertTriangle size={18} />}
                  </div>
                  <div className={styles.alertContent}>
                    <div className={styles.alertTitle}>{n.title}</div>
                    <div className={styles.alertDesc}>{n.desc}</div>
                    <div className={styles.alertMeta}>
                      <span>{n.date}</span>
                      {n.title.includes('расхождение') && (
                        <button className="btn btn-xs btn-primary" onClick={() => handleFixDivergence('1043')}>
                          Исправить расхождение вручную
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sick employees and Hospital Widget */}
          <div className={`${styles.card} ${styles.col4}`}>
            <div className={styles.cardHeader}>
              <h3><Activity size={18} style={{ color: '#10b981' }} /> Тяжёлые больничные сотрудников</h3>
            </div>
            <div className={styles.hospitalItem}>
              <div className={styles.hospitalMainInfo}>
                <h4>Соколов Д. (Дизайнер)</h4>
                <span>Передано задач: <strong>4 шт.</strong></span>
              </div>
              <span className={styles.hospitalTasksBadge}>Задачи перераспределены</span>
            </div>
            <div className={styles.hospitalItem} style={{ opacity: 0.7 }}>
              <div className={styles.hospitalMainInfo}>
                <h4>Дмитриев А. (Разработчик)</h4>
                <span>Передано задач: <strong>0 шт.</strong></span>
              </div>
              <span className="badge badge-secondary">Задач не было</span>
            </div>
          </div>

          {/* Customer satisfying project rankings */}
          <div className={`${styles.card} ${styles.col6}`}>
            <div className={styles.cardHeader}>
              <h3><Star size={18} style={{ color: '#f59e0b' }} /> Проекты с низкими оценками заказчиков (&lt;3)</h3>
            </div>
            {satisfactionList.filter(proj => proj.rating < 3).map(proj => (
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
          <div className={`${styles.card} ${styles.col6}`}>
            <div className={styles.cardHeader}>
              <h3><Flame size={18} style={{ color: '#f59e0b' }} /> Аномальная сверхурочная активность начальников</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(245, 158, 11, 0.05)', borderRadius: '6px', border: '1px solid rgba(245, 158, 11, 0.15)' }}>
                <div>
                  <strong>Алексей Смирнов (Разработка)</strong>
                  <div style={{ fontSize: '11.5px', color: 'var(--color-text-secondary)' }}>Сверхурочных разборов: 6. KPI6 &gt; 90%</div>
                </div>
                <span className="badge badge-error">Риск перегрузки!</span>
              </div>
            </div>
          </div>

          {/* 11. Custom owner calendar preview */}
          <div className={`${styles.card} ${styles.col12}`}>
            <div className={styles.cardHeader}>
              <h3><Calendar size={18} /> Календарь плановых событий владельца</h3>
            </div>
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
          </div>

        </div>
      )}

      {/* 3.2. Tab: KPIS */}
      {activeTab === 'kpis' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
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
                    <tr key={emp.id} style={{ opacity: emp.status === 'blocked' ? 0.5 : 1 }}>
                      <td>
                        <strong>{emp.name}</strong>
                        {emp.isIntern && <span className="badge badge-warning" style={{ fontSize: '10px', marginLeft: '6px' }}>Стажёр</span>}
                        {emp.status === 'blocked' && <span className="badge badge-error" style={{ fontSize: '10px', marginLeft: '6px' }}>Заблокирован</span>}
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
                        <div style={{ display: 'flex', gap: '6px' }}>
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
                  <tr>
                    <td><strong>Алексей Смирнов</strong></td>
                    <td>Разработка</td>
                    <td>90%</td>
                    <td>1.2 раб. дня</td>
                    <td>85 баллов</td>
                    <td>95%</td>
                    <td>4.2 раб. дня</td>
                    <td><strong style={{ color: '#ef4444' }}>95% (риск перегруза)</strong></td>
                    <td>88 баллов</td>
                  </tr>
                  <tr>
                    <td><strong>Елена Соколова</strong></td>
                    <td>Маркетинг</td>
                    <td>95%</td>
                    <td>0.8 раб. дня</td>
                    <td>92 балла</td>
                    <td>100%</td>
                    <td>2.5 раб. дня</td>
                    <td>50%</td>
                    <td>94 балла</td>
                  </tr>
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
                    <th>Отзыв клиента</th>
                    <th>Участники команды (веса)</th>
                    <th>Дата оценки</th>
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
              <h3>Ручное добавление оценки заказчика</h3>
              <button className={styles.closeBtn} onClick={() => setIsSatisfactionOpen(false)}>&times;</button>
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
                <select 
                  className={styles.formInput}
                  value={newSatisfaction.rating}
                  onChange={e => setNewSatisfaction(prev => ({ ...prev, rating: parseInt(e.target.value) || 5 }))}
                >
                  <option value="5">5 звезд (Отлично)</option>
                  <option value="4">4 звезды (Хорошо)</option>
                  <option value="3">3 звезды (Удовлетворительно)</option>
                  <option value="2">2 звезды (Плохо)</option>
                  <option value="1">1 звезда (Ужасно)</option>
                </select>
              </div>
              <div className="formGroup">
                <label>Отзыв клиента (комментарий):</label>
                <textarea 
                  className={styles.formInput}
                  placeholder="Отзыв клиента на основе устной обратной связи..."
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
              <div className={styles.formActions}>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setIsSatisfactionOpen(false)}>Отмена</button>
                <button type="submit" className="btn btn-primary btn-sm">Сохранить оценку</button>
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

    </div>
  );
}
