import io
from PIL import Image
from ai_engine.vision.exif_extractor import (
    extract_exif_from_image_bytes,
    extract_entities_from_exif,
    _convert_to_degrees,
)


def _make_plain_image_bytes():
    """A valid image with no EXIF data at all."""
    img = Image.new("RGB", (10, 10), color="red")
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    return buf.getvalue()


def test_corrupt_bytes_do_not_raise():
    result = extract_exif_from_image_bytes(b"this is not an image")
    assert "error" in result
    assert result["gps"] is None


def test_empty_bytes_do_not_raise():
    result = extract_exif_from_image_bytes(b"")
    assert "error" in result


def test_image_with_no_exif_returns_defaults():
    result = extract_exif_from_image_bytes(_make_plain_image_bytes())
    assert result["gps"] is None
    assert result["camera_make"] is None
    assert "error" not in result


def test_convert_to_degrees_valid_value():
    # 37 degrees, 46 minutes, 29.64 seconds ≈ 37.7749
    degrees = _convert_to_degrees((37, 46, 29.64))
    assert round(degrees, 4) == 37.7749


def test_convert_to_degrees_handles_nan():
    nan = float("nan")
    assert _convert_to_degrees((nan, 0, 0)) is None


def test_convert_to_degrees_handles_bad_input():
    assert _convert_to_degrees("not a tuple") is None
    assert _convert_to_degrees(None) is None


def test_extract_entities_from_empty_exif_returns_empty_list():
    empty_result = {
        "gps": None, "camera_make": None, "camera_model": None,
        "datetime_original": None, "software": None, "raw_exif": {}
    }
    assert extract_entities_from_exif(empty_result) == []


def test_extract_entities_from_full_exif_result():
    full_result = {
        "gps": {"lat": 37.7749, "lon": -122.4194},
        "camera_make": "Apple",
        "camera_model": "iPhone 15",
        "datetime_original": "2026:01:01 12:00:00",
        "software": "Photoshop",
        "raw_exif": {}
    }
    entities = extract_entities_from_exif(full_result)
    entity_types = {e["entity_type"] for e in entities}
    assert entity_types == {"gps_location", "device", "photo_timestamp", "editing_software"}

    gps_entity = next(e for e in entities if e["entity_type"] == "gps_location")
    assert gps_entity["value"] == "37.7749, -122.4194"
    assert gps_entity["confidence_score"] == 1.0