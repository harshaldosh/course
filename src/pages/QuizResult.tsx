import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, XCircle, TrendingUp, TrendingDown, Lightbulb, Award } from 'lucide-react';
import { quizService } from '../services/quiz';
import type { Quiz, QuizAttempt } from '../types/quiz';
import toast from 'react-hot-toast';

const QuizResult: React.FC = () => {
  const { quizId, attemptId } = useParams<{ quizId: string; attemptId: string }>();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [attempt, setAttempt] = useState<QuizAttempt | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (quizId && attemptId) {
      loadResults();
    }
  }, [quizId, attemptId]);

  const loadResults = async () => {
    try {
      if (!quizId || !attemptId) return;

      const [quizData, attemptData] = await Promise.all([
        quizService.getQuizById(quizId),
        quizService.getQuizAttempt(attemptId)
      ]);

      if (!quizData || !attemptData) {
        toast.error('Results not found');
        navigate('/');
        return;
      }

      setQuiz(quizData);
      setAttempt(attemptData);
    } catch (error) {
      console.error('Failed to load results:', error);
      toast.error('Failed to load results');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!quiz || !attempt || !attempt.evaluationResult) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Results not available</h2>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  const { evaluationResult } = attempt;
  const percentage = Math.round((evaluationResult.score / attempt.totalMarks) * 100);
  
  const getGradeColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 80) return 'text-blue-600';
    if (percentage >= 70) return 'text-yellow-600';
    if (percentage >= 60) return 'text-orange-600';
    return 'text-red-600';
  };

  const getGrade = (percentage: number) => {
    if (percentage >= 90) return 'A+';
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B';
    if (percentage >= 60) return 'C';
    if (percentage >= 50) return 'D';
    return 'F';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/')}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Quiz Results</h1>
              <p className="text-sm text-gray-600">{quiz.title}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Score Overview */}
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <div className="mb-6">
            <div className={`text-6xl font-bold ${getGradeColor(percentage)} mb-2`}>
              {percentage}%
            </div>
            <div className={`text-2xl font-semibold ${getGradeColor(percentage)} mb-4`}>
              Grade: {getGrade(percentage)}
            </div>
            <div className="text-gray-600">
              {evaluationResult.score} out of {attempt.totalMarks} marks
            </div>
          </div>

          <div className="flex items-center justify-center mb-6">
            <Award className={`w-16 h-16 ${getGradeColor(percentage)}`} />
          </div>

          <div className="bg-gray-100 rounded-full h-4 mb-4">
            <div 
              className={`h-4 rounded-full transition-all duration-1000 ${
                percentage >= 90 ? 'bg-green-500' :
                percentage >= 80 ? 'bg-blue-500' :
                percentage >= 70 ? 'bg-yellow-500' :
                percentage >= 60 ? 'bg-orange-500' : 'bg-red-500'
              }`}
              style={{ width: `${percentage}%` }}
            ></div>
          </div>

          <p className="text-gray-600">
            Completed on {new Date(attempt.completedAt!).toLocaleDateString()} at{' '}
            {new Date(attempt.completedAt!).toLocaleTimeString()}
          </p>
        </div>

        {/* Detailed Feedback */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Detailed Feedback</h2>
          
          <div className="prose max-w-none">
            <p className="text-gray-700 leading-relaxed">
              {evaluationResult.detailedFeedback}
            </p>
          </div>
        </div>

        {/* Strengths, Weaknesses, and Improvements */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Strengths */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center mb-4">
              <CheckCircle className="w-6 h-6 text-green-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Strengths</h3>
            </div>
            
            {evaluationResult.strengths.length > 0 ? (
              <ul className="space-y-2">
                {evaluationResult.strengths.map((strength, index) => (
                  <li key={index} className="flex items-start">
                    <TrendingUp className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-700">{strength}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">No specific strengths identified.</p>
            )}
          </div>

          {/* Weaknesses */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center mb-4">
              <XCircle className="w-6 h-6 text-red-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Areas for Improvement</h3>
            </div>
            
            {evaluationResult.weaknesses.length > 0 ? (
              <ul className="space-y-2">
                {evaluationResult.weaknesses.map((weakness, index) => (
                  <li key={index} className="flex items-start">
                    <TrendingDown className="w-4 h-4 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-700">{weakness}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">No specific weaknesses identified.</p>
            )}
          </div>

          {/* Improvement Suggestions */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center mb-4">
              <Lightbulb className="w-6 h-6 text-yellow-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Suggestions</h3>
            </div>
            
            {evaluationResult.improvements.length > 0 ? (
              <ul className="space-y-2">
                {evaluationResult.improvements.map((improvement, index) => (
                  <li key={index} className="flex items-start">
                    <Lightbulb className="w-4 h-4 text-yellow-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-700">{improvement}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">No specific suggestions provided.</p>
            )}
          </div>
        </div>

        {/* Quiz Summary */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quiz Summary</h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{quiz.totalQuestions}</div>
              <div className="text-sm text-gray-600">Total Questions</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {Object.keys(attempt.answers).length}
              </div>
              <div className="text-sm text-gray-600">Answered</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{attempt.totalMarks}</div>
              <div className="text-sm text-gray-600">Total Marks</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {Math.round((new Date(attempt.completedAt!).getTime() - new Date(attempt.startedAt).getTime()) / 60000)}
              </div>
              <div className="text-sm text-gray-600">Minutes Taken</div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-center space-x-4">
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Back to Home
          </button>
          
          <button
            onClick={() => window.print()}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Print Results
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuizResult;