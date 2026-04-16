'use client';

import { useState } from 'react';

interface ReviewModalProps {
  applicant: any;
  onClose: () => void;
  onSave: (review: any) => void;
}

export default function ReviewModal({ applicant, onClose, onSave }: ReviewModalProps) {
  const [scores, setScores] = useState({
    academic: 0,
    experience: 0,
    interview: 0,
    recommendations: 0
  });
  const [comments, setComments] = useState('');

  const criteria = [
    { name: 'Academic Performance', key: 'academic', max: 25 },
    { name: 'Professional Experience', key: 'experience', max: 25 },
    { name: 'Interview Performance', key: 'interview', max: 30 },
    { name: 'Recommendations', key: 'recommendations', max: 20 }
  ];

  const total = Object.values(scores).reduce((a, b) => a + b, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      applicantId: applicant.id,
      scores,
      comments,
      total,
      date: new Date().toISOString()
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full my-8">
        <h2 className="text-xl font-bold mb-4">Review Application: {applicant.name}</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-3">Evaluation Criteria</h3>
              <div className="space-y-4">
                {criteria.map((criterion) => (
                  <div key={criterion.key}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {criterion.name} (Max {criterion.max})
                    </label>
                    <input
                      type="range"
                      min="0"
                      max={criterion.max}
                      value={scores[criterion.key as keyof typeof scores]}
                      onChange={(e) => setScores({
                        ...scores,
                        [criterion.key]: parseInt(e.target.value)
                      })}
                      className="w-full"
                    />
                    <div className="flex justify-between text-sm text-gray-600 mt-1">
                      <span>0</span>
                      <span className="font-medium">
                        Score: {scores[criterion.key as keyof typeof scores]} / {criterion.max}
                      </span>
                      <span>{criterion.max}</span>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Total Score:</span>
                  <span className="text-xl font-bold text-blue-600">{total} / 100</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Review Comments
              </label>
              <textarea
                rows={4}
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your evaluation comments here..."
                required
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Submit Evaluation
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}