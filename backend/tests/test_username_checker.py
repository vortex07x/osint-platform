import pytest
import respx
import httpx
from scrapers.social.username_checker import (
    check_username_across_platforms,
    LOW_CONFIDENCE_PLATFORMS,
)


@pytest.mark.asyncio
@respx.mock
async def test_github_found():
    respx.get("https://api.github.com/users/octocat").mock(
        return_value=httpx.Response(200, json={})
    )
    respx.get("https://gitlab.com/api/v4/users?username=octocat").mock(
        return_value=httpx.Response(200, json=[])
    )
    for platform, template in LOW_CONFIDENCE_PLATFORMS.items():
        respx.get(template.format(username="octocat")).mock(
            return_value=httpx.Response(404, text="page not found")
        )

    results = await check_username_across_platforms("octocat")
    github_result = next(r for r in results if r["platform"] == "github")

    assert github_result["exists"] is True
    assert github_result["confidence"] == "high"


@pytest.mark.asyncio
@respx.mock
async def test_github_not_found():
    respx.get("https://api.github.com/users/someRandomUnusedName999").mock(
        return_value=httpx.Response(404)
    )
    respx.get("https://gitlab.com/api/v4/users?username=someRandomUnusedName999").mock(
        return_value=httpx.Response(200, json=[])
    )
    for platform, template in LOW_CONFIDENCE_PLATFORMS.items():
        respx.get(template.format(username="someRandomUnusedName999")).mock(
            return_value=httpx.Response(404, text="page not found")
        )

    results = await check_username_across_platforms("someRandomUnusedName999")
    github_result = next(r for r in results if r["platform"] == "github")

    assert github_result["exists"] is False


@pytest.mark.asyncio
@respx.mock
async def test_gitlab_exists_when_array_non_empty():
    respx.get("https://api.github.com/users/testuser").mock(return_value=httpx.Response(404))
    respx.get("https://gitlab.com/api/v4/users?username=testuser").mock(
        return_value=httpx.Response(200, json=[{"username": "testuser"}])
    )
    for platform, template in LOW_CONFIDENCE_PLATFORMS.items():
        respx.get(template.format(username="testuser")).mock(
            return_value=httpx.Response(404, text="page not found")
        )

    results = await check_username_across_platforms("testuser")
    gitlab_result = next(r for r in results if r["platform"] == "gitlab")

    assert gitlab_result["exists"] is True


@pytest.mark.asyncio
@respx.mock
async def test_low_confidence_platform_detects_not_found_phrase():
    respx.get("https://api.github.com/users/testuser").mock(return_value=httpx.Response(404))
    respx.get("https://gitlab.com/api/v4/users?username=testuser").mock(
        return_value=httpx.Response(200, json=[])
    )
    for platform, template in LOW_CONFIDENCE_PLATFORMS.items():
        respx.get(template.format(username="testuser")).mock(
            return_value=httpx.Response(200, text="Sorry, this page isn't available")
        )

    results = await check_username_across_platforms("testuser")
    low_conf_results = [r for r in results if r["confidence"] == "low"]

    assert all(r["exists"] is False for r in low_conf_results)


@pytest.mark.asyncio
@respx.mock
async def test_returns_result_for_every_platform_checked():
    respx.get("https://api.github.com/users/testuser").mock(return_value=httpx.Response(404))
    respx.get("https://gitlab.com/api/v4/users?username=testuser").mock(
        return_value=httpx.Response(200, json=[])
    )
    for platform, template in LOW_CONFIDENCE_PLATFORMS.items():
        respx.get(template.format(username="testuser")).mock(
            return_value=httpx.Response(404, text="page not found")
        )

    results = await check_username_across_platforms("testuser")
    # github + gitlab + all low-confidence platforms
    assert len(results) == 2 + len(LOW_CONFIDENCE_PLATFORMS)