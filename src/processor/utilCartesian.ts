/**
 * Überladung: Wird ein einziges Array übergeben, so gibt die Funktion ein Array von Strings zurück.
 * @param arrays - Ein Tupel mit nur einem Array von Strings.
 */
export function cartesianProduct(arrays: [string[]]): string[]

/**
 * Überladung: Werden mehrere Arrays übergeben, so gibt die Funktion ein Array von String-Arrays zurück.
 * @param arrays - Ein Array von Arrays von Strings.
 */
export function cartesianProduct(arrays: string[][]): string[][]

/**
 * Implementierung der Funktion.
 * Falls nur ein Array übergeben wurde, wird dieses direkt zurückgegeben.
 * Andernfalls wird das kartesische Produkt iterativ aufgebaut.
 *
 * @param arrays - Ein Array von Arrays von Strings.
 * @returns Entweder ein Array von Strings (bei nur einem Eingabearray) oder ein Array von String-Arrays.
 */
export function cartesianProduct(arrays: string[][]): string[] | string[][] {
  // Leeres Input -> leeres Ergebnis
  if (arrays.length === 0) {
    return []
  }
  // Wenn nur ein Array vorhanden ist, wird dieses als Ergebnis zurückgegeben.
  if (arrays.length === 1) {
    return arrays[0]
  }
  // Starte mit dem ersten Array, wobei jedes Element in ein Array gepackt wird.
  let result = arrays[0].map((x) => [x])

  // Für jedes weitere Array wird das Produkt erweitert.
  for (let i = 1; i < arrays.length; i++) {
    const current = arrays[i]
    result = result.flatMap((r) => current.map((e) => [...r, e]))
  }
  return result
}
