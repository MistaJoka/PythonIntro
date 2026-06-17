import { Link } from 'react-router-dom';
import { getChallengeBundles } from '../../content/registry';
import { TacticalBrief } from '../../components/layout/TacticalBrief';

const ROMAN: Record<number, string> = { 1: 'I', 2: 'II', 3: 'III' };

export function ChallengeHomePage() {
  const bundles = [...getChallengeBundles()].sort((a, b) => a.difficulty - b.difficulty);

  return (
    <div className="challenge-page">
      <TacticalBrief msgType="OPORD" sector="ARENA">
        Cross-lesson trials — {bundles.length} themed bundles combining multiple modules. Harder
        than module drills; each mixes live-coded tasks and reasoning.
      </TacticalBrief>
      <div className="challenge-grid">
        {bundles.map((bundle) => (
          <Link key={bundle.id} to={`/challenges/${bundle.id}`} className="challenge-card">
            <span className={`challenge-badge difficulty-${bundle.difficulty}`}>
              {ROMAN[bundle.difficulty]}
            </span>
            <div className="challenge-card-body">
              <h2>{bundle.title}</h2>
              <p>{bundle.blurb}</p>
              <div className="challenge-meta">
                <span>{bundle.examples.length} items</span>
                <span>{bundle.lessonRefs.length} modules</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
