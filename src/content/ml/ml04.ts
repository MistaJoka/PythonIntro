import type { Lesson } from '../schema';
import { GENERATE_DF } from './data';

/**
 * ML Bridge — Session 5: the first supervised model.
 *
 * Scope is deliberately narrow: X/y, a split, fit, predict, score, and the one
 * result that matters more than the score itself — that training accuracy and
 * test accuracy are different numbers, and only one of them is a claim about
 * the future.
 */

const ML_STARTER = `${GENERATE_DF}\n\n`;

export const ml04: Lesson = {
  id: 'ml04',
  title: 'The First Model',
  subtitle: 'X, y, split, fit, predict — and why the split exists',
  objectives: [
    'Separate features (X) from target (y) and say what each one is',
    'Split data so the reported score means something',
    'Train a classifier and score it on data it never saw',
    'Recognise overfitting from the gap between train and test accuracy',
  ],
  concepts: [
    {
      id: 'ml4-c1',
      title: 'Features and target',
      objective: 'Name the evidence and the answer.',
      miniNote:
        'X is what the model is allowed to look at. y is what it is trying to say. Anything in X that encodes y is cheating.',
      examples: [
        {
          id: 'ml4-c1-e1',
          type: 'multipleChoice',
          stage: 'see',
          tags: ['labelLeakage'],
          prompt:
            'You are predicting `fraud` from the transaction table. Which set of columns belongs ' +
            'in X?',
          options: [
            'amount, failed_attempts and fraud',
            'id, customer, amount, failed_attempts',
            'amount and failed_attempts',
            'fraud only',
          ],
          answerIndex: 2,
          explanation:
            'X holds the evidence available before the answer is known. Including fraud puts the ' +
            'answer in the question. Including id or customer is nearly as bad in a different way: ' +
            'they are unique identifiers, so a tree can memorise individual rows instead of ' +
            'learning a pattern that transfers.',
          trapNote:
            'Leakage rarely looks like a mistake. It looks like a model that suddenly got very good.',
        },
        {
          id: 'ml4-c1-e2',
          type: 'codeChallenge',
          stage: 'build',
          tags: ['labelLeakage', 'trainTestSplit'],
          requires: ['pandas', 'numpy', 'scikit-learn'],
          prompt:
            'Build X (amount and failed_attempts, in that order) and y (fraud). Then split them ' +
            '80/20 with random_state=42, stratified on y, into X_train, X_test, y_train, y_test.',
          starterCode:
            `${ML_STARTER}from sklearn.model_selection import train_test_split\n\n` +
            '# Define X and y, then split into X_train, X_test, y_train, y_test.\n',
          tests: [
            'assert list(X.columns) == ["amount", "failed_attempts"], f"X should hold exactly those two features, got {list(X.columns)}"',
            'assert "fraud" not in X.columns, "the target must never appear in X"',
            'assert len(X_train) == 320 and len(X_test) == 80, f"expected an 80/20 split, got {len(X_train)}/{len(X_test)}"',
            '_train_rate = y_train.mean()',
            '_test_rate = y_test.mean()',
            'assert abs(_train_rate - _test_rate) < 0.02, f"stratify=y should keep the fraud rate even; got {_train_rate:.3f} vs {_test_rate:.3f}"',
          ],
          solutionHint:
            'X = df[["amount", "failed_attempts"]]; y = df["fraud"]; then unpack the four return ' +
            'values of train_test_split(X, y, test_size=0.2, random_state=42, stratify=y).',
          explanation:
            'stratify=y keeps the fraud proportion the same on both sides of the split. Without it ' +
            'a random split can hand you a test set with an unrepresentative share of fraud, and ' +
            'the score you report is then partly luck.',
          trapNote:
            'train_test_split returns four values in the order X_train, X_test, y_train, y_test. ' +
            'Swapping the middle two is a classic error that produces confusing shapes later.',
        },
      ],
    },
    {
      id: 'ml4-c2',
      title: 'Fit, predict, and the gap',
      objective: 'Train a model, then find out what its score is worth.',
      miniNote:
        'Accuracy on data the model trained on is a memory test. Accuracy on held-out data is a prediction.',
      examples: [
        {
          id: 'ml4-c2-e1',
          type: 'codeChallenge',
          stage: 'build',
          tags: ['trainTestSplit', 'overfitting'],
          requires: ['pandas', 'numpy', 'scikit-learn'],
          prompt:
            'The split is done. Train a DecisionTreeClassifier(random_state=42) on the training ' +
            'data, then print "train: 0.99" and "test: 0.99" — its accuracy on each set, to two ' +
            'decimal places.',
          starterCode:
            `${ML_STARTER}from sklearn.model_selection import train_test_split\n` +
            'from sklearn.tree import DecisionTreeClassifier\n' +
            'from sklearn.metrics import accuracy_score\n\n' +
            'X = df[["amount", "failed_attempts"]]\n' +
            'y = df["fraud"]\n' +
            'X_train, X_test, y_train, y_test = train_test_split(\n' +
            '    X, y, test_size=0.2, random_state=42, stratify=y\n' +
            ')\n\n' +
            '# Train the model, then print its train and test accuracy.\n',
          tests: [
            'import re',
            '_tr = re.search(r"train:\\s*([0-9.]+)", _stdout)',
            '_te = re.search(r"test:\\s*([0-9.]+)", _stdout)',
            'assert _tr and _te, f"expected lines like \'train: 1.00\' and \'test: 0.70\'; got: {_stdout!r}"',
            '_train_acc, _test_acc = float(_tr.group(1)), float(_te.group(1))',
            'assert _train_acc > 0.98, f"an unconstrained tree should nearly memorise the training set; got {_train_acc}"',
            'assert 0.5 < _test_acc < 0.95, f"test accuracy should be clearly better than chance but far from perfect; got {_test_acc}"',
            'assert _train_acc - _test_acc > 0.1, f"expected a visible overfitting gap; got {_train_acc - _test_acc:.3f}"',
          ],
          solutionHint:
            'model = DecisionTreeClassifier(random_state=42).fit(X_train, y_train), then call ' +
            'accuracy_score twice — once against y_train, once against y_test.',
          explanation:
            'An unconstrained tree keeps splitting until it isolates the training rows, so it scores ' +
            'near 1.00 on data it has already seen. The test score is much lower. Only the second ' +
            'number is a claim about transactions the model has never met.',
          trapNote:
            'If you report only the training score, every model looks excellent. That is the number ' +
            'that flatters you and tells you nothing.',
        },
        {
          id: 'ml4-c2-e2',
          type: 'codeChallenge',
          stage: 'stretch',
          tags: ['overfitting'],
          requires: ['pandas', 'numpy', 'scikit-learn'],
          prompt:
            'Show that constraining the tree helps. Train one tree with max_depth=3 and print ' +
            '"depth3 test: 0.76" alongside "depth3 gap: 0.01" — its test accuracy, and its ' +
            'train-minus-test gap, to two decimals.',
          starterCode:
            `${ML_STARTER}from sklearn.model_selection import train_test_split\n` +
            'from sklearn.tree import DecisionTreeClassifier\n' +
            'from sklearn.metrics import accuracy_score\n\n' +
            'X = df[["amount", "failed_attempts"]]\n' +
            'y = df["fraud"]\n' +
            'X_train, X_test, y_train, y_test = train_test_split(\n' +
            '    X, y, test_size=0.2, random_state=42, stratify=y\n' +
            ')\n\n' +
            '# Train a depth-3 tree; print its test accuracy and its train-test gap.\n',
          tests: [
            'import re',
            '_t = re.search(r"depth3 test:\\s*([0-9.]+)", _stdout)',
            '_g = re.search(r"depth3 gap:\\s*(-?[0-9.]+)", _stdout)',
            'assert _t and _g, f"expected \'depth3 test: ...\' and \'depth3 gap: ...\'; got: {_stdout!r}"',
            'assert 0.6 < float(_t.group(1)) < 0.95, f"unexpected depth-3 test accuracy: {_t.group(1)}"',
            'assert abs(float(_g.group(1))) < 0.1, f"a depth-3 tree should generalise far more evenly; gap was {_g.group(1)}"',
          ],
          solutionHint:
            'Same as before, but pass max_depth=3. The gap is train accuracy minus test accuracy.',
          explanation:
            'Limiting depth stops the tree carving out single-row regions. Training accuracy falls, ' +
            'test accuracy holds up, and the gap nearly closes — the model got worse at remembering ' +
            'and better at generalising. That trade is the whole of the bias-variance story you will ' +
            'meet formally later.',
        },
      ],
    },
  ],
  lessonCheck: [
    {
      id: 'ml4-check-1',
      type: 'multipleChoice',
      stage: 'try',
      tags: ['overfitting', 'trainTestSplit'],
      prompt:
        'A classmate reports 100% accuracy on the fraud data. What is the most likely explanation?',
      options: [
        'They scored the model on the same rows it trained on, or left the answer in X',
        'Their model is genuinely perfect and ready to deploy',
        'They used too few features',
        'They forgot to set random_state',
      ],
      answerIndex: 0,
      explanation:
        'On data with genuine class overlap, 100% is a symptom, not an achievement. The two usual ' +
        'causes are scoring on the training set and leakage — a column in X that encodes y.',
    },
  ],
};
