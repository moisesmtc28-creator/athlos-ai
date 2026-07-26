import { ArrowRight, Bike, UserRound } from "lucide-react";

import ProgressSteps from "../components/ui/ProgressSteps";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function OnboardingPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-950 p-4 sm:p-6">
      <Card className="w-full max-w-3xl border-zinc-800 bg-zinc-900 text-white shadow-2xl">
        <CardHeader className="space-y-6">
          <ProgressSteps currentStep={1} totalSteps={5} />

          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-green-600">
              <Bike className="h-7 w-7 text-white" />
            </div>

            <div>
              <p className="text-sm font-medium text-green-400">
                Athlos AI
              </p>

              <CardTitle className="mt-1 text-2xl text-white sm:text-3xl">
                Vamos conhecer você
              </CardTitle>
            </div>
          </div>

          <CardDescription className="text-base text-zinc-400">
            Estas informações serão utilizadas para personalizar seus treinos,
            zonas cardíacas e recomendações do Coach IA.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="mb-8 flex items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-500/10">
              <UserRound className="h-5 w-5 text-green-400" />
            </div>

            <div>
              <h2 className="font-semibold text-white">Dados pessoais</h2>

              <p className="text-sm text-zinc-500">
                Etapa 1: informações básicas do atleta
              </p>
            </div>
          </div>

          <form className="space-y-8">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="name" className="text-zinc-300">
                  Nome
                </Label>

                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Digite seu nome"
                  defaultValue="Moisés"
                  autoComplete="name"
                  className="h-12 border-zinc-700 bg-zinc-800 text-white placeholder:text-zinc-500 focus-visible:border-green-500 focus-visible:ring-green-500/20"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="age" className="text-zinc-300">
                  Idade
                </Label>

                <Input
                  id="age"
                  name="age"
                  type="number"
                  min="13"
                  max="100"
                  placeholder="Ex.: 41"
                  defaultValue="41"
                  className="h-12 border-zinc-700 bg-zinc-800 text-white placeholder:text-zinc-500 focus-visible:border-green-500 focus-visible:ring-green-500/20"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="height" className="text-zinc-300">
                  Altura
                  <span className="ml-1 text-zinc-500">(cm)</span>
                </Label>

                <Input
                  id="height"
                  name="height"
                  type="number"
                  min="100"
                  max="250"
                  placeholder="Ex.: 192"
                  defaultValue="192"
                  className="h-12 border-zinc-700 bg-zinc-800 text-white placeholder:text-zinc-500 focus-visible:border-green-500 focus-visible:ring-green-500/20"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="weight" className="text-zinc-300">
                  Peso atual
                  <span className="ml-1 text-zinc-500">(kg)</span>
                </Label>

                <Input
                  id="weight"
                  name="weight"
                  type="number"
                  min="30"
                  max="300"
                  step="0.1"
                  placeholder="Ex.: 120"
                  defaultValue="120"
                  className="h-12 border-zinc-700 bg-zinc-800 text-white placeholder:text-zinc-500 focus-visible:border-green-500 focus-visible:ring-green-500/20"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="goalWeight" className="text-zinc-300">
                  Peso desejado
                  <span className="ml-1 text-zinc-500">(kg)</span>
                </Label>

                <Input
                  id="goalWeight"
                  name="goalWeight"
                  type="number"
                  min="30"
                  max="300"
                  step="0.1"
                  placeholder="Ex.: 105"
                  defaultValue="105"
                  className="h-12 border-zinc-700 bg-zinc-800 text-white placeholder:text-zinc-500 focus-visible:border-green-500 focus-visible:ring-green-500/20"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="maxHeartRate" className="text-zinc-300">
                  Frequência cardíaca máxima
                  <span className="ml-1 text-zinc-500">(bpm)</span>
                </Label>

                <Input
                  id="maxHeartRate"
                  name="maxHeartRate"
                  type="number"
                  min="100"
                  max="230"
                  placeholder="Ex.: 180"
                  defaultValue="180"
                  className="h-12 border-zinc-700 bg-zinc-800 text-white placeholder:text-zinc-500 focus-visible:border-green-500 focus-visible:ring-green-500/20"
                />

                <p className="text-xs leading-5 text-zinc-500">
                  Use o maior valor registrado em treino ou teste. Esse número
                  será usado para calcular suas zonas de frequência cardíaca.
                </p>
              </div>
            </div>

            <div className="flex justify-end border-t border-zinc-800 pt-6">
              <Button
                type="submit"
                className="h-12 w-full gap-2 bg-green-600 px-8 text-base font-semibold text-white hover:bg-green-500 sm:w-auto"
              >
                Continuar
                <ArrowRight className="h-5 w-5" />
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}