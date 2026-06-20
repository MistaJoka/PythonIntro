import { useMemo } from 'react';
import type { ShowroomProgram } from '../../content/showroom/schema';
import { tokenizeLine } from './tokenizer';

interface Props {
  program: ShowroomProgram;
}

export function AnnotatedCodeViewer({ program }: Props) {
  const lines = useMemo(() => program.code.split('\n'), [program.code]);

  const annotationMap = useMemo(() => {
    const map = new Map<number, (typeof program.annotations)[number]>();
    for (const ann of program.annotations) {
      map.set(ann.afterLine, ann);
    }
    return map;
  }, [program.annotations]);

  return (
    <div className="code-viewer">
      <div className="code-viewer-header">
        <h2 className="code-viewer-title">{program.title}</h2>
        <p className="code-viewer-desc">{program.description}</p>
        <div className="code-viewer-meta">
          <span className={`difficulty ${program.difficulty}`}>{program.difficulty}</span>
          <span className="code-line-count">{lines.length} lines</span>
        </div>
      </div>
      <div className="code-viewer-body">
        {lines.map((line, idx) => {
          const lineNum = idx + 1;
          const ann = annotationMap.get(lineNum);
          return (
            <div key={lineNum}>
              <div className="code-line">
                <span className="code-ln">{lineNum}</span>
                <span
                  className="code-text"
                  dangerouslySetInnerHTML={{ __html: tokenizeLine(line) }}
                />
              </div>
              {ann && (
                <div className="annotation-block">
                  <span className="annotation-technique">{ann.technique}</span>
                  <p className="annotation-explanation">{ann.explanation}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
