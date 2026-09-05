import json
import sys
import urllib.request
import urllib.error

# Target URL can be passed explicitly; otherwise use the FastAPI default.
BASE_URL = sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:8000/webhook/payment.failed"

def run_test(name: str, payload: dict, expected_status: str, expected_action: str):
    print(f"\n========================================================")
    print(f"🚀 RUNNING TEST: {name}")
    print(f"========================================================")
    try:
        data_bytes = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(
            BASE_URL,
            data=data_bytes,
            headers={"Content-Type": "application/json"}
        )
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            print("Response:\n" + json.dumps(data, indent=2))
            
            status = data.get("status")
            action = data.get("recovery_decision", {}).get("action") or data.get("action")
            
            if status == expected_status and (action == expected_action or expected_action is None):
                print(f"✅ PASSED: Expected status '{expected_status}' & action '{expected_action}' verified!")
            else:
                print(f"⚠️ RESULT CHECK: got status='{status}', action='{action}'")
    except Exception as e:
        print(f"❌ ERROR during request to {BASE_URL}: {e}")

if __name__ == "__main__":
    print(f"🎯 Testing RazorRecover AI Webhook Engine at: {BASE_URL}")

    # SCENARIO 1: Bank Downtime (HDFC UPI Outage -> Card Fallback + 5% Discount)
    run_test(
        name="SCENARIO 1: Bank Downtime (HDFC Outage)",
        payload={
            "event": "payment.failed",
            "payload": {
                "payment": {
                    "entity": {
                        "id": "pay_outage_001",
                        "order_id": "ord_outage_1001",
                        "bank": "HDFC",
                        "error_code": "GATEWAY_TIMEOUT",
                        "amount": 749900
                    }
                }
            }
        },
        expected_status="SUCCESS",
        expected_action="GENERATE_FALLBACK_LINK"
    )

    # SCENARIO 2: Double-Charge Protection (Order Already Paid -> Halt Recovery)
    run_test(
        name="SCENARIO 2: Double Payment Protection (Already Paid Order)",
        payload={
            "event": "payment.failed",
            "payload": {
                "payment": {
                    "entity": {
                        "id": "pay_late_002",
                        "order_id": "ord_already_completed_123",
                        "bank": "SBI",
                        "error_code": "BAD_BROWSER_CLOSED",
                        "amount": 320000
                    }
                }
            }
        },
        expected_status="HALTED",
        expected_action="HALT_ALREADY_PAID"
    )

    # SCENARIO 3: User Error / Insufficient Funds (0% discount, standard retry)
    run_test(
        name="SCENARIO 3: Insufficient Funds (0% Discount, Wait/Retry)",
        payload={
            "event": "payment.failed",
            "payload": {
                "payment": {
                    "entity": {
                        "id": "pay_funds_003",
                        "order_id": "ord_balance_888",
                        "bank": "ICICI",
                        "error_code": "BAD_REQUEST_INSUFFICIENT_FUNDS",
                        "amount": 1299900
                    }
                }
            }
        },
        expected_status="SUCCESS",
        expected_action="WAIT_RETRY"
    )
