import pytest
import respx
import httpx
from ai_engine.geo.geocoder import geocode_location, NOMINATIM_URL


@pytest.mark.asyncio
async def test_empty_string_returns_none():
    assert await geocode_location("") is None
    assert await geocode_location("   ") is None


@pytest.mark.asyncio
@respx.mock
async def test_successful_geocode_returns_coordinates():
    respx.get(NOMINATIM_URL).mock(
        return_value=httpx.Response(200, json=[{"lat": "37.7749", "lon": "-122.4194"}])
    )
    result = await geocode_location("San Francisco")
    assert result == {"lat": 37.7749, "lon": -122.4194}


@pytest.mark.asyncio
@respx.mock
async def test_no_results_returns_none():
    respx.get(NOMINATIM_URL).mock(return_value=httpx.Response(200, json=[]))
    result = await geocode_location("Nonexistent Place XYZ123")
    assert result is None


@pytest.mark.asyncio
@respx.mock
async def test_http_error_returns_none_not_exception():
    respx.get(NOMINATIM_URL).mock(return_value=httpx.Response(500))
    result = await geocode_location("San Francisco")
    assert result is None  # confirms the try/except actually swallows failures