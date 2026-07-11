from ai_engine.risk.risk_engine import analyze_entities


def test_empty_entities_returns_empty_list():
    assert analyze_entities([]) == []


def test_known_entity_type_produces_correct_exposure():
    entities = [{"id": "1", "entity_type": "email", "value": "test@example.com"}]
    result = analyze_entities(entities)

    assert len(result) == 1
    exposure = result[0]
    assert exposure["title"] == "Public email address found"
    assert exposure["severity"] == "medium"
    assert exposure["risk_score"] == 40
    assert exposure["affected_entities"] == ["1"]
    assert "test@example.com" in exposure["description"]


def test_unknown_entity_type_falls_back_to_default_profile():
    entities = [{"id": "1", "entity_type": "totally_made_up_type", "value": "xyz"}]
    result = analyze_entities(entities)

    assert len(result) == 1
    assert result[0]["title"] == "Miscellaneous data point found"
    assert result[0]["risk_score"] == 10


def test_correlation_bonus_not_triggered_below_three_entities():
    entities = [
        {"id": "1", "entity_type": "email", "value": "a@b.com"},
        {"id": "2", "entity_type": "website", "value": "https://x.com"},
    ]
    result = analyze_entities(entities)
    titles = [r["title"] for r in result]
    assert "Multiple data points correlate to a single identity" not in titles
    assert len(result) == 2  # one exposure per entity, no bonus


def test_correlation_bonus_triggers_at_three_entities():
    entities = [
        {"id": "1", "entity_type": "email", "value": "a@b.com"},
        {"id": "2", "entity_type": "website", "value": "https://x.com"},
        {"id": "3", "entity_type": "full_name", "value": "Jane Doe"},
    ]
    result = analyze_entities(entities)
    titles = [r["title"] for r in result]
    assert "Multiple data points correlate to a single identity" in titles

    bonus = next(r for r in result if r["title"] == "Multiple data points correlate to a single identity")
    assert bonus["risk_score"] == 30 + (3 * 2)  # 36
    assert set(bonus["affected_entities"]) == {"1", "2", "3"}


def test_high_severity_entity_types_score_correctly():
    entities = [{"id": "1", "entity_type": "gps_location", "value": "37.0, -122.0"}]
    result = analyze_entities(entities)
    assert result[0]["severity"] == "high"
    assert result[0]["risk_score"] == 70