
export function numberOrNull(value: number | null): string {
    if (value === null) {
         return "absent value";
    }
   return "this is " + value.toFixed();
}
