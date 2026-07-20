import os
import sys
import uvicorn

# Ensure the current directory is in python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

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
