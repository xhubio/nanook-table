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

---

## Nine answers to one question — and the test that made a gap look like a decision

The country tables kept producing findings, and the last one wasn't about a form at all.

Torsten asked whether customers could be in the US, Canada, Australia. Measuring took two minutes
and returned something worse than "no":

| List | Countries |
|---|---|
| Organisation (frontend) | 16 |
| Customer (frontend) | 14 |
| Customer (**backend**) | 13 |
| Supplier (frontend) | 12 |
| A payment integration | 6 |

Five lists, five different answers to *which countries do we serve*. You could create a Romanian
customer but not a Romanian supplier. A business could register itself in the United States and
then not record a single customer in its own country.

Currencies were the same shape with a milder symptom: four lists, all identical, all containing
`EUR, USD, CHF, GBP`. A Canadian customer silently fell back to US dollars.

### The part that reframes it

The country registry — a package both the backend and the frontend already depend on — has carried
all sixteen countries for a long time, each with its currency, timezone, tax rate and legal forms.
Derive the two lists from it and you get sixteen countries and **nine** currencies: BGN, CAD, CHF,
CZK, EUR, GBP, HUF, PLN, RON, USD.

So `CAD` was never missing from the system. It was missing from four transcripts of it. And five
more currencies are still missing from those transcripts today — Poland, Czechia, Hungary,
Bulgaria and Romania are all forced onto the euro, which none of them uses.

The frontend file holding the deprecated copy even carries a comment: *use the country registry
instead.* It has said so for months.

### A green test that made a gap look like a decision

Adding the two countries broke exactly one test:

```ts
it('should not render for unsupported country', () => {
  render(<CountrySpecificFields country="US" … />)
  expect(container.innerHTML).toBe('')
})
```

The United States were "unsupported" only because nobody had added them. The test didn't record a
decision; it recorded an absence — and then defended it. Green, for as long as the gap existed.

This is the failure mode that suites acquire as they age, and it is invisible from inside: **a test
that pins current behaviour is indistinguishable from a test that pins intended behaviour.** The
only thing separating them is why it was written, which the code does not carry. Here the tell was
the name: *unsupported* is a claim about intent, and the value chosen to demonstrate it was a
country the product sells to.

The replacement uses a country the system genuinely doesn't know, and two new tests cover US and CA.

### Consolidating: read, don't copy — and prove it's a reading

The obvious fix is to derive both lists from the registry entries. The obvious fix has a flaw:
derivation gives wide types (`CountryCode[]`), and callers need a narrow union to build their own
`SupportedCountry`.

So the catalogue is written as literal tuples — and a test compares them against the entries:

```ts
it('nennt genau die Länder, für die es einen Eintrag gibt', () => {
  expect([...SUPPORTED_COUNTRIES].sort()).toEqual(builtInCountries().map((c) => c.code).sort())
})
```

Without that test the catalogue is simply the **fifth transcript** — better placed, equally prone
to drift. With it, the literal is a *reading* of the entries that happens to be typed narrowly. A
new country without a catalogue line turns the build red.

Which is the same principle this whole set of notes keeps arriving at, now applied to a constant
rather than a test: **the thing that makes a value trustworthy is not where it lives, it's whether
something independent can contradict it.** Four lists nobody could contradict drifted for months
without a single failing test. One list with a check behind it cannot.

### What it cost

The consolidation touched five packages: the registry, three frontend packages, one backend
package. All four consumers already depended on the registry — nothing new had to be wired, only
eight literal lists deleted and replaced by re-exports. Test chains: 1643 + 799 + 1678 + 244, all
green; five releases published.

An afternoon, for a class of bug that had produced at least two user-visible defects and would have
produced more with every new country.

---

## The list view, and a bug where every layer was right

Forms had been the whole story so far: type something, submit, read it back. Then Torsten pointed
at a screenshot of the supplier list and said the obvious thing that nobody had said yet — *the
badges, the rows, the sorting: that's its own table, and it's a pattern we'll need everywhere.*

He was right, and the reason is worth stating precisely: **a list view cannot be tested with one
record.** On one row every sort order is correct, every filter is unremarkable, and every counter
reads "1 of 1". The inventory *is* the instrument.

So the base state builds seven suppliers whose values are chosen against the three places list
sorting habitually breaks:

| Value | what it attacks |
|---|---|
| `Ärger GmbH` | umlaut at the start — does it sort before `alpha` or after `Zeta`? |
| `alpha bau`, `omega Service` | lowercase — does the sort separate case? |
| `SU-00001`…`SU-00007` | zero-padded, so string order happens to equal numeric order (one classic failure disarmed by the data model itself) |

### The failure that looked exactly like the other failure

First run: seven of eight sorting cases red. Per the rule this notebook keeps rediscovering, an
almost-entirely-red run is a suspicion about the instrument, so I looked at mine first — and found
it: I was clicking the table cell, while the actual sort trigger is a button inside it. The clicks
went nowhere and the list showed its default order.

Fixed that. Ran again. **Still red — with the identical symptom.**

Which is the interesting part. "Not clicked" and "clicked but ineffective" produce the same
screenshot, the same row order, the same everything. There is no way to tell them apart by looking
at the result.

The way out was to stop counting actions and start reading state. The table puts `aria-sort` on the
header cell — `ascending`, `descending`, `none` — so the helper now clicks until the header *says*
what was intended, and throws if it can't get there:

```ts
for (let versuch = 0; versuch < 3; versuch++) {
  await ausloeser.click()
  if ((await kopf.getAttribute('aria-sort')) === zielZustand) return
}
throw new Error(`… lässt sich nicht auf ${zielZustand} bringen`)
```

Now the two cases separate: if the attribute never reaches the target, the instrument failed; if it
reaches the target and the rows don't move, the application failed. The second is what happened.

> **The general rule, and it is the same one as always in a new costume:** an instrument that
> reports *what it did* cannot distinguish a failed action from an ineffective one. It has to report
> *what became true*.

### Three layers, each defensible, together broken

The API, measured directly with five different sort arguments, returned the same order five times.
`sortBy` appears exactly once in the whole router — in the input schema. It is validated and
discarded. (The same shape as a discount-period field found earlier the same day, which is also
validated and discarded. A zod line for a field nobody handles is perfect camouflage: it proves
someone thought about it.)

Torsten then asked the question that made the finding solid rather than merely true: *isn't sorting
done in the frontend anyway?*

It isn't, and checking why is the whole lesson. The table is configured `manualSorting` —
TanStack's way of saying *the data arrives sorted, don't touch it*. And it has to be, because the
same table is `manualPagination`: the browser holds one page. Sort locally and you order the ten
rows you happen to have; the alphabetically first supplier sits on page 3 and never moves forward.

So:

| Layer | Behaviour | Correct in isolation? |
|---|---|---|
| Table | refuses to sort locally | yes — it must, with paging |
| Page | sends `sortBy` and `sortDirection` | yes |
| API | validates both and drops them | **no** |

Every layer reviewed on its own passes. The defect exists only in the seam, and seams are exactly
what unit tests don't cover and code review doesn't look at.

And the surface is *impeccable*: the arrow flips, `aria-sort` changes, the request carries the
parameters. Everything except the outcome is right — which is why five sortable columns can be dead
without anyone noticing. A human clicking a column expects a different order and, on seven rows of
similar names, does not immediately see that nothing moved. The test computes the expected order and
compares row by row.

## Should the screens be handed to sub-agents?

Torsten asked whether I should orchestrate — dispatch a sub-agent per screen and collect the
results. It's the right question at the right moment, and the honest answer has a seam in it too.

**Delegate the measuring.** Reading a screen — every test id, every validation rule with file and
line, the field list, the submit path, the sortable columns — is mechanical, read-only, token-heavy,
and parallel. It is most of the tokens and none of the judgement.

**Keep the judging.** Every finding in these notes came from a moment where a measurement
contradicted an assumption, and the value was entirely in deciding which side was wrong. An
all-red run is a suspicion about yourself. A form that stays put is not the same as a form that
saved. A missing `noValidate` was only visible because a neighbouring module had solved and
documented that exact problem three days earlier — cross-screen memory, which a fan-out of
independent agents structurally does not have.

There is also a hard precondition: **you can only parallelise a pattern that already exists.** Two
now do — form-create and list-view — and both were expensive to get right precisely because of the
mistakes above. Fanning out before that would have multiplied the mistakes instead of the work.

And one safeguard, learned the same day: four of my own errors on the supplier screen came from
*carrying assumptions over* from the customer screen. A sub-agent doing that has nobody to catch it.
So the instruction has to say it outright — *measure, don't transfer; the neighbouring screen is not
evidence* — and the runners have to report their own coverage (`22 of 24 fields read back`, `not in
this form: …`, `measured: …`). Those annotations are what make someone else's output auditable
without reading all of it. Without them, delegation trades tokens for trust you haven't earned.

## The table form nobody had used

Chains — draft → finalised → sent → paid → cancelled — are not equivalence classes. An equivalence
class table describes **what a thing is**; a chain describes **what becomes of it**. Nanook has a
second table form for exactly that, `<MATRIX_TABLE>`: rows are source states, columns are actions,
and every filled cell is one test case.

Torsten's instruction was characteristically direct: *check whether it fits, and if nanook has bugs
there, we just fix them.*

It had one. The probe produced five correctly named cases — `r0:c0`, `r1:c1`, `r1:c2` — with
uniformly empty `data`. The cause, in `TestcaseDefinitionMatrix`:

```ts
if (generatorCmd !== undefined) {
  if (startsWith('gen:'))      → GeneratorDirective
  else if (startsWith('ref:')) → ReferenceDirective
  // a plain value: nothing happened
} else {
  → createStaticValueDirective(generatorCmd, …)   // called with `undefined`
}
```

Both branches were inverted. A value that was there got discarded; a value that was *missing*
produced a directive holding `undefined`. And the documentation had described the correct behaviour
the entire time — *"Otherwise, a StaticDirective is created with the value as-is."* The spec was
never wrong. Nobody had run it.

That is the whole lesson, and it is not about nanook. **A code path nobody exercises has no bugs —
it has undiscovered ones**, and the two are indistinguishable from the outside. Test coverage
reports it as covered, review reads it as sensible, the docs describe it as working. Only use tells
them apart.

### Two causes, stacked

What made this genuinely hard is that my own geometry was wrong at the same time: data starts at
index **8**, not 7, because there is a blank row between the metadata block and the matrix. So the
first run produced the wrong number of cases *and* empty data, and the wrong count was mine.

The temptation at that point is to conclude that the whole thing is my misunderstanding — one
confirmed error is a very persuasive explanation for a second symptom. It's the same reasoning
error as the all-red suite earlier in these notes, arriving from the opposite direction: there, a
correct tool was blamed for the failures; here, a real defect was nearly absorbed into a mistake I
had already admitted to.

The way out is the same both times: **fix the one cause you can prove, then measure again.** The
count came right, the empty `data` stayed. Two symptoms, two causes, and the second only became
visible once the first was gone.

### What it's worth

The matrix earns its place through its *empty* cells. In a decision table a forbidden transition
has to be written as its own error case — and it can be forgotten without anything looking wrong.
In a matrix it is a hole in a grid, and a grid is a shape you can check by looking: *nothing leads
out of `archived`.* Absence becomes visible, which is the one thing a list of cases can never do.

## The suite was green and knew better

I finished the product form runner at twelve of twelve and felt done. Four of those twelve cases
encoded a *defect* as the expectation: "choosing Inactive returns Active", "an empty price becomes
0.00", "two rejections stay silent". Each carried a friendly note saying that if it ever went red,
the bug had been fixed.

Torsten: *"please change it so known defects are red too."* And then, a minute later, promoting it:
*"that has to be a general rule."*

He's right, and the reason is not about tests. **The suite is the thing people look at every day.**
A findings file is a thing people open when they already suspect something. Encoding a defect as a
green expectation moves it from the first place to the second — the information survives, but it
stops being *seen*. I had optimised for a number that measures nothing.

What makes this worth writing down is how *good* green felt. Twelve of twelve arrived after six of
my own mistakes had been dug out one at a time; the number was the reward for that work, and I
protected it without noticing. The rule now says: expect what would be correct, let it fail, and
put the finding in the failure message — number, measurement with file and line, and *what would
make it green*, because there is usually more than one right answer. "Empty price becomes zero" is
fixed either by rejecting the input or by leaving the field empty. Naming both saves an argument
later.

## `.catch()` that fires too late

Three times in one day, in three different files, I wrote a variant of this:

```ts
const nativ = await locator.first().evaluate(el => …).catch(() => null)
```

It reads as defensive. It is the opposite. If the locator matches nothing, `evaluate` **waits the
full timeout** before rejecting — thirty seconds — and only then does the `catch` do its friendly
thing. A loop with a fifteen-second budget never completes one iteration. The test dies at the time
limit, Playwright closes the page, and the error surfaces at the *next* statement as
`Target page has been closed` — pointing at a line that is fine.

The fix is one call: `if (await locator.count() > 0)`. I had already written that fix earlier the
same day, in `bediene()`, with a comment explaining why. Twenty minutes later I built the same trap
in `reaktion()`. Then again in three list page objects, where a filter matching zero rows removes
the pagination counter and `textContent()` waits for something that will never exist.

**A `catch` next to a call makes the call look handled.** That is the whole mechanism. The error is
caught; nobody said when. It is now the single most reliable source of bugs in my own test code,
which is worth stating plainly: the tool that finds defects is full of them, and the only thing
separating the two is that one of them gets measured.

## The wrong detector that fixed a published finding

Because the "silently stripped field" pattern had appeared four times, I built a small detector: for
every tRPC call in the frontend, compare the keys sent against the keys the Zod schema accepts.

It was wrong. First run: two hits, both false — a schema name collision across packages. Three
repairs later: two hits, still both false, this time namespace collisions inside one router file.
It found **none** of the four known cases, and of 397 calls it could not check 333.

And it was still worth building, for a reason I did not anticipate. It flagged `supplier.list` with
a *different* explanation than the one I had published that morning. Two accounts of the same
place, disagreeing. Reading them against each other showed my published finding was wrong: I had
searched only the shared package and missed an app-local schema extension. Zod accepts `sortBy`
there; the router drops it while hand-copying eight fields into a filter object, and an `as any`
silences the compiler.

So the detector's value was not its verdict. It was **producing a second, independent account that
could contradict the first.** A tool that says the same thing you already believe teaches nothing,
however correct it is.

One repair inside it deserves its own line. My first parser broke on comments *inside* an object
literal — the braces and commas in an explanatory comment shifted the depth counter, and the field
after it vanished. The detector then reported `includeArchived` as stripped, at exactly the spot
where a comment explains that it is not. **A measuring instrument that trips over comments finds
defects preferentially where someone took care to explain themselves.** That is the worst possible
distribution, and it is invisible until you check a hit that you know is wrong.

## Adapting the instrument deletes the defect

Building the customer list table, I hit a status value the UI has no filter for. I removed the case.
Everything then agreed with everything, and the gap was gone from the measurement.

Torsten asked whether I had recorded it as a finding. I had not.

Tracing it back, this was the fourth encounter in two days. The first time — building the
registration runner — I had stated the principle explicitly in a commit message: *"if the page
silently skipped every unknown field, a typo in the table would be indistinguishable from a real
boundary property."* Twice after that I got it right while **measuring**. Then, twice, I got it
wrong while **building**.

That split is the finding. Measuring and building are different postures. In the measuring posture,
"this field does not exist" is obviously a statement about the application. In the building posture,
the same fact looks like a detail of the specification — you are writing a description of what the
form can do, and a state with no switch simply does not belong in it. Both readings are internally
consistent. The second one quietly defines the defect away, and it wins because the role has
changed while the fact stayed the same.

The rule that came out of it: **if a table shrinks because of the application, a finding is created
in the same motion.** Not afterwards. The test question at the moment of deletion is *why doesn't
this work?* — "because the application can't" is a finding; "because it makes no business sense" is
a correct deletion that still needs a comment, or the next person adds it back.

## Eight suspects, zero findings — a detector that only knows one word

The next morning I wanted to stop opening files one at a time and instead measure something
structural: which of the backend's 69 mounted routers are unreachable from the browser? A feature
that exists but has no way in is a real and recurring defect class — the repo has a plan named
after it.

The measurement was one line of shell: list the router keys, then for each, grep the frontend for
`trpc.<name>.`. It produced eight orphans. Every one was wrong, and they were wrong in three
different ways:

| Direction | Case | Why |
|---|---|---|
| **too narrow** | "the quote has no delta procedures" | I searched `setItems`; the quote calls them `setPositions`. The whole server side was built and published. |
| **too narrow, second form** | "`serviceRequest` has no UI" | The client writes `const sr = trpc.serviceRequest` once and then calls `sr.listInbox()`. There is an inbox page, a detail page, and three portal pages. |
| **wrong level** | "`settingsService` and `transmissionService` are orphaned routers" | My `awk '/^    [a-zA-Z]+:/'` had swept up **constructor arguments** at the same indentation. They are not routers at all. |

Eight suspects, zero findings, three distinct failure modes in about an hour.

The pattern underneath is worth stating on its own, because it is the mirror image of the article's
central rule. A detector that reports a **presence** carries its own proof: here is the line, go
look. A detector that reports an **absence** carries nothing. It cannot distinguish "not there"
from "spelled differently", and it never will, because the evidence for the distinction is exactly
the thing it failed to find.

So the rule generalises: **a zero from a search is not a measurement until the search has been shown
capable of a non-zero.** For grep specifically, that has a cheap form — before claiming something is
absent, run the search again with the bare name and no syntax around it. If that finds files, the
pattern was wrong, not the application.

What makes this failure mode durable is that it is *pleasant*. Each of my eight orphans read as a
discovery. Finding nothing feels like failure; finding eight missing features feels like a
productive morning. The incentive runs the wrong way, and it runs the wrong way for a person and a
model alike.

## 766 red, and not one of them real

The same day produced the exact opposite error, and it is instructive that it produced the same
feeling of significance.

I wanted to know where the thirty red tests stood after a day of repairs, so I ran the whole suite:
783 tests, 766 failures. That is not a result, it is a collapse — and for a few seconds I read it as
one.

The cause was that I had started Playwright from the directory *above* the one holding
`playwright.config.ts`. With no config found, it fell back to defaults, `baseURL` was undefined, and
every UI test died on `page.goto: Cannot navigate to invalid URL`. Sorting the 766 failures by
message took one command and made it obvious: 756 of them were the same line, and it was a line
about my invocation, not about the application.

The article's thesis so far has been about zeros: *a zero counts only once the instrument has proven
it can show something else.* This is the same sentence read from the other end. **A total failure is
exactly as suspicious as a perfect pass, and for the same reason** — both are the signatures an
instrument produces when it has stopped measuring the thing you asked about. A suite that reports
everything broken has told you as little as a suite that reports everything fine.

There is a practical asymmetry, though, and it favours the catastrophe. Nobody investigates green.
A wall of red is at least *annoying* enough to get looked at, which is why this error cost me ten
minutes and the eight phantom orphans cost me an hour. If you have to be wrong, be wrong loudly.

The diagnostic that resolved it is worth keeping, because it is one line and it works for both
extremes:

```bash
grep -oE "Error: [^:]{0,70}" run.txt | sed 's/[0-9]\{3,\}/N/g' | sort | uniq -c | sort -rn
```

Group the failures by message shape and count them. Real defects are *diverse* — six findings, six
different sentences. Infrastructure failures are **monotonous**: one sentence, seven hundred and
fifty-six times. The shape of the distribution identifies the class of problem before you have read
a single test.

## The parts that were already right

Three times in a row that day I set out to test something and found there was nothing to find.

The customer portal's feedback channel — the customer strikes a line item and writes a comment —
worked end to end: the quote stayed untouched, the status moved to `change_requested`, and the
comments arrived with a reference to the correct position. The design note in the service explains
the restraint: *"the quote's positions and totals are not touched: this is a message, not an edit."*
A customer who could delete positions would be editing a document the business is answerable for.

The tender-update path was the same story. A revised bill of quantities is matched against a
*priced* quote, and the specification is a table of cases sitting in a comment above the function —
quantity changed, price stays, because it is a unit price; text changed, price stays but is flagged;
unit changed, **price is cleared**, because a price per piece is not a price per metre. I went
looking for the gap between the module that decides and the module that applies, since "decided but
not honoured" is a defect I had already found elsewhere that week. Line 119 of the applying module:
`unitPrice: change.preisWirdGeleert ? 0 : row.unitPrice`. It was honoured. And the end-to-end tests
that already existed made exactly my distinction — read the quote back from the database rather than
trusting the procedure's return value.

This is uncomfortable to write up, because a chapter that ends "and everything was fine" has no
narrative. But it is the part of the method that is easiest to lose. Three sessions of finding
defects builds an expectation of defects, and an expectation is a bias: I twice announced an absence
("the quote has no delta procedures", "the LV update doesn't exist") that a thirty-second check
disproved. Both times the cause was the same as the eight orphans — I searched for the name I
expected rather than the name that was there.

So the corrective is not more scepticism. It is **writing the green test anyway**. A surface that is
right today has no protection tomorrow unless someone has written down what "right" means. Three of
the checks on the category tree pass, and they are the only record that the depth limit is enforced
server-side, that a category with children cannot be deleted, and that a category holding products
cannot either. None of that is visible in a defect list. A test suite that only contains known
defects documents a moment; one that also contains the working paths documents a system.

## The system under test was a ghost

I had spent an afternoon reporting which defects were still open. Six of them, each with a
finding number and a file:line. Then I checked when the backend process had started.

`Sun Aug 16 00:54:55`. The fix for one of those six had been committed at `04:23` the same
morning — three and a half hours *after* the server I was measuring came up. Twenty-odd commits
had landed since, including two that repaired findings I had just re-confirmed as open.

The tests were fine. The instrument was fine. The *system under test* was a day old, and nothing
in the output said so, because a running server has no reason to mention its own age.

This is a third form of the same failure, and it is the one hardest to see, because it lives
outside the measurement entirely. The zero-rule and the total-failure rule both ask *does the
instrument work?* This one asks **what did the instrument point at?** — and the honest answer is
that a dev server is a snapshot of a moment, not of a repository. It keeps serving that moment
until someone restarts it.

The cost is asymmetric in the worst direction: stale code produces **false positives**. Every fix
that landed after the process started reads as an unfixed defect. Reporting a repaired bug as
broken is worse than missing one — it sends someone back to code that is already correct, and it
erodes the credibility of every other finding in the same list.

The check is two commands and belongs at the top of any measurement session:

```bash
ps -eo lstart,command | grep '<the server>'
git log --since="<that timestamp>" --oneline
```

If the second command prints anything, the first thing to fix is the process, not the code.

## The procedure that only looked like the one I wanted

The same session produced a subtler version of it. A test had been reporting, for a day, that
legal terms were not frozen at dispatch: send a quote under version 1, publish version 2, and the
customer's link shows version 2. A plan had been written from that finding and implemented.

After restarting, the test was still red. The fix was in the tree; I could read it. So I read
further — and eventually found that the freeze reads a dispatch log, and falls back to the active
version when there is no entry. There was no entry.

Because my test called `quote.send`, and `quote.send` does not send anything. It flips a status.
The attachment, the checksums and the dispatch-log row are written by `quote.sendByEmail`. The
give-away had been in the log the whole time, in plain German:

```
[LegalDocs] kein Versandprotokoll fuer quote <id> — Anzeige faellt auf die aktive Fassung zurueck
```

The server had described my own bug to me, and I had gone looking in the validation layer instead.
The other tell was there too and I walked past it: `quote.send` returned in **3 ms**. No PDF gets
rendered and no mail gets sent in three milliseconds.

With the correct procedure the test is green. The freeze works.

Two things are worth separating here, because they pull in opposite directions. The **finding** was
real: the code genuinely resolved the active version instead of the dispatched one, and that was
genuinely wrong. The **test** could not have proven it, and could not verify the fix. A test that
happens to produce the right verdict for the wrong reason is not a weaker version of a good test —
it is a different object entirely, and it fails the moment the world changes around it.

The rule I would write for myself: **when a test asserts something about a side effect, name the
procedure that produces the side effect and check that it is the one being called.** Two procedures
with the same prefix are not a family; `send` and `sendByEmail` differ by everything.

## The test that reported a repair as a defect

Third of the same day, and the mirror image of everything above.

The product round-trip — export from one company, import into another, compare field by field —
started failing on the unit: expected `Stück`, received `H87`. My first reading was loss.

It was the opposite. `H87` is the UN/ECE Recommendation 20 code for *piece*, the code the
e-invoicing standard requires (BT-130). The application had started normalising units on save:
`Stück` → `H87`, `Std` → `HUR`. A fix had landed, and my test called it a bug.

The cause was in one line of the assertion. I compared the imported product against **the values I
had typed into the test table**, not against **what the source company had actually stored**. Those
had been the same string for as long as the application did nothing to it. The moment it did the
correct thing, my expectation became a record of the old behaviour — enforced.

That is the trap in a round-trip test specifically: its question is *does A arrive at B unchanged?*
and it is tempting to write that as *does B equal what I put in?* Those coincide until they don't,
and when they part, the test defends the past.

Fixed by reading the source company's stored state and comparing against that. The test stays sharp
for real loss and goes blind to any future correct normalisation — which is exactly the sensitivity
a round-trip should have.

⚪ And it needs saying plainly, because it cuts against the rule that a test must never be adapted to
a defect: **adapting a test to a repair is not the same act.** The distinction is not who changed
last, it is which of the two now describes the specification. Here the application does, and the
test was the thing standing still.

## Four near-misses in one day, and they were all the same shape

Working through five untested modules in a day produced five suites and a dozen findings. It also
produced four moments where I had already written the finding text before discovering the defect was
mine. They are worth listing together, because separately each looks like carelessness and together
they are a category.

| What I asserted | What was actually happening |
|---|---|
| "The legal-terms freeze is broken" | I called `quote.send`, which flips a status. `quote.sendByEmail` is the one that mails and writes the dispatch log. No log ⇒ falling back to the current version is *correct*. |
| "A future payment date is accepted" | My date was *tomorrow* — and tomorrow is the **latest allowed** day. The check leaves one day of slack so a timezone difference can't reject an honest entry. My value was inside the permitted window. |
| "A settled receipt can still be edited" | `settle` sets `settledAt` and leaves the status at `draft`. It means "closed by other means", not "handed over". I was editing a draft and calling correct behaviour a defect. |
| "A billed time entry is offered for billing again" | I used `crypto.randomUUID()` as the invoice id. `listUninvoiced` first calls `reclaimOrphanedInvoices()`, which reopens entries whose invoice no longer exists — deliberate tolerance for a deleted draft. My fake id triggered a *feature*. |

The common shape: **the test exercised a path adjacent to the one it named.** Not a wrong assertion —
a wrong subject. And in every case the wrong subject was *plausible*: `send` next to `sendByEmail`,
`settle` next to a status change, tomorrow next to the future, a random uuid next to an invoice id.

What makes this class dangerous is the direction of the error. A test that measures nothing usually
goes **green** and is invisible. These went **red** — they produced confident, well-written,
file:line-cited findings about defects that did not exist. Two of them I nearly published, and one of
them I *did* publish earlier in the week; a plan was written from it and implemented. (The plan was
right anyway, for a different reason, which is luck and not method.)

The corrective that actually works is not "be more careful". It is a question asked before the
assertion is written:

> **Could this test have gone green if the application were broken?**

If the answer is yes — because a neighbouring rule, a tolerance, a fallback or a differently-named
procedure would have produced the same reading — the test is not measuring what its name says. For
the four above the question would have caught all four, and it costs one sentence of thought each.

⚪ There is a pleasant corollary. Three of the four "defects" turned out to be **features I hadn't
known about**: a one-day timezone slack on payment dates, a distinction between *settled* and *sent*,
and self-healing for entries whose invoice was deleted. Chasing a false finding to its cause is one
of the more reliable ways to learn what a system actually promises — provided you stop before
publishing.

## "I can't imagine it goes that fast"

I wrote four tests against the accounting module, found two things, and reported it as *the
accounting is tested*. The domain expert read one line and replied:

> *"You've tested all the accounting functions already. Including the exports to DATEV and the other
> systems. And in the different countries. Where we have different charts of accounts. And we have
> different bookkeeping modes, cash-basis and double-entry. What may be used depends on the chosen
> company type. I can't imagine it goes that fast."*

He was right, and the correction is worth writing down because the error is not laziness — it is a
**missing denominator**.

| | Present | Tested |
|---|---|---|
| Procedures in the accounting router | **391** | 8 |
| Export formats (DATEV · SIE · BMD · FEC · JPK · SAF-T · SII · Abacus · Bexio · Exact) | **10** | **0** |
| Charts of accounts | **27 across 25 countries** | 1 |
| Bookkeeping modes (cash-basis · double-entry · club) | 3 | 1 |

One of the three rules I had quoted in the test file's own header — the GoBD audit-trail requirement —
had **no case at all**. I had written it down as a rule and then not tested it, in the same file.

The lesson generalises past this incident. A coverage line that says `module: ✅ tested` is not a
statement, it is a **feeling**, until the denominator is next to it. Four cases against four
procedures and four cases against three hundred and ninety-one read *identically* in a report. The
fix is mechanical: every coverage claim carries the size of the thing it claims to cover, and if that
size is unknown, the claim is that the size is unknown.

⚪ There is a second-order effect I did not expect. Once the denominator was in the register, the same
four tests stopped looking like an achievement and started looking like a **sample** — which is what
they were, and which is a much more useful thing to reason about. The number didn't make the work
smaller; it made it locatable.

## The question that produced two findings in one minute

The same expert then asked two questions in a row that each took under a minute to answer and each
turned up something real.

**"Are the balance sheets produced correctly?"** — There are no balance sheets. The reports are
`euer` (cash-basis annual statement), `trialBalance`, `accountBalances`, `cashReport`, `bwa`. A
full-text search for `balanceSheet`, `Aktiva`, `Passiva` finds nothing. So the application offers a
`double_entry` bookkeeping mode and cannot produce the one thing you keep double-entry books *for*.

And the root cause sat one layer below the missing report: the bookkeeping mode is chosen freely per
fiscal year, defaults to cash-basis, and **the accounting package does not know the company's legal
form at all** — not one occurrence of `businessType` in the entire package. A GmbH can be set to
cash-basis accounting, which German law does not permit, and nothing objects.

**"What is there for US and CA?"** — A business in either country can be created and can invoice.
It cannot keep books: no chart of accounts for either, no export format, no country pack. And
Canada is **missing entirely** from the accounting country registry, while the US is present with
`status: "none"` and a properly sourced justification (IRC 6001, *South Dakota v. Wayfair*). A
country absent from the single source of truth is not *unimplemented* — it is **undecided**, and
the generated coverage map cannot show a gap it was never told about.

💡 What both questions have in common is worth more than either finding: they were **domain
questions, not code questions.** "Does the balance sheet come out right" cannot be answered by
reading a diff, and it is not the kind of question a test suite generates about itself. It came from
someone who knows that a GmbH owes a balance sheet — and it took one search to convert that knowledge
into a defect with a file:line.

The methodology point: an agent measuring a system can verify everything the system says about
itself, and nothing the system has never been asked. **Those gaps are exactly where the domain expert
is irreplaceable**, and the cheapest way to find them is to let them ask short questions and then go
measure rather than answer from memory. Four of my own "it doesn't exist" claims that day were wrong;
none of his three were.

## Then the correction that came back as a smaller plan

I had written a plan for the missing balance sheet with a precondition I was sure of: a
chart-of-accounts-to-balance-sheet-line mapping, per chart, as master data — 27 charts, no way around
it, and explicitly "not a heuristic".

His answer: *"We should in any case be able to produce a cash-basis statement from the data we have,
and also a simple balance sheet."*

So I measured instead of arguing. Every account in every chart already carries a `type` — `asset`,
`liability`, `equity`, `income`, `expense`. Across all 27 charts in 25 countries: **not one account
without a type**, and all five types present in every chart. Which means:

```
Assets      = Σ balances of asset accounts
Liabilities = Σ liability + Σ equity + result
P&L         = Σ income − Σ expense
```

A simple balance sheet is derivable **today**, for every country, with no new master data. My
precondition was real but it was the precondition for a *different, finer* deliverable — the
§ 266 HGB line-item breakdown — and I had made it a blocker for the coarse one.

That is a specific failure mode and it deserves its own name: **the correct requirement, attached to
the wrong deliverable.** It does not look like a mistake from inside, because every sentence of it is
true. It only shows up when someone asks for the cheaper thing and you have to check whether it is
actually cheaper.

⚪ The step that was a blocker is now marked "entfällt" in the plan, with the reason written next to
it — because the next person to read it will otherwise reintroduce it. And the fine breakdown is
still worth building; it just isn't in the way any more.

## Ten formats, one table, and a cast that hid a crash for months

The accounting module exports to ten systems — DATEV for Germany, BMD for Austria, Abacus and bexio
for Switzerland, Exact for the Netherlands and Belgium, FEC for France, JPK for Poland, SAF-T for six
countries, SIE for Sweden, SII for Spain. None of them had a single test.

The temptation is ten test files. The right shape is one table, because the question is identical for
all ten: *is it offered to the right country, does it run, does a file with content come out?* Eleven
checks total — one for the offering matrix, ten for the runs.

**Three passed.**

What makes the result useful is not the count, it is that the eight failures fall into **four groups
that need four different repairs**:

| Group | Formats | What it is |
|---|---|---|
| **Crash** | BMD, SIE | the format has never worked, at all |
| **Contradiction** | Exact | the country's own standard chart of accounts does not fit the country's own export format |
| **Missing input** | FEC, SII, SAF-T, JPK | the export correctly demands a national identifier |
| **Cosmetic** | bexio | filename convention |

A list of eight red tests is a to-do list. The same eight, triaged, is a plan — and three of the four
groups need someone to *look something up* rather than write code.

### The cast

The BMD crash is worth the whole chapter. The message is `Unknown encoding: windows-1252`, and the
line is one:

```ts
Buffer.from(f.content, (f.encoding as BufferEncoding) || 'utf-8')
```

Node's `BufferEncoding` is `utf8 | latin1 | ascii | base64 | hex | …`. It does **not** include
`windows-1252`. Without the assertion, TypeScript rejects this at compile time. With it, the compiler
is silent and the failure moves to runtime — into a country's only export format, where nobody looked
because there was no test.

And the correct encoder was already there. `toWindows1252()` sits in the shared package, returns a
`Buffer`, and has done for as long as DATEV has been correct:

| Adapter | What it does | Result |
|---|---|---|
| DATEV | calls `toWindows1252()`, hands back a **Buffer** | ✅ correct CP1252, measured |
| BMD | hands back a **string** plus `encoding: 'windows-1252'` | ❌ crashes in the service |

Same encoding, same helper, one adapter uses it. This is the pattern that keeps recurring in this
codebase — *the capability is built, the last connection is missing* — and here the type assertion is
precisely what kept it invisible.

The repair that matters is therefore not "fix the crash". It is **delete the assertion**, so that the
next adapter declaring `iso-8859-15` fails the build instead of a customer's export. A fix that leaves
the cast in place fixes one country and re-arms the trap.

⚪ One design note went into the plan and I want it here too: an unknown encoding must **abort**, not
fall back to UTF-8. A silent fallback produces a file that looks like a success and arrives at the
accountant as mojibake — which is strictly worse than no file, because no file gets reported and a
broken one gets forwarded.

### The direction nobody tests

The offering matrix has two columns, and only one of them is obvious:

```
DATEV offered to DE ?  ✅  — otherwise the business cannot export at all
DATEV offered to AT ?  ❌  — otherwise it ships a file its accountant cannot read
```

The second column is what turns `supportedCountries` from a comment into a **contract**. It also
happens to be the one that passed for all ten adapters, which is worth saying plainly: the wiring is
right, the machinery behind it isn't.

⚪ And a small pleasure: the file that measures all this did not compile at first. Its header comment
contained a shell glob — `lib-accounting-export-*/` — and those last two characters close a block
comment. The parser reported "Missing semicolon" twelve lines later, in a place that had nothing to do
with it. A file glob does not belong unescaped inside `/** … */`, and I now have a test file that says
so in its own header.

## The empty catch on the record that proves compliance

German bookkeeping law requires an audit trail: every change to an accounting record must be logged
(GoBD Tz. 8.1). I had listed this rule in the header of my own test file and written no case for it —
a debt worth naming, because *naming a rule and not testing it reads as coverage.*

So I wrote the case. It is empty. Not "incomplete" — **empty**, and not only for transactions:
changing an account and creating a cost centre leave no trace either.

What makes it interesting is that six independent checks all say the feature is built:

1. The table exists and is **readable** — the list endpoint answers 200, not 404, not 500.
2. The service is constructed.
3. Five services receive it, including the transaction service.
4. The call sites exist.
5. The router passes the acting user's id, so the guard `if (auditService && userId)` should pass.
6. With no filter at all, the list returns zero rows.

Point 6 matters more than it looks. All day I had been wrong about absences, so the unfiltered query
is the check that separates *"nothing was written"* from *"my filter excluded it"*. It was nothing.

The thing that keeps it invisible is four characters:

```ts
try {
  await this.fieldAuditService.recordChange({ … })
} catch {
  // best-effort: audit failure must not block update
}
```

The write fails, and nobody learns: no log line, no error, no row. And the service being called says
the opposite in its own docstring — *"Failure to insert audit on a hot-path should fail the
surrounding update — caller decides via try/catch."* The caller decided, and decided against the
record.

💡 That decision, not the underlying bug, is the finding. For a compliance record, "best-effort" is
the wrong trade in a way that is easy to state: **the record is the defence.** A business whose books
have no change log cannot defend them, independently of whether anything was ever booked wrongly. So
if the audit insert fails, the change must fail. An empty catch converts a legal requirement into a
suggestion, silently, and it will keep doing so until someone writes exactly this test.

⚪ There is a general shape here worth extracting: a `catch {}` around a *side effect* is a normal
engineering trade — the mail didn't go out, the cache didn't warm. A `catch {}` around the *evidence*
is different in kind, because the evidence is the only thing that would have told you it failed. When
you see one, ask what it is swallowing, and whether that thing is what someone will ask for later.

## A green test whose only assertion was an upper bound

In the same file, the neighbouring case measured nothing and passed.

The intent was: a *draft* transaction must not appear in the VAT return. So the test books 1000 net,
adds a draft over 100,000, and asserts the declared base is `< 100000`.

The VAT return was empty. Zero is less than a hundred thousand. **Green.**

The bug in my test is one missing line, and it generalises: an assertion that is only an *upper*
bound cannot distinguish "the wrong thing was excluded" from "nothing was included". The fix is to
prove the instrument shows something first:

```ts
expect(base, 'Self-check: the booked 1000 € MUST appear').toBe(100_000)   // ← added
expect(base, 'and the draft must NOT').toBeLessThan(10_000_000)
```

⚪ This is the zero-rule from earlier in these notes, arriving from a new direction. Before, the
lesson was about instruments that report zero findings. Here the instrument reported a *pass*, and
the pass was made of the same nothing. **An upper bound alone is not a measurement** — it is a
statement about what is absent, made by something that may be unable to see anything at all.

The tell, in hindsight, was in the test's own arithmetic: I had chosen 100,000 to be conspicuous, and
a conspicuous number only helps if something else is there to compare it against.

## The counter that certified its own success

Recurring bookings — rent, leasing, insurance — are the feature a bookkeeper sets up once and never
wants to touch again. The procedure is called `executeDue`. It takes a `today` parameter, which is
excellent: the clock is injectable, so the test is deterministic without waiting for a calendar.

`executeDue` does not book anything.

It selects the due templates, checks the end date, computes the next date, increments
`executionCount`, sets `lastExecutedAt`, and returns the templates as *executed*. There is no
`insert` into the transactions table anywhere in the method.

The part worth the chapter is the second sentence of that list. **The feature keeps a record of its
own success, and the record is correct — about everything except the thing that was supposed to
happen.** After the run:

| Signal | Says |
|---|---|
| `executionCount` | 1 |
| `lastExecutedAt` | now |
| return value | "1 executed" |
| `nextExecutionDate` | advanced one month |
| the books | unchanged |

Every indicator the application maintains about itself agrees that the rent was booked. A dashboard
built on those fields would be green. A monitoring alert on "recurring executions = 0" would never
fire. The only way to find this is to ask the *other* system — the ledger — whether the money
arrived.

💡 This is the instrument-lies theme from earlier in these notes, but inverted. Before, my
measurement tools were the unreliable ones. Here the **application's own** self-report is the
unreliable one, and it is unreliable in the direction that keeps everyone calm. A side effect that
increments a success counter without performing the effect is worse than one that throws: the throw
gets noticed.

⚪ The operational shape of the damage is quiet, too. The office sets up the rent, watches the
template tick over month after month, and either types the booking by hand anyway — in which case the
feature is pure decoration — or trusts it, and closes the year twelve rents short.

## The 31st of February

The same module carries a second bug, and it is the kind every date library exists to prevent:

```ts
case 'monthly':
  date.setMonth(date.getMonth() + 1)
```

From 2026-01-31 that asks for the 31st of February. JavaScript does not reject it; it rolls forward
to **3 March** (2026 is not a leap year). And because each next date is computed from the *previous*
one, the day never comes back: 31st → 3rd → 3rd → 3rd. A rent booked on the last of the month
migrates permanently after one cycle.

What makes this one instructive is the **tell**. The schema carries a `dayOfMonth` column. Somebody
knew the day needed anchoring — and `calculateNextDate` never receives it; its signature is
`(current, frequency)`. The intent is in the data model and the implementation cannot see it.

⚪ That is a recognisable shape and worth naming: **the schema remembers a requirement the code
forgot.** It is the mirror image of a dead field — the field is not decoration, it is a note from a
previous author that never got wired up. When you find a column nothing reads, the question is not
only "can this go?" but "was something supposed to use this?"

🔵 The 15th of the month works, verified across three cycles. So the bug is invisible to anyone whose
test data avoids month ends — which is most test data, because month ends are where the awkward cases
live and nobody picks awkward numbers by accident.

## A red test is not a filing cabinet

Between those two findings and the previous ones, the domain expert asked a question that landed
harder than any bug report:

> *"I don't see any new issues in dashandwerk. Are there no more bugs?"*

There were twelve. Four had gone straight into implementation plans, which are visible. **Eight
existed only inside `🔴 BEFUND` strings in test files and in commit messages.**

I had convinced myself that was fine, because the failure message is genuinely good: it carries the
mechanism, the file:line, the consequence, and what would make it green. It is arguably a better
record than a ticket. But it has one fatal property — **it lives inside the thing that will delete
it.** The moment someone fixes the bug, the test goes green, the message stops being displayed, and
the finding is gone. What remains is a passing assertion whose reason nobody can reconstruct.

So: the test is the *evidence*. The issue file is the *record*. They are not substitutes, and the
direction of the dependency matters — a good issue points at the test, not the reverse.

⚪ I also got the process backwards in a way worth admitting: I wrote plans for four findings without
writing the findings down first. A plan says what to do; it does not say what was observed or how it
was measured. Whoever implements it gets the instruction without the observation, and at the first
moment of doubt — *is this really wrong?* — the thing they need is exactly what was skipped.

And a smaller lesson, learned twice in one session: I twice wrote "I'll add that to the issue next".
**An announced follow-up is not a follow-up.** The finding goes in before the next test starts, or it
goes in never.
