"""
CrimeLens AI — API Inference Demonstration

Launches the FastAPI application in a background process, queries the /analyze
endpoint with a pre-seeded Case ID, prints the formatted JSON response, and
terminates cleanly.

Uses the python standard library (urllib.request) to remain 100% dependency-free.
"""

from __future__ import annotations

import json
import multiprocessing
import sys
import time
import urllib.request
import urllib.error
from pathlib import Path

# Dynamic path injection for imports
current_file = Path(__file__).resolve()
monorepo_root = current_file.parents[1]
backend_dir = monorepo_root / "backend"
sys.path.append(str(backend_dir))
sys.path.append(str(backend_dir / "app"))


def start_uvicorn_server() -> None:
    """Starts the FastAPI application via uvicorn wrapper."""
    import uvicorn
    import os
    os.chdir(str(backend_dir))
    uvicorn.run(
        "app.main:app",
        host="127.0.0.1",
        port=8089,
        log_level="warning",
    )


def main() -> None:
    print("=" * 80)
    print("CrimeLens AI — API Inference Demonstration")
    print("=" * 80)

    # 1. Start FastAPI server in a background process
    print("Launching FastAPI application in background process...")
    server_process = multiprocessing.Process(target=start_uvicorn_server)
    server_process.daemon = True
    server_process.start()

    # Wait for server startup
    time.sleep(3.0)

    url = "http://127.0.0.1:8089/api/v1/analysis/analyze"
    payload = {"case_id": 1000}

    print(f"\nSending POST request to: {url}")
    print(f"Request Payload         : {payload}")

    try:
        # Prepare request using urllib standard library
        data = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(
            url,
            data=data,
            headers={
                "Content-Type": "application/json",
                "User-Agent": "CrimeLensAPI-Demo/1.0"
            },
            method="POST"
        )

        with urllib.request.urlopen(req, timeout=5.0) as response:
            status_code = response.getcode()
            headers = response.info()
            body_text = response.read().decode("utf-8")
            
            print("\n" + "-" * 80)
            print(f"HTTP Response Code: {status_code}")
            print("Response Headers:")
            for header in ["X-Request-ID", "X-Process-Time", "Content-Type"]:
                val = headers.get(header)
                if val:
                    print(f"  - {header:<15}: {val}")
            print("-" * 80)

            if status_code == 200:
                parsed_json = json.loads(body_text)
                print("Response JSON Content:")
                print(json.dumps(parsed_json, indent=2))
            else:
                print(f"Error Response Body: {body_text}")

    except urllib.error.HTTPError as err:
        print(f"\nHTTP Error returned by server: {err.code} - {err.reason}")
        try:
            print(f"Error Body: {err.read().decode('utf-8')}")
        except Exception:
            pass
    except Exception as exc:
        print(f"\nFailed to communicate with FastAPI server: {str(exc)}")

    finally:
        print("\nTerminating background FastAPI server...")
        server_process.terminate()
        server_process.join()
        print("Server shutdown complete.")

    print("=" * 80)
    print("CrimeLens AI — API Inference Demonstration Complete!")
    print("=" * 80)


if __name__ == "__main__":
    multiprocessing.freeze_support()
    main()
