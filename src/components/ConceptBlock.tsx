import type { Concept } from '../content/schema';
import { ExampleCard } from './examples/ExampleCard';

interface ConceptBlockProps {
  concept: Concept;
  lessonId: string;
}

export function ConceptBlock({ concept, lessonId }: ConceptBlockProps) {
  return (
    <section className="concept-block">
      <h3>{concept.title}</h3>
      <p className="concept-objective">{concept.objective}</p>
      {concept.miniNote && <p className="concept-note">{concept.miniNote}</p>}
      <div className="examples-list">
        {concept.examples.map((ex) => (
          <ExampleCard key={ex.id} example={ex} lessonId={lessonId} />
        ))}
      </div>
    </section>
  );
}
