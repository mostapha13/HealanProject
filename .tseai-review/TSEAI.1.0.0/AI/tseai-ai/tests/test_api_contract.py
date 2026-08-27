import asyncio

import httpx

from app.main import app


def request(method: str, path: str, **kwargs) -> httpx.Response:
    async def execute() -> httpx.Response:
        transport = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
            return await client.request(method, path, **kwargs)

    return asyncio.run(execute())


def test_health_contract():
    response = request("GET", "/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_chat_plan_contract():
    response = request("POST", "/chat/plan", json={"question": "قیمت خودرو چنده؟"})
    assert response.status_code == 200
    assert response.json()["planner"] == "deterministic-allowlist-v1"


def test_validation_is_bounded_and_does_not_echo_input():
    secret = "SENSITIVE-" + "x" * 5000
    response = request("POST", "/chat/plan", json={"question": secret})
    assert response.status_code == 422
    assert response.json()["code"] == "validation_error"
    assert secret not in response.text


def test_unlisted_http_method_is_rejected():
    response = request("TRACE", "/health")
    assert response.status_code == 405


def test_untrusted_host_is_rejected():
    response = request("GET", "/health", headers={"Host": "attacker.example"})
    assert response.status_code == 400


def test_invalid_json_has_safe_bounded_error():
    response = request(
        "POST",
        "/chat/plan",
        content=b'{"question":',
        headers={"Content-Type": "application/json"},
    )
    assert response.status_code == 400
    assert response.json() == {
        "code": "invalid_json",
        "detail": "Request body must be valid JSON.",
    }


def test_batch_retrieval_contract_rejects_unbounded_queries_before_execution():
    response = request(
        "POST",
        "/knowledge/retrieve-batch",
        json={"queries": [f"query {index}" for index in range(9)]},
    )
    assert response.status_code == 422
    assert response.json()["code"] == "validation_error"
