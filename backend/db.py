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
            picture TEXT
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
        INSERT INTO users (id, email, password_hash, auth_provider, name, picture)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', (
        user_data['id'],
        user_data['email'],
        user_data.get('password_hash'),
        user_data['auth_provider'],
        user_data.get('name'),
        user_data.get('picture')
    ))
    conn.commit()
    conn.close()
    return user_data

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
