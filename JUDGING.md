# DOGFOOD OS — Judging & Scoring Engine Specification

## 1. Score Calculation Formulas

### 1.1 Ballot Weighted Score
For a given judge $j$ and project $p$:

$$\text{weighted\_ballot}_{j,p} = \sum_{c=1}^{C} \left( \text{score}_{j,p,c} \times w_c \right)$$

where $\sum_{c=1}^{C} w_c = 1.0$, and $\text{score} \in [1.0, 10.0]$.

### 1.2 Raw Project Aggregation
The unadjusted baseline score is the mean across all complete submitted ballots ($J_p$):

$$\text{raw\_score}_p = \frac{1}{|J_p|} \sum_{j \in J_p} \text{weighted\_ballot}_{j,p}$$

---

## 2. Normalization Methods

### 2.1 Anchor Calibration Protocol
Before live reviews, judges evaluate 3 organizer-approved anchor submissions spanning performance tiers:
- **Anchor Alpha (Weak)**: Incomplete error handling, ungrounded vanity claims.
- **Anchor Beta (Typical)**: Clean implementation, standard test suite, solid documentation.
- **Anchor Gamma (Strong)**: Formally verified, stress-tested benchmarks, zero-network reproducibility.

The judge's systematic calibration bias $\Delta_j$ is calculated as:

$$\Delta_j = \frac{1}{|A|} \sum_{a \in A} \left( \text{score}_{j,a} - \text{target\_score}_a \right)$$

- $\Delta_j < -0.4$: Systematically Harsh.
- $\Delta_j > +0.4$: Systematically Lenient.
- $\Delta_j \in [-0.4, +0.4]$: Neutral Alignment.

### 2.2 Anchor-Normalized Scoring
When enabled by organizers, each judge's score is adjusted by their measured bias:

$$\text{score}^{\text{norm}}_{j,p,c} = \text{clamp}\left(\text{score}_{j,p,c} - \Delta_j, \, \text{min}_c, \, \text{max}_c \right)$$

---

## 3. Disagreement Routing & Uncertainty Engine

A project is flagged for **Targeted Adaptive Review** when any of the following conditions hold:

1. **Score Standard Deviation**:
   $$\sigma_p = \sqrt{\frac{1}{|J_p|} \sum_{j \in J_p} (\text{weighted\_ballot}_{j,p} - \bar{s}_p)^2} \ge \tau_{\text{disagree}}$$
   where default threshold $\tau_{\text{disagree}} = 1.5$.
2. **Criterion Spread**:
   $$\max_{j} (\text{score}_{j,p,c}) - \min_{j} (\text{score}_{j,p,c}) \ge 4.0$$
3. **Outlier Ballot Detection**:
   One ballot deviates by $> 2.0\sigma$ from the project's peer mean.

### Adaptive Dispatch Action
When flagged, the system automatically assigns an eligible, conflict-free judge whose reliability score $\ge 0.90$, logging an explicit auditable reason:
> *"High criterion dispersion ($\sigma = 2.4 \ge 1.5$) among primary ballots. Targeted 4th review dispatched to resolve uncertainty without overwriting raw ballots."*

---

## 4. Weight Sensitivity Sandbox

The sandbox enables organizers to test alternative criteria weights $\{w_1', w_2', w_3', w_4'\}$ in real-time.

- **Non-Mutation Invariant**: Running a weight simulation executes strictly in memory or in transient queries. It **NEVER** mutates or overwrites saved `RankingRun` records.
- **Rank Delta Calculation**:
  $$\Delta \text{rank}_p = \text{rank}^{\text{baseline}}_p - \text{rank}^{\text{simulated}}_p$$
- **Fragile Rank Flag**: Marked when $|\Delta \text{rank}_p| \ge 2$, warning organizers that podium placements are sensitive to minor weight shifts.
