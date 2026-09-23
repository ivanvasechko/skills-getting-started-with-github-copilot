def test_get_activities_returns_known_activity(client):
    # Arrange
    activity_name = "Chess Club"

    # Act
    response = client.get("/activities")

    # Assert
    assert response.status_code == 200
    body = response.json()
    assert activity_name in body
    activity = body[activity_name]
    assert set(["description", "schedule", "max_participants", "participants"]).issubset(activity.keys())
