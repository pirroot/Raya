import requests
from django.conf import settings
from openai import OpenAI


class GapGPTService:
    def __init__(self):
        self.api_key = getattr(settings, "GAPGPT_API_KEY", "")
        self.base_url = "https://api.gapgpt.app/v1"

    def chat(self, message: str, settings: dict = None) -> str:
        """
        ارسال پیام به GapGPT با استفاده از کتابخانه OpenAI
        """
        if not self.api_key:
            return "کلید API GapGPT تنظیم نشده است. لطفاً با پشتیبانی تماس بگیرید."

        try:
            client = OpenAI(
                base_url=self.base_url,
                api_key=self.api_key,
                timeout=60.0,
            )

            # آماده‌سازی پیام‌ها با Custom Prompt
            messages = []

            # اضافه کردن Custom Prompt (اگه وجود داشته باشه)
            custom_prompt = settings.get("customPrompt", "") if settings else ""
            if custom_prompt:
                messages.append({"role": "system", "content": custom_prompt})

            messages.append({"role": "user", "content": message})

            # انتخاب مدل
            model = settings.get("model", "gpt-4o") if settings else "gpt-4o"
            temperature = settings.get("temperature", 0.7) if settings else 0.7

            response = client.chat.completions.create(
                model=model,
                messages=messages,
                temperature=temperature,
            )

            return response.choices[0].message.content

        except Exception as e:
            print(f"GapGPT Error: {e}")
            return f"خطا در ارتباط با سرویس هوش مصنوعی: {str(e)}"
