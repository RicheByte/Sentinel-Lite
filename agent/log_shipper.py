import time
import json
import requests
import sys
import os
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler
from datetime import datetime, timezone

# Configuration
API_URL = os.getenv("API_URL", "http://localhost:8000/api/ingest")
LOG_FILE = "access.log"  # The file to monitor

class LogHandler(FileSystemEventHandler):
    def __init__(self, filename):
        self.filename = filename
        # Open the file and seek to the end to avoid reading old logs
        try:
            self.file = open(filename, 'r')
            self.file.seek(0, os.SEEK_END)
        except FileNotFoundError:
            print(f"Error: Log file '{filename}' not found. Waiting for it to be created...")
            self.file = None

    def on_modified(self, event):
        if event.src_path.endswith(self.filename):
            self.process_new_lines()

    def process_new_lines(self):
        if self.file is None:
            try:
                self.file = open(self.filename, 'r')
            except FileNotFoundError:
                return

        lines = self.file.readlines()
        for line in lines:
            if line.strip():
                self.send_log(line.strip())

    def send_log(self, message):
        payload = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "source_ip": "127.0.0.1", # Placeholder, in real scenario parse from log
            "message": message
        }
        
        # Basic parsing logic (customizable)
        # Example log format: 192.168.1.10 - - [10/Oct/2000:13:55:36 -0700] "GET /apache_pb.gif HTTP/1.0" 200 2326
        try:
            parts = message.split(' ')
            if len(parts) > 0:
                # Very naive IP extraction for demo purposes
                # In a real scenario, use regex or a proper parser
                potential_ip = parts[0]
                if potential_ip.count('.') == 3:
                    payload["source_ip"] = potential_ip
        except Exception:
            pass

        try:
            response = requests.post(API_URL, json=payload)
            if response.status_code == 200:
                print(f"[+] Sent: {message[:50]}...")
            else:
                print(f"[-] Failed to send: {response.status_code} - {response.text}")
        except requests.exceptions.RequestException as e:
            print(f"[-] Connection Error: {e}")

def main():
    # Create dummy log file if it doesn't exist
    if not os.path.exists(LOG_FILE):
        with open(LOG_FILE, 'w') as f:
            f.write("")

    event_handler = LogHandler(LOG_FILE)
    observer = Observer()
    # Watch the directory containing the log file
    log_dir = os.path.dirname(os.path.abspath(LOG_FILE)) or "."
    observer.schedule(event_handler, path=log_dir, recursive=False)
    observer.start()

    print(f"[*] Agent started. Watching {LOG_FILE}...")
    print(f"[*] Target API: {API_URL}")

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        observer.stop()
    observer.join()

if __name__ == "__main__":
    main()
