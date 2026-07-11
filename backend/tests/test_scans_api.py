def test_create_scan_returns_pending_scan(client):
    response = client.post("/scans/", json={
        "target_identifier": "octocat",
        "scan_type": "username",
        "config_json": {}
    })
    assert response.status_code == 200
    data = response.json()
    assert data["target_identifier"] == "octocat"
    assert data["scan_type"] == "username"
    assert data["status"] == "pending"
    assert data["progress"] == 0
    assert "id" in data


def test_list_scans_returns_created_scans(client):
    client.post("/scans/", json={"target_identifier": "a", "scan_type": "username"})
    client.post("/scans/", json={"target_identifier": "b", "scan_type": "username"})

    response = client.get("/scans/")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2
    identifiers = {s["target_identifier"] for s in data}
    assert identifiers == {"a", "b"}


def test_get_scan_by_id(client):
    create_res = client.post("/scans/", json={"target_identifier": "someone", "scan_type": "email"})
    scan_id = create_res.json()["id"]

    response = client.get(f"/scans/{scan_id}")
    assert response.status_code == 200
    assert response.json()["target_identifier"] == "someone"


def test_get_nonexistent_scan_returns_404(client):
    fake_id = "00000000-0000-0000-0000-000000000000"
    response = client.get(f"/scans/{fake_id}")
    assert response.status_code == 404


def test_full_report_returns_empty_lists_for_new_scan(client):
    create_res = client.post("/scans/", json={"target_identifier": "newtarget", "scan_type": "domain"})
    scan_id = create_res.json()["id"]

    response = client.get(f"/scans/{scan_id}/full-report")
    assert response.status_code == 200
    data = response.json()
    assert data["sources"] == []
    assert data["entities"] == []
    assert data["exposures"] == []


def test_monitoring_toggle_updates_scan(client):
    create_res = client.post("/scans/", json={"target_identifier": "monitor-me", "scan_type": "username"})
    scan_id = create_res.json()["id"]

    response = client.patch(f"/scans/{scan_id}/monitoring", json={
        "is_monitored": True,
        "scan_interval_hours": 12
    })
    assert response.status_code == 200
    data = response.json()
    assert data["is_monitored"] is True
    assert data["scan_interval_hours"] == 12


def test_image_scan_rejects_empty_file(client):
    """Regression test for the image scan resilience fix — an empty
    upload should fail cleanly with 400, not hang or 500."""
    create_res = client.post("/scans/", json={"target_identifier": "photo.jpg", "scan_type": "image"})
    scan_id = create_res.json()["id"]

    response = client.post(
        f"/scans/{scan_id}/scan-image",
        files={"file": ("empty.jpg", b"", "image/jpeg")}
    )
    assert response.status_code == 400


def test_scan_image_endpoint_marks_scan_failed_on_bad_upload(client):
    create_res = client.post("/scans/", json={"target_identifier": "photo2.jpg", "scan_type": "image"})
    scan_id = create_res.json()["id"]

    client.post(
        f"/scans/{scan_id}/scan-image",
        files={"file": ("empty.jpg", b"", "image/jpeg")}
    )

    scan_response = client.get(f"/scans/{scan_id}")
    assert scan_response.json()["status"] == "failed"