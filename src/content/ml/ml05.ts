import type { Lesson } from '../schema';
import { WRITE_SAMPLE_CSV, GENERATE_DF } from './data';

/**
 * ML Bridge — Capstone: Transaction Risk Analyzer.
 *
 * Condenses the handoff's 20 requirements into four staged builds that each
 * produce something real: clean data, a written report, a picture, a model.
 * Nothing new is introduced — this is the tier's material used at once, which
 * is the only honest test of whether it stuck.
 */

const REPORT_STARTER = `${WRITE_SAMPLE_CSV}\n\nimport pandas as pd\nfrom pathlib import Path\n\n`;

export const ml05: Lesson = {
  id: 'ml05',
  title: 'Capstone — Transaction Risk Analyzer',
  subtitle: 'Load, clean, analyse, report, model — the whole pipeline',
  objectives: [
    'Turn a messy CSV into a trustworthy DataFrame',
    'Produce the summary statistics a reviewer would ask for',
    'Apply a rule-based risk filter and write a report file',
    'Train and honestly evaluate a classifier on the same data',
  ],
  concepts: [
    {
      id: 'ml5-c1',
      title: 'Stage 1 — load and clean',
      objective: 'Get from raw file to usable table, losing only what is genuinely unusable.',
      miniNote: 'Everything downstream inherits the mistakes you make here.',
      examples: [
        {
          id: 'ml5-c1-e1',
          type: 'codeChallenge',
          stage: 'build',
          tags: ['jsonCsv', 'typeCoercion'],
          requires: ['pandas'],
          prompt:
            'Write load_clean(path) that reads the CSV, converts amount to numeric and ' +
            'failed_attempts to integers, drops rows whose amount could not be parsed, and returns ' +
            'the cleaned DataFrame.',
          starterCode:
            `${REPORT_STARTER}def load_clean(path):\n` +
            '    # Read, coerce types, drop unusable rows, return the frame.\n' +
            '    pass\n',
          tests: [
            'out = load_clean("transactions.csv")',
            'assert out is not None, "load_clean returned None — did you use return?"',
            'assert len(out) == 6, f"expected 6 usable rows out of 7, got {len(out)}"',
            'assert str(out["amount"].dtype).startswith("float"), "amount must be numeric"',
            'assert str(out["failed_attempts"].dtype).startswith("int"), "failed_attempts must be an integer dtype"',
            'assert "Frank" not in list(out["customer"]), "the unparseable row should be dropped"',
          ],
          solutionHint:
            'pd.read_csv, then pd.to_numeric(..., errors="coerce") on amount, dropna(subset=["amount"]), ' +
            'and .astype(int) on failed_attempts.',
          explanation:
            'Coercing before dropping keeps the decision explicit. Casting failed_attempts to int ' +
            'matters because a column that still contains NaN stays float — and a float count is a ' +
            'sign something upstream went wrong.',
        },
      ],
    },
    {
      id: 'ml5-c2',
      title: 'Stage 2 — analyse and report',
      objective: 'Answer the questions a reviewer will actually ask, then write them down.',
      miniNote: 'A report file is the deliverable. Printing to a screen nobody kept is not.',
      examples: [
        {
          id: 'ml5-c2-e1',
          type: 'codeChallenge',
          stage: 'build',
          tags: ['dataFrameIndexing'],
          requires: ['pandas'],
          prompt:
            'df is loaded and clean. Write summarise(df) returning a dict with keys total, mean, ' +
            'median, by_country (a country -> count dict), high_value (count of amount > 1000) and ' +
            'repeat_failures (count of failed_attempts >= 3).',
          starterCode:
            `${REPORT_STARTER}df = pd.read_csv("transactions.csv")\n` +
            'df["amount"] = pd.to_numeric(df["amount"], errors="coerce")\n' +
            'df = df.dropna(subset=["amount"])\n\n\n' +
            'def summarise(df):\n' +
            '    # Return the six summary values as a dict.\n' +
            '    pass\n',
          tests: [
            's = summarise(df)',
            'assert s is not None, "summarise returned None — did you use return?"',
            'assert abs(s["total"] - 8454.74) < 0.01, f"total should be 8454.74, got {s[\'total\']}"',
            'assert abs(s["mean"] - 1409.1233) < 0.01, f"mean should be ~1409.12, got {s[\'mean\']}"',
            'assert abs(s["median"] - 1010.125) < 0.01, f"median should be ~1010.13, got {s[\'median\']}"',
            'assert s["by_country"] == {"US": 4, "BR": 1, "CA": 1}, f"by_country wrong: {s[\'by_country\']}"',
            'assert s["high_value"] == 3, f"3 rows exceed 1000, got {s[\'high_value\']}"',
            'assert s["repeat_failures"] == 2, f"2 rows have >= 3 failures, got {s[\'repeat_failures\']}"',
          ],
          solutionHint:
            'value_counts().to_dict() gives by_country. For the counts, sum a boolean mask — ' +
            'int((df["amount"] > 1000).sum()).',
          explanation:
            'Mean well above median again signals right-skew. Note high_value (3) and ' +
            'repeat_failures (2) disagree: Fatima is a large purchase with no failure history, ' +
            'which is exactly the row a single-rule filter gets wrong.',
        },
        {
          id: 'ml5-c2-e2',
          type: 'codeChallenge',
          stage: 'build',
          tags: ['fileMode', 'dataFrameIndexing'],
          requires: ['pandas'],
          prompt:
            'Apply the rule "amount > 1000 AND failed_attempts >= 3" and write risk_report.txt ' +
            'containing one line per flagged customer in the form "Bob: 1800.00". Then print ' +
            '"flagged: N".',
          starterCode:
            `${REPORT_STARTER}Path("risk_report.txt").unlink(missing_ok=True)\n\n` +
            'df = pd.read_csv("transactions.csv")\n' +
            'df["amount"] = pd.to_numeric(df["amount"], errors="coerce")\n' +
            'df = df.dropna(subset=["amount"])\n\n' +
            '# Flag risky rows, write risk_report.txt, print the count.\n',
          tests: [
            'assert Path("risk_report.txt").exists(), "no risk_report.txt was written"',
            '_text = Path("risk_report.txt").read_text()',
            'assert "Bob: 1800.00" in _text, f"expected a line \'Bob: 1800.00\'; got: {_text!r}"',
            'assert "Dana: 3200.00" in _text, f"expected a line \'Dana: 3200.00\'; got: {_text!r}"',
            'assert "Fatima" not in _text, "Fatima spent a lot but failed only once — the AND rule must exclude her"',
            'assert "flagged: 2" in _stdout, f"expected \'flagged: 2\'; got: {_stdout!r}"',
          ],
          solutionHint:
            'Build the mask, iterate the flagged rows with .iterrows() or zip of two columns, and ' +
            'join the lines before Path(...).write_text(...).',
          explanation:
            'The report is the artefact a human reads, so its format is part of the requirement. ' +
            'Excluding Fatima is the point of the AND: a rule on amount alone would have flagged a ' +
            'legitimate customer.',
        },
      ],
    },
    {
      id: 'ml5-c3',
      title: 'Stage 3 — model it',
      objective: 'Replace the hand-written rule with a learned one, and check it honestly.',
      miniNote:
        'The rule is a baseline. A model earns its place only by beating it on data it never saw.',
      examples: [
        {
          id: 'ml5-c3-e1',
          type: 'codeChallenge',
          stage: 'stretch',
          tags: ['trainTestSplit', 'overfitting', 'labelLeakage'],
          requires: ['pandas', 'numpy', 'scikit-learn'],
          prompt:
            'On the 400-row dataset: build X/y, split 80/20 stratified with random_state=42, train ' +
            'a DecisionTreeClassifier(random_state=42, max_depth=3), and print "model: 0.76" and ' +
            '"rule: 0.70" — the model\'s test accuracy and the accuracy of the hand-written rule ' +
            '(amount > 1000 AND failed_attempts >= 3) on the same test rows.',
          starterCode:
            `${GENERATE_DF}\n\nfrom sklearn.model_selection import train_test_split\n` +
            'from sklearn.tree import DecisionTreeClassifier\n' +
            'from sklearn.metrics import accuracy_score\n\n' +
            '# Compare the learned model against the hand-written rule on the SAME test rows.\n',
          tests: [
            'import re',
            '_m = re.search(r"model:\\s*([0-9.]+)", _stdout)',
            '_r = re.search(r"rule:\\s*([0-9.]+)", _stdout)',
            'assert _m and _r, f"expected \'model: ...\' and \'rule: ...\'; got: {_stdout!r}"',
            '_model_acc, _rule_acc = float(_m.group(1)), float(_r.group(1))',
            'assert 0.6 < _model_acc < 0.95, f"unexpected model accuracy: {_model_acc}"',
            'assert 0.4 < _rule_acc < 0.95, f"unexpected rule accuracy: {_rule_acc}"',
            'assert _model_acc >= _rule_acc, f"the depth-3 model should at least match the rule; got model={_model_acc}, rule={_rule_acc}"',
          ],
          solutionHint:
            'Score the rule with accuracy_score(y_test, rule_predictions) where rule_predictions is ' +
            'the boolean mask evaluated on X_test.',
          explanation:
            'Comparing against a baseline is what makes an accuracy number meaningful. A model that ' +
            'cannot beat two hand-written comparisons has not earned the complexity it adds — and ' +
            'you only discover that by measuring both on the same held-out rows.',
          trapNote:
            'Score the rule on X_test, not the whole dataset. Comparing a model\'s test score with ' +
            'a rule\'s full-dataset score is not a comparison at all.',
        },
      ],
    },
  ],
  lessonCheck: [
    {
      id: 'ml5-check-1',
      type: 'multipleChoice',
      stage: 'try',
      tags: ['overfitting', 'trainTestSplit'],
      prompt:
        'Your analyser reports 0.76 test accuracy, and the hand-written rule scores 0.70 on the ' +
        'same rows. What is the honest conclusion?',
      options: [
        'The model adds a modest, real improvement over the rule on unseen data',
        'The model is 76% likely to be correct about any future transaction',
        'The rule should be deleted because the model is strictly better',
        'The model is overfitting, since 0.76 is well below 1.00',
      ],
      answerIndex: 0,
      explanation:
        'Accuracy is measured on one held-out sample, so it estimates performance on similar data ' +
        'rather than guaranteeing a per-transaction probability. A six-point gain over a two-line ' +
        'rule is real but modest — worth reporting precisely, not overselling.',
    },
  ],
};
