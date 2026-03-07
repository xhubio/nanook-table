# Tutorial Overview

This tutorial series teaches you how to define test cases using equivalence partitioning and generate test data with Nanook. By the end, you will be able to create decision tables in a spreadsheet, wire them up to a TypeScript project, build custom data generators, write custom output formatters, and filter which test cases get processed.

## What You Will Learn

1. **Create a Decision Table** -- Transfer requirements from a specification into a structured decision table using equivalence partitioning.
2. **Set Up Data Generation** -- Connect the decision table to Nanook and generate test data from it.
3. **Create a Custom Data Generator** -- Build a generator that produces realistic person data (names, emails).
4. **Create a Custom Writer** -- Export generated data in any format you need (CSV, XML, etc.).
5. **Create a Custom Filter** -- Control which test cases are processed based on tags.

## Equivalence Partitioning and Boundary Value Analysis

The core technique behind Nanook is **equivalence partitioning**: dividing the pool of possible input values into groups (equivalence classes) where the system behaves the same way for every value in the group.

Consider a rule: "The user must be 18 years or older."

- All ages below 18 form one equivalence class (rejected).
- All ages 18 and above form another equivalence class (accepted).

You do not need to test every possible age. Testing with age 15 and age 25 is sufficient to cover both classes. **Boundary value analysis** refines this further by testing right at the boundary -- ages 17 and 18 -- where defects are most likely to occur.

By combining these techniques, Nanook helps you:

- **Document your testing strategy** -- The decision table is both a test plan and living documentation. Anyone can see which cases you test and why.
- **Optimize the number of test cases** -- Instead of testing every combination (which can run into the thousands), you reduce them to a manageable set while maintaining coverage.
- **Avoid duplicate tests** -- The table makes overlapping test cases visible so you can eliminate redundancy.
- **Generate data automatically** -- Once the table is connected to generators, running the processor produces all the test data you need.

## Prerequisites

Before starting the tutorials, make sure you have the following installed:

- **Node.js 22 or later** -- Nanook uses modern ESM features that require a recent Node.js version.
- **npm or pnpm** -- For managing dependencies.
- **A spreadsheet editor** -- Any application that can read and write `.xlsx` files (Microsoft Excel, LibreOffice Calc, Google Sheets with export, etc.).
- **A code editor** -- For writing the TypeScript integration code (VS Code, WebStorm, etc.).

## Tutorial Structure

Each tutorial builds on the previous one. The first tutorial (Create a Decision Table) is purely about spreadsheet work and does not involve any code. Starting from the second tutorial (Set Up Data Generation), you will write TypeScript code that loads the spreadsheet, processes it, and generates output.

The tutorials use a running example: creating tests for a user account registration form with fields for userId, password, and password confirmation.
