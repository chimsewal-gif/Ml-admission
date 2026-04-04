'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';

export default function AdmissionScore() {
  const [form, setForm] = useState({
    math: '',
    english: '',
    science: '',
    program: 'ICT',
  });
  const [result, setResult] = useState<{ probability: number; status: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: any) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // 🔹 Automatically trigger prediction when all fields are filled
  useEffect(() => {
    const { math, english, science, program } = form;
    if (math && english && science && program) {
      const timer = setTimeout(async () => {
        setLoading(true);
        try {
          const res = await axios.post('http://127.0.0.1:8000/api/predict-admission', form);
          setResult(res.data);
        } catch (error) {
          console.error(error);
          setResult(null);
        } finally {
          setLoading(false);
        }
      }, 800); // debounce delay (waits 0.8s after typing stops)
      return () => clearTimeout(timer);
    }
  }, [form]);

  return (
    <div className="max-w-md mx-auto p-6 bg-white shadow-lg rounded-2xl mt-10">
      <h1 className="text-2xl font-bold mb-4 text-center">🎓 Mzuni Admission Predictor</h1>

      <form className="space-y-4">
        {['math', 'english', 'science'].map((subject) => (
          <div key={subject}>
            <label className="block capitalize mb-1">{subject} Grade (%)</label>
            <input
              type="number"
              name={subject}
              value={(form as any)[subject]}
              onChange={handleChange}
              className="w-full border rounded p-2"
              required
            />
          </div>
        ))}

        <div>
          <label className="block mb-1">Program Applied</label>
          <select
            name="program"
            value={form.program}
            onChange={handleChange}
            className="w-full border rounded p-2"
          >
            <option value="ICT">ICT</option>
            <option value="Engineering">Engineering</option>
            <option value="Education">Education</option>
          </select>
        </div>
      </form>

      {loading && (
        <p className="mt-4 text-center text-gray-500 animate-pulse">Predicting...</p>
      )}

      {result && !loading && (
        <div className="mt-6 text-center">
          <p className="text-xl font-semibold">
            Admission Likelihood: {result.probability}%
          </p>
          <p
            className={`text-lg mt-2 ${
              result.status === 'Highly Likely'
                ? 'text-green-600'
                : result.status === 'Possible'
                ? 'text-yellow-600'
                : 'text-red-600'
            }`}
          >
            {result.status}
          </p>
        </div>
      )}
    </div>
  );
}
