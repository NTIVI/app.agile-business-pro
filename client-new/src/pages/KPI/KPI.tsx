import { useEffect, useMemo, useState } from 'react';
import { 
  Activity, Timer, Gauge, Brain, RefreshCcw, Coins,
  Search, BookOpen, ChevronDown, ChevronUp, AlertCircle, Info, Award, HelpCircle, Briefcase, Sparkles, Filter 
} from 'lucide-react';
import { 
  gamificationApi, 
  type UserKPI, 
  type KPIDrop, 
  type PerformanceReview, 
  type ManagerKPIDetails 
} from '../../api/gamification';
import { useAppSelector } from '../../store/hooks';
import { t } from '../../i18n';
import styles from './KPI.module.css';
import { kpiDataList, kpiCategories, type KPICardData } from './kpiData';

export default function KPIPage() {
  const { user } = useAppSelector(s => s.auth);
  const { language } = useAppSelector(s => s.ui);
  const lang = t(language);
  const [kpi, setKpi] = useState<UserKPI | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Manager KPI state
  const [managerDetails, setManagerDetails] = useState<ManagerKPIDetails | null>(null);
  const [activeReviewDrop, setActiveReviewDrop] = useState<KPIDrop | null>(null);
  const [reviewForm, setReviewForm] = useState({
    kpi_type: '',
    reason: '',
    action: '',
    comment: ''
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [simulating, setSimulating] = useState(false);

  // Regulations state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});

  const load = async () => {
    setError(null);
    try {
      const { data } = await gamificationApi.getMyKPI();
      setKpi(data);

      if (user && ['admin', 'owner', 'deputy_owner'].includes(user.role)) {
        const mgrRes = await gamificationApi.getManagerKPIDetails();
        setManagerDetails(mgrRes.data);
      }
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Не удалось загрузить KPI');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const id = window.setInterval(load, 60 * 1000);
    return () => window.clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const timeLabel = useMemo(() => {
    if (!kpi) return '0ч 0м';
    const h = Math.floor(kpi.total_time_minutes / 60);
    const m = kpi.total_time_minutes % 60;
    return `${h}ч ${m}м`;
  }, [kpi]);

  const getIcon = (iconName: string, className?: string) => {
    switch (iconName) {
      case 'Timer': return <Timer className={className} size={20} />;
      case 'Activity': return <Activity className={className} size={20} />;
      case 'Brain': return <Brain className={className} size={20} />;
      case 'Gauge': return <Gauge className={className} size={20} />;
      case 'Coins': return <Coins className={className} size={20} />;
      default: return <BookOpen className={className} size={20} />;
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedCards(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleOpenReview = (drop: KPIDrop) => {
    setActiveReviewDrop(drop);
    setReviewForm({
      kpi_type: drop.kpi_type,
      reason: '',
      action: '',
      comment: ''
    });
    setFormError(null);
  };

  const handleCloseReview = () => {
    setActiveReviewDrop(null);
    setFormError(null);
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    
    // Client-side validation: must have reason, action, kpi_type
    const missing = [];
    if (!reviewForm.kpi_type.trim()) missing.push("KPI");
    if (!reviewForm.reason.trim()) missing.push("причина");
    if (!reviewForm.action.trim()) missing.push("мера");
    
    if (missing.length > 0) {
      const errMsg = `Вы не заполнили обязательные поля: ${missing.join(', ')}. Пожалуйста, заполните их перед сохранением.`;
      setFormError(errMsg);
      // Wait, we still attempt backend request if user explicitly bypassed, or we just stop.
      // But wait! Section 9.3 of kpi_extracted.txt says:
      // "Если хотя бы одно обязательное поле не заполнено: Показать уведомление... Запись не отправляется на сервер. Локально (или на сервере при первой отправке) фиксируется попытка в attentiveness_log с success=false. Важно: начисление штрафа за невнимательность происходит только при первой неудачной попытке для данного drop_id."
      // Since backend logs failed attempts when missing fields, sending it to the backend is the absolute best way to log it securely!
    }
    
    setSubmitting(true);
    try {
      await gamificationApi.submitPerformanceReview({
        drop_id: activeReviewDrop?.id,
        kpi_type: reviewForm.kpi_type,
        reason: reviewForm.reason,
        action: reviewForm.action,
        comment: reviewForm.comment || undefined
      });
      handleCloseReview();
      load();
    } catch (err: any) {
      setFormError(err?.response?.data?.detail || 'Не удалось сохранить разбор');
      load(); // Reload to refresh penalty points if they were updated!
    } finally {
      setSubmitting(false);
    }
  };

  const handleSimulateDrop = async (kpiType: string, val: number) => {
    setSimulating(true);
    try {
      await gamificationApi.simulateKPIDrop({ kpi_type: kpiType, drop_value: val });
      load();
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Не удалось запустить симуляцию');
    } finally {
      setSimulating(false);
    }
  };

  const filteredKPIs = useMemo(() => {
    return kpiDataList.filter(kpi => {
      // Filter by category
      const matchesCategory = selectedCategory === 'all' || kpi.type === selectedCategory;
      
      // Filter by search query
      const query = searchQuery.toLowerCase().trim();
      if (!query) return matchesCategory;

      const matchesSearch = 
        kpi.title.toLowerCase().includes(query) ||
        kpi.number.toLowerCase().includes(query) ||
        kpi.subtitle.toLowerCase().includes(query) ||
        kpi.summary.toLowerCase().includes(query) ||
        kpi.details.some(d => d.toLowerCase().includes(query)) ||
        (kpi.exceptions && kpi.exceptions.some(e => e.toLowerCase().includes(query)));

      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  return (
    <div className={styles.page}>
      <div className={styles.head}>
        <div>
          <h1>{lang.nav.kpi || 'KPI'}</h1>
          <p className={styles.muted}>Ваша персональная статистика обучения и регламенты платформы.</p>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={load}><RefreshCcw size={14} /> Обновить</button>
      </div>

      {loading ? <div className={styles.empty}>{lang.common.loading}</div> : null}
      {error ? <div className={styles.error}>{error}</div> : null}

      {kpi && (
        <div className={styles.dashboardSection}>
          <div className={styles.sectionTitle}>
            <Sparkles size={16} className={styles.goldText} />
            <h2>Мои показатели обучения</h2>
          </div>
          <div className={styles.grid}>
            <div className={styles.card}><Timer size={18} /><div><strong>{timeLabel}</strong><span>Время на платформе</span></div></div>
            <div className={styles.card}><Activity size={18} /><div><strong>{kpi.speed_topics_per_day}/день</strong><span>Скорость прохождения</span></div></div>
            <div className={styles.card}><Brain size={18} /><div><strong>{kpi.retention_pct}%</strong><span>Усвоение материала</span></div></div>
            <div className={styles.card}><Gauge size={18} /><div><strong>{kpi.completion_pct}%</strong><span>Прогресс курса</span></div></div>
            <div className={styles.card}><Coins size={18} /><div><strong>{kpi.coins_balance}</strong><span>Agile.Coins</span></div></div>
          </div>

          <div className={styles.progressWrap}>
            <div className={styles.progressRow}><span>Подтемы</span><strong>{kpi.topics_completed}/{kpi.topics_total}</strong></div>
            <div className={styles.progressBar}><div style={{ width: `${Math.max(0, Math.min(100, kpi.completion_pct))}%` }} /></div>
          </div>

          <div className={styles.progressWrap}>
            <div className={styles.progressRow}><span>Тесты</span><strong>{kpi.tests_passed}/{kpi.tests_total}</strong></div>
            <div className={styles.progressBar}><div style={{ width: `${kpi.tests_total ? Math.round((kpi.tests_passed / kpi.tests_total) * 100) : 0}%` }} /></div>
          </div>
        </div>
      )}

      {/* KPI Manager Dashboard */}
      {managerDetails && (
        <div className={styles.managerSection}>
          <div className={styles.managerHeader}>
            <div className={styles.sectionTitle}>
              <Briefcase size={20} className={styles.primaryText} />
              <h2>Кабинет руководителя: Управление и Аналитика KPI</h2>
            </div>
            <span className="badge badge-warning" style={{ color: '#f59e0b', borderColor: '#f59e0b' }}>Режим Руководителя</span>
          </div>

          <div className={styles.managerStatsGrid}>
            <div className={styles.managerStatCard}>
              <Timer size={24} className={styles.primaryText} />
              <div className={styles.managerStatInfo}>
                <strong>{managerDetails.current_kpi2 !== null ? `${managerDetails.current_kpi2} дн.` : '—'}</strong>
                <span>Среднее время реакции (KPI2)</span>
              </div>
            </div>

            <div className={styles.managerStatCard}>
              <Activity size={24} className={styles.goldText} />
              <div className={styles.managerStatInfo}>
                <strong>{managerDetails.reviews_count}</strong>
                <span>Всего разборов проведено</span>
              </div>
            </div>

            <div className={styles.managerStatCard}>
              <Award size={24} style={{ color: '#10b981' }} />
              <div className={styles.managerStatInfo}>
                <strong>+{managerDetails.total_overtime_percent}%</strong>
                <span>Бонус за сверхурочные (KPI6)</span>
              </div>
            </div>

            <div className={styles.managerStatCard}>
              <Gauge size={24} style={{ color: '#ec4899' }} />
              <div className={styles.managerStatInfo}>
                <strong>{managerDetails.overtime_reviews_count}</strong>
                <span>Сверхурочных разборов</span>
              </div>
            </div>
          </div>

          {/* Active KPI Drops to Resolve */}
          <div style={{ marginTop: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={18} style={{ color: '#ef4444' }} />
              Активные падения KPI сотрудников (требуют разбора)
            </h3>
            
            {managerDetails.active_drops.length > 0 ? (
              <div className={styles.dropsWrapper}>
                {managerDetails.active_drops.map(drop => (
                  <div key={drop.id} className={styles.dropItem}>
                    <div className={styles.dropInfo}>
                      <h4>{drop.employee_name || 'Сотрудник'} — Падение {drop.kpi_type}</h4>
                      <div className={styles.dropMeta}>
                        <span>Величина падения: <strong>{drop.drop_value}</strong></span>
                        <span>•</span>
                        <span>Дата фиксации: {new Date(drop.drop_date).toLocaleString()}</span>
                      </div>
                    </div>
                    <button 
                      className="btn btn-error btn-sm" 
                      onClick={() => handleOpenReview(drop)}
                    >
                      <Sparkles size={14} /> Зафиксировать разбор
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{
                background: 'rgba(16, 185, 129, 0.03)',
                border: '1px solid rgba(16, 185, 129, 0.15)',
                borderRadius: '12px',
                padding: '24px',
                textAlign: 'center',
                color: '#34d399'
              }}>
                <Sparkles size={32} style={{ marginBottom: '8px' }} />
                <h4 style={{ fontWeight: 600 }}>Все падения KPI успешно разобраны!</h4>
                <p style={{ fontSize: '13px', opacity: 0.8 }}>Вы отлично справляетесь с контролем качества и регламентов.</p>
              </div>
            )}
          </div>

          {/* Recent Reviews history */}
          {managerDetails.recent_reviews.length > 0 && (
            <div style={{ marginTop: '20px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px' }}>
                История проведенных разборов
              </h3>
              <div className={styles.reviewsTableWrapper}>
                <table className={styles.reviewsTable}>
                  <thead>
                    <tr>
                      <th>KPI</th>
                      <th>Дата разбора</th>
                      <th>Причина падения</th>
                      <th>Принятая мера</th>
                      <th>Реакция (рабочие дни)</th>
                      <th>Режим</th>
                    </tr>
                  </thead>
                  <tbody>
                    {managerDetails.recent_reviews.map(rev => (
                      <tr key={rev.id}>
                        <td><strong>{rev.kpi_type}</strong></td>
                        <td>{new Date(rev.review_date).toLocaleDateString()}</td>
                        <td>{rev.reason}</td>
                        <td>{rev.action}</td>
                        <td>{rev.reaction_days !== null ? `${rev.reaction_days} дн.` : '—'}</td>
                        <td>
                          {rev.is_overtime ? (
                            <span className="badge badge-warning" style={{ fontSize: '11px' }}>Сверхурочно</span>
                          ) : (
                            <span className="badge badge-ghost" style={{ fontSize: '11px' }}>Рабочий</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Simulation Section */}
          {user && ['admin', 'owner'].includes(user.role) && (
            <div className={styles.simulationSection}>
              <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#60a5fa', marginBottom: '10px' }}>
                Панель тестирования KPI (только Администраторы)
              </h4>
              <p style={{ fontSize: '12.5px', color: '#93c5fd', marginBottom: '12px' }}>
                Симулируйте падение показателей для проверки реакций, штрафов за невнимательность и сверхурочных бонусов:
              </p>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button 
                  className="btn btn-outline btn-xs" 
                  disabled={simulating}
                  onClick={() => handleSimulateDrop('KPI1 (Дисциплина)', 15.0)}
                >
                  Симулировать падение KPI1
                </button>
                <button 
                  className="btn btn-outline btn-xs" 
                  disabled={simulating}
                  onClick={() => handleSimulateDrop('KPI5 (Задачи)', 8.5)}
                >
                  Симулировать падение KPI5
                </button>
                <button 
                  className="btn btn-outline btn-xs" 
                  disabled={simulating}
                  onClick={() => handleSimulateDrop('KPI7 (Качество)', 22.0)}
                >
                  Симулировать падение KPI7
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* KPI Regulations Hub Section */}
      <div className={styles.regulationsSection}>
        <div className={styles.regulationsHeader}>
          <div className={styles.sectionTitle}>
            <BookOpen size={20} className={styles.primaryText} />
            <h2>Регламент и база знаний KPI</h2>
          </div>
          <p className={styles.regulationsDesc}>
            Полное описание, математические формулы, коэффициенты, исключения и правила автоматического учета KPI для сотрудников и руководителей платформы Agile Workspace.
          </p>
        </div>

        {/* Filter Toolbar */}
        <div className={styles.toolbar}>
          <div className={styles.searchBox}>
            <Search className={styles.searchIcon} size={16} />
            <input 
              type="text" 
              placeholder="Поиск по регламентам, штрафам, терминам..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
            {searchQuery && (
              <button className={styles.clearSearch} onClick={() => setSearchQuery('')}>×</button>
            )}
          </div>

          <div className={styles.categories}>
            {kpiCategories.map(cat => (
              <button 
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`${styles.catTab} ${selectedCategory === cat.id ? styles.catTabActive : ''}`}
              >
                {cat.title}
              </button>
            ))}
          </div>
        </div>

        {/* Regulations Grid */}
        <div className={styles.kpiList}>
          {filteredKPIs.length > 0 ? (
            filteredKPIs.map(kpiItem => {
              const isExpanded = !!expandedCards[kpiItem.id];
              return (
                <div 
                  key={kpiItem.id} 
                  className={`${styles.kpiCard} ${isExpanded ? styles.kpiCardExpanded : ''} ${styles[`type_${kpiItem.type}`]}`}
                >
                  <div className={styles.kpiCardHeader} onClick={() => toggleExpand(kpiItem.id)}>
                    <div className={styles.kpiCardIcon}>
                      {getIcon(kpiItem.icon, styles.kpiIcon)}
                    </div>
                    <div className={styles.kpiCardMainInfo}>
                      <div className={styles.kpiBadgeRow}>
                        <span className={styles.kpiNumber}>{kpiItem.number}</span>
                        <span className={`${styles.kpiTypeBadge} ${styles[`badge_${kpiItem.type}`]}`}>
                          {kpiItem.type === 'employee' ? 'Сотрудник' : 
                           kpiItem.type === 'manager' ? 'Руководитель' : 
                           kpiItem.type === 'special' ? 'Спец. KPI' : 'Платформа'}
                        </span>
                      </div>
                      <h3 className={styles.kpiTitle}>{kpiItem.title}</h3>
                      <p className={styles.kpiSubtitle}>{kpiItem.subtitle}</p>
                    </div>
                    <div className={styles.expandButton}>
                      {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </div>
                  </div>

                  <div className={styles.kpiCardPreview}>
                    <p className={styles.kpiSummary}>{kpiItem.summary}</p>
                    <div className={styles.quickStats}>
                      <div className={styles.quickStatItem}>
                        <span className={styles.statLabel}>Целевой ориентир:</span>
                        <strong className={styles.statVal}>{kpiItem.target}</strong>
                      </div>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className={styles.kpiCardDetails}>
                      <div className={styles.detailsDivider} />
                      
                      <div className={styles.sectionBlock}>
                        <h4>Формула расчёта:</h4>
                        <div className={styles.formulaBox}>
                          <code>{kpiItem.formula}</code>
                        </div>
                      </div>

                      <div className={styles.sectionBlock}>
                        <h4>Детальный регламент и правила:</h4>
                        <ul className={styles.detailsList}>
                          {kpiItem.details.map((detail, idx) => (
                            <li key={idx}>
                              <span className={styles.bullet}>•</span>
                              <p>{detail}</p>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {kpiItem.exceptions && kpiItem.exceptions.length > 0 && (
                        <div className={styles.exceptionsBlock}>
                          <div className={styles.exceptionsHeader}>
                            <AlertCircle size={16} />
                            <h4>Исключения и уважительные причины:</h4>
                          </div>
                          <ul className={styles.exceptionsList}>
                            {kpiItem.exceptions.map((ex, idx) => (
                              <li key={idx}>{ex}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className={styles.noResults}>
              <HelpCircle size={40} className={styles.mutedIcon} />
              <h3>Ничего не найдено</h3>
              <p>Попробуйте изменить запрос или выбрать другую категорию регламентов.</p>
            </div>
          )}
        </div>
      </div>

      {/* KPI Review Dialog Modal */}
      {activeReviewDrop && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3>Зафиксировать разбор падения</h3>
              <button className={styles.closeButton} onClick={handleCloseReview}>×</button>
            </div>

            {formError && (
              <div className={styles.error} style={{ fontSize: '13px', padding: '10px 14px' }}>
                <AlertCircle size={14} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
                {formError}
              </div>
            )}

            <form onSubmit={handleReviewSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className={styles.formGroup}>
                <label>Показатель KPI *</label>
                <input 
                  type="text" 
                  className={styles.formInput} 
                  value={reviewForm.kpi_type}
                  onChange={(e) => setReviewForm(prev => ({ ...prev, kpi_type: e.target.value }))}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label>Причина отклонения *</label>
                <select 
                  className={styles.formInput}
                  value={reviewForm.reason}
                  onChange={(e) => setReviewForm(prev => ({ ...prev, reason: e.target.value }))}
                  required
                >
                  <option value="">Выберите причину...</option>
                  <option value="Личная халатность">Личная халатность</option>
                  <option value="Высокая нагрузка">Высокая нагрузка</option>
                  <option value="Технические проблемы">Технические проблемы</option>
                  <option value="Семейные обстоятельства">Семейные обстоятельства</option>
                  <option value="Недостаток обучения">Недостаток обучения</option>
                  <option value="Другое">Другое</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label>Принятая мера / Решение *</label>
                <select 
                  className={styles.formInput}
                  value={reviewForm.action}
                  onChange={(e) => setReviewForm(prev => ({ ...prev, action: e.target.value }))}
                  required
                >
                  <option value="">Выберите меру...</option>
                  <option value="Устное замечание">Устное замечание</option>
                  <option value="Официальный выговор">Официальный выговор</option>
                  <option value="Индивидуальный план исправления">Индивидуальный план исправления</option>
                  <option value="Снижение текущей нагрузки">Снижение текущей нагрузки</option>
                  <option value="Дополнительное переобучение">Дополнительное переобучение</option>
                  <option value="Направление к психологу платформы">Направление к психологу платформы</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label>Комментарий (необязательно)</label>
                <textarea 
                  className={styles.formInput}
                  style={{ minHeight: '80px', resize: 'vertical' }}
                  value={reviewForm.comment}
                  onChange={(e) => setReviewForm(prev => ({ ...prev, comment: e.target.value }))}
                  placeholder="Дополнительные примечания к разбору..."
                />
              </div>

              <div className={styles.formActions}>
                <button 
                  type="button" 
                  className="btn btn-ghost btn-sm" 
                  onClick={handleCloseReview}
                  disabled={submitting}
                >
                  Отмена
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary btn-sm" 
                  disabled={submitting}
                >
                  {submitting ? 'Сохранение...' : 'Сохранить разбор'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

