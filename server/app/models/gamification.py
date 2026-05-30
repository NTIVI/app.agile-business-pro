# Модели геймификации: Agile.Coins, магазин, KPI, тестирование
import uuid
import enum
from datetime import datetime
from decimal import Decimal
from sqlalchemy import String, Text, DateTime, Integer, Boolean, ForeignKey, Enum as SAEnum, UniqueConstraint, Numeric
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


# ===================== COIN TRANSACTIONS =====================

class CoinTransactionType(str, enum.Enum):
    TOPIC_COMPLETE = "topic_complete"      # Прошёл подтему
    TEST_PASS = "test_pass"                # Сдал тест
    TASK_APPROVED = "task_approved"         # Задание принято
    ADMIN_GRANT = "admin_grant"            # Начислено администратором
    SHOP_PURCHASE = "shop_purchase"        # Покупка в магазине (расход)
    DAILY_LOGIN = "daily_login"            # Ежедневный бонус за вход


def _coin_transaction_enum_values(_: type[CoinTransactionType]) -> list[str]:
    return [
        CoinTransactionType.TOPIC_COMPLETE.value,
        CoinTransactionType.TEST_PASS.value,
        CoinTransactionType.TASK_APPROVED.value,
        CoinTransactionType.ADMIN_GRANT.value,
        CoinTransactionType.SHOP_PURCHASE.value,
        CoinTransactionType.DAILY_LOGIN.value,
    ]


class CoinTransaction(Base):
    """Транзакция Agile.Coins"""
    __tablename__ = "coin_transactions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)  # + начисление, - списание
    tx_type: Mapped[CoinTransactionType] = mapped_column(
        SAEnum(CoinTransactionType, values_callable=_coin_transaction_enum_values),
        nullable=False,
    )
    reason: Mapped[str] = mapped_column(Text, nullable=True)  # Пояснение (обязательно для admin_grant)
    reference_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=True)  # ID связанной сущности (тема, покупка)
    granted_by: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)  # Кто начислил (для admin_grant)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    user = relationship("User", foreign_keys=[user_id])
    granter = relationship("User", foreign_keys=[granted_by])


# ===================== SHOP =====================

class ShopItem(Base):
    """Товар в магазине Agile.Coins"""
    __tablename__ = "shop_items"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=True)
    price: Mapped[int] = mapped_column(Integer, nullable=False)
    icon: Mapped[str] = mapped_column(String(100), nullable=True)  # lucide icon name
    category: Mapped[str] = mapped_column(String(50), default="status")  # status, badge, perk
    image_url: Mapped[str] = mapped_column(String(500), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    stock: Mapped[int | None] = mapped_column(Integer, nullable=True)  # None = безлимитно
    rarity: Mapped[str] = mapped_column(String(20), default="common")  # common, rare, epic, legendary
    level_required: Mapped[int] = mapped_column(Integer, default=1)
    is_featured: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    purchases: Mapped[list["ShopPurchase"]] = relationship(back_populates="item", cascade="all, delete-orphan")


class ShopPurchase(Base):
    """Покупка товара из магазина"""
    __tablename__ = "shop_purchases"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    item_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("shop_items.id", ondelete="CASCADE"), nullable=False)
    price_paid: Mapped[int] = mapped_column(Integer, nullable=False)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    user = relationship("User", foreign_keys=[user_id])
    item: Mapped["ShopItem"] = relationship(back_populates="purchases")


class UserShopEquip(Base):
    """Экипированные виртуальные товары пользователя по категориям."""
    __tablename__ = "user_shop_equips"
    __table_args__ = (UniqueConstraint("user_id", "category", name="uq_user_shop_category_equip"),)

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    purchase_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("shop_purchases.id", ondelete="CASCADE"), nullable=False)
    category: Mapped[str] = mapped_column(String(50), nullable=False)
    equipped_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    user = relationship("User", foreign_keys=[user_id])
    purchase = relationship("ShopPurchase", foreign_keys=[purchase_id])


# ===================== TEST RESULTS =====================

class TopicTestResult(Base):
    """Результат тестирования по подтеме"""
    __tablename__ = "topic_test_results"
    __table_args__ = (UniqueConstraint("topic_id", "user_id", name="uq_topic_user_test"),)

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    topic_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("training_topics.id", ondelete="CASCADE"), nullable=False)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    score: Mapped[int] = mapped_column(Integer, nullable=False)      # Правильных ответов
    total: Mapped[int] = mapped_column(Integer, nullable=False)      # Всего вопросов
    passed: Mapped[bool] = mapped_column(Boolean, nullable=False)    # >= 70% = passed
    attempt: Mapped[int] = mapped_column(Integer, default=1)         # Номер попытки

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    topic = relationship("TrainingTopic", foreign_keys=[topic_id])
    user = relationship("User", foreign_keys=[user_id])


# ===================== SESSION TRACKING (KPI) =====================

class UserSession(Base):
    """Сессия пользователя на платформе (для KPI)"""
    __tablename__ = "user_sessions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    started_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    ended_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    duration_minutes: Mapped[int] = mapped_column(Integer, default=0)

    user = relationship("User", foreign_keys=[user_id])


# ===================== NEW KPI MODELS =====================

class KPIDrop(Base):
    """Падения KPI сотрудников (для KPI1 / Manager KPI1 & KPI2)"""
    __tablename__ = "kpi_drops"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    employee_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    kpi_type: Mapped[str] = mapped_column(String(10), nullable=False) # e.g., 'KPI1', 'KPI2'
    drop_value: Mapped[Decimal] = mapped_column(Numeric(5, 2), nullable=False)
    drop_date: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    resolved: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    notification_sent: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    employee = relationship("User", foreign_keys=[employee_id])


class PerformanceReview(Base):
    """Разборы падений KPI, проведенные руководителями (Manager KPI2)"""
    __tablename__ = "performance_reviews"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    drop_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("kpi_drops.id", ondelete="SET NULL"), nullable=True)
    manager_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    review_date: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    kpi_type: Mapped[str] = mapped_column(String(10), nullable=False)
    reason: Mapped[str] = mapped_column(String(100), nullable=False)
    action: Mapped[str] = mapped_column(String(100), nullable=False)
    comment: Mapped[str | None] = mapped_column(Text, nullable=True)
    reaction_days: Mapped[Decimal | None] = mapped_column(Numeric(4, 1), nullable=True)
    is_overtime: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    drop = relationship("KPIDrop", foreign_keys=[drop_id])
    manager = relationship("User", foreign_keys=[manager_id])


class ManagerKPI2Cache(Base):
    """Текущее кэшированное значение KPI2 для руководителей"""
    __tablename__ = "manager_kpi2_cache"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    manager_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    month: Mapped[datetime] = mapped_column(DateTime, nullable=False) # первое число текущего месяца
    current_kpi2: Mapped[Decimal | None] = mapped_column(Numeric(4, 1), nullable=True)
    total_days: Mapped[Decimal] = mapped_column(Numeric(8, 1), default=0.0, nullable=False)
    reviews_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    manager = relationship("User", foreign_keys=[manager_id])


class KPIManagerHistory(Base):
    """История финальных значений KPI для руководителей на конец месяца"""
    __tablename__ = "kpi_manager_history"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    manager_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    month: Mapped[datetime] = mapped_column(DateTime, nullable=False) # первое число месяца
    kpi2_value: Mapped[Decimal | None] = mapped_column(Numeric(4, 1), nullable=True)
    reviews_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    total_days: Mapped[Decimal] = mapped_column(Numeric(8, 1), default=0.0, nullable=False)
    kpi4_points: Mapped[Decimal | None] = mapped_column(Numeric(6, 2), nullable=True) # для KPI4
    kpi7_value: Mapped[Decimal | None] = mapped_column(Numeric(4, 1), nullable=True) # для KPI7
    calculated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    manager = relationship("User", foreign_keys=[manager_id])


class ManagerOvertimeCounter(Base):
    """Счетчик сверхурочных разборов для начисления процентов в KPI6 руководителей"""
    __tablename__ = "manager_overtime_counters"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    manager_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    month: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    order_number: Mapped[int] = mapped_column(Integer, nullable=False)
    review_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("performance_reviews.id", ondelete="CASCADE"), nullable=False)
    percent_awarded: Mapped[int] = mapped_column(Integer, nullable=False)
    awarded_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    manager = relationship("User", foreign_keys=[manager_id])
    review = relationship("PerformanceReview", foreign_keys=[review_id])


class AttentivenessLog(Base):
    """Универсальный лог попыток сохранения для контроля внимательности (KPI8 и должностной KPI4)"""
    __tablename__ = "attentiveness_log"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    action_type: Mapped[str] = mapped_column(String(50), nullable=False) # e.g., 'kpi_review', 'idea_decision'
    action_id: Mapped[str] = mapped_column(String(50), nullable=False) # UUID или иной ID сущности как строка
    attempt_number: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    success: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_overtime: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    penalty_points: Mapped[Decimal] = mapped_column(Numeric(3, 1), default=0.0, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("User", foreign_keys=[user_id])


class ManagerKPI4Points(Base):
    """Накопленные баллы внимательности для KPI4 начальника"""
    __tablename__ = "manager_kpi4_points"
    __table_args__ = (UniqueConstraint("manager_id", "month", name="uq_manager_kpi4_month"),)

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    manager_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    month: Mapped[datetime] = mapped_column(DateTime, nullable=False) # первое число месяца
    total_points: Mapped[Decimal] = mapped_column(Numeric(6, 2), default=0.0, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    manager = relationship("User", foreign_keys=[manager_id])


class ActionTypesWithMandatoryFields(Base):
    """Администрируемый справочник типов действий с обязательными полями для внимательности"""
    __tablename__ = "action_types_with_mandatory_fields"

    code: Mapped[str] = mapped_column(String(50), primary_key=True) # e.g., 'kpi_review'
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    mandatory_fields: Mapped[str] = mapped_column(Text, nullable=False) # JSON-строка, например '["reason", "action"]'
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)


class ManagerResponsibility(Base):
    """Баллы ответственности руководителя для KPI3"""
    __tablename__ = "manager_responsibility"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    manager_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    date: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    event_type: Mapped[str] = mapped_column(String(50), nullable=False)
    points: Mapped[Decimal] = mapped_column(Numeric(4, 1), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    source_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)

    manager = relationship("User", foreign_keys=[manager_id])


class EmployeeKPI8Points(Base):
    """Баллы внимательности для общего KPI8 сотрудников"""
    __tablename__ = "employee_kpi8_points"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    employee_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    month: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    points: Mapped[Decimal] = mapped_column(Numeric(4, 1), nullable=False)
    source_action_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("attentiveness_log.id", ondelete="SET NULL"), nullable=True)

    employee = relationship("User", foreign_keys=[employee_id])
    source_action = relationship("AttentivenessLog", foreign_keys=[source_action_id])


class KPI7ManagerPoints(Base):
    """Баллы контроля отдела KPI7 для руководителя"""
    __tablename__ = "kpi7_manager_points"
    __table_args__ = (UniqueConstraint("manager_id", "month", name="uq_manager_kpi7_month"),)

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    manager_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    month: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    total_points: Mapped[Decimal] = mapped_column(Numeric(6, 2), default=0.0, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    manager = relationship("User", foreign_keys=[manager_id])


class KPI7ReviewImpact(Base):
    """Баллы за разборы (положительные/отрицательные) для KPI7"""
    __tablename__ = "kpi7_review_impact"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    manager_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    review_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("performance_reviews.id", ondelete="CASCADE"), nullable=False)
    points: Mapped[Decimal] = mapped_column(Numeric(4, 1), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    manager = relationship("User", foreign_keys=[manager_id])
    review = relationship("PerformanceReview", foreign_keys=[review_id])
