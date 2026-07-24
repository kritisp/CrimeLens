"""
Unit tests for database URL normalization, lightweight module imports, and lazy engine instantiation.
"""

import os
import sys
import importlib
import unittest

from app.core.config import Settings


class TestStartupAndURLNormalization(unittest.TestCase):

    def test_database_url_normalization_postgres_schemes(self):
        """Verify postgres:// and postgresql:// are correctly normalized into async and sync variants."""
        # Test 1: postgresql://
        s1 = Settings(database_url="postgresql://user:secret@localhost:5432/crimelens")
        self.assertEqual(s1.async_database_url, "postgresql+asyncpg://user:secret@localhost:5432/crimelens")
        self.assertEqual(s1.sync_database_url, "postgresql://user:secret@localhost:5432/crimelens")

        # Test 2: postgres:// (legacy Heroku / Catalyst scheme)
        s2 = Settings(database_url="postgres://user:secret@localhost:5432/crimelens")
        self.assertEqual(s2.async_database_url, "postgresql+asyncpg://user:secret@localhost:5432/crimelens")
        self.assertEqual(s2.sync_database_url, "postgresql://user:secret@localhost:5432/crimelens")

        # Test 3: postgresql+asyncpg://
        s3 = Settings(database_url="postgresql+asyncpg://user:secret@localhost:5432/crimelens")
        self.assertEqual(s3.async_database_url, "postgresql+asyncpg://user:secret@localhost:5432/crimelens")
        self.assertEqual(s3.sync_database_url, "postgresql://user:secret@localhost:5432/crimelens")

    def test_database_url_normalization_sqlite_schemes(self):
        """Verify sqlite:// and sqlite+aiosqlite:// are correctly normalized."""
        # Test 1: sqlite+aiosqlite://
        s1 = Settings(database_url="sqlite+aiosqlite:///./test.db")
        self.assertEqual(s1.async_database_url, "sqlite+aiosqlite:///./test.db")
        self.assertEqual(s1.sync_database_url, "sqlite:///./test.db")

        # Test 2: sqlite://
        s2 = Settings(database_url="sqlite:///./test.db")
        self.assertEqual(s2.async_database_url, "sqlite+aiosqlite:///./test.db")
        self.assertEqual(s2.sync_database_url, "sqlite:///./test.db")

    def test_import_main_does_not_instantiate_engines(self):
        """
        Verify that setting invalid or remote DATABASE_URLs and importing app.main
        does NOT crash or instantiate engines at import time.
        """
        import app.infrastructure.database.setup as async_setup
        import app.db.session as sync_session

        # Reset singletons
        async_setup._async_engine = None
        async_setup._async_session_factory = None
        sync_session._sync_engine = None
        sync_session._sync_session_factory = None

        os.environ["DATABASE_URL"] = "postgresql://user:pass@nonexistent:5432/db"

        # Import app.main
        if "app.main" in sys.modules:
            importlib.reload(sys.modules["app.main"])
        else:
            import app.main  # noqa

        # Assert engines were NOT created at import time
        self.assertIsNone(async_setup._async_engine)
        self.assertIsNone(sync_session._sync_engine)

    def test_lazy_engine_instantiation(self):
        """Verify engines are created lazily when get_async_engine() or get_sync_engine() is invoked."""
        import app.infrastructure.database.setup as async_setup
        import app.db.session as sync_session

        # Reset singletons
        async_setup._async_engine = None
        sync_session._sync_engine = None

        os.environ["DATABASE_URL"] = "sqlite+aiosqlite:///./test_lazy.db"
        from app.core.config import get_settings
        get_settings.cache_clear()

        async_eng = async_setup.get_async_engine()
        sync_eng = sync_session.get_sync_engine()

        self.assertIsNotNone(async_eng)
        self.assertIsNotNone(sync_eng)
        self.assertEqual(str(async_eng.url), "sqlite+aiosqlite:///./test_lazy.db")
        self.assertEqual(str(sync_eng.url), "sqlite:///./test_lazy.db")


if __name__ == "__main__":
    unittest.main()
