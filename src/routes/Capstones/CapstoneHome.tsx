import { Link } from 'react-router-dom';
import { CAPSTONE_PROJECTS } from '../../content/capstones/projects';
import { COURSE_LESSONS, FULL_COURSE_NOTE } from '../../content/capstones/lessonIndex';
import { useProgressStore } from '../../store/progress';
import { TacticalBrief } from '../../components/layout/TacticalBrief';

const DIFFICULTY_LABEL: Record<string, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
  expert: 'Expert',
};

export function CapstoneHomePage() {
  const capstones = useProgressStore((s) => s.capstones);
  const completedCount = CAPSTONE_PROJECTS.filter((p) => capstones[p.id]?.passed).length;

  return (
    <div className="capstone-page">
      <TacticalBrief msgType="OPORD" sector="DEV-BAY">
        Field deployment ops — {CAPSTONE_PROJECTS.length} end-of-course builds synthesizing all{' '}
        {COURSE_LESSONS.length} modules. {FULL_COURSE_NOTE} Each op includes a full reference
        solution with line-by-line debrief.
      </TacticalBrief>
      {completedCount > 0 && (
        <p className="capstone-progress-summary">
          {completedCount}/{CAPSTONE_PROJECTS.length} ops complete — code cached locally.
        </p>
      )}

      <div className="capstone-grid">
        {CAPSTONE_PROJECTS.map((project, index) => {
          const progress = capstones[project.id];
          const complete = progress?.passed ?? false;
          return (
            <Link
              key={project.id}
              to={`/capstones/${project.id}`}
              className={`capstone-card ${complete ? 'complete' : ''}`}
            >
              <span className="capstone-num">{String(index + 1).padStart(2, '0')}</span>
              <div className="capstone-card-body">
                <h2>
                  {project.title}
                  {complete && <span className="capstone-done-badge"> ✓</span>}
                </h2>
                <p>{project.subtitle}</p>
                <div className="capstone-meta">
                  <span className={`difficulty ${project.difficulty}`}>
                    {DIFFICULTY_LABEL[project.difficulty]}
                  </span>
                  <span className="lesson-count-badge">
                    {project.lessonCoverage.length}/{COURSE_LESSONS.length} lessons
                  </span>
                  {progress && !complete && progress.attempts > 0 && (
                    <span className="capstone-attempts">{progress.attempts} test run(s)</span>
                  )}
                  <span>{project.topics.slice(0, 2).join(' · ')}</span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
