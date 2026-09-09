"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

const FIELDS=[
"کامپیوتر","برق","مکانیک","عمران","صنایع","معماری"
]

const UNITS=[
"واحد تهران مرکزی",
"واحد تهران شمال",
"واحد کرج",
"واحد اصفهان"
]

interface Props{
  userData:any
}

export default function StepEducation({userData}:Props){

  const [field,setField] = useState("");
  const [unit,setUnit] = useState("");

  const registerUser = async()=>{

    const res = await fetch("/api/v1/auth/register",{
      method:"POST",
      headers:{
        "Content-Type":"application/json",
        "x-registration-token":localStorage.getItem("registration_token")||""
      },
      body:JSON.stringify({
        ...userData,
        fieldOfStudy:field,
        educationalUnit:unit
      })
    });

    const json = await res.json();

    localStorage.setItem("access_token",json.access_token);

    window.location.href="/panel";

  }

  return (

    <div className="flex flex-col space-y-6">

      <h2 className="text-xl font-bold text-center">اطلاعات تحصیلی</h2>

      <div className="flex flex-wrap gap-2">
        {FIELDS.map(f=>(
          <button
            key={f}
            onClick={()=>setField(f)}
            className={`px-3 py-2 border rounded-lg ${field===f?"bg-blue-600 text-white":""}`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        {UNITS.map(u=>(
          <button
            key={u}
            onClick={()=>setUnit(u)}
            className={`p-2 border rounded-lg ${unit===u?"bg-blue-100":""}`}
          >
            {u}
          </button>
        ))}
      </div>

      <Button
        disabled={!field || !unit}
        onClick={registerUser}
        className="h-12 bg-blue-600 text-white"
      >
        تکمیل ثبت نام
      </Button>

    </div>
  );
}
