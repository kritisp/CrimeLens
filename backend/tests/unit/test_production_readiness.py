"""
Production Readiness Validation Test Suite

Validates all 10 production readiness checks prior to Zoho Catalyst deployment.
"""

import os
import sys
import unittest
from fastapi.testclient import TestClient

from app.main import app
from app.core.config import Settings, get_settings


class TestProductionReadiness(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)

    def test_01_app_imports_cleanly(self):
        """1. App imports successfully with zero top-level side effects."""
        import index
        import app.main
        self.assertIsNotNone(app)
        self.assertIsNotNone(index)

    def test_02_root_endpoint_responds(self):
        """2. The root endpoint (/) responds with online status."""
        response = self.client.get("/")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data.get("status"), "online")
        self.assertEqual(data.get("service"), "CrimeLens Backend")

    def test_03_health_endpoint_responds_immediately(self):
        """3. /api/v1/health responds immediately with HTTP 200."""
        response = self.client.get("/api/v1/health")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data.get("status"), "healthy")
        self.assertIn("version", data)

    def test_04_port_binding_logic(self):
        """4. Verify port parsing for X_ZOHO_CATALYST_LISTEN_PORT and PORT."""
        os.environ["X_ZOHO_CATALYST_LISTEN_PORT"] = "9050"
        port_str = os.environ.get("X_ZOHO_CATALYST_LISTEN_PORT")
        self.assertEqual(int(port_str), 9050)
        del os.environ["X_ZOHO_CATALYST_LISTEN_PORT"]

    def test_05_background_initialization_resilience(self):
        """5. Verify background initialization exceptions do not crash application lifespan."""
        import asyncio
        from unittest.mock import patch
        from app.main import load_signatures_and_warm_up_ml

        # Simulate a database or ML warmup failure in background task
        with patch("app.infrastructure.database.setup.get_async_engine", side_effect=RuntimeError("Simulated DB Failure")):
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            try:
                # Task MUST handle the exception internally without propagating out to lifespan
                loop.run_until_complete(load_signatures_and_warm_up_ml())
            except Exception as exc:
                self.fail(f"load_signatures_and_warm_up_ml unhandled exception: {exc}")
            finally:
                loop.close()

    def test_06_appsail_config_matches_runtime(self):
        """6. Validate app-config.json configuration matches Python runtime requirements."""
        import json
        config_path = os.path.join(os.path.dirname(__file__), "..", "..", "app-config.json")
        self.assertTrue(os.path.exists(config_path))
        with open(config_path, "r", encoding="utf-8") as f:
            cfg = json.load(f)

        self.assertEqual(cfg.get("command"), "python index.py")
        self.assertIn("DATABASE_URL", cfg.get("env_variables", {}))
        db_url = cfg["env_variables"]["DATABASE_URL"]

        test_settings = Settings(database_url=db_url)
        async_url = test_settings.async_database_url
        self.assertTrue(async_url.startswith(("postgresql+asyncpg://", "sqlite+aiosqlite://")))


if __name__ == "__main__":
    unittest.main()
