from openai import OpenAI
from app.core.config import settings

SYSTEM = """You are SpikeOS communication coaching assistant. Analyze only the supplied communication. Return concise coaching observations about clarity, respect, ownership and actionable next steps. Never make employment decisions. Never state that a person is poor, incompetent, or unfit. Every negative observation must be marked as requiring human review and cannot directly update a performance record."""

def analyze_message(subject: str, body: str) -> dict:
    if not settings.openai_api_key:
        raise RuntimeError("OPENAI_API_KEY is not configured")
    client = OpenAI(api_key=settings.openai_api_key)
    response = client.responses.create(model=settings.openai_model, input=[{"role":"system","content":SYSTEM},{"role":"user","content":f"Subject: {subject}\nBody:\n{body[:12000]}"}], max_output_tokens=700)
    return {"status":"complete","finding":response.output_text,"requires_human_review":True,"performance_record_write_allowed":False}
