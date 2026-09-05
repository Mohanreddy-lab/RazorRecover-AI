from fastapi import FastAPI
from pydantic import BaseModel
from enterprise_engine import uncaptured_engine, b2b_dunning_engine, dispute_engine

app = FastAPI(title="RazorRecover Enterprise Platform")


@app.get("/")
def home():
    return {"status": "ONLINE", "platform": "RazorRecover AI Enterprise Edition"}


class HealUncapturedRequest(BaseModel):
    payment_id: str
    order_id: str
    amount_inr: float
    order_fulfilled: bool = True


class B2BMandateRequest(BaseModel):
    subscription_id: str
    company_name: str
    invoice_amount_inr: float
    failure_count: int = 1


class ChargebackDefendRequest(BaseModel):
    dispute_id: str
    payment_id: str
    customer_email: str
    amount_inr: float
    buyer_ip: str = "102.164.12.1"


@app.post("/api/v1/heal-uncaptured")
async def heal_uncaptured(payload: HealUncapturedRequest):
    """Engine 1: Auto-captures authorized money stuck at banks."""
    result = uncaptured_engine.heal_uncaptured_payment(
        payment_id=payload.payment_id,
        order_id=payload.order_id,
        amount_inr=payload.amount_inr,
        order_fulfilled=payload.order_fulfilled
    )
    return result


@app.post("/api/v1/dunning/b2b-mandate")
async def process_b2b_mandate(payload: B2BMandateRequest):
    """Engine 2: Handles high-value B2B mandate failures & generates Virtual Accounts."""
    result = b2b_dunning_engine.process_failed_mandate(
        subscription_id=payload.subscription_id,
        company_name=payload.company_name,
        invoice_amount_inr=payload.invoice_amount_inr,
        failure_count=payload.failure_count
    )
    return result


@app.post("/api/v1/disputes/auto-defend")
async def defend_dispute(payload: ChargebackDefendRequest):
    """Engine 3: Compiles telemetry & submits automated chargeback defense."""
    result = dispute_engine.defend_chargeback(
        dispute_id=payload.dispute_id,
        payment_id=payload.payment_id,
        customer_email=payload.customer_email,
        amount_inr=payload.amount_inr,
        buyer_ip=payload.buyer_ip
    )
    return result
