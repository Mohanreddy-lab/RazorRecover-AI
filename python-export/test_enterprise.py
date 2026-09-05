import requests
import json

BASE_URL = "http://127.0.0.1:8000"

def run_test(endpoint: str, payload: dict, title: str):
    print("=" * 60)
    print(f"🚀 TESTING: {title}")
    print("=" * 60)
    res = requests.post(f"{BASE_URL}{endpoint}", json=payload)
    print(json.dumps(res.json(), indent=2))
    print("\n")

if __name__ == "__main__":
    # Test 1: Self-Healing Revenue
    run_test(
        "/api/v1/heal-uncaptured",
        {
            "payment_id": "pay_auth_99182",
            "order_id": "ord_stuck_5501",
            "amount_inr": 45000.0,
            "order_fulfilled": True
        },
        "ENGINE 1: Authorized-but-Uncaptured Revenue Recovery"
    )

    # Test 2: B2B Enterprise Dunning
    run_test(
        "/api/v1/dunning/b2b-mandate",
        {
            "subscription_id": "sub_enterprise_007",
            "company_name": "Acme Corp India Pvt Ltd",
            "invoice_amount_inr": 250000.0,
            "failure_count": 1
        },
        "ENGINE 2: High-Value B2B Mandate & Virtual Account Provisioning"
    )

    # Test 3: Chargeback Defense
    run_test(
        "/api/v1/disputes/auto-defend",
        {
            "dispute_id": "disp_fraud_3301",
            "payment_id": "pay_disputed_8812",
            "customer_email": "finance@clientcorp.com",
            "amount_inr": 120000.0,
            "buyer_ip": "49.207.54.18"
        },
        "ENGINE 3: Automated Chargeback & Dispute Defense"
    )
