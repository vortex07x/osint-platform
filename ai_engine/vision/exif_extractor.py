"""
Extracts EXIF metadata from images, including GPS coordinates,
camera info, and timestamps — useful for geolocation and device fingerprinting.
"""

from PIL import Image
from PIL.ExifTags import TAGS, GPSTAGS
import io


def _convert_to_degrees(value):
    """Converts GPS coordinates stored as (degrees, minutes, seconds) to decimal degrees."""
    try:
        d, m, s = value
        degrees = float(d) + (float(m) / 60.0) + (float(s) / 3600.0)
        if degrees != degrees:  # NaN check (NaN is the only value that doesn't equal itself)
            return None
        return degrees
    except (ZeroDivisionError, ValueError, TypeError):
        return None


def extract_exif_from_image_bytes(image_bytes: bytes):
    """
    Takes raw image bytes, returns a dict of extracted metadata:
    - gps: {lat, lon} if available
    - camera_make, camera_model
    - datetime_original
    - software
    - raw_exif: all readable tags (for storage as source raw_data_json)
    """
    result = {
        "gps": None,
        "camera_make": None,
        "camera_model": None,
        "datetime_original": None,
        "software": None,
        "raw_exif": {}
    }

    try:
        image = Image.open(io.BytesIO(image_bytes))
        exif_data = image._getexif()

        if not exif_data:
            return result

        labeled_exif = {}
        gps_info = {}

        for tag_id, value in exif_data.items():
            tag_name = TAGS.get(tag_id, tag_id)

            if tag_name == "GPSInfo":
                for gps_tag_id, gps_value in value.items():
                    gps_tag_name = GPSTAGS.get(gps_tag_id, gps_tag_id)
                    gps_info[gps_tag_name] = gps_value
            else:
                # Only keep JSON-serializable simple values
                if isinstance(value, (str, int, float)):
                    labeled_exif[tag_name] = value

        result["raw_exif"] = labeled_exif
        result["camera_make"] = labeled_exif.get("Make")
        result["camera_model"] = labeled_exif.get("Model")
        result["datetime_original"] = labeled_exif.get("DateTimeOriginal") or labeled_exif.get("DateTime")
        result["software"] = labeled_exif.get("Software")

        if gps_info and "GPSLatitude" in gps_info and "GPSLongitude" in gps_info:
            lat = _convert_to_degrees(gps_info["GPSLatitude"])
            lon = _convert_to_degrees(gps_info["GPSLongitude"])

            if lat is not None and lon is not None:
                if gps_info.get("GPSLatitudeRef") == "S":
                    lat = -lat
                if gps_info.get("GPSLongitudeRef") == "W":
                    lon = -lon

                result["gps"] = {"lat": round(lat, 6), "lon": round(lon, 6)}

    except Exception as e:
        result["error"] = str(e)

    return result


def extract_entities_from_exif(exif_result: dict):
    """
    Given the output of extract_exif_from_image_bytes, returns a list of
    entity dicts ready to be stored (entity_type, value, confidence_score).
    """
    entities = []

    if exif_result.get("gps"):
        gps = exif_result["gps"]
        entities.append({
            "entity_type": "gps_location",
            "value": f"{gps['lat']}, {gps['lon']}",
            "confidence_score": 1.0
        })

    if exif_result.get("camera_make") or exif_result.get("camera_model"):
        device = f"{exif_result.get('camera_make', '')} {exif_result.get('camera_model', '')}".strip()
        if device:
            entities.append({
                "entity_type": "device",
                "value": device,
                "confidence_score": 0.9
            })

    if exif_result.get("datetime_original"):
        entities.append({
            "entity_type": "photo_timestamp",
            "value": exif_result["datetime_original"],
            "confidence_score": 0.95
        })

    if exif_result.get("software"):
        entities.append({
            "entity_type": "editing_software",
            "value": exif_result["software"],
            "confidence_score": 0.7
        })

    return entities