"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import * as z from "zod";

const schema = z.object({
  mobile: z.string().regex(/^09\d{9}$/, "شماره موبایل باید با 09 شروع شود و 11 رقم باشد"),
});

type FormData = z.infer<typeof schema>;

interface StepMobileProps {
  onNext: (mobile: string) => void;
}

export default function StepMobile({ onNext }: StepMobileProps) {

  const { register, handleSubmit, formState:{errors,isSubmitting} } = useForm<FormData>({
    resolver:zodResolver(schema)
  });

  const onSubmit = async (data:FormData)=>{

    const res = await fetch("/api/v1/auth/send-otp",{
      method:"POST",
      headers:{
        "Content-Type":"application/json"
      },
      body:JSON.stringify({
        mobile:data.mobile
      })
    });

    if(!res.ok){
      alert("خطا در ارسال کد تایید");
      return;
    }

    onNext(data.mobile);
  }

  return (
    <div className="flex flex-col space-y-4">

      <div className="text-center">
        <h1 className="text-2xl font-bold">ورود به رایا</h1>
        <p className="text-sm text-gray-500">شماره موبایل خود را وارد کنید</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

        <Input
          placeholder="09123456789"
          maxLength={11}
          className="text-center text-lg h-12 rounded-xl"
          {...register("mobile")}
        />

        {errors.mobile && (
          <p className="text-red-500 text-xs text-center">{errors.mobile.message}</p>
        )}

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-12 rounded-xl bg-blue-600 text-white"
        >
          دریافت کد تایید
        </Button>

      </form>
    </div>
  );
}
