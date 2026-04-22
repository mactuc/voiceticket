import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, AsyncMock, MagicMock
import sys

# Mock whisper before importing main
sys.modules['whisper'] = MagicMock()

from main import app
import os
import db
import auth
import auth

client = TestClient(app)

# A fake current user ID
FAKE_USER_ID = "fake-user-123"

# Dependency override
async def override_get_current_user():
    return FAKE_USER_ID

app.dependency_overrides[auth.get_current_user] = override_get_current_user

@pytest.fixture(autouse=True)
def mock_env_vars():
    with patch.dict(os.environ, {"JIRA_CLIENT_ID": "test_client_id", "JIRA_CLIENT_SECRET": "test_secret"}):
        yield

def test_get_jira_auth_url():
    response = client.get("/jira/auth-url")
    assert response.status_code == 200
    data = response.json()
    assert "url" in data
    assert "test_client_id" in data["url"]
    assert "auth.atlassian.com/authorize" in data["url"]
    assert "redirect_uri=http://localhost:3000/settings" in data["url"]

@patch("httpx.AsyncClient.post", new_callable=AsyncMock)
@patch("httpx.AsyncClient.get", new_callable=AsyncMock)
@patch("db.update_user_jira_tokens")
def test_jira_callback(mock_update_tokens, mock_get, mock_post):
    # Mock token exchange
    mock_post_res = MagicMock()
    mock_post_res.status_code = 200
    mock_post_res.json.return_value = {"access_token": "mock_access", "refresh_token": "mock_refresh"}
    mock_post.return_value = mock_post_res
    
    # Mock GET requests: [1] accessible-resources, [2] /me
    mock_get_res_1 = MagicMock()
    mock_get_res_1.status_code = 200
    mock_get_res_1.json.return_value = [{"id": "mock_cloud_id"}]
    
    mock_get_res_2 = MagicMock()
    mock_get_res_2.status_code = 200
    mock_get_res_2.json.return_value = {"account_id": "mock_account_id"}
    
    mock_get.side_effect = [mock_get_res_1, mock_get_res_2]
    
    response = client.post("/jira/callback", json={"code": "testcode", "redirectUri": "http://localhost:3000/settings"})
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["cloud_id"] == "mock_cloud_id"
    
    # Verify DB update was called
    mock_update_tokens.assert_called_once_with(FAKE_USER_ID, "mock_access", "mock_refresh", "mock_cloud_id", "mock_account_id")

@patch("httpx.AsyncClient.post", new_callable=AsyncMock)
@patch("db.get_user_by_id")
def test_jira_sync(mock_get_user, mock_post):
    mock_get_user.return_value = {
        "id": FAKE_USER_ID,
        "jira_access_token": "fake_access",
        "jira_cloud_id": "fake_cloud"
    }
    
    # Mock Jira Issue Creation Response
    mock_issue_res = MagicMock()
    mock_issue_res.status_code = 201
    mock_issue_res.json.return_value = {"id": "1000", "key": "VT-1000"}
    mock_post.return_value = mock_issue_res
    
    tickets = [
        {
            "summary": "Epic 1",
            "description": "Desc",
            "subtasks": [
                {"summary": "Sub 1", "description": "Sub Desc"}
            ]
        }
    ]
    
    response = client.post("/jira/sync", json={"tickets": tickets, "projectKey": "VT"})
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["synced_count"] == 2  # 1 Epic + 1 Subtask
    
    assert mock_post.call_count == 2
