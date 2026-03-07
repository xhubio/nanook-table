/**
 * Execute the function with the given method name splitted in an array of strings
 * @param params - An array of string defining the method to call.
 * 	faker.name.firstName is ['name','firstName']
 * @param fakerPart - Faker plus the already added param parts
 * @returns The generated value
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function execStringFunction(params: string[], fakerPart: any) {
  if (params.length > 1) {
    const newFakerPart = fakerPart[params.shift()!] // eslint-disable-line @typescript-eslint/no-non-null-assertion
    return execStringFunction(params, newFakerPart)
  }
  return fakerPart[params[0]]()
}
