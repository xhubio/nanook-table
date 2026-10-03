# Data Generator API Reference

The data generator module provides the interface and base implementation for all data generators. Generators are responsible for producing test data values. The processor calls generators based on `GeneratorDirective` entries created from the spreadsheet.

```typescript
import {
  DataGeneratorBase,
  DataGeneratorRegistry,
  GeneratorFaker
} from '@xhubio/nanook-table'
import type {
  DataGeneratorInterface,
  DataGeneratorGenerateRequest
} from '@xhubio/nanook-table'
```

## Generator Lifecycle

The processor manages generators through a well-defined lifecycle:

```
1. loadStore()                    -- called once at startup for each registered generator
2. For each test case:
   a. generate()                  -- produce data for a GeneratorDirective
   b. createPostProcessDirectives()  -- optionally return additional directives
   c. postProcess()               -- called for each post-process directive
3. saveStore()                    -- called once at shutdown for each registered generator
```

Every method that takes data gets one request object, `DataGeneratorGenerateRequest`:

```typescript
interface DataGeneratorGenerateRequest {
  instanceId: string                              // the instance the value belongs to
  testcaseData?: any                              // the test case being built (TestcaseDataInterface)
  generatorDirective?: GeneratorDirectiveInterface // the cell: fieldName, config, instanceIdSuffix, ...
}
```

`generatorDirective.config` is everything after the third colon of the cell: `person.firstName` in `gen::faker:person.firstName`.

---

## DataGeneratorInterface

The interface all data generators implement (a type, not a class). Defines the contract between the processor and any generator. `DataGeneratorBase` implements it; extend that instead of implementing the interface yourself.

### Options (`DataGeneratorOptions`)

```typescript
// as taken by the constructors of DataGeneratorBase and GeneratorFaker
new DataGeneratorBase(options: {
  generatorRegistry: DataGeneratorRegistry
  name: string
  logger?: LoggerInterface
  unique?: boolean
  maxUniqueTries?: number
  varDir?: string
  useStore?: boolean
  storeName?: string
})
```

| Option | Type | Default | Description |
|---|---|---|---|
| `generatorRegistry` | `DataGeneratorRegistry` | required | The registry that holds all available generators. Allows generators to compose with each other |
| `name` | `string` | required | The name under which this generator is registered. Pass the same name to `registerGenerator()` |
| `logger` | `LoggerInterface` | `new LoggerMemory()` | Logger instance for diagnostic output |
| `unique` | `boolean` | `false` | Stored for the generator's own use. `DataGeneratorBase` does not read it: a generator that must return unique values checks `uniqueSet` itself |
| `maxUniqueTries` | `number` | `20` | Stored for the generator's own use; `DataGeneratorBase` does not read it |
| `varDir` | `string` | `'var'` | Directory path for reading/writing persistent store files |
| `useStore` | `boolean` | `false` | Whether the generator should persist data between runs |
| `storeName` | `string` | the `name` option | The name of the data store associated with this generator |

### Properties

| Property | Type | Description |
|---|---|---|
| `logger` | `LoggerInterface` | The logger instance |
| `generatorRegistry` | `DataGeneratorRegistry` | The registry of all available generators |
| `unique` | `boolean` | The `unique` option, for the generator's own use |
| `maxUniqueTries` | `number` | The `maxUniqueTries` option, for the generator's own use |
| `uniqueSet` | `Set<any>` | Values a generator has handed out, for its own uniqueness checks. Persisted with the store |
| `instanceData` | `Map<string, unknown>` | Maps the cache key (instance ID and parameter, see `createCacheKey()`) to previously generated data. Ensures the same instance ID and parameter return the same value |
| `varDir` | `string` | Store directory path |
| `useStore` | `boolean` | Whether the store is active |
| `name` | `string` | The name under which this generator is registered. Set from the `name` option and overwritten by `registerGenerator()` |

### Methods

#### `async loadStore(): Promise<void>`

Loads previously persisted data from the store file. Called once by the processor before any generation begins. In `DataGeneratorBase` it does nothing unless `useStore` is `true`.

#### `async saveStore(): Promise<void>`

Persists the current store data to a file. Called once by the processor after all generation is complete. In `DataGeneratorBase` it does nothing unless `useStore` is `true`.

#### `getGenerator(generatorName: string): DataGeneratorInterface`

Retrieves another generator from the service registry by name. Throws an error if the generator is not found. This enables generators to delegate to or compose with other generators.

```typescript
// Inside a custom generator
const faker = this.getGenerator('faker')
```

#### `clearContext(): void`

Resets `uniqueSet` and `instanceData`. `DataGeneratorBase.loadStore()` calls it before it fills both from the store; the processor does not call it between test cases.

#### `getStoreData(): { uniqueSet: any[]; instanceData: any[] }`

Returns `uniqueSet` and `instanceData` as arrays, the shape `saveStore()` writes. Useful for inspecting the state without saving to disk.

#### `async generate(request: DataGeneratorGenerateRequest): Promise<any>`

Generates a value for the given directive. This is the primary generation method.

| Field of `request` | Type | Description |
|---|---|---|
| `instanceId` | `string` | The instance the value belongs to. The same instance ID and parameter yield the same data |
| `testcaseData` | `any` (a `TestcaseDataInterface`) | The test case data object being built. Contains data already generated by other generators |
| `generatorDirective` | `GeneratorDirectiveInterface` | The directive describing what to generate: `fieldName`, `config`, `instanceIdSuffix`, `generatorName` |

**Returns:** The generated data, or `undefined` if the generator cannot produce data yet (e.g., because it depends on data from another generator that has not run yet). The processor will retry generators that return `undefined`.

#### `createCacheKey(request: DataGeneratorGenerateRequest): string | undefined` (protected)

Returns the key under which `DataGeneratorBase.generate()` caches a value: the instance ID together with `generatorDirective.config`, or the instance ID alone when the request has no parameter. Override it to share one cached value across parameters. `doGenerate()` still gets the original `request.instanceId`.

#### `async createPostProcessDirectives(request: DataGeneratorGenerateRequest): Promise<GeneratorDirectiveInterface[] | undefined>`

Called after `generate()` returned a value. Returns additional directives for post-processing, or `undefined` for none (the default in `DataGeneratorBase`). Each returned directive causes a later call to `postProcess()`.

This is useful when a generator needs to perform additional work after all primary generators have completed.

#### `async postProcess(request: DataGeneratorGenerateRequest): Promise<GeneratorDirectiveInterface[] | undefined>`

Called for each directive returned by `createPostProcessDirectives()`, after all primary generation of the test case is complete, in the order of the directives' `order` (default 1000). `request.instanceId` is the same ID `generate()` got for that directive. Post-processing can modify `request.testcaseData` directly; the return value is not used by the processor.

---

## DataGeneratorBase

Base implementation of `DataGeneratorInterface`. Provides store loading/saving and caching per instance. Most custom generators should extend this class rather than implementing the interface directly.

### Inherited Behavior

- **Caching**: If `generate()` is called again with the same instance ID and parameter, the cached value is returned without calling `doGenerate()` again (see `createCacheKey()`).
- **Errors**: If `doGenerate()` throws or rejects, `generate()` logs the error and returns `undefined`; the field stays empty.
- **No uniqueness logic**: `unique` and `maxUniqueTries` are only stored. A generator that must not repeat values checks and fills `uniqueSet` in `doGenerate()`.
- **Store persistence**: with `useStore: true`, `loadStore()` reads and `saveStore()` writes the JSON file `storeFileName` (`<varDir>/<storeName>.json`).

### Additional Properties

| Property | Type | Description |
|---|---|---|
| `storeName` | `string` | The base name used for the store file. Defaults to the generator name |
| `store` | `DataGeneratorStore` (`{ uniqueSet: any[]; instanceData: any[] }`) | The data object that is persisted |
| `storeFileName` | `string` | The store file, `<varDir>/<storeName>.json` (read-only) |

### Methods

#### `protected async doGenerate(request: DataGeneratorGenerateRequest): Promise<any>`

**Override this method in subclasses.** This is where the actual data generation logic goes. The base class `generate()` handles the caching; `doGenerate()` is only called when new data is needed. Return `undefined` while data the generator depends on is not there yet: the processor calls it again later.

```typescript
import { DataGeneratorBase } from '@xhubio/nanook-table'
import type { DataGeneratorGenerateRequest } from '@xhubio/nanook-table'

class GeneratorTimestamp extends DataGeneratorBase {
  protected override async doGenerate(
    request: DataGeneratorGenerateRequest
  ): Promise<string> {
    return new Date().toISOString()
  }
}
```

### Creating a Custom Generator

```typescript
import {
  DataGeneratorBase,
  DataGeneratorRegistry,
  LoggerMemory
} from '@xhubio/nanook-table'
import type { DataGeneratorGenerateRequest } from '@xhubio/nanook-table'

class GeneratorCounter extends DataGeneratorBase {
  private counter = 0

  protected override async doGenerate(
    request: DataGeneratorGenerateRequest
  ): Promise<number> {
    this.counter += 1
    return this.counter
  }
}

// Register the generator; tables call it as gen::counter:
const logger = new LoggerMemory()
const registry = new DataGeneratorRegistry()
const counter = new GeneratorCounter({
  generatorRegistry: registry,
  name: 'counter',
  logger
})
registry.registerGenerator('counter', counter)
```

---

## DataGeneratorRegistry

A registry that stores generator instances by name. The processor uses the registry to look up generators when executing `GeneratorDirective` entries. Generators can also use it to access other generators for composition.

### Methods

#### `registerGenerator(name: string, generator: DataGeneratorInterface): void`

Registers a generator under the given name, the name the tables use (`gen::<name>:...`). Also sets the `name` property on the generator instance. A generator registered under a name that is already taken replaces the earlier one (since 3.3.0; before, `registerGenerator()` threw).

```typescript
const registry = new DataGeneratorRegistry()
const faker = new GeneratorFaker({ generatorRegistry: registry, name: 'faker', logger })
registry.registerGenerator('faker', faker)
```

#### `getGenerator(name: string): DataGeneratorInterface`

Returns the generator registered under the given name. Throws an error if no generator with that name exists.

```typescript
const faker = registry.getGenerator('faker')
```

#### `async loadStore(): Promise<void>`

Calls `loadStore()` on every registered generator. The processor calls this once at startup.

#### `async saveStore(): Promise<void>`

Calls `saveStore()` on every registered generator. The processor calls this once at shutdown.

---

## GeneratorFaker

A built-in generator that uses `@faker-js/faker` to produce data. The Faker function to call is the `config` of the directive: a dot path, called without arguments.

### Usage in Spreadsheets

In the generator column of your equivalence class table, use (assuming the generator is registered as `faker`):

```
gen::faker:person.firstName
gen::faker:internet.email
gen:1:faker:person.lastName
```

### Configuration

The config is the path of a Faker function, e.g. `person.firstName`, `internet.email`, `location.city`. Nanook splits it on `.` and calls the function **without arguments**: `number.int` works, `number.int({ max: 100 })` cannot be written. For values that need arguments (a length, a range), write a small generator of your own. An empty config or a path Faker does not have throws, and the test case is dropped.

`GeneratorFaker` caches per instance ID and config: `gen::faker:person.firstName` in two fields of one test case gives the same name; a different instance ID (`gen:1:…`, `gen:2:…`) gives a different one.

### Example

```typescript
import {
  GeneratorFaker,
  DataGeneratorRegistry,
  LoggerMemory
} from '@xhubio/nanook-table'

const logger = new LoggerMemory()
const registry = new DataGeneratorRegistry()
const faker = new GeneratorFaker({
  generatorRegistry: registry,
  name: 'faker',
  logger
})
registry.registerGenerator('faker', faker)
```

`createDefaultGeneratorRegistry(logger)` in the processor module returns a registry with `GeneratorFaker` already registered as `faker` (since 3.3.0; up to 3.2.x it was empty). A registry you create with `new DataGeneratorRegistry()` starts empty; register `GeneratorFaker` as shown above.
