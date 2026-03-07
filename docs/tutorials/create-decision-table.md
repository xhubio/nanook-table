# Create a Decision Table from Scratch

This tutorial teaches you how to create a decision table using equivalence partitioning. No code is involved -- you will work entirely in a spreadsheet editor. The goal is to transfer the requirements from a specification into a structured table that defines all the test cases you need.

## The Example: User Account Creation

The example use case is testing the user registration page of a web application. The user enters three fields:

- **userId** -- A freely chosen username.
- **password** -- A password that must meet complexity requirements.
- **password2** -- A confirmation field that must match the password.

The following sections describe the specification for each field.

### User ID Specification

- The user can freely choose their own ID.
- The ID must have a minimum length of 2 characters.
- The ID must not exceed a length of 30 characters.
- The ID must not contain spaces.
- Leading and trailing whitespace is trimmed before validation.
- Only ASCII characters (a-z, A-Z), numbers, hyphens, and underscores are allowed.
- The ID must not already exist in the system.
- The user name is case insensitive (e.g., "Alice" and "alice" are the same).

### Password Specification

- The password is required (must not be empty).
- It must have a minimum length of 5 characters.
- It must not exceed a length of 20 characters.
- Leading and trailing spaces are not allowed.
- All other characters are allowed.
- It must not equal, start with, or end with the user ID.
- It must contain at least one number, one uppercase letter, one lowercase letter, and one special character.

### Password Confirmation Specification

The confirmation field has the same requirements as the password, plus one additional rule:

- The value must exactly match the first password field.

## Step 1: Create the Initial Table Structure

Open a new spreadsheet and enter the three field names in the first column. Leave several empty rows between each field name -- you will fill them with equivalence classes in the next step.

| Field Name |
| ---------- |
| userId     |
|            |
|            |
| password   |
|            |
|            |
| password2  |

At this point, the table has no test case columns yet. It simply lists the fields from the specification.

## Step 2: Fill the Equivalence Classes

For each field, read through the specification and extract the equivalence classes. An equivalence class is a group of input values to which the application reacts in the same way. For example, entering 31 characters or 50 characters both trigger the "too long" error -- they belong to the same class.

Add the equivalence classes in the second column under their respective field. Use the third column for descriptions or comments.

### User ID Equivalence Classes

| Equivalence Class                        | Description                                                                 |
| ---------------------------------------- | --------------------------------------------------------------------------- |
| empty                                    | No value entered at all                                                     |
| too short                                | Less than 2 characters (the minimum)                                        |
| too long                                 | More than 30 characters (exceeds maximum)                                   |
| contains space                           | A space character within the ID                                             |
| leading space                            | Whitespace before the ID (will be trimmed)                                  |
| too short after trimming leading spaces  | ID is valid length only because of leading spaces                           |
| trailing space                           | Whitespace after the ID (will be trimmed)                                   |
| too short after trimming trailing spaces | ID is valid length only because of trailing spaces                          |
| not too long with leading spaces         | ID plus leading spaces exceeds 30, but trimmed ID is within limit           |
| not too long with trailing spaces        | ID plus trailing spaces exceeds 30, but trimmed ID is within limit          |
| invalid characters                       | Contains characters outside the allowed set (e.g., `@`, `!`, non-ASCII)     |
| existing userId                          | An ID that is already taken in the system                                   |
| existing userId different case            | Same ID but with different casing (case-insensitive collision)              |
| valid minimum length                     | Exactly 2 characters, all valid                                             |
| valid maximum length                     | Exactly 30 characters, all valid                                            |
| valid                                    | A typical valid user ID                                                     |

That gives us **16 equivalence classes** for the userId field.

### Password Equivalence Classes

| Equivalence Class        | Description                                              |
| ------------------------ | -------------------------------------------------------- |
| empty                    | No password entered                                      |
| too short                | Fewer than 5 characters                                  |
| too long                 | More than 20 characters                                  |
| leading space            | Password starts with a space                             |
| trailing space           | Password ends with a space                               |
| starts with userId       | Password begins with the user ID                         |
| ends with userId         | Password ends with the user ID                           |
| missing uppercase letter | No uppercase letter present                              |
| missing lowercase letter | No lowercase letter present                              |
| missing special character| No special character present                             |
| missing number           | No digit present                                         |
| valid                    | Meets all requirements                                   |

That gives us **12 equivalence classes** for the password field.

### Password2 Equivalence Classes

The confirmation field shares all the same classes as the password, with one addition:

| Equivalence Class             | Description                                              |
| ----------------------------- | -------------------------------------------------------- |
| empty                         | No value entered                                         |
| too short                     | Fewer than 5 characters                                  |
| too long                      | More than 20 characters                                  |
| leading space                 | Starts with a space                                      |
| trailing space                | Ends with a space                                        |
| starts with userId            | Begins with the user ID                                  |
| ends with userId              | Ends with the user ID                                    |
| missing uppercase letter      | No uppercase letter present                              |
| missing lowercase letter      | No lowercase letter present                              |
| missing special character     | No special character present                             |
| missing number                | No digit present                                         |
| valid but different from password | Valid on its own, but does not match the first password |
| valid                         | Matches the first password and meets all requirements    |

That gives us **13 equivalence classes** for password2.

## Step 3: Calculate the Total Combinations

To understand the scope of testing, multiply the number of equivalence classes for each field:

- userId: 16 classes
- password: 12 classes
- password2: 13 classes

**Total: 16 x 12 x 13 = 2,496 possible combinations.**

Testing all 2,496 would be impractical. The power of equivalence partitioning is that we can reduce this number dramatically while maintaining coverage. That is what the next steps accomplish.

Add formulas to your spreadsheet to track these numbers. Create a summary row at the bottom that calculates how many combinations each test case column covers.

## Step 4: Start Filling Decisions

Now add test case columns to the right side of the table. Each column represents one test case. In the header row, give each test case a name (e.g., 1, 2, 3, ... or TC1, TC2, TC3, ...).

For each test case, you make decisions using two markers:

- **`x`** -- Select exactly this equivalence class for this field.
- **`e`** -- Any equivalence class of this field is acceptable (the specific value does not matter for this test case).

### Test Case 1: Empty userId

Choose the "empty" equivalence class for userId by placing an `x` in that row. Since submitting an empty userId should produce an error regardless of what was entered for the password fields, mark all password and password2 rows with `e`.

This single test case covers 1 x 12 x 13 = **156 combinations**.

### Test Cases 2 through 11: Remaining userId Error Cases

Repeat the same pattern for every userId equivalence class that represents an error condition:

| Test Case | userId Class Selected            | password | password2 |
| --------- | -------------------------------- | -------- | --------- |
| 1         | empty                            | e        | e         |
| 2         | too short                        | e        | e         |
| 3         | too long                         | e        | e         |
| 4         | contains space                   | e        | e         |
| 5         | too short after trimming leading | e        | e         |
| 6         | too short after trimming trailing| e        | e         |
| 7         | invalid characters               | e        | e         |
| 8         | existing userId                  | e        | e         |
| 9         | existing userId different case   | e        | e         |
| 10        | leading space (valid, trimmed)   | e        | e         |
| 11        | trailing space (valid, trimmed)  | e        | e         |

After 11 test cases, the summary row shows that **1,716 combinations** are covered out of 2,496.

## Step 5: Add an Expected Results Section

So far, the table defines *what* to test but not *what should happen*. Add a results section below the summary row. This section documents the expected behavior for each test case.

Example result rows:

| Result Row                                          |
| --------------------------------------------------- |
| Valid                                               |
| Error: The userId must not be empty                 |
| Error: The userId must have at least 2 characters   |
| Error: The userId must not exceed 30 characters     |
| Error: The userId must not contain spaces           |
| Error: The userId contains invalid characters       |
| Error: The userId already exists                    |

For each test case column, place an `x` in the row that matches the expected outcome. Test case 1 (empty userId) gets an `x` in the "userId must not be empty" row. Test case 2 gets an `x` in the "at least 2 characters" row, and so on.

The result section is not required for data generation, but it serves as documentation and helps verify that the test design is correct.

## Step 6: Reorder Rows for Clarity

As the table grows, it becomes easier to work with if you group related equivalence classes together. A useful pattern is:

1. Invalid/error cases first
2. Boundary cases in the middle
3. Valid cases last

Reorder the equivalence class rows within each field so that the valid entries are at the bottom. This makes it easier to see which classes still need to be combined in subsequent test cases.

## Step 7: Iterate Over Password Error Cases

With the userId error cases covered, pick a valid userId (e.g., the "leading space" valid class or any other valid class) and now iterate over the password field. For each password error class, create a new test case:

| Test Case | userId    | password Class Selected  | password2 |
| --------- | --------- | ------------------------ | --------- |
| 12        | valid (x) | empty (x)                | e         |
| 13        | valid (x) | too short (x)            | e         |
| 14        | valid (x) | too long (x)             | e         |
| ...       | ...       | ...                      | e         |
| 22        | valid (x) | missing number (x)       | e         |

Again, since a password error makes the password2 value irrelevant, mark all password2 rows with `e`.

## Step 8: Iterate Over Password2 Error Cases

Next, choose a valid userId and a valid password, then iterate over the password2 error classes:

| Test Case | userId    | password  | password2 Class Selected                |
| --------- | --------- | --------- | --------------------------------------- |
| 23        | valid (x) | valid (x) | empty (x)                               |
| 24        | valid (x) | valid (x) | too short (x)                           |
| ...       | ...       | ...       | ...                                     |
| 34        | valid (x) | valid (x) | valid but different from password (x)   |

## Step 9: Add the Fully Valid Test Case

Test case 35 is the "happy path": valid userId, valid password, and valid password2 that matches. Every field has a valid class selected.

## Step 10: Optimize the Remaining Cases

After test case 35, you still have uncovered combinations because there are multiple valid userId classes (leading spaces, trailing spaces, valid minimum, valid maximum, valid typical). You have two choices:

**Option A: Full coverage (131 test cases)**
Copy test cases 12-35 four more times, each time with a different valid userId class. This gives complete coverage of all combinations.

**Option B: Optimized coverage (39 test cases)**
Recognize that the password and password2 error cases do not depend on *which* valid userId was used. Mark all valid userId classes with `e` for test cases 12-34, meaning any valid userId is acceptable. Then add four additional test cases that specifically test each remaining valid userId class with a valid password and password2.

This reduces the total from 2,496 to **39 test cases** -- a reduction of over 98% -- while still ensuring that every equivalence class has been explicitly tested at least once.

## Key Takeaways

- **Equivalence partitioning** groups input values by expected behavior, letting you test one representative from each group instead of every possible value.
- **The `x` and `e` markers** let you express which field value matters for a given test case and which does not.
- **The summary formula** tracks coverage and shows when you have accounted for all combinations.
- **Reordering rows** (errors first, valid last) makes it easier to build the table systematically.
- **Optimization** is the primary benefit: in this example, 39 test cases replace what would otherwise be 2,496 combinations.

In the next tutorial, you will transform this decision table into a data generation table that Nanook can process to automatically create test data.
