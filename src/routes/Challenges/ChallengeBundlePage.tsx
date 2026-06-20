import { Navigate, useParams } from 'react-router-dom';
import { getChallengeBundleById } from '../../content/registry';
import { ReviewSession } from '../../components/ReviewSession';
import { TacticalBrief } from '../../components/layout/TacticalBrief';

export function ChallengeBundlePage() {
  const { bundleId } = useParams();
  const bundle = bundleId ? getChallengeBundleById(bundleId) : undefined;

  if (!bundle) {
    return <Navigate to="/challenges" replace />;
  }

  return (
    <div className="challenge-bundle-page">
      <TacticalBrief>
        {bundle.title} — {bundle.blurb}
      </TacticalBrief>
      <ReviewSession
        exampleIds={bundle.examples.map((e) => e.id)}
        channel="CHALLENGE"
        banner={`${bundle.title} — ${bundle.examples.length} items`}
        focusMode
      />
    </div>
  );
}
