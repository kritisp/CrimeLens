"""
CrimeLens AI Backend Application Package

Registers monorepo shared directory paths in sys.path to facilitate cross-package imports.
"""

from __future__ import annotations

import sys
from pathlib import Path

# Add monorepo root directory to sys.path
# File structure: crimelens/backend/app/__init__.py -> Parents[2] is crimelens/
root_dir = str(Path(__file__).resolve().parents[2])
if root_dir not in sys.path:
    sys.path.append(root_dir)
