"use client";

import { useState,useEffect } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const schema = z.object({
  code:z.string().length(6,"کد تایید باید 6 رقم باشد")
});

type FormData = z.infer<typeof schema>;

interface StepOtpProps{
  mobile:string
  onBack:()=>void
  onSuccess:(data:any)=>void
}

export default function StepOtp({mobile,onBack,onSuccess}:StepOtpProps){

  const {register,handleSubmit,formState:{errors,isSubmitting}} = useForm<FormData>({
    resolver:zodResolver(schema)
  });

  const [timer,setTimer] = useState(120);

  useEffect(()=>{
    const interval=setInterval(()=>{
      setTimer(prev=>{
        if(prev<=1){
          clearInterval(interval);
          return 0;
        }
        return prev-1;
      })
    },1000)

    return ()=>clearInterval(interval)
  },[])

  const resend = async()=>{

    await fetch("/api/v1/auth/send-otp",{
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body:JSON.stringify({mobile})
    });

    setTimer(120);
  }

  const onSubmit = async(data:FormData)=>{

    const res = await fetch("/api/v1/auth/verify-otp",{
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body:JSON.stringify({
        mobile,
        code:data.code
      })
    });

    const json = await res.json();

    if(json.requires_registration){

      localStorage.setItem("registration_token",json.registration_token);

      onSuccess({
        step:"profile",
        mobile
      });

    }else{

      localStorage.setItem("access_token",json.access_token);

      onSuccess({
        step:"dashboard"
      });

    }

  }

  return (
    <div className="flex flex-col space-y-6">

      <button onClick={onBack}>بازگشت</button>

      <div className="text-center">
        <h2 className="text-xl font-bold">کد تایید</h2>
        <p className="text-sm text-gray-500">{mobile}</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

        <Input
          className="text-center text-2xl tracking-widest h-14"
          maxLength={6}
          {...register("code")}
        />

        {errors.code && (
          <p className="text-red-500 text-xs">{errors.code.message}</p>
        )}

        <Button type="submit" disabled={isSubmitting} className="w-full h-12 bg-blue-600 text-white">
          تایید
        </Button>

        {timer===0 && (
          <button onClick={resend} type="button" className="text-blue-600 text-sm">
            ارسال مجدد
          </button>
        )}

      </form>

    </div>
  );
}
