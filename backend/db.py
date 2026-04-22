import sqlite3
import json
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "sessions.db")

def init_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            email TEXT UNIQUE,
            password_hash TEXT,
            auth_provider TEXT,
            name TEXT,
            picture TEXT,
            jira_access_token TEXT,
            jira_refresh_token TEXT,
            jira_cloud_id TEXT
        )
    ''')
    cursor.execute('''
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
    ''')
    conn.commit()
    
    # Run migrations to add new columns if they don't exist
    try:
        cursor.execute("ALTER TABLE users ADD COLUMN jira_access_token TEXT")
        cursor.execute("ALTER TABLE users ADD COLUMN jira_refresh_token TEXT")
        cursor.execute("ALTER TABLE users ADD COLUMN jira_cloud_id TEXT")
        conn.commit()
    except sqlite3.OperationalError:
        # Columns likely already exist
        pass
        
    conn.close()

def get_user_by_email(email: str):
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM users WHERE email = ?', (email,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None

def get_user_by_id(user_id: str):
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM users WHERE id = ?', (user_id,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None

def create_user(user_data: dict):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO users (id, email, password_hash, auth_provider, name, picture, jira_access_token, jira_refresh_token, jira_cloud_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        user_data['id'],
        user_data['email'],
        user_data.get('password_hash'),
        user_data['auth_provider'],
        user_data.get('name'),
        user_data.get('picture'),
        user_data.get('jira_access_token'),
        user_data.get('jira_refresh_token'),
        user_data.get('jira_cloud_id')
    ))
    conn.commit()
    conn.close()
    return user_data

def update_user_jira_tokens(user_id: str, access_token: str, refresh_token: str, cloud_id: str):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('''
        UPDATE users 
        SET jira_access_token = ?, jira_refresh_token = ?, jira_cloud_id = ?
        WHERE id = ?
    ''', (access_token, refresh_token, cloud_id, user_id))
    conn.commit()
    conn.close()

def clear_user_jira_tokens(user_id: str):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('''
        UPDATE users 
        SET jira_access_token = NULL, jira_refresh_token = NULL, jira_cloud_id = NULL
        WHERE id = ?
    ''', (user_id,))
    conn.commit()
    conn.close()

def get_sessions(user_id: str):
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM sessions WHERE user_id = ? ORDER BY timestamp DESC', (user_id,))
    rows = cursor.fetchall()
    
    sessions = []
    for row in rows:
        session = dict(row)
        if session.get('tickets'):
            try:
                session['tickets'] = json.loads(session['tickets'])
            except:
                session['tickets'] = []
        sessions.append(session)
    conn.close()
    return sessions

def add_session(session_data: dict, user_id: str):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('''
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
    ))
    conn.commit()
    conn.close()
    return session_data

def clear_sessions(user_id: str):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('DELETE FROM sessions WHERE user_id = ?', (user_id,))
    conn.commit()
    conn.close()

# Initialize DB when this module is imported
init_db()
