import { Link } from 'react-router-dom';
import { CAPSTONE_PROJECTS } from '../../content/capstones/projects';
import { COURSE_LESSONS, FULL_COURSE_NOTE } from '../../content/capstones/lessonIndex';

const DIFFICULTY_LABEL: Record<string, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
};

export function CapstoneHomePage() {
  return (
    <div className="capstone-page">
      <header className="page-header compact-header">
        <p className="panel-desc tagline">
          Twelve end-of-course builds — MIT-style finals that synthesize all {COURSE_LESSONS.length}{' '}
          lessons. {FULL_COURSE_NOTE} Each project includes a full reference solution with
          line-by-line teaching.
        </p>
      </header>

      <div className="capstone-grid">
        {CAPSTONE_PROJECTS.map((project, index) => (
          <Link key={project.id} to={`/capstones/${project.id}`} className="capstone-card">
            <span className="capstone-num">{String(index + 1).padStart(2, '0')}</span>
            <div className="capstone-card-body">
              <h2>{project.title}</h2>
              <p>{project.subtitle}</p>
              <div className="capstone-meta">
                <span className={`difficulty ${project.difficulty}`}>
                  {DIFFICULTY_LABEL[project.difficulty]}
                </span>
                <span className="lesson-count-badge">
                  {project.lessonCoverage.length}/{COURSE_LESSONS.length} lessons
                </span>
                <span>{project.topics.slice(0, 2).join(' · ')}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
