/**
 * AI Data Migrator — Example library
 * Add your own SQL_EXAMPLES or SCHEMA_EXAMPLES entries here.
 */

/* ─────────────────────────────────────────────
   SQL → PySpark examples
   Each key maps to a raw SQL string.
───────────────────────────────────────────── */
const SQL_EXAMPLES = {

  window: `-- Sales ranking with running totals and lag comparison
-- Demonstrates: RANK(), SUM() OVER, LAG() with PARTITION BY
SELECT
  s.region,
  s.salesperson_id,
  s.sale_date,
  s.amount,
  RANK() OVER (
    PARTITION BY s.region
    ORDER BY s.amount DESC
  ) AS rank_in_region,
  SUM(s.amount) OVER (
    PARTITION BY s.region
    ORDER BY s.sale_date
    ROWS UNBOUNDED PRECEDING
  ) AS running_total,
  LAG(s.amount, 1, 0) OVER (
    PARTITION BY s.salesperson_id
    ORDER BY s.sale_date
  ) AS prev_sale
FROM sales s
WHERE s.sale_date BETWEEN '2023-01-01' AND '2023-12-31';`,

  cte: `-- Customer lifetime value with tier classification
-- Demonstrates: CTEs, LEFT JOIN, GROUP BY, CASE WHEN
WITH customer_orders AS (
  SELECT
    c.customer_id,
    c.customer_name,
    c.signup_date,
    COUNT(o.order_id)   AS total_orders,
    SUM(o.amount)       AS total_spent
  FROM customers c
  LEFT JOIN orders o
    ON c.customer_id = o.customer_id
  WHERE o.status IN ('completed', 'shipped')
  GROUP BY
    c.customer_id,
    c.customer_name,
    c.signup_date
),
tier_labels AS (
  SELECT *,
    CASE
      WHEN total_spent >= 10000 THEN 'Platinum'
      WHEN total_spent >= 5000  THEN 'Gold'
      WHEN total_spent >= 1000  THEN 'Silver'
      ELSE 'Bronze'
    END AS tier
  FROM customer_orders
)
SELECT * FROM tier_labels
ORDER BY total_spent DESC;`,

  pivot: `-- Monthly revenue pivot by product category
-- Demonstrates: Subquery, CASE WHEN pivot pattern, DATE_FORMAT
SELECT
  year_month,
  SUM(CASE WHEN category = 'Electronics' THEN revenue ELSE 0 END) AS electronics,
  SUM(CASE WHEN category = 'Apparel'     THEN revenue ELSE 0 END) AS apparel,
  SUM(CASE WHEN category = 'Home'        THEN revenue ELSE 0 END) AS home,
  SUM(CASE WHEN category = 'Sports'      THEN revenue ELSE 0 END) AS sports,
  SUM(revenue)                                                      AS total
FROM (
  SELECT
    DATE_FORMAT(sale_date, '%Y-%m') AS year_month,
    category,
    SUM(amount)                     AS revenue
  FROM sales
  GROUP BY year_month, category
) pivoted
GROUP BY year_month
ORDER BY year_month;`,

  incremental: `-- Incremental / upsert load pattern
-- Demonstrates: LEFT JOIN anti-pattern for new records, INSERT INTO
INSERT INTO silver.fact_transactions
SELECT
  t.transaction_id,
  t.account_id,
  t.amount,
  t.txn_type,
  t.txn_date,
  CURRENT_TIMESTAMP AS load_ts
FROM bronze.raw_transactions t
LEFT JOIN silver.fact_transactions ft
  ON t.transaction_id = ft.transaction_id
WHERE ft.transaction_id IS NULL
   OR t.updated_at > ft.load_ts;`,

  nested: `-- High-value customers above regional average
-- Demonstrates: Nested subquery, window AVG, HAVING equivalent via WHERE
SELECT customer_id, customer_name, region, total_revenue
FROM (
  SELECT
    c.customer_id,
    c.customer_name,
    c.region,
    SUM(o.amount)                          AS total_revenue,
    AVG(SUM(o.amount)) OVER (
      PARTITION BY c.region
    )                                      AS avg_regional_revenue
  FROM customers c
  JOIN orders o ON c.customer_id = o.customer_id
  GROUP BY c.customer_id, c.customer_name, c.region
) ranked
WHERE total_revenue > avg_regional_revenue * 1.5
ORDER BY total_revenue DESC;`,

  scd2: `-- Slowly Changing Dimension Type 2 merge
-- Demonstrates: MERGE statement, effective dating, surrogate keys
MERGE INTO dim_customer AS target
USING (
  SELECT
    s.customer_id,
    s.customer_name,
    s.email,
    s.address,
    s.updated_at
  FROM stg_customer s
) AS source
ON target.customer_id = source.customer_id
  AND target.is_current = 1
WHEN MATCHED AND (
  target.customer_name <> source.customer_name OR
  target.email         <> source.email         OR
  target.address       <> source.address
) THEN UPDATE SET
  target.is_current  = 0,
  target.end_date    = source.updated_at
WHEN NOT MATCHED THEN INSERT (
  customer_id, customer_name, email, address,
  start_date, end_date, is_current
) VALUES (
  source.customer_id, source.customer_name, source.email, source.address,
  source.updated_at, NULL, 1
);`
};


/* ─────────────────────────────────────────────
   Schema mapping examples
   Each key has { src, tgt } DDL strings.
───────────────────────────────────────────── */
const SCHEMA_EXAMPLES = {

  crm: {
    src: `CUST_ID         NUMBER(10)
CUST_NM         VARCHAR2(100)
DOB             DATE
ACCT_BAL        DECIMAL(15,2)
CREAT_DT        TIMESTAMP
STATUS_CD       CHAR(1)
LAST_UPD        DATE
PHONE_NO        VARCHAR2(20)
EMAIL_ADDR      VARCHAR2(200)
CNTRY_CD        CHAR(2)`,
    tgt: `customer_id     BIGINT
customer_name   STRING
date_of_birth   DATE
account_balance DOUBLE
created_at      TIMESTAMP
is_active       BOOLEAN
last_updated    TIMESTAMP
phone_number    STRING
email_address   STRING
country_code    STRING`
  },

  finance: {
    src: `TXN_ID          VARCHAR(36)
ACCT_NUM        NUMBER(12)
TXN_DT          DATE
TXN_AMT         DECIMAL(18,4)
CCY_CD          CHAR(3)
DR_CR_IND       CHAR(1)
TXN_TYP_CD      VARCHAR(10)
BRNCH_CD        NUMBER(5)
PRCS_DT         TIMESTAMP
CRTD_BY         VARCHAR(50)`,
    tgt: `transaction_id   STRING
account_number   BIGINT
transaction_date DATE
amount           DECIMAL(18,4)
currency         STRING
direction        STRING
transaction_type STRING
branch_code      INT
processed_at     TIMESTAMP
created_by       STRING`
  },

  iot: {
    src: `DEV_ID          VARCHAR(64)
TS              BIGINT
RDNG_VAL        FLOAT
RDNG_UNIT       VARCHAR(10)
LAT             DECIMAL(9,6)
LNG             DECIMAL(9,6)
BATT_LVL        TINYINT
SNSR_TYP        VARCHAR(20)
FW_VER          VARCHAR(20)`,
    tgt: `device_id        STRING
event_timestamp  TIMESTAMP
reading_value    DOUBLE
unit             STRING
latitude         DOUBLE
longitude        DOUBLE
battery_pct      INT
sensor_type      STRING
firmware_version STRING`
  },

  ecommerce: {
    src: `ORD_ID          NUMBER(12)
CUST_REF        VARCHAR(30)
ORD_DT          DATE
SHIP_DT         DATE
TOT_AMT         DECIMAL(12,2)
DISC_AMT        DECIMAL(10,2)
TAX_AMT         DECIMAL(10,2)
SHIP_ADDR1      VARCHAR(100)
SHIP_CITY       VARCHAR(50)
SHIP_CTRY       CHAR(2)
ORD_STAT        VARCHAR(20)
PYMNT_MTHD      VARCHAR(30)`,
    tgt: `order_id         BIGINT
customer_ref     STRING
order_date       DATE
shipped_date     DATE
total_amount     DOUBLE
discount_amount  DOUBLE
tax_amount       DOUBLE
shipping_address STRING
shipping_city    STRING
shipping_country STRING
order_status     STRING
payment_method   STRING`
  }
};
