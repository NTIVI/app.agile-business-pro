export interface Topic {
  id: string; name: string; level: 'basic' | 'medium' | 'advanced'; order: number;
}

export interface Direction {
  id: string; name: string; topics: Topic[];
}

export interface Sphere {
  id: string; name: string; desc: string; color: string; icon: string; directions: Direction[];
}

export const SPHERES: Sphere[] = [
  {
    id: 'management', name: 'Управление и Стратегия', desc: 'Стратегический консалтинг, PM, трансформация', color: '#ea580c',
    icon: 'M2,3 L8,3 C10.2,3 12,4.8 12,7 L12,21 C12,19.3 10.7,18 9,18 L2,18 Z M22,3 L16,3 C13.8,3 12,4.8 12,7 L12,21 C12,19.3 13.3,18 15,18 L22,18 Z',
    directions: [
      { id: 'strategy', name: 'Стратегический консалтинг', topics: [
        { id: 'swot', name: "SWOT, PESTEL, Porter's 5 Forces", level: 'basic', order: 1 },
        { id: 'biz_model', name: 'Бизнес-моделирование и Canvas', level: 'basic', order: 2 },
        { id: 'roadmap', name: 'Разработка стратегии и roadmap', level: 'medium', order: 3 },
        { id: 'kpi_strategy', name: 'KPI и OKR для стратегических целей', level: 'medium', order: 4 },
        { id: 'change_mgmt', name: 'Управление изменениями', level: 'advanced', order: 5 },
      ]},
      { id: 'project_mgmt', name: 'Управление проектами', topics: [
        { id: 'pm_basics', name: 'Основы PM: Waterfall, Agile, Scrum', level: 'basic', order: 1 },
        { id: 'wbs', name: 'WBS, декомпозиция, планирование', level: 'basic', order: 2 },
        { id: 'risk_mgmt', name: 'Управление рисками', level: 'medium', order: 3 },
        { id: 'stakeholders', name: 'Работа со стейкхолдерами', level: 'medium', order: 4 },
        { id: 'pm_tools', name: 'Инструменты: Jira, MS Project, Notion', level: 'basic', order: 5 },
        { id: 'scaling', name: 'Масштабирование: SAFe, LeSS', level: 'advanced', order: 6 },
      ]},
      { id: 'digital_transform', name: 'Цифровая трансформация', topics: [
        { id: 'dt_audit', name: 'Аудит цифровой зрелости', level: 'basic', order: 1 },
        { id: 'dt_roadmap', name: 'Roadmap цифровой трансформации', level: 'medium', order: 2 },
        { id: 'automation', name: 'Автоматизация бизнес-процессов', level: 'medium', order: 3 },
        { id: 'data_driven', name: 'Data-driven принятие решений', level: 'advanced', order: 4 },
      ]},
    ],
  },
  {
    id: 'invest', name: 'Инвестиции и оценка', desc: 'DCF, мультипликаторы, M&A, due diligence', color: '#ca8a04',
    icon: 'M12,2 L12,22 M17,7 L9.5,7 A3.5,3.5 0 0 0 9.5,14 L14.5,14 A3.5,3.5 0 0 1 14.5,21 L6,21',
    directions: [
      { id: 'valuation', name: 'Оценка и моделирование', topics: [
        { id: 'dcf', name: 'DCF-модель и дисконтирование', level: 'medium', order: 1 },
        { id: 'multiples', name: 'Мультипликаторы: P/E, EV/EBITDA', level: 'basic', order: 2 },
        { id: 'scenario', name: 'Сценарный анализ', level: 'advanced', order: 3 },
        { id: 'comparables', name: 'Сравнительный анализ сделок', level: 'medium', order: 4 },
      ]},
      { id: 'ma_invest', name: 'M&A и привлечение капитала', topics: [
        { id: 'due_diligence', name: 'Due Diligence', level: 'advanced', order: 1 },
        { id: 'data_room', name: 'Data room и раскрытие информации', level: 'medium', order: 2 },
        { id: 'ir', name: 'IR и работа с инвесторами', level: 'medium', order: 3 },
        { id: 'legal_ma', name: 'Юридическое сопровождение сделок', level: 'advanced', order: 4 },
      ]},
    ],
  },
  {
    id: 'creative', name: 'Креатив и маркетинг', desc: 'Основной фокус — маркетинг. Доп. услуги: продажи и развитие клиентов, дизайн, кадры (HR).', color: '#db2777',
    icon: 'M11,5 L6,9 L2,9 L2,15 L6,15 L11,19 Z M19.07,4.93 A10,10 0 0 1 19.07,19.07 M15.54,8.46 A5,5 0 0 1 15.54,15.54',
    directions: [
      { id: 'marketing_strategy', name: 'Маркетинг (основное направление): стратегия', topics: [
        { id: 'market_research', name: 'Анализ рынка и конкурентов', level: 'basic', order: 1 },
        { id: 'segmentation', name: 'Сегментация ЦА и позиционирование', level: 'basic', order: 2 },
        { id: 'utp', name: 'Формулирование УТП', level: 'medium', order: 3 },
        { id: 'brand', name: 'Брендинг и бренд-стратегия', level: 'medium', order: 4 },
        { id: 'marketing_plan', name: 'Маркетинговый план и бюджетирование', level: 'advanced', order: 5 },
      ]},
      { id: 'performance_marketing', name: 'Маркетинг (основное направление): performance', topics: [
        { id: 'context_ads', name: 'Контекстная реклама: Google Ads, Яндекс Директ', level: 'basic', order: 1 },
        { id: 'target_ads', name: 'Таргетированная реклама: Meta, VK, TikTok', level: 'basic', order: 2 },
        { id: 'analytics_tools', name: 'Аналитика: GA4, Яндекс Метрика, UTM', level: 'medium', order: 3 },
        { id: 'ab_testing', name: 'A/B тестирование и оптимизация', level: 'medium', order: 4 },
        { id: 'romi', name: 'ROMI, CPA, LTV, unit-экономика', level: 'advanced', order: 5 },
      ]},
      { id: 'content_marketing', name: 'Маркетинг (основное направление): контент и SMM', topics: [
        { id: 'content_strategy', name: 'Контент-стратегия и план', level: 'basic', order: 1 },
        { id: 'copywriting', name: 'Копирайтинг и редактура', level: 'basic', order: 2 },
        { id: 'smm', name: 'SMM: ведение соцсетей', level: 'basic', order: 3 },
        { id: 'seo', name: 'SEO: on-page, off-page, техническое', level: 'medium', order: 4 },
        { id: 'email_marketing', name: 'Email-маркетинг и автоворонки', level: 'medium', order: 5 },
      ]},
      { id: 'sales_extra', name: 'Продажи и развитие клиентов (доп. услуга)', topics: [
        { id: 'sales_process', name: 'Построение воронки и CRM', level: 'basic', order: 1 },
        { id: 'sales_scripts', name: 'Скрипты, регламенты, обучение отдела продаж', level: 'medium', order: 2 },
        { id: 'account_csm', name: 'Аккаунт-менеджмент и Customer Success', level: 'medium', order: 3 },
        { id: 'ltv', name: 'LTV, удержание и развитие клиентов', level: 'advanced', order: 4 },
      ]},
      { id: 'design_extra', name: 'Дизайн (доп. услуга)', topics: [
        { id: 'ux_ui', name: 'UX/UI и прототипирование', level: 'medium', order: 1 },
        { id: 'graphic', name: 'Графический дизайн и айдентика', level: 'basic', order: 2 },
        { id: 'motion', name: 'Моушн и видеопродакшн', level: 'medium', order: 3 },
        { id: 'design_process', name: 'Брифинг, итерации, сдача макетов', level: 'basic', order: 4 },
      ]},
      { id: 'hr_extra', name: 'Кадры и организация (HR) (доп. услуга)', topics: [
        { id: 'sourcing', name: 'Сорсинг и каналы привлечения', level: 'basic', order: 1 },
        { id: 'interview', name: 'Проведение интервью и оценка', level: 'basic', order: 2 },
        { id: 'lnd', name: 'Обучение и развитие (L&D)', level: 'medium', order: 3 },
        { id: 'cnb', name: 'Компенсации, грейды, мотивация (C&B)', level: 'medium', order: 4 },
        { id: 'hr_audit', name: 'Аудит HR-процессов и текучести', level: 'advanced', order: 5 },
      ]},
    ],
  },
  {
    id: 'analytics', name: 'Аналитика и Данные', desc: 'BI, финансовая аналитика, бизнес-аналитика, риски', color: '#2563eb',
    icon: 'M3,21 L21,21 M3,17 L9,11 L13,15 L21,7',
    directions: [
      { id: 'biz_fin_analytics', name: 'Бизнес- и финансовая аналитика', topics: [
        { id: 'requirements', name: 'Сбор требований и AS-IS процессов', level: 'basic', order: 1 },
        { id: 'fpa', name: 'FP&A: модели, план-факт, прогнозы', level: 'medium', order: 2 },
        { id: 'etl', name: 'Инвентаризация данных и ETL', level: 'medium', order: 3 },
        { id: 'dirty_data', name: 'Очистка и качество данных', level: 'advanced', order: 4 },
      ]},
      { id: 'bi_direction', name: 'BI и визуализация', topics: [
        { id: 'dashboards', name: 'Дашборды: Power BI, Tableau', level: 'medium', order: 1 },
        { id: 'kpi_bi', name: 'KPI и метрики для отчётности', level: 'basic', order: 2 },
        { id: 'data_model', name: 'Модель данных и семантический слой', level: 'advanced', order: 3 },
      ]},
      { id: 'risk_analytics', name: 'Риск-менеджмент', topics: [
        { id: 'risk_map', name: 'Карта рисков и VaR', level: 'advanced', order: 1 },
        { id: 'risk_process', name: 'Встраивание рисков в процессы', level: 'medium', order: 2 },
      ]},
    ],
  },
  {
    id: 'it', name: 'ИТ и разработка', desc: 'Разработка, инфраструктура, тестирование', color: '#DC2626',
    icon: 'M2,3 L22,3 C23.1,3 24,3.9 24,5 L24,17 L0,17 L0,5 C0,3.9 0.9,3 2,3 Z M8,21 L16,21 M12,17 L12,21',
    directions: [
      { id: 'frontend', name: 'Frontend-разработка', topics: [
        { id: 'html', name: 'HTML: теги, семантика, формы', level: 'basic', order: 1 },
        { id: 'css_basic', name: 'CSS: селекторы, блочная модель, позиционирование', level: 'basic', order: 2 },
        { id: 'css_advanced', name: 'CSS: Flexbox, Grid, адаптивная вёрстка', level: 'medium', order: 3 },
        { id: 'js_basic', name: 'JavaScript: синтаксис, типы данных, операторы', level: 'basic', order: 4 },
        { id: 'js_dom', name: 'JavaScript: DOM, события, обработчики', level: 'medium', order: 5 },
        { id: 'js_advanced', name: 'JavaScript: async/await, промисы, замыкания', level: 'advanced', order: 6 },
        { id: 'js_es6', name: 'JavaScript: ES6+ (деструктуризация, модули, spread)', level: 'medium', order: 7 },
        { id: 'frameworks', name: 'Фреймворки: React / Vue / Angular (основы)', level: 'advanced', order: 8 },
        { id: 'build_tools', name: 'Сборка: Webpack, Vite, npm/yarn', level: 'medium', order: 9 },
        { id: 'testing_fe', name: 'Тестирование: Jest, Cypress, E2E', level: 'advanced', order: 10 },
      ]},
      { id: 'backend', name: 'Backend-разработка', topics: [
        { id: 'http', name: 'HTTP: методы, статус-коды, заголовки', level: 'basic', order: 1 },
        { id: 'rest_api', name: 'REST API: принципы, проектирование эндпоинтов', level: 'basic', order: 2 },
        { id: 'auth', name: 'Аутентификация: JWT, OAuth, сессии', level: 'medium', order: 3 },
        { id: 'server_lang', name: 'Серверный язык: Node.js / Python / PHP / Go', level: 'basic', order: 4 },
        { id: 'orm', name: 'ORM: Sequelize, SQLAlchemy, Eloquent', level: 'medium', order: 5 },
        { id: 'middleware', name: 'Middleware и обработка ошибок', level: 'medium', order: 6 },
        { id: 'solid', name: 'Принципы SOLID и паттерны проектирования', level: 'advanced', order: 7 },
        { id: 'microservices', name: 'Микросервисная архитектура', level: 'advanced', order: 8 },
        { id: 'mq', name: 'Message Queue: RabbitMQ, Kafka', level: 'advanced', order: 9 },
        { id: 'caching', name: 'Кэширование: Redis, Memcached, HTTP-кэш', level: 'advanced', order: 10 },
      ]},
      { id: 'devops', name: 'DevOps и инфраструктура', topics: [
        { id: 'git', name: 'Git: ветвление, merge, rebase, конфликты', level: 'basic', order: 1 },
        { id: 'linux', name: 'Linux: командная строка, файловая система, права', level: 'basic', order: 2 },
        { id: 'docker', name: 'Docker: образы, контейнеры, Dockerfile', level: 'medium', order: 3 },
        { id: 'docker_compose', name: 'Docker Compose: мульти-контейнерное окружение', level: 'medium', order: 4 },
        { id: 'ci_cd', name: 'CI/CD: GitHub Actions, GitLab CI, Jenkins', level: 'medium', order: 5 },
        { id: 'k8s', name: 'Kubernetes: поды, сервисы, деплойменты', level: 'advanced', order: 6 },
        { id: 'iac', name: 'IaC: Terraform, Ansible', level: 'advanced', order: 7 },
        { id: 'monitoring', name: 'Мониторинг: Prometheus, Grafana, ELK', level: 'advanced', order: 8 },
        { id: 'cloud', name: 'Облака: AWS / GCP / Azure (основы)', level: 'medium', order: 9 },
        { id: 'networking', name: 'Сети: DNS, HTTPS, reverse proxy, load balancer', level: 'medium', order: 10 },
      ]},
      { id: 'databases', name: 'Базы данных', topics: [
        { id: 'sql_basic', name: 'SQL: SELECT, JOIN, WHERE, GROUP BY', level: 'basic', order: 1 },
        { id: 'sql_advanced', name: 'SQL: подзапросы, оконные функции, CTE', level: 'medium', order: 2 },
        { id: 'db_design', name: 'Проектирование: нормализация, ER-диаграммы', level: 'medium', order: 3 },
        { id: 'indexes', name: 'Индексы и оптимизация запросов', level: 'medium', order: 4 },
        { id: 'transactions', name: 'Транзакции: ACID, уровни изоляции', level: 'advanced', order: 5 },
        { id: 'nosql', name: 'NoSQL: MongoDB, Redis, ключ-значение', level: 'medium', order: 6 },
        { id: 'replication', name: 'Репликация и шардирование', level: 'advanced', order: 7 },
        { id: 'backup', name: 'Резервное копирование и восстановление', level: 'basic', order: 8 },
        { id: 'migration', name: 'Миграции схем и версионирование БД', level: 'medium', order: 9 },
        { id: 'security_db', name: 'Безопасность: SQL-инъекции, привилегии, шифрование', level: 'advanced', order: 10 },
      ]},
      { id: 'qa', name: 'QA и тестирование', topics: [
        { id: 'testing_theory', name: 'Теория тестирования: виды, уровни, пирамида', level: 'basic', order: 1 },
        { id: 'test_cases', name: 'Тест-кейсы и чек-листы', level: 'basic', order: 2 },
        { id: 'unit_tests', name: 'Unit-тестирование: Jest, Mocha, pytest', level: 'medium', order: 3 },
        { id: 'integration', name: 'Интеграционное тестирование', level: 'medium', order: 4 },
        { id: 'e2e', name: 'E2E тестирование: Cypress, Selenium, Playwright', level: 'advanced', order: 5 },
        { id: 'api_testing', name: 'API тестирование: Postman, REST Assured', level: 'medium', order: 6 },
        { id: 'performance', name: 'Нагрузочное тестирование: JMeter, k6', level: 'advanced', order: 7 },
        { id: 'tdd_bdd', name: 'TDD и BDD методологии', level: 'advanced', order: 8 },
        { id: 'ci_testing', name: 'Тесты в CI/CD пайплайне', level: 'medium', order: 9 },
        { id: 'test_automation', name: 'Автоматизация: фреймворки, Page Object, отчёты', level: 'advanced', order: 10 },
      ]},
    ],
  },
];
