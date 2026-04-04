interface ProgressBarProps {
  value: number; // progress value between 0 and 100
  max: number;   // maximum value for progress
  label?: string; // Optional label for the progress bar
}

const ProgressBar = ({ value, max, label }: ProgressBarProps) => {
  // Calculate the percentage of progress
  const percentage = (value / max) * 100;

  return (
    <div className="w-full mt-38"> {/* add margin top to move it below header */}
      {label && <div className="text-sm font-semibold mb-2">{label}</div>}
      <div className="relative pt-1">
        <div className="flex mb-2 items-center justify-between">
          <div>
            <span className="font-semibold text-xs">{`${Math.round(percentage)}%`}</span>
          </div>
        </div>
        <div className="flex mb-2">
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-blue-500 h-2.5 rounded-full"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProgressBar;
