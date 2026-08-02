interface ProgressStepsProps {
  currentStep: number;
  totalSteps: number;
}

export default function ProgressSteps({
  currentStep,
  totalSteps,
}: ProgressStepsProps) {
  const percentage = (currentStep / totalSteps) * 100;

  return (
    <div className="mb-8">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm text-zinc-400">
          Etapa {currentStep} de {totalSteps}
        </span>

        <span className="text-sm font-semibold text-green-400">
          {Math.round(percentage)}%
        </span>
      </div>

      <div className="h-2 w-full rounded-full bg-zinc-800">
        <div
          className="h-2 rounded-full bg-green-500 transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}