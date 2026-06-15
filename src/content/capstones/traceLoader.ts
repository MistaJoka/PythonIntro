import cap01 from './traces/cap-01.json';
import cap02 from './traces/cap-02.json';
import cap03 from './traces/cap-03.json';
import cap04 from './traces/cap-04.json';
import cap05 from './traces/cap-05.json';
import cap06 from './traces/cap-06.json';
import cap07 from './traces/cap-07.json';
import cap08 from './traces/cap-08.json';
import cap09 from './traces/cap-09.json';
import cap10 from './traces/cap-10.json';
import cap11 from './traces/cap-11.json';
import cap12 from './traces/cap-12.json';

export type ExecutionTraceStep = {
  line: number;
  effect: string;
  teaching: string;
  vars: Record<string, string>;
  changed: string[];
  outputNote: string;
};

const TRACES: Record<string, ExecutionTraceStep[]> = {
  'cap-01': cap01 as unknown as ExecutionTraceStep[],
  'cap-02': cap02 as unknown as ExecutionTraceStep[],
  'cap-03': cap03 as unknown as ExecutionTraceStep[],
  'cap-04': cap04 as unknown as ExecutionTraceStep[],
  'cap-05': cap05 as unknown as ExecutionTraceStep[],
  'cap-06': cap06 as unknown as ExecutionTraceStep[],
  'cap-07': cap07 as unknown as ExecutionTraceStep[],
  'cap-08': cap08 as unknown as ExecutionTraceStep[],
  'cap-09': cap09 as unknown as ExecutionTraceStep[],
  'cap-10': cap10 as unknown as ExecutionTraceStep[],
  'cap-11': cap11 as unknown as ExecutionTraceStep[],
  'cap-12': cap12 as unknown as ExecutionTraceStep[],
};

export function getExecutionTrace(projectId: string): ExecutionTraceStep[] | undefined {
  return TRACES[projectId];
}
