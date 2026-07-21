import os
import sys

# Auto-reexecute using virtualenv python if run from system python
# This protects against host environments that override PATH or ignore Dockerfile ENV directives.
venv_python = "/opt/venv/bin/python"
if os.path.exists(venv_python) and sys.executable != venv_python:
    print(f"Re-executing run.py using virtual environment python: {venv_python}")
    os.execv(venv_python, [venv_python] + sys.argv)

# Dynamic inclusion of vendor/library folder for Zoho Catalyst managed runtimes.
# In Catalyst, we install dependencies locally into the 'lib' folder at deploy time.
lib_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "lib")
if os.path.exists(lib_path):
    sys.path.insert(0, lib_path)

# Ensure the current directory is also in python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

import uvicorn

if __name__ == "__main__":
    # Zoho Catalyst AppSail injects the port into the X_ZOHO_CATALYST_LISTEN_PORT environment variable.
    # We read this variable dynamically at startup to ensure the server binds to the correct port.
    port_str = os.environ.get("X_ZOHO_CATALYST_LISTEN_PORT")
    if not port_str:
        port_str = os.environ.get("PORT", "8000")
        
    try:
        port = int(port_str)
    except ValueError:
        port = 8000

    print(f"Starting CrimeLens AI Backend on host 0.0.0.0, port {port}...")
    uvicorn.run("app.main:app", host="0.0.0.0", port=port)
