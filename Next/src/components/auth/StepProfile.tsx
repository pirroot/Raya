"use client";

import { useState,useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Camera,Check,X,User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const schema = z.object({
  firstName:z.string().min(2),
  lastName:z.string().min(2),
  username:z.string().min(3).regex(/^[a-zA-Z0-9_]+$/)
});

type FormData = z.infer<typeof schema>;

interface StepProfileProps{
  mobile:string
  onNext:(data:any)=>void
}

export default function StepProfile({mobile,onNext}:StepProfileProps){

  const {register,watch,handleSubmit,formState:{errors}} = useForm<FormData>({
    resolver:zodResolver(schema)
  });

  const username = watch("username");

  const [avatar,setAvatar] = useState<string|null>(null);
  const [usernameStatus,setUsernameStatus] = useState<"idle"|"checking"|"available"|"taken">("idle");

  useEffect(()=>{

    const timer=setTimeout(async()=>{

      if(!username || username.length<3) return;

      setUsernameStatus("checking");

      const res = await fetch(`/api/v1/users/check-username/${username}`);

      const json = await res.json();

      if(json.available){
        setUsernameStatus("available");
      }else{
        setUsernameStatus("taken");
      }

    },500)

    return ()=>clearTimeout(timer)

  },[username]);

  const uploadAvatar = async(file:File)=>{

    const formData = new FormData();

    formData.append("file",file);

    const res = await fetch("/api/v1/users/upload-avatar",{
      method:"POST",
      body:formData
    });

    const json = await res.json();

    setAvatar(json.url);
  }

  const handleAvatarChange=(e:any)=>{

    const file = e.target.files?.[0];

    if(file){
      uploadAvatar(file);
    }

  }

  const onSubmit=(data:FormData)=>{

    if(usernameStatus!=="available") return;

    onNext({
      ...data,
      mobile,
      avatarUrl:avatar
    });

  }

  return (
    <div className="flex flex-col space-y-6">

      <div className="flex justify-center">

        <div className="relative w-24 h-24">

          <div className="w-full h-full rounded-full bg-gray-200 overflow-hidden flex items-center justify-center">
            {avatar ? <img src={avatar}/> : <User />}
          </div>

          <label className="absolute bottom-0 right-0 bg-blue-600 p-2 rounded-full text-white cursor-pointer">
            <Camera size={16}/>
            <input type="file" className="hidden" accept="image/*" onChange={handleAvatarChange}/>
          </label>

        </div>

      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">

        <Input placeholder="نام" {...register("firstName")} />
        {errors.firstName && <p className="text-red-500 text-xs">{errors.firstName.message}</p>}

        <Input placeholder="نام خانوادگی" {...register("lastName")} />
        {errors.lastName && <p className="text-red-500 text-xs">{errors.lastName.message}</p>}

        <Input placeholder="نام کاربری" {...register("username")} />

        <Button type="submit" className="w-full h-12 bg-blue-600 text-white">
          ادامه
        </Button>

      </form>

    </div>
  );
}
