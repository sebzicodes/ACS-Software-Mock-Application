function describe(value: number | null): string {
    if (value === null) {
         return "absent value";
    }
   return "this is a " + value.toFixed();
}
describe()