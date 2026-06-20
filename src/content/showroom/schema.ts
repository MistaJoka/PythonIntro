export interface ShowroomAnnotation {
  /** Annotation block appears after this 1-based line number. */
  afterLine: number;
  /** Short technique label shown in amber, e.g. "Generator expression". */
  technique: string;
  /** 1-2 sentences explaining why/how this technique is used here. */
  explanation: string;
}

export interface ShowroomProgram {
  id: string;
  title: string;
  /** One sentence — used on the card and in the detail header. */
  description: string;
  difficulty: 'intermediate' | 'advanced';
  /** Tag chips displayed on the card. */
  techniques: string[];
  /** Full Python program source. */
  code: string;
  annotations: ShowroomAnnotation[];
}
