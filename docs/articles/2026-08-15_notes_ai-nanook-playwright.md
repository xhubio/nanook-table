# Working notes — "Test automation with Nanook and Playwright in the age of AI"

**Status**: collecting material, written along the way (2026-08-15).
**Deliverables**: (1) news article for the Nanook landing page, (2) short LinkedIn post.
**Language**: English.

> Why these notes exist: they are written *during* the work, not afterwards. What a
> summary throws away first is the concrete — the exact error message, the wrong turn,
> the measurement that ended it. That concrete detail is the only thing that makes an
> article like this credible; without it, it reads like marketing.

---

## The thesis

An AI writes test code faster than any of us. That is precisely why the interesting
question moved somewhere else.

Generating a Playwright spec is no longer the bottleneck. **Deciding what to test, and
holding that decision still, is.** A model asked to "write tests for the login" will
produce something plausible within seconds. Whether it covers the cases that matter,
whether it will still cover them next month, and whether anyone but its author can read
it — those are unanswered.

A decision table answers all three, and it does so in a form a domain expert can read.

**The one-line version**: AI makes writing tests cheap, which makes *specifying* them the
scarce good. A decision table is that specification — in a form both a human and a model
can read.

---

## The strongest argument, and it was discovered by accident

This is the part worth leading with, because it is counter-intuitive and it happened for
real today.

Working through a table of validation rules, the AI adjusted seven expectations to match
what the application actually did. The application accepted a company name of three
spaces; the table said it should be rejected; the AI "fixed" the table.

The correction came back immediately:

> *"If the Excel says we expect a format check, then we expect one. That it isn't
> implemented is a different matter."*

That sentence is the whole argument for keeping the specification outside the code.

A model has a strong pull towards the observable. It sees a failing test and a passing
application and resolves the contradiction in the direction of what it can measure. Left
alone, it converges on *"the tests describe what the software does"* — which is exactly
the thing tests must never become, because then a bug and a feature are indistinguishable.

The table is the fixed point that stops the drift. It states what *should* happen; the
difference between that and reality is the bug list, not an inconsistency to be smoothed
away. And critically: **a human can see the drift**, because the table is a grid of
fields, classes and crosses, not three hundred lines of generated code that nobody diffs.

---

## What actually happened today (the narrative spine)

A single day, one small feature area — registration and login — used to build the whole
structure. Real numbers throughout.

### 1. From fields to equivalence classes

The `User` table: fields (`firstName`, `lastName`, `email`, `password`), each split into
equivalence classes — valid, empty, whitespace only, too long, malformed.

A side effect nobody planned: writing down *"too long"* forces the question **"how long is
too long?"** Nobody knew. Measuring the schema produced this:

| Package | unbounded `text()` | bounded `varchar(n)` |
|---|---:|---:|
| core-backend | **432** | 3 |
| app backend | **318** | 106 |
| customer-backend | **79** | 13 |
| **total (sample)** | **894** | 192 |

The registration form had **no upper bound at all** — neither in the form schema nor in the
database. A whole document could be stored as a user name.

**The point for the article**: the table found this, not a test run. Filling in a cell
labelled "too long" is a question the specification asks you, and you cannot answer it
with a guess. This is a genuinely different failure mode from "write me some tests",
which would have produced a test for a limit that does not exist and passed happily.

### 2. Coverage that lies, and the arithmetic that fixes it

First complete table reported **1168 % coverage**. Not a rounding error — a structural one.

The cause: marking a field as "any valid value" (`a`/`e`) in every column multiplies
combinations that were already counted. The fix is a triangle: a field is open only in the
error columns of fields *before* it, and closed (`x`) from its own block onward. It
telescopes exactly:

```
Σ_i (n_i − 1) · Π_{j>i} n_j  =  C − 1        plus the happy path  ⇒  C
```

After restructuring: exactly **100 %**, 8 of 8 combinations, no duplicates.

Worth quoting honestly in the article — the practitioner's caveat that came with it:

> *"The cascade pattern is only an aid, and it doesn't always work."*

That line matters. A tool that claims a mechanical rule for everything is not believable.
The arithmetic tells you when your table is inconsistent; it does not design the table.

### 3. Naming for machines as well as humans

Descriptive column names (`"email missing"`, `"password too short"`) read beautifully and
are useless the moment a second table wants to reference them — every reference has to
spell them out.

Switching error columns to `E_1 … E_n` allows a **range reference**:

```
ref::User::[E_1-16]        # all sixteen invalid users, one cell
```

Sixteen test cases in one reference. Good names for humans are not automatically good
names for composition — an unglamorous but real lesson.

### 4. Two kinds of table, and the orchestration between them

The insight that took longest and is probably the most transferable:

| | `Execute` | role |
|---|---|---|
| **data tables** (`User`, `CompanyDE`) | `F` | define fields and classes; produce nothing on their own, only referenced |
| **test-case tables** (`Registration`, `Login`) | `T` | define *cases*, not fields; pull classes in by reference |

The registration table therefore contains **no field definitions at all**. It says: session
logged out; a user already exists or does not; the input is valid or invalid — with the
invalid ones arriving as a single range reference. Three rows, four test cases, 100 %
coverage.

And the generalisation that made the writer possible:

> **The secondary-data section *is* the description of the base state.**

Primary data is what the test types in. Secondary data is what must be true beforehand —
which is precisely a base state. The generator does not have to infer it; it reads it off.
A reference in that section says both *which* entity to create and *with which data*. What
it deliberately does not say is *how* — that lives once per entity in the runner. A new
entity means one more row, not a change to the generator.

### 5. Generators compose

`name` is assembled from `firstName` and `lastName`; the email address is built from both
and guaranteed unique — on collision it becomes `max-2.mustermann@…`.

Testing that guarantee required forcing the collision: in a real run faker drew 19
different names and the uniqueness code never once executed. **A guarantee that never
fires is indistinguishable from a broken one.** So the unit test pins the names and demands
three distinct results.

### 6. The bug hunt — the part that shows how AI should actually be used

Generation produced 3 of 7 login cases. Silently. No error.

The instruction was explicit and, in hindsight, decisive:

> *"But first write a unit test that checks this case. Only then the change."*

What followed is the honest version of AI-assisted debugging:

1. First fixture: **red for the wrong reason** — a missing header row meant the parser
   discarded the sheet silently. A red test that fails for an unrelated reason proves
   nothing. Rebuilt against a working fixture.
2. Reproduced the real thing: `Cannot read properties of undefined (reading 'a')`.
3. **Two** defects, not one:
   - the code checked that a referenced *table* existed, then indexed the *instance*
     unchecked;
   - directives inherited from a referenced table had their target re-pointed at the
     aggregating node — including self references, which then resolved against an
     instance that never receives data. Field silently empty, no error.
4. Measured rather than assumed. The decisive evidence was two ids side by side:

   | | instance |
   |---|---|
   | data for `a` stored under | `44c3…` |
   | self reference `b` pointing at | `461b…` |

5. First attempted fix restored a violated invariant but did **not** fix the symptom —
   reverted, kept the diff to the two real corrections.
6. 197 tests green, published, and the original symptom measured again end to end:
   **3 → 7 of 7 cases.**

Also worth telling: the reason both defects had survived so long. The library catches the
error and logs it — to a logger instance the test harness never reads. **The measuring
instrument was blind.** Not an exotic failure; the most ordinary one there is.

### 7. Publishing, as a small bonus story

Getting the fix out revealed that releases had been failing since June. Three separate
causes stacked:

| symptom | cause |
|---|---|
| `404 package not found` on OIDC exchange | no trusted publisher configured |
| fallback to `EINVALIDNPMTOKEN` | runner had npm 10.34.5; OIDC needs ≥ 11.5.1 |
| `422 Unprocessable Entity` | `package.json` had no `repository` field |

The third is the nice one: provenance signs the building repository and compares it against
`package.json`. Token-based publishing generates no provenance, so a missing field went
unnoticed for years — and then surfaces as a *signature* error the moment you switch to
OIDC. Might be a separate short post.

---

## Structure for the news article (~900–1200 words)

1. **Hook** — AI writes tests in seconds. Why that made the problem harder, not easier.
2. **The drift** — the seven "corrected" expectations and the sentence that reversed them.
   Tests must describe what should happen, not what does.
3. **What a decision table is** — fields, equivalence classes, cases; one small readable
   grid. Show the registration table: 3 rows, 4 cases, 100 %.
4. **Composition** — data tables vs test-case tables; range references; secondary data as
   base state. This is the part that scales beyond a toy example.
5. **Where the arithmetic helps** — 1168 % → 100 %, with the honest caveat.
6. **What the AI is genuinely good at** — generators, scaffolding, chasing a defect through
   an object graph, keeping 197 tests green. Fast, tireless, and *bounded by the table*.
7. **Close** — the table is the shared language between domain expert, developer and model.
   Everything downstream is derived; the table is the thing you maintain.

## Structure for LinkedIn (~150–200 words)

Lead with the correction — it is the hook. Then: the drift is structural, not a slip; a
model resolves "test fails, app passes" towards what it can observe. The table is the fixed
point. One concrete number as proof (894 unbounded columns found by a cell labelled "too
long", or 3 → 7 cases). Close with the thesis line: *writing tests got cheap; specifying
them didn't.*

No feature list, no tool comparison.

---

---

## Added later the same day — the part that turned out to be the real story

Everything above was written before the tests actually ran. What follows happened
afterwards and is stronger material, because it is about the tests *failing for the
wrong reasons* — three times in a row.

### The instrument lies, and it lies plausibly

**First browser run: 18 of 18 red.** Including the happy path.

That last detail is the whole lesson. Eighteen red tests look like a damning verdict on the
application. But if the *valid* case fails too, the verdict is about the measuring
instrument. The cause: a cookie banner — `role="dialog"`, layered over the page,
intercepting every click. Twenty minutes of runtime, zero statements about the software.

It happened again twice, in different forms:

| Symptom | Looked like | Actually was |
|---|---|---|
| 18/18 red | the app is broken | cookie banner over the page |
| `firstName` unknown | the table is wrong | the form composes `name`; a real boundary property |
| unknown path `email` | the runner is broken | the suite carries the generator *value*, not the class *name* |

**The rule that came out of it**: an all-red result is not a finding, it is a suspicion —
about yourself. This is the single most transferable thing from the whole day, and it
applies to AI-written tests specifically: a model will happily generate a hundred tests
that all fail for one shared, invisible reason, and the failure list reads like diligence.

### What a green measurement is worth

After the fix: **10 green, 10 red, 43 seconds.** Now the red ones mean something, and they
sort into four distinct causes — that separation is the product:

- 5 cases: the form accepts what it should reject (whitespace-only name, no length limits)
- 3 cases: the server accepts what it should reject — including **the same email address
  twice**
- 1 case: `Password too long` — the server rejects it, but the **form** was supposed to.
  The rule exists; it just lives one layer further back than anyone assumed.
- 1 case: Apple cannot be reached through the UI at all

That fourth one is worth its own paragraph.

### The finding nobody was looking for

Registration was extended so an existing account can come from three places — password
registration, Google, or Apple — and the test tries to register *again* over a different
provider. Expected: rejection. `user.email` is `UNIQUE`, so two accounts on one address
cannot exist; only "link" or "refuse" are possible outcomes.

Enabling Apple in the backend turned out to be one config entry plus a mock provider. And
then the test said something nobody had asked:

> `Weg "apple" nicht bedienbar — die Oberflaeche bietet Apple nicht an.
>  Das Backend kennt Apple, die Maske nicht.`

The backend can do it. There is no button. That is not a bug report a human would have
filed, because nobody looks for a feature they never saw — it fell out of a table that
enumerated the possibilities systematically.

### And the one that is genuinely serious

Registering the same email address twice returns **200 twice, with two different user ids**.
Both boundaries agree — API and browser.

Checked before reporting, because the obvious explanation would have been a missing
constraint:

| checked | result |
|---|---|
| schema definition | `user_email_key UNIQUE (email)` |
| running database | constraint present in all six schemas |
| stored data | **no** duplicate addresses, 60 users |

So the row is *not* written twice — but the client is told it succeeded. For a user that is
indistinguishable from a bug: they believe they have an account.

💡 **For the article**: this is what "the table found it" looks like in practice. Not a
clever assertion — a cell that says *"an address that is already taken"*, which somebody had
to fill in, and which no amount of "write me some tests for registration" produces.

### A smaller one, for flavour

Publishing the fix revealed that releases had been failing since June. Three stacked causes,
and the third is the nice one: trusted publishing signs the building repository and compares
it against `package.json`. Token publishing generates no provenance, so a **missing
`repository` field** went unnoticed for years — then surfaced as a *signature* error the
moment the project switched to OIDC. Possibly its own short post.

---

## Open / to add before writing

- [ ] Screenshot of the registration table (small, readable — the 100 % row visible)
- [ ] Decide whether the OIDC story is a footnote here or its own post
- [ ] One sentence on where Playwright actually enters: the table produces data, the specs
      are generic functions per page — no generated `.spec.ts`
- [ ] Check the numbers once more against the repos before publishing
