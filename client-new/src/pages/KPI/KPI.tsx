import { useEffect, useMemo, useState } from 'react';
import { 
  Activity, Timer, Gauge, Brain, RefreshCcw, Coins,
  Search, BookOpen, ChevronDown, ChevronUp, AlertCircle, Info, Award, HelpCircle, Briefcase, Sparkles, Filter 
} from 'lucide-react';
import { gamificationApi, type UserKPI } from '../../api/gamification';
import { useAppSelector } from '../../store/hooks';
import { t } from '../../i18n';
import styles from './KPI.module.css';
import { kpiDataList, kpiCategories, type KPICardData } from './kpiData';

export default function KPIPage() {
  const { language } = useAppSelector(s => s.ui);
  const lang = t(language);
  const [kpi, setKpi] = useState<UserKPI | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Regulations state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});

  const load = async () => {
    setError(null);
    try {
      const { data } = await gamificationApi.getMyKPI();
      setKpi(data);
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
  }, []);

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
    </div>
  );
}

