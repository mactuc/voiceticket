import sqlite3
import json
import os

DATABASE_URL = os.getenv("DATABASE_URL")
DB_PATH = os.path.join(os.path.dirname(__file__), "sessions.db")

def get_connection():
    if DATABASE_URL:
        import psycopg2
        import psycopg2.extras
        conn = psycopg2.connect(DATABASE_URL)
        # Use DictCursor to mimic sqlite3.Row
        return conn, conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    else:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        return conn, conn.cursor()

def execute_query(query, params=(), fetch=None, commit=False):
    conn, cursor = get_connection()
    try:
        # Translate ? to %s for PostgreSQL
        if DATABASE_URL:
            query = query.replace("?", "%s")
            
        cursor.execute(query, params)
        
        if commit:
            conn.commit()
            
        if fetch == 'one':
            row = cursor.fetchone()
            return dict(row) if row else None
        elif fetch == 'all':
            rows = cursor.fetchall()
            return [dict(row) for row in rows]
            
        return None
    finally:
        conn.close()

def init_db():
    # Execute table creations separately since psycopg2 doesn't like multiple statements in one execute easily without explicit transaction blocks
    execute_query('''
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            email TEXT UNIQUE,
            password_hash TEXT,
            auth_provider TEXT,
            name TEXT,
            picture TEXT,
            jira_access_token TEXT,
            jira_refresh_token TEXT,
            jira_cloud_id TEXT,
            jira_account_id TEXT
        )
    ''', commit=True)
    
    execute_query('''
        CREATE TABLE IF NOT EXISTS sessions (
            id TEXT PRIMARY KEY,
            title TEXT,
            timestamp TEXT,
            durationMs INTEGER,
            ticketCount INTEGER,
            tickets TEXT,
            transcription TEXT,
            user_id TEXT,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    ''', commit=True)
    
    # SQLite ALTER TABLE migrations (PostgreSQL handles these differently, but since it's a fresh DB, the CREATE TABLE already has them)
    if not DATABASE_URL:
        try:
            execute_query("ALTER TABLE users ADD COLUMN jira_access_token TEXT", commit=True)
            execute_query("ALTER TABLE users ADD COLUMN jira_refresh_token TEXT", commit=True)
            execute_query("ALTER TABLE users ADD COLUMN jira_cloud_id TEXT", commit=True)
        except sqlite3.OperationalError:
            pass
            
        try:
            execute_query("ALTER TABLE users ADD COLUMN jira_account_id TEXT", commit=True)
        except sqlite3.OperationalError:
            pass

def get_user_by_email(email: str):
    return execute_query('SELECT * FROM users WHERE email = ?', (email,), fetch='one')

def get_user_by_id(user_id: str):
    return execute_query('SELECT * FROM users WHERE id = ?', (user_id,), fetch='one')

def create_user(user_data: dict):
    execute_query('''
        INSERT INTO users (id, email, password_hash, auth_provider, name, picture, jira_access_token, jira_refresh_token, jira_cloud_id, jira_account_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        user_data['id'],
        user_data['email'],
        user_data.get('password_hash'),
        user_data['auth_provider'],
        user_data.get('name'),
        user_data.get('picture'),
        user_data.get('jira_access_token'),
        user_data.get('jira_refresh_token'),
        user_data.get('jira_cloud_id'),
        user_data.get('jira_account_id')
    ), commit=True)
    return user_data

def update_user_jira_tokens(user_id: str, access_token: str, refresh_token: str, cloud_id: str, account_id: str = None):
    if account_id:
        execute_query('''
            UPDATE users 
            SET jira_access_token = ?, jira_refresh_token = ?, jira_cloud_id = ?, jira_account_id = ?
            WHERE id = ?
        ''', (access_token, refresh_token, cloud_id, account_id, user_id), commit=True)
    else:
        execute_query('''
            UPDATE users 
            SET jira_access_token = ?, jira_refresh_token = ?, jira_cloud_id = ?
            WHERE id = ?
        ''', (access_token, refresh_token, cloud_id, user_id), commit=True)

def clear_user_jira_tokens(user_id: str):
    execute_query('''
        UPDATE users 
        SET jira_access_token = NULL, jira_refresh_token = NULL, jira_cloud_id = NULL, jira_account_id = NULL
        WHERE id = ?
    ''', (user_id,), commit=True)

def get_all_jira_account_ids():
    rows = execute_query('SELECT DISTINCT jira_account_id FROM users WHERE jira_account_id IS NOT NULL', fetch='all')
    return [row['jira_account_id'] for row in rows]

def get_sessions(user_id: str):
    rows = execute_query('SELECT * FROM sessions WHERE user_id = ? ORDER BY timestamp DESC', (user_id,), fetch='all')
    result = []
    for row in rows:
        row_dict = dict(row)
        # PostgreSQL lowercases column names, restore camelCase for frontend
        if 'durationms' in row_dict:
            row_dict['durationMs'] = row_dict.pop('durationms')
        if 'ticketcount' in row_dict:
            row_dict['ticketCount'] = row_dict.pop('ticketcount')
            
        if row_dict.get('tickets'):
            try:
                row_dict['tickets'] = json.loads(row_dict['tickets'])
            except:
                row_dict['tickets'] = []
        result.append(row_dict)
    return result

def add_session(session_data: dict, user_id: str):
    execute_query('''
        INSERT INTO sessions (id, title, timestamp, durationMs, ticketCount, tickets, transcription, user_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        session_data.get('id'),
        session_data.get('title'),
        session_data.get('timestamp'),
        session_data.get('durationMs', 0),
        session_data.get('ticketCount', 0),
        json.dumps(session_data.get('tickets', [])),
        session_data.get('transcription', ''),
        user_id
    ), commit=True)
    return session_data

def clear_sessions(user_id: str):
    execute_query('DELETE FROM sessions WHERE user_id = ?', (user_id,), commit=True)

# Initialize DB when this module is imported
init_db()
