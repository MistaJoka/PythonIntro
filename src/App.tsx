import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { HomePage } from './routes/Home';
import { LessonPage } from './routes/Lesson';
import { LessonCheckPage } from './routes/LessonCheck';
import { DashboardPage } from './routes/Dashboard';
import { ReviewPage } from './routes/Review';
import { ExamPrepPage } from './routes/ExamPrep/ExamPrepHome';
import { DiagnosticPage } from './routes/ExamPrep/Diagnostic';
import { ExamSimPage } from './routes/ExamPrep/ExamSim';
import { ReviewSheetPage } from './routes/ExamPrep/ReviewSheet';
import { PracticePage } from './routes/Practice';
import { CapstoneHomePage } from './routes/Capstones/CapstoneHome';
import { CapstoneProjectPage } from './routes/Capstones/CapstoneProject';
import { ChallengeHomePage } from './routes/Challenges/ChallengeHome';
import { ChallengeBundlePage } from './routes/Challenges/ChallengeBundlePage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<HomePage />} />
          <Route path="lesson/:lessonId" element={<LessonPage />} />
          <Route path="lesson/:lessonId/check" element={<LessonCheckPage />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="review" element={<ReviewPage />} />
          <Route path="practice" element={<PracticePage />} />
          <Route path="exam-prep" element={<ExamPrepPage />} />
          <Route path="exam-prep/diagnostic" element={<DiagnosticPage />} />
          <Route path="exam-prep/sim/:examSetId" element={<ExamSimPage />} />
          <Route path="exam-prep/review/:examSetId" element={<ReviewSheetPage />} />
          <Route path="challenges" element={<ChallengeHomePage />} />
          <Route path="challenges/:bundleId" element={<ChallengeBundlePage />} />
          <Route path="capstones" element={<CapstoneHomePage />} />
          <Route path="capstones/:projectId" element={<CapstoneProjectPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
