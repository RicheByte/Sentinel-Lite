import time
import random
import os

LOG_FILE = "access.log"

def generate_brute_force():
    print(f"[*] Starting Brute Force Simulation on {LOG_FILE}...")
    
    ips = ["192.168.1.50", "10.0.0.5", "172.16.0.100"]
    target_ip = "192.168.1.50" # The attacker

    with open(LOG_FILE, "a") as f:
        # Normal traffic
        f.write(f"{datetime_now()} 192.168.1.10 User logged in successfully\n")
        f.flush()
        time.sleep(1)

        # Attack starts
        for i in range(10):
            log_entry = f"{datetime_now()} {target_ip} Failed password for user admin\n"
            f.write(log_entry)
            f.flush()
            print(f"[+] Wrote: {log_entry.strip()}")
            time.sleep(0.5)
        
        print("[*] Attack simulation complete.")

def datetime_now():
    from datetime import datetime
    return datetime.now().strftime("%Y-%m-%d %H:%M:%S")

if __name__ == "__main__":
    generate_brute_force()
