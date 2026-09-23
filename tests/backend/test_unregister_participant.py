from concurrent.futures import ThreadPoolExecutor
from threading import Barrier

from fastapi.testclient import TestClient

from src.app import activities, app


def test_unregister_participant_from_activity(client):
    # Arrange
    activity_name = "Chess Club"
    email = "michael@mergington.edu"

    # Act
    response = client.delete(f"/activities/{activity_name}/participants/{email}")

    # Assert
    assert response.status_code == 200
    assert response.json()["message"] == f"Unregistered {email} from {activity_name}"
    assert email not in activities[activity_name]["participants"]


def test_unregister_missing_participant_returns_404(client):
    # Arrange
    activity_name = "Soccer Club"
    email = "nonexistent@mergington.edu"

    # Act
    response = client.delete(f"/activities/{activity_name}/participants/{email}")

    # Assert
    assert response.status_code == 404
    assert response.json()["detail"] == "Participant not found in this activity"


def test_unregister_unknown_activity_returns_404(client):
    # Arrange
    activity_name = "Nonexistent Club"
    email = "someone@mergington.edu"

    # Act
    response = client.delete(f"/activities/{activity_name}/participants/{email}")

    # Assert
    assert response.status_code == 404
    assert response.json()["detail"] == "Activity not found"


def test_unregister_participant_is_atomic():
    # Arrange
    activity_name = "Chess Club"
    email = "michael@mergington.edu"
    barrier = Barrier(2)

    def unregister():
        with TestClient(app) as test_client:
            barrier.wait()
            return test_client.delete(f"/activities/{activity_name}/participants/{email}")

    # Act
    with ThreadPoolExecutor(max_workers=2) as executor:
        responses = [future.result() for future in [executor.submit(unregister), executor.submit(unregister)]]

    # Assert
    assert sorted(response.status_code for response in responses) == [200, 404]
    assert email not in activities[activity_name]["participants"]
