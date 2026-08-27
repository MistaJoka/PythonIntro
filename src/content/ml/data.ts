/**
 * Shared Transaction Risk Lab data for the ML bridge tier.
 *
 * Two tiers, deliberately:
 *
 *  - SAMPLE_CSV is small enough to check by hand, so early challenges can be
 *    reasoned about rather than trusted. It carries one malformed row, because
 *    "CSV values arrive as strings and some of them are junk" is the actual
 *    lesson of file-loading.
 *  - GENERATE_DF builds ~400 rows for the statistics and modelling work. Five
 *    rows cannot support a stratified train/test split, and a one-row test set
 *    reports accuracy of exactly 0.0 or 1.0 — which teaches a learner that a
 *    meaningless result looks like success.
 *
 * Everything is embedded as source text rather than shipped as .csv assets:
 * challenges execute in Pyodide, whose filesystem is virtual, so the honest
 * move is to write the file from the challenge itself and then read it back
 * with the real pandas API.
 */

/** Canonical rows + Fatima (large but legitimate) + Frank (unparseable amount). */
export const SAMPLE_CSV = [
  'id,customer,amount,country,failed_attempts,fraud',
  '1,Alice,45.50,US,0,False',
  '2,Bob,1800.00,US,4,True',
  '3,Carlos,220.25,BR,1,False',
  '4,Dana,3200.00,US,6,True',
  '5,Eli,88.99,CA,0,False',
  '6,Fatima,3100.00,US,1,False',
  '7,Frank,INVALID,US,2,False',
].join('\n');

/**
 * Writes the sample CSV to Pyodide's virtual filesystem so a challenge can use
 * the genuine `pd.read_csv("transactions.csv")` call rather than a StringIO
 * stand-in that would quietly teach the wrong API.
 */
export const WRITE_SAMPLE_CSV = [
  'from pathlib import Path',
  '',
  'CSV_TEXT = """' + SAMPLE_CSV + '"""',
  'Path("transactions.csv").write_text(CSV_TEXT)',
].join('\n');

/**
 * Seeded 400-row generator. `overlap` deliberately makes ~25% of rows behave
 * like the opposite class: some fraud looks ordinary, some legitimate spending
 * looks alarming. Without that ambiguity a decision tree separates the classes
 * perfectly and the model-evaluation lesson has nothing to teach.
 */
export const GENERATE_DF = [
  'import numpy as np',
  'import pandas as pd',
  '',
  'rng = np.random.default_rng(42)',
  'n = 400',
  'fraud = rng.random(n) < 0.35',
  '',
  '# Base signal: fraud skews high-value with repeated failures.',
  'amount = np.where(fraud, rng.uniform(700, 4000, n), rng.uniform(10, 1200, n))',
  'failed = np.where(fraud, rng.integers(2, 8, n), rng.integers(0, 4, n))',
  '',
  '# Deliberate ambiguity, so the problem is not trivially separable.',
  'confuse = rng.random(n) < 0.25',
  'amount = np.where(confuse & fraud, rng.uniform(20, 800, n), amount)',
  'failed = np.where(confuse & fraud, rng.integers(0, 3, n), failed)',
  'amount = np.where(confuse & ~fraud, rng.uniform(1000, 3500, n), amount)',
  'failed = np.where(confuse & ~fraud, rng.integers(3, 7, n), failed)',
  '',
  'df = pd.DataFrame({',
  '    "id": np.arange(1, n + 1),',
  '    "customer": [f"cust_{i:03d}" for i in range(n)],',
  '    "amount": amount.round(2),',
  '    "country": rng.choice(["US", "BR", "CA"], n, p=[0.6, 0.25, 0.15]),',
  '    "failed_attempts": failed,',
  '    "fraud": fraud,',
  '})',
].join('\n');
