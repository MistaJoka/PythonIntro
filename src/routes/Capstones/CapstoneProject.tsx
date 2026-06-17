import { useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { getCapstoneById } from '../../content/capstones/projects';
import { CapstoneEditor } from '../../components/capstones/CapstoneEditor';
import { SolutionWalker } from '../../components/capstones/SolutionWalker';
import { TacticalBrief } from '../../components/layout/TacticalBrief';

type Tab = 'work' | 'solution';

export function CapstoneProjectPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const project = projectId ? getCapstoneById(projectId) : undefined;
  const [tab, setTab] = useState<Tab>('work');

  if (!project) {
    return <Navigate to="/capstones" replace />;
  }

  return (
    <div className="capstone-page capstone-detail">
      <TacticalBrief msgType="FRAGO" sector={`DEV-${project.id.toUpperCase()}`}>
        {project.subtitle}
      </TacticalBrief>
      <p className="expert-lens">{project.expertLens}</p>
      <div className="capstone-meta">
        <span className={`difficulty ${project.difficulty}`}>{project.difficulty}</span>
        <span className="lesson-count-badge">16/16 modules</span>
        <span>{project.topics.join(' · ')}</span>
      </div>

      <section className="capstone-section">
        <h2>Op brief</h2>
        <pre className="brief-text">{project.description}</pre>
        <ul className="objectives-list">
          {project.objectives.map((obj) => (
            <li key={obj}>{obj}</li>
          ))}
        </ul>
      </section>

      <div className="capstone-tabs">
        <button
          type="button"
          className={tab === 'work' ? 'tab active' : 'tab'}
          onClick={() => setTab('work')}
        >
          Your work
        </button>
        <button
          type="button"
          className={tab === 'solution' ? 'tab active' : 'tab'}
          onClick={() => setTab('solution')}
        >
          Solution walkthrough
        </button>
      </div>

      {tab === 'work' ? (
        <section className="capstone-section">
          <h2>Build it</h2>
          <p className="section-note">
            Implement the project in the editor below. Run tests when ready — Pyodide runs Python in
            your browser.
          </p>
          <CapstoneEditor project={project} />
        </section>
      ) : (
        <section className="capstone-section">
          <h2>Reference solution</h2>
          <p className="section-note">{project.explanation}</p>
          <SolutionWalker project={project} />
        </section>
      )}
    </div>
  );
}
