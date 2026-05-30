import os
import psycopg2
import psycopg2.extras
from dotenv import load_dotenv
import schedule
import time
import logging
from datetime import datetime

# Setup Logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - [INFO] - %(message)s')
load_dotenv()

def get_db_connection():
    return psycopg2.connect(os.getenv("DATABASE_URL"))

def run_personal_metrics_etl():
    logging.info("Starting personal metrics ETL...")
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    try:
        #  Calculate actual overdue tasks using due_date instead of invalid status
        query = """
            SELECT user_id, created_at::date as metric_date,
                   COUNT(*) FILTER (WHERE status = 'Completed') as tasks_completed,
                   COUNT(*) as tasks_created,
                   COUNT(*) FILTER (WHERE status != 'Completed' AND due_date < CURRENT_DATE) as overdue_tasks
            FROM tasks WHERE workspace_id IS NULL
            GROUP BY user_id, metric_date;
        """
        cursor.execute(query)
        rows = cursor.fetchall()
        if not rows: return 0

        transformed_data = [(r['user_id'], r['metric_date'], r['tasks_completed'], r['tasks_created'], r['overdue_tasks'], 
                            (r['tasks_completed']/r['tasks_created']*100 if r['tasks_created'] > 0 else 0), 85) for r in rows]

        upsert_query = """
            INSERT INTO user_daily_metrics (user_id, metric_date, tasks_completed, tasks_created, overdue_tasks, completion_rate, productivity_score)
            VALUES %s ON CONFLICT (user_id, metric_date) DO UPDATE SET 
            tasks_completed = EXCLUDED.tasks_completed, tasks_created = EXCLUDED.tasks_created, overdue_tasks = EXCLUDED.overdue_tasks, 
            completion_rate = EXCLUDED.completion_rate, productivity_score = EXCLUDED.productivity_score, updated_at = NOW();
        """
        psycopg2.extras.execute_values(cursor, upsert_query, transformed_data)
        conn.commit()
        return len(rows)
    finally: 
        cursor.close()
        conn.close()

def run_workspace_metrics_etl():
    logging.info("Starting workspace metrics ETL...")
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    try:
        # Added accurate overdue logic and COUNT(DISTINCT user_id) for active members
        query = """
            SELECT workspace_id, created_at::date as metric_date,
                   COUNT(*) FILTER (WHERE status = 'Completed') as completed_tasks,
                   COUNT(*) as total_tasks,
                   COUNT(*) FILTER (WHERE status != 'Completed' AND due_date < CURRENT_DATE) as overdue_tasks,
                   COUNT(DISTINCT user_id) as active_members
            FROM tasks WHERE workspace_id IS NOT NULL
            GROUP BY workspace_id, metric_date;
        """
        cursor.execute(query)
        rows = cursor.fetchall()
        if not rows: return 0

        transformed_data = []
        for r in rows:
            # Dynamically calculate health score based on missed deadlines
            overdue_pct = (r['overdue_tasks'] / r['total_tasks'] * 100) if r['total_tasks'] > 0 else 0
            health_score = max(0, 100 - int(overdue_pct * 1.5)) # Heavy penalty for overdue tasks
            
            transformed_data.append((
                r['workspace_id'], r['metric_date'], r['completed_tasks'], r['total_tasks'], 
                r['overdue_tasks'], r['active_members'], health_score
            ))

        upsert_query = """
            INSERT INTO workspace_daily_metrics (workspace_id, metric_date, completed_tasks, total_tasks, overdue_tasks, active_members, workspace_health_score)
            VALUES %s ON CONFLICT (workspace_id, metric_date) DO UPDATE SET 
            completed_tasks = EXCLUDED.completed_tasks, total_tasks = EXCLUDED.total_tasks, 
            overdue_tasks = EXCLUDED.overdue_tasks, active_members = EXCLUDED.active_members,
            workspace_health_score = EXCLUDED.workspace_health_score, updated_at = NOW();
        """
        psycopg2.extras.execute_values(cursor, upsert_query, transformed_data)
        conn.commit()
        logging.info("Workspace metrics successfully processed.")
        return len(rows)
    finally: 
        cursor.close()
        conn.close()

def run_all_pipelines():
    try:
        p_rows = run_personal_metrics_etl()
        w_rows = run_workspace_metrics_etl()
        logging.info(f"Pipeline cycle complete. Processed {p_rows + w_rows} metrics rows.")
    except Exception as e:
        logging.error(f"Pipeline cycle failed: {e}")

if __name__ == "__main__":
    logging.info("Initializing Analytics Service...")
    run_all_pipelines()
    schedule.every(2).minutes.do(run_all_pipelines)
    while True:
        schedule.run_pending()
        time.sleep(1)