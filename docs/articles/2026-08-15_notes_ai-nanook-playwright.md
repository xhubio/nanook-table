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

### The coverage number is the wrong question — and chasing it costs a day

Late addition, and it may be the most useful paragraph for anyone who copies this approach.

The tables report a coverage percentage. It is seductive, because it is a number and it goes up.
It is also, on its own, close to worthless: it counts a class as covered the moment it is marked
`a` or `e` — "any of these" — even though the generator will then pick the *preferred* one and
that class is **never produced**.

Measured: one table sat at **99.2 %** with **six classes that had no test case at all**. Among
them the plain raster logo — the common path. Only SVG, the exception, was being exercised.

Then the attempt to reach 100 % by opening the happy path the same way. It failed three times over:

| expected | measured |
|---|---|
| each run picks a different valid value | identical values — `e` means "only if no `a`", and `a` always wins |
| coverage rises to 100 % | +0.2 points |
| no downside | four classes lost their own test case immediately |

The structural reason: only an *error* column may open all following fields — it may, because
something upstream already fails. A *good* column can open only the **valid** alternatives;
opening an invalid one would claim that a bad value still yields a good result. So the moment a
field has a legitimate alternative (`logo: none|png|svg`), the cheap arithmetic stops working.

🔴 **And here the author was corrected, which is worth putting in the article rather than hiding.**
The conclusion drawn from that was "100 % is therefore not always reachable". Wrong. What stops
working is the *shortcut*, not the goal. Full coverage stays reachable — you simply pay in
**columns** instead of in an identity: reorder so fields with valid alternatives come last, or
enumerate the missing combinations outright. Always possible, sometimes a lot of work.

That distinction matters for the article's thesis: the arithmetic tells you what a table costs.
It does not tell you what is possible — and mistaking the first for the second is how a tool
starts making decisions that belong to a person.

💡 **The replacement question**: *does every class have its own test case?* That one produces an
action. A twenty-line checker answers it — and on its very first run it found a gap in the table
the author had written ten minutes earlier.

**Also worth the article**: the same checker caught the author's own regression two minutes later.
That is the real argument for small, sharp tools over big coverage dashboards.

---

## Later still — the two additions that sharpen the thesis

### "Write me the tests" versus knowing which button exists

Building the page function for the company form meant reading every test id out of the
component. It turned out the form uses **two naming conventions at once**: five ids as
`org-form-*`, twenty-five as `organization-form-*`. The company name is `org-form-name`;
`organization-form-input-name` — the one any reasonable person would guess — **does not exist**.

And it had been guessed before: that exact id once sat in a test in this codebase, behind an
`isVisible()` guard. The test was green and typed nothing.

💡 **This is the sharpest small illustration of the whole thesis.** A model asked to "write a
test for the company form" will produce `organization-form-input-name` with complete confidence,
because it is the *consistent* name — the one the convention implies. The application is
inconsistent, and only looking finds that. Generating the test was never the hard part.

### The base state is where the honesty happens

Logging in for a test looked like two API calls. It is three, and the middle one is not
optional: this stack requires email verification, so sign-up returns no session token and
sign-in answers `403 EMAIL_NOT_VERIFIED`. The base state has to fetch the confirmation link out
of the mock mailbox and follow it — the same thing a user does.

Two further stumbles, both the same shape as the cookie banner earlier:

- the mail mock was **not** on the port everyone assumes: fourteen mails sat on `:4000` and the
  wanted one on `:50518`, because a QA run starts its own mock on a free port
- the mock's response is `{ data, total, limit, offset }`; the first implementation read
  `emails` and reported "0 mails" while the same URL returned 28

Neither is interesting on its own. Together they make the point: **the base state is the part of
a test that lies most convincingly**, because when it fails silently, everything above it fails
in ways that look like application defects. That is why it now verifies itself — and why the
verification was checked against a *missing* session first, to prove it can fail.

## Open / to add before writing

- [ ] Screenshot of the registration table (small, readable — the 100 % row visible)
- [ ] Decide whether the OIDC story is a footnote here or its own post
- [ ] One sentence on where Playwright actually enters: the table produces data, the specs
      are generic functions per page — no generated `.spec.ts`
- [ ] Check the numbers once more against the repos before publishing

---

## Night of 2026-08-15/16 — four more, and the third one is the article's ending

### An instrument with two states cannot report a third

The company form check knew two answers: *rejected* or *accepted*. It decided by looking for an
error marker on a field; no marker meant accepted.

That is a lie by omission, and it hid the most serious finding of the whole exercise. Two fields —
the legal name and the phone number — have length rules in the schema and **no error display at
all**. Submit is blocked, nothing is shown. The user presses Save and the application does nothing.

To the two-state instrument that is indistinguishable from success. Adding a third outcome —
`silent` — made it visible on the first run, in every one of the sixteen countries at once,
because the fields live in a shared component.

The general form: **the set of outcomes your instrument can express is the ceiling on what it can
tell you.** Not the assertions, not the coverage. If the real world has three behaviours and your
check has two names for them, one behaviour is invisible, and you will never see which.

This is a nice illustration of what AI is and isn't good for. It wrote the two-state check
happily, and it wrote a plausible comment explaining why two states were enough. What forced the
third state was a *result that didn't fit* — eight cases reported "accepted" for inputs that
obviously should not be. The model didn't doubt itself; the data did.

### "Accepted" is not "saved" — and the read-back costs eight lines

Until this night the browser test proved the form took the input. Whether it reached the database
was nowhere in the assertion. In a project whose most common defect class is *fields quietly
falling out of a payload*, that is the wrong thing to leave unmeasured.

The fix is small: after saving, **reload the page**, navigate back to the record, read every field
and compare. Nineteen fields written, nineteen read back.

It found three things immediately, and all three were faults in my own reading, not in the
application:

- the time-zone container returned its label *and its help text* instead of its value;
- numbers are formatted for display (`25.000`) and stored raw (`25000`) — comparing as text would
  have produced a false finding in every country;
- a combobox exposes its **label** and nothing else. The selected value `Europe/Berlin` does not
  exist as a string anywhere in the DOM; the widget keeps it in component state.

The last one is worth sitting with. The read-back has to compare on the label, which is strictly
weaker than comparing on the value. That weakness is now written down in the code, next to the
comparison, because a check whose limits are undocumented will eventually be trusted beyond them.

### The same defect, three days apart, one directory away

The organisation form's email field is `type="email"` and its `<form>` has no `noValidate`. So the
browser blocks submission before the application's validation runs, and shows its own bubble in the
browser's language. The translated message sits in the bundle and is never rendered.

The customer form in the same application does it correctly — and carries a fifteen-line comment
explaining exactly this, dated three days earlier, with the measured English string quoted in it.

So the lesson was learned, written down carefully, and travelled nowhere.

A grep across all frontend packages found **sixteen more forms with the same defect, in all five
products** — four of them the same `ProfileForm.tsx`, copied four times.

This is the sharpest thing I can say about AI-assisted testing, and it cuts both ways:

- The **finding** needed a human-shaped idea: *check whether the message the user sees is the
  message we wrote.* No amount of "generate tests for this form" produces that.
- The **scope** needed a machine: from one instance to seventeen across five products in about
  four seconds, with the exact list of files.

The bug was found by a method. The blast radius was found by a tool. Neither is impressive alone,
and the pair took under a minute.

The follow-up writes itself and is the real deliverable: this belongs in a lint rule, not in a
findings document. A `<form>` containing `type="email"` or `type="url"` and lacking `noValidate` is
mechanically detectable. Once it is a rule, it cannot be relearned a fourth time.

### A borrowed instrument must be re-calibrated where you put it

I reused the company checker for the customer form. On the company form, "the form is gone" means
"it saved" — the application redirects. On the customer form the form **stays**: the application
navigates to the new record's detail page, which renders the same component.

So the borrowed instrument reported a successfully created customer as *silently rejected*. Same
question, same vocabulary of answers, different application behaviour behind it.

There is a matching one in the same session: a `.catch()` on a Playwright locator call catches the
error but not the **wait**. Every probe in the checker was silently running into its own 30-second
default; a 15-second budget took 85 seconds and four cases died on the clock. The code read as
defensive and behaved as a stall.

Both are the same shape as the main thesis. The test suite is a measuring instrument, and an
instrument that moved to a new bench, or that was assembled from parts with their own timeouts,
has to be checked against a known signal before its readings mean anything.

### Where the table data comes from decides whether the table can lie

Sixteen countries needed company tables. Writing them by hand would have produced sixteen
inconsistent sheets, and a wrong VAT rate for Austria would have looked exactly like a right one.

Instead the generator reads `country-specifics-interface` — the same registry the application uses.
Time zone, currency, VAT rate, retention period, e-invoicing platform and legal forms all come from
there. Only the sample values a registry doesn't carry (postal codes, tax identifiers) are written
by hand, and they are marked in the file as *format-correct, check digits not recomputed*, with the
reason: nothing in the application validates them today.

That last clause is a finding in itself — no tax identifier is checked in any of the sixteen
countries — but the point for the article is narrower. **A table generated from the system of
record cannot disagree with it.** A table typed from a spec can, silently, and the test will then
defend the typo.

### And a small one about long runs

A four-hundred-case browser run was moved to the background by the harness after ten minutes.
Playwright caught the signal, finished the case in flight, listed the remainder as *did not run* —
and exited **zero**. The summary line said "13 passed", which was true and told me nothing about
the fourteen that never started.

A green exit code is a claim about the process, not about the work.

---

## The one that closes the argument: what the model forgot, the file remembered

Late in the run Torsten opened the spreadsheet and asked two questions that turned out to be the
same question.

First: *why are there no country sheets in `company-tests.xlsx`?* Because sixteen countries had
been generated into a **different** workbook — the aggregate — while the file a human opens still
stopped at two countries. The tests were green on sixteen. The artefact a person works with was
four weeks behind by lunchtime.

Second: *the tables aren't formatted and have no summary columns.* True, and worse than cosmetic.
The hand-built `CompanyDE` carries 278 formulas: every field group counts its own marks, and a
summary row multiplies them. A **0** in a case column means some field has no class — the case is
incomplete, and you can see it in the spreadsheet without running anything. The generated sheets
had none of that.

Then the part that matters: **`CompanyDE` was built by the model too.** Same session, one context
compaction earlier. The formulas, the colours, the widths, the coverage arithmetic — all of it was
the model's own work, and by the afternoon the model was generating a poorer version of a thing it
had itself designed that morning.

And the project's own skill file said so all along. Under *Technologie*, first line: **"exceljs
(nicht xlsx) — wird benötigt für Cell-Styling und Formeln."** It even specified `C=COUNTA-Formel`
on the field header rows. The generator was written without reading it.

### What this actually says about working with these tools

The failure was not reasoning. Every individual step was sound. The failure was that **the model's
memory of its own decisions is the least durable artefact in the room** — less durable than the
spreadsheet, the skill file, or the commit message.

Three consequences, and they are the practical core of the whole piece:

1. **Write the format down where the work happens.** A `README.md` next to the spreadsheets, not
   in a chat log. The one written afterwards states the direction of data flow, the formula
   contract, the colour rule, and the reason each exists. It exists because the knowledge was
   already lost once.

2. **When generating an artefact that already exists, read the existing one first.** Formulas,
   widths, number formats. What one instance can do, the generated ones must do — otherwise it
   isn't generation of the same thing, it's a plausible-looking substitute. This is the same
   discipline as the measuring instrument: the model will happily produce a confident, well-commented
   version of something subtly poorer, and nothing in its own output will indicate the loss.

3. **A skill file is worth nothing unread.** It contained the answer to a mistake that then took an
   hour to find and a human to notice. The skill has since gained a section on *generating* tables —
   because describing the format was not enough; the failure mode was in the act of producing it.

The through-line of these notes has been that a test suite is a measuring instrument and must be
calibrated before its readings mean anything. This last episode extends it one step: **the
instrument's own specification is also an artefact, and it decays faster than anything else.** The
tables outlived the model's memory of how to build them. That is not a flaw to engineer around —
it is the normal condition, and the whole discipline is a response to it.
