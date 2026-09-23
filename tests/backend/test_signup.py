from concurrent.futures import ThreadPoolExecutor
from threading import Barrier

from fastapi.testclient import TestClient

from src.app import activities, app


def test_signup_adds_participant(client):
    # Arrange
    activity_name = "Soccer Club"
    email = "newstudent@mergington.edu"

    # Act
    response = client.post(f"/activities/{activity_name}/signup", params={"email": email})

    # Assert
    assert response.status_code == 200
    assert response.json()["message"] == f"Signed up {email} for {activity_name}"
    assert email in activities[activity_name]["participants"]


def test_signup_duplicate_participant_returns_400(client):
    # Arrange
    activity_name = "Chess Club"
    email = "michael@mergington.edu"

    # Act
    response = client.post(f"/activities/{activity_name}/signup", params={"email": email})

    # Assert
    assert response.status_code == 400
    assert response.json()["detail"] == "Student already signed up for this activity"


def test_signup_unknown_activity_returns_404(client):
    # Arrange
    activity_name = "Nonexistent Club"
    email = "someone@mergington.edu"

    # Act
    response = client.post(f"/activities/{activity_name}/signup", params={"email": email})

    # Assert
    assert response.status_code == 404
    assert response.json()["detail"] == "Activity not found"


def test_signup_duplicate_participant_is_atomic():
    # Arrange
    activity_name = "Soccer Club"
    email = "race@mergington.edu"
    barrier = Barrier(2)

    def signup():
        with TestClient(app) as test_client:
            barrier.wait()
            return test_client.post(f"/activities/{activity_name}/signup", params={"email": email})

    # Act
    with ThreadPoolExecutor(max_workers=2) as executor:
        responses = [future.result() for future in [executor.submit(signup), executor.submit(signup)]]

    # Assert
    assert sorted(response.status_code for response in responses) == [200, 400]
    assert activities[activity_name]["participants"].count(email) == 1
