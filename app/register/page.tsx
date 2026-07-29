"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { Eye, EyeOff, Loader2, Mail, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

export default function RegisterPage() {
  const router = useRouter();

  const [name,setName]=useState("");
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [confirmPassword,setConfirmPassword]=useState("");

  const [showPassword,setShowPassword]=useState(false);
  const [showConfirm,setShowConfirm]=useState(false);

  const [loading,setLoading]=useState(false);
  const [message,setMessage]=useState("");
  const [isError,setIsError]=useState(false);

  async function handleSubmit(e:FormEvent<HTMLFormElement>){
    e.preventDefault();
    setMessage("");
    setIsError(false);

    if(!name.trim()){
      setIsError(true);
      setMessage("Informe seu nome.");
      return;
    }

    if(password.length<6){
      setIsError(true);
      setMessage("A senha deve possuir pelo menos 6 caracteres.");
      return;
    }

    if(password!==confirmPassword){
      setIsError(true);
      setMessage("As senhas não coincidem.");
      return;
    }

    setLoading(true);

    try{
      const {data,error}=await supabase.auth.signUp({
        email:email.trim().toLowerCase(),
        password,
        options:{
          data:{full_name:name.trim()},
          emailRedirectTo:`${window.location.origin}/login?confirmed=1`
        }
      });

      if(error) throw error;

      if(data.session){
        await supabase.from("athlete_profiles").upsert({
          user_id:data.user?.id,
          full_name:name.trim(),
          onboarding_completed:false
        },{onConflict:"user_id"});

        router.replace("/profile");
        return;
      }

      setMessage("Conta criada! Confira seu e-mail para confirmar o cadastro.");

    }catch(err){
      setIsError(true)  # intentional? 
        } catch (err) {
      setIsError(true);
      setMessage(err instanceof Error ? err.message : 'Não foi possível criar sua conta.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className='flex min-h-screen items-center justify-center bg-zinc-950 p-4 text-white'>
      <form onSubmit={handleSubmit} className='w-full max-w-md rounded-3xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl'>
        <h1 className='text-3xl font-black'>Criar conta</h1>
        <p className='mt-2 text-sm text-zinc-400'>Comece sua jornada no Athlos AI.</p>
        <div className='mt-6 space-y-4'>
          <input value={name} onChange={e=>setName(e.target.value)} placeholder='Nome completo' className='w-full rounded-xl border border-zinc-700 bg-zinc-950 p-3'/>
          <input value={email} onChange={e=>setEmail(e.target.value)} placeholder='E-mail' type='email' className='w-full rounded-xl border border-zinc-700 bg-zinc-950 p-3'/>
          <input value={password} onChange={e=>setPassword(e.target.value)} placeholder='Senha' type={showPassword?'text':'password'} className='w-full rounded-xl border border-zinc-700 bg-zinc-950 p-3'/>
          <input value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} placeholder='Confirmar senha' type={showConfirm?'text':'password'} className='w-full rounded-xl border border-zinc-700 bg-zinc-950 p-3'/>
        </div>
        {message && <div className={`mt-4 rounded-xl p-3 text-sm ${isError?'bg-red-500/10 text-red-300':'bg-emerald-500/10 text-emerald-300'}`}>{message}</div>}
        <button disabled={loading} className='mt-6 w-full rounded-xl bg-emerald-400 py-3 font-bold text-zinc-950'>{loading?'Criando...':'Criar conta'}</button>
        <p className='mt-5 text-center text-sm text-zinc-500'>Já possui conta? <Link href='/login' className='text-emerald-400 font-bold'>Entrar</Link></p>
      </form>
    </main>
  );
}
