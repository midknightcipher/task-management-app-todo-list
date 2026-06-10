import os
import psycopg2
import psycopg2.extras
import requests
from dotenv import load_dotenv
import logging
from datetime import datetime
import time

logging.basicConfig(level=logging.INFO, format='%(asctime)s - [INFO] - %(message)s')
load_dotenv()


def get_db_connection():
    return psycopg2.connect(
        os.getenv("DATABASE_URL"),
        connect_timeout=15
    )



def run_all_pipelines():
    start_time = time.time()
    logging.info("Starting hybrid OLAP ETL pipeline (3-day lookback)...")

    try:
        conn = get_db_connection()
        conn.autocommit = False
        cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    except Exception as e:
        logging.error(f"Failed to connect to DB: {e}")
        return False

    try:
        # ── 1. Acquire advisory lock (prevents concurrent runs) ──────────────
        cursor.execute("SELECT pg_try_advisory_lock(12345);")
        locked = cursor.fetchone()[0]
        if not locked:
            logging.info("Another ETL process is currently running. Exiting cleanly.")
            conn.close()
            return True

        # ── 2. user_daily_metrics (Personal Tasks) ───────────────────────────
        #
        # Key correctness decisions:
        #   - tasks_completed  anchored to completed_at::date  (not created_at)
        #   - tasks_created    anchored to created_at::date
        #   - overdue_tasks    evaluated at CURRENT_DATE (point-in-time snapshot)
        #   - completion_rate  guarded against division-by-zero
        #   - productivity_score = completed*10 + created*2  (no hardcoding)
        #   - 3-day lookback via generate_series(0, 2) keeps history stable;
        #     only today and the two prior days are ever re-computed
        #
        user_query = """
            WITH target_dates AS (
                SELECT (CURRENT_DATE - i)::date AS metric_date
                FROM generate_series(0, 2) i
            ),
            created_stats AS (
                SELECT
                    t.user_id,
                    t.created_at::date AS metric_date,
                    COUNT(*)           AS tasks_created
                FROM tasks t
                JOIN target_dates d ON t.created_at::date = d.metric_date
                WHERE t.workspace_id IS NULL
                GROUP BY t.user_id, t.created_at::date
            ),
            completed_stats AS (
                SELECT
                    t.user_id,
                    t.completed_at::date AS metric_date,
                    COUNT(*)             AS tasks_completed
                FROM tasks t
                JOIN target_dates d ON t.completed_at::date = d.metric_date
                WHERE t.workspace_id IS NULL
                  AND t.status       = 'Completed'
                  AND t.completed_at IS NOT NULL
                GROUP BY t.user_id, t.completed_at::date
            ),
            overdue_stats AS (
                SELECT
                    t.user_id,
                    d.metric_date,
                    COUNT(*) AS overdue_tasks
                FROM tasks t
                CROSS JOIN target_dates d
                WHERE t.workspace_id IS NULL
                  AND t.status       != 'Completed'
                  AND t.due_date     IS NOT NULL
                  AND t.due_date      < CURRENT_DATE
                GROUP BY t.user_id, d.metric_date
            ),
            combined AS (
                SELECT
                    COALESCE(cr.user_id, co.user_id, ov.user_id) AS user_id,
                    COALESCE(cr.metric_date, co.metric_date, ov.metric_date) AS metric_date,
                    COALESCE(cr.tasks_created,   0) AS tasks_created,
                    COALESCE(co.tasks_completed, 0) AS tasks_completed,
                    COALESCE(ov.overdue_tasks,   0) AS overdue_tasks
                FROM created_stats   cr
                FULL OUTER JOIN completed_stats co
                    ON cr.user_id    = co.user_id
                   AND cr.metric_date = co.metric_date
                FULL OUTER JOIN overdue_stats ov
                    ON COALESCE(cr.user_id, co.user_id) = ov.user_id
                   AND COALESCE(cr.metric_date, co.metric_date) = ov.metric_date
            )
            SELECT
                user_id,
                metric_date,
                tasks_created,
                tasks_completed,
                overdue_tasks,
                CASE
                    WHEN tasks_created = 0 THEN 0.00
                    ELSE ROUND((tasks_completed::numeric / tasks_created) * 100, 2)
                END AS completion_rate,
                (tasks_completed * 10 + tasks_created * 2) AS productivity_score
            FROM combined;
        """
        cursor.execute(user_query)
        user_rows = cursor.fetchall()

        if user_rows:
            psycopg2.extras.execute_values(
                cursor,
                """
                INSERT INTO user_daily_metrics
                    (user_id, metric_date, tasks_created, tasks_completed,
                     overdue_tasks, completion_rate, productivity_score, updated_at)
                VALUES %s
                ON CONFLICT (user_id, metric_date) DO UPDATE SET
                    tasks_created     = EXCLUDED.tasks_created,
                    tasks_completed   = EXCLUDED.tasks_completed,
                    overdue_tasks     = EXCLUDED.overdue_tasks,
                    completion_rate   = EXCLUDED.completion_rate,
                    productivity_score = EXCLUDED.productivity_score,
                    updated_at        = CURRENT_TIMESTAMP;
                """,
                [
                    (
                        r['user_id'],
                        r['metric_date'],
                        r['tasks_created'],
                        r['completed_tasks'],
                        r['overdue_tasks'],
                        r['completion_rate'],
                        r['productivity_score'],
                        datetime.utcnow(),
                    )
                    for r in user_rows
                ]
            )
            logging.info(f"Upserted {len(user_rows)} rows into user_daily_metrics.")
        else:
            logging.info("No user rows to upsert for this lookback window.")

        # ── 3. workspace_daily_metrics (Workspace Tasks) ─────────────────────
        ws_query = """
            WITH target_dates AS (
                SELECT (CURRENT_DATE - i)::date AS metric_date
                FROM generate_series(0, 2) i
            ),
            created_stats AS (
                SELECT
                    t.workspace_id,
                    t.created_at::date AS metric_date,
                    COUNT(*)           AS tasks_created
                FROM tasks t
                JOIN target_dates d ON t.created_at::date = d.metric_date
                WHERE t.workspace_id IS NOT NULL
                GROUP BY t.workspace_id, t.created_at::date
            ),
            completed_stats AS (
                SELECT
                    t.workspace_id,
                    t.completed_at::date AS metric_date,
                    COUNT(*)             AS tasks_completed
                FROM tasks t
                JOIN target_dates d ON t.completed_at::date = d.metric_date
                WHERE t.workspace_id  IS NOT NULL
                  AND t.status        = 'Completed'
                  AND t.completed_at  IS NOT NULL
                GROUP BY t.workspace_id, t.completed_at::date
            ),
            overdue_stats AS (
                SELECT
                    t.workspace_id,
                    d.metric_date,
                    COUNT(*) AS overdue_tasks
                FROM tasks t
                CROSS JOIN target_dates d
                WHERE t.workspace_id IS NOT NULL
                  AND t.status       != 'Completed'
                  AND t.due_date     IS NOT NULL
                  AND t.due_date      < CURRENT_DATE
                GROUP BY t.workspace_id, d.metric_date
            ),
            members_stats AS (
                SELECT
                    workspace_id,
                    COUNT(DISTINCT user_id) AS active_members
                FROM workspace_members
                GROUP BY workspace_id
            ),
            combined AS (
                SELECT
                    COALESCE(cr.workspace_id, co.workspace_id, ov.workspace_id) AS workspace_id,
                    COALESCE(cr.metric_date, co.metric_date, ov.metric_date)    AS metric_date,
                    COALESCE(cr.tasks_created,   0) AS total_tasks,
                    COALESCE(co.tasks_completed, 0) AS completed_tasks,
                    COALESCE(ov.overdue_tasks,   0) AS overdue_tasks
                FROM created_stats   cr
                FULL OUTER JOIN completed_stats co
                    ON cr.workspace_id  = co.workspace_id
                   AND cr.metric_date   = co.metric_date
                FULL OUTER JOIN overdue_stats ov
                    ON COALESCE(cr.workspace_id, co.workspace_id) = ov.workspace_id
                   AND COALESCE(cr.metric_date,  co.metric_date)  = ov.metric_date
            )
            SELECT
                c.workspace_id,
                c.metric_date,
                c.total_tasks,
                c.completed_tasks,
                c.overdue_tasks,
                COALESCE(m.active_members, 0) AS active_members,
                CASE
                    WHEN c.total_tasks = 0 THEN 100
                    ELSE GREATEST(
                        0,
                        100 - ROUND(
                            (c.overdue_tasks::numeric / c.total_tasks) * 100 * 1.5
                        )::int
                    )
                END AS workspace_health_score
            FROM combined c
            LEFT JOIN members_stats m ON c.workspace_id = m.workspace_id;
        """
        cursor.execute(ws_query)
        ws_rows = cursor.fetchall()

        if ws_rows:
            psycopg2.extras.execute_values(
                cursor,
                """
                INSERT INTO workspace_daily_metrics
                    (workspace_id, metric_date, total_tasks, completed_tasks,
                     active_members, workspace_health_score, updated_at)
                VALUES %s
                ON CONFLICT (workspace_id, metric_date) DO UPDATE SET
                    total_tasks           = EXCLUDED.total_tasks,
                    completed_tasks       = EXCLUDED.completed_tasks,
                    active_members        = EXCLUDED.active_members,
                    workspace_health_score = EXCLUDED.workspace_health_score,
                    updated_at            = CURRENT_TIMESTAMP;
                """,
                [
                    (
                        r['workspace_id'],
                        r['metric_date'],
                        r['total_tasks'],
                        r['tasks_completed'],  # maps to completed_tasks column
                        r['active_members'],
                        r['workspace_health_score'],
                        datetime.utcnow(),
                    )
                    for r in ws_rows
                ]
            )
            logging.info(f"Upserted {len(ws_rows)} rows into workspace_daily_metrics.")
        else:
            logging.info("No workspace rows to upsert for this lookback window.")

        # ── 4. Commit both upserts atomically ────────────────────────────────
        conn.commit()
        duration = round(time.time() - start_time, 2)
        logging.info(
            f"Pipeline complete in {duration}s. "
            f"User rows: {len(user_rows)}, Workspace rows: {len(ws_rows)}."
        )

        # ── 5. Healthchecks.io dead-man ping ─────────────────────────────────
        ping_url = os.getenv("HEALTHCHECKS_PING_URL")
        if ping_url:
            try:
                requests.get(ping_url, timeout=10)
                logging.info("Healthchecks.io ping sent successfully.")
            except Exception as e:
                logging.warning(f"Failed to ping Healthchecks.io: {e}")

        return True

    except Exception as e:
        conn.rollback()
        logging.error(f"ETL pipeline failed: {e}")
        return False

    finally:
        try:
            cursor.execute("SELECT pg_advisory_unlock(12345);")
            cursor.close()
            conn.close()
        except Exception:
            pass